'use client'
import { usePulseDots } from '../../model/usePulseDots'

export function HeroDots() {
  const { dotsCoords, shouldShowDots } = usePulseDots()

  return (
    <div
      className={`absolute top-[10%] right-[5%] w-70 h-40 transition-opacity duration-2000 ${shouldShowDots ? 'opacity-50' : 'opacity-0'}`}
    >
      {dotsCoords.map((dot, i) => (
        <div key={i} className="absolute" style={{ left: dot.left, top: dot.top }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] relative">
            <div
              className="absolute -inset-1 rounded-full border border-[#00e676] animate-[ping-dot_2s_ease-in-out_infinite] opacity-0"
              style={{ animationDelay: dot.delay }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
