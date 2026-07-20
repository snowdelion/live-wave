export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-[#0d120d] border border-[rgba(0,230,118,0.1)] rounded-lg overflow-hidden">
      <div className="p-8 sm:p-12 text-center">
        <div className="flex justify-center mb-4 text-[#2e7d32]">{icon}</div>
        <h3 className="font-inter font-semibold text-[1rem] text-[#e8f5e8] mb-1">{title}</h3>
        <p className="font-inter text-[0.85rem] text-[#4caf50] max-w-sm mx-auto">{description}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}
