import React from 'react'
import { getHighScore } from '../game/storage.js'

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at center, #0a0a3e 0%, #000011 100%)',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#fff',
    zIndex: 999,
    pointerEvents: 'all',
  },
  title: {
    fontSize: '42px',
    fontWeight: 'bold',
    letterSpacing: '6px',
    textTransform: 'uppercase',
    background: 'linear-gradient(180deg, #00ddff, #0066ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
    textShadow: 'none',
    filter: 'drop-shadow(0 0 20px rgba(0,150,255,0.5))',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6688aa',
    marginBottom: '40px',
    letterSpacing: '3px',
  },
  btn: {
    background: 'linear-gradient(135deg, rgba(0,100,255,0.3), rgba(0,200,255,0.1))',
    border: '1px solid rgba(0,150,255,0.5)',
    borderRadius: '8px',
    color: '#00ccff',
    fontSize: '18px',
    fontWeight: 'bold',
    padding: '14px 48px',
    marginBottom: '12px',
    cursor: 'pointer',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    transition: 'all 0.2s',
    touchAction: 'manipulation',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    color: '#aabbcc',
    fontSize: '14px',
    padding: '10px 36px',
    marginBottom: '12px',
    cursor: 'pointer',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    transition: 'all 0.2s',
    touchAction: 'manipulation',
  },
  highScore: {
    fontSize: '12px',
    color: '#556677',
    marginTop: '24px',
  },
}

export default function MainMenu({ onPlay, onLevelSelect }) {
  const highScore = getHighScore()

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Qix Reborn</h1>
      <p style={styles.subtitle}>Claim the grid. Trap the Qix.</p>
      <button style={styles.btn} onClick={onPlay}>Play</button>
      <button style={styles.btnSecondary} onClick={onLevelSelect}>Level Select</button>
      {highScore > 0 && (
        <p style={styles.highScore}>High Score: {highScore.toLocaleString()}</p>
      )}
    </div>
  )
}
