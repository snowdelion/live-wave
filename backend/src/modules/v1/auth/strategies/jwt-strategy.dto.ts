import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { Logger } from '@/shared/logger/logger.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(baseLogger: Logger, config: ConfigService) {
    const logger = baseLogger.child({ context: JwtStrategy.name })
    const secret = config.get<string>('JWT_ACCESS_SECRET')
    if (!secret) {
      logger.error('JWT_ACCESS_SECRET is not set in environment variables')
      throw new Error('JWT_ACCESS_SECRET is required')
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    })
  }

  async validate(payload: { sub: string; email?: string; telegramId: string | null }) {
    return { userId: payload.sub, email: payload.email, telegramId: payload.telegramId }
  }
}
