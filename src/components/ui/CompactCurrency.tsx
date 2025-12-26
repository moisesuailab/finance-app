import { useState } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompactCurrencyProps {
  value: number
  className?: string
  threshold?: number // A partir de quanto abrevia (padrão: 100.000)
  disableTap?: boolean // Desabilitar tap mobile (para evitar conflitos)
}

export function CompactCurrency({ 
  value, 
  className,
  threshold = 100000,
  disableTap = false
}: CompactCurrencyProps) {
  const [showFull, setShowFull] = useState(false)

  // Valor completo formatado
  const fullValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)

  // Verificar se deve abreviar
  const shouldCompact = Math.abs(value) >= threshold

  // Valor compacto formatado
  const compactValue = shouldCompact 
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: 'compact',
        maximumFractionDigits: 2
      }).format(value)
    : fullValue

  if (!shouldCompact) {
    return <span className={className}>{fullValue}</span>
  }

  return (
    <>
      {/* Desktop: tooltip ao hover */}
      <span 
        className={cn(
          'hidden sm:inline-block relative group cursor-help',
          className
        )}
        title={fullValue}
      >
        {compactValue}
        <Info className="inline-block w-3 h-3 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
        
        {/* Tooltip visual */}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap pointer-events-none z-50">
          {fullValue}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-stone-900 dark:border-t-stone-100" />
        </span>
      </span>

      {/* Mobile: com ou sem tap */}
      {disableTap ? (
        // Sem tap - apenas exibe valor compacto (sem ícone)
        <span className={cn('sm:hidden', className)}>
          {compactValue}
        </span>
      ) : (
        // Com tap - abre modal (sem ícone, tap direto no valor)
        <span
          onClick={(e) => {
            e.stopPropagation() // Evita propagação
            setShowFull(true)
          }}
          className={cn(
            'sm:hidden cursor-pointer active:scale-95 transition-transform',
            className
          )}
        >
          {compactValue}
        </span>
      )}

      {/* Modal mobile */}
      {showFull && !disableTap && (
        <div 
          className="sm:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowFull(false)}
        >
          <div 
            className="bg-white dark:bg-stone-900 rounded-2xl p-6 mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
              Valor completo:
            </p>
            <p className="text-3xl font-bold text-stone-900 dark:text-stone-50">
              {fullValue}
            </p>
            <button
              onClick={() => setShowFull(false)}
              className="w-full mt-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50 rounded-xl font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}