// Hard 档判定函数：整数牌面但解必须引入分数/小数中间步。
import { hasSolution } from './solver.js'

// 必须分数步判定：可解 且 不存在全整数中间值解
export function isFractionRequired(hand, target = 24) {
  return hasSolution(hand, target) && !hasSolution(hand, target, { integerOnly: true })
}
