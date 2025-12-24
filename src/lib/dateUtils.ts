import { startOfMonth, endOfMonth } from 'date-fns'

export function getMonthRange(date: Date) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  }
}

export function isInMonthRange(date: Date, monthDate: Date) {
  const { start, end } = getMonthRange(monthDate)
  return date >= start && date <= end
}