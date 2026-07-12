export function OAuthButtons({ onClick }: OAuthBtnProps) {
  return (
    <div className="flex flex-col gap-2.5 mb-6">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-center gap-[0.65rem] p-4 sm:py-[0.7rem] px-4 border-none rounded-md transition-colors duration-200 bg-[#f0f0f0] text-[#1a1a1a] hover:bg-[#e0e0e0]"
      >
        <TelegramIcon />
        <span className="font-inter font-medium text-sm text-[#1a1a1a]">
          Continue with Telegram
        </span>
      </button>
    </div>
  )
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="#29B6F6" />
      <path
        fill="#fff"
        d="M10.37 23.6c7.16-3.12 11.94-5.18 14.36-6.16 6.84-2.84 8.26-3.34 9.18-3.36.2 0 .66.04.96.28.26.2.32.46.36.66.04.18.08.56.04.86-.4 4.2-2.14 14.4-3.02 19.1-.38 1.98-1.12 2.66-1.84 2.72-1.56.14-2.74-1.04-4.26-2.02-2.36-1.56-3.7-2.52-5.98-4.04-2.64-1.74-.92-2.7.58-4.26.4-.42 7.32-6.72 7.46-7.28.02-.08.02-.36-.14-.5-.16-.14-.4-.1-.58-.06-.24.06-4.08 2.6-11.52 7.62-.96.66-1.84.98-2.64.96-.86-.02-2.52-.48-3.76-.88-1.52-.48-2.72-.74-2.62-1.56.06-.44.64-.88 1.76-1.34z"
      />
    </svg>
  )
}

interface OAuthBtnProps {
  onClick: () => void
}
