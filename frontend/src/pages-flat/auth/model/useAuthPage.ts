import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useSignInEmail, useSignUpEmail, type AuthViaEmailRequest } from '@/entities/auth'

import { loginSchema, registerSchema } from './auth.schema'

export function useAuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [incorrectError, setIncorrectError] = useState('')

  const isLogin = mode === 'login'
  const router = useRouter()

  const { mutate: signInEmail, isPending: isSignInEmailPending } = useSignInEmail()
  const { mutate: signUpEmail, isPending: isSignUpEmailPending } = useSignUpEmail()

  const currentMutate = (data: AuthViaEmailRequest) => {
    const mutate = isLogin ? signInEmail : signUpEmail
    mutate(data, {
      onSuccess: () => router.replace('/dashboard'),
      onError: ({ message }) => setIncorrectError(message),
    })
  }
  const isPending = isSignInEmailPending || isSignUpEmailPending
  const currentSchema = isLogin ? loginSchema : registerSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
    reValidateMode: 'onSubmit',
  })

  const onSubmit = (data: AuthFormValues) => {
    setIncorrectError('')
    const { confirmPassword: _, ...rest } = data
    currentMutate(rest)
  }

  return {
    isLogin,
    register,
    errors,
    isPending,
    showPassword,
    showConfirmPassword,
    incorrectError,
    setIncorrectError,
    setShowPassword,
    setShowConfirmPassword,
    handleSubmit,
    clearErrors,
    setMode,
    onSubmit: (e: React.SubmitEvent) => void handleSubmit(onSubmit)(e),
  }
}

export interface AuthFormValues {
  email: string
  password: string
  confirmPassword?: string
}
