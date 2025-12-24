import { addDays, addWeeks, addMonths, addYears, isAfter } from 'date-fns'
import type { RecurrenceType } from '@/types/finance'

export function getNextRecurrenceDate(
  lastDate: Date,
  recurrenceType: RecurrenceType
): Date | null {
  switch (recurrenceType) {
    case 'daily':
      return addDays(lastDate, 1)
    case 'weekly':
      return addWeeks(lastDate, 1)
    case 'monthly':
      return addMonths(lastDate, 1)
    case 'yearly':
      return addYears(lastDate, 1)
    case 'none':
      return null
    default:
      return null
  }
}

export function shouldGenerateRecurrence(
  lastGeneratedDate: Date,
  recurrenceType: RecurrenceType,
  recurrenceEndDate?: Date
): boolean {
  if (recurrenceType === 'none') return false
  
  const nextDate = getNextRecurrenceDate(lastGeneratedDate, recurrenceType)
  if (!nextDate) return false
  
  const now = new Date()
  
  // Verificar se já passou da data
  if (isAfter(now, nextDate)) {
    // Verificar se não ultrapassou a data final
    if (recurrenceEndDate && isAfter(nextDate, recurrenceEndDate)) {
      return false
    }
    return true
  }
  
  return false
}

export function generateRecurringTransactions(
  baseDate: Date,
  recurrenceType: RecurrenceType,
  recurrenceEndDate: Date | undefined,
  maxOccurrences: number = 12
): Date[] {
  if (recurrenceType === 'none') return []
  
  const dates: Date[] = []
  let currentDate = baseDate
  
  for (let i = 0; i < maxOccurrences; i++) {
    const nextDate = getNextRecurrenceDate(currentDate, recurrenceType)
    if (!nextDate) break
    
    // Parar se ultrapassou a data final
    if (recurrenceEndDate && isAfter(nextDate, recurrenceEndDate)) {
      break
    }
    
    dates.push(nextDate)
    currentDate = nextDate
  }
  
  return dates
}