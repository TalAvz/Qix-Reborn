export function vibrateCapture() {
  if (navigator.vibrate) navigator.vibrate([30, 20, 30])
}

export function vibrateDeath() {
  if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200])
}

export function vibrateLevelComplete() {
  if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50, 30, 100])
}
