import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene'
import { WorldScene } from './scenes/WorldScene'
import { Character } from '@/types'

interface PhaserGameProps {
  character: Character
  active: boolean   // false = coberto por outra tela (combat, levelup…)
}

// Singleton — o jogo sobrevive a re-renders do React
let _game: Phaser.Game | null = null

export default function PhaserGame({ character, active }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Sincroniza dados do personagem para as cenas Phaser acessarem
    ;(window as any).__rpgCharacter = character

    if (!_game) {
      _game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        backgroundColor: '#1a1008',
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        scene: [PreloadScene, WorldScene],
        render: { pixelArt: true, antialias: false },
      })
    } else {
      // Re-aponta o canvas para este container (re-mount do React)
      const canvas = _game.canvas
      if (canvas && !containerRef.current.contains(canvas)) {
        containerRef.current.appendChild(canvas)
      }
    }

    return () => {
      // Não destroi — mantém o jogo vivo entre transições de tela
    }
  }, [])

  // Pausa/retoma WorldScene quando outra tela sobrepõe
  useEffect(() => {
    if (!_game) return
    const world = _game.scene.getScene('WorldScene')
    if (!world) return
    if (active) {
      if (world.scene.isPaused()) world.scene.resume()
    } else {
      if (world.scene.isActive()) world.scene.pause()
    }
  }, [active])

  // Atualiza dados do personagem em tempo real (HP, nível, flags)
  useEffect(() => {
    ;(window as any).__rpgCharacter = character
  }, [character])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      // pointer-events: none garante que o canvas Phaser nunca intercepte
      // cliques dos elementos React sobrepostos (HUD, botões, painéis)
      style={{ imageRendering: 'pixelated', pointerEvents: 'none' }}
    />
  )
}
