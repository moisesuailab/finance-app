import { addDays, addWeeks, addMonths, addYears, startOfDay, isAfter, isBefore } from 'date-fns'
import type { Transaction, RecurrenceType } from '@/types/finance'


export function calculateRecurringProjections(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): { projectedIncome: number; projectedExpenses: number } {
  const start = startOfDay(startDate)
  const end = startOfDay(endDate)
  
  let projectedIncome = 0
  let projectedExpenses = 0

  const recurringTransactions = transactions.filter(
    t => t.isRecurring && 
         t.recurrenceType !== 'none' && 
         t.recurrenceOccurrences !== undefined &&
         t.recurrenceOccurrences > 0
  )
  
  for (const transaction of recurringTransactions) {
    const baseDate = startOfDay(new Date(transaction.date))
    const generatedCount = transaction.generatedDates?.length || 0
    const totalOccurrences = transaction.recurrenceOccurrences!
    const remainingOccurrences = totalOccurrences - generatedCount
    
    if (remainingOccurrences <= 0) continue
    
    for (let i = generatedCount + 1; i <= totalOccurrences; i++) {
      const nextDate = getNextOccurrenceDate(baseDate, transaction.recurrenceType, i)
      
      if (!nextDate) break
      
      if (isBefore(nextDate, start)) continue
      if (isAfter(nextDate, end)) break
      
      if (transaction.type === 'income') {
        projectedIncome += transaction.amount
      } else if (transaction.type === 'expense') {
        projectedExpenses += transaction.amount
      }
    }
  }
  
  return { projectedIncome, projectedExpenses }
}

function getNextOccurrenceDate(
  baseDate: Date,
  recurrenceType: RecurrenceType,
  occurrenceNumber: number
): Date | null {
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