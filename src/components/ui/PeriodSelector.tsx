import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { subDays, subMonths, startOfYear, endOfYear } from 'date-fns'

export type PeriodType = 'custom' | 'last7days' | 'last30days' | 'last3months' | 'last6months' | 'thisYear' | 'lastYear'

interface Period {
  startDate: Date
  endDate: Date
}

interface PeriodSelectorProps {
  onChange: (period: Period) => void
}

const PERIOD_OPTIONS = [
  { value: 'last7days' as PeriodType, label: 'Últimos 7 dias' },
  { value: 'last30days' as PeriodType, label: 'Últimos 30 dias' },
  { value: 'last3months' as PeriodType, label: 'Últimos 3 meses' },
  { value: 'last6months' as PeriodType, label: 'Últimos 6 meses' },
  { value: 'thisYear' as PeriodType, label: 'Este ano' },
  { value: 'lastYear' as PeriodType, label: 'Ano passado' },
  { value: 'custom' as PeriodType, label: 'Período personalizado' },
]

export function PeriodSelector({ onChange }: PeriodSelectorProps) {
  const [selectedType, setSelectedType] = useState<PeriodType>('last30days')
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const calculatePeriod = (type: PeriodType): Period => {
    const now = new Date()
    
    switch (type) {
      case 'last7days':
        return { startDate: subDays(now, 7), endDate: now }
      case 'last30days':
        return { startDate: subDays(now, 30), endDate: now }
      case 'last3months':
        return { startDate: subMonths(now, 3), endDate: now }
      case 'last6months':
        return { startDate: subMonths(now, 6), endDate: now }
      case 'thisYear':
        return { startDate: startOfYear(now), endDate: endOfYear(now) }
      case 'lastYear': {
        const lastYear = subMonths(now, 12)
        return { startDate: startOfYear(lastYear), endDate: endOfYear(lastYear) }
      }
      case 'custom':
        return {
          startDate: customStart ? new Date(customStart) : subDays(now, 30),
          endDate: customEnd ? new Date(customEnd) : now
        }
      default:
        return { startDate: subDays(now, 30), endDate: now }
    }
  }

  const handlePeriodChange = (type: PeriodType) => {
    setSelectedType(type)
    if (type === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      const period = calculatePeriod(type)
      onChange(period)
    }
  }

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const period = calculatePeriod('custom')
      onChange(period)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <select
          value={selectedType}
          onChange={(e) => handlePeriodChange(e.target.value as PeriodType)}
          className={cn(
            'w-full h-12 pl-12 pr-10 rounded-xl appearance-none',
            'bg-stone-100 dark:bg-stone-900',
            'border-2 border-transparent',
            'text-stone-900 dark:text-stone-50',
            'focus:outline-none focus:border-stone-400 dark:focus:border-stone-600',
            'transition-colors cursor-pointer font-medium'
          )}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
      </div>

      {showCustom && (
        <div className="p-4 bg-stone-100 dark:bg-stone-900 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-1 block">
                Data Inicial
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-1 block">
                Data Final
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd}
            className="w-full py-2 bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aplicar Período
          </button>
        </div>
      )}
    </div>
  )
}