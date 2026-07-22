import { act, renderHook } from '@testing-library/react'

import { DnsRecordType, MonitorType, useCreateMonitor, useUpdateMonitor } from '@/entities/monitor'

import { useMonitorModal } from '../useMonitorModal'

vi.mock('@/entities/monitor', async () => {
  const actual = await vi.importActual('@/entities/monitor')
  return {
    ...actual,
    useCreateMonitor: vi.fn(),
    useUpdateMonitor: vi.fn(),
  }
})

let capturedOnValid: ((data: unknown) => void) | undefined
let watchedType: MonitorType = MonitorType.HTTP

vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form')
  return {
    ...actual,
    useForm: () => ({
      control: {},
      watch: () => watchedType,
      setValues: vi.fn(),
      register: vi.fn(),
      formState: { errors: {} },
      clearErrors: vi.fn(),
      handleSubmit: (onValid: (data: unknown) => void) => {
        capturedOnValid = onValid
        return (e: { preventDefault?: () => void }) => {
          e?.preventDefault?.()
        }
      },
    }),
  }
})

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(),
}))

describe('useMonitorModal', () => {
  const onClose = vi.fn()
  const createMutate = vi.fn()
  const updateMutate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnValid = undefined
    watchedType = MonitorType.HTTP

    vi.mocked(useCreateMonitor).mockReturnValue({
      mutate: createMutate,
      isPending: false,
    } as never)

    vi.mocked(useUpdateMonitor).mockReturnValue({
      mutate: updateMutate,
      isPending: false,
    } as never)
  })

  function triggerSubmit(
    result: { current: ReturnType<typeof useMonitorModal> },
    formValues: Record<string, unknown>,
  ) {
    act(() => {
      void result.current.handleSubmit(result.current.onSubmit)({
        preventDefault: vi.fn(),
      } as never)
    })

    expect(capturedOnValid).toBeDefined()

    act(() => {
      capturedOnValid!(formValues)
    })
  }

  describe('isPending', () => {
    it('should be true when create mutation is pending', () => {
      vi.mocked(useCreateMonitor).mockReturnValue({
        mutate: createMutate,
        isPending: true,
      } as never)

      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      expect(result.current.isPending).toBe(true)
    })

    it('should be true when update mutation is pending', () => {
      vi.mocked(useUpdateMonitor).mockReturnValue({
        mutate: updateMutate,
        isPending: true,
      } as never)

      const { result } = renderHook(() => useMonitorModal({ mode: 'edit', onClose } as never))

      expect(result.current.isPending).toBe(true)
    })
  })

  describe('create mode', () => {
    it('should build an HTTP payload and call createMonitor', () => {
      watchedType = MonitorType.HTTP
      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      triggerSubmit(result, {
        name: 'My site',
        checkInterval: 30,
        timeout: 5000,
        type: MonitorType.HTTP,
        url: 'https://example.com',
        method: 'GET',
      })

      expect(createMutate).toHaveBeenCalledWith(
        {
          name: 'My site',
          checkInterval: 30,
          timeout: 5000,
          type: MonitorType.HTTP,
          url: 'https://example.com',
          method: 'GET',
        },
        expect.objectContaining({ onSuccess: onClose, onError: expect.any(Function) }),
      )
    })

    it('should default url to empty string and method to HEAD for HTTP when not provided', () => {
      watchedType = MonitorType.HTTP
      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      triggerSubmit(result, {
        name: 'My site',
        checkInterval: 30,
        timeout: 5000,
        type: MonitorType.HTTP,
      })

      expect(createMutate).toHaveBeenCalledWith(
        expect.objectContaining({ url: '', method: 'HEAD' }),
        expect.anything(),
      )
    })

    it('should build a TCP payload with host and port', () => {
      watchedType = MonitorType.TCP
      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      triggerSubmit(result, {
        name: 'TCP check',
        checkInterval: 10,
        timeout: 3000,
        type: MonitorType.TCP,
        host: '10.0.0.1',
        port: 8080,
      })

      expect(createMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MonitorType.TCP,
          host: '10.0.0.1',
          port: 8080,
        }),
        expect.anything(),
      )
    })

    it('should default port to 0 for TCP when not provided', () => {
      watchedType = MonitorType.TCP
      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      triggerSubmit(result, {
        name: 'TCP check',
        checkInterval: 10,
        timeout: 3000,
        type: MonitorType.TCP,
        host: '10.0.0.1',
      })

      expect(createMutate).toHaveBeenCalledWith(
        expect.objectContaining({ port: 0 }),
        expect.anything(),
      )
    })

    it('should build an ICMP payload with only host', () => {
      watchedType = MonitorType.ICMP
      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      triggerSubmit(result, {
        name: 'Ping check',
        checkInterval: 15,
        timeout: 2000,
        type: MonitorType.ICMP,
        host: '8.8.8.8',
      })

      expect(createMutate).toHaveBeenCalledWith(
        {
          name: 'Ping check',
          checkInterval: 15,
          timeout: 2000,
          type: MonitorType.ICMP,
          host: '8.8.8.8',
        },
        expect.anything(),
      )
    })

    it('should build a DNS payload with host and recordType', () => {
      watchedType = MonitorType.DNS
      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      triggerSubmit(result, {
        name: 'DNS check',
        checkInterval: 20,
        timeout: 4000,
        type: MonitorType.DNS,
        host: 'example.com',
        recordType: DnsRecordType.MX,
      })

      expect(createMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MonitorType.DNS,
          host: 'example.com',
          recordType: DnsRecordType.MX,
        }),
        expect.anything(),
      )
    })

    it('should default recordType to A for DNS when not provided', () => {
      watchedType = MonitorType.DNS
      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      triggerSubmit(result, {
        name: 'DNS check',
        checkInterval: 20,
        timeout: 4000,
        type: MonitorType.DNS,
        host: 'example.com',
      })

      expect(createMutate).toHaveBeenCalledWith(
        expect.objectContaining({ recordType: DnsRecordType.A }),
        expect.anything(),
      )
    })

    it('should not call createMonitor for an unknown monitor type', () => {
      watchedType = 'UNKNOWN' as MonitorType
      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      triggerSubmit(result, {
        name: 'Unknown check',
        checkInterval: 10,
        timeout: 5000,
        type: 'UNKNOWN',
      })

      expect(createMutate).not.toHaveBeenCalled()
    })

    it('should reset submitError to null before submitting', () => {
      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      triggerSubmit(result, {
        name: 'My site',
        checkInterval: 30,
        timeout: 5000,
        type: MonitorType.HTTP,
        url: 'https://example.com',
        method: 'GET',
      })

      expect(result.current.submitError).toBeNull()
    })

    it('should call onClose when createMonitor succeeds', () => {
      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      triggerSubmit(result, {
        name: 'My site',
        checkInterval: 30,
        timeout: 5000,
        type: MonitorType.HTTP,
        url: 'https://example.com',
        method: 'GET',
      })

      const [_, options] = createMutate.mock.calls[0] as any
      act(() => {
        options.onSuccess()
      })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should set submitError with the returned message when createMonitor fails', () => {
      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      triggerSubmit(result, {
        name: 'My site',
        checkInterval: 30,
        timeout: 5000,
        type: MonitorType.HTTP,
        url: 'https://example.com',
        method: 'GET',
      })

      const [_, options] = createMutate.mock.calls[0] as any
      act(() => {
        options.onError({ message: 'Name already taken' })
      })

      expect(result.current.submitError).toBe('Name already taken')
    })

    it('should fall back to a default error message when createMonitor fails without a message', () => {
      const { result } = renderHook(() => useMonitorModal({ mode: 'create', onClose } as never))

      triggerSubmit(result, {
        name: 'My site',
        checkInterval: 30,
        timeout: 5000,
        type: MonitorType.HTTP,
        url: 'https://example.com',
        method: 'GET',
      })

      const [_, options] = createMutate.mock.calls[0] as any
      act(() => {
        options.onError({ message: '' })
      })

      expect(result.current.submitError).toBe('Failed to create monitor')
    })
  })

  describe('edit mode', () => {
    it('should not call updateMonitor when initial.id is missing', () => {
      const { result } = renderHook(() =>
        useMonitorModal({ mode: 'edit', onClose, initial: undefined } as never),
      )

      triggerSubmit(result, {
        name: 'My site',
        checkInterval: 30,
        timeout: 5000,
        type: MonitorType.HTTP,
        url: 'https://example.com',
        method: 'GET',
      })

      expect(updateMutate).not.toHaveBeenCalled()
    })

    it('should call updateMonitor with monitorId and only provided HTTP fields', () => {
      watchedType = MonitorType.HTTP
      const { result } = renderHook(() =>
        useMonitorModal({
          mode: 'edit',
          onClose,
          initial: { id: 'mon_1', type: MonitorType.HTTP } as never,
        } as never),
      )

      triggerSubmit(result, {
        name: 'Updated name',
        checkInterval: 60,
        timeout: 8000,
        type: MonitorType.HTTP,
        url: 'https://updated.com',
        method: 'POST',
      })

      expect(updateMutate).toHaveBeenCalledWith(
        {
          monitorId: 'mon_1',
          body: {
            name: 'Updated name',
            checkInterval: 60,
            timeout: 8000,
            url: 'https://updated.com',
            method: 'POST',
          },
        },
        expect.objectContaining({ onSuccess: onClose, onError: expect.any(Function) }),
      )
    })

    it('should omit url/method from the update payload when not provided', () => {
      watchedType = MonitorType.HTTP
      const { result } = renderHook(() =>
        useMonitorModal({
          mode: 'edit',
          onClose,
          initial: { id: 'mon_1', type: MonitorType.HTTP } as never,
        } as never),
      )

      triggerSubmit(result, {
        name: 'Updated name',
        checkInterval: 60,
        timeout: 8000,
        type: MonitorType.HTTP,
      })

      const [payload] = updateMutate.mock.calls[0] as any
      expect(payload.body).not.toHaveProperty('url')
      expect(payload.body).not.toHaveProperty('method')
    })

    it('should include host/port in the update payload for TCP when provided', () => {
      watchedType = MonitorType.TCP
      const { result } = renderHook(() =>
        useMonitorModal({
          mode: 'edit',
          onClose,
          initial: { id: 'mon_2', type: MonitorType.TCP } as never,
        } as never),
      )

      triggerSubmit(result, {
        name: 'TCP check',
        checkInterval: 10,
        timeout: 3000,
        type: MonitorType.TCP,
        host: '10.0.0.2',
        port: 443,
      })

      expect(updateMutate).toHaveBeenCalledWith(
        {
          monitorId: 'mon_2',
          body: {
            name: 'TCP check',
            checkInterval: 10,
            timeout: 3000,
            host: '10.0.0.2',
            port: 443,
          },
        },
        expect.anything(),
      )
    })

    it('should include host in the update payload for ICMP when provided', () => {
      watchedType = MonitorType.ICMP
      const { result } = renderHook(() =>
        useMonitorModal({
          mode: 'edit',
          onClose,
          initial: { id: 'mon_3', type: MonitorType.ICMP } as never,
        } as never),
      )

      triggerSubmit(result, {
        name: 'Ping check',
        checkInterval: 15,
        timeout: 2000,
        type: MonitorType.ICMP,
        host: '8.8.4.4',
      })

      expect(updateMutate).toHaveBeenCalledWith(
        {
          monitorId: 'mon_3',
          body: {
            name: 'Ping check',
            checkInterval: 15,
            timeout: 2000,
            host: '8.8.4.4',
          },
        },
        expect.anything(),
      )
    })

    it('should include host/recordType in the update payload for DNS when provided', () => {
      watchedType = MonitorType.DNS
      const { result } = renderHook(() =>
        useMonitorModal({
          mode: 'edit',
          onClose,
          initial: { id: 'mon_4', type: MonitorType.DNS } as never,
        } as never),
      )

      triggerSubmit(result, {
        name: 'DNS check',
        checkInterval: 20,
        timeout: 4000,
        type: MonitorType.DNS,
        host: 'example.org',
        recordType: DnsRecordType.TXT,
      })

      expect(updateMutate).toHaveBeenCalledWith(
        {
          monitorId: 'mon_4',
          body: {
            name: 'DNS check',
            checkInterval: 20,
            timeout: 4000,
            host: 'example.org',
            recordType: DnsRecordType.TXT,
          },
        },
        expect.anything(),
      )
    })

    it('should call onClose when updateMonitor succeeds', () => {
      const { result } = renderHook(() =>
        useMonitorModal({
          mode: 'edit',
          onClose,
          initial: { id: 'mon_1', type: MonitorType.HTTP } as never,
        } as never),
      )

      triggerSubmit(result, {
        name: 'Updated name',
        checkInterval: 60,
        timeout: 8000,
        type: MonitorType.HTTP,
        url: 'https://updated.com',
        method: 'POST',
      })

      const [_, options] = updateMutate.mock.calls[0] as any
      act(() => {
        options.onSuccess()
      })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should set submitError with the returned message when updateMonitor fails', () => {
      const { result } = renderHook(() =>
        useMonitorModal({
          mode: 'edit',
          onClose,
          initial: { id: 'mon_1', type: MonitorType.HTTP } as never,
        } as never),
      )

      triggerSubmit(result, {
        name: 'Updated name',
        checkInterval: 60,
        timeout: 8000,
        type: MonitorType.HTTP,
        url: 'https://updated.com',
        method: 'POST',
      })

      const [_, options] = updateMutate.mock.calls[0] as any
      act(() => {
        options.onError({ message: 'Update conflict' })
      })

      expect(result.current.submitError).toBe('Update conflict')
    })

    it('should fall back to a default error message when updateMonitor fails without a message', () => {
      const { result } = renderHook(() =>
        useMonitorModal({
          mode: 'edit',
          onClose,
          initial: { id: 'mon_1', type: MonitorType.HTTP } as never,
        } as never),
      )

      triggerSubmit(result, {
        name: 'Updated name',
        checkInterval: 60,
        timeout: 8000,
        type: MonitorType.HTTP,
        url: 'https://updated.com',
        method: 'POST',
      })

      const [_, options] = updateMutate.mock.calls[0] as any
      act(() => {
        options.onError({ message: '' })
      })

      expect(result.current.submitError).toBe('Failed to update monitor')
    })
  })
})
