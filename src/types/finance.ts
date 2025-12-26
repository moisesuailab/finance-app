export type TransactionType = 'income' | 'expense'

export type TransactionStatus = 'pending' | 'completed'

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Category {
  id?: number
  name: string
  color: string
  icon: string
  type: TransactionType
  createdAt: Date
  updatedAt: Date
}

export interface Account {
  id?: number
  name: string
  initialBalance: number
  currentBalance: number
  color: string
  icon: string
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id?: number
  accountId: number
  categoryId: number
  type: TransactionType
  status: TransactionStatus
  amount: number
  description: string
  date: Date
  isRecurring: boolean
  recurrenceType: RecurrenceType
  recurrenceOccurrences?: number
  generatedDates?: string[]
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Budget {
  id?: number
  categoryId: number
  amount: number
  month: string
  createdAt: Date
  updatedAt: Date
}
