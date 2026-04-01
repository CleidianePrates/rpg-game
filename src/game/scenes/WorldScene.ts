import Phaser from 'phaser'
import { TILE_SIZE, MAP_COLS, MAP_ROWS, PLAYER_SPEED, ENEMY_SPEED, AGGRO_RANGE, T, BLOCKING_TILES } from '../config'
import { gameEvents, EVENTS, emitGameEvent } from '../EventBridge'

// ─── Tipos ──────────────────────────────────────────────────────────────────
interface EnemyObj {
  id: string
  sprite: Phaser.Physics.Arcade.Sprite
  enemyKey: string
  spriteKey: string
  homeX: number
  homeY: number
  state: 'patrol' | 'chase' | 'return'
  patrolTarget: { x: number; y: number }
  defeated: boolean
}

interface NPCObj {
  sprite: Phaser.Physics.Arcade.Sprite
  key: string
  name: string
  prompt: string
}

// ─── Zonas e NPCs ──────────────────────────────────────────────────────────
const NPC_DEFS = [
  { key: 'elder',    spriteKey: 'npc_elder',    tx: 28, ty: 5, name: 'Ancião', prompt: 'Falo com o Ancião da Aldeia. Ele parece carregar um peso imenso nos olhos sábios.' },
  { key: 'merchant', spriteKey: 'npc_merchant', tx: 33, ty: 8, name: 'Mercador', prompt: 'Me aproximo do Mercador itinerante. Seus fardos escondem mercadorias exóticas e misteriosas.' },
]

const ENEMY_DEFS = [
  { id: 'goblin_1',    tx: 14, ty: 21, spriteKey: 'enemy_goblin',   enemyKey: 'goblin_scout'      },
  { id: 'goblin_2',    tx: 46, ty: 23, spriteKey: 'enemy_goblin',   enemyKey: 'goblin_x3'         },
  { id: 'wolf_1',      tx: 11, ty: 27, spriteKey: 'enemy_wolf',     enemyKey: 'forest_wolf'       },
  { id: 'wolf_2',      tx: 49, ty: 28, spriteKey: 'enemy_wolf',     enemyKey: 'forest_wolf'       },
  { id: 'bandit',      tx: 21, ty: 31, spriteKey: 'enemy_bandit',   enemyKey: 'bandit_leader'     },
  { id: 'skeleton_1',  tx: 25, ty: 37, spriteKey: 'enemy_skeleton', enemyKey: 'skeleton_guardian' },
  { id: 'skeleton_2',  tx: 35, ty: 37, spriteKey: 'enemy_skeleton', enemyKey: 'skeleton_guardian' },
  { id: 'dark_knight', tx: 30, ty: 41, spriteKey: 'enemy_knight',   enemyKey: 'dark_knight'       },
  { id: 'lich',        tx: 30, ty: 46, spriteKey: 'enemy_lich',     enemyKey: 'lich_malachar'     },
]

const ZONE_NAMES: Record<string, string> = {
  village: '⚔ Aldeia de Eldoria',
  fields:  '🌿 Campos do Sul',
  forest:  '🌲 Floresta das Sombras',
  dungeon: '💀 Catacumbas de Malachar',
}

const ZONE_PROMPTS: Record<string, string> = {
  fields:  'Você deixa a aldeia para trás e adentra os Campos do Sul pela primeira vez. A grama alta balança no vento morno e a estrada de pedra se perde no horizonte.',
  forest:  'Você cruza a margem do rio e entra na Floresta das Sombras. A luz do sol desaparece entre as copas densas — sons estranhos ecoam entre os troncos retorcidos.',
  dungeon: 'Você desce para as Catacumbas de Malachar. O ar fétido e gelado lhe envolve enquanto as paredes úmidas sussurram segredos sombrios. O poder do Lich pulsa aqui.',
}

const ZONE_TARGETS: Record<string, { tx: number; ty: number }> = {
  village: { tx: 30, ty: 7  },
  fields:  { tx: 30, ty: 15 },
  forest:  { tx: 30, ty: 26 },
  dungeon: { tx: 30, ty: 43 },
}

