import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { CLASS_DATA } from '@/types'

export default function CombatScreen() {
  const character      = useGameStore(s => s.character)
  const combat         = useGameStore(s => s.combat)
  const currentEnemyImage = useGameStore(s => s.currentEnemyImage)
  const isAiLoading    = useGameStore(s => s.isAiLoading)
  const playerAttack   = useGameStore(s => s.playerAttack)
  const playerUseSkill = useGameStore(s => s.playerUseSkill)
  const playerFlee     = useGameStore(s => s.playerFlee)
  const playerUsePotion = useGameStore(s => s.playerUsePotion)

  if (!character || !combat) return null

  const { enemy } = combat
  const hpPct      = Math.max(0, (character.stats.hp / character.stats.maxHp) * 100)
  const mpPct      = Math.max(0, (character.stats.mp / character.stats.maxMp) * 100)
  const enemyHpPct = Math.max(0, (enemy.hp / enemy.maxHp) * 100)
  const potionCount = character.inventory.filter(i => i.type === 'potion').length
  const skills     = character.charClass ? CLASS_DATA[character.charClass].skills : []
  const raceEmoji  = { elf: '🧝', human: '⚔️', dwarf: '🪨', orc: '🗡️' }[character.race]

  return (
    <div className="h-full flex flex-col bg-ink-dark overflow-hidden">
      {/* header */}
      <div className="flex-shrink-0 text-center py-2 bg-blood-dark/40 border-b border-blood/40">
        <p className="font-cinzel text-xs tracking-[0.3em] uppercase text-blood-light animate-flicker">
          ⚔ Combate — Turno {combat.round}
        </p>
      </div>

      {/* combatants */}
      <div className="flex-shrink-0 grid grid-cols-2 gap-0 border-b border-gold/10">
        {/* player */}
        <div className="p-3 border-r border-gold/10 flex flex-col items-center gap-2">
          <div className="text-3xl">{raceEmoji}</div>
          <div className="text-center">
            <p className="font-cinzel text-xs text-parchment truncate max-w-[90px]">{character.name}</p>
            <p className="font-cinzel text-xs text-gold/50">Nv.{character.level}</p>
          </div>
          <div className="w-full space-y-1">
            <div className="hp-bar w-full"><div className="hp-bar-fill" style={{ width: `${hpPct}%` }} /></div>
            <p className="font-cinzel text-xs text-parchment/40 text-center">{character.stats.hp}/{character.stats.maxHp}</p>
            <div className="mp-bar w-full"><div className="mp-bar-fill" style={{ width: `${mpPct}%` }} /></div>
            <p className="font-cinzel text-xs text-blue-400/40 text-center">{character.stats.mp} MP</p>
          </div>
        </div>

        {/* enemy */}
        <div className="relative overflow-hidden flex flex-col items-center gap-2 p-3">
          {currentEnemyImage && (
            <img src={currentEnemyImage} alt={enemy.name}
              className="absolute inset-0 w-full h-full object-cover object-top opacity-30" />
          )}
          <div className="relative z-10 flex flex-col items-center gap-2 w-full">
            <div className="text-3xl">{enemy.icon}</div>
            <div className="text-center">
              <p className="font-cinzel text-xs text-parchment/90 truncate max-w-[100px]">{enemy.name}</p>
              <p className="font-cinzel text-xs text-parchment/30">ATQ {enemy.attack}</p>
            </div>
            <div className="w-full">
              <div className="hp-bar w-full">
                <div className="hp-bar-fill" style={{ width: `${enemyHpPct}%`, background: '#8a1a1a' }} />
              </div>
              <p className="font-cinzel text-xs text-parchment/40 text-center mt-0.5">{Math.max(0, enemy.hp)}/{enemy.maxHp}</p>
            </div>
          </div>
        </div>
      </div>

      {/* combat log */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {combat.log.length === 0 && (
          <p className="text-parchment/30 font-lora italic text-sm text-center py-4">
            {enemy.description}<br/>O combate começa...
          </p>
        )}
        <AnimatePresence initial={false}>
          {combat.log.slice(-8).map((log, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: log.type === 'player' ? -8 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-xs font-lora py-1 px-2 rounded-sm leading-relaxed border-l-2
                ${log.type === 'player' ? 'text-parchment/90 border-gold/50 bg-gold/5' : ''}
                ${log.type === 'enemy'  ? 'text-blood-light/90 border-blood/50 bg-blood/5' : ''}
                ${log.type === 'system' ? 'text-gold/70 border-transparent text-center italic' : ''}
              `}
            >
              {log.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {isAiLoading && (
          <div className="flex items-center gap-1 px-2">
            {[0, 0.15, 0.3].map(d => (
              <motion.div key={d} className="w-1 h-1 rounded-full bg-gold/50"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: d }} />
            ))}
          </div>
        )}
      </div>

      {/* action buttons */}
      <div className="flex-shrink-0 border-t border-gold/20 bg-ink-dark/98 px-3 py-3 safe-bottom">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button className="btn-rpg-primary py-3 text-sm" onClick={playerAttack} disabled={isAiLoading}>
            ⚔️ Atacar
          </button>
          <button
            className={`btn-rpg py-3 text-sm ${character.stats.mp < 15 ? 'opacity-40' : ''}`}
            onClick={() => skills[0] && playerUseSkill(skills[0])}
            disabled={character.stats.mp < 15 || isAiLoading}
          >
            ✨ {skills[0]?.split(' ').slice(0, 2).join(' ') || 'Habilidade'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`btn-rpg py-2.5 text-sm ${potionCount === 0 ? 'opacity-40' : ''}`}
            onClick={playerUsePotion}
            disabled={potionCount === 0}
          >
            🧪 Poção ({potionCount})
          </button>
          <button className="btn-rpg-danger py-2.5 text-sm" onClick={playerFlee} disabled={isAiLoading}>
            🏃 Fugir
          </button>
        </div>
      </div>
    </div>
  )
}
