import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-12 px-4 rounded-xl',
            'bg-stone-100 dark:bg-stone-900',
            'border-2 border-transparent',
            'text-stone-900 dark:text-stone-50',
            'placeholder:text-stone-400 dark:placeholder:text-stone-600',
            'focus:outline-none focus:border-stone-400 dark:focus:border-stone-600',
            'transition-colors',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'