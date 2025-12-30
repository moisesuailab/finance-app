import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface MobileLayoutProps {
  children: ReactNode
  className?: string
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
  const location = useLocation()
  
  const mainRoutes = ['/', '/accounts', '/categories', '/reports', '/settings']
  const hasBottomNav = mainRoutes.includes(location.pathname)
  
  return (
    <div className={cn(
      'min-h-screen',
      hasBottomNav && 'pb-20 sm:pb-24',
      'max-w-screen-lg mx-auto',
      className
    )}>
      {children}
    </div>
  )
}