import { render, screen } from '@testing-library/react'
import React from 'react'

import { SparkLine } from './SparkLine'

const { ResponsiveContainerMock, AreaChartMock, YAxisMock, AreaMock } = vi.hoisted(() => ({
  ResponsiveContainerMock: vi.fn(({ children, ...props }) => (
    <div data-testid="responsive-container" {...props}>
      {children}
    </div>
  )),
  AreaChartMock: vi.fn(({ children, ...props }) => (
    <div data-testid="area-chart" {...props}>
      {children}
    </div>
  )),
  YAxisMock: vi.fn(props => <div data-testid="y-axis" {...props} />),
  AreaMock: vi.fn(props => <div data-testid="area" {...props} />),
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ResponsiveContainerMock,
  AreaChart: AreaChartMock,
  YAxis: YAxisMock,
  Area: AreaMock,
}))

describe('SparkLine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default props, classes, and dimensions', () => {
    render(<SparkLine data={[1, 2, 3]} />)

    const container = screen.getByTestId('responsive-container').parentElement
    expect(container).toHaveClass('w-full', 'chart-no-focus', 'overflow-hidden')

    expect(container).toHaveStyle({ height: '28px', width: '80px' })

    expect(ResponsiveContainerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        width: '100%',
        height: '100%',
        initialDimension: { width: 1, height: 1 },
      }),
      undefined,
    )
  })

  it('applies custom className, width, and height', () => {
    render(<SparkLine data={[1]} className="custom-class" width={100} height={50} />)

    const container = screen.getByTestId('responsive-container').parentElement
    expect(container).toHaveClass('custom-class')

    expect(container).toHaveStyle({ height: '50px', width: '100px' })
  })

  it('transforms empty data correctly for AreaChart', () => {
    render(<SparkLine data={[]} />)

    expect(AreaChartMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          { value: 0, index: 0 },
          { value: 0, index: 1 },
        ],
      }),
      undefined,
    )
  })

  it('transforms single-item data correctly for AreaChart', () => {
    render(<SparkLine data={[42]} />)

    expect(AreaChartMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          { value: 42, index: 0 },
          { value: 42, index: 1 },
        ],
      }),
      undefined,
    )
  })

  it('transforms multi-item data correctly for AreaChart', () => {
    render(<SparkLine data={[10, 20, 30]} />)

    expect(AreaChartMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          { value: 10, index: 0 },
          { value: 20, index: 1 },
          { value: 30, index: 2 },
        ],
      }),
      undefined,
    )
  })

  it('passes correct styling and config props to Area component', () => {
    render(<SparkLine data={[1, 2]} color="#ff0000" />)

    expect(AreaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'monotone',
        dataKey: 'value',
        stroke: '#ff0000',
        strokeWidth: 1.9,
        fill: '',
        dot: false,
        activeDot: { r: 0, fill: 'transparent' },
      }),
      undefined,
    )
  })

  it('calculates and passes correct domain to YAxis based on data min/max', () => {
    render(<SparkLine data={[10, 20, 30]} />)

    expect(YAxisMock).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: [8, 32],
        hide: true,
        tick: false,
        axisLine: false,
      }),
      undefined,
    )
  })
})
