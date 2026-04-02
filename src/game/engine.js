import {
  BOARD_W, BOARD_H, GRID_STEP, PLAYER_SPEED, PLAYER_DRAW_SLOW,
  PLAYER_DRAW_FAST, SPARX_SPEED, FUSE_BASE_SPEED, QIX_SPEED,
  QIX_CHANGE_DIR_INTERVAL, LIVES_DEFAULT, LEVEL_CONFIGS,
} from './constants.js'
import {
  createBoard, initBorder, worldToGrid, gridToWorld, isClaimed,
  isOnClaimedEdge, floodFillCapture, getClaimedPercent, setClaimed,
  isOnBorder,
} from './board.js'
import { vibrateCapture, vibrateDeath, vibrateLevelComplete } from './haptics.js'
import { setHighScore, setLevelStars, addAchievement, setBestPercent } from './storage.js'

export function createGameState(levelIndex) {
  const config = LEVEL_CONFIGS[levelIndex] || LEVEL_CONFIGS[0]
  const board = createBoard()
  initBorder(board)

  const playerStart = gridToWorld(Math.floor(board.cols / 2), 0)

  const qixes = []
  for (let i = 0; i < config.qixCount; i++) {
    qixes.push({
      x: (i - 0.5) * 30,
      y: 0,
      vx: (Math.random() - 0.5) * QIX_SPEED,
      vy: (Math.random() - 0.5) * QIX_SPEED,
      dirTimer: 0,
      phase: Math.random() * Math.PI * 2,
    })
  }

  const sparxList = []
  for (let i = 0; i < config.sparxCount; i++) {
    const t = i / config.sparxCount
    const perim = 2 * (board.cols + board.rows - 2)
    const pos = Math.floor(t * perim)
    let sc, sr
    if (pos < board.cols) { sc = pos; sr = 0 }
    else if (pos < board.cols + board.rows - 1) { sc = board.cols - 1; sr = pos - board.cols + 1 }
    else if (pos < 2 * board.cols + board.rows - 2) { sc = board.cols - 1 - (pos - board.cols - board.rows + 2); sr = board.rows - 1 }
    else { sc = 0; sr = board.rows - 1 - (pos - 2 * board.cols - board.rows + 3) }
    const [wx, wy] = gridToWorld(sc, sr)
    sparxList.push({
      x: wx, y: wy,
      gridCol: sc, gridRow: sr,
      dir: i % 2 === 0 ? 1 : -1,
      progress: 0,
      targetCol: sc, targetRow: sr,
    })
  }

  return {
    board,
    config,
    levelIndex,
    player: {
      x: playerStart[0], y: playerStart[1],
      gridCol: Math.floor(board.cols / 2), gridRow: 0,
      drawing: false,
      drawLine: [],
      drawLineSet: new Set(),
      fast: false,
      startDrawCol: 0, startDrawRow: 0,
    },
    qixes,
    sparx: sparxList,
    fuse: null,
    lives: LIVES_DEFAULT,
    score: 0,
    combo: 1,
    capturedPercent: getClaimedPercent(board),
    status: 'playing',
    deathPos: null,
    captureAnim: null,
    levelCompleteTimer: 0,
    usedSlowDraw: false,
    lostLife: false,
    particles: [],
    shakeTimer: 0,
    message: null,
    messageTimer: 0,
  }
}

export function updateGame(state, dt, touchDir, touchCount) {
  if (state.status !== 'playing') return state

  if (state.messageTimer > 0) {
    state.messageTimer -= dt
    if (state.messageTimer <= 0) state.message = null
  }
  state.shakeTimer = Math.max(0, state.shakeTimer - dt)

  updatePlayer(state, dt, touchDir, touchCount)
  updateQixes(state, dt)
  updateSparx(state, dt)
  updateFuse(state, dt)
  updateParticles(state, dt)
  checkCollisions(state)

  return state
}

function updatePlayer(state, dt, touchDir, touchCount) {
  const { player, board } = state
  if (!touchDir || (touchDir.x === 0 && touchDir.y === 0)) return

  const dx = touchDir.x
  const dy = touchDir.y

  let moveCol = 0, moveRow = 0
  if (Math.abs(dx) > Math.abs(dy)) {
    moveCol = dx > 0 ? 1 : -1
  } else {
    moveRow = dy > 0 ? 1 : -1
  }

  const speed = player.drawing
    ? (player.fast ? PLAYER_DRAW_FAST : PLAYER_DRAW_SLOW)
    : PLAYER_SPEED
  const moveAmount = speed * dt / GRID_STEP

  if (moveAmount < 0.3) return

  const targetCol = player.gridCol + moveCol
  const targetRow = player.gridRow + moveRow

  if (targetCol < 0 || targetCol >= board.cols || targetRow < 0 || targetRow >= board.rows) return

  const targetClaimed = isClaimed(board, targetCol, targetRow)
  const targetIsEdge = isOnClaimedEdge(board, targetCol, targetRow)

  if (!player.drawing) {
    if (targetClaimed) {
      player.gridCol = targetCol
      player.gridRow = targetRow
      const [wx, wy] = gridToWorld(targetCol, targetRow)
      player.x = wx
      player.y = wy
    } else {
      player.drawing = true
      player.fast = touchCount >= 2
      if (player.fast) state.usedSlowDraw = false
      else state.usedSlowDraw = true
      player.startDrawCol = player.gridCol
      player.startDrawRow = player.gridRow
      player.drawLine = [[player.gridCol, player.gridRow]]
      player.drawLineSet = new Set([`${player.gridCol},${player.gridRow}`])

      player.gridCol = targetCol
      player.gridRow = targetRow
      const [wx, wy] = gridToWorld(targetCol, targetRow)
      player.x = wx
      player.y = wy
      player.drawLine.push([targetCol, targetRow])
      player.drawLineSet.add(`${targetCol},${targetRow}`)

      state.fuse = {
        lineIndex: 0,
        progress: 0,
        speed: FUSE_BASE_SPEED * state.config.fuseSpeedMult,
      }
    }
  } else {
    player.fast = touchCount >= 2

    if (player.drawLineSet.has(`${targetCol},${targetRow}`)) {
      return
    }

    if (targetClaimed) {
      player.gridCol = targetCol
      player.gridRow = targetRow
      const [wx, wy] = gridToWorld(targetCol, targetRow)
      player.x = wx
      player.y = wy
      player.drawLine.push([targetCol, targetRow])

      const qixPositions = state.qixes.map(q => [q.x, q.y])
      const result = floodFillCapture(board, player.drawLine, qixPositions)

      const pointsMult = player.fast ? 1 : 2
      const captureScore = result.capturedCount * 10 * pointsMult * state.combo
      state.score += captureScore
      state.combo++

      if (result.qixTrapped) {
        state.score += 5000 * state.combo
        addAchievement('trapped')
        showMessage(state, 'QIX TRAPPED! +5000', 2)
        spawnParticleBurst(state, player.x, player.y, 50, '#ff00ff')
      } else if (result.capturedCount > 0) {
        spawnParticleBurst(state, player.x, player.y, 20, '#00ffcc')
      }

      vibrateCapture()

      player.drawing = false
      player.drawLine = []
      player.drawLineSet = new Set()
      state.fuse = null

      state.capturedPercent = getClaimedPercent(board)
      state.captureAnim = {
        cells: result.capturedCells,
        timer: 0.5,
      }

      if (state.capturedPercent >= state.config.targetPercent) {
        completeLevel(state)
      }
    } else {
      player.gridCol = targetCol
      player.gridRow = targetRow
      const [wx, wy] = gridToWorld(targetCol, targetRow)
      player.x = wx
      player.y = wy
      player.drawLine.push([targetCol, targetRow])
      player.drawLineSet.add(`${targetCol},${targetRow}`)
    }
  }
}

