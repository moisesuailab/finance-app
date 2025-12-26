import { addDays, addWeeks, addMonths, addYears, isAfter, startOfDay, format } from 'date-fns'
import type { RecurrenceType } from '@/types/finance'

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
    case 'monthly':
      return addMonths(base, occurrenceNumber)
    case 'yearly':
      return addYears(base, occurrenceNumber)
    default:
      return null
  }
}

export function generateMissingRecurrenceDates(
  baseDate: Date,
  recurrenceType: RecurrenceType,
  recurrenceEndDate: Date | undefined,
  alreadyGeneratedDates: string[]
): string[] {
  if (recurrenceType === 'none') return []
  
  const today = startOfDay(new Date())
  const base = startOfDay(baseDate)
  const endDate = recurrenceEndDate ? startOfDay(recurrenceEndDate) : null
  
  const missingDates: string[] = []
  let occurrenceNumber = 1
  const maxOccurrences = 1000
  
  while (occurrenceNumber < maxOccurrences) {
    const nextDate = getNextRecurrenceDate(base, recurrenceType, occurrenceNumber)
    
    if (!nextDate) break
    
    if (isAfter(nextDate, today)) break
    
    if (endDate && isAfter(nextDate, endDate)) break
    
    const dateISO = dateToISO(nextDate)
    
    if (!alreadyGeneratedDates.includes(dateISO)) {
      missingDates.push(dateISO)
    }
    
    occurrenceNumber++
  }
  
  return missingDates
}

export function hasPendingRecurrences(
  baseDate: Date,
  recurrenceType: RecurrenceType,
  recurrenceEndDate: Date | undefined,
  alreadyGeneratedDates: string[]
): boolean {
  const missing = generateMissingRecurrenceDates(
    baseDate,
    recurrenceType,
    recurrenceEndDate,
    alreadyGeneratedDates
  )
  
  return missing.length > 0
}

export function getAllRecurrenceDates(
  baseDate: Date,
  recurrenceType: RecurrenceType,
  recurrenceEndDate: Date | undefined,
  maxOccurrences: number = 100
): string[] {
  if (recurrenceType === 'none') return []
  
  const base = startOfDay(baseDate)
  const endDate = recurrenceEndDate ? startOfDay(recurrenceEndDate) : null
  
  const dates: string[] = []
  let occurrenceNumber = 1
  
  while (occurrenceNumber <= maxOccurrences) {
    const nextDate = getNextRecurrenceDate(base, recurrenceType, occurrenceNumber)
    
    if (!nextDate) break
    
    if (endDate && isAfter(nextDate, endDate)) break
    
    dates.push(dateToISO(nextDate))
    occurrenceNumber++
  }
  
  return dates
}
