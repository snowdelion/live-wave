import { AlertCircle } from 'lucide-react'
import { useId } from 'react'

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | undefined
  icon: React.ReactNode
  rightSlot?: React.ReactNode
}

export function AuthField({ label, error, icon, rightSlot, ...inputProps }: FieldProps) {
  const inputId = useId()

  return (
    <div className="flex flex-col gap-[0.35rem] h-22">
      <label
        htmlFor={inputId}
        className="font-jet-brains text-[0.65rem] tracking-[0.1rem] text-[#2e7d32]"
      >
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-[0.85rem] top-1/2 -translate-y-1/2 flex">{icon}</span>
        <input
          id={inputId}
          {...inputProps}
          className={`w-full box-border pl-10 pt-[0.65rem] pb-[0.65rem] font-inter text-sm text-[#e8f5e8] bg-[#080a08] border rounded-md outline-none transition-colors
            duration-200 focus:border-[#00e676] focus:shadow-lg 
            ${rightSlot ? 'pr-11' : 'pr-[0.9rem]'} ${error ? 'border-[#f44336]' : 'border-[rgb(0,230,118)]/15'}`}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex">{rightSlot}</span>
        )}
      </div>

      {error && (
        <span className="inline-flex items-center gap-0.75 font-inter text-xs text-[#f44336]">
          <AlertCircle size={12} className="mb-px" />
          {error}
        </span>
      )}
    </div>
  )
}
