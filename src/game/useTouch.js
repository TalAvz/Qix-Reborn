import { useRef, useCallback, useEffect } from 'react'

export function useTouch(isPlaying) {
  const touchDir = useRef({ x: 0, y: 0 })
  const touchCount = useRef(0)
  const active = useRef(false)
  const fingerPos = useRef(null)
  const lastEmitPos = useRef(null)

  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    touchCount.current = e.touches.length
    if (e.touches.length > 0) {
      const pos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      fingerPos.current = pos
      lastEmitPos.current = pos
      active.current = true
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    touchCount.current = e.touches.length
    if (e.touches.length === 0) return
    const pos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    fingerPos.current = pos

    if (!lastEmitPos.current) {
      lastEmitPos.current = pos
      return
    }

    // Continuously emit direction based on finger movement from last emitted position
    const dx = pos.x - lastEmitPos.current.x
    const dy = pos.y - lastEmitPos.current.y
    const deadzone = 4  // Reduced deadzone for more responsive continuous movement
    if (Math.abs(dx) > deadzone || Math.abs(dy) > deadzone) {
      // Emit a larger magnitude so the engine's moveAmount threshold is met
      touchDir.current = { x: dx, y: dy }
      lastEmitPos.current = pos
    }
  }, [])

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault()
    touchCount.current = e.touches.length
    if (e.touches.length === 0) {
      active.current = false
      touchDir.current = { x: 0, y: 0 }
      fingerPos.current = null
      lastEmitPos.current = null
    }
  }, [])

  // Keyboard fallback for desktop testing
  const keysDown = useRef(new Set())
  const handleKeyDown = useCallback((e) => {
    keysDown.current.add(e.key)
    active.current = true
    touchCount.current = e.shiftKey ? 2 : 1
    updateKeyDir(keysDown.current, touchDir)
  }, [])

  const handleKeyUp = useCallback((e) => {
    keysDown.current.delete(e.key)
    touchCount.current = e.shiftKey ? 2 : 1
    if (keysDown.current.size === 0) {
      active.current = false
      touchDir.current = { x: 0, y: 0 }
    } else {
      updateKeyDir(keysDown.current, touchDir)
    }
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    const el = document
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: false })
    el.addEventListener('keydown', handleKeyDown)
    el.addEventListener('keyup', handleKeyUp)
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('keydown', handleKeyDown)
      el.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPlaying, handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown, handleKeyUp])

  return { touchDir, touchCount, active }
}

function updateKeyDir(keys, touchDir) {
  let x = 0, y = 0
  if (keys.has('ArrowLeft') || keys.has('a')) x = -1
  if (keys.has('ArrowRight') || keys.has('d')) x = 1
  if (keys.has('ArrowUp') || keys.has('w')) y = -1
  if (keys.has('ArrowDown') || keys.has('s')) y = 1
  touchDir.current = { x: x * 20, y: y * 20 }
}
