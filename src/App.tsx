import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import IntroScreen from '@/screens/IntroScreen'
import RaceScreen from '@/screens/RaceScreen'
import ClassScreen from '@/screens/ClassScreen'
import AttributeScreen from '@/screens/AttributeScreen'
import GameScreen from '@/screens/GameScreen'
import CombatScreen from '@/screens/CombatScreen'
import LevelUpScreen from '@/screens/LevelUpScreen'
import GameOverScreen from '@/screens/GameOverScreen'

const SCREENS = {
  intro:      IntroScreen,
  race:       RaceScreen,
  class:      ClassScreen,
  attributes: AttributeScreen,
  game:       GameScreen,
  combat:     CombatScreen,
  levelup:    LevelUpScreen,
  gameover:   GameOverScreen,
} as const

export default function App() {
  const screen = useGameStore(s => s.screen)
  const Screen = SCREENS[screen] ?? IntroScreen

  return (
    <div className="h-full w-full overflow-hidden" style={{ background: '#1a1008' }}>
      <div className="h-full max-w-lg mx-auto relative overflow-hidden" style={{ boxShadow: '0 0 60px #00000080' }}>
        <AnimatePresence mode="wait">
          <motion.div key={screen} className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
