import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

export function useIsResizing() {
  const [isResizing, setIsResizing] = useState(false)
  const debouncingReset = useDebouncedCallback(() => setIsResizing(false), 150)

  useEffect(() => {
    const handleResize = () => {
      setIsResizing(true)
      debouncingReset()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  })

  return isResizing
}
