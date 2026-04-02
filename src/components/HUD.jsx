import React from 'react'

const styles = {
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '8px 16px',
    pointerEvents: 'none',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#fff',
    zIndex: 10,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textShadow: '0 0 10px rgba(0,200,255,0.8)',
  },
  label: {
    fontSize: '10px',
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  value: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  lives: {
    display: 'flex',
    gap: '4px',
  },
  heart: {
    width: '14px',
    height: '14px',
    background: '#ff3366',
    borderRadius: '50%',
    boxShadow: '0 0 6px #ff3366',
  },
  heartEmpty: {
    width: '14px',
    height: '14px',
    background: '#333',
    borderRadius: '50%',
  },
  message: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffdd00',
    textShadow: '0 0 20px rgba(255,220,0,0.8), 0 0 40px rgba(255,220,0,0.4)',
    pointerEvents: 'none',
    textAlign: 'center',
    zIndex: 20,
    animation: 'pulse 0.5s ease-in-out infinite alternate',
  },
  progressBar: {
    position: 'absolute',
    bottom: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '200px',
    height: '6px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '3px',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 10,
  },
  progressFill: (pct) => ({
    width: `${Math.min(pct, 100)}%`,
    height: '100%',
    background: 'linear-gradient(90deg, #00ccff, #00ff88)',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
    boxShadow: '0 0 8px rgba(0,200,255,0.6)',
  }),
  progressTarget: (pct) => ({
    position: 'absolute',
    left: `${pct}%`,
    top: '-2px',
    bottom: '-2px',
    width: '2px',
    background: '#ffdd00',
    boxShadow: '0 0 4px #ffdd00',
  }),
  progressLabel: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '10px',
    color: '#aaa',
    pointerEvents: 'none',
    zIndex: 10,
  },
}

export default function HUD({ gameState }) {
  if (!gameState) return null

  return (
    <>
      <div style={styles.container}>
        <div style={styles.stat}>
          <span style={styles.label}>Score</span>
          <span style={styles.value}>{gameState.score.toLocaleString()}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.label}>Level {gameState.levelIndex + 1}</span>
          <div style={styles.lives}>
            {[0, 1, 2].map(i => (
              <div key={i} style={i < gameState.lives ? styles.heart : styles.heartEmpty} />
            ))}
          </div>
        </div>
        <div style={styles.stat}>
          <span style={styles.label}>Combo</span>
          <span style={styles.value}>{gameState.combo > 1 ? `x${gameState.combo}` : '-'}</span>
        </div>
      </div>

      <div style={styles.progressLabel}>
        {gameState.capturedPercent.toFixed(1)}% / {gameState.config.targetPercent}%
      </div>
      <div style={styles.progressBar}>
        <div style={styles.progressFill(gameState.capturedPercent)} />
        <div style={styles.progressTarget(gameState.config.targetPercent)} />
      </div>

      {gameState.message && (
        <div style={styles.message}>{gameState.message}</div>
      )}
    </>
  )
}
