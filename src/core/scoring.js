// 按解题速度计分：单局用时越短，得分越高，鼓励语分档。
// 三档难度各有独立计分表；阈值均为 <5s / <10s / <20s / <40s / ≥40s。

const PRAISE = ['Incredible!', 'Amazing!', 'Great job!', 'Good job!', 'Nice try!']

const TIER_POINTS = {
  easy: [50, 40, 30, 20, 10],
  medium: [100, 80, 60, 40, 20],
  hard: [160, 130, 100, 70, 40],
}

const MAXS = [5, 10, 20, 40, Infinity]

// 返回 { points, praise }
export function getScoreBand(seconds, tier = 'medium') {
  const points = TIER_POINTS[tier] || TIER_POINTS.medium
  for (let i = 0; i < MAXS.length; i++) {
    if (seconds < MAXS[i]) return { points: points[i], praise: PRAISE[i] }
  }
  const last = points.length - 1
  return { points: points[last], praise: PRAISE[last] }
}

// 用时格式化：保留一位小数，如 12.3s
export function formatSeconds(seconds) {
  return `${(Math.round(seconds * 10) / 10).toFixed(1)}s`
}
