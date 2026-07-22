import { describe, it, expect } from 'vitest'

import { MonitorType } from '@/entities/monitor'

import { urlRefine, formatTime, getUptimeColor, getResponseColor } from './dashboard.utils'

describe('dashboard.utils', () => {
  describe('urlRefine', () => {
    it('returns true for valid URLs', () => {
      expect(urlRefine('https://example.com')).toBe(true)
      expect(urlRefine('http://localhost:3000')).toBe(true)
      expect(urlRefine('https://sub.domain.com/path?query=1#hash')).toBe(true)
      expect(urlRefine('ftp://files.example.com')).toBe(true)
    })

    it('returns false for invalid URLs', () => {
      expect(urlRefine('')).toBe(false)
      expect(urlRefine('not-a-url')).toBe(false)
      expect(urlRefine('example.com')).toBe(false)
      expect(urlRefine('http://')).toBe(false)
      expect(urlRefine('   ')).toBe(false)
    })
  })

  describe('formatTime', () => {
    it('formats seconds correctly', () => {
      expect(formatTime(0)).toBe('0s ago')
      expect(formatTime(-10)).toBe('0s ago')
      expect(formatTime(59)).toBe('59s ago')
    })

    it('formats minutes correctly', () => {
      expect(formatTime(60)).toBe('1m ago')
      expect(formatTime(125)).toBe('2m ago')
      expect(formatTime(3599)).toBe('59m ago')
    })

    it('formats hours correctly', () => {
      expect(formatTime(3600)).toBe('1h ago')
      expect(formatTime(7200)).toBe('2h ago')
      expect(formatTime(86399)).toBe('23h ago')
    })

    it('formats days correctly', () => {
      expect(formatTime(86400)).toBe('1d ago')
      expect(formatTime(172800)).toBe('2d ago')
      expect(formatTime(604799)).toBe('6d ago')
    })

    it('formats weeks correctly', () => {
      expect(formatTime(604800)).toBe('1w ago')
      expect(formatTime(1209600)).toBe('2w ago')
      expect(formatTime(2591999)).toBe('4w ago')
    })

    it('formats months correctly', () => {
      expect(formatTime(2592000)).toBe('1mo ago')
      expect(formatTime(5184000)).toBe('2mo ago')
      expect(formatTime(31535999)).toBe('12mo ago')
    })

    it('formats years correctly', () => {
      expect(formatTime(31536000)).toBe('1y ago')
      expect(formatTime(63071999)).toBe('1y ago')
    })

    it('returns "Never checked" for very large values', () => {
      expect(formatTime(63072000)).toBe('Never checked')
      expect(formatTime(100000000)).toBe('Never checked')
    })
  })

  describe('getUptimeColor', () => {
    it('returns default color for null, 0, or falsy values', () => {
      expect(getUptimeColor(null)).toBe('#e8f5e8')
      expect(getUptimeColor(0)).toBe('#e8f5e8')
    })

    it('returns green for uptime >= 99.5', () => {
      expect(getUptimeColor(99.5)).toBe('#00e676')
      expect(getUptimeColor(99.9)).toBe('#00e676')
      expect(getUptimeColor(100)).toBe('#00e676')
    })

    it('returns yellow for uptime >= 98 and < 99.5', () => {
      expect(getUptimeColor(98)).toBe('#ffd740')
      expect(getUptimeColor(99.4)).toBe('#ffd740')
    })

    it('returns red for uptime < 98', () => {
      expect(getUptimeColor(97.9)).toBe('#f44336')
      expect(getUptimeColor(50)).toBe('#f44336')
      expect(getUptimeColor(1)).toBe('#f44336')
    })
  })

  describe('getResponseColor', () => {
    it('returns red if the monitor is down, regardless of avg', () => {
      expect(getResponseColor(MonitorType.HTTP, 10, true)).toBe('#f44336')
      expect(getResponseColor(MonitorType.TCP, 5000, true)).toBe('#f44336')
      expect(getResponseColor(MonitorType.DNS, null, true)).toBe('#f44336')
    })

    it('returns default green if avg is null and monitor is up', () => {
      expect(getResponseColor(MonitorType.HTTP, null, false)).toBe('#4caf50')
      expect(getResponseColor(MonitorType.TCP, null, false)).toBe('#4caf50')
    })

    it('evaluates HTTP thresholds correctly (ok: 500, warn: 1000)', () => {
      expect(getResponseColor(MonitorType.HTTP, 500, false)).toBe('#e8f5e8')
      expect(getResponseColor(MonitorType.HTTP, 501, false)).toBe('#ffd740')
      expect(getResponseColor(MonitorType.HTTP, 1000, false)).toBe('#ffd740')
      expect(getResponseColor(MonitorType.HTTP, 1001, false)).toBe('#f44336')
    })

    it('evaluates TCP thresholds correctly (ok: 100, warn: 300)', () => {
      expect(getResponseColor(MonitorType.TCP, 100, false)).toBe('#e8f5e8')
      expect(getResponseColor(MonitorType.TCP, 101, false)).toBe('#ffd740')
      expect(getResponseColor(MonitorType.TCP, 300, false)).toBe('#ffd740')
      expect(getResponseColor(MonitorType.TCP, 301, false)).toBe('#f44336')
    })

    it('evaluates ICMP thresholds correctly (ok: 100, warn: 300)', () => {
      expect(getResponseColor(MonitorType.ICMP, 100, false)).toBe('#e8f5e8')
      expect(getResponseColor(MonitorType.ICMP, 200, false)).toBe('#ffd740')
      expect(getResponseColor(MonitorType.ICMP, 301, false)).toBe('#f44336')
    })

    it('evaluates DNS thresholds correctly (ok: 100, warn: 300)', () => {
      expect(getResponseColor(MonitorType.DNS, 100, false)).toBe('#e8f5e8')
      expect(getResponseColor(MonitorType.DNS, 200, false)).toBe('#ffd740')
      expect(getResponseColor(MonitorType.DNS, 301, false)).toBe('#f44336')
    })
  })
})
