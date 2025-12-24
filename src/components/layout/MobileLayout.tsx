import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MobileLayoutProps {
  children: ReactNode
  className?: string
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
  return (
    <div className={cn(
      'min-h-screen pb-20 sm:pb-24',
      'max-w-screen-lg mx-auto',
      className
    )}>
      {children}
    </div>
  )
}