import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useMemo } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import type { AuthFormValues } from '@/pages-flat/auth'

import { AuthField } from './AuthField'

export function AuthFields({
  showPassword,
  showConfirmPassword,
  isLogin,
  errors,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
  register,
  clearErrors,
  setIncorrectError,
}: AuthFieldsOptions) {
  const filteredFields = useMemo(
    () =>
      getAuthFields({
        showPassword,
        showConfirmPassword,
        isLogin,
        errors,
        onToggleShowPassword,
        onToggleShowConfirmPassword,
      }).filter(f => f.shouldRender),
    [
      errors,
      isLogin,
      showConfirmPassword,
      onToggleShowPassword,
      onToggleShowConfirmPassword,
      showPassword,
    ],
  )

  return filteredFields.map(({ icon: Icon, ...field }) => (
    <AuthField
      key={field.label}
      label={field.label}
      type={field.type}
      placeholder={field.placeholder}
      error={field.error}
      icon={<Icon size={15} color="#2e7d32" />}
      rightSlot={field.rightSlot}
      {...register(field.registerName, {
        onChange: () => {
          clearErrors()
          setIncorrectError('')
        },
      })}
    />
  ))
}

export function getAuthFields({
  showPassword,
  showConfirmPassword,
  isLogin,
  errors,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
}: GetAuthFieldsOptions): FieldConfig[] {
  return [
    {
      label: 'EMAIL',
      type: 'email',
      placeholder: 'you@example.com',
      error: errors.email?.message,
      registerName: 'email',
      icon: Mail,
      shouldRender: true,
    } as const,
    {
      label: 'PASSWORD',
      type: showPassword ? 'text' : 'password',
      placeholder: 'Enter your password',
      error: errors.password?.message,
      registerName: 'password',
      icon: Lock,
      rightSlot: (
        <button
          type="button"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={onToggleShowPassword}
          className="bg-none border-none text-[#2e7d32] flex p-0 transition-colors duration-200 hover:opacity-90"
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      ),
      shouldRender: true,
    } as const,
    {
      label: 'CONFIRM PASSWORD',
      type: showConfirmPassword ? 'text' : 'password',
      placeholder: 'Confirm your password',
      error: errors.confirmPassword?.message,
      registerName: 'confirmPassword',
      icon: Lock,
      rightSlot: (
        <button
          type="button"
          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          onClick={onToggleShowConfirmPassword}
          className="bg-none border-none text-[#2e7d32] flex p-0 transition-colors duration-200 hover:opacity-90"
        >
          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      ),
      shouldRender: !isLogin,
    } as const,
  ]
}

interface AuthFieldsOptions {
  showPassword: boolean
  showConfirmPassword: boolean
  isLogin: boolean
  errors: FieldErrors<AuthFormValues>
  onToggleShowPassword: () => void
  onToggleShowConfirmPassword: () => void
  register: UseFormRegister<AuthFormValues>
  clearErrors: () => void
  setIncorrectError: (value: string) => void
}

interface GetAuthFieldsOptions {
  showPassword: boolean
  showConfirmPassword: boolean
  isLogin: boolean
  errors: FieldErrors<AuthFormValues>
  onToggleShowPassword: () => void
  onToggleShowConfirmPassword: () => void
}

export type FieldConfig = {
  label: string
  type: string
  placeholder: string
  error?: string | undefined
  registerName: keyof AuthFormValues
  icon: React.ElementType
  rightSlot?: React.ReactNode
  shouldRender: boolean
}