function updateQixes(state, dt) {
  const halfW = BOARD_W / 2 - GRID_STEP * 2
  const halfH = BOARD_H / 2 - GRID_STEP * 2

  for (const qix of state.qixes) {
    qix.dirTimer += dt
    qix.phase += dt * 2

    if (qix.dirTimer > QIX_CHANGE_DIR_INTERVAL) {
      qix.dirTimer = 0
      qix.vx += (Math.random() - 0.5) * QIX_SPEED * 0.8
      qix.vy += (Math.random() - 0.5) * QIX_SPEED * 0.8
      const speed = Math.sqrt(qix.vx * qix.vx + qix.vy * qix.vy)
      if (speed > QIX_SPEED) {
        qix.vx = (qix.vx / speed) * QIX_SPEED
        qix.vy = (qix.vy / speed) * QIX_SPEED
      }
    }

    qix.x += qix.vx * dt
    qix.y += qix.vy * dt

    const [gc, gr] = worldToGrid(qix.x, qix.y)
    if (isClaimed(state.board, gc, gr) || qix.x < -halfW || qix.x > halfW) {
      qix.vx *= -1
      qix.x = Math.max(-halfW, Math.min(halfW, qix.x))
    }
    if (isClaimed(state.board, gc, gr) || qix.y < -halfH || qix.y > halfH) {
      qix.vy *= -1
      qix.y = Math.max(-halfH, Math.min(halfH, qix.y))
    }

    const [gc2, gr2] = worldToGrid(qix.x, qix.y)
    if (isClaimed(state.board, gc2, gr2)) {
      qix.x += qix.vx * dt * 5
      qix.y += qix.vy * dt * 5
    }
  }
}

function updateSparx(state, dt) {
  const { board } = state

  for (const sparx of state.sparx) {
    sparx.progress += SPARX_SPEED * dt / GRID_STEP

    if (sparx.progress >= 1) {
      sparx.progress = 0
      sparx.gridCol = sparx.targetCol
      sparx.gridRow = sparx.targetRow

      const neighbors = []
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      for (const [dc, dr] of dirs) {
        const nc = sparx.gridCol + dc
        const nr = sparx.gridRow + dr
        if (nc >= 0 && nc < board.cols && nr >= 0 && nr < board.rows) {
          if (isOnClaimedEdge(board, nc, nr)) {
            neighbors.push([nc, nr])
          }
        }
      }

      // Move toward player along edges
      const pCol = state.player.gridCol
      const pRow = state.player.gridRow
      let best = null
      let bestDist = Infinity
      for (const [nc, nr] of neighbors) {
        const dist = Math.abs(nc - pCol) + Math.abs(nr - pRow)
        if (dist < bestDist) {
          bestDist = dist
          best = [nc, nr]
        }
      }

      if (best) {
        sparx.targetCol = best[0]
        sparx.targetRow = best[1]
      } else if (neighbors.length > 0) {
        const pick = neighbors[Math.floor(Math.random() * neighbors.length)]
        sparx.targetCol = pick[0]
        sparx.targetRow = pick[1]
      }
    }

    const [wx1, wy1] = gridToWorld(sparx.gridCol, sparx.gridRow)
    const [wx2, wy2] = gridToWorld(sparx.targetCol, sparx.targetRow)
    sparx.x = wx1 + (wx2 - wx1) * sparx.progress
    sparx.y = wy1 + (wy2 - wy1) * sparx.progress
  }
}

function updateFuse(state, dt) {
  if (!state.fuse || !state.player.drawing) return

  const fuse = state.fuse
  const line = state.player.drawLine
  if (line.length < 2) return

  fuse.progress += fuse.speed * dt / GRID_STEP

  while (fuse.progress >= 1 && fuse.lineIndex < line.length - 2) {
    fuse.progress -= 1
    fuse.lineIndex++
  }

  if (fuse.lineIndex >= line.length - 2 && fuse.progress >= 0.9) {
    killPlayer(state)
  }
}

