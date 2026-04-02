import React, { useState, useRef, useCallback, useEffect } from 'react'
import GameScene from './components/GameScene.jsx'
import HUD from './components/HUD.jsx'
import MainMenu from './screens/MainMenu.jsx'
import LevelSelect from './screens/LevelSelect.jsx'
import GameOverScreen from './screens/GameOverScreen.jsx'
import LevelCompleteScreen from './screens/LevelCompleteScreen.jsx'
import RotateScreen from './screens/RotateScreen.jsx'
import { createGameState } from './game/engine.js'
import { useTouch } from './game/useTouch.js'

function App() {
  const [screen, setScreen] = useState('menu')
  const [isPortrait, setIsPortrait] = useState(false)
  const [renderTick, setRenderTick] = useState(0)
  const gameStateRef = useRef(null)
  const levelRef = useRef(0)
  const { touchDir, touchCount, active } = useTouch()

  // Lock landscape orientation
  useEffect(() => {
    try {
      window.screen?.orientation?.lock?.('landscape').catch(() => {})
    } catch (e) { /* unsupported */ }
    function checkOrientation() {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    return () => window.removeEventListener('resize', checkOrientation)
  }, [])

  // Force re-render loop for HUD updates
  useEffect(() => {
    if (screen !== 'playing') return
    const id = setInterval(() => setRenderTick(t => t + 1), 100)
    return () => clearInterval(id)
  }, [screen])

  // Check game status for screen transitions
  useEffect(() => {
    if (screen !== 'playing') return
    const id = setInterval(() => {
      const gs = gameStateRef.current
      if (!gs) return
      if (gs.status === 'gameover') setScreen('gameover')
      else if (gs.status === 'levelcomplete') setScreen('levelcomplete')
    }, 200)
    return () => clearInterval(id)
  }, [screen])

  const startLevel = useCallback((levelIndex) => {
    levelRef.current = levelIndex
    gameStateRef.current = createGameState(levelIndex)
    setScreen('playing')
  }, [])

  const handlePlay = useCallback(() => {
    startLevel(0)
  }, [startLevel])

  const handleNextLevel = useCallback(() => {
    startLevel(levelRef.current + 1)
  }, [startLevel])

  const handleRetry = useCallback(() => {
    startLevel(levelRef.current)
  }, [startLevel])

  const handleMenu = useCallback(() => {
    gameStateRef.current = null
    setScreen('menu')
  }, [])

  if (isPortrait) {
    return <RotateScreen />
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {screen === 'menu' && (
        <MainMenu
          onPlay={handlePlay}
          onLevelSelect={() => setScreen('levelselect')}
        />
      )}

      {screen === 'levelselect' && (
        <LevelSelect
          onSelectLevel={startLevel}
          onBack={handleMenu}
        />
      )}

      {(screen === 'playing' || screen === 'gameover' || screen === 'levelcomplete') && (
        <>
          <GameScene
            gameStateRef={gameStateRef}
            touchDir={touchDir}
            touchCount={touchCount}
            renderTick={renderTick}
          />
          <HUD gameState={gameStateRef.current} />
        </>
      )}

      {screen === 'gameover' && (
        <GameOverScreen
          score={gameStateRef.current?.score || 0}
          onRetry={handleRetry}
          onMenu={handleMenu}
        />
      )}

      {screen === 'levelcomplete' && gameStateRef.current && (
        <LevelCompleteScreen
          gameState={gameStateRef.current}
          onNext={handleNextLevel}
          onMenu={handleMenu}
        />
      )}
    </div>
  )
}

export default App
