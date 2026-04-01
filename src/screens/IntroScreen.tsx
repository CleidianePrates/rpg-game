import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { getSceneImageUrl } from '@/lib/aiService'

const BG = getSceneImageUrl('epic dark fantasy medieval castle on cliff at sunset dramatic sky', 10)

export default function IntroScreen() {
  const setScreen   = useGameStore(s => s.setScreen)
  const resetGame   = useGameStore(s => s.resetGame)
  const character   = useGameStore(s => s.character)
  const [showName, setShowName] = useState(false)
  const [name, setName]         = useState('')

  function handleNew() { resetGame(); setShowName(true) }

  function handleContinue() {
    if (character?.charClass) setScreen('game')
    else if (character?.race) setScreen('class')
    else setScreen('race')
  }

  function handleStart() {
    if (name.trim().length < 2) return
    useGameStore.setState(s => ({ character: { ...s.character!, name: name.trim() } as any }))
    setScreen('race')
  }

  return (
    <div className="relative h-full flex flex-col items-center justify-end overflow-hidden">
      {/* background art */}
      <img src={BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-dark via-ink-dark/60 to-transparent" />

      <motion.div className="relative z-10 flex flex-col items-center gap-6 px-6 pb-12 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>

        <div className="text-center">
          <p className="text-gold/60 font-cinzel text-xs tracking-[0.4em] uppercase mb-3">Um Conto de Eldoria</p>
          <h1 className="font-cinzel-deco text-4xl md:text-5xl text-parchment-light leading-tight drop-shadow-lg">
            Crônicas de<br />Eldoria
          </h1>
          <div className="flex items-center gap-3 justify-center mt-3">
            <div className="h-px w-16 bg-gold/50" />
            <div className="w-2 h-2 bg-gold rotate-45" />
            <div className="h-px w-16 bg-gold/50" />
          </div>
          <p className="text-parchment/50 font-lora italic text-sm mt-4 leading-relaxed">
            "Onde magia e aço decidem o destino,<br />um herói será forjado na chama do conflito."
          </p>
        </div>

        {!showName ? (
          <div className="flex flex-col gap-3 w-full">
            <button className="btn-rpg-primary w-full" onClick={handleNew}>✦ Nova Aventura</button>
            {character && (
              <button className="btn-rpg w-full" onClick={handleContinue}>↩ Continuar — {character.name}</button>
            )}
          </div>
        ) : (
          <motion.div className="w-full flex flex-col gap-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-parchment/70 font-cinzel text-xs tracking-widest uppercase text-center">
              Como você se chama, aventureiro?
            </p>
            <input
              className="w-full bg-ink/80 border border-gold/40 text-parchment font-cinzel text-center py-3 px-4 focus:outline-none focus:border-gold placeholder-parchment/30 backdrop-blur-sm"
              placeholder="Seu nome..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              maxLength={20}
              autoFocus
            />
            <button className="btn-rpg-primary w-full" onClick={handleStart} disabled={name.trim().length < 2}>
              Começar Jornada →
            </button>
            <button className="btn-rpg w-full text-sm" onClick={() => setShowName(false)}>← Voltar</button>
          </motion.div>
        )}
        <p className="text-parchment/20 font-cinzel text-xs tracking-widest">CRÔNICAS DE ELDORIA · v2.0</p>
      </motion.div>
    </div>
  )
}
