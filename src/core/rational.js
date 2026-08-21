// 有理数（分数）四则运算：分子/分母形式，始终约分、分母为正，避免浮点误差。
// 被 solver 与 merge 共用。

export function gcd(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const t = a % b
    a = b
    b = t
  }
  return a || 1
}

// 构造有理数 { n, d }；除零返回 null
export function rat(n, d = 1) {
  if (d === 0) return null
  if (d < 0) {
    n = -n
    d = -d
  }
  const g = gcd(n, d)
  return { n: n / g, d: d / g }
}

export const addRat = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d)
export const subRat = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d)
export const mulRat = (a, b) => rat(a.n * b.n, a.d * b.d)
export const divRat = (a, b) => (b.n === 0 ? null : rat(a.n * b.d, a.d * b.n))

export function formatRat(v) {
  return v.d === 1 ? String(v.n) : `${v.n}/${v.d}`
}

// 判断有理数是否等于整数
export function ratEqInt(v, n) {
  return v.n === n && v.d === 1
}
