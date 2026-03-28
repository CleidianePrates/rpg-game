import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

export default function IntroScreen() {
  const setScreen = useGameStore(s => s.setScreen)
  const resetGame = useGameStore(s => s.resetGame)
  const character = useGameStore(s => s.character)

  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')

  function handleNew() {
    resetGame()
    setShowNew(true)
  }

  function handleContinue() {
    if (character?.charClass) setScreen('game')
    else if (character?.race) setScreen('class')
    else setScreen('race')
  }

  function handleStart() {
    if (name.trim().length < 2) return
    useGameStore.getState().setScreen('race')
    useGameStore.setState(s => ({
      character: { ...s.character!, name: name.trim() } as any
    }))
    setScreen('race')
  }

  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden bg-ink-dark">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#2a1f1440_0%,_#0a0804_70%)]" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div key={i}
            className="absolute w-px bg-gradient-to-b from-transparent via-gold/20 to-transparent"
            style={{ left: `${8 + i * 8}%`, height: `${30 + Math.random() * 40}%`, top: `${Math.random() * 60}%` }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 6 }}
          />
        ))}
      </div>

      <motion.div className="relative z-10 flex flex-col items-center gap-8 px-6 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>

        <div className="text-center">
          <p className="text-gold/60 font-cinzel text-xs tracking-[0.4em] uppercase mb-3">Um Conto de Eldoria</p>
          <h1 className="font-cinzel-deco text-4xl md:text-5xl text-parchment-light leading-tight mb-2">
            Crônicas de<br />Eldoria
          </h1>
          <div className="flex items-center gap-3 justify-center mt-3">
            <div className="h-px w-16 bg-gold/40" />
            <div className="w-2 h-2 bg-gold rotate-45" />
            <div className="h-px w-16 bg-gold/40" />
          </div>
          <p className="text-parchment/50 font-lora italic text-sm mt-4 leading-relaxed">
            "Em terras onde magia e aço decidem o destino,<br />um herói será forjado na chama do conflito."
          </p>
        </div>

        {!showNew ? (
          <div className="flex flex-col gap-3 w-full">
            <button className="btn-rpg-primary w-full text-center" onClick={handleNew}>
              ✦ Nova Aventura
            </button>
            {character && (
              <button className="btn-rpg w-full text-center" onClick={handleContinue}>
                ↩ Continuar Jogo
              </button>
            )}
          </div>
        ) : (
          <motion.div className="w-full flex flex-col gap-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-parchment/70 font-cinzel text-xs tracking-widest uppercase text-center">
              Como você se chama, aventureiro?
            </p>
            <input
              className="w-full bg-ink border border-gold/30 text-parchment font-cinzel text-center py-3 px-4 focus:outline-none focus:border-gold/70 placeholder-parchment/30"
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
            <button className="btn-rpg w-full text-sm" onClick={() => setShowNew(false)}>
              ← Voltar
            </button>
          </motion.div>
        )}

        <p className="text-parchment/20 font-cinzel text-xs tracking-widest">
          CRÔNICAS DE ELDORIA · v1.0
        </p>
      </motion.div>
    </div>
  )
}
