import { validate } from './validation'

const validConfig = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  POSTGRES_USER: 'user',
  POSTGRES_PASSWORD: 'password',
  POSTGRES_DB: 'db',
  TELEGRAM_BOT_TOKEN: 'token',
  JWT_ACCESS_SECRET: 'access',
  JWT_REFRESH_SECRET: 'refresh',
}

describe('validate', () => {
  describe('defaults', () => {
    it('defaults PORT to 8000 when omitted', () => {
      const result = validate(validConfig)
      expect(result.PORT).toBe(8000)
    })

    it('defaults FRONTEND_URL when omitted', () => {
      const result = validate(validConfig)
      expect(result.FRONTEND_URL).toBe('http://localhost:3000')
    })

    it('defaults NODE_ENV to "development" when omitted', () => {
      const result = validate(validConfig)
      expect(result.NODE_ENV).toBe('development')
    })
  })

  describe('valid configs', () => {
    it('accepts a minimal valid config and applies defaults', () => {
      const result = validate(validConfig)

      expect(result.PORT).toBe(8000)
      expect(result.FRONTEND_URL).toBe('http://localhost:3000')
      expect(result.NODE_ENV).toBe('development')
      expect(result.DATABASE_URL).toBe(validConfig.DATABASE_URL)
      expect(result.REDIS_URL).toBe(validConfig.REDIS_URL)
      expect(result.POSTGRES_USER).toBe('user')
      expect(result.POSTGRES_PASSWORD).toBe('password')
      expect(result.POSTGRES_DB).toBe('db')
    })

    it('accepts a fully specified valid config', () => {
      const result = validate({
        ...validConfig,
        PORT: '4000',
        FRONTEND_URL: 'https://frontend.com',
        NODE_ENV: 'production',
      })

      expect(result.PORT).toBe(4000)
      expect(result.FRONTEND_URL).toBe('https://frontend.com')
      expect(result.NODE_ENV).toBe('production')
    })

    it('coerces PORT from string to number', () => {
      const result = validate({ ...validConfig, PORT: '3000' })
      expect(result.PORT).toBe(3000)
    })

    it('accepts NODE_ENV of "test"', () => {
      const result = validate({ ...validConfig, NODE_ENV: 'test' })
      expect(result.NODE_ENV).toBe('test')
    })
  })

  describe('required fields', () => {
    it.each(['DATABASE_URL', 'REDIS_URL', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'])(
      'throws when %s is missing',
      field => {
        const { [field as keyof typeof validConfig]: _, ...rest } = validConfig
        expect(() => validate(rest)).toThrow('Environment configuration error')
      },
    )

    it.each(['DATABASE_URL', 'REDIS_URL', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'])(
      'throws when %s is an empty string',
      field => {
        expect(() => validate({ ...validConfig, [field]: '' })).toThrow(
          'Environment configuration error',
        )
      },
    )
  })

  describe('error messages', () => {
    it('includes the field name in the error message', () => {
      const { DATABASE_URL: _, ...rest } = validConfig
      expect(() => validate(rest)).toThrow('DATABASE_URL')
    })

    it('includes all failing fields in a single error', () => {
      expect(() => validate({})).toThrow('Environment configuration error')
    })

    it('reports the custom message for DATABASE_URL', () => {
      expect(() => validate({ ...validConfig, DATABASE_URL: '' })).toThrow('DATABASE_URL required')
    })
  })

  describe('NODE_ENV validation', () => {
    it('throws for an invalid NODE_ENV value', () => {
      expect(() => validate({ ...validConfig, NODE_ENV: 'staging' })).toThrow(
        'Environment configuration error',
      )
    })
  })
})
