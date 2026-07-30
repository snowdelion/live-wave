import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { AlertTriangle, X } from 'lucide-react'
import { Fragment } from 'react'

export function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  itemName,
}: ConfirmModalProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-200" onClose={onCancel}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[rgba(8,10,8,0.85)] backdrop-blur-xs" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="bg-[#0d120d] border border-[rgba(244,67,54,0.25)] rounded-[10px] p-8 w-full max-w-95 shadow">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-lg bg-[rgba(244,67,54,0.1)] border border-[rgba(244,67,54,0.2)] flex items-center justify-center">
                  <AlertTriangle size={18} color={danger ? '#f44336' : '#00e676'} />
                </div>
                <button
                  onClick={onCancel}
                  className="bg-transparent self-center border-none text-[#4caf50] flex hover:text-[#66bb6a] transition-colors"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <DialogTitle
                as="h3"
                className="font-barlow font-bold text-[1.3rem] text-[#e8f5e8] mb-2 tracking-wide"
              >
                {title}
              </DialogTitle>

              <Description
                as="p"
                className="font-inter text-sm text-[#4caf50] mb-[0.4rem] leading-6"
              >
                {description}
              </Description>

              {itemName && (
                <div className="h-9 font-jet-brains text-[0.78rem] text-[#e8f5e8] bg-[rgba(0,230,118,0.05)] border border-[rgba(0,230,118,0.1)] rounded-sm py-2 px-3 mb-6 truncate">
                  {itemName}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 p-[0.65rem] font-inter font-medium text-sm text-[#a5d6a7] bg-transparent border border-[rgba(0,230,118,0.15)] rounded-sm transition-colors duration-200 hover:bg-white/2 active:bg-white/5"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 p-[0.65rem] font-inter font-medium text-sm text-white rounded-sm transition-colors duration-200 ${
                    danger
                      ? 'bg-[#f44336] hover:bg-[#d32f2f] active:bg-[#b71c1c]'
                      : 'bg-[#00e676] text-[#080a08] hover:bg-[#00c853] active:bg-[#00b248]'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}

export interface ConfirmModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void

  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  itemName?: string
}
