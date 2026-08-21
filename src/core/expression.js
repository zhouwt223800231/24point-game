// 表达式模型与求值：4 数字槽 + 3 运算符槽 + 括号位置，递归下降求值。
// 槽位模型：N1 O1 N2 O2 N3 O3 N4
// 括号模型：openBefore[i] 表示第 i 个数字前有 "("，closeAfter[i] 表示第 i 个数字后有 ")"

export const OPERATORS = ['+', '-', '*', '/']

export const OP_SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷' }

export function buildTokens(numbers, ops, openBefore, closeAfter) {
  const tokens = []
  for (let i = 0; i < numbers.length; i++) {
    if (openBefore[i]) tokens.push('(')
    tokens.push(numbers[i])
    if (closeAfter[i]) tokens.push(')')
    if (i < numbers.length - 1) tokens.push(ops[i])
  }
  return tokens
}

export function isComplete(numbers, ops) {
  return numbers.every((n) => n != null) && ops.every((o) => o != null)
}

// 括号序列是否自始至终不为负，且最终闭合
export function parensValid(openBefore, closeAfter) {
  let bal = 0
  for (let i = 0; i < 4; i++) {
    if (openBefore[i]) bal++
    if (closeAfter[i]) {
      bal--
      if (bal < 0) return false
    }
  }
  return bal === 0
}

// 括号序列是否自始至终不为负（允许暂时未闭合，供编辑中状态使用）
export function parensNeverNegative(openBefore, closeAfter) {
  let bal = 0
  for (let i = 0; i < 4; i++) {
    if (openBefore[i]) bal++
    if (closeAfter[i]) {
      bal--
      if (bal < 0) return false
    }
  }
  return true
}

function makeEvaluator(tokens) {
  let pos = 0
  const peek = () => tokens[pos]
  const next = () => tokens[pos++]

  function apply(a, op, b) {
    switch (op) {
      case '+':
        return a + b
      case '-':
        return a - b
      case '*':
        return a * b
      case '/':
        if (b === 0) throw new Error('div by zero')
        return a / b
      default:
        throw new Error('bad operator')
    }
  }

  function parseFactor() {
    const t = peek()
    if (t === '(') {
      next()
      const v = parseExpr()
      if (peek() !== ')') throw new Error('missing close paren')
      next()
      return v
    }
    if (typeof t === 'number') {
      next()
      return t
    }
    throw new Error('unexpected token')
  }

  function parseTerm() {
    let left = parseFactor()
    while (pos < tokens.length && (peek() === '*' || peek() === '/')) {
      const op = next()
      const right = parseFactor()
      left = apply(left, op, right)
    }
    return left
  }

  function parseExpr() {
    let left = parseTerm()
    while (pos < tokens.length && (peek() === '+' || peek() === '-')) {
      const op = next()
      const right = parseTerm()
      left = apply(left, op, right)
    }
    return left
  }

  return {
    run() {
      if (!tokens.length) throw new Error('empty expression')
      const value = parseExpr()
      if (pos !== tokens.length) throw new Error('trailing tokens')
      return value
    },
  }
}

// 求值。返回 { ok: true, value } 或 { ok: false, reason }
export function evaluateExpression(numbers, ops, openBefore, closeAfter) {
  if (!isComplete(numbers, ops)) return { ok: false, reason: 'incomplete' }
  if (!parensValid(openBefore, closeAfter)) return { ok: false, reason: 'parens' }
  const tokens = buildTokens(numbers, ops, openBefore, closeAfter)
  try {
    const value = makeEvaluator(tokens).run()
    return { ok: true, value }
  } catch (e) {
    return { ok: false, reason: e.message }
  }
}
