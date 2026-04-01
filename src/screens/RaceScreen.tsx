import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { Race, RACE_DATA } from '@/types'
import { getRacePortraitUrl } from '@/lib/aiService'

const RACES: Race[] = ['elf', 'human', 'dwarf', 'orc']

function PortraitCard({ race, isSelected, onClick }: { race: Race; isSelected: boolean; onClick: () => void }) {
  const data = RACE_DATA[race]
  const imgUrl = getRacePortraitUrl(race)

  return (
    <motion.button
      className={`relative overflow-hidden text-left border-2 transition-all duration-200 ${isSelected ? 'border-gold' : 'border-stone/40 hover:border-gold/50'}`}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
    >
      <div className="relative h-36 overflow-hidden">
        <img
          src={imgUrl}
          alt={data.name}
          className="w-full h-full object-cover object-top"
          onError={(e) => {
            const el = e.currentTarget
            el.style.display = 'none'
            const parent = el.parentElement
            if (parent && !parent.querySelector('.img-fallback')) {
              const fb = document.createElement('div')
              fb.className = 'img-fallback w-full h-full flex items-center justify-center bg-ink text-5xl'
              fb.textContent = data.emoji
              parent.appendChild(fb)
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-dark via-transparent to-transparent" />
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-gold flex items-center justify-center">
            <span className="text-ink text-xs font-bold">✓</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-ink/90">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-cinzel text-sm text-parchment">{data.name}</h3>
          <span className="text-lg">{data.emoji}</span>
        </div>
        <p className="text-gold/60 font-cinzel text-xs mb-1">📍 {data.origin}</p>
        <p className="text-parchment/60 font-lora text-xs leading-relaxed line-clamp-2">{data.description}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(data.bonuses).map(([k, v]) => (
            <span key={k} className="text-xs font-cinzel px-1.5 py-0.5 bg-gold/10 border border-gold/20 text-gold">
              {k.slice(0, 3).toUpperCase()} {(v as number) > 0 ? '+' : ''}{v}
            </span>
          ))}
        </div>
      </div>
    </motion.button>
  )
}

export default function RaceScreen() {
  const createCharacter = useGameStore(s => s.createCharacter)
  const character       = useGameStore(s => s.character)
  const setScreen       = useGameStore(s => s.setScreen)
  const [selected, setSelected] = useState<Race | null>(null)

  return (
    <div className="h-full flex flex-col bg-ink-dark overflow-hidden">
      <div className="flex-shrink-0 text-center px-4 pt-5 pb-4 border-b border-gold/20">
        <p className="text-gold/50 font-cinzel text-xs tracking-[0.3em] uppercase">Criação de Personagem</p>
        <h2 className="font-cinzel text-2xl text-parchment mt-1">Escolha sua Raça</h2>
        <p className="text-parchment/40 font-lora text-xs italic mt-1">Olá, {character?.name}. Quem você é neste mundo?</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto w-full">
        {RACES.map(race => (
          <PortraitCard key={race} race={race} isSelected={selected === race} onClick={() => setSelected(race)} />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div className="flex-shrink-0 px-4 py-4 border-t border-gold/20 bg-ink-dark/98"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <div className="panel-rpg p-3 mb-3">
              <p className="text-parchment/40 font-cinzel text-xs uppercase tracking-widest mb-1">Missão Exclusiva</p>
              <p className="text-parchment/80 font-lora text-xs italic leading-relaxed">{RACE_DATA[selected].mission}</p>
            </div>
            <p className="text-gold/60 font-lora text-xs italic mb-3">
              ⚡ Habilidade racial: {RACE_DATA[selected].skill}
            </p>
            <div className="flex gap-3">
              <button className="btn-rpg flex-1" onClick={() => setScreen('intro')}>← Voltar</button>
              <button className="btn-rpg-primary flex-1" onClick={() => createCharacter(character!.name, selected)}>
                Confirmar →
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
