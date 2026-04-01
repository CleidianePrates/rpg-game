import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  GameState, Character, Race, CharClass, Attributes, Screen,
  RACE_DATA, CLASS_DATA, calcStats, calcExpToNext,
  Enemy, Quest, NarrativeEntry, Choice,
} from '@/types'
import {
  generateNarrative, generateCombatNarration,
  getSceneImageUrl, getEnemyImageUrl,
} from '@/lib/aiService'
import { emitGameEvent, EVENTS } from '@/game/EventBridge'

const BASE_ATTRS: Attributes = {
  strength: 5, intelligence: 5, dexterity: 5,
  wisdom: 5, charisma: 5, constitution: 5,
}

interface Store extends GameState {
  isAiLoading: boolean
  currentSceneImage: string
  currentEnemyImage: string
  storyContext: string
  lastCombatWon: boolean | null
  setScreen: (s: Screen) => void
  createCharacter: (name: string, race: Race) => void
  chooseClass: (cls: CharClass) => void
  applyAttributes: (attrs: Attributes) => void
  makeAiChoice: (choiceText: string, action: string) => Promise<void>
  startCombat: (enemy: Enemy) => void
  playerAttack: () => Promise<void>
  playerUseSkill: (skill: string) => Promise<void>
  playerFlee: () => void
  playerUsePotion: () => void
  gainExp: (amount: number) => void
  gainGold: (amount: number) => void
  completeQuest: (questId: string) => void
  addQuest: (quest: Quest) => void
  resetGame: () => void
  confirmLevelUp: (attrs: Attributes) => void
}

const ENEMIES: Record<string, Omit<Enemy, 'hp'>> = {
  goblin_scout:      { id: 'goblin_scout',       name: 'Goblin Explorador',   maxHp: 30,  attack: 6,  defense: 2,  exp: 25,  gold: 8,   description: 'Goblin ágil com faca enferrujada.',          icon: '👺' },
  goblin_x3:         { id: 'goblin_x3',           name: 'Trio de Goblins',     maxHp: 55,  attack: 9,  defense: 3,  exp: 60,  gold: 20,  description: 'Três goblins em sincronia.',                  icon: '👺' },
  forest_wolf:       { id: 'forest_wolf',         name: 'Lobo das Sombras',    maxHp: 40,  attack: 8,  defense: 3,  exp: 35,  gold: 5,   description: 'Lobo cinza com olhos amarelos.',             icon: '🐺' },
  bandit_leader:     { id: 'bandit_leader',       name: 'Líder dos Bandidos',  maxHp: 70,  attack: 14, defense: 6,  exp: 90,  gold: 45,  description: 'Bandido com cicatrizes de batalha.',         icon: '🗡️' },
  skeleton_guardian: { id: 'skeleton_guardian',   name: 'Esqueleto Guardião',  maxHp: 65,  attack: 12, defense: 5,  exp: 70,  gold: 25,  description: 'Guerreiro morto-vivo enferrujado.',           icon: '💀' },
  dark_knight:       { id: 'dark_knight',         name: 'Cavaleiro das Trevas', maxHp: 120, attack: 18, defense: 9,  exp: 150, gold: 80,  description: 'Paladino corrompido pela escuridão.',        icon: '🖤' },
  lich_malachar:     { id: 'lich_malachar',       name: 'Lich Malachar',       maxHp: 200, attack: 24, defense: 11, exp: 350, gold: 250, description: 'Necromante imortal de poder inimaginavél.',   icon: '☠️' },
  unknown:           { id: 'unknown',             name: 'Criatura Sombria',    maxHp: 50,  attack: 10, defense: 4,  exp: 50,  gold: 15,  description: 'Criatura desconhecida das trevas.',           icon: '👁️' },
}

