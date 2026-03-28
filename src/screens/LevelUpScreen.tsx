import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { Attributes, calcStats } from '@/types'

const ATTR_LABELS: Record<keyof Attributes, string> = {
  strength: 'Força', intelligence: 'Inteligência', dexterity: 'Destreza',
  wisdom: 'Sabedoria', charisma: 'Carisma', constitution: 'Constituição'
}

export default function LevelUpScreen() {
  const character = useGameStore(s => s.character)
  const pendingAttributePoints = useGameStore(s => s.pendingAttributePoints)
  const confirmLevelUp = useGameStore(s => s.confirmLevelUp)

  const [added, setAdded] = useState<Partial<Record<keyof Attributes, number>>>({})
  const [pts, setPts] = useState(pendingAttributePoints)

  if (!character) return null

  const newAttrs: Attributes = { ...character.attributes }
  Object.entries(added).forEach(([k, v]) => { (newAttrs as any)[k] += v })
  const newStats = calcStats(newAttrs, character.level + 1)
  const oldStats = calcStats(character.attributes, character.level)

  function inc(key: keyof Attributes) {
    if (pts <= 0) return
    setAdded(a => ({ ...a, [key]: (a[key] || 0) + 1 }))
    setPts(p => p - 1)
  }

  function dec(key: keyof Attributes) {
    if ((added[key] || 0) <= 0) return
    setAdded(a => ({ ...a, [key]: (a[key] || 0) - 1 }))
    setPts(p => p + 1)
  }

  return (
    <motion.div className="h-full flex flex-col bg-ink-dark overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex-shrink-0 text-center px-4 pt-5 pb-4 border-b border-gold">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
          <div className="text-4xl mb-2">⭐</div>
        </motion.div>
        <p className="font-cinzel-deco text-xl text-gold animate-pulse-gold">Nível Acima!</p>
        <p className="text-parchment/60 font-lora text-sm mt-1">
          {character.name} chegou ao Nível <span className="text-gold font-cinzel">{character.level + 1}</span>
        </p>
        <p className="text-parchment/40 font-cinzel text-xs mt-1 tracking-widest">{pts} pontos para distribuir</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="border-r border-gold/10">
            <p className="panel-title">Atributos</p>
            {(Object.keys(ATTR_LABELS) as (keyof Attributes)[]).map(key => {
              const base = character.attributes[key]
              const bonus = added[key] || 0
              const total = base + bonus
              return (
                <div key={key} className="stat-row">
                  <span className="flex-1 font-cinzel text-xs text-parchment/80">{ATTR_LABELS[key]}</span>
                  <div className="flex items-center gap-2">
                    <button className="w-6 h-6 flex items-center justify-center border border-stone/50 text-parchment/60 hover:border-gold/60 hover:text-gold transition-colors"
                      onClick={() => dec(key)}>−</button>
                    <span className={`w-8 text-center font-cinzel text-sm ${bonus > 0 ? 'text-gold' : 'text-parchment'}`}>
                      {total}{bonus > 0 && <span className="text-gold/60 text-xs"> +{bonus}</span>}
                    </span>
                    <button className={`w-6 h-6 flex items-center justify-center border text-sm transition-colors ${pts > 0 ? 'border-gold/50 text-gold hover:border-gold hover:bg-gold/10' : 'border-stone/30 text-parchment/20 cursor-not-allowed'}`}
                      onClick={() => inc(key)}>+</button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-3">
            <p className="panel-title -mx-4 mb-3">Novos Stats</p>
            {[
              ['PV Máx', oldStats.maxHp, newStats.maxHp],
              ['Mana', oldStats.maxMp, newStats.maxMp],
              ['Ataque', oldStats.attack, newStats.attack],
              ['Defesa', oldStats.defense, newStats.defense],
              ['Velocidade', oldStats.speed, newStats.speed],
            ].map(([label, old, nw]) => (
              <div key={label as string} className="flex justify-between items-center py-1 border-b border-gold/10">
                <span className="font-cinzel text-xs text-parchment/60">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-cinzel text-xs text-parchment/40">{old}</span>
                  <span className="text-parchment/30 text-xs">⇒</span>
                  <span className={`font-cinzel text-sm ${(nw as number) > (old as number) ? 'text-gold' : 'text-parchment'}`}>{nw}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 py-4 border-t border-gold bg-ink-dark/95 safe-bottom">
        {pts > 0 && (
          <p className="text-gold/60 font-cinzel text-xs text-center mb-2">
            Ainda há {pts} ponto{pts !== 1 ? 's' : ''} para distribuir
          </p>
        )}
        <button className="btn-rpg-primary w-full" onClick={() => confirmLevelUp(newAttrs)}>
          ✦ Confirmar Level Up
        </button>
      </div>
    </motion.div>
  )
}
