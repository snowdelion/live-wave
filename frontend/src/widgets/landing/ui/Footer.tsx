'use client'

import { Activity } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-[#0d120d] border-t border-[rgba(0,230,118,0.08)] py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 hover:opacity-90 active:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-md bg-[#00e676] flex items-center justify-center">
              <Activity size={14} color="#080a08" strokeWidth={2.5} />
            </div>
            <span className="font-barlow font-extrabold text-[1.2rem] tracking-[0.04em] text-[#e8f5e8]">
              LIVEWAVE
            </span>
          </Link>
          <span className="hidden md:inline-block shrink-0 text-sm rounded-full w-1.5 h-1.5 bg-[#00e676] shadow-[0_0_5px_#00e676]" />
          <p className="hidden md:block font-inter text-sm text-[#4caf50] leading-4.5">
            Uptime monitoring
          </p>
        </div>

        <div className="flex items-center justify-center gap-x-6 gap-y-2">
          {SECTIONS.map(({ label, Tag, href, ...props }) => (
            <Tag
              key={label}
              href={href}
              {...props}
              className="font-inter text-sm text-[#4caf50] hover:opacity-90 active:opacity-80 transition-colors"
            >
              {label}
            </Tag>
          ))}
        </div>

        <div className="flex items-center gap-4 text-[0.7rem]">
          <span className="text-[#2e7d32] whitespace-nowrap">© {new Date().getFullYear()}</span>
          <span className="w-px h-4 bg-[#2e7d32]" />
          <div className="flex items-center gap-1.5">
            <span className="inline shrink-0 w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_5px_#00e676]" />
            <span className="font-jet-brains text-[#4caf50] leading-3.5">
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

const SECTIONS = [
  {
    label: 'Features',
    Tag: 'a',
    href: '/#features',
  },
  {
    label: 'Dashboard',
    Tag: Link,
    href: '/dashboard',
  },
  {
    label: 'Telegram',
    Tag: 'a',
    href: 'https://t.me/live_wave_bot',
    rel: 'noopener noreferrer',
    target: '_blank',
  },
]