function checkCollisions(state) {
  const { player } = state
  if (!player.drawing) return

  const pCol = player.gridCol
  const pRow = player.gridRow

  for (const qix of state.qixes) {
    for (const [lc, lr] of player.drawLine) {
      const [wlx, wly] = gridToWorld(lc, lr)
      const dist = Math.sqrt((qix.x - wlx) ** 2 + (qix.y - wly) ** 2)
      if (dist < GRID_STEP * 2) {
        killPlayer(state)
        return
      }
    }
  }

  for (const sparx of state.sparx) {
    const dist = Math.sqrt((sparx.x - player.x) ** 2 + (sparx.y - player.y) ** 2)
    if (dist < GRID_STEP * 1.5) {
      killPlayer(state)
      return
    }
  }
}

function killPlayer(state) {
  state.lives--
  state.lostLife = true
  state.combo = 1
  state.deathPos = { x: state.player.x, y: state.player.y }
  state.shakeTimer = 0.5
  vibrateDeath()
  spawnParticleBurst(state, state.player.x, state.player.y, 30, '#ff3333')

  if (state.lives <= 0) {
    state.status = 'gameover'
    setHighScore(state.score)
    showMessage(state, 'GAME OVER', 3)
    return
  }

  showMessage(state, `LIFE LOST! ${state.lives} remaining`, 2)

  // Reset player to border
  state.player.drawing = false
  state.player.drawLine = []
  state.player.drawLineSet = new Set()
  state.player.gridCol = Math.floor(state.board.cols / 2)
  state.player.gridRow = 0
  const [wx, wy] = gridToWorld(state.player.gridCol, state.player.gridRow)
  state.player.x = wx
  state.player.y = wy
  state.fuse = null
}

function completeLevel(state) {
  state.status = 'levelcomplete'
  vibrateLevelComplete()

  const pct = state.capturedPercent
  const target = state.config.targetPercent
  let stars = 1
  if (pct >= target + 15) stars = 3
  else if (pct >= target + 7) stars = 2

  setLevelStars(state.levelIndex + 1, stars)
  setBestPercent(state.levelIndex + 1, pct)
  setHighScore(state.score)

  state.score += Math.floor(pct * 100)

  if (pct >= 95) addAchievement('perfectionist')
  if (!state.lostLife) addAchievement('untouchable')
  if (!state.usedSlowDraw) addAchievement('speed_demon')

  spawnParticleBurst(state, 0, 0, 80, '#ffdd00')
  showMessage(state, `LEVEL COMPLETE! ${stars} STAR${stars > 1 ? 'S' : ''}`, 3)
}

function showMessage(state, text, duration) {
  state.message = text
  state.messageTimer = duration
}

function spawnParticleBurst(state, x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
    const speed = 30 + Math.random() * 60
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8 + Math.random() * 0.5,
      maxLife: 0.8 + Math.random() * 0.5,
      color,
      size: 0.5 + Math.random() * 1.5,
    })
  }
}

function updateParticles(state, dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i]
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vx *= 0.97
    p.vy *= 0.97
    p.life -= dt
    if (p.life <= 0) {
      state.particles.splice(i, 1)
    }
  }
}

export function getFuseWorldPos(state) {
  if (!state.fuse || !state.player.drawing) return null
  const line = state.player.drawLine
  const idx = Math.min(state.fuse.lineIndex, line.length - 2)
  if (idx < 0 || line.length < 2) return null
  const [c1, r1] = line[idx]
  const [c2, r2] = line[Math.min(idx + 1, line.length - 1)]
  const t = state.fuse.progress
  const [w1x, w1y] = gridToWorld(c1, r1)
  const [w2x, w2y] = gridToWorld(c2, r2)
  return { x: w1x + (w2x - w1x) * t, y: w1y + (w2y - w1y) * t }
}
