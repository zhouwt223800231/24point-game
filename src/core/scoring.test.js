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
