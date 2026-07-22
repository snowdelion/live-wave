import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'

interface SparkLineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
  className?: string
  showTooltip?: boolean
}

export function SparkLine({
  data,
  color = '#00e676',
  width = 80,
  height = 28,
  className = '',
}: SparkLineProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0)
      return [
        { value: 0, index: 0 },
        { value: 0, index: 1 },
      ]
    if (data.length === 1)
      return [
        { value: data[0], index: 0 },
        { value: data[0], index: 1 },
      ]
    return data.map((value, index) => ({ value, index }))
  }, [data])

  const min = Math.min(...data)
  const max = Math.max(...data)

  return (
    <div className={`w-full chart-no-focus overflow-hidden ${className}`} style={{ height, width }}>
      <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis
            domain={[min - (max - min) * 0.1, max + (max - min) * 0.1]}
            hide={true}
            tick={false}
            axisLine={false}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.9}
            fill={''}
            dot={false}
            activeDot={{ r: 0, fill: 'transparent' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
