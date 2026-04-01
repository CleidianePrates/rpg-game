import Phaser from 'phaser'
import { T } from '../config'

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }) }

  create() {
    this.createTilesheet()
    this.createCharSprite('player_warrior', 0x4a90e2, 0x2c3e50)
    this.createCharSprite('player_mage',    0x9b59b6, 0x1a1a2e)
    this.createCharSprite('player_archer',  0x27ae60, 0x5c3a1e)
    this.createCharSprite('player_rogue',   0x2c3e50, 0x1a1a2e)

    this.createEnemySprite('enemy_goblin',   0x2ecc40, 'goblin')
    this.createEnemySprite('enemy_wolf',     0x8e9ea0, 'wolf')
    this.createEnemySprite('enemy_bandit',   0xe74c3c, 'human')
    this.createEnemySprite('enemy_skeleton', 0xecf0f1, 'skeleton')
    this.createEnemySprite('enemy_knight',   0x1a1a2e, 'knight')
    this.createEnemySprite('enemy_lich',     0x6c3483, 'lich')

    this.createNPCSprite('npc_elder',    0xc8962a)
    this.createNPCSprite('npc_merchant', 0x8e6b3a)

    this.setupAnimations()
    this.scene.start('WorldScene')
  }

  // ─── Tilesheet ───────────────────────────────────────────────────────────
  private createTilesheet() {
    const W = 32
    const TILES = 11
    const ct = this.textures.createCanvas('tiles', W * TILES, W) as Phaser.Textures.CanvasTexture
    const c = ct.getContext()

    const draw = (idx: number, fn: (x: number) => void) => {
      const x = idx * W
      fn(x)
    }

    // 0 — Grass
    draw(T.GRASS, x => {
      c.fillStyle = '#3d6b4a'; c.fillRect(x, 0, W, W)
      c.fillStyle = '#4a7c54'
      for (let i = 0; i < 4; i++) c.fillRect(x + 4 + i * 7, 6 + (i % 2) * 5, 2, 10)
    })

    // 1 — Tree (top-down)
    draw(T.TREE, x => {
      c.fillStyle = '#1a3d24'; c.fillRect(x, 0, W, W)
      c.fillStyle = '#235c32'
      c.beginPath(); c.arc(x + 16, 16, 12, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#2e7540'
      c.beginPath(); c.arc(x + 15, 14, 8, 0, Math.PI * 2); c.fill()
      c.fillStyle = 'rgba(0,0,0,0.25)'
      c.beginPath(); c.ellipse(x + 19, 20, 8, 5, 0.4, 0, Math.PI * 2); c.fill()
    })

    // 2 — Water
    draw(T.WATER, x => {
      c.fillStyle = '#1a5a8c'; c.fillRect(x, 0, W, W)
      c.fillStyle = '#2070a8'
      c.fillRect(x, 4, W, 3); c.fillRect(x, 14, W, 3); c.fillRect(x, 24, W, 3)
      c.fillStyle = '#3a90c8'
      c.fillRect(x + 4, 8, 20, 2); c.fillRect(x + 6, 18, 16, 2)
    })

    // 3 — Stone path
    draw(T.STONE, x => {
      c.fillStyle = '#7a7060'; c.fillRect(x, 0, W, W)
      c.fillStyle = '#8a8070'
      c.fillRect(x, 0, 15, 15); c.fillRect(x + 17, 17, 15, 15)
      c.fillStyle = '#6a6050'
      c.fillRect(x + 1, 1, 13, 13); c.fillRect(x + 18, 18, 13, 13)
      c.fillStyle = '#555044'
      c.fillRect(x + 16, 0, 1, W); c.fillRect(x, 16, W, 1)
    })

    // 4 — Sand
    draw(T.SAND, x => {
      c.fillStyle = '#c4a840'; c.fillRect(x, 0, W, W)
      c.fillStyle = '#d4b850'
      for (let i = 0; i < 6; i++) c.fillRect(x + i * 5 + 1, (i % 3) * 5 + 3, 3, 3)
    })

    // 5 — Wall/House
    draw(T.WALL, x => {
      c.fillStyle = '#5a3828'; c.fillRect(x, 0, W, W)
      c.fillStyle = '#6a4838'; c.fillRect(x, 0, W, 10); c.fillRect(x, 22, W, 10)
      c.fillStyle = '#4a2818'
      c.fillRect(x, 10, 15, 12); c.fillRect(x + 17, 10, 15, 12)
      c.fillStyle = '#3a1808'; c.fillRect(x + 16, 0, 1, W)
    })

    // 6 — Dungeon floor
    draw(T.DUNGEON, x => {
      c.fillStyle = '#1e1828'; c.fillRect(x, 0, W, W)
      c.fillStyle = '#2a2038'
      c.fillRect(x + 1, 1, 14, 14); c.fillRect(x + 17, 17, 14, 14)
      c.fillStyle = '#3a3048'
      c.fillRect(x + 17, 1, 14, 14); c.fillRect(x + 1, 17, 14, 14)
      c.fillStyle = 'rgba(150,80,200,0.12)'; c.fillRect(x, 0, W, W)
    })

    // 7 — Mountain (top-down rocky)
    draw(T.MOUNTAIN, x => {
      c.fillStyle = '#4a4848'; c.fillRect(x, 0, W, W)
      c.fillStyle = '#5a5858'
      c.fillRect(x + 4, 4, 10, 10); c.fillRect(x + 18, 2, 8, 12); c.fillRect(x + 8, 18, 14, 10)
      c.fillStyle = '#3a3838'
      c.fillRect(x + 9, 8, 6, 6); c.fillRect(x + 20, 14, 7, 7)
      c.fillStyle = '#6a6868'
      c.fillRect(x + 5, 5, 3, 3); c.fillRect(x + 19, 3, 3, 3)
    })

    // 8 — Bridge
    draw(T.BRIDGE, x => {
      c.fillStyle = '#7a6248'; c.fillRect(x, 10, W, 12)
      c.fillStyle = '#9a8268'
      for (let i = 0; i < 4; i++) c.fillRect(x + i * 8 + 1, 10, 2, 12)
      c.fillStyle = '#5a4228'
      c.fillRect(x, 10, W, 2); c.fillRect(x, 20, W, 2)
    })

    // 9 — Flower
    draw(T.FLOWER, x => {
      c.fillStyle = '#3d6b4a'; c.fillRect(x, 0, W, W)
      c.fillStyle = '#4a7c54'
      c.fillRect(x + 3, 8, 2, 10); c.fillRect(x + 14, 5, 2, 14); c.fillRect(x + 24, 9, 2, 8)
      c.fillStyle = '#e74c3c'; c.fillRect(x + 5, 6, 5, 5)
      c.fillStyle = '#f1c40f'; c.fillRect(x + 16, 12, 5, 5)
      c.fillStyle = '#9b59b6'; c.fillRect(x + 26, 7, 4, 4)
    })

    // 10 — Dark grass
    draw(T.DARK_GRASS, x => {
      c.fillStyle = '#253c2a'; c.fillRect(x, 0, W, W)
      c.fillStyle = '#2f4d34'
      c.fillRect(x + 2, 8, 2, 14); c.fillRect(x + 9, 5, 2, 18); c.fillRect(x + 18, 9, 2, 13)
      c.fillRect(x + 26, 6, 2, 16); c.fillRect(x + 13, 14, 2, 10)
    })

    ct.refresh()
  }

  // ─── Personagem (3 frames: idle, step-L, step-R) ─────────────────────────
  private createCharSprite(key: string, bodyColor: number, hairColor: number) {
    const FW = 32, FH = 48, FRAMES = 3
    const ct = this.textures.createCanvas(key, FW * FRAMES, FH) as Phaser.Textures.CanvasTexture
    const c = ct.getContext()

    const bc = this.hexRgb(bodyColor)
    const hc = this.hexRgb(hairColor)
    const darkBody = this.darken(bodyColor, 50)
    const db = this.hexRgb(darkBody)

    for (let f = 0; f < FRAMES; f++) {
      const x = f * FW
      const legL = f === 1 ? 6 : f === 2 ? -2 : 2
      const legR = f === 1 ? -2 : f === 2 ? 6 : 2

      // Sombra
      c.fillStyle = 'rgba(0,0,0,0.28)'
      c.beginPath(); c.ellipse(x + 16, 46, 9, 3, 0, 0, Math.PI * 2); c.fill()

      // Pernas
      c.fillStyle = '#2c3045'
      c.fillRect(x + 8, 30, 7, legL + 12)
      c.fillRect(x + 17, 30, 7, legR + 12)
      // Botas
      c.fillStyle = '#4a2818'
      c.fillRect(x + 7, 38 + legL, 9, 5)
      c.fillRect(x + 16, 38 + legR, 9, 5)

      // Corpo (armadura/roupa)
      c.fillStyle = `rgb(${bc})`
      c.fillRect(x + 7, 15, 18, 16)
      // Detalhe lateral
      c.fillStyle = `rgb(${db})`
      c.fillRect(x + 7, 15, 9, 16)

      // Braços
      c.fillStyle = `rgb(${bc})`
      c.fillRect(x + 1, 16, 7, 12 + (f === 1 ? -3 : f === 2 ? 3 : 0))
      c.fillRect(x + 24, 16, 7, 12 + (f === 1 ? 3 : f === 2 ? -3 : 0))

      // Pescoço
      c.fillStyle = '#f0b898'; c.fillRect(x + 13, 11, 6, 5)

      // Cabeça
      c.fillStyle = '#f5c2a0'
      c.beginPath(); c.arc(x + 16, 8, 9, 0, Math.PI * 2); c.fill()

      // Cabelo
      c.fillStyle = `rgb(${hc})`
      c.beginPath(); c.arc(x + 16, 6, 9, Math.PI, 0); c.fill()
      c.fillRect(x + 8, 5, 16, 5)

      // Olhos
      c.fillStyle = '#1a1428'
      c.fillRect(x + 11, 7, 3, 3); c.fillRect(x + 18, 7, 3, 3)
      c.fillStyle = '#fff'
      c.fillRect(x + 12, 7, 1, 1); c.fillRect(x + 19, 7, 1, 1)
    }
    ct.refresh()
    const tex = this.textures.get(key)
    tex.add(0, 0, 0, 0, FW, FH)
    tex.add(1, 0, FW, 0, FW, FH)
    tex.add(2, 0, FW * 2, 0, FW, FH)
  }

  // ─── Inimigo ─────────────────────────────────────────────────────────────
  private createEnemySprite(key: string, color: number, type: string) {
    const FW = 32, FH = 48, FRAMES = 3
    const ct = this.textures.createCanvas(key, FW * FRAMES, FH) as Phaser.Textures.CanvasTexture
    const c = ct.getContext()
    const rc = this.hexRgb(color)

    for (let f = 0; f < FRAMES; f++) {
      const x = f * FW
      const bob = f === 0 ? 0 : f === 1 ? -2 : 1

      // Sombra
      c.fillStyle = 'rgba(0,0,0,0.3)'
      c.beginPath(); c.ellipse(x + 16, 46, 10, 3.5, 0, 0, Math.PI * 2); c.fill()

      if (type === 'goblin') {
        c.fillStyle = `rgb(${rc})`
        c.beginPath(); c.arc(x + 16, 12 + bob, 9, 0, Math.PI * 2); c.fill()
        c.fillRect(x + 10, 19 + bob, 12, 13)
        // Orelhas pontudas
        c.beginPath(); c.moveTo(x + 8, 8 + bob); c.lineTo(x + 4, 2 + bob); c.lineTo(x + 12, 8 + bob); c.fill()
        c.beginPath(); c.moveTo(x + 24, 8 + bob); c.lineTo(x + 28, 2 + bob); c.lineTo(x + 20, 8 + bob); c.fill()
        c.fillRect(x + 5, 21 + bob, 6, 9)
        c.fillRect(x + 21, 21 + bob, 6, 9)
        // Pernas
        c.fillStyle = '#2c3045'
        c.fillRect(x + 10, 31 + bob, 5, f === 1 ? 14 : 11)
        c.fillRect(x + 17, 31 + bob, 5, f === 2 ? 14 : 11)
        // Olhos vermelhos
        c.fillStyle = '#e74c3c'
        c.fillRect(x + 12, 11 + bob, 3, 3); c.fillRect(x + 17, 11 + bob, 3, 3)
        c.fillStyle = '#c0392b'
        c.fillRect(x + 10, 15 + bob, 12, 2)
        // Arma (faca enferrujada)
        c.fillStyle = '#7f8c8d'; c.fillRect(x + 23, 18 + bob, 3, 14)
        c.fillStyle = '#5c3a1e'; c.fillRect(x + 21, 19 + bob, 7, 3)

      } else if (type === 'wolf') {
        c.fillStyle = `rgb(${rc})`
        c.fillRect(x + 3, 18 + bob, 24, 12)
        c.fillRect(x + 20, 10 + bob, 12, 12)
        c.beginPath(); c.moveTo(x + 20, 10 + bob); c.lineTo(x + 22, 3 + bob); c.lineTo(x + 26, 10 + bob); c.fill()
        c.beginPath(); c.moveTo(x + 27, 11 + bob); c.lineTo(x + 31, 5 + bob); c.lineTo(x + 32, 12 + bob); c.fill()
        c.fillRect(x + 5, 29 + bob, 5, f === 1 ? 16 : 13)
        c.fillRect(x + 12, 29 + bob, 5, f === 2 ? 16 : 13)
        c.fillRect(x + 19, 29 + bob, 5, f === 1 ? 16 : 13)
        c.fillRect(x + 25, 29 + bob, 5, f === 2 ? 16 : 13)
        c.fillStyle = '#7a7a7a'; c.fillRect(x + 3, 14 + bob, 5, 8)
        c.fillStyle = '#f1c40f'
        c.fillRect(x + 24, 14 + bob, 3, 3); c.fillRect(x + 29, 14 + bob, 3, 3)
        c.fillStyle = '#e74c3c'; c.fillRect(x + 22, 18 + bob, 7, 2)

      } else if (type === 'skeleton') {
        c.fillStyle = `rgb(${rc})`
        c.beginPath(); c.arc(x + 16, 9 + bob, 9, 0, Math.PI * 2); c.fill()
        c.fillRect(x + 11, 17 + bob, 10, 14)
        for (let r = 0; r < 3; r++) {
          c.fillStyle = '#2c2c3c'; c.fillRect(x + 12, 19 + r * 4 + bob, 8, 2)
        }
        c.fillStyle = `rgb(${rc})`
        c.fillRect(x + 2, 17 + bob, 9, 12); c.fillRect(x + 21, 17 + bob, 9, 12)
        c.fillRect(x + 10, 30 + bob, 5, f === 1 ? 16 : 13)
        c.fillRect(x + 17, 30 + bob, 5, f === 2 ? 16 : 13)
        c.fillStyle = '#1a1428'
        c.fillRect(x + 11, 7 + bob, 4, 4); c.fillRect(x + 17, 7 + bob, 4, 4)
        c.fillStyle = '#3498db'
        c.fillRect(x + 12, 8 + bob, 2, 2); c.fillRect(x + 18, 8 + bob, 2, 2)

      } else if (type === 'knight') {
        c.fillStyle = `rgb(${rc})`
        c.fillRect(x + 6, 12 + bob, 20, 20)
        c.fillRect(x + 8, 1 + bob, 16, 13)
        c.fillStyle = '#e74c3c'; c.fillRect(x + 9, 7 + bob, 14, 5)
        c.fillStyle = `rgb(${rc})`
        c.fillRect(x + 0, 12 + bob, 7, 9); c.fillRect(x + 25, 12 + bob, 7, 9)
        c.fillRect(x + 1, 20 + bob, 6, 10); c.fillRect(x + 25, 20 + bob, 6, 10)
        c.fillRect(x + 8, 31 + bob, 7, f === 1 ? 16 : 13)
        c.fillRect(x + 17, 31 + bob, 7, f === 2 ? 16 : 13)
        c.fillStyle = '#7f8c8d'
        c.fillRect(x + 26, 10 + bob, 4, 24)
        c.fillRect(x + 22, 14 + bob, 10, 4)
        c.fillStyle = '#e74c3c'; c.fillRect(x + 10, 18 + bob, 12, 3)

      } else if (type === 'lich') {
        c.fillStyle = `rgb(${rc})`
        c.beginPath()
        c.moveTo(x + 6, 18 + bob); c.lineTo(x + 26, 18 + bob)
        c.lineTo(x + 30, 48); c.lineTo(x + 2, 48)
        c.fill()
        c.fillStyle = '#f0e0c0'
        c.beginPath(); c.arc(x + 16, 10 + bob, 10, 0, Math.PI * 2); c.fill()
        c.fillStyle = '#d4a010'
        c.fillRect(x + 8, 0 + bob, 16, 10)
        c.fillRect(x + 8, 0 + bob, 3, 14); c.fillRect(x + 14, 0 + bob, 4, 16); c.fillRect(x + 21, 0 + bob, 3, 14)
        c.fillStyle = '#6c3483'
        c.beginPath(); c.arc(x + 12, 10 + bob, 3, 0, Math.PI * 2); c.fill()
        c.beginPath(); c.arc(x + 20, 10 + bob, 3, 0, Math.PI * 2); c.fill()
        c.fillStyle = '#e74c3c'
        c.beginPath(); c.arc(x + 12, 10 + bob, 1.5, 0, Math.PI * 2); c.fill()
        c.beginPath(); c.arc(x + 20, 10 + bob, 1.5, 0, Math.PI * 2); c.fill()
        c.fillStyle = '#5c3a1e'; c.fillRect(x + 28, 6 + bob, 4, 34)
        c.fillStyle = '#8e44ad'
        c.beginPath(); c.arc(x + 30, 4 + bob, 5, 0, Math.PI * 2); c.fill()

      } else { // human/bandit
        c.fillStyle = '#555'
        c.beginPath(); c.arc(x + 16, 8 + bob, 10, 0, Math.PI * 2); c.fill()
        c.fillStyle = '#f5c2a0'
        c.beginPath(); c.arc(x + 16, 11 + bob, 7, 0, Math.PI * 2); c.fill()
        c.fillStyle = '#c0392b'; c.fillRect(x + 17, 9 + bob, 2, 8)
        c.fillStyle = `rgb(${rc})`
        c.fillRect(x + 8, 18 + bob, 16, 15)
        c.fillRect(x + 2, 18 + bob, 7, 12); c.fillRect(x + 23, 18 + bob, 7, 12)
        c.fillRect(x + 8, 32 + bob, 7, f === 1 ? 15 : 12)
        c.fillRect(x + 17, 32 + bob, 7, f === 2 ? 15 : 12)
        c.fillStyle = '#7f8c8d'
        c.fillRect(x + 26, 11 + bob, 4, 22)
        c.fillRect(x + 22, 11 + bob, 8, 8)
      }
    }
    ct.refresh()
    const tex = this.textures.get(key)
    tex.add(0, 0, 0, 0, FW, FH)
    tex.add(1, 0, FW, 0, FW, FH)
    tex.add(2, 0, FW * 2, 0, FW, FH)
  }

  // ─── NPC ─────────────────────────────────────────────────────────────────
  private createNPCSprite(key: string, color: number) {
    const FW = 32, FH = 48, FRAMES = 3
    const ct = this.textures.createCanvas(key, FW * FRAMES, FH) as Phaser.Textures.CanvasTexture
    const c = ct.getContext()
    const rc = this.hexRgb(color)

    for (let f = 0; f < FRAMES; f++) {
      const x = f * FW
      const sw = f === 1 ? 3 : f === 2 ? -3 : 0

      c.fillStyle = 'rgba(0,0,0,0.25)'
      c.beginPath(); c.ellipse(x + 16, 45, 8, 3, 0, 0, Math.PI * 2); c.fill()

      c.fillStyle = `rgb(${rc})`
      c.beginPath()
      c.moveTo(x + 8, 18); c.lineTo(x + 24, 18)
      c.lineTo(x + 28, 47); c.lineTo(x + 4, 47)
      c.fill()

      c.fillStyle = '#f5c2a0'
      c.beginPath(); c.arc(x + 16, 11, 9, 0, Math.PI * 2); c.fill()

      if (key.includes('elder')) {
        c.fillStyle = '#ddd'
        c.fillRect(x + 10, 14, 12, 8)
        c.fillStyle = '#aaa'; c.fillRect(x + 9, 1, 14, 12)
      } else {
        c.fillStyle = '#5c3a1e'
        c.fillRect(x + 8, 2, 16, 10)
        c.fillRect(x + 6, 9, 20, 4)
      }

      c.fillStyle = '#1a1428'
      c.fillRect(x + 12, 9, 3, 3); c.fillRect(x + 17, 9, 3, 3)

      c.fillStyle = `rgb(${rc})`
      c.fillRect(x + 1, 18, 7, 13 + sw)
      c.fillRect(x + 24, 18, 7, 13 - sw)
    }
    ct.refresh()
    const tex = this.textures.get(key)
    tex.add(0, 0, 0, 0, FW, FH)
    tex.add(1, 0, FW, 0, FW, FH)
    tex.add(2, 0, FW * 2, 0, FW, FH)
  }

  // ─── Animações ────────────────────────────────────────────────────────────
  private setupAnimations() {
    const charKeys = ['player_warrior', 'player_mage', 'player_archer', 'player_rogue']
    charKeys.forEach(k => {
      this.anims.create({ key: `${k}_walk`, frames: [{ key: k, frame: 0 }, { key: k, frame: 1 }, { key: k, frame: 0 }, { key: k, frame: 2 }], frameRate: 8, repeat: -1 })
      this.anims.create({ key: `${k}_idle`, frames: [{ key: k, frame: 0 }], frameRate: 1, repeat: -1 })
    })

    const enemyKeys = ['enemy_goblin', 'enemy_wolf', 'enemy_bandit', 'enemy_skeleton', 'enemy_knight', 'enemy_lich']
    enemyKeys.forEach(k => {
      this.anims.create({ key: `${k}_walk`, frames: [{ key: k, frame: 0 }, { key: k, frame: 1 }, { key: k, frame: 0 }, { key: k, frame: 2 }], frameRate: 7, repeat: -1 })
      this.anims.create({ key: `${k}_idle`, frames: [{ key: k, frame: 0 }], frameRate: 1, repeat: -1 })
    })

    const npcKeys = ['npc_elder', 'npc_merchant']
    npcKeys.forEach(k => {
      this.anims.create({ key: `${k}_idle`, frames: [{ key: k, frame: 0 }, { key: k, frame: 1 }, { key: k, frame: 0 }, { key: k, frame: 2 }], frameRate: 2, repeat: -1 })
    })
  }

  // ─── Utils ────────────────────────────────────────────────────────────────
  private hexRgb(hex: number): string {
    return `${(hex >> 16) & 0xff},${(hex >> 8) & 0xff},${hex & 0xff}`
  }

  private darken(hex: number, amt: number): number {
    const r = Math.max(0, ((hex >> 16) & 0xff) - amt)
    const g = Math.max(0, ((hex >> 8) & 0xff) - amt)
    const b = Math.max(0, (hex & 0xff) - amt)
    return (r << 16) | (g << 8) | b
  }
}
