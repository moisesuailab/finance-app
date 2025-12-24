import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function Drawer({ isOpen, onClose, title, children, className }: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer - slide from bottom */}
      <div
        className={cn(
          'relative w-full sm:max-w-md',
          'bg-stone-50 dark:bg-stone-950',
          'sm:rounded-2xl rounded-t-2xl',
          'border border-stone-200 dark:border-stone-800',
          'shadow-xl',
          'flex flex-col',
          'max-h-[85vh] sm:max-h-[90vh]',
          'animate-slide-up sm:animate-none',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-50">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors -mr-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content com scroll */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}