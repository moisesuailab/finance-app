import { startOfMonth, endOfMonth, format } from 'date-fns'

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

export function formatDateForInput(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function createDateInMonth(targetMonth: Date): string {
  const today = new Date()
  const dayOfMonth = today.getDate()
  
  const newDate = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    dayOfMonth
  )
  
  return format(newDate, 'yyyy-MM-dd')
}

export function parseInputDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0)
}
