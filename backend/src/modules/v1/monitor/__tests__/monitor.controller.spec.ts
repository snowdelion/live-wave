import type { CreateMonitorDto } from '../dto/requests/create-monitor.dto'
import type { UpdateMonitorDto } from '../dto/requests/update-monitor.dto'
import { MonitorController } from '../monitor.controller'
import type { MonitorService } from '../monitor.service'

const mockMonitorService = {
  create: vi.fn(),
  findById: vi.fn(),
  findAllByUserId: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const USER_ID = 'user'
const MONITOR_ID = 'monitor'

const mockMonitor = {
  id: MONITOR_ID,
  userId: USER_ID,
  name: 'name',
  url: 'https://example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('MonitorController', () => {
  let controller: MonitorController

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new MonitorController(mockMonitorService as unknown as MonitorService)
  })

  describe('create', () => {
    it('should call monitorService.create with userId and dto', async () => {
      const dto: CreateMonitorDto = {
        name: 'name',
        url: 'https://example.com',
      } as CreateMonitorDto
      mockMonitorService.create.mockResolvedValue(mockMonitor)

      const result = await controller.create(USER_ID, dto)

      expect(mockMonitorService.create).toHaveBeenCalledOnce()
      expect(mockMonitorService.create).toHaveBeenCalledWith(USER_ID, dto)
      expect(result).toEqual(mockMonitor)
    })

    it('should propagate errors from monitorService.create', async () => {
      const dto: CreateMonitorDto = {
        name: 'name',
        url: 'https://example.com',
      } as CreateMonitorDto
      mockMonitorService.create.mockRejectedValue(new Error('Creation failed'))

      await expect(controller.create(USER_ID, dto)).rejects.toThrow('Creation failed')
    })
  })

  describe('findById', () => {
    it('should call monitorService.findById with userId and id', async () => {
      mockMonitorService.findById.mockResolvedValue(mockMonitor)

      const result = await controller.findById(USER_ID, MONITOR_ID)

      expect(mockMonitorService.findById).toHaveBeenCalledOnce()
      expect(mockMonitorService.findById).toHaveBeenCalledWith(USER_ID, MONITOR_ID)
      expect(result).toEqual(mockMonitor)
    })

    it('should propagate errors when monitor is not found', async () => {
      mockMonitorService.findById.mockRejectedValue(new Error('Monitor not found'))

      await expect(controller.findById(USER_ID, MONITOR_ID)).rejects.toThrow('Monitor not found')
    })
  })

  describe('findAllByUserId', () => {
    it('should call monitorService.findAllByUserId with userId', async () => {
      const monitors = [mockMonitor, { ...mockMonitor, id: 'monitor-789' }]
      mockMonitorService.findAllByUserId.mockResolvedValue(monitors)

      const result = await controller.findAllByUserId(USER_ID)

      expect(mockMonitorService.findAllByUserId).toHaveBeenCalledOnce()
      expect(mockMonitorService.findAllByUserId).toHaveBeenCalledWith(USER_ID)
      expect(result).toEqual(monitors)
    })

    it('should return an empty array when user has no monitors', async () => {
      mockMonitorService.findAllByUserId.mockResolvedValue([])

      const result = await controller.findAllByUserId(USER_ID)

      expect(result).toEqual([])
    })
  })

  describe('update', () => {
    it('should call monitorService.update with userId, id, and dto', async () => {
      const dto: UpdateMonitorDto = { name: 'Updated Monitor' } as UpdateMonitorDto
      const updated = { ...mockMonitor, name: 'Updated Monitor' }
      mockMonitorService.update.mockResolvedValue(updated)

      const result = await controller.update(USER_ID, MONITOR_ID, dto)

      expect(mockMonitorService.update).toHaveBeenCalledOnce()
      expect(mockMonitorService.update).toHaveBeenCalledWith(USER_ID, MONITOR_ID, dto)
      expect(result).toEqual(updated)
    })

    it('should propagate errors when update fails', async () => {
      const dto: UpdateMonitorDto = { name: 'Updated Monitor' } as UpdateMonitorDto
      mockMonitorService.update.mockRejectedValue(new Error('Update failed'))

      await expect(controller.update(USER_ID, MONITOR_ID, dto)).rejects.toThrow('Update failed')
    })
  })

  describe('delete', () => {
    it('should call monitorService.delete with userId and id', async () => {
      mockMonitorService.delete.mockResolvedValue(undefined)

      await controller.delete(USER_ID, MONITOR_ID)

      expect(mockMonitorService.delete).toHaveBeenCalledOnce()
      expect(mockMonitorService.delete).toHaveBeenCalledWith(USER_ID, MONITOR_ID)
    })

    it('should return undefined after successful deletion', async () => {
      mockMonitorService.delete.mockResolvedValue(undefined)

      const result = await controller.delete(USER_ID, MONITOR_ID)

      expect(result).toBeUndefined()
    })

    it('should propagate errors when deletion fails', async () => {
      mockMonitorService.delete.mockRejectedValue(new Error('Delete failed'))

      await expect(controller.delete(USER_ID, MONITOR_ID)).rejects.toThrow('Delete failed')
    })
  })
})
