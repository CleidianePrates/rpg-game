export const TILE_SIZE    = 32
export const MAP_COLS     = 60
export const MAP_ROWS     = 50
export const GAME_WIDTH   = 800
export const GAME_HEIGHT  = 500
export const PLAYER_SPEED = 165
export const ENEMY_SPEED  = 58
export const AGGRO_RANGE  = 190  // pixels

// Índices dos tiles no tilesheet (cada tile 32×32)
export const T = {
  GRASS:      0,
  TREE:       1,
  WATER:      2,
  STONE:      3,
  SAND:       4,
  WALL:       5,
  DUNGEON:    6,
  MOUNTAIN:   7,
  BRIDGE:     8,
  FLOWER:     9,
  DARK_GRASS: 10,
} as const

export const BLOCKING_TILES = [T.TREE, T.WATER, T.WALL, T.MOUNTAIN]
