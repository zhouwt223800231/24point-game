import { describe, it, expect } from 'vitest'
import { getScoreBand, formatSeconds } from '../core/scoring.js'

describe('scoring 按速度计分', () => {
  it('各档位边界与分值', () => {
    expect(getScoreBand(4.9)).toEqual({ points: 100, praise: 'Incredible!' })
    expect(getScoreBand(5.0)).toEqual({ points: 80, praise: 'Amazing!' })
    expect(getScoreBand(9.9)).toEqual({ points: 80, praise: 'Amazing!' })
    expect(getScoreBand(10.0)).toEqual({ points: 60, praise: 'Great job!' })
    expect(getScoreBand(19.9)).toEqual({ points: 60, praise: 'Great job!' })
    expect(getScoreBand(20.0)).toEqual({ points: 40, praise: 'Good job!' })
    expect(getScoreBand(39.9)).toEqual({ points: 40, praise: 'Good job!' })
    expect(getScoreBand(40.0)).toEqual({ points: 20, praise: 'Nice try!' })
    expect(getScoreBand(120)).toEqual({ points: 20, praise: 'Nice try!' })
    expect(getScoreBand(0)).toEqual({ points: 100, praise: 'Incredible!' })
  })

  it('formatSeconds 保留一位小数', () => {
    expect(formatSeconds(12.34)).toBe('12.3s')
    expect(formatSeconds(5)).toBe('5.0s')
    expect(formatSeconds(0.05)).toBe('0.1s')
  })
})
describe('scoring 三档计分表', () => {
  it('Easy / Medium / Hard 独立计分', () => {
    expect(getScoreBand(4.9, 'easy')).toEqual({ points: 50, praise: 'Incredible!' })
    expect(getScoreBand(10, 'easy')).toEqual({ points: 30, praise: 'Great job!' })
    expect(getScoreBand(40, 'easy')).toEqual({ points: 10, praise: 'Nice try!' })
    expect(getScoreBand(4.9, 'medium')).toEqual({ points: 100, praise: 'Incredible!' })
    expect(getScoreBand(40, 'medium')).toEqual({ points: 20, praise: 'Nice try!' })
    expect(getScoreBand(4.9, 'hard')).toEqual({ points: 160, praise: 'Incredible!' })
    expect(getScoreBand(9.9, 'hard')).toEqual({ points: 130, praise: 'Amazing!' })
    expect(getScoreBand(19.9, 'hard')).toEqual({ points: 100, praise: 'Great job!' })
    expect(getScoreBand(39.9, 'hard')).toEqual({ points: 70, praise: 'Good job!' })
    expect(getScoreBand(40, 'hard')).toEqual({ points: 40, praise: 'Nice try!' })
  })
})