const GOTO_ZONE_MAP: Record<string, string> = {
  city: 'village', village: 'village', aldeia: 'village', taverna: 'village', town: 'village',
  fields: 'fields', campos: 'fields', campo: 'fields', south: 'fields', sul: 'fields',
  forest: 'forest', floresta: 'forest', woods: 'forest', mata: 'forest', sombras: 'forest',
  dungeon: 'dungeon', catacumbas: 'dungeon', ruins: 'dungeon', ruinas: 'dungeon', malachar: 'dungeon',
}

// ─── WorldScene ──────────────────────────────────────────────────────────────
export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private playerSpriteKey = 'player_warrior'
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }
  private interactKey!: Phaser.Input.Keyboard.Key

  private enemies: EnemyObj[] = []
  private enemyGroup!: Phaser.Physics.Arcade.Group
  private npcs: NPCObj[] = []

  private groundLayer!: Phaser.Tilemaps.TilemapLayer
  private tilemap!: Phaser.Tilemaps.Tilemap

  private combatEnabled = true
  private dialogueEnabled = true
  private lastCombatEnemyId: string | null = null
  private currentZone = ''
  private interactHintShown = false

  private defeatedEnemyIds = new Set<string>()
  private visitedZones     = new Set<string>(['village'])

  constructor() { super({ key: 'WorldScene' }) }

  // ─── Create ────────────────────────────────────────────────────────────────
  create() {
    const charData = (window as any).__rpgCharacter
    const cls = charData?.charClass ?? 'warrior'
    this.playerSpriteKey = `player_${cls}`

    this.createWorld()
    this.createPlayer()
    this.createEnemies()
    this.createNPCs()
    this.setupCamera()
    this.setupInput()
    this.setupCollisions()
    this.setupEventListeners()

    // Restaura inimigos já derrotados
    const flags: Record<string, boolean> = charData?.flags ?? {}
    Object.keys(flags).forEach(k => {
      if (k.startsWith('killed:')) this.defeatedEnemyIds.add(k.replace('killed:', ''))
    })
    this.updateDefeatedEnemies()

    emitGameEvent(EVENTS.SET_ZONE, ZONE_NAMES.village)
  }

  // ─── Tilemap ──────────────────────────────────────────────────────────────
  private createWorld() {
    const mapData = this.buildMapData()
    this.tilemap = this.make.tilemap({ data: mapData, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE })
    const tileset = this.tilemap.addTilesetImage('tiles', 'tiles', TILE_SIZE, TILE_SIZE, 0, 0)!
    this.groundLayer = this.tilemap.createLayer(0, tileset, 0, 0)!
    this.groundLayer.setCollision(BLOCKING_TILES)

    // Limites do mundo físico
    this.physics.world.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE)
  }

  private buildMapData(): number[][] {
    const data: number[][] = []
    for (let r = 0; r < MAP_ROWS; r++) {
      const row: number[] = []
      for (let c = 0; c < MAP_COLS; c++) {
        row.push(this.getTile(c, r))
      }
      data.push(row)
    }
    return data
  }

  private getTile(x: number, y: number): number {
    const W = MAP_COLS, H = MAP_ROWS
    // Borda montanhas
    if (x <= 1 || x >= W - 2 || y <= 1 || y >= H - 2) return T.MOUNTAIN

    // Zona da aldeia (y 2–13, centro)
    if (y >= 2 && y <= 13) return this.villageTile(x, y)

    // Campos sul (y 14–15)
    if (y >= 14 && y <= 15) {
      if (x >= 28 && x <= 31) return T.STONE
      return T.GRASS
    }

    // Rio (y 16–17)
    if (y === 16 || y === 17) {
      if (x >= 27 && x <= 32) return T.BRIDGE
      return T.WATER
    }

    // Floresta (y 18–35)
    if (y >= 18 && y <= 35) return this.forestTile(x, y)

    // Aproximação masmorra (y 36–43)
    if (y >= 36 && y <= 43) return this.dungeonApproachTile(x, y)

    // Chão da masmorra (y 44–47)
    if (y >= 44 && y <= 47) {
      if (x >= 20 && x <= 39) return T.DUNGEON
      return T.MOUNTAIN
    }

    return T.GRASS
  }

  private villageTile(x: number, y: number): number {
    // Estrada principal (NS)
    if (x >= 28 && x <= 31) return T.STONE
    // Estrada EO y=6–7
    if (y >= 6 && y <= 7 && x >= 14 && x <= 45) return T.STONE
    // Praça y=4–10, x=20–39 (borda)
    if ((y === 4 || y === 10) && x >= 20 && x <= 39) return T.STONE
    if ((x === 20 || x === 39) && y >= 4 && y <= 10) return T.STONE
    // Casas (bloqueantes)
    if (y >= 2 && y <= 5  && x >= 16 && x <= 20) return T.WALL
    if (y >= 2 && y <= 5  && x >= 39 && x <= 43) return T.WALL
    if (y >= 8 && y <= 11 && x >= 16 && x <= 20) return T.WALL
    if (y >= 8 && y <= 11 && x >= 39 && x <= 43) return T.WALL
    // Flores perto da praça
    if (y === 5 && (x === 21 || x === 22 || x === 37 || x === 38)) return T.FLOWER
    if (y === 9 && (x === 21 || x === 22 || x === 37 || x === 38)) return T.FLOWER
    // Montanhas no topo da aldeia
    if (y === 2 && (x < 14 || x > 45)) return T.MOUNTAIN
    return T.GRASS
  }

  private forestTile(x: number, y: number): number {
    if (x >= 28 && x <= 31) return T.GRASS   // estrada
    if (x <= 3 || x >= MAP_COLS - 4) return T.TREE
    if (x <= 6 || x >= MAP_COLS - 7) {
      return ((x * 7 + y * 13) % 3 === 0) ? T.GRASS : T.TREE
    }
    const s = ((x * 73856 ^ y * 19349) >>> 0) % 100
    if (s < 28) return T.TREE
    if (s < 33) return T.FLOWER
    if (s < 42) return T.DARK_GRASS
    return T.GRASS
  }

  private dungeonApproachTile(x: number, y: number): number {
    if (x >= 27 && x <= 32) return T.STONE
    if (y >= 40 && x >= 22 && x <= 37) return T.STONE
    const s = ((x * 53 ^ y * 29) >>> 0) % 100
    if (s < 12) return T.TREE
    return T.DARK_GRASS
  }

  // ─── Player ────────────────────────────────────────────────────────────────
  private createPlayer() {
    const px = 30 * TILE_SIZE, py = 14 * TILE_SIZE
    this.player = this.physics.add.sprite(px, py, this.playerSpriteKey, 0)
    this.player.setCollideWorldBounds(true)
    this.player.setSize(18, 20)
    this.player.setOffset(7, 26)
    this.player.setDepth(10)
    this.player.play(`${this.playerSpriteKey}_idle`)
  }

  // ─── Inimigos ─────────────────────────────────────────────────────────────
  private createEnemies() {
    this.enemyGroup = this.physics.add.group()

    ENEMY_DEFS.forEach(def => {
      const px = def.tx * TILE_SIZE + 16
      const py = def.ty * TILE_SIZE + 24
      const sprite = this.physics.add.sprite(px, py, def.spriteKey, 0)
      sprite.setSize(20, 20)
      sprite.setOffset(6, 26)
      sprite.setDepth(9)
      sprite.play(`${def.spriteKey}_idle`)
      this.enemyGroup.add(sprite)

      // Tag de saúde acima
      const hpTag = this.add.text(px, py - 24, '⚔', { fontSize: '14px' }).setOrigin(0.5).setDepth(11)
      ;(sprite as any).__hpTag = hpTag

      this.enemies.push({
        id: def.id,
        sprite,
        enemyKey: def.enemyKey,
        spriteKey: def.spriteKey,
        homeX: px, homeY: py,
        state: 'patrol',
        patrolTarget: { x: px, y: py },
        defeated: false,
      })
    })
  }

  private updateDefeatedEnemies() {
    this.enemies.forEach(e => {
      if (this.defeatedEnemyIds.has(e.id)) {
        e.defeated = true
        e.sprite.setActive(false).setVisible(false)
        ;(e.sprite.body as Phaser.Physics.Arcade.Body).enable = false
        const tag = (e.sprite as any).__hpTag as Phaser.GameObjects.Text
        tag?.setVisible(false)
      }
    })
  }

  // ─── NPCs ─────────────────────────────────────────────────────────────────
  private createNPCs() {
    NPC_DEFS.forEach(def => {
      const px = def.tx * TILE_SIZE + 16
      const py = def.ty * TILE_SIZE + 24
      const sprite = this.physics.add.sprite(px, py, def.spriteKey, 0) as unknown as Phaser.Physics.Arcade.Sprite
      sprite.setSize(24, 32)
      sprite.setOffset(4, 14)
      sprite.setDepth(9)
      sprite.play(`${def.spriteKey}_idle`)

      this.add.text(px, py - 28, def.name, {
        fontSize: '10px', fontFamily: 'Cinzel',
        color: '#c8962a', stroke: '#1a1008', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(12)

      const bubble = this.add.text(px, py - 44, '💬', { fontSize: '16px' }).setOrigin(0.5).setDepth(12)

      this.tweens.add({ targets: bubble, y: py - 50, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

      this.npcs.push({ sprite, key: def.key, name: def.name, prompt: def.prompt })
    })
  }

  // ─── Câmera ────────────────────────────────────────────────────────────────
  private setupCamera() {
    this.cameras.main.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.setZoom(1.5)
  }

  // ─── Input ─────────────────────────────────────────────────────────────────
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)
  }

  // ─── Colisões e Overlaps ───────────────────────────────────────────────────
  private setupCollisions() {
    this.physics.add.collider(this.player, this.groundLayer)

    this.physics.add.overlap(
      this.player,
      this.enemyGroup,
      (_player, enemySprite) => {
        if (!this.combatEnabled) return
        const enemy = this.enemies.find(e => e.sprite === enemySprite && !e.defeated)
        if (enemy) {
          this.combatEnabled = false
          this.lastCombatEnemyId = enemy.id
          this.time.delayedCall(150, () => {
            this.scene.pause()
            emitGameEvent(EVENTS.TRIGGER_COMBAT, { enemyKey: enemy.enemyKey })
          })
        }
      },
      undefined, this
    )
  }

  // ─── Eventos Bridge ────────────────────────────────────────────────────────
  private setupEventListeners() {
    const onCombatEnded = (e: Event) => {
      const { won } = (e as CustomEvent).detail as { won: boolean }
      if (won && this.lastCombatEnemyId) {
        this.defeatedEnemyIds.add(this.lastCombatEnemyId)
        this.updateDefeatedEnemies()
      }
      this.combatEnabled = true
      this.dialogueEnabled = true   // reset caso combate tenha sido iniciado via NPC
      this.lastCombatEnemyId = null
      this.scene.resume()
    }

    const onNarrativeClosed = () => {
      this.scene.resume()
      // Pequeno delay para não re-disparar E imediatamente ao fechar
      this.time.delayedCall(400, () => { this.dialogueEnabled = true })
    }

    const onGotoZone = (e: Event) => {
      const slug = ((e as CustomEvent).detail as string).toLowerCase()
      const zone = GOTO_ZONE_MAP[slug]
      const target = zone ? ZONE_TARGETS[zone] : null
      if (!target) return
      this.player.setPosition(
        target.tx * TILE_SIZE + TILE_SIZE / 2,
        target.ty * TILE_SIZE + TILE_SIZE / 2,
      )
    }

    gameEvents.addEventListener(EVENTS.COMBAT_ENDED, onCombatEnded)
    gameEvents.addEventListener(EVENTS.NARRATIVE_CLOSED, onNarrativeClosed)
    gameEvents.addEventListener(EVENTS.GOTO_ZONE, onGotoZone)

    this.events.once('destroy', () => {
      gameEvents.removeEventListener(EVENTS.COMBAT_ENDED, onCombatEnded)
      gameEvents.removeEventListener(EVENTS.NARRATIVE_CLOSED, onNarrativeClosed)
      gameEvents.removeEventListener(EVENTS.GOTO_ZONE, onGotoZone)
    })
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  update() {
    this.handlePlayerMovement()
    this.handleInteract()
    this.updateEnemyAI()
    this.updateHPTags()
    this.updateZoneDetection()
  }

  private handlePlayerMovement() {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const sp = PLAYER_SPEED

    let vx = 0, vy = 0

    const pad = (window as any).__rpgControls ?? {}

    if (this.cursors.left.isDown  || this.wasd.A.isDown || pad.left)  { vx = -sp; this.player.setFlipX(true) }
    if (this.cursors.right.isDown || this.wasd.D.isDown || pad.right) { vx =  sp; this.player.setFlipX(false) }
    if (this.cursors.up.isDown    || this.wasd.W.isDown || pad.up)    { vy = -sp }
    if (this.cursors.down.isDown  || this.wasd.S.isDown || pad.down)  { vy =  sp }

    // Normaliza diagonal
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707 }

    body.setVelocity(vx, vy)

    const moving = vx !== 0 || vy !== 0
    const animKey = `${this.playerSpriteKey}_${moving ? 'walk' : 'idle'}`
    if (this.player.anims.currentAnim?.key !== animKey) {
      this.player.play(animKey, true)
    }
  }

  private handleInteract() {
    const px = this.player.x, py = this.player.y
    const INTERACT_RANGE = 80

    // ── Hint de proximidade ────────────────────────────────────────────────
    let hintText = ''

    const nearestNpc = this.npcs.reduce<{ npc: NPCObj | null; dist: number }>(
      (acc, npc) => {
        const d = Phaser.Math.Distance.Between(px, py, npc.sprite.x, npc.sprite.y)
        return d < acc.dist ? { npc, dist: d } : acc
      },
      { npc: null, dist: INTERACT_RANGE },
    )

    const nearestEnemy = this.enemies.reduce<{ enemy: EnemyObj | null; dist: number }>(
      (acc, e) => {
        if (e.defeated) return acc
        const d = Phaser.Math.Distance.Between(px, py, e.sprite.x, e.sprite.y)
        return d < acc.dist ? { enemy: e, dist: d } : acc
      },
      { enemy: null, dist: INTERACT_RANGE },
    )

    if (nearestNpc.npc) {
      hintText = `[E] Falar com ${nearestNpc.npc.name}`
    } else if (nearestEnemy.enemy) {
      const name = nearestEnemy.enemy.enemyKey.replace(/_/g, ' ')
      hintText = `[E] Atacar ${name}`
    }

    if (hintText && !this.interactHintShown) {
      this.interactHintShown = true
      emitGameEvent(EVENTS.SHOW_HINT, hintText)
    } else if (!hintText && this.interactHintShown) {
      this.interactHintShown = false
      emitGameEvent(EVENTS.HIDE_HINT)
    } else if (hintText && this.interactHintShown) {
      emitGameEvent(EVENTS.SHOW_HINT, hintText)
    }

    // ── Ação ao pressionar E ───────────────────────────────────────────────
    const padInteract = (window as any).__rpgInteract
    if (padInteract) (window as any).__rpgInteract = false
    if (!Phaser.Input.Keyboard.JustDown(this.interactKey) && !padInteract) return
    if (!this.dialogueEnabled || !this.combatEnabled) return

    if (nearestNpc.npc) {
      this.dialogueEnabled = false
      this.scene.pause()
      emitGameEvent(EVENTS.TRIGGER_NARRATIVE, { prompt: nearestNpc.npc.prompt })
      return
    }

    if (nearestEnemy.enemy) {
      this.combatEnabled = false
      this.dialogueEnabled = false
      this.lastCombatEnemyId = nearestEnemy.enemy.id
      this.interactHintShown = false
      emitGameEvent(EVENTS.HIDE_HINT)
      this.time.delayedCall(150, () => {
        this.scene.pause()
        emitGameEvent(EVENTS.TRIGGER_COMBAT, { enemyKey: nearestEnemy.enemy!.enemyKey })
      })
    }
  }

  private updateEnemyAI() {
    const px = this.player.x, py = this.player.y

    this.enemies.forEach(e => {
      if (e.defeated) return
      const body = e.sprite.body as Phaser.Physics.Arcade.Body
      const dist = Phaser.Math.Distance.Between(px, py, e.sprite.x, e.sprite.y)

      if (dist < AGGRO_RANGE) {
        e.state = 'chase'
      } else if (e.state === 'chase' && dist > AGGRO_RANGE * 1.6) {
        e.state = 'return'
      }

      if (e.state === 'chase') {
        this.physics.moveTo(e.sprite, px, py, ENEMY_SPEED)
        if (e.sprite.anims.currentAnim?.key !== `${e.spriteKey}_walk`) {
          e.sprite.play(`${e.spriteKey}_walk`, true)
        }
        e.sprite.setFlipX(e.sprite.x > px)
      } else if (e.state === 'return') {
        this.physics.moveTo(e.sprite, e.homeX, e.homeY, ENEMY_SPEED * 1.3)
        const distHome = Phaser.Math.Distance.Between(e.sprite.x, e.sprite.y, e.homeX, e.homeY)
        if (distHome < 6) {
          body.reset(e.homeX, e.homeY)
          e.state = 'patrol'
        }
        if (e.sprite.anims.currentAnim?.key !== `${e.spriteKey}_walk`) {
          e.sprite.play(`${e.spriteKey}_walk`, true)
        }
      } else {
        // Patrol: idle + pequena oscilação
        body.setVelocity(0, 0)
        if (e.sprite.anims.currentAnim?.key !== `${e.spriteKey}_idle`) {
          e.sprite.play(`${e.spriteKey}_idle`, true)
        }
      }

      // Atualiza tag de HP acima do inimigo
      const tag = (e.sprite as any).__hpTag as Phaser.GameObjects.Text
      if (tag) {
        tag.setPosition(e.sprite.x, e.sprite.y - 28)
        tag.setColor(dist < AGGRO_RANGE ? '#e74c3c' : '#f1c40f')
      }
    })
  }

  private updateHPTags() {
    const px = this.player.x, py = this.player.y
    let nearNPC = false

    this.npcs.forEach(npc => {
      const d = Phaser.Math.Distance.Between(px, py, npc.sprite.x, npc.sprite.y)
      if (d < 70) nearNPC = true
    })

    if (nearNPC && !this.interactHintShown) {
      this.interactHintShown = true
      emitGameEvent(EVENTS.SHOW_HINT, 'Pressione E para interagir')
    } else if (!nearNPC && this.interactHintShown) {
      this.interactHintShown = false
      emitGameEvent(EVENTS.HIDE_HINT)
    }
  }

  private updateZoneDetection() {
    const ty = Math.floor(this.player.y / TILE_SIZE)
    let zone = ''
    if (ty <= 13) zone = 'village'
    else if (ty <= 17) zone = 'fields'
    else if (ty <= 43) zone = 'forest'
    else zone = 'dungeon'

    if (zone !== this.currentZone) {
      this.currentZone = zone
      emitGameEvent(EVENTS.SET_ZONE, ZONE_NAMES[zone] ?? zone)

      // Narrativa automática na primeira visita à zona
      if (!this.visitedZones.has(zone) && this.dialogueEnabled) {
        this.visitedZones.add(zone)
        const prompt = ZONE_PROMPTS[zone]
        if (prompt) {
          this.dialogueEnabled = false
          this.time.delayedCall(400, () => {
            this.scene.pause()
            emitGameEvent(EVENTS.TRIGGER_NARRATIVE, { prompt })
          })
        }
      }
    }
  }
}
