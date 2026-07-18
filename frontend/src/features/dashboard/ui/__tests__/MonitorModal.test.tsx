import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MonitorType } from '@/entities/monitor'

import { useMonitorModal } from '../../model/useMonitorModal'
import { MonitorModal } from '../MonitorModal'

vi.mock('../../model/useMonitorModal', () => ({
  useMonitorModal: vi.fn(),
}))

vi.mock('../SelectField', () => ({
  SelectField: ({
    name,
    label,
    error,
  }: {
    name: string
    label: string
    error?: { message?: string }
  }) => (
    <div data-testid={`select-field-${name}`}>
      <span>{label}</span>
      {error?.message && <span data-testid={`select-field-${name}-error`}>{error.message}</span>}
    </div>
  ),
}))

vi.mock('../../lib/monitor.constants', () => ({
  MONITOR_TYPES: [MonitorType.HTTP, MonitorType.TCP, MonitorType.ICMP, MonitorType.DNS],
}))

vi.mock('../../lib/modal.constants', () => ({
  labelStyle: 'label-style',
  errorStyle: 'error-style',
  inputStyle: () => 'input-style',
  MODAL_INTERVALS: [1, 5, 10],
  MODAL_TIMEOUTS: [1000, 5000],
  MODAL_LABELS: {
    [MonitorType.TCP]: 'host',
    [MonitorType.ICMP]: 'host',
    [MonitorType.DNS]: 'host',
  },
  MODAL_PLACEHOLDERS: {
    [MonitorType.HTTP]: 'https://example.com',
    [MonitorType.TCP]: '10.0.0.1',
    [MonitorType.ICMP]: '8.8.8.8',
    [MonitorType.DNS]: 'example.com',
  },
}))

function mockUseMonitorModal(overrides: Partial<ReturnType<typeof useMonitorModal>> = {}) {
  const base = {
    control: {},
    cancelButtonRef: { current: null },
    setValues: vi.fn(),
    register: vi.fn(() => ({})),
    handleSubmit: (fn: (...args: unknown[]) => unknown) => (e: { preventDefault?: () => void }) => {
      e?.preventDefault?.()
      fn({})
    },
    errors: {},
    clearErrors: vi.fn(),
    type: MonitorType.HTTP,
    onSubmit: vi.fn(),
    isPending: false,
    submitError: null,
  }

  const merged = { ...base, ...overrides }
  vi.mocked(useMonitorModal).mockReturnValue(merged as never)
  return merged
}

async function renderModal(ui: React.ReactElement) {
  const utils = render(ui)
  await act(async () => {
    await Promise.resolve()
  })
  return utils
}

