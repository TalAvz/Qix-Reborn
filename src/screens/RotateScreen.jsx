import React from 'react'

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000011',
    zIndex: 9999,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#fff',
  },
  icon: {
    width: '60px',
    height: '80px',
    border: '3px solid #00ccff',
    borderRadius: '8px',
    marginBottom: '20px',
    animation: 'rotate-phone 1.5s ease-in-out infinite',
    boxShadow: '0 0 15px rgba(0,200,255,0.4)',
  },
  text: {
    fontSize: '18px',
    color: '#aabbcc',
    letterSpacing: '2px',
  },
}

export default function RotateScreen() {
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes rotate-phone {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(90deg); }
        }
      `}</style>
      <div style={styles.icon} />
      <p style={styles.text}>Rotate your device</p>
    </div>
  )
}
