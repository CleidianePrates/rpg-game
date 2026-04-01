import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { Choice } from '@/types'
import PhaserGame from '@/game/PhaserGame'
import { gameEvents, EVENTS, emitGameEvent } from '@/game/EventBridge'

// ─── D-pad helpers ────────────────────────────────────────────────────────────
type DDir = 'up' | 'down' | 'left' | 'right'
const DPAD_ICONS: Record<DDir, string> = { up: '▲', down: '▼', left: '◀', right: '▶' }

const DPadBtn = memo(({ dir }: { dir: DDir }) => {
  const set = (v: boolean) => {
    const prev = (window as any).__rpgControls ?? {}
    ;(window as any).__rpgControls = { ...prev, [dir]: v }
  }
  return (
    <button
      className="w-11 h-11 flex items-center justify-center bg-ink-dark/70 border border-gold/30 active:bg-gold/20 text-gold/70 text-sm rounded select-none touch-none"
      onPointerDown={() => set(true)}
      onPointerUp={() => set(false)}
      onPointerLeave={() => set(false)}
      onPointerCancel={() => set(false)}
    >
      {DPAD_ICONS[dir]}
    </button>
  )
})

export default function GameScreen() {
  const character        = useGameStore(s => s.character)
  const screen           = useGameStore(s => s.screen)
  const narrativeHistory = useGameStore(s => s.narrativeHistory)
  const makeAiChoice     = useGameStore(s => s.makeAiChoice)
  const startCombat      = useGameStore(s => s.startCombat)
  const isAiLoading      = useGameStore(s => s.isAiLoading)
  const pendingLevelUp   = useGameStore(s => s.pendingLevelUp)
  const activeQuests     = useGameStore(s => s.activeQuests)
  const setScreen        = useGameStore(s => s.setScreen)
  const [combatPicker, setCombatPicker] = useState<{ enemyKey: string } | null>(null)
  const [showSidebar, setShowSidebar]       = useState(false)
  const [narrativeOpen, setNarrativeOpen]   = useState(false)
  const [zoneName, setZoneName]             = useState('⚔ Aldeia de Eldoria')
  const [interactHint, setInteractHint]     = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  // ─── Typewriter ───────────────────────────────────────────────────────────
  const [animatedEntryId, setAnimatedEntryId] = useState<string | null>(null)
  const [displayText, setDisplayText]         = useState('')
  const [animDone, setAnimDone]               = useState(true)
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isAiLoading) return
    const lastNarration = [...narrativeHistory].reverse().find(e => e.type === 'narration')
    if (!lastNarration || lastNarration.id === animatedEntryId) return

    setAnimatedEntryId(lastNarration.id)
    setAnimDone(false)
    setDisplayText('')
    if (animTimerRef.current) clearInterval(animTimerRef.current)

    const words = lastNarration.text.split(' ')
    let i = 0
    animTimerRef.current = setInterval(() => {
      if (i < words.length) {
        setDisplayText(prev => (prev ? prev + ' ' : '') + words[i++])
      } else {
        clearInterval(animTimerRef.current!)
        setAnimDone(true)
      }
    }, 40)

    return () => { if (animTimerRef.current) clearInterval(animTimerRef.current) }
  }, [narrativeHistory.length, isAiLoading])

  const skipAnimation = useCallback(() => {
    if (animDone) return
    if (animTimerRef.current) clearInterval(animTimerRef.current)
    const lastNarration = [...narrativeHistory].reverse().find(e => e.type === 'narration')
    if (lastNarration) setDisplayText(lastNarration.text)
    setAnimDone(true)
  }, [animDone, narrativeHistory])

  // ─── Abre narrativa inicial ───────────────────────────────────────────────
  useEffect(() => {
    if (narrativeHistory.length > 0) setNarrativeOpen(true)
  }, [narrativeHistory.length])

  // ─── Auto-scroll log ──────────────────────────────────────────────────────
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [narrativeHistory])

  // ─── Level up ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pendingLevelUp) setScreen('levelup')
  }, [pendingLevelUp])

  // ─── Escuta eventos do Phaser ──────────────────────────────────────────────
  useEffect(() => {
    const onNarrative = (e: Event) => {
      const { prompt } = (e as CustomEvent).detail as { prompt: string }
      makeAiChoice(prompt, 'goto:npc_interaction')
      setNarrativeOpen(true)
    }

    const onCombat = (e: Event) => {
      const { enemyKey } = (e as CustomEvent).detail as { enemyKey: string }
      setCombatPicker({ enemyKey })
    }

    const onZone = (e: Event) => setZoneName((e as CustomEvent).detail as string)
    const onShowHint = (e: Event) => setInteractHint((e as CustomEvent).detail as string)
    const onHideHint = () => setInteractHint('')

    gameEvents.addEventListener(EVENTS.TRIGGER_NARRATIVE, onNarrative)
    gameEvents.addEventListener(EVENTS.TRIGGER_COMBAT, onCombat)
    gameEvents.addEventListener(EVENTS.SET_ZONE, onZone)
    gameEvents.addEventListener(EVENTS.SHOW_HINT, onShowHint)
    gameEvents.addEventListener(EVENTS.HIDE_HINT, onHideHint)

    return () => {
      gameEvents.removeEventListener(EVENTS.TRIGGER_NARRATIVE, onNarrative)
      gameEvents.removeEventListener(EVENTS.TRIGGER_COMBAT, onCombat)
      gameEvents.removeEventListener(EVENTS.SET_ZONE, onZone)
      gameEvents.removeEventListener(EVENTS.SHOW_HINT, onShowHint)
      gameEvents.removeEventListener(EVENTS.HIDE_HINT, onHideHint)
    }
  }, [makeAiChoice])

  const closeNarrative = useCallback(() => {
    setNarrativeOpen(false)
    emitGameEvent(EVENTS.NARRATIVE_CLOSED)
  }, [])

  if (!character) return null

  const lastEntry = [...narrativeHistory].reverse().find(e => e.choices && e.choices.length > 0)
  const choices   = (lastEntry?.choices ?? []) as Choice[]

  const hpPct  = Math.max(0, (character.stats.hp / character.stats.maxHp) * 100)
  const mpPct  = Math.max(0, (character.stats.mp / character.stats.maxMp) * 100)
  const expPct = (character.exp / character.expToNext) * 100

  // Phaser ativo somente na tela 'game' (não combat/levelup/gameover)
  const phaserActive = screen === 'game'

  return (
    <div className="h-full w-full flex flex-col bg-ink-dark overflow-hidden">

      {/* ── Área do mundo (Phaser + HUD) ──────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">
      <PhaserGame character={character} active={phaserActive} />

      {/* ── HUD fixo (sempre visível) ──────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        {/* Barra de status */}
        <div className="flex items-start gap-2 p-2">
          <div className="bg-ink-dark/85 backdrop-blur-sm border border-gold/20 rounded px-2 py-1.5 min-w-[160px]">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-cinzel text-gold text-xs">{character.name}</span>
              <span className="font-cinzel text-parchment/50 text-xs">Nv.{character.level}</span>
              <span className="text-xs">🪙{character.gold}</span>
            </div>
            {/* HP */}
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-blood-light font-cinzel text-xs w-5">HP</span>
              <div className="hp-bar flex-1 h-2"><div className="hp-bar-fill h-full" style={{ width: `${hpPct}%` }} /></div>
              <span className="text-parchment/40 font-cinzel text-xs">{character.stats.hp}</span>
            </div>
            {/* MP */}
            <div className="flex items-center gap-1">
              <span className="text-blue-400 font-cinzel text-xs w-5">MP</span>
              <div className="mp-bar flex-1 h-2"><div className="mp-bar-fill h-full" style={{ width: `${mpPct}%` }} /></div>
              <span className="text-parchment/40 font-cinzel text-xs">{character.stats.mp}</span>
            </div>
          </div>
        </div>

        {/* EXP */}
        <div className="px-2">
          <div className="flex items-center gap-1">
            <span className="text-gold/40 font-cinzel text-xs">EXP</span>
            <div className="flex-1 h-0.5 bg-ink/80 rounded-full overflow-hidden">
              <div className="h-full bg-gold/60 transition-all duration-700" style={{ width: `${expPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Nome da zona ──────────────────────────────────────────────────── */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={zoneName}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-ink-dark/75 border border-gold/20 px-3 py-1 rounded font-cinzel text-xs text-gold/80"
          >
            {zoneName}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Botão sidebar + dica de interação ─────────────────────────────── */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 items-end">
        <button
          className="bg-ink-dark/85 border border-gold/30 hover:border-gold/60 text-parchment/60 hover:text-gold font-cinzel text-xs px-2 py-1 transition-colors"
          onClick={() => setShowSidebar(s => !s)}
        >
          {showSidebar ? '✕' : '☰'}
        </button>
        {narrativeHistory.length > 0 && (
          <button
            className="bg-gold/20 hover:bg-gold/30 border border-gold/40 text-gold font-cinzel text-xs px-2 py-1 transition-colors"
            onClick={() => setNarrativeOpen(o => !o)}
          >
            📖
          </button>
        )}
      </div>

      {/* ── Dica de interação com NPC ─────────────────────────────────────── */}
      <AnimatePresence>
        {interactHint && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          >
            <div className="bg-ink-dark/90 border border-gold/40 px-4 py-2 font-cinzel text-xs text-gold rounded">
              {interactHint}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div className="absolute inset-0 z-20 flex"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink-dark/75" onClick={() => setShowSidebar(false)} />
            <motion.div
              className="relative ml-auto w-64 h-full bg-ink border-l border-gold/30 overflow-y-auto p-4 flex flex-col gap-4"
              initial={{ x: 80 }} animate={{ x: 0 }} exit={{ x: 80 }}
            >
              <div>
                <p className="panel-title -mx-4 -mt-4 mb-3 px-4">Personagem</p>
                {([
                  ['Raça',   { elf:'Elfo', human:'Humano', dwarf:'Anão', orc:'Orc' }[character.race]],
                  ['Classe', character.charClass ? { warrior:'Guerreiro', mage:'Mago', archer:'Arqueiro', rogue:'Ladino' }[character.charClass] : '—'],
                  ['FOR', character.attributes.strength],   ['INT', character.attributes.intelligence],
                  ['DES', character.attributes.dexterity],  ['SAB', character.attributes.wisdom],
                  ['CAR', character.attributes.charisma],   ['CON', character.attributes.constitution],
                  ['ATQ', character.stats.attack],          ['DEF', character.stats.defense],
                ] as [string, string | number][]).map(([l, v]) => (
                  <div key={l} className="flex justify-between text-xs py-0.5 border-b border-gold/5">
                    <span className="text-parchment/40 font-cinzel">{l}</span>
                    <span className="text-parchment font-cinzel">{v}</span>
                  </div>
                ))}
              </div>
              {activeQuests.length > 0 && (
                <div>
                  <p className="text-gold/50 font-cinzel text-xs tracking-widest uppercase mb-2">Missões Ativas</p>
                  {activeQuests.map(q => (
                    <div key={q.id} className="mb-2">
                      <p className="font-cinzel text-xs text-parchment/80">{q.title}</p>
                      <p className="text-parchment/40 font-lora italic text-xs">{q.description.slice(0, 60)}…</p>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn-rpg w-full text-xs mt-auto" onClick={() => setScreen('intro')}>Menu Principal</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── D-pad mobile ─────────────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 z-10 select-none">
        <div className="flex flex-col items-center gap-1">
          <DPadBtn dir="up" />
          <div className="flex gap-1">
            <DPadBtn dir="left" />
            <div className="w-11 h-11" />
            <DPadBtn dir="right" />
          </div>
          <DPadBtn dir="down" />
        </div>
      </div>

      <div className="absolute bottom-4 right-20 z-10">
        <button
          className="w-12 h-12 rounded-full bg-ink-dark/70 border border-gold/40 active:bg-gold/20 text-gold font-cinzel text-sm select-none touch-none"
          onPointerDown={() => { (window as any).__rpgInteract = true }}
        >
          E
        </button>
      </div>

      {/* ── Menu de combate ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {combatPicker && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-ink-dark/60" />
            <motion.div
              className="relative bg-ink border-2 border-gold/40 p-5 min-w-[220px] flex flex-col gap-3"
              initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }}
            >
              <p className="font-cinzel text-gold text-center text-sm tracking-widest uppercase">
                ⚔ Combate
              </p>
              <p className="text-parchment/50 font-lora text-xs text-center italic mb-1">
                {combatPicker.enemyKey.replace(/_/g, ' ')}
              </p>

              {/* Ataque básico */}
              <button
                className="btn-rpg-primary text-sm"
                onClick={() => {
                  setCombatPicker(null)
                  makeAiChoice('Ataco diretamente', `combat:${combatPicker.enemyKey}`)
                }}
              >
                ⚔ Atacar
              </button>

              {/* Habilidades do personagem */}
              {character.skills.map(skill => (
                <button
                  key={skill}
                  className="btn-rpg text-sm"
                  onClick={() => {
                    setCombatPicker(null)
                    makeAiChoice(`Uso ${skill}`, `combat:${combatPicker.enemyKey}`)
                  }}
                >
                  ✨ {skill}
                </button>
              ))}

              {/* Recuar */}
              <button
                className="text-parchment/40 hover:text-parchment font-cinzel text-xs mt-1 transition-colors"
                onClick={() => {
                  setCombatPicker(null)
                  emitGameEvent(EVENTS.COMBAT_ENDED, { won: false })
                }}
              >
                💨 Recuar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fecha a área do mundo ──────────────────────────────────────────── */}
      </div>

      {/* ── Painel de Narrativa (abaixo do mapa, sem sobreposição) ──────────── */}
      <AnimatePresence>
        {narrativeOpen && (
          <motion.div
            className="flex-shrink-0 flex flex-col overflow-hidden border-t-2 border-gold/30"
            initial={{ height: 0 }} animate={{ height: '52%' }} exit={{ height: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          >
            <div className="flex-1 bg-ink-dark flex flex-col overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gold/15 flex-shrink-0">
                <span className="font-cinzel text-gold/60 text-xs tracking-widest uppercase">Narrativa</span>
                <button
                  className="text-parchment/40 hover:text-gold font-cinzel text-xs transition-colors"
                  onClick={closeNarrative}
                >
                  Explorar ↓
                </button>
              </div>

              {/* Log de narrativa */}
              <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 cursor-pointer" onClick={skipAnimation}>
                <AnimatePresence initial={false}>
                  {narrativeHistory.slice(-6).map(entry => (
                    <motion.div key={entry.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                      className={`
                        ${entry.type === 'narration' ? 'text-narrative' : ''}
                        ${entry.type === 'action'    ? 'text-gold/70 font-cinzel text-sm italic border-l-2 border-gold/30 pl-3' : ''}
                        ${entry.type === 'system'    ? 'text-parchment/40 font-cinzel text-xs text-center' : ''}
                        ${entry.type === 'combat'    ? 'text-blood-light font-cinzel text-xs text-center' : ''}
                      `}
                    >
                      {entry.type === 'narration' && entry.id === animatedEntryId ? displayText : entry.text}
                      {entry.type === 'narration' && entry.id === animatedEntryId && !animDone && (
                        <span className="animate-pulse text-gold/60">▌</span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isAiLoading && (
                  <motion.div className="flex items-center gap-2 py-1"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {[0, 0.2, 0.4].map(d => (
                      <motion.div key={d} className="w-1.5 h-1.5 bg-gold/60 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d }} />
                    ))}
                    <span className="text-parchment/30 font-cinzel text-xs">narrando…</span>
                  </motion.div>
                )}
              </div>

              {/* Escolhas */}
              {!isAiLoading && animDone && choices.length > 0 && (
                <div className="flex-shrink-0 border-t border-gold/15 px-3 py-3 space-y-2 safe-bottom">
                  <p className="text-gold/30 font-cinzel text-xs tracking-widest uppercase text-center mb-1">Sua decisão</p>
                  {choices.map(choice => {
                    const hasReq = choice.requires
                    const attrVal = hasReq ? (character.attributes as any)[choice.requires!.attribute] : Infinity
                    const canUse  = !hasReq || attrVal >= choice.requires!.value
                    return (
                      <motion.button key={choice.id}
                        className={`w-full text-left px-3 py-2 border font-lora text-sm transition-all duration-200
                          ${canUse ? 'border-stone/50 text-parchment/90 hover:border-gold/60 hover:bg-gold/5' : 'opacity-40 border-stone/20 text-parchment/30 cursor-not-allowed'}`}
                        onClick={() => {
                          if (!canUse || isAiLoading) return
                          makeAiChoice(choice.text, choice.action)
                          if (choice.action.startsWith('combat:')) closeNarrative()
                        }}
                        whileTap={canUse ? { scale: 0.98 } : {}}
                        disabled={!canUse || isAiLoading}
                      >
                        <span className="text-gold/40 mr-2">▶</span>
                        {choice.text}
                        {hasReq && (
                          <span className={`ml-2 text-xs font-cinzel ${canUse ? 'text-gold/40' : 'text-blood/60'}`}>
                            [{choice.requires!.attribute.slice(0,3).toUpperCase()} {choice.requires!.value}+{canUse ? ' ✓' : ` (${attrVal})`}]
                          </span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
