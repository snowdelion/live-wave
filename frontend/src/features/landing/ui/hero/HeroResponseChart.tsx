'use client'
import { useWaveCanvas } from '../../model/useWaveCanvas'

export function HeroResponseChart() {
  const { canvasRef } = useWaveCanvas()

  return (
    <div className="relative z-10 w-full max-w-215 mt-16 border border-[rgba(0,230,118,0.12)] rounded-lg bg-[#0d120d] overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[rgba(0,230,118,0.08)]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1b2e1b]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#1b2e1b]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#1b2e1b]" />
        </div>
        <span className="font-jet-brains text-[0.72rem] text-[#4caf50]">Response time (ms)</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_5px_#00e676]" />
          <span className="font-jet-brains text-[0.72rem] text-[#00e676]">LIVE</span>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-30 block" />
    </div>
  )
}
