import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  action?: ReactNode
  className?: string
}

export function Header({ title, action, className }: HeaderProps) {
  return (
    <header className={cn(
      'sticky top-0 z-30',
      'bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-lg',
      'border-b border-stone-200 dark:border-stone-800',
      className
    )}>
      <div className="flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50">
          {title}
        </h1>
        {action && <div>{action}</div>}
      </div>
    </header>
  )
}