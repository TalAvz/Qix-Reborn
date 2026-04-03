import React, { useRef, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import Board3D from './Board3D.jsx'
import { updateGame } from '../game/engine.js'
import { BOARD_W, BOARD_H } from '../game/constants.js'

function CameraSetup({ shakeTimer }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 18, 14)
    camera.lookAt(0, 0, 0)
    camera.fov = 50
    camera.updateProjectionMatrix()
  }, [camera])

  useFrame(({ clock }) => {
    const baseX = 0
    const baseY = 18
    const baseZ = 14
    let sx = 0, sy = 0
    if (shakeTimer > 0) {
      sx = (Math.random() - 0.5) * shakeTimer * 2
      sy = (Math.random() - 0.5) * shakeTimer * 2
    }
    camera.position.set(baseX + sx, baseY + sy * 0.3, baseZ)
    camera.lookAt(0, 0, 0)
  })

  return null
}

function GameLoop({ gameStateRef, touchDir, touchCount }) {
  const lastTime = useRef(0)

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    const dt = Math.min(time - lastTime.current, 0.05)
    lastTime.current = time

    if (gameStateRef.current && gameStateRef.current.status === 'playing') {
      updateGame(
        gameStateRef.current,
        dt,
        touchDir.current,
        touchCount.current
      )
      // Reset touch dir after consuming
      touchDir.current = { x: 0, y: 0 }
    }
  })

  return null
}

export default function GameScene({ gameStateRef, touchDir, touchCount, renderTick, pointerEvents = 'auto' }) {
  const state = gameStateRef.current
  if (!state) return null

  return (
    <Canvas
      style={{ width: '100%', height: '100%', background: '#000011', pointerEvents }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <CameraSetup shakeTimer={state.shakeTimer} />
      <GameLoop
        gameStateRef={gameStateRef}
        touchDir={touchDir}
        touchCount={touchCount}
      />
      <fog attach="fog" args={['#000011', 20, 50]} />
      <Board3D gameState={state} />
    </Canvas>
  )
}
