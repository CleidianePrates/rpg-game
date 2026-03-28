import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { CharClass, CLASS_DATA } from '@/types'

const CLASSES: CharClass[] = ['warrior', 'mage', 'archer', 'rogue']

export default function ClassScreen() {
  const chooseClass = useGameStore(s => s.chooseClass)
  const character = useGameStore(s => s.character)
  const setScreen = useGameStore(s => s.setScreen)
  const [selected, setSelected] = useState<CharClass | null>(null)

  return (
    <div className="h-full flex flex-col bg-ink-dark overflow-hidden">
      <div className="flex-shrink-0 text-center px-4 pt-6 pb-4 border-b border-gold/20">
        <p className="text-gold/50 font-cinzel text-xs tracking-[0.3em] uppercase">Criação de Personagem</p>
        <h2 className="font-cinzel text-2xl text-parchment mt-1">Escolha sua Classe</h2>
        <p className="text-parchment/40 font-lora text-xs italic mt-1">
          {character?.name}, o {character && character.race ? ['elf','human','dwarf','orc'].includes(character.race) ? {elf:'Elfo',human:'Humano',dwarf:'Anão',orc:'Orc'}[character.race] : '' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CLASSES.map(cls => {
          const data = CLASS_DATA[cls]
          const isSelected = selected === cls
          return (
            <motion.button key={cls}
              className={`text-left panel-rpg p-4 border transition-all duration-200 ${isSelected ? 'border-gold animate-pulse-gold' : 'border-stone/50 hover:border-gold/40'}`}
              onClick={() => setSelected(cls)}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{data.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-cinzel text-base text-parchment">{data.name}</h3>
                    {isSelected && <span className="text-gold text-xs">✓</span>}
                  </div>
                  <p className="text-parchment/50 font-lora text-xs italic mb-2">{data.playstyle}</p>
                  <p className="text-parchment/70 font-lora text-xs leading-relaxed">{data.description}</p>

                  <div className="mt-3">
                    <p className="text-gold/50 font-cinzel text-xs tracking-widest uppercase mb-1">Habilidades</p>
                    <div className="flex flex-col gap-1">
                      {data.skills.map(skill => (
                        <span key={skill} className="text-xs font-lora text-parchment/60 flex items-center gap-1">
                          <span className="text-gold/40">◆</span> {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(data.bonuses).map(([k, v]) => (
                      <span key={k} className="text-xs font-cinzel px-2 py-0.5 bg-gold/10 border border-gold/20 text-gold">
                        {k.slice(0,3).toUpperCase()} +{v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      <div className="flex-shrink-0 px-4 py-4 border-t border-gold/20 bg-ink-dark/95">
        <div className="flex gap-3">
          <button className="btn-rpg flex-1" onClick={() => setScreen('race')}>← Voltar</button>
          <button className="btn-rpg-primary flex-1" onClick={() => selected && chooseClass(selected)} disabled={!selected}>
            Confirmar Classe →
          </button>
        </div>
      </div>
    </div>
  )
}
