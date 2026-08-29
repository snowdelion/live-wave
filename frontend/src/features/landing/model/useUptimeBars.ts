import { useEffect, useMemo, useState } from 'react'
import { useMediaQuery } from 'react-responsive'

const TOTAL_BARS = 90
const INCIDENT_PROBABILITY = 0.08

function generateBars(): UptimeBar[] {
  return Array.from({ length: TOTAL_BARS }, (_, i) => {
    const ok = Math.random() > INCIDENT_PROBABILITY
    return {
      id: i,
      ok,
      height: ok ? 100 : Math.floor(Math.random() * 40 + 10),
    }
  })
}

function getBarsLength(isMobile: boolean, isLargeMobile: boolean, isSmallTablet: boolean): number {
  if (isMobile) return 30
  if (isLargeMobile) return 40
  if (isSmallTablet) return 60
  return 90
}

export function useUptimeBars() {
  const isMobile = useMediaQuery({ maxWidth: 500 })
  const isLargeMobile = useMediaQuery({ minWidth: 501, maxWidth: 639 })
  const isSmallTablet = useMediaQuery({ minWidth: 640, maxWidth: 767 })

  const fullBars = useMemo(() => generateBars(), [])

  const [uptimeBars, setUptimeBars] = useState<UptimeBar[]>([])
  const [uptimePercentage, setUptimePercentage] = useState<string | null>(null)

  useEffect(() => {
    const length = getBarsLength(isMobile, isLargeMobile, isSmallTablet)
    const sliced = fullBars.slice(0, length)
    setUptimeBars(sliced)

    const upDays = sliced.filter(bar => bar.ok).length
    setUptimePercentage(((upDays / sliced.length) * 100).toFixed(2))
  }, [fullBars, isMobile, isLargeMobile, isSmallTablet])

  return { uptimeBars, uptimePercentage }
}

interface UptimeBar {
  ok: boolean
  height: number
  id: number
}
