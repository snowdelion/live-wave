import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { Fragment } from 'react'

import { useUserPopover } from '../../model/useUserPopover'
import { ConfirmModal } from '../modals/ConfirmModal'

export function UserPopover() {
  const {
    PANEL_BUTTONS,
    handleDeleteClick,
    showConfirm,
    setShowConfirm,
    accountName,
    error,
    user,
  } = useUserPopover()

  return (
    <Popover className="relative">
      <PopoverButton className="w-8 h-8 rounded-full bg-[rgba(0,230,118,0.12)] border border-[rgba(0,230,118,0.25)] flex items-center justify-center cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity focus:outline-none">
        <span className="font-jet-brains text-[0.6rem] sm:text-[0.65rem] text-[#00e676] font-medium">
          {user?.email?.charAt(0).toUpperCase() || ''}
        </span>
      </PopoverButton>

      <Transition
        as={Fragment}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-in"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <PopoverPanel
          modal={false}
          className="fixed top-16.5 right-6 sm:right-8 lg:right-12 z-10 w-40 sm:w-56 rounded-md bg-[#0d120d] border border-[rgba(0,230,118,0.15)] shadow-lg py-1 focus:outline-none"
        >
          <div className="flex flex-col mb-2">
            {PANEL_BUTTONS.map(({ label, shouldShow, action, isDanger, shouldShowConfirm }) => {
              if (!shouldShow) return null

              return (
                <div
                  key={label}
                  className={`mx-1.5 rounded-lg ${isDanger ? 'hover:bg-[rgba(244,67,54,0.08)] active:bg-[rgba(244,67,54,0.15)]' : 'hover:bg-[rgba(0,230,118,0.08)] active:bg-[rgba(0,230,118,0.15)]'}`}
                >
                  <button
                    onClick={() => (shouldShowConfirm ? handleDeleteClick() : action())}
                    className={`px-2.5 py-2 text-left w-full font-jet-brains text-xs sm:text-sm transition-colors duration-150 ${
                      isDanger ? 'text-[#f44336]' : 'text-[#4caf50]'
                    }`}
                  >
                    {label}
                  </button>
                  {shouldShowConfirm && (
                    <ConfirmModal
                      open={showConfirm}
                      onConfirm={action}
                      onCancel={() => setShowConfirm(false)}
                      title="DELETE ACCOUNT"
                      description="This action cannot be undone. All your monitors and data will be permanently removed"
                      confirmLabel="Delete Account"
                      danger={true}
                      itemName={accountName}
                    />
                  )}
                </div>
              )
            })}
          </div>
          {error && (
            <div className="flex flex-col items-center justify-center space-y-2">
              <span className="h-px w-full max-w-30 sm:max-w-50 bg-[rgba(0,230,118,0.1)] rounded-full" />
              <span className="px-4 py-1 text-[0.6rem] text-[#f44336] font-inter">
                {error.message}
              </span>
            </div>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
