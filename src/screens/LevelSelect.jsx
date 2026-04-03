import React from 'react'
import { getLevelStars, getMaxUnlockedLevel, getBestPercent } from '../game/storage.js'
import { LEVEL_CONFIGS } from '../game/constants.js'

const styles = {
  container: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'radial-gradient(ellipse at center, #0a0a3e 0%, #000011 100%)',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#fff',
    zIndex: 100,
    pointerEvents: 'all',
    padding: '16px',
    overflowY: 'auto',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#00ccff',
    marginBottom: '16px',
    letterSpacing: '3px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
    maxWidth: '400px',
    width: '100%',
  },
  level: (unlocked) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: unlocked
      ? 'linear-gradient(135deg, rgba(0,100,255,0.2), rgba(0,50,150,0.1))'
      : 'rgba(255,255,255,0.03)',
    border: `1px solid ${unlocked ? 'rgba(0,150,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '8px',
    padding: '10px 4px',
    cursor: unlocked ? 'pointer' : 'default',
    opacity: unlocked ? 1 : 0.4,
    touchAction: 'manipulation',
    transition: 'all 0.2s',
  }),
  levelNum: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
  },
  stars: {
    fontSize: '12px',
    marginTop: '2px',
  },
  pct: {
    fontSize: '9px',
    color: '#668899',
    marginTop: '2px',
  },
  back: {
    marginTop: '16px',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    color: '#aabbcc',
    padding: '8px 24px',
    fontSize: '14px',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
}

export default function LevelSelect({ onSelectLevel, onBack }) {
  const maxUnlocked = getMaxUnlockedLevel()

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Select Level</h2>
      <div style={styles.grid}>
        {LEVEL_CONFIGS.map((cfg, i) => {
          const level = i + 1
          const unlocked = level <= maxUnlocked
          const stars = getLevelStars(level)
          const best = getBestPercent(level)
          return (
            <div
              key={level}
              style={styles.level(unlocked)}
              onClick={() => unlocked && onSelectLevel(i)}
            >
              <span style={styles.levelNum}>{level}</span>
              <span style={styles.stars}>
                {[1, 2, 3].map(s => (
                  <span key={s} style={{ color: s <= stars ? '#ffdd00' : '#333' }}>★</span>
                ))}
              </span>
              {best > 0 && <span style={styles.pct}>{best.toFixed(0)}%</span>}
            </div>
          )
        })}
      </div>
      <button style={styles.back} onClick={onBack}>Back</button>
    </div>
  )
}
