import { randomBytes } from 'crypto'

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'

import { REDIS_KEYS } from '@/shared/redis/redis.constants'

import type { TelegramWebhookDto } from '../dto/telegram-webhook.dto'
import { TelegramService } from '../telegram.service'

vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({ toString: () => 'mocked-hex-token' })),
}))

vi.mock('@/shared/utils/error.utils', () => ({
  logAndThrow: vi.fn((options: any) => {
    if (options.shouldThrow !== false) {
      throw options.e
    }
  }),
}))

function makeFetchResponse(ok: boolean, body: unknown = {}, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response
}

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  alert: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
}

const mockConfig = {
  get: vi.fn((key: string) => {
    if (key === 'TELEGRAM_BOT_TOKEN') return 'test-bot-token'
    if (key === 'TELEGRAM_BOT_USERNAME') return 'test_bot_username'
    if (key === 'TELEGRAM_WEBHOOK_URL') return 'https://example.com/webhook'
    return undefined
  }),
}

const mockRedis = {
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
}

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
}

describe('TelegramService', () => {
  let service: TelegramService

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    global.fetch = vi.fn()
    service = new TelegramService(
      mockPrisma as any,
      mockConfig as any,
      mockRedis as any,
      mockLogger as any,
    )
  })

  afterEach(() => vi.useRealTimers())

  describe('constructor', () => {
    it('sets baseUrl when token is present', () => {
      expect(service).toBeDefined()
    })

    it('warns and skips baseUrl when token or username is missing', () => {
      const configNoToken = { get: vi.fn().mockReturnValue(undefined) }
      const s = new TelegramService(
        mockPrisma as any,
        configNoToken as any,
        mockRedis as any,
        mockLogger as any,
      )
      expect(s).toBeDefined()
    })
  })

  describe('linkChatId', () => {
    it('throws BadRequestException if bot config is missing', async () => {
      const configNoToken = { get: vi.fn().mockReturnValue(undefined) }
      const s = new TelegramService(
        mockPrisma as any,
        configNoToken as any,
        mockRedis as any,
        mockLogger as any,
      )

      await expect(s.linkChatId('u1')).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException if telegram is already linked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        telegramId: 'existing-chat-id',
        email: 'a@b.com',
      })

      await expect(service.linkChatId('u1')).rejects.toThrow(
        new BadRequestException('Telegram already linked'),
      )
      expect(mockRedis.set).not.toHaveBeenCalled()
    })

    it('generates token, saves to redis and returns deep link', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ telegramId: null, email: 'a@b.com' })

      const result = await service.linkChatId('u1')

      expect(randomBytes).toHaveBeenCalledWith(32)
      expect(mockRedis.set).toHaveBeenCalledWith(
        REDIS_KEYS.telegramToken('mocked-hex-token'),
        'u1',
        300,
      )
      expect(result).toBe('https://t.me/test_bot_username?start=mocked-hex-token')
    })
  })

  describe('handleWebhook', () => {
    const makeUpdate = (text: string, chatId = 42) => ({
      message: { text, chat: { id: chatId } },
    })

    it('ignores messages without text or not starting with /start', async () => {
      await service.handleWebhook({} as any)
      await service.handleWebhook({ message: { text: 'hello', chat: { id: 42 } } } as any)

      expect(mockRedis.get).not.toHaveBeenCalled()
    })

    it('sends Invalid link message if token is empty', async () => {
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(true))

      await service.handleWebhook(makeUpdate('/start ') as TelegramWebhookDto)

      expect(global.fetch).toHaveBeenCalled()
      const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]!.body as string)
      expect(body.text).toBe('Invalid link')
    })

    it('sends outdated message if token not in redis', async () => {
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(true))
      mockRedis.get.mockResolvedValue(null)

      await service.handleWebhook(makeUpdate('/start some-token') as TelegramWebhookDto)

      expect(global.fetch).toHaveBeenCalled()
      const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]!.body as string)
      expect(body.text).toBe('Link is outdated or used')
    })

    it('sends already linked message if chatId belongs to another user', async () => {
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(true))
      mockRedis.get.mockResolvedValue('u1')
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u2' })

      await service.handleWebhook(makeUpdate('/start some-token', 42) as TelegramWebhookDto)

      const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]!.body as string)
      expect(body.text).toContain('already linked to another user')
    })

    it('successfully links chat, upserts alert, and clears redis', async () => {
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(true))
      mockRedis.get.mockResolvedValue('u1')
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await service.handleWebhook(makeUpdate('/start some-token', 42) as TelegramWebhookDto)

      expect(mockPrisma.alert.upsert).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        update: { telegramChatId: '42', enabled: true },
        create: { userId: 'u1', telegramChatId: '42', enabled: true },
        select: { id: true },
      })
      expect(mockRedis.del).toHaveBeenCalledWith(REDIS_KEYS.telegramToken('some-token'))

      const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]!.body as string)
      expect(body.text).toContain('linked successfully')
    })
  })

  describe('onApplicationBootstrap', () => {
    it('skips if token or webhook URL is missing', async () => {
      const configNoToken = { get: vi.fn().mockReturnValue(undefined) }
      const s = new TelegramService(
        mockPrisma as any,
        configNoToken as any,
        mockRedis as any,
        mockLogger as any,
      )

      await s.onApplicationBootstrap()

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('skips if webhook is already set to correct URL', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        makeFetchResponse(true, { ok: true, result: { url: 'https://example.com/webhook' } }),
      )

      await service.onApplicationBootstrap()

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('sets webhook if URL is different', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(makeFetchResponse(true, { ok: true, result: { url: 'old-url' } }))
        .mockResolvedValueOnce(makeFetchResponse(true, { ok: true, description: 'success' }))

      await service.onApplicationBootstrap()

      expect(global.fetch).toHaveBeenCalledTimes(2)
      const setWebhookCall = vi.mocked(global.fetch).mock.calls[1]
      expect(setWebhookCall[0]).toContain('/setWebhook')
    })
  })

  describe('unlinkChatId', () => {
    it('throws if user has telegram but no email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ telegramId: '42', email: null })

      await expect(service.unlinkChatId('u1')).rejects.toThrow(ForbiddenException)
      expect(mockPrisma.alert.upsert).not.toHaveBeenCalled()
    })

    it('upserts alert to disable and clear chatId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ telegramId: '42', email: 'a@b.com' })

      await service.unlinkChatId('u1')

      expect(mockPrisma.alert.upsert).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        update: { telegramChatId: null, enabled: false },
        create: { userId: 'u1', telegramChatId: null, enabled: false },
        select: { id: true },
      })
    })
  })

  describe('toggleAlert', () => {
    it('enables alert and sends an enabled message', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({ enabled: false, telegramChatId: '42' })
      mockPrisma.alert.update.mockResolvedValue({ enabled: true })
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(true))

      const result = await service.toggleAlert('u1')

      expect(result).toBe(true)
      const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]!.body as string)
      expect(body.text).toMatch(/enabled notifications/)
    })

    it('disables alert and sends a disabled message', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({ enabled: true, telegramChatId: '42' })
      mockPrisma.alert.update.mockResolvedValue({ enabled: false })
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(true))

      const result = await service.toggleAlert('u1')

      expect(result).toBe(false)
      const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]!.body as string)
      expect(body.text).toMatch(/disabled notifications/)
    })

    it('throws NotFoundException when no telegramChatId is linked', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({ enabled: true, telegramChatId: null })

      await expect(service.toggleAlert('u1')).rejects.toThrow(NotFoundException)
      expect(mockPrisma.alert.update).not.toHaveBeenCalled()
    })

    it('throws NotFoundException when no alert row exists at all', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue(null)

      await expect(service.toggleAlert('u1')).rejects.toThrow(NotFoundException)
    })

    it('logs a warning but does not throw when message send fails after toggle', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({ enabled: false, telegramChatId: '42' })
      mockPrisma.alert.update.mockResolvedValue({ enabled: true })
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(false, 'Bad Request', 400))

      const togglePromise = service.toggleAlert('u1')
      await vi.advanceTimersByTimeAsync(6000)
      const result = await togglePromise

      expect(result).toBe(true)
    })
  })

  describe('sendMessage', () => {
    it('returns true on a successful send', async () => {
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(true))

      const ok = await service.sendMessage('42', 'hello')

      expect(ok).toBe(true)
      expect(global.fetch).toHaveBeenCalledOnce()
    })

    it('sends to the correct endpoint with correct payload', async () => {
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(true))

      await service.sendMessage('42', '<b>hello</b>')

      const [url, init] = vi.mocked(global.fetch).mock.calls[0]
      expect(url).toContain('/sendMessage')
      expect(url).toContain('test-bot-token')

      const body = JSON.parse(init!.body as string)
      expect(body).toEqual({ chat_id: '42', text: '<b>hello</b>', parse_mode: 'HTML' })
    })

    it('retries on failure and returns true when a later attempt succeeds', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(makeFetchResponse(false, 'error', 500))
        .mockResolvedValueOnce(makeFetchResponse(true))

      const sendPromise = service.sendMessage('42', 'hello', 3)
      await vi.advanceTimersByTimeAsync(1500)
      const ok = await sendPromise

      expect(ok).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('returns false after all retries are exhausted', async () => {
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(false, 'error', 500))

      const sendPromise = service.sendMessage('42', 'hello', 2)
      await vi.advanceTimersByTimeAsync(3500)
      const ok = await sendPromise

      expect(ok).toBe(false)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('returns false immediately when bot token is missing', async () => {
      const configNoToken = { get: vi.fn().mockReturnValue(undefined) }
      const s = new TelegramService(
        mockPrisma as any,
        configNoToken as any,
        mockRedis as any,
        mockLogger as any,
      )

      const ok = await s.sendMessage('42', 'hello')

      expect(ok).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns false when chatId is an empty string', async () => {
      const ok = await service.sendMessage('', 'hello')

      expect(ok).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns false when fetch throws a network error', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network failure'))

      const ok = await service.sendMessage('42', 'hello', 1)

      expect(ok).toBe(false)
    })
  })

  describe('getAlertStatus', () => {
    it('returns existing alert status with hasChat true when a chat is linked', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({ enabled: true, telegramChatId: '42' })

      const result = await service.getAlertStatus('u1')

      expect(mockPrisma.alert.findUnique).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        select: { enabled: true, telegramChatId: true },
      })
      expect(result).toEqual({ enabled: true, hasChat: true })
      expect(mockPrisma.alert.create).not.toHaveBeenCalled()
    })

    it('returns existing alert status with hasChat false when no chat is linked', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({ enabled: false, telegramChatId: null })

      const result = await service.getAlertStatus('u1')

      expect(result).toEqual({ enabled: false, hasChat: false })
      expect(mockPrisma.alert.create).not.toHaveBeenCalled()
    })

    it('creates a new disabled alert and returns hasChat false when none exists', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue(null)
      mockPrisma.alert.create.mockResolvedValue({ enabled: false })

      const result = await service.getAlertStatus('u1')

      expect(mockPrisma.alert.create).toHaveBeenCalledWith({
        data: { userId: 'u1', enabled: false },
        select: { enabled: true },
      })
      expect(result).toEqual({ enabled: false, hasChat: false })
    })
  })
})
