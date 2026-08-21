// 按解题速度计分：单局用时越短，得分越高，鼓励语分档。
// 档位边界：<5s / <10s / <20s / <40s / ≥40s，鼓励语与计分同阈值。

const BANDS = [
  { max: 5, points: 100, praise: 'Incredible!' },
  { max: 10, points: 80, praise: 'Amazing!' },
  { max: 20, points: 60, praise: 'Great job!' },
  { max: 40, points: 40, praise: 'Good job!' },
  { max: Infinity, points: 20, praise: 'Nice try!' },
]

// 返回 { points, praise }
export function getScoreBand(seconds) {
  for (const b of BANDS) {
    if (seconds < b.max) return { points: b.points, praise: b.praise }
  }
  const last = BANDS[BANDS.length - 1]
  return { points: last.points, praise: last.praise }
}

// 用时格式化：保留一位小数，如 12.3s
export function formatSeconds(seconds) {
  return `${(Math.round(seconds * 10) / 10).toFixed(1)}s`
}
