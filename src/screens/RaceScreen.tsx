import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { Race, RACE_DATA } from '@/types'

const RACES: Race[] = ['elf', 'human', 'dwarf', 'orc']

export default function RaceScreen() {
  const createCharacter = useGameStore(s => s.createCharacter)
  const character = useGameStore(s => s.character)
  const setScreen = useGameStore(s => s.setScreen)
  const [selected, setSelected] = useState<Race | null>(null)

  const name = character?.name || 'Aventureiro'

  function handleConfirm() {
    if (!selected) return
    createCharacter(name, selected)
  }

  return (
    <div className="h-full flex flex-col bg-ink-dark overflow-hidden">
      <div className="flex-shrink-0 text-center px-4 pt-6 pb-4 border-b border-gold/20">
        <p className="text-gold/50 font-cinzel text-xs tracking-[0.3em] uppercase">Criação de Personagem</p>
        <h2 className="font-cinzel text-2xl text-parchment mt-1">Escolha sua Raça</h2>
        <p className="text-parchment/40 font-lora text-xs italic mt-1">Olá, {name}. Quem você é neste mundo?</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {RACES.map(race => {
          const data = RACE_DATA[race]
          const isSelected = selected === race
          return (
            <motion.button key={race}
              className={`text-left panel-rpg p-4 transition-all duration-200 border ${isSelected ? 'border-gold animate-pulse-gold' : 'border-stone/50 hover:border-gold/40'}`}
              onClick={() => setSelected(race)}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{data.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-cinzel text-base text-parchment">{data.name}</h3>
                    {isSelected && <span className="text-gold text-xs">✓</span>}
                  </div>
                  <p className="text-gold/60 font-cinzel text-xs mb-2">📍 {data.origin}</p>
                  <p className="text-parchment/60 font-lora text-xs leading-relaxed line-clamp-2">{data.description}</p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {Object.entries(data.bonuses).map(([k, v]) => (
                      <span key={k} className="text-xs font-cinzel px-2 py-0.5 bg-gold/10 border border-gold/20 text-gold">
                        {k.slice(0,3).toUpperCase()} {v! > 0 ? '+' : ''}{v}
                      </span>
                    ))}
                  </div>

                  <p className="text-parchment/40 font-lora italic text-xs mt-2">
                    ⚡ {data.skill.split('—')[0].trim()}
                  </p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div className="flex-shrink-0 px-4 py-4 border-t border-gold/20 bg-ink-dark/95"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <div className="mb-3 panel-rpg p-3">
              <p className="text-parchment/50 font-cinzel text-xs tracking-widest uppercase mb-1">Missão Principal</p>
              <p className="text-parchment/80 font-lora text-xs italic">{RACE_DATA[selected].mission}</p>
            </div>
            <div className="flex gap-3">
              <button className="btn-rpg flex-1" onClick={() => setScreen('intro')}>← Voltar</button>
              <button className="btn-rpg-primary flex-1" onClick={handleConfirm}>
                Confirmar {RACE_DATA[selected].name} →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selected && (
        <div className="flex-shrink-0 px-4 py-4 border-t border-gold/20">
          <button className="btn-rpg w-full" onClick={() => setScreen('intro')}>← Voltar</button>
        </div>
      )}
    </div>
  )
}
