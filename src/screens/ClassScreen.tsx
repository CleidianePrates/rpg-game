import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { CharClass, CLASS_DATA } from '@/types'
import { getClassArtUrl } from '@/lib/aiService'

const CLASSES: CharClass[] = ['warrior', 'mage', 'archer', 'rogue']

export default function ClassScreen() {
  const chooseClass = useGameStore(s => s.chooseClass)
  const character   = useGameStore(s => s.character)
  const setScreen   = useGameStore(s => s.setScreen)
  const [selected, setSelected] = useState<CharClass | null>(null)

  const RACE_NAMES: Record<string, string> = { elf: 'Elfo', human: 'Humano', dwarf: 'Anão', orc: 'Orc' }

  return (
    <div className="h-full flex flex-col bg-ink-dark overflow-hidden">
      <div className="flex-shrink-0 text-center px-4 pt-5 pb-3 border-b border-gold/20">
        <p className="text-gold/50 font-cinzel text-xs tracking-[0.3em] uppercase">Criação de Personagem</p>
        <h2 className="font-cinzel text-2xl text-parchment mt-1">Escolha sua Classe</h2>
        <p className="text-parchment/40 font-lora text-xs italic mt-1">
          {character?.name}{character?.race ? `, o ${RACE_NAMES[character.race]}` : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto w-full">
        {CLASSES.map(cls => {
          const data = CLASS_DATA[cls]
          const isSelected = selected === cls
          return (
            <motion.button key={cls}
              className={`relative overflow-hidden text-left border-2 transition-all duration-200 ${isSelected ? 'border-gold' : 'border-stone/40 hover:border-gold/50'}`}
              onClick={() => setSelected(cls)}
              whileTap={{ scale: 0.97 }}
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={getClassArtUrl(cls)} alt={data.name}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    const el = e.currentTarget
                    el.style.display = 'none'
                    const parent = el.parentElement
                    if (parent && !parent.querySelector('.img-fallback')) {
                      const fb = document.createElement('div')
                      fb.className = 'img-fallback w-full h-full flex items-center justify-center bg-ink text-6xl'
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
                <div className="absolute bottom-2 left-2">
                  <span className="text-2xl">{data.emoji}</span>
                </div>
              </div>
              <div className="p-3 bg-ink/90">
                <h3 className="font-cinzel text-sm text-parchment mb-0.5">{data.name}</h3>
                <p className="text-parchment/40 font-lora italic text-xs mb-2">{data.playstyle}</p>
                <div className="space-y-0.5">
                  {data.skills.slice(0, 2).map(sk => (
                    <p key={sk} className="text-parchment/60 font-lora text-xs flex items-center gap-1">
                      <span className="text-gold/40">◆</span> {sk}
                    </p>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(data.bonuses).map(([k, v]) => (
                    <span key={k} className="text-xs font-cinzel px-1.5 py-0.5 bg-gold/10 border border-gold/20 text-gold">
                      {k.slice(0, 3).toUpperCase()} +{v}
                    </span>
                  ))}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      <div className="flex-shrink-0 px-4 py-4 border-t border-gold/20 bg-ink-dark/98">
        <div className="flex gap-3">
          <button className="btn-rpg flex-1" onClick={() => setScreen('race')}>← Voltar</button>
          <button className="btn-rpg-primary flex-1" onClick={() => selected && chooseClass(selected)} disabled={!selected}>
            Confirmar →
          </button>
        </div>
      </div>
    </div>
  )
}
