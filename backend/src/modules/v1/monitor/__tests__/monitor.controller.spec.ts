import type { CreateHttpMonitorDto } from '../dto/requests/create-monitor/create-http-monitor.dto'
import type { UpdateHttpMonitorDto } from '../dto/requests/update-monitor/update-http-monitor.dto'
import { MonitorController } from '../monitor.controller'
import type { MonitorService } from '../monitor.service'

const mockMonitorService = {
  create: vi.fn(),
  findById: vi.fn(),
  findAllByClientId: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const CLIENT_ID = 'client'
const MONITOR_ID = 'monitor'

const mockMonitor = {
  id: MONITOR_ID,
  clientId: CLIENT_ID,
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
    it('should call monitorService.create with clientId and dto', async () => {
      const dto: CreateHttpMonitorDto = {
        name: 'name',
        url: 'https://example.com',
      } as CreateHttpMonitorDto
      mockMonitorService.create.mockResolvedValue(mockMonitor)

      const result = await controller.create(CLIENT_ID, dto)

      expect(mockMonitorService.create).toHaveBeenCalledOnce()
      expect(mockMonitorService.create).toHaveBeenCalledWith(CLIENT_ID, dto)
      expect(result).toEqual(mockMonitor)
    })

    it('should propagate errors from monitorService.create', async () => {
      const dto: CreateHttpMonitorDto = {
        name: 'name',
        url: 'https://example.com',
      } as CreateHttpMonitorDto
      mockMonitorService.create.mockRejectedValue(new Error('Creation failed'))

      await expect(controller.create(CLIENT_ID, dto)).rejects.toThrow('Creation failed')
    })
  })

  describe('findById', () => {
    it('should call monitorService.findById with clientId and id', async () => {
      mockMonitorService.findById.mockResolvedValue(mockMonitor)

      const result = await controller.findById(CLIENT_ID, MONITOR_ID)

      expect(mockMonitorService.findById).toHaveBeenCalledOnce()
      expect(mockMonitorService.findById).toHaveBeenCalledWith(CLIENT_ID, MONITOR_ID)
      expect(result).toEqual(mockMonitor)
    })

    it('should propagate errors when monitor is not found', async () => {
      mockMonitorService.findById.mockRejectedValue(new Error('Monitor not found'))

      await expect(controller.findById(CLIENT_ID, MONITOR_ID)).rejects.toThrow('Monitor not found')
    })
  })

  describe('findAllByClientId', () => {
    it('should call monitorService.findAllByClientId with clientId', async () => {
      const monitors = [mockMonitor, { ...mockMonitor, id: 'monitor-789' }]
      mockMonitorService.findAllByClientId.mockResolvedValue(monitors)

      const result = await controller.findAllByClientId(CLIENT_ID)

      expect(mockMonitorService.findAllByClientId).toHaveBeenCalledOnce()
      expect(mockMonitorService.findAllByClientId).toHaveBeenCalledWith(CLIENT_ID)
      expect(result).toEqual(monitors)
    })

    it('should return an empty array when client has no monitors', async () => {
      mockMonitorService.findAllByClientId.mockResolvedValue([])

      const result = await controller.findAllByClientId(CLIENT_ID)

      expect(result).toEqual([])
    })
  })

  describe('update', () => {
    it('should call monitorService.update with clientId, id, and dto', async () => {
      const dto: UpdateHttpMonitorDto = { name: 'Updated Monitor' } as UpdateHttpMonitorDto
      const updated = { ...mockMonitor, name: 'Updated Monitor' }
      mockMonitorService.update.mockResolvedValue(updated)

      const result = await controller.update(CLIENT_ID, MONITOR_ID, dto)

      expect(mockMonitorService.update).toHaveBeenCalledOnce()
      expect(mockMonitorService.update).toHaveBeenCalledWith(CLIENT_ID, MONITOR_ID, dto)
      expect(result).toEqual(updated)
    })

    it('should propagate errors when update fails', async () => {
      const dto: UpdateHttpMonitorDto = { name: 'Updated Monitor' } as UpdateHttpMonitorDto
      mockMonitorService.update.mockRejectedValue(new Error('Update failed'))

      await expect(controller.update(CLIENT_ID, MONITOR_ID, dto)).rejects.toThrow('Update failed')
    })
  })

  describe('delete', () => {
    it('should call monitorService.delete with clientId and id', async () => {
      mockMonitorService.delete.mockResolvedValue(undefined)

      await controller.delete(CLIENT_ID, MONITOR_ID)

      expect(mockMonitorService.delete).toHaveBeenCalledOnce()
      expect(mockMonitorService.delete).toHaveBeenCalledWith(CLIENT_ID, MONITOR_ID)
    })

    it('should return undefined after successful deletion', async () => {
      mockMonitorService.delete.mockResolvedValue(undefined)

      const result = await controller.delete(CLIENT_ID, MONITOR_ID)

      expect(result).toBeUndefined()
    })

    it('should propagate errors when deletion fails', async () => {
      mockMonitorService.delete.mockRejectedValue(new Error('Delete failed'))

      await expect(controller.delete(CLIENT_ID, MONITOR_ID)).rejects.toThrow('Delete failed')
    })
  })
})
