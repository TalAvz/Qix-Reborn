import React, { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, extend } from '@react-three/fiber'
import { BOARD_W, BOARD_H, GRID_STEP, PALETTES } from '../game/constants.js'
import { gridToWorld, isClaimed, isOnClaimedEdge } from '../game/board.js'
import { getFuseWorldPos } from '../game/engine.js'

// Extend R3F to recognize Line as 'threeJsLine'
extend({ ThreeLine: THREE.Line })

const TILE_HEIGHT = 1.5

export default function Board3D({ gameState }) {
  const palette = PALETTES[gameState.config.palette]
  return (
    <group>
      <BoardBase palette={palette} />
      <ClaimedTiles board={gameState.board} palette={palette} captureAnim={gameState.captureAnim} />
      <BorderEdges board={gameState.board} palette={palette} />
      <DrawLine player={gameState.player} />
      <PlayerOrb player={gameState.player} />
      {gameState.qixes.map((qix, i) => <QixEntity key={i} qix={qix} palette={palette} />)}
      {gameState.sparx.map((s, i) => <SparxEntity key={i} sparx={s} />)}
      <FuseEntity state={gameState} />
      <Particles particles={gameState.particles} />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 50, 30]} intensity={1.5} color="#ffffff" />
      <pointLight position={[gameState.player.x * 0.1, 10, gameState.player.y * 0.1]} intensity={0.8} color={palette.glow} />
    </group>
  )
}

function BoardBase({ palette }) {
  return (
    <mesh position={[0, -0.5, 0]} receiveShadow>
      <boxGeometry args={[(BOARD_W + 4) * 0.1, 1, (BOARD_H + 4) * 0.1]} />
      <meshStandardMaterial color={palette.bg} />
    </mesh>
  )
}

function ClaimedTiles({ board, palette, captureAnim }) {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorAttr = useRef()

  const maxInstances = board.cols * board.rows

  useFrame(() => {
    if (!meshRef.current) return
    let idx = 0
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (isClaimed(board, c, r)) {
          const [wx, wy] = gridToWorld(c, r)
          let height = TILE_HEIGHT

          if (captureAnim && captureAnim.timer > 0) {
            for (const [ac, ar] of captureAnim.cells) {
              if (ac === c && ar === r) {
                height = TILE_HEIGHT * (1 - captureAnim.timer * 2)
                break
              }
            }
          }

          dummy.position.set(wx * 0.1, Math.max(0, height * 0.5), wy * 0.1)
          dummy.scale.set(1, Math.max(0.1, height), 1)
          dummy.updateMatrix()
          meshRef.current.setMatrixAt(idx, dummy.matrix)
          idx++
        }
      }
    }
    meshRef.current.count = idx
    meshRef.current.instanceMatrix.needsUpdate = true

    if (captureAnim) {
      captureAnim.timer -= 0.016
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, maxInstances]}>
      <boxGeometry args={[GRID_STEP * 0.09, 1, GRID_STEP * 0.09]} />
      <meshStandardMaterial color={palette.fill} emissive={palette.fill} emissiveIntensity={0.3} transparent opacity={0.85} />
    </instancedMesh>
  )
}

function BorderEdges({ board, palette }) {
  const lineRef = useRef()

  useFrame(() => {
    if (!lineRef.current) return
    const points = []
    // Draw border
    const hw = BOARD_W / 2 * 0.1
    const hh = BOARD_H / 2 * 0.1
    points.push(new THREE.Vector3(-hw, TILE_HEIGHT + 0.1, -hh))
    points.push(new THREE.Vector3(hw, TILE_HEIGHT + 0.1, -hh))
    points.push(new THREE.Vector3(hw, TILE_HEIGHT + 0.1, hh))
    points.push(new THREE.Vector3(-hw, TILE_HEIGHT + 0.1, hh))
    points.push(new THREE.Vector3(-hw, TILE_HEIGHT + 0.1, -hh))
    lineRef.current.geometry.setFromPoints(points)
  })

  return (
    <threeLine ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color={palette.border} linewidth={2} />
    </threeLine>
  )
}

function DrawLine({ player }) {
  const lineRef = useRef()

  useFrame((_, delta) => {
    if (!lineRef.current) return
    if (!player.drawing || player.drawLine.length < 2) {
      lineRef.current.visible = false
      return
    }
    lineRef.current.visible = true
    const points = player.drawLine.map(([c, r]) => {
      const [wx, wy] = gridToWorld(c, r)
      return new THREE.Vector3(wx * 0.1, TILE_HEIGHT + 0.3, wy * 0.1)
    })
    lineRef.current.geometry.setFromPoints(points)
  })

  return (
    <threeLine ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color="#00ffaa" linewidth={3} />
    </threeLine>
  )
}

