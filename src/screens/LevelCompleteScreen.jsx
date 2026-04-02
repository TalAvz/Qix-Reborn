import React from 'react'

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,10,0.85)',
    zIndex: 50,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#fff',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ffdd00',
    marginBottom: '8px',
    letterSpacing: '4px',
    textShadow: '0 0 20px rgba(255,220,0,0.6)',
  },
  stats: {
    fontSize: '14px',
    color: '#aabbcc',
    marginBottom: '12px',
    textAlign: 'center',
    lineHeight: '1.8',
  },
  stars: {
    fontSize: '36px',
    marginBottom: '20px',
  },
  btn: {
    background: 'linear-gradient(135deg, rgba(0,100,255,0.3), rgba(0,200,255,0.1))',
    border: '1px solid rgba(0,150,255,0.5)',
    borderRadius: '8px',
    color: '#00ccff',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '12px 36px',
    marginBottom: '10px',
    cursor: 'pointer',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    touchAction: 'manipulation',
  },
}

export default function LevelCompleteScreen({ gameState, onNext, onMenu }) {
  const pct = gameState.capturedPercent
  const target = gameState.config.targetPercent
  let stars = 1
  if (pct >= target + 15) stars = 3
  else if (pct >= target + 7) stars = 2

  return (
    <div style={styles.overlay}>
      <h2 style={styles.title}>Level Complete!</h2>
      <div style={styles.stars}>
        {[1, 2, 3].map(s => (
          <span key={s} style={{ color: s <= stars ? '#ffdd00' : '#333', textShadow: s <= stars ? '0 0 10px rgba(255,220,0,0.5)' : 'none' }}>★</span>
        ))}
      </div>
      <div style={styles.stats}>
        Captured: {pct.toFixed(1)}%<br />
        Score: {gameState.score.toLocaleString()}
      </div>
      <button style={styles.btn} onClick={onNext}>Next Level</button>
      <button style={{ ...styles.btn, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)', color: '#aabbcc' }} onClick={onMenu}>Menu</button>
    </div>
  )
}
