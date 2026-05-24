import { vi } from 'vitest'

vi.mock('@nestjs/config', () => ({
  ConfigService: vi.fn().mockImplementation(() => ({
    get: vi.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return 'test-access-secret'
      if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m'
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d'
    }),
  })),
}))

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed'),
    compare: vi.fn().mockResolvedValue(true),
  },
}))
