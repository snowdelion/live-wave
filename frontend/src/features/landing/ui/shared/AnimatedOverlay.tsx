'use client'
import { useInView } from '../../model/useInView'

export function AnimatedOverlay({ className = '' }: AnimatedOverlayProps) {
  const { ref, isInView } = useInView()

  return (
    <div
      ref={ref}
      className={`absolute inset-0 z-10 bg-[#080a08] transition-opacity duration-1000 pointer-events-none ${
        isInView ? 'opacity-0' : 'opacity-100'
      } ${className}`}
    />
  )
}

interface AnimatedOverlayProps {
  className?: string
}
