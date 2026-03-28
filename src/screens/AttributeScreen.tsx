import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { Attributes, calcStats } from '@/types'

const ATTR_INFO: { key: keyof Attributes; label: string; desc: string }[] = [
  { key: 'strength',     label: 'Força',        desc: 'Dano físico e carregar peso' },
  { key: 'intelligence', label: 'Inteligência',  desc: 'Poder mágico e mana' },
  { key: 'dexterity',    label: 'Destreza',      desc: 'Velocidade e chance de crítico' },
  { key: 'wisdom',       label: 'Sabedoria',     desc: 'Resistências e percepção' },
  { key: 'charisma',     label: 'Carisma',       desc: 'Diálogos e mercado' },
  { key: 'constitution', label: 'Constituição',  desc: 'PV máximo e resistência' },
]

const ATTR_IMPACT: Record<keyof Attributes, string> = {
  strength:     'Ataque +3 por ponto',
  intelligence: 'Mana +8 por ponto',
  dexterity:    'Velocidade +2 por ponto',
  wisdom:       'Resistências +2 por ponto',
  charisma:     'Preços -2% por ponto',
  constitution: 'PV máximo +12 por ponto',
}

export default function AttributeScreen() {
  const character = useGameStore(s => s.character)
  const applyAttributes = useGameStore(s => s.applyAttributes)
  const setScreen = useGameStore(s => s.setScreen)

  const [attrs, setAttrs] = useState<Attributes>({ ...character!.attributes })
  const [points, setPoints] = useState(5)
  const [selected, setSelected] = useState<keyof Attributes>('strength')

  const baseAttrs = character!.attributes
  const stats = calcStats(attrs, 1)

  function increment(key: keyof Attributes) {
    if (points <= 0) return
    setAttrs(a => ({ ...a, [key]: a[key] + 1 }))
    setPoints(p => p - 1)
  }

  function decrement(key: keyof Attributes) {
    if (attrs[key] <= baseAttrs[key]) return
    setAttrs(a => ({ ...a, [key]: a[key] - 1 }))
    setPoints(p => p + 1)
  }

  return (
    <div className="h-full flex flex-col bg-ink-dark overflow-hidden">
      <div className="flex-shrink-0 text-center px-4 pt-5 pb-3 border-b border-gold/20">
        <p className="text-gold/50 font-cinzel text-xs tracking-[0.3em] uppercase">Criação de Personagem</p>
        <h2 className="font-cinzel text-xl text-parchment mt-1">Distribuir Atributos</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-parchment/50 font-cinzel text-xs">Pontos disponíveis:</span>
          <span className={`font-cinzel text-lg font-bold ${points > 0 ? 'text-gold' : 'text-parchment/40'}`}>{points}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="border-r border-gold/10">
            {ATTR_INFO.map(({ key, label, desc }) => {
              const base = baseAttrs[key]
              const cur  = attrs[key]
              const added = cur - base
              return (
                <div key={key}
                  className={`stat-row cursor-pointer ${selected === key ? 'bg-gold/10' : ''}`}
                  onClick={() => setSelected(key)}
                >
                  <span className="flex-1 font-cinzel text-xs text-parchment/80">{label}</span>
                  <div className="flex items-center gap-2">
                    <button className="w-6 h-6 flex items-center justify-center border border-stone/50 text-parchment/60 hover:border-gold/60 hover:text-gold transition-colors text-sm"
                      onClick={e => { e.stopPropagation(); decrement(key) }}>−</button>
                    <span className={`w-6 text-center font-cinzel text-sm ${added > 0 ? 'text-gold' : 'text-parchment'}`}>{cur}</span>
                    <button className={`w-6 h-6 flex items-center justify-center border text-sm transition-colors ${points > 0 ? 'border-gold/50 text-gold hover:border-gold hover:bg-gold/10' : 'border-stone/30 text-parchment/20 cursor-not-allowed'}`}
                      onClick={e => { e.stopPropagation(); increment(key) }}>+</button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-3">
            {selected && (
              <motion.div key={selected} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="font-cinzel text-sm text-gold mb-1">{ATTR_INFO.find(a => a.key === selected)?.label}</p>
                <p className="text-parchment/60 font-lora text-xs italic mb-3">{ATTR_INFO.find(a => a.key === selected)?.desc}</p>
                <p className="text-parchment/50 font-cinzel text-xs">{ATTR_IMPACT[selected]}</p>
              </motion.div>
            )}

            <div className="mt-4 pt-3 border-t border-gold/10">
              <p className="text-gold/50 font-cinzel text-xs tracking-widest uppercase mb-2">Preview de Stats</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  ['PV Máx', stats.maxHp],
                  ['Mana', stats.maxMp],
                  ['Ataque', stats.attack],
                  ['Defesa', stats.defense],
                  ['Velocidade', stats.speed],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between text-xs">
                    <span className="text-parchment/40 font-cinzel">{label}</span>
                    <span className="text-parchment font-cinzel">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 py-4 border-t border-gold/20 bg-ink-dark/95">
        <div className="flex gap-3">
          <button className="btn-rpg flex-1" onClick={() => setScreen('class')}>← Voltar</button>
          <button className="btn-rpg-primary flex-1" onClick={() => applyAttributes(attrs)}>
            Iniciar Aventura →
          </button>
        </div>
      </div>
    </div>
  )
}
