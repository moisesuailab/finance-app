import { forwardRef, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface CurrencyInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  className?: string
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, value, onChange, error, placeholder = 'R$ 0,00', className }, ref) => {
    // Derivar displayValue diretamente do value (sem useEffect)
    const displayValue = useMemo(() => {
      if (value === '') return ''

      const numericValue = parseFloat(value)
      if (isNaN(numericValue)) return ''

      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numericValue)
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value
      
      // Remover tudo exceto números
      const numbers = input.replace(/\D/g, '')
      
      if (numbers === '') {
        onChange('')
        return
      }

      // Converter para decimal (últimos 2 dígitos são centavos)
      const numericValue = parseFloat(numbers) / 100
      onChange(String(numericValue))
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Selecionar todo o texto ao focar
      e.target.select()
    }

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn(
            'w-full h-12 px-4 rounded-xl',
            'bg-stone-100 dark:bg-stone-900',
            'border-2 border-transparent',
            'text-stone-900 dark:text-stone-50',
            'text-lg font-semibold',
            'placeholder:text-stone-400 dark:placeholder:text-stone-600 placeholder:font-normal',
            'focus:outline-none focus:border-stone-400 dark:focus:border-stone-600',
            'transition-colors',
            error && 'border-red-500',
            className
          )}
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'