import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { CLASS_DATA } from '@/types'

export default function CombatScreen() {
  const character = useGameStore(s => s.character)
  const combat = useGameStore(s => s.combat)
  const playerAttack = useGameStore(s => s.playerAttack)
  const playerUseSkill = useGameStore(s => s.playerUseSkill)
  const playerFlee = useGameStore(s => s.playerFlee)
  const playerUsePotion = useGameStore(s => s.playerUsePotion)

  if (!character || !combat) return null

  const { enemy } = combat
  const hpPct = (character.stats.hp / character.stats.maxHp) * 100
  const mpPct = (character.stats.mp / character.stats.maxMp) * 100
  const enemyHpPct = (enemy.hp / enemy.maxHp) * 100
  const potionCount = character.inventory.filter(i => i.type === 'potion').length
  const skills = character.charClass ? CLASS_DATA[character.charClass].skills : []

  return (
    <div className="h-full flex flex-col bg-ink-dark overflow-hidden">
      <div className="flex-shrink-0 text-center py-2 bg-blood-dark/30 border-b border-blood/30">
        <p className="font-cinzel text-xs tracking-[0.3em] uppercase text-blood-light animate-flicker">
          ⚔️ Combate — Turno {combat.round}
        </p>
      </div>

      <div className="flex-shrink-0 grid grid-cols-2 gap-3 px-4 py-4 border-b border-gold/10">
        <div className="panel-rpg p-3 text-center">
          <div className="text-2xl mb-1">{character.race === 'elf' ? '🧝' : character.race === 'human' ? '⚔️' : character.race === 'dwarf' ? '🪨' : '🗡️'}</div>
          <p className="font-cinzel text-xs text-parchment truncate">{character.name}</p>
          <p className="font-cinzel text-xs text-gold/50 mb-2">Nv.{character.level}</p>
          <div className="space-y-1">
            <div className="hp-bar"><div className="hp-bar-fill" style={{ width: `${Math.max(0,hpPct)}%` }} /></div>
            <p className="font-cinzel text-xs text-parchment/50">{character.stats.hp}/{character.stats.maxHp} PV</p>
            <div className="mp-bar"><div className="mp-bar-fill" style={{ width: `${Math.max(0,mpPct)}%` }} /></div>
            <p className="font-cinzel text-xs text-blue-400/50">{character.stats.mp}/{character.stats.maxMp} MP</p>
          </div>
        </div>

        <div className="panel-rpg p-3 text-center border-blood/30">
          <div className="text-2xl mb-1">{enemy.icon}</div>
          <p className="font-cinzel text-xs text-parchment/90 truncate">{enemy.name}</p>
          <p className="font-cinzel text-xs text-parchment/30 mb-2">ATQ {enemy.attack} | DEF {enemy.defense}</p>
          <div className="space-y-1">
            <div className="hp-bar"><div className="hp-bar-fill bg-blood" style={{ width: `${Math.max(0, enemyHpPct)}%` }} /></div>
            <p className="font-cinzel text-xs text-parchment/50">{Math.max(0,enemy.hp)}/{enemy.maxHp} PV</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 min-h-0">
        {combat.log.slice(-8).map((log, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: log.type === 'player' ? -10 : log.type === 'enemy' ? 10 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            className={`combat-log-entry
              ${log.type === 'player' ? 'text-parchment/90 border-l-gold/60' : ''}
              ${log.type === 'enemy'  ? 'text-blood-light/90 border-l-blood/60 pl-3' : ''}
              ${log.type === 'system' ? 'text-gold/70 text-center' : ''}
            `}
            style={{ borderLeftColor: log.type === 'player' ? '#c8962a80' : log.type === 'enemy' ? '#8a1a1a80' : 'transparent' }}
          >
            {log.text}
          </motion.div>
        ))}
        {combat.log.length === 0 && (
          <p className="text-parchment/30 font-lora italic text-sm text-center py-4">
            O confronto começa. Prepare-se...
          </p>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-gold/20 bg-ink-dark/95 px-3 py-3 safe-bottom">
        <p className="text-parchment/30 font-cinzel text-xs text-center mb-2 tracking-widest uppercase">Sua ação</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button className="btn-rpg-primary py-2 text-sm" onClick={playerAttack}>
            ⚔️ Atacar
          </button>
          <button className={`btn-rpg py-2 text-sm ${character.stats.mp < 15 ? 'opacity-40' : ''}`}
            onClick={() => skills[0] && playerUseSkill(skills[0])}>
            ✨ {skills[0] || 'Habilidade'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className={`btn-rpg py-2 text-sm ${potionCount === 0 ? 'opacity-40' : ''}`}
            onClick={playerUsePotion} disabled={potionCount === 0}>
            🧪 Poção ({potionCount})
          </button>
          <button className="btn-rpg-danger py-2 text-sm" onClick={playerFlee}>
            🏃 Fugir
          </button>
        </div>
      </div>
    </div>
  )
}
