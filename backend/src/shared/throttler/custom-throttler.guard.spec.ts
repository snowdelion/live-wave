import { ThrottlerException } from '@nestjs/throttler'

import { CustomThrottlerGuard } from './custom-throttler.guard'

describe('CustomThrottlerGuard', () => {
  const guard = new CustomThrottlerGuard({} as any, {} as any, {} as any) as any

  it('throws a ThrottlerException', async () => {
    await expect(guard.throwThrottlingException()).rejects.toThrow(ThrottlerException)
  })

  it('throws with the message "Too many requests"', async () => {
    await expect(guard.throwThrottlingException()).rejects.toThrow('Too many requests')
  })

  it('rejects rather than resolves', async () => {
    await expect(guard.throwThrottlingException()).rejects.toBeInstanceOf(ThrottlerException)
  })
})