function PlayerOrb({ player }) {
  const meshRef = useRef()
  const glowRef = useRef()
  const trailRef = useRef()
  const trailPositions = useRef([])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const px = player.x * 0.1
    const pz = player.y * 0.1
    const py = TILE_HEIGHT + 0.8 + Math.sin(clock.elapsedTime * 3) * 0.15

    meshRef.current.position.set(px, py, pz)
    if (glowRef.current) {
      glowRef.current.position.set(px, py, pz)
      const s = 1.3 + Math.sin(clock.elapsedTime * 5) * 0.15
      glowRef.current.scale.set(s, s, s)
    }

    // Motion trail
    trailPositions.current.push(new THREE.Vector3(px, py, pz))
    if (trailPositions.current.length > 15) trailPositions.current.shift()
    if (trailRef.current && trailPositions.current.length > 1) {
      trailRef.current.geometry.setFromPoints(trailPositions.current)
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#00ffee" emissive="#00ffee" emissiveIntensity={2} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.2, 12, 12]} />
        <meshStandardMaterial color="#00ffee" emissive="#00ffee" emissiveIntensity={0.5} transparent opacity={0.25} />
      </mesh>
      <threeLine ref={trailRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#00ffee" transparent opacity={0.4} />
      </threeLine>
    </group>
  )
}

function QixEntity({ qix, palette }) {
  const groupRef = useRef()
  const meshRefs = useRef([])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.position.set(qix.x * 0.1, TILE_HEIGHT + 2, qix.y * 0.1)

    const t = clock.elapsedTime + qix.phase
    for (let i = 0; i < 5; i++) {
      const m = meshRefs.current[i]
      if (m) {
        const angle = t * 2 + (i / 5) * Math.PI * 2
        const r = 1.2 + Math.sin(t * 3 + i) * 0.5
        m.position.set(Math.cos(angle) * r, Math.sin(t * 2 + i) * 0.8, Math.sin(angle) * r)
        const s = 0.6 + Math.sin(t * 4 + i * 1.5) * 0.3
        m.scale.set(s, s, s)
      }
    }
  })

  return (
    <group ref={groupRef}>
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} ref={el => meshRefs.current[i] = el}>
          <dodecahedronGeometry args={[0.8, 1]} />
          <meshStandardMaterial
            color={palette.qix}
            emissive={palette.qix}
            emissiveIntensity={2}
            transparent
            opacity={0.7}
            wireframe={i % 2 === 0}
          />
        </mesh>
      ))}
      <pointLight color={palette.qix} intensity={3} distance={15} />
    </group>
  )
}

function SparxEntity({ sparx }) {
  const groupRef = useRef()
  const legRefs = useRef([])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.position.set(sparx.x * 0.1, TILE_HEIGHT + 0.5, sparx.y * 0.1)

    const t = clock.elapsedTime * 8
    for (let i = 0; i < 6; i++) {
      const leg = legRefs.current[i]
      if (leg) {
        const angle = (i / 6) * Math.PI * 2
        const lift = Math.sin(t + i * 1.2) * 0.2
        leg.position.set(Math.cos(angle) * 0.5, lift, Math.sin(angle) * 0.5)
        leg.rotation.z = Math.sin(t + i) * 0.4
      }
    }
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.4, 8, 6]} />
        <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <mesh key={i} ref={el => legRefs.current[i] = el}>
          <cylinderGeometry args={[0.04, 0.04, 0.5]} />
          <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      <pointLight color="#ffaa00" intensity={0.5} distance={5} />
    </group>
  )
}

function FuseEntity({ state }) {
  const meshRef = useRef()
  const lightRef = useRef()

  useFrame(({ clock }) => {
    const pos = getFuseWorldPos(state)
    if (!pos || !meshRef.current) {
      if (meshRef.current) meshRef.current.visible = false
      return
    }
    meshRef.current.visible = true
    meshRef.current.position.set(pos.x * 0.1, TILE_HEIGHT + 0.5, pos.y * 0.1)
    const s = 0.4 + Math.sin(clock.elapsedTime * 15) * 0.15
    meshRef.current.scale.set(s, s, s)
    if (lightRef.current) {
      lightRef.current.position.set(pos.x * 0.1, TILE_HEIGHT + 1, pos.y * 0.1)
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff6600" emissiveIntensity={3} />
      </mesh>
      <pointLight ref={lightRef} color="#ff4400" intensity={2} distance={8} />
    </group>
  )
}

function Particles({ particles }) {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorArray = useRef(new Float32Array(300 * 3))

  useFrame(() => {
    if (!meshRef.current) return
    const colors = colorArray.current
    let count = Math.min(particles.length, 300)
    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const p = particles[i]
      dummy.position.set(p.x * 0.1, TILE_HEIGHT + 1, p.y * 0.1)
      const scale = p.size * (p.life / p.maxLife)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      color.set(p.color)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    meshRef.current.count = count
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, 300]}>
      <sphereGeometry args={[0.2, 6, 6]} />
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={2} transparent opacity={0.8} />
    </instancedMesh>
  )
}
