export const BOARD_W = 200
export const BOARD_H = 120
export const GRID_STEP = 2

export const PLAYER_SPEED = 80
export const PLAYER_DRAW_SLOW = 40
export const PLAYER_DRAW_FAST = 70

export const SPARX_SPEED = 50
export const FUSE_BASE_SPEED = 35

export const QIX_SPEED = 45
export const QIX_CHANGE_DIR_INTERVAL = 0.8

export const LIVES_DEFAULT = 3

export const LEVEL_CONFIGS = []
for (let i = 0; i < 20; i++) {
  LEVEL_CONFIGS.push({
    level: i + 1,
    targetPercent: Math.min(60 + i * 3, 90),
    qixCount: i >= 2 ? 2 : 1,
    sparxCount: 1 + Math.floor(i / 2),
    fuseSpeedMult: 1 + i * 0.15,
    palette: i % 3,
  })
}

export const PALETTES = [
  { bg: '#0a0a2e', border: '#00bbff', fill: '#0066cc', glow: '#00ddff', qix: '#ff00ff' },
  { bg: '#1a0a2e', border: '#bb00ff', fill: '#6600cc', glow: '#dd00ff', qix: '#ff6600' },
  { bg: '#2e1a0a', border: '#ff8800', fill: '#cc4400', glow: '#ffaa00', qix: '#00ffaa' },
]

export const ACHIEVEMENTS = {
  TRAPPED: { id: 'trapped', name: 'Trapped!', desc: 'Capture a Qix in a small region' },
  SPEED_DEMON: { id: 'speed_demon', name: 'Speed Demon', desc: 'Complete a level using only fast draw' },
  PERFECTIONIST: { id: 'perfectionist', name: 'Perfectionist', desc: 'Capture 95%+ of the board' },
  UNTOUCHABLE: { id: 'untouchable', name: 'Untouchable', desc: 'Complete a level without losing a life' },
}
