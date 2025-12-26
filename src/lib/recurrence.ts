import { addDays, addWeeks, addMonths, addYears, isAfter, startOfDay, endOfMonth, format } from 'date-fns'
import type { RecurrenceType } from '@/types/finance'

export const RECURRENCE_LIMITS: Record<RecurrenceType, number> = {
  none: 0,
  daily: 365,
  weekly: 104,
  monthly: 600,
  yearly: 100,
}

export const RECURRENCE_DEFAULTS: Record<RecurrenceType, number> = {
  none: 0,
  daily: 30,
  weekly: 12,
  monthly: 12,
  yearly: 5,
}

export function dateToISO(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd')
}

export function getNextRecurrenceDate(
  baseDate: Date,
  recurrenceType: RecurrenceType,
  occurrenceNumber: number = 1
): Date | null {
  if (recurrenceType === 'none') return null
  
  const base = startOfDay(baseDate)
  
  switch (recurrenceType) {
    case 'daily':
      return addDays(base, occurrenceNumber)
    case 'weekly':
      return addWeeks(base, occurrenceNumber)
    case 'monthly': {
      return addMonths(base, occurrenceNumber)
    }
    case 'yearly':
      return addYears(base, occurrenceNumber)
    default:
      return null
  }
}

export function generateMissingRecurrenceDates(
  baseDate: Date,
  recurrenceType: RecurrenceType,
  maxOccurrences: number | undefined,
  alreadyGeneratedDates: string[]
): string[] {
  if (recurrenceType === 'none' || !maxOccurrences) return []
  
  const today = startOfDay(new Date())
  const endOfCurrentMonth = endOfMonth(today)
  const base = startOfDay(baseDate)
  
  const missingDates: string[] = []
  
  for (let i = 1; i <= maxOccurrences; i++) {
    const nextDate = getNextRecurrenceDate(base, recurrenceType, i)
    
    if (!nextDate) break
    
    if (isAfter(nextDate, endOfCurrentMonth)) break
    
    const dateISO = dateToISO(nextDate)
    
    if (!alreadyGeneratedDates.includes(dateISO)) {
      missingDates.push(dateISO)
    }
  }
  
  return missingDates
}

export function hasPendingRecurrences(
  baseDate: Date,
  recurrenceType: RecurrenceType,
  maxOccurrences: number | undefined,
  alreadyGeneratedDates: string[]
): boolean {
  const missing = generateMissingRecurrenceDates(
    baseDate,
    recurrenceType,
    maxOccurrences,
    alreadyGeneratedDates
  )
  
  return missing.length > 0
}

export function getAllRecurrenceDates(
  baseDate: Date,
  recurrenceType: RecurrenceType,
  maxOccurrences: number = 12
): string[] {
  if (recurrenceType === 'none') return []
  
  const base = startOfDay(baseDate)
  const dates: string[] = []
  
  for (let i = 1; i <= maxOccurrences; i++) {
    const nextDate = getNextRecurrenceDate(base, recurrenceType, i)
    
    if (!nextDate) break
    
    dates.push(dateToISO(nextDate))
  }
  
  return dates
}

export function validateOccurrences(
  recurrenceType: RecurrenceType,
  occurrences: number
): { valid: boolean; message?: string } {
  if (recurrenceType === 'none') {
    return { valid: true }
  }
  
  const limit = RECURRENCE_LIMITS[recurrenceType]
  
  if (occurrences < 1) {
    return { 
      valid: false, 
      message: 'O número de ocorrências deve ser no mínimo 1' 
    }
  }
  
  if (occurrences > limit) {
    return { 
      valid: false, 
      message: `Máximo de ${limit} ocorrências para recorrência ${getRecurrenceLabel(recurrenceType)}` 
    }
  }
  
  return { valid: true }
}

function getRecurrenceLabel(type: RecurrenceType): string {
  switch (type) {
    case 'daily': return 'diária'
    case 'weekly': return 'semanal'
    case 'monthly': return 'mensal'
    case 'yearly': return 'anual'
    default: return ''
  }
}
