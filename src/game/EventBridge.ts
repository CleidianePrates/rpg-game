// Bridge de eventos entre Phaser (mundo) e React (UI/narrativa)
export const gameEvents = new EventTarget()

export const EVENTS = {
  // Phaser → React
  TRIGGER_COMBAT:    'TRIGGER_COMBAT',
  TRIGGER_NARRATIVE: 'TRIGGER_NARRATIVE',
  SHOW_HINT:         'SHOW_HINT',
  HIDE_HINT:         'HIDE_HINT',
  SET_ZONE:          'SET_ZONE',

  // React → Phaser
  COMBAT_ENDED:      'COMBAT_ENDED',
  NARRATIVE_CLOSED:  'NARRATIVE_CLOSED',
  GOTO_ZONE:         'GOTO_ZONE',
} as const

export function emitGameEvent(type: string, detail?: unknown) {
  gameEvents.dispatchEvent(new CustomEvent(type, { detail }))
}
