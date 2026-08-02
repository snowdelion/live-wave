import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import dayjs from 'dayjs'
import { X } from 'lucide-react'
import { Fragment } from 'react'

import type { AnalyticsIncident } from '@/entities/analytics'

export function IncidentModal({ incident, onClose }: IncidentModalProps) {
  const isResolved = incident.status === 'Resolved'

  const format = (value: Date) =>
    `${dayjs(value).format('DD MMM, YYYY')} • ${dayjs(value).format('HH:mm:ss')}`

  return (
    <Transition appear show as={Fragment}>
      <Dialog as="div" className="relative z-300" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-100"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[rgba(8,10,8,0.88)] sm:backdrop-blur-xs" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-110 rounded-xl bg-[#0d120d] border border-[rgba(0,230,118,0.15)] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-[1.1rem] border-b border-[rgba(0,230,118,0.08)]">
                <span className="font-barlow font-bold text-base sm:text-[1.1rem] text-[#e8f5e8] tracking-[0.03em]">
                  INCIDENT DETAILS
                </span>
                <button
                  onClick={onClose}
                  className="text-[#4caf50] hover:text-[#66bb6a] transition-colors"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="px-6 pt-2 pb-6 space-y-4">
                <div>
                  <span className="font-jet-brains  text-[0.65rem] text-[#2e7d32] tracking-widest">
                    STARTED AT
                  </span>
                  <p className="font-inter text-xs sm:text-sm text-[#e8f5e8] mt-1">
                    {format(incident.startAt)}
                  </p>
                </div>

                {incident.endAt && (
                  <div>
                    <span className="font-jet-brains text-[0.65rem] text-[#2e7d32] tracking-widest">
                      ENDED AT
                    </span>
                    <p className="font-inter text-xs sm:text-sm text-[#e8f5e8] mt-1">
                      {format(incident.endAt)}
                    </p>
                  </div>
                )}

                {incident.endAt && (
                  <div>
                    <span className="font-jet-brains text-[0.65rem] text-[#2e7d32] tracking-widest">
                      DURATION
                    </span>
                    <p className="font-inter text-xs sm:text-sm text-[#e8f5e8] mt-1">
                      {incident.formattedDuration}
                    </p>
                  </div>
                )}

                <div>
                  <span className="font-jet-brains text-[0.65rem] text-[#2e7d32] tracking-widest">
                    STATUS
                  </span>
                  <p
                    className={`font-inter text-xs sm:text-sm mt-1 ${isResolved ? 'text-[#00e676]' : 'text-[#f44336]'}`}
                  >
                    {incident.status}
                  </p>
                </div>

                <div>
                  <span className="font-jet-brains text-[0.65rem] text-[#2e7d32] tracking-widest">
                    ERROR MESSAGE
                  </span>
                  <p className="font-jet-brains text-xs sm:text-sm text-[#e8f5e8] mt-1 break-all leading-relaxed">
                    {incident.cause || '-'}
                  </p>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}

interface IncidentModalProps {
  incident: AnalyticsIncident
  onClose: () => void
}
