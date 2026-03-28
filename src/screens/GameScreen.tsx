import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import CharacterPanel from '@/components/game/CharacterPanel'
import QuestPanel from '@/components/game/QuestPanel'
import { Attributes } from '@/types'

export default function GameScreen() {
  const character = useGameStore(s => s.character)
  const narrativeHistory = useGameStore(s => s.narrativeHistory)
  const currentNode = useGameStore(s => s.currentNode)
  const makeChoice = useGameStore(s => s.makeChoice)
  const pendingLevelUp = useGameStore(s => s.pendingLevelUp)
  const setScreen = useGameStore(s => s.setScreen)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [narrativeHistory])

  useEffect(() => {
    if (pendingLevelUp) setScreen('levelup')
  }, [pendingLevelUp])

  if (!character) return null

  const lastEntry = [...narrativeHistory].reverse().find(e => e.choices && e.choices.length > 0)
  const choices = lastEntry?.choices || []
  const hpPct = Math.max(0, (character.stats.hp / character.stats.maxHp) * 100)
  const mpPct = Math.max(0, (character.stats.mp / character.stats.maxMp) * 100)
  const expPct = (character.exp / character.expToNext) * 100

  return (
    <div className="h-full flex flex-col bg-ink-dark overflow-hidden">
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-gold/20 bg-ink">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-cinzel text-xs text-parchment truncate">{character.name}</span>
            <span className="font-cinzel text-xs text-gold/60">Nv.{character.level}</span>
            <span className="font-cinzel text-xs text-parchment/30">{character.gold}🪙</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-1">
              <span className="text-blood-light font-cinzel text-xs w-4">HP</span>
              <div className="hp-bar flex-1"><div className="hp-bar-fill" style={{ width: `${hpPct}%` }} /></div>
              <span className="text-parchment/40 font-cinzel text-xs">{character.stats.hp}/{character.stats.maxHp}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-0.5">
            <div className="flex-1 flex items-center gap-1">
              <span className="text-blue-400 font-cinzel text-xs w-4">MP</span>
              <div className="mp-bar flex-1"><div className="mp-bar-fill" style={{ width: `${mpPct}%` }} /></div>
              <span className="text-parchment/40 font-cinzel text-xs">{character.stats.mp}/{character.stats.maxMp}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button className="panel-rpg px-2 py-1 font-cinzel text-xs text-parchment/60 hover:text-parchment border border-stone/40 hover:border-gold/40 transition-colors"
            onClick={() => setScreen('intro')}>
            Menu
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 px-2 py-1 bg-ink/40 border-b border-gold/10">
        <div className="flex items-center gap-2">
          <span className="text-gold/40 font-cinzel text-xs">EXP</span>
          <div className="flex-1 h-1 bg-ink rounded-full overflow-hidden">
            <div className="h-full bg-gold/60 transition-all duration-700 rounded-full" style={{ width: `${expPct}%` }} />
          </div>
          <span className="text-parchment/30 font-cinzel text-xs">{character.exp}/{character.expToNext}</span>
        </div>
      </div>

      <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {narrativeHistory.map((entry, i) => (
            <motion.div key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`
                ${entry.type === 'narration' ? 'text-narrative' : ''}
                ${entry.type === 'action' ? 'text-gold/70 font-cinzel text-sm italic border-l-2 border-gold/30 pl-3' : ''}
                ${entry.type === 'system' ? 'text-parchment/40 font-cinzel text-xs text-center py-1' : ''}
                ${entry.type === 'combat' ? 'text-blood-light font-cinzel text-xs text-center py-1' : ''}
              `}
            >
              {entry.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {choices.length > 0 && (
        <div className="flex-shrink-0 border-t border-gold/20 bg-ink-dark/95 px-3 py-3 space-y-2 safe-bottom">
          <p className="text-gold/40 font-cinzel text-xs tracking-widest uppercase text-center mb-2">O que você faz?</p>
          {choices.map((choice: any) => {
            const hasReq = choice.requires
            const attrVal = hasReq ? (character.attributes as any)[choice.requires.attribute] : Infinity
            const canUse = !hasReq || attrVal >= choice.requires.value
            return (
              <motion.button key={choice.id}
                className={`w-full text-left px-3 py-2.5 border font-lora text-sm transition-all duration-200 ${canUse ? 'btn-rpg' : 'opacity-40 border-stone/30 text-parchment/30 cursor-not-allowed'}`}
                onClick={() => canUse && lastEntry && makeChoice(choice.id, currentNode)}
                whileTap={canUse ? { scale: 0.98 } : {}}
                disabled={!canUse}
              >
                <span className="text-gold/50 mr-2">▶</span>
                {choice.text}
                {hasReq && (
                  <span className={`ml-2 text-xs font-cinzel ${canUse ? 'text-gold/50' : 'text-blood/60'}`}>
                    [{choice.requires.attribute.slice(0,3).toUpperCase()} {choice.requires.value}+{canUse ? ' ✓' : ` — você tem ${attrVal}`}]
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