describe('MonitorModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('header', () => {
    it('should show "ADD MONITOR" title when there is no initial.id', async () => {
      mockUseMonitorModal()

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.getByText('ADD MONITOR')).toBeInTheDocument()
    })

    it('should show "EDIT MONITOR" title when initial.id is present', async () => {
      mockUseMonitorModal()

      await renderModal(
        <MonitorModal
          mode="update"
          onClose={onClose}
          initial={{
            id: 'mon_1',
            name: 'x',
            type: MonitorType.HTTP,
            checkInterval: 5,
            timeout: 1000,
          }}
        />,
      )

      expect(screen.getByText('EDIT MONITOR')).toBeInTheDocument()
    })

    it('should call onClose when the close (X) button is clicked', async () => {
      const user = userEvent.setup()
      mockUseMonitorModal()

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      const closeButtons = screen.getAllByRole('button')
      const xButton = closeButtons.find(btn => btn.querySelector('svg.lucide-x'))
      expect(xButton).toBeTruthy()

      await user.click(xButton as HTMLButtonElement)

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('monitor type selector', () => {
    it('should render a button for each monitor type', async () => {
      mockUseMonitorModal()

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.getByRole('button', { name: MonitorType.HTTP })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: MonitorType.TCP })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: MonitorType.ICMP })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: MonitorType.DNS })).toBeInTheDocument()
    })

    it('should call setValues and clearErrors when a monitor type button is clicked', async () => {
      const user = userEvent.setup()
      const { setValues, clearErrors } = mockUseMonitorModal()

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      await user.click(screen.getByRole('button', { name: MonitorType.TCP }))

      expect(setValues).toHaveBeenCalledWith({
        type: MonitorType.TCP,
        url: '',
        host: '',
        port: undefined,
        method: 'HEAD',
      })
      expect(clearErrors).toHaveBeenCalledTimes(1)
    })
  })

  describe('display name field', () => {
    it('should show the name field error when present', async () => {
      mockUseMonitorModal({ errors: { name: { message: 'Name is required' } } as never })

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })

    it('should not show a name error when there is none', async () => {
      mockUseMonitorModal()

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })
  })

  describe('type-conditional fields', () => {
    it('should show the URL field when type is HTTP', async () => {
      mockUseMonitorModal({ type: MonitorType.HTTP })

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument()
    })

    it('should show a host field (not URL) when type is TCP', async () => {
      mockUseMonitorModal({ type: MonitorType.TCP })

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.queryByPlaceholderText('https://example.com')).not.toBeInTheDocument()
      expect(screen.getByPlaceholderText('10.0.0.1')).toBeInTheDocument()
    })

    it('should show a port field only when type is TCP', async () => {
      mockUseMonitorModal({ type: MonitorType.TCP })

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.getByPlaceholderText('5432')).toBeInTheDocument()
    })

    it('should not show a port field when type is ICMP', async () => {
      mockUseMonitorModal({ type: MonitorType.ICMP })

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.queryByPlaceholderText('5432')).not.toBeInTheDocument()
    })

    it('should show a record-type select only when type is DNS', async () => {
      mockUseMonitorModal({ type: MonitorType.DNS })

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.getByTestId('select-field-recordType')).toBeInTheDocument()
    })

    it('should not show a record-type select when type is TCP', async () => {
      mockUseMonitorModal({ type: MonitorType.TCP })

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.queryByTestId('select-field-recordType')).not.toBeInTheDocument()
    })

    it('should show the host field error when present for non-HTTP types', async () => {
      mockUseMonitorModal({
        type: MonitorType.ICMP,
        errors: { host: { message: 'Host is required' } } as never,
      })

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.getByText('Host is required')).toBeInTheDocument()
    })
  })

  describe('interval and timeout selects', () => {
    it('should always render checkInterval and timeout select fields', async () => {
      mockUseMonitorModal()

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.getByTestId('select-field-checkInterval')).toBeInTheDocument()
      expect(screen.getByTestId('select-field-timeout')).toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('should call onSubmit via handleSubmit when the form is submitted', async () => {
      const user = userEvent.setup()
      const { onSubmit } = mockUseMonitorModal()

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      await user.click(screen.getByRole('button', { name: /create monitor/i }))

      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when Cancel is clicked', async () => {
      const user = userEvent.setup()
      mockUseMonitorModal()

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should disable the submit button and show "Create monitor" label when not editing', async () => {
      mockUseMonitorModal({ isPending: false })

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      const submitButton = screen.getByRole('button', { name: /create monitor/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('should show "Save changes" label when editing an existing monitor', async () => {
      mockUseMonitorModal()

      await renderModal(
        <MonitorModal
          mode="update"
          onClose={onClose}
          initial={{
            id: 'mon_1',
            name: 'x',
            type: MonitorType.HTTP,
            checkInterval: 5,
            timeout: 1000,
          }}
        />,
      )

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })

    it('should disable the submit button while isPending is true', async () => {
      mockUseMonitorModal({ isPending: true })

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      const submitButton = screen.getByRole('button', { name: /create monitor/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('submitError', () => {
    it('should display the submitError message when present', async () => {
      mockUseMonitorModal({ submitError: 'Something went wrong' })

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should not display a submitError message when null', async () => {
      mockUseMonitorModal({ submitError: null })

      await renderModal(<MonitorModal mode="create" onClose={onClose} initial={undefined} />)

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })
})
