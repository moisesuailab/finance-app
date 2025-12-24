import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MonthSelectorProps {
  currentMonth: Date
  onChange: (date: Date) => void
}

export function MonthSelector({ currentMonth, onChange }: MonthSelectorProps) {
  const handlePrevMonth = () => {
    onChange(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    onChange(addMonths(currentMonth, 1))
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return currentMonth.getMonth() === now.getMonth() && 
           currentMonth.getFullYear() === now.getFullYear()
  }

  return (
    <div className="flex items-center justify-between bg-stone-100 dark:bg-stone-900 rounded-xl p-2">
      <button
        onClick={handlePrevMonth}
        className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 text-center">
        <p className="font-semibold text-stone-900 dark:text-stone-50 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </p>
        {isCurrentMonth() && (
          <p className="text-xs text-stone-500">Mês atual</p>
        )}
      </div>

      <button
        onClick={handleNextMonth}
        className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}