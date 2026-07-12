export function AuthModeToggle({ isLogin, onToggle }: AuthModeToggleProps) {
  return (
    <p className="font-inter text-[0.82rem] text-[#4caf50] text-center mt-6">
      {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
      <button
        onClick={onToggle}
        className="bg-none border-none font-inter font-semibold text-[0.82rem] text-[#00e676] p-0 underline transition-colors duration-200 hover:opacity-90 active:opacity-80"
      >
        {isLogin ? 'Sign up' : 'Sign in'}
      </button>
    </p>
  )
}

interface AuthModeToggleProps {
  isLogin: boolean
  onToggle: () => void
}
