import { BOARD_W, BOARD_H, GRID_STEP } from './constants.js'

const COLS = BOARD_W / GRID_STEP
const ROWS = BOARD_H / GRID_STEP

export function createBoard() {
  const cells = new Uint8Array(COLS * ROWS)
  return { cells, cols: COLS, rows: ROWS }
}

export function cellIndex(col, row) {
  return row * (BOARD_W / GRID_STEP) + col
}

export function worldToGrid(x, y) {
  return [
    Math.round((x + BOARD_W / 2) / GRID_STEP),
    Math.round((y + BOARD_H / 2) / GRID_STEP),
  ]
}

export function gridToWorld(col, row) {
  return [
    col * GRID_STEP - BOARD_W / 2,
    row * GRID_STEP - BOARD_H / 2,
  ]
}

export function isOnBorder(col, row) {
  return col === 0 || col === COLS - 1 || row === 0 || row === ROWS - 1
}

export function isClaimed(board, col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true
  return board.cells[cellIndex(col, row)] === 1
}

export function setClaimed(board, col, row) {
  if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
    board.cells[cellIndex(col, row)] = 1
  }
}

export function initBorder(board) {
  for (let c = 0; c < COLS; c++) {
    setClaimed(board, c, 0)
    setClaimed(board, c, ROWS - 1)
  }
  for (let r = 0; r < ROWS; r++) {
    setClaimed(board, 0, r)
    setClaimed(board, COLS - 1, r)
  }
}

export function getClaimedPercent(board) {
  let count = 0
  for (let i = 0; i < board.cells.length; i++) {
    if (board.cells[i] === 1) count++
  }
  return (count / board.cells.length) * 100
}

export function getEdgeNeighbors(board, col, row) {
  const neighbors = []
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (const [dc, dr] of dirs) {
    const nc = col + dc
    const nr = row + dr
    if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && isClaimed(board, nc, nr)) {
      neighbors.push([nc, nr])
    }
  }
  return neighbors
}

export function isOnClaimedEdge(board, col, row) {
  if (!isClaimed(board, col, row)) return false
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (const [dc, dr] of dirs) {
    const nc = col + dc
    const nr = row + dr
    if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && !isClaimed(board, nc, nr)) {
      return true
    }
  }
  return isOnBorder(col, row)
}

export function floodFillCapture(board, lineCells, qixPositions) {
  const COLS_L = board.cols
  const ROWS_L = board.rows

  for (const [c, r] of lineCells) {
    setClaimed(board, c, r)
  }

  const lineSet = new Set(lineCells.map(([c, r]) => `${c},${r}`))

  const visited = new Uint8Array(COLS_L * ROWS_L)
  const regions = []

  function flood(startC, startR) {
    const region = []
    const stack = [[startC, startR]]
    const idx0 = startR * COLS_L + startC
    if (visited[idx0]) return null
    if (board.cells[idx0] === 1) return null
    visited[idx0] = 1

    while (stack.length > 0) {
      const [c, r] = stack.pop()
      region.push([c, r])
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      for (const [dc, dr] of dirs) {
        const nc = c + dc
        const nr = r + dr
        if (nc < 0 || nc >= COLS_L || nr < 0 || nr >= ROWS_L) continue
        const nIdx = nr * COLS_L + nc
        if (visited[nIdx]) continue
        if (board.cells[nIdx] === 1) continue
        visited[nIdx] = 1
        stack.push([nc, nr])
      }
    }
    return region
  }

  for (let r = 1; r < ROWS_L - 1; r++) {
    for (let c = 1; c < COLS_L - 1; c++) {
      if (board.cells[r * COLS_L + c] === 0 && !visited[r * COLS_L + c]) {
        const region = flood(c, r)
        if (region && region.length > 0) regions.push(region)
      }
    }
  }

  const qixGridPositions = qixPositions.map(([qx, qy]) => worldToGrid(qx, qy))

  let capturedCells = []
  let qixTrapped = false

  for (const region of regions) {
    let containsQix = false
    for (const [qc, qr] of qixGridPositions) {
      for (const [rc, rr] of region) {
        if (Math.abs(rc - qc) <= 1 && Math.abs(rr - qr) <= 1) {
          containsQix = true
          break
        }
      }
      if (containsQix) break
    }

    if (!containsQix) {
      for (const [c, r] of region) {
        setClaimed(board, c, r)
      }
      capturedCells = capturedCells.concat(region)
    } else if (region.length < COLS_L * ROWS_L * 0.15) {
      for (const [c, r] of region) {
        setClaimed(board, c, r)
      }
      capturedCells = capturedCells.concat(region)
      qixTrapped = true
    }
  }

  return { capturedCells, qixTrapped, capturedCount: capturedCells.length }
}

export function getClaimedEdgePath(board) {
  const edges = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isOnClaimedEdge(board, c, r)) {
        edges.push([c, r])
      }
    }
  }
  return edges
}
