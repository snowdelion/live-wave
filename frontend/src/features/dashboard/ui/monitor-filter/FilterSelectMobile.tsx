import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import { Fragment } from 'react'

import type { MonitorType } from '@/entities/monitor'

interface FilterSelectMobileProps {
  value: MonitorType | 'ALL'
  options: (MonitorType | 'ALL')[]
  onChange: (value: string) => void
}

export function FilterSelectMobile({ value, options, onChange }: FilterSelectMobileProps) {
  const current = options.find(o => o === value) || options[0]

  return (
    <div className="relative w-full sm:w-45">
      <Listbox value={value} onChange={onChange}>
        <ListboxButton className="relative w-full py-2.5 pl-3 bg-[#0d120d] border border-[rgba(0,230,118,0.12)] rounded-md cursor-pointer text-start">
          <span className="block truncate font-jet-brains text-[0.7rem] text-[#4caf50]">
            {current}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown size={14} color="#2e7d32" />
          </span>
        </ListboxButton>

        <Transition
          as={Fragment}
          enter="ease-out duration-100"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <ListboxOptions className="absolute z-10 w-full mt-1 overflow-auto bg-[#0d120d] border border-[rgba(0,230,118,0.1)] rounded-md shadow-lg max-h-60">
            {options.map(o => (
              <ListboxOption
                key={o}
                value={o}
                className={({ focus }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 font-jet-brains text-[0.7rem] ${
                    focus ? 'bg-[rgba(0,230,118,0.08)] text-[#e8f5e8]' : 'text-[#4caf50]'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate ${selected ? 'font-semibold text-[#00e676]' : 'font-normal'}`}
                    >
                      {o}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#00e676]">
                        <Check size={14} />
                      </span>
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </Listbox>
    </div>
  )
}
