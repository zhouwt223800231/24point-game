// Hard 档手牌生成：整数牌面，但解必须引入分数/小数中间步。
// 判定谓词：可解 且 不存在全整数中间值解（hasSolution + !integerOnly）。
import { hasSolution } from './solver.js'

// 必须分数步判定
export function isFractionRequired(hand, target = 24) {
  return hasSolution(hand, target) && !hasSolution(hand, target, { integerOnly: true })
}

function gcd(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const t = a % b
    a = b
    b = t
  }
  return a || 1
}

// 构造法：c ÷ (d − a/b) = 24 或 c ÷ (a/b − d) = 24，解出 a/b 约分后 a,b≤10 且 b>1
function computeConstructive(target) {
  const out = new Map()
  for (const shape of [1, 2]) {
    for (let c = 1; c <= 10; c++) {
      for (let d = 1; d <= 10; d++) {
        const num = shape === 1 ? d * target - c : d * target + c
        const den = target
        const g = gcd(num, den)
        const a = num / g
        const b = den / g
        if (a <= 10 && b <= 10 && b > 1 && a !== b) {
          const hand = [a, b, c, d].sort((x, y) => x - y)
          const key = hand.join(',')
          if (!out.has(key) && isFractionRequired(hand, target)) out.set(key, hand)
        }
      }
    }
  }
  return [...out.values()]
}

let _constructive24 = null
export function constructiveCandidates(target = 24) {
  if (target === 24) {
    if (!_constructive24) _constructive24 = computeConstructive(24)
    return _constructive24
  }
  return computeConstructive(target)
}

// 已验证的"必须分数步"兜底手牌（离线搜索 + 同一谓词验证）
export const HARD_FALLBACK_POOL = [
  [4, 4, 7, 7],
  [1, 3, 4, 6],
  [1, 4, 5, 6],
  [3, 3, 8, 8],
  [2, 5, 5, 10],
  [1, 5, 5, 5],
  [2, 4, 10, 10],
  [2, 7, 7, 10],
  [1, 6, 6, 8],
  [3, 3, 7, 7],
]

// 发一副 Hard 可解手牌：先随机抽样（≤40 次，增加多样性），失败后从"构造法+兜底池"合并池选（保证可发）
export function makeHardHand(target = 24, rand = Math.random) {
  for (let i = 0; i < 40; i++) {
    const hand = [0, 1, 2, 3].map(() => 1 + Math.floor(rand() * 10))
    if (isFractionRequired(hand, target)) return hand
  }
  const pool = [...constructiveCandidates(target), ...HARD_FALLBACK_POOL]
  return [...pool[Math.floor(rand() * pool.length)]]
}

