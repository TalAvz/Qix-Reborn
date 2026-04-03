import React from 'react'

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.85)',
    zIndex: 50,
    pointerEvents: 'all',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#fff',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ff3366',
    marginBottom: '8px',
    letterSpacing: '4px',
    textShadow: '0 0 20px rgba(255,50,100,0.6)',
  },
  score: {
    fontSize: '18px',
    color: '#aabbcc',
    marginBottom: '24px',
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

export default function GameOverScreen({ score, onRetry, onMenu }) {
  return (
    <div style={styles.overlay}>
      <h2 style={styles.title}>Game Over</h2>
      <p style={styles.score}>Score: {score.toLocaleString()}</p>
      <button style={styles.btn} onClick={onRetry}>Retry</button>
      <button style={{ ...styles.btn, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)', color: '#aabbcc' }} onClick={onMenu}>Menu</button>
    </div>
  )
}
