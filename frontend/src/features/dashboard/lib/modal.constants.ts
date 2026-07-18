import { MonitorType } from '@/entities/monitor'

export const MODAL_INTERVALS = [1, 5, 10, 20, 30, 40, 50, 60]
export const MODAL_TIMEOUTS = [5000, 10000, 20000, 30000]

export const MODAL_PLACEHOLDERS: Record<MonitorType, string> = {
  [MonitorType.HTTP]: 'https://api.example.com/health',
  [MonitorType.TCP]: 'db.example.com:5432',
  [MonitorType.ICMP]: '192.168.1.1',
  [MonitorType.DNS]: 'www.example.com',
}

export const MODAL_LABELS: Record<MonitorType, string> = {
  [MonitorType.HTTP]: 'URL',
  [MonitorType.TCP]: 'Host',
  [MonitorType.ICMP]: 'IP / Host',
  [MonitorType.DNS]: 'Host',
}

export const inputStyle = (hasErr: boolean) =>
  `appearance-none w-full box-border font-jet-brains text-[0.85rem] text-[#e8f5e8] bg-[#080a08] border rounded-md py-[0.6rem] px-[0.9rem] outline-none transition-color duration-200 ${hasErr ? 'border-[#f44336]' : 'border-[rgb(0,230,118)]/15'}`
export const labelStyle =
  'font-jet-brains text-[0.68rem] text-[#2e7d32] tracking-widest block mb-[0.4rem]'
export const errorStyle = 'font-inter text-[0.72rem] text-[#f44336] mt-[0.3rem]'
