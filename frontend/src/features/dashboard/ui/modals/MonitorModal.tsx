import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { X, Activity } from 'lucide-react'
import { Fragment } from 'react'

import { DnsRecordType, MonitorType } from '@/entities/monitor'

import {
  errorStyle,
  inputStyle,
  labelStyle,
  MODAL_INTERVALS,
  MODAL_LABELS,
  MODAL_PLACEHOLDERS,
  MODAL_TIMEOUTS,
} from '../../lib/modal.constants'
import { MONITOR_TYPES } from '../../lib/monitor.constants'
import { useMonitorModal } from '../../model/useMonitorModal'
import { SelectField } from '../shared/SelectField'

export function MonitorModal({ mode, onClose, initial }: MonitorModalProps) {
  const {
    cancelButtonRef,
    setValues,
    register,
    handleSubmit,
    errors,
    clearErrors,
    type,
    onSubmit,
    isPending,
    submitError,
    control,
  } = useMonitorModal({ mode, onClose, initial })

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-200"
        initialFocus={cancelButtonRef}
        onClose={() => !isPending && onClose()}
      >
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[rgb(8,10,8)]/88 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-120 transform rounded-lg bg-[#0d120d] border border-[rgb(0,230,118)]/15 shadow-2xl transition-all">
                <div className="py-5 px-6 border-b border-b-[rgb(0,230,118)]/8 flex items-center justify-between">
                  <div className="flex items-center gap-[0.6rem]">
                    <div className="w-7 h-7 rounded-md bg-[rgb(0,230,118)]/10 border border-[rgb(0,230,118)]/20 flex items-center justify-center">
                      <Activity size={14} color="#00e676" />
                    </div>

                    <DialogTitle className="font-barlow font-bold text-[1.2rem] text-[#e8f5e8] tracking-[0.04em]">
                      {initial?.id ? 'EDIT MONITOR' : 'ADD MONITOR'}
                    </DialogTitle>
                  </div>

                  <button
                    onClick={onClose}
                    className="bg-transparent border-none text-[#4caf50] flex focus:outline-none"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form
                  onSubmit={e => void handleSubmit(onSubmit)(e)}
                  className="p-6 flex flex-col gap-[1.1rem]"
                >
                  {mode === 'create' && (
                    <div>
                      <label className={labelStyle}>MONITOR TYPE</label>
                      <div className="flex gap-2">
                        {MONITOR_TYPES.map(t => (
                          <button
                            key={t}
                            onClick={() => {
                              setValues({
                                type: t,
                                url: '',
                                host: '',
                                port: undefined,
                                method: 'HEAD',
                              })
                              clearErrors()
                            }}
                            type="button"
                            className={`flex-1 p-2 font-jet-brains text-[0.72rem] tracking-[0.06em] focus:outline-none font-medium rounded-sm tranition-all duration-200 border
                            ${type === t ? 'text-[#080a08] bg-[#00e676] border-[#00e676]' : 'text-[#4caf50] bg-transparent border-[rgb(0,230,118)]/15'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="h-20">
                    <label className={labelStyle}>DISPLAY NAME</label>
                    <input
                      {...register('name', { onChange: () => clearErrors('name') })}
                      placeholder="My great server"
                      className={`focus:border-[#00e676] ${inputStyle(!!errors.name)}`}
                    />
                    {errors.name && <p className={errorStyle}>{errors.name.message}</p>}
                  </div>

                  <div className="grid gap-3 grid-cols-2">
                    <SelectField
                      name="checkInterval"
                      control={control}
                      label="CHECK INTERVAL"
                      options={MODAL_INTERVALS}
                      formatLabel={v => `${v}m`}
                      error={errors.checkInterval}
                    />
                    <SelectField
                      name="timeout"
                      control={control}
                      label="TIMEOUT"
                      options={MODAL_TIMEOUTS}
                      formatLabel={v => `${Number(v) / 1000}s`}
                      error={errors.timeout}
                    />
                  </div>

                  {type === MonitorType.HTTP ? (
                    <div className="h-20">
                      <label className={labelStyle}>URL</label>
                      <input
                        {...register('url', { onChange: () => clearErrors('url') })}
                        placeholder={MODAL_PLACEHOLDERS[type]}
                        className={`focus:border-[#00e676] ${inputStyle(!!errors.url)}`}
                      />
                      {errors.url && <p className={errorStyle}>{errors.url.message}</p>}
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-3">
                        <div className="flex-1 h-20">
                          <label className={labelStyle}>{MODAL_LABELS[type].toUpperCase()}</label>
                          <input
                            {...register('host', { onChange: () => clearErrors('host') })}
                            placeholder={MODAL_PLACEHOLDERS[type]}
                            className={`focus:border-[#00e676] ${inputStyle(!!errors.host)}`}
                          />
                          {errors.host && <p className={errorStyle}>{errors.host.message}</p>}
                        </div>

                        {type === MonitorType.TCP && (
                          <div className="flex-1 h-20">
                            <label className={labelStyle}>PORT</label>
                            <input
                              type="number"
                              {...register('port', {
                                setValueAs: v => (v === '' ? undefined : Number(v)),
                                onChange: () => clearErrors('port'),
                              })}
                              placeholder="5432"
                              className={`focus:border-[#00e676] ${inputStyle(!!errors.port)}`}
                            />
                            {errors.port && <p className={errorStyle}>{errors.port.message}</p>}
                          </div>
                        )}

                        {type === MonitorType.DNS && (
                          <div className="flex-1">
                            <SelectField
                              name="recordType"
                              control={control}
                              label="RECORD TYPE"
                              options={Object.values(DnsRecordType)}
                              error={errors.recordType}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-1">
                    <button
                      type="button"
                      ref={cancelButtonRef}
                      onClick={onClose}
                      className="flex-1 p-[0.7rem] font-inter font-medium text-sm text-[#a5d6a7] bg-transparent border border-[rgb(0,230,118)]/15 rounded-sm focus:outline-none hover:bg-[rgb(0,230,118)]/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className={`flex-2 p-[0.7rem] font-inter font-semibold text-sm text-[#080a08] bg-[#00e676] border-none rounded-sm transition-opacity duration-200
                        hover:opacity-90 active:opacity-80 disabled:opacity-50 focus:outline-none`}
                    >
                      {isPending && (
                        <span className="w-3.5 h-3.5 border-2 border-[#080a08] border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                      {initial?.id ? 'Save changes' : 'Create monitor'}
                    </button>
                  </div>
                  {submitError && <p className={errorStyle}>{submitError}</p>}
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export interface MonitorModalProps {
  mode: 'create' | 'update'
  onClose: () => void
  initial?:
    | {
        id?: string
        name: string
        type: MonitorType
        checkInterval: number
        timeout: number
        url?: string
        host?: string
        port?: number
        recordType?: DnsRecordType
        method?: 'HEAD'
      }
    | undefined
}
