import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import IntroScreen     from '@/screens/IntroScreen'
import RaceScreen      from '@/screens/RaceScreen'
import ClassScreen     from '@/screens/ClassScreen'
import AttributeScreen from '@/screens/AttributeScreen'
import GameScreen      from '@/screens/GameScreen'
import CombatScreen    from '@/screens/CombatScreen'
import LevelUpScreen   from '@/screens/LevelUpScreen'
import GameOverScreen  from '@/screens/GameOverScreen'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.22 } }

export default function App() {
  const screen    = useGameStore(s => s.screen)
  const character = useGameStore(s => s.character)

  // GameScreen (com Phaser) permanece montado durante todo o gameplay
  const isGameplay = !!character && ['game', 'combat', 'levelup', 'gameover'].includes(screen)

  return (
    <div className="h-full w-full overflow-hidden" style={{ background: '#1a1008' }}>
      <div className="h-full w-full relative overflow-hidden">

        {/* Mundo Phaser — sempre montado durante gameplay */}
        {isGameplay && (
          <div className="absolute inset-0">
            <GameScreen />
          </div>
        )}

        {/* Telas sobrepostas com animação */}
        <AnimatePresence mode="wait">

          {/* Criação de personagem — cobre tudo */}
          {screen === 'intro' && (
            <motion.div key="intro" className="absolute inset-0 z-50" {...fade}><IntroScreen /></motion.div>
          )}
          {screen === 'race' && (
            <motion.div key="race" className="absolute inset-0 z-50" {...fade}><RaceScreen /></motion.div>
          )}
          {screen === 'class' && (
            <motion.div key="class" className="absolute inset-0 z-50" {...fade}><ClassScreen /></motion.div>
          )}
          {screen === 'attributes' && (
            <motion.div key="attributes" className="absolute inset-0 z-50" {...fade}><AttributeScreen /></motion.div>
          )}

          {/* Telas de gameplay — sobrepõem o mundo Phaser */}
          {screen === 'combat' && (
            <motion.div key="combat" className="absolute inset-0 z-20" {...fade}><CombatScreen /></motion.div>
          )}
          {screen === 'levelup' && (
            <motion.div key="levelup" className="absolute inset-0 z-20" {...fade}><LevelUpScreen /></motion.div>
          )}
          {screen === 'gameover' && (
            <motion.div key="gameover" className="absolute inset-0 z-20" {...fade}><GameOverScreen /></motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
