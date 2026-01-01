import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BlurValueProps {
  children: ReactNode
  isVisible: boolean
  className?: string
}

export function BlurValue({ children, isVisible, className }: BlurValueProps) {
  return (
    <div
      className={cn(
        'transition-all duration-200',
        !isVisible && 'filter blur-md select-none',
        className
      )}
      aria-hidden={!isVisible}
    >
      {children}
    </div>
  )
}
