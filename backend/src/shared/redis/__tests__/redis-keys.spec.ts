import { REDIS_KEYS } from '../redis-keys.constants'

describe('REDIS_KEYS', () => {
  describe('session', () => {
    it('produces the correct key for a client ID', () => {
      expect(REDIS_KEYS.session('abc-123')).toBe('live-wave:session:abc-123')
    })
  })

  describe('ipSession', () => {
    it('produces the correct key for an IP address', () => {
      expect(REDIS_KEYS.ipSession('192.168.1.1')).toBe('live-wave:ip:session:192.168.1.1')
    })

    it('handles an IPv6 address', () => {
      expect(REDIS_KEYS.ipSession('::1')).toBe('live-wave:ip:session:::1')
    })
  })

  describe('telegramToClient', () => {
    it('produces the correct key for a numeric chat ID', () => {
      expect(REDIS_KEYS.telegramToClient(123456789)).toBe(
        'live-wave:telegram:chat-to-client:123456789',
      )
    })

    it('produces the correct key for a string chat ID', () => {
      expect(REDIS_KEYS.telegramToClient('123456789')).toBe(
        'live-wave:telegram:chat-to-client:123456789',
      )
    })

    it('handles negative chat IDs (group/channel)', () => {
      expect(REDIS_KEYS.telegramToClient(-100123456789)).toBe(
        'live-wave:telegram:chat-to-client:-100123456789',
      )
    })
  })

  describe('telegramCode', () => {
    it('produces the correct key for a verification code', () => {
      expect(REDIS_KEYS.telegramCode('855295')).toBe('live-wave:telegram:code:855295')
    })
  })

  describe('key uniqueness', () => {
    it('different factories do not produce colliding keys for the same input', () => {
      const id = 'same-value'
      const keys = [
        REDIS_KEYS.session(id),
        REDIS_KEYS.ipSession(id),
        REDIS_KEYS.telegramToClient(id),
        REDIS_KEYS.telegramCode(id),
      ]
      expect(new Set(keys).size).toBe(keys.length)
    })
  })
})
