import { TelegramService } from '../telegram.service'

// --- helpers ---
function makeFetchResponse(ok: boolean, body: unknown = {}) {
  return {
    ok,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response
}

// --- mocks ---
const mockPrisma = {
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
    return undefined
  }),
}

// --- tests ---
describe('TelegramService', () => {
  let service: TelegramService

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    global.fetch = vi.fn()
    service = new TelegramService(mockPrisma as any, mockConfig as any)
  })

  afterEach(() => vi.useRealTimers())

  describe('constructor', () => {
    it('sets baseUrl when token is present', () => {
      expect(service).toBeDefined()
    })

    it('warns and skips baseUrl when token is missing', () => {
      const configNoToken = { get: vi.fn().mockReturnValue(undefined) }
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const s = new TelegramService(mockPrisma as any, configNoToken as any)

      expect(s).toBeDefined()
      warnSpy.mockRestore()
    })
  })

  describe('linkChatId', () => {
    it('sends a link message and upserts the alert', async () => {
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(true))
      const upsertResult = { userId: 'u1', telegramChatId: '42', enabled: true }
      mockPrisma.alert.upsert.mockResolvedValue(upsertResult)

      const result = await service.linkChatId('u1', '42')

      expect(global.fetch).toHaveBeenCalledOnce()
      const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]!.body as string)
      expect(body.chat_id).toBe('42')
      expect(body.text).toMatch(/successfully linked Telegram/)

      expect(mockPrisma.alert.upsert).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        update: { telegramChatId: '42', enabled: true },
        create: { userId: 'u1', telegramChatId: '42', enabled: true },
      })
      expect(result).toEqual(upsertResult)
    })

    it('throws when the bot cannot send the link message', async () => {
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(false, 'Forbidden'))

      const linkPromise = service.linkChatId('u1', '42')
      const assertion = expect(linkPromise).rejects.toThrow(/can't send you a message/)
      await vi.advanceTimersByTimeAsync(3000)
      await assertion
      expect(mockPrisma.alert.upsert).not.toHaveBeenCalled()
    })
  })

  describe('unlinkChatId', () => {
    it('updates alert for the user', async () => {
      mockPrisma.alert.update.mockResolvedValue({ telegramChatId: null })

      await service.unlinkChatId('u1')

      expect(mockPrisma.alert.update).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: { enabled: false, telegramChatId: null },
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

    it('throws when no alert exists (missing telegramChatId)', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({ enabled: true, telegramChatId: null })

      await expect(service.toggleAlert('u1')).rejects.toThrow()
      expect(mockPrisma.alert.update).not.toHaveBeenCalled()
    })

    it('throws when no alert row exists at all', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue(null)

      await expect(service.toggleAlert('u1')).rejects.toThrow()
    })

    it('logs a warning but does not throw when message send fails after toggle', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({ enabled: false, telegramChatId: '42' })
      mockPrisma.alert.update.mockResolvedValue({ enabled: true })
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(false, 'Bad Request'))

      const togglePromise = service.toggleAlert('u1')
      await vi.advanceTimersByTimeAsync(3000)
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
        .mockResolvedValueOnce(makeFetchResponse(false, 'error'))
        .mockResolvedValueOnce(makeFetchResponse(true))

      const sendPromise = service.sendMessage('42', 'hello', 3)
      await vi.advanceTimersByTimeAsync(1000)
      const ok = await sendPromise

      expect(ok).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('returns false after all retries are exhausted', async () => {
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(false, 'error'))

      const sendPromise = service.sendMessage('42', 'hello', 2)
      await vi.advanceTimersByTimeAsync(1000)
      const ok = await sendPromise

      expect(ok).toBe(false)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('returns false immediately when bot token is missing', async () => {
      const configNoToken = { get: vi.fn().mockReturnValue(undefined) }
      const s = new TelegramService(mockPrisma as any, configNoToken as any)

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
