import 'express'

declare global {
  namespace Express {
    interface User {
      userId: string
      email?: string
      telegramId?: string
    }
  }
}
