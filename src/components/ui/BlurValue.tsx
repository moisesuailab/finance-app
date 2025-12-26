import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BlurValueProps {
  children: ReactNode
  isVisible: boolean
  className?: string
}

export function BlurValue({ children, isVisible, className }: BlurValueProps) {
  return (
    <span
      className={cn(
        'transition-all duration-200',
        !isVisible && 'blur-md select-none',
        className
      )}
    >
      {children}
    </span>
  )
}