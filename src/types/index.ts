export type Race = 'elf' | 'human' | 'dwarf' | 'orc'
export type CharClass = 'warrior' | 'mage' | 'archer' | 'rogue'
export type Screen = 'intro' | 'race' | 'class' | 'attributes' | 'game' | 'combat' | 'levelup' | 'gameover'

export interface Attributes {
  strength: number
  intelligence: number
  dexterity: number
  wisdom: number
  charisma: number
  constitution: number
}

export interface CharacterStats {
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  stamina: number
  maxStamina: number
  attack: number
  defense: number
  speed: number
}

export interface Character {
  name: string
  race: Race
  charClass: CharClass | null
  level: number
  exp: number
  expToNext: number
  attributes: Attributes
  stats: CharacterStats
  skills: string[]
  gold: number
  inventory: InventoryItem[]
}

export interface Enemy {
  id: string
  name: string
  hp: number
  maxHp: number
  attack: number
  defense: number
  exp: number
  gold: number
  description: string
  icon: string
}

export interface InventoryItem {
  id: string
  name: string
  type: 'weapon' | 'armor' | 'potion' | 'key'
  description: string
  value: number
  effect?: { stat: keyof Attributes | keyof CharacterStats; amount: number }
}

export interface Quest {
  id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'failed'
  reward: { exp: number; gold: number }
}

export interface GameState {
  screen: Screen
  character: Character | null
  currentNode: string
  narrativeHistory: NarrativeEntry[]
  activeQuests: Quest[]
  completedQuests: string[]
  combat: CombatState | null
  pendingLevelUp: boolean
  pendingAttributePoints: number
  flags: Record<string, boolean>
}

export interface NarrativeEntry {
  id: string
  text: string
  type: 'narration' | 'dialogue' | 'action' | 'system' | 'combat'
  choices?: Choice[]
  timestamp: number
}

export interface Choice {
  id: string
  text: string
  action: string
  requires?: { attribute: keyof Attributes; value: number }
  disabled?: boolean
}

export interface CombatState {
  enemy: Enemy
  playerTurn: boolean
  round: number
  log: CombatLog[]
  fled: boolean
}

export interface CombatLog {
  text: string
  type: 'player' | 'enemy' | 'system'
}

export const RACE_DATA: Record<Race, {
  name: string; emoji: string; origin: string; description: string;
  bonuses: Partial<Attributes>; mission: string; skill: string
}> = {
  elf: {
    name: 'Elfo', emoji: '🧝',
    origin: 'Floresta de Sylvandor',
    description: 'Criaturas etéreas ligadas à magia ancestral das florestas. Sua longevidade lhes confere sabedoria incomparável.',
    bonuses: { intelligence: 3, dexterity: 2, wisdom: 2 },
    mission: 'Recuperar o Cristal da Criação, roubado pelos Orcs das Montanhas Negras.',
    skill: 'Visão Élfica — Detecta inimigos e armadilhas com antecedência'
  },
  human: {
    name: 'Humano', emoji: '⚔️',
    origin: 'Reino de Valdoria',
    description: 'Adaptáveis e determinados, os humanos dominaram Eldoria com força de vontade e versatilidade.',
    bonuses: { strength: 1, intelligence: 1, dexterity: 1, wisdom: 1, charisma: 2, constitution: 1 },
    mission: 'Desvendar o assassinato do Rei Aldric e restaurar o trono de Valdoria.',
    skill: 'Versatilidade — Ganha 10% mais EXP em todas as ações'
  },
  dwarf: {
    name: 'Anão', emoji: '🪨',
    origin: 'Fortaleza de Khaz Modan',
    description: 'Mestres da forja e da pedra, os anões são os guerreiros mais resistentes de Eldoria.',
    bonuses: { strength: 2, constitution: 4, wisdom: 1 },
    mission: 'Recuperar o Martelo Sagrado de Durin, perdido nas Minas Profundas.',
    skill: 'Pele de Pedra — Reduz dano recebido em 15%'
  },
  orc: {
    name: 'Orc', emoji: '🗡️',
    origin: 'Estepes de Grommash',
    description: 'Guerreiros sem igual, os Orcs honram seus ancestrais através de batalhas e conquistas épicas.',
    bonuses: { strength: 4, constitution: 3, charisma: -1 },
    mission: 'Derrotar o Senhor dos Não-Mortos e salvar as Estepes da maldição eterna.',
    skill: 'Fúria Orc — Causa +50% dano quando abaixo de 30% de vida'
  }
}

export const CLASS_DATA: Record<CharClass, {
  name: string; emoji: string; description: string;
  bonuses: Partial<Attributes>; skills: string[]; playstyle: string
}> = {
  warrior: {
    name: 'Guerreiro', emoji: '🛡️',
    description: 'Mestre das armas e armaduras pesadas. Linha de frente inabalável.',
    bonuses: { strength: 3, constitution: 2 },
    skills: ['Golpe Poderoso', 'Postura Defensiva', 'Grito de Guerra'],
    playstyle: 'Tanque — alta defesa e dano físico'
  },
  mage: {
    name: 'Mago', emoji: '🔮',
    description: 'Manipulador das forças arcanas. Devastador à distância.',
    bonuses: { intelligence: 4, wisdom: 2 },
    skills: ['Bola de Fogo', 'Congelamento', 'Escudo Arcano'],
    playstyle: 'Mago — alto dano mágico, baixa defesa'
  },
  archer: {
    name: 'Arqueiro', emoji: '🏹',
    description: 'Precisão letal a longa distância. Mestre do sigilo e emboscadas.',
    bonuses: { dexterity: 3, wisdom: 2 },
    skills: ['Tiro Preciso', 'Flecha de Fogo', 'Emboscada'],
    playstyle: 'Atirador — dano físico à distância, mobilidade'
  },
  rogue: {
    name: 'Ladino', emoji: '🗡️',
    description: 'Assassino furtivo que ataca nas sombras. Veneno e golpes críticos.',
    bonuses: { dexterity: 3, charisma: 2 },
    skills: ['Golpe Furtivo', 'Veneno de Lâmina', 'Evasão'],
    playstyle: 'Assassino — alto dano crítico, fuga e controle'
  }
}

export function calcStats(attrs: Attributes, level: number): CharacterStats {
  return {
    maxHp: 80 + attrs.constitution * 12 + level * 8,
    hp: 80 + attrs.constitution * 12 + level * 8,
    maxMp: 30 + attrs.intelligence * 8 + level * 4,
    mp: 30 + attrs.intelligence * 8 + level * 4,
    maxStamina: 50 + attrs.constitution * 5,
    stamina: 50 + attrs.constitution * 5,
    attack: 8 + attrs.strength * 3 + attrs.dexterity * 1,
    defense: 4 + attrs.constitution * 2,
    speed: 5 + attrs.dexterity * 2,
  }
}

export function calcExpToNext(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}
