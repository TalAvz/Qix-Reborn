const STORAGE_KEY = 'qix_reborn_save'

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return data || defaultData()
  } catch {
    return defaultData()
  }
}

function defaultData() {
  return {
    highScore: 0,
    levelStars: {},
    achievements: [],
    bestPercent: {},
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getHighScore() { return load().highScore }
export function setHighScore(score) {
  const d = load(); d.highScore = Math.max(d.highScore, score); save(d)
}

export function getLevelStars(level) { return load().levelStars[level] || 0 }
export function setLevelStars(level, stars) {
  const d = load()
  d.levelStars[level] = Math.max(d.levelStars[level] || 0, stars)
  save(d)
}

export function getMaxUnlockedLevel() {
  const d = load()
  let max = 1
  for (const k of Object.keys(d.levelStars)) {
    if (d.levelStars[k] > 0) max = Math.max(max, parseInt(k) + 1)
  }
  return Math.min(max, 20)
}

export function getAchievements() { return load().achievements }
export function addAchievement(id) {
  const d = load()
  if (!d.achievements.includes(id)) {
    d.achievements.push(id)
    save(d)
    return true
  }
  return false
}

export function getBestPercent(level) { return load().bestPercent[level] || 0 }
export function setBestPercent(level, pct) {
  const d = load()
  d.bestPercent[level] = Math.max(d.bestPercent[level] || 0, pct)
  save(d)
}
