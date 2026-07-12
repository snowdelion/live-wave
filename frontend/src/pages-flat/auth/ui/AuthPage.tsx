'use client'
import { AuthBackground, AuthHeader, AuthForm, AuthModeToggle, OAuthButtons } from '@/features/auth'

import { useAuthPage } from '../model/useAuthPage'

export function AuthPage() {
  const {
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
    clearErrors,
    setMode,
    onSubmit,
  } = useAuthPage()

  return (
    <div className="sm:min-h-screen bg-[#080a08] flex flex-col items-center justify-center sm:py-8 sm:px-1 relative overflow-hidden">
      <AuthBackground />

      <div className="relative z-2 w-full h-dvh sm:h-auto max-w-115 bg-[#0d120d] border-0 sm:border border-[rgb(0,230,118)]/15 sm:rounded-xl overflow-hidden shadow-2xl">
        <div className="p-8">
          <AuthHeader isLogin={isLogin} />
          <OAuthButtons onClick={() => {}} />
          <AuthForm
            register={register}
            errors={errors}
            isSubmitting={isPending}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            isLogin={isLogin}
            incorrectError={incorrectError}
            setIncorrectError={setIncorrectError}
            onToggleShowPassword={() => setShowPassword(prev => !prev)}
            onToggleShowConfirmPassword={() => setShowConfirmPassword(prev => !prev)}
            onSubmit={onSubmit}
            clearErrors={clearErrors}
          />
          <AuthModeToggle
            isLogin={isLogin}
            onToggle={() => {
              setMode(isLogin ? 'register' : 'login')
              clearErrors()
              setIncorrectError('')
            }}
          />
        </div>
      </div>
    </div>
  )
}
