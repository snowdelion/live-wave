import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
import {
  Controller,
  type Control,
  type FieldError,
  type FieldValues,
  type Path,
  type PathValue,
} from 'react-hook-form'

import { errorStyle, inputStyle, labelStyle } from '../lib/modal.constants'
import type { MonitorForm } from '../model/monitor-form.schema'

export function SelectField({
  name,
  control,
  label,
  options,
  formatLabel,
  error,
}: SelectFieldProps) {
  return (
    <div>
      <label className={labelStyle}>{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Listbox value={field.value} onChange={field.onChange}>
            <div className="relative">
              <ListboxButton className={`${inputStyle(false)} flex justify-between items-center`}>
                <span className="ml-1">{formatLabel ? formatLabel(field.value) : field.value}</span>
                <ChevronDown size={16} className="text-[#4caf50] shrink-0" />
              </ListboxButton>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-in"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <ListboxOptions
                  modal={false}
                  className="absolute z-10 mt-1 max-h-60 w-full custom-scrollbar overflow-auto rounded-md bg-[#0d120d] border border-[rgb(0,230,118)]/15 py-1 shadow-lg focus:outline-none space-y-1"
                >
                  {options.map(opt => (
                    <ListboxOption
                      key={opt}
                      value={opt}
                      className={({ focus }) =>
                        `relative cursor-default select-none py-1.5 px-4 font-jet-brains text-sm rounded-md mx-5 ${
                          focus ? 'bg-[#00e676]/10 text-[#e8f5e8]' : 'text-[#4caf50]'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <span
                          className={`block truncate ${selected ? 'font-semibold text-[#00e676]' : ''}`}
                        >
                          {formatLabel ? formatLabel(opt) : opt}
                        </span>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Transition>
            </div>
          </Listbox>
        )}
      />
      {error && <p className={errorStyle}>{error.message}</p>}
    </div>
  )
}

interface SelectFieldProps<TFormValues extends FieldValues = MonitorForm> {
  name: Path<TFormValues>
  control: Control<TFormValues>
  label: string
  options: readonly (string | number)[]
  formatLabel?: (value: PathValue<TFormValues, Path<TFormValues>>) => string | undefined
  error?: FieldError | undefined
}
