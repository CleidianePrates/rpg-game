import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

export default function GameOverScreen() {
  const character = useGameStore(s => s.character)
  const resetGame = useGameStore(s => s.resetGame)
  const setScreen = useGameStore(s => s.setScreen)

  function handleRestart() {
    resetGame()
    setScreen('intro')
  }

  function handleContinue() {
    if (!character) return
    const maxHp = character.stats.maxHp
    useGameStore.setState(s => ({
      screen: 'game',
      character: s.character ? {
        ...s.character,
        stats: { ...s.character.stats, hp: Math.floor(maxHp * 0.3) }
      } : null
    }))
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-ink-dark px-6">
      <div className="absolute inset-0 bg-blood-dark/20 pointer-events-none" />

      <motion.div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-sm w-full"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>

        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="text-6xl">💀</div>
        </motion.div>

        <div>
          <h2 className="font-cinzel-deco text-3xl text-blood-light mb-2">Você Morreu</h2>
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="h-px w-12 bg-blood/40" />
            <div className="w-2 h-2 bg-blood rotate-45" />
            <div className="h-px w-12 bg-blood/40" />
          </div>
          {character && (
            <p className="text-parchment/50 font-lora italic text-sm leading-relaxed">
              {character.name}, o {character.charClass || 'Aventureiro'} de nível {character.level},
              caiu em batalha nas terras sombrias de Eldoria.
              Que sua alma encontre descanso além do véu.
            </p>
          )}
        </div>

        {character && (
          <div className="panel-rpg p-4 w-full">
            <p className="text-gold/50 font-cinzel text-xs tracking-widest uppercase mb-3 text-center">Estatísticas Finais</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Nível', character.level],
                ['EXP Total', character.exp],
                ['Ouro', character.gold],
                ['Missões', useGameStore.getState().completedQuests.length],
              ].map(([label, val]) => (
                <div key={label as string} className="text-center">
                  <p className="text-parchment/30 font-cinzel">{label}</p>
                  <p className="text-parchment font-cinzel text-base">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          <button className="btn-rpg w-full" onClick={handleContinue}>
            ↩ Continuar (30% HP)
          </button>
          <button className="btn-rpg-danger w-full" onClick={handleRestart}>
            ✦ Novo Jogo
          </button>
        </div>
      </motion.div>
    </div>
  )
}
