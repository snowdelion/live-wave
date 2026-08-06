import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from 'react-responsive'

export function useInView() {
  const ref = useRef<HTMLElement | null>(null)
  const [isInView, setIsInView] = useState(false)

  const isMobile = useMediaQuery({ maxWidth: 639 })
  const isTablet = useMediaQuery({ minWidth: 640, maxWidth: 1023 })

  useEffect(() => {
    const getOptions = () => {
      if (isMobile) return { threshold: 0.1 }
      if (isTablet) return { threshold: 0.2 }
      return { threshold: 0.3 }
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setIsInView(true)
        observer.unobserve(entry.target)
      }
    }, getOptions())

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [isMobile, isTablet])

  return { isInView, ref }
}