function blankState() {
  return {
    screen: 'intro' as Screen,
    character: null as Character | null,
    currentNode: 'start',
    narrativeHistory: [] as NarrativeEntry[],
    activeQuests: [] as Quest[],
    completedQuests: [] as string[],
    combat: null,
    pendingLevelUp: false,
    pendingAttributePoints: 0,
    flags: {} as Record<string, boolean>,
    isAiLoading: false,
    currentSceneImage: getSceneImageUrl('dark medieval castle gate at night torchlight fog', 1),
    currentEnemyImage: '',
    storyContext: '',
    lastCombatWon: null as boolean | null,
  }
}

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      ...blankState(),

      setScreen: (screen) => set({ screen }),

      createCharacter: (name, race) => {
        const rd = RACE_DATA[race]
        const attrs: Attributes = { ...BASE_ATTRS }
        Object.entries(rd.bonuses).forEach(([k, v]) => { (attrs as any)[k] += v })
        const stats = calcStats(attrs, 1)
        const character: Character = {
          name, race, charClass: null,
          level: 1, exp: 0, expToNext: calcExpToNext(1),
          attributes: attrs, stats,
          skills: [rd.skill], gold: 50,
          inventory: [
            { id: 'p1', name: 'Poção de Vida', type: 'potion', description: 'Restaura 40 PV.', value: 20 },
            { id: 'p2', name: 'Poção de Vida', type: 'potion', description: 'Restaura 40 PV.', value: 20 },
          ],
        }
        set({ character, screen: 'class' })
      },

      chooseClass: (cls) => {
        const { character } = get()
        if (!character) return
        const cd = CLASS_DATA[cls]
        const attrs = { ...character.attributes }
        Object.entries(cd.bonuses).forEach(([k, v]) => { (attrs as any)[k] += v })
        const stats = calcStats(attrs, character.level)
        set({
          character: { ...character, charClass: cls, attributes: attrs, stats, skills: [...character.skills, ...cd.skills] },
          screen: 'attributes',
        })
      },

      applyAttributes: async (attrs) => {
        const { character } = get()
        if (!character) return
        const stats = calcStats(attrs, character.level)
        const updatedChar = { ...character, attributes: attrs, stats }
        set({ character: updatedChar, screen: 'game', isAiLoading: true })

        try {
          const result = await generateNarrative(
            updatedChar,
            'Início da aventura em Eldoria',
            `${updatedChar.name} acaba de chegar ao reino medieval de Eldoria. A aventura épica começa agora.`,
          )
          set({
            isAiLoading: false,
            currentSceneImage: getSceneImageUrl(result.scenePrompt, 1),
            storyContext: result.narration,
            narrativeHistory: [{
              id: Date.now().toString(),
              text: result.narration,
              type: 'narration',
              choices: result.choices as Choice[],
              timestamp: Date.now(),
            }],
          })
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          console.error('AI start error:', errMsg)
          set({
            isAiLoading: false,
            narrativeHistory: [{
              id: Date.now().toString(),
              text: `[ERRO API] ${errMsg}`,
              type: 'system',
              choices: [],
              timestamp: Date.now(),
            }],
          })
        }
      },

      makeAiChoice: async (choiceText, action) => {
        const { character, storyContext, narrativeHistory } = get()
        if (!character) return

        if (action.startsWith('combat:')) {
          const key = action.replace('combat:', '')
          const base = ENEMIES[key] ?? ENEMIES['unknown']
          get().startCombat({ ...base, hp: base.maxHp })
          return
        }

        if (action === 'restart') {
          get().resetGame()
          return
        }

        set({ isAiLoading: true })
        set(s => ({
          narrativeHistory: [...s.narrativeHistory, {
            id: Date.now().toString(),
            text: `> ${choiceText}`,
            type: 'action' as const,
            timestamp: Date.now(),
          }],
        }))

        const recentNarrations = narrativeHistory
          .filter(e => e.type === 'narration')
          .slice(-4)
          .map(e => e.text)
          .join('\n---\n')
        const context = recentNarrations || storyContext

        try {
          const result = await generateNarrative(character, choiceText, context)
          const seed = Math.floor(Math.random() * 999) + 2

          set(s => ({
            isAiLoading: false,
            currentSceneImage: getSceneImageUrl(result.scenePrompt, seed),
            storyContext: (s.storyContext + '\n' + choiceText + '\n' + result.narration).slice(-3000),
            narrativeHistory: [...s.narrativeHistory, {
              id: (Date.now() + 1).toString(),
              text: result.narration,
              type: 'narration' as const,
              choices: result.choices as Choice[],
              timestamp: Date.now(),
            }],
          }))
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          console.error('AI choice error:', errMsg)
          set(s => ({
            isAiLoading: false,
            narrativeHistory: [...s.narrativeHistory, {
              id: (Date.now() + 1).toString(),
              text: `[ERRO API] ${errMsg}`,
              type: 'system' as const,
              choices: [
                { id: 'c1', text: 'Tentar novamente', action: 'goto:retry' },
              ],
              timestamp: Date.now(),
            }],
          }))
        }
      },

      startCombat: (enemy) => {
        set({
          screen: 'combat',
          combat: { enemy, playerTurn: true, round: 1, log: [], fled: false },
          currentEnemyImage: getEnemyImageUrl(enemy.name, Math.floor(Math.random() * 50) + 1),
        })
      },

      playerAttack: async () => {
        const { combat, character } = get()
        if (!combat || !character) return

        const isCrit = Math.random() < 0.1 + character.attributes.dexterity * 0.01
        const raw    = Math.max(1, character.stats.attack + Math.floor(Math.random() * 6) - 2 - combat.enemy.defense)
        const dmg    = isCrit ? Math.floor(raw * 1.8) : raw
        const eDmg   = Math.max(1, combat.enemy.attack - character.stats.defense + Math.floor(Math.random() * 4) - 1)
        const newHpE = Math.max(0, combat.enemy.hp - dmg)
        const newHpP = Math.max(0, character.stats.hp - eDmg)

        const quick = `${isCrit ? '⚡ CRÍTICO! ' : ''}Ataque: ${dmg} dano causado, ${eDmg} recebido.`
        set(s => ({
          combat: s.combat ? {
            ...s.combat,
            enemy: { ...s.combat.enemy, hp: newHpE },
            log: [...s.combat.log, { text: quick, type: 'player' as const }],
            round: s.combat.round + 1,
          } : null,
          character: s.character ? { ...s.character, stats: { ...s.character.stats, hp: newHpP } } : null,
        }))

        generateCombatNarration(character, combat.enemy.name, 'Ataque normal', dmg, eDmg).then(txt => {
          set(s => {
            if (!s.combat) return s
            const log = [...s.combat.log]
            if (log.length > 0) log[log.length - 1] = { ...log[log.length - 1], text: txt }
            return { combat: { ...s.combat, log } }
          })
        })

        if (newHpE <= 0) {
          get().gainExp(combat.enemy.exp)
          get().gainGold(combat.enemy.gold)
          const isLich = combat.enemy.id.includes('lich_malachar')
          set({ combat: null, screen: 'game', lastCombatWon: true })
          emitGameEvent(EVENTS.COMBAT_ENDED, { won: true })
          if (isLich) {
            set(s => ({
              narrativeHistory: [...s.narrativeHistory, {
                id: Date.now().toString(),
                text: 'O Orbe explode em luz sagrada. Malachar desintegra-se em cinzas eternas. Eldoria está salva — sua lenda será cantada por gerações.',
                type: 'narration' as const,
                choices: [{ id: 'r', text: '✦ Jogar novamente', action: 'restart' }],
                timestamp: Date.now(),
              }],
            }))
          } else {
            await get().makeAiChoice(`Derrotei ${combat.enemy.name} em combate glorioso`, 'goto:victory')
          }
          return
        }
        if (newHpP <= 0) set({ screen: 'gameover' })
      },

      playerUseSkill: async (skill) => {
        const { combat, character } = get()
        if (!combat || !character) return
        const mpCost = 15
        if (character.stats.mp < mpCost) {
          set(s => ({ combat: s.combat ? { ...s.combat, log: [...s.combat.log, { text: '❌ Mana insuficiente!', type: 'system' as const }] } : null }))
          return
        }
        const dmg    = Math.floor(character.stats.attack * 1.5 + character.attributes.intelligence * 2)
        const eDmg   = Math.max(1, combat.enemy.attack - character.stats.defense)
        const newHpE = Math.max(0, combat.enemy.hp - dmg)
        const newHpP = Math.max(0, character.stats.hp - eDmg)
        const newMp  = character.stats.mp - mpCost

        set(s => ({
          combat: s.combat ? {
            ...s.combat,
            enemy: { ...s.combat.enemy, hp: newHpE },
            log: [...s.combat.log, { text: `✨ ${skill} — ${dmg} dano mágico!`, type: 'player' as const }],
            round: s.combat.round + 1,
          } : null,
          character: s.character ? { ...s.character, stats: { ...s.character.stats, hp: newHpP, mp: newMp } } : null,
        }))

        generateCombatNarration(character, combat.enemy.name, skill, dmg, eDmg).then(txt => {
          set(s => {
            if (!s.combat) return s
            const log = [...s.combat.log]
            if (log.length > 0) log[log.length - 1] = { ...log[log.length - 1], text: txt }
            return { combat: { ...s.combat, log } }
          })
        })

        if (newHpE <= 0) {
          get().gainExp(combat.enemy.exp)
          get().gainGold(combat.enemy.gold)
          set({ combat: null, screen: 'game', lastCombatWon: true })
          emitGameEvent(EVENTS.COMBAT_ENDED, { won: true })
          await get().makeAiChoice(`Derrotei ${combat.enemy.name} com ${skill}`, 'goto:victory')
          return
        }
        if (newHpP <= 0) set({ screen: 'gameover' })
      },

      playerFlee: () => {
        const { combat, character } = get()
        if (!combat || !character) return
        const ok = Math.random() < 0.4 + character.attributes.dexterity * 0.03
        if (ok) {
          const dmg = Math.floor(combat.enemy.attack * 0.5)
          set(s => ({
            combat: null, screen: 'game', lastCombatWon: false,
            character: s.character ? { ...s.character, stats: { ...s.character.stats, hp: Math.max(1, s.character.stats.hp - dmg) } } : null,
          }))
          emitGameEvent(EVENTS.COMBAT_ENDED, { won: false })
          get().makeAiChoice(`Fugi do combate contra ${combat.enemy.name}, levando ${dmg} de dano`, 'goto:flee')
        } else {
          const dmg = Math.max(1, combat.enemy.attack - character.stats.defense)
          set(s => ({
            combat: s.combat ? { ...s.combat, log: [...s.combat.log, { text: `Fuga falhou! ${combat.enemy.name} ataca por ${dmg}!`, type: 'enemy' as const }] } : null,
            character: s.character ? { ...s.character, stats: { ...s.character.stats, hp: Math.max(0, s.character.stats.hp - dmg) } } : null,
          }))
          if (character.stats.hp - dmg <= 0) set({ screen: 'gameover' })
        }
      },

      playerUsePotion: () => {
        const { character } = get()
        if (!character) return
        const potion = character.inventory.find(i => i.type === 'potion')
        if (!potion) return
        const heal  = 40
        const newHp = Math.min(character.stats.maxHp, character.stats.hp + heal)
        set(s => ({
          character: s.character ? {
            ...s.character,
            stats: { ...s.character.stats, hp: newHp },
            inventory: s.character.inventory.filter(i => i.id !== potion.id),
          } : null,
          combat: s.combat ? { ...s.combat, log: [...s.combat.log, { text: `🧪 Poção usada: +${heal} PV`, type: 'player' as const }] } : null,
        }))
      },

      gainExp: (amount) => {
        set(s => {
          if (!s.character) return s
          const newExp = s.character.exp + amount
          if (newExp >= s.character.expToNext)
            return { character: { ...s.character, exp: newExp }, pendingLevelUp: true, pendingAttributePoints: 3 }
          return { character: { ...s.character, exp: newExp } }
        })
      },

      gainGold: (amount) => {
        set(s => ({ character: s.character ? { ...s.character, gold: s.character.gold + amount } : null }))
      },

      completeQuest: (questId) => {
        const q = get().activeQuests.find(q => q.id === questId)
        if (!q) return
        get().gainExp(q.reward.exp)
        get().gainGold(q.reward.gold)
        set(s => ({ activeQuests: s.activeQuests.filter(x => x.id !== questId), completedQuests: [...s.completedQuests, questId] }))
      },

      addQuest: (quest) => {
        set(s => ({ activeQuests: [...s.activeQuests.filter(q => q.id !== quest.id), quest] }))
      },

      confirmLevelUp: (attrs) => {
        set(s => {
          if (!s.character) return s
          const lv  = s.character.level + 1
          const st  = calcStats(attrs, lv)
          st.hp = st.maxHp; st.mp = st.maxMp
          return {
            character: { ...s.character, level: lv, exp: s.character.exp - s.character.expToNext, expToNext: calcExpToNext(lv), attributes: attrs, stats: st },
            pendingLevelUp: false, pendingAttributePoints: 0, screen: 'game' as Screen,
          }
        })
      },

      resetGame: () => set({ ...blankState() }),
    }),
    {
      name: 'rpg-eldoria-v2',
      version: 2,
      partialize: (s) => ({
        character: s.character,
        narrativeHistory: s.narrativeHistory.slice(-20),
        activeQuests: s.activeQuests,
        completedQuests: s.completedQuests,
        storyContext: s.storyContext,
        flags: s.flags,
        currentSceneImage: s.currentSceneImage,
      }),
    }
  )
)
