import { AlertCircle, ArrowRight } from 'lucide-react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import type { AuthFormValues } from '@/pages-flat/auth'

import { AuthFields } from './AuthFields'

export function AuthForm({
  register,
  errors,
  isSubmitting,
  showPassword,
  isLogin,
  incorrectError,
  onToggleShowPassword,
  onSubmit,
  onToggleShowConfirmPassword,
  showConfirmPassword,
  clearErrors,
  setIncorrectError,
}: AuthFormProps) {
  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <hr className="border-none flex-1 h-px bg-[rgb(0,230,118)]/10" />
        <span className="font-inter text-xs text-[#2e7d32] whitespace-nowrap">
          or continue with email
        </span>
        <hr className="border-none flex-1 h-px bg-[rgb(0,230,118)]/10" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col" noValidate>
        <div className="flex flex-col gap-2">
          <AuthFields
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            isLogin={isLogin}
            errors={errors}
            onToggleShowPassword={onToggleShowPassword}
            onToggleShowConfirmPassword={onToggleShowConfirmPassword}
            register={register}
            clearErrors={clearErrors}
            setIncorrectError={setIncorrectError}
          />
        </div>

        <div className="text-[#f44336] h-5 text-sm inline-flex items-center gap-0.75 justify-center -mt-2 mb-2">
          {incorrectError && (
            <>
              <AlertCircle size={13} className="mt-px" />
              <span>{incorrectError}</span>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-1.5 p-3 mt-1 font-inter font-semibold text-base text-[#080a08] border-none rounded-md transition-opacity
            duration-200 shadow-2xl bg-[#00e676] hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-[#080a08] border-t-transparent rounded-full animate-spin shrink-0" />
              {isLogin ? 'Signing in…' : 'Creating account…'}
            </>
          ) : (
            <>
              {isLogin ? 'Sign in' : 'Create account'}
              <ArrowRight size={15} strokeWidth={2.5} className="mt-px" />
            </>
          )}
        </button>
      </form>
    </>
  )
}

interface AuthFormProps {
  register: UseFormRegister<AuthFormValues>
  errors: FieldErrors<AuthFormValues>
  isSubmitting: boolean
  showPassword: boolean
  showConfirmPassword: boolean
  isLogin: boolean
  incorrectError?: string
  onToggleShowPassword: () => void
  onToggleShowConfirmPassword: () => void
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void
  clearErrors: () => void
  setIncorrectError: (value: string) => void
}
