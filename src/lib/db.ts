import Dexie, { type EntityTable } from 'dexie'
import type { Account, Budget, Category, Transaction } from '@/types/finance'
import { differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears } from 'date-fns'

class FinanceDatabase extends Dexie {
  accounts!: EntityTable<Account, 'id'>
  categories!: EntityTable<Category, 'id'>
  transactions!: EntityTable<Transaction, 'id'>
  budgets!: EntityTable<Budget, 'id'>

  constructor() {
    super('FinanceDB')
    
    this.version(1).stores({
      accounts: '++id, name, currentBalance, createdAt',
      categories: '++id, name, type, createdAt',
      transactions: '++id, accountId, categoryId, type, date, createdAt',
      budgets: '++id, categoryId, month, createdAt'
    })

    this.version(2).stores({
      transactions: '++id, accountId, categoryId, type, status, date, createdAt'
    }).upgrade(tx => {
      return tx.table('transactions').toCollection().modify(transaction => {
        if (!transaction.status) {
          transaction.status = 'completed'
        }
      })
    })

    this.version(3).stores({
      transactions: '++id, accountId, categoryId, type, status, date, createdAt'
    }).upgrade(tx => {
      return tx.table('transactions').toCollection().modify(transaction => {
        if (transaction.isRecurring && !transaction.generatedDates) {
          transaction.generatedDates = []
        }
      })
    })

    this.version(4).stores({
      transactions: '++id, accountId, categoryId, type, status, date, createdAt'
    }).upgrade(tx => {
      return tx.table('transactions').toCollection().modify((transaction: Transaction & { recurrenceEndDate?: Date }) => {
        if (!transaction.isRecurring || !transaction.recurrenceEndDate) return

        const baseDate = new Date(transaction.date)
        const endDate = new Date(transaction.recurrenceEndDate)
        const recurrenceType = transaction.recurrenceType

        let occurrences = 0

        switch (recurrenceType) {
          case 'daily':
            occurrences = Math.abs(differenceInDays(endDate, baseDate))
            break
          case 'weekly':
            occurrences = Math.abs(differenceInWeeks(endDate, baseDate))
            break
          case 'monthly':
            occurrences = Math.abs(differenceInMonths(endDate, baseDate))
            break
          case 'yearly':
            occurrences = Math.abs(differenceInYears(endDate, baseDate))
            break
          default:
            occurrences = 12
        }

        transaction.recurrenceOccurrences = occurrences
        delete transaction.recurrenceEndDate
      })
    })

    this.version(5).stores({
      transactions: '++id, accountId, categoryId, type, status, date, createdAt'
    }).upgrade(tx => {
      return tx.table('transactions').toCollection().modify((transaction: Transaction) => {
        if (transaction.isRecurring && transaction.isInstallment === undefined) {
          transaction.isInstallment = false
        }
      })
    })

    this.version(6).stores({
      transactions: '++id, accountId, categoryId, type, status, date, createdAt'
    }).upgrade(tx => {
      return tx.table('transactions').toCollection().modify((transaction: Transaction) => {
        if (transaction.isInstallment && transaction.description) {
          const match = transaction.description.match(/^(.+) - \d+\/\d+$/)
          if (match) {
            transaction.baseDescription = match[1]
          } else {
            transaction.baseDescription = transaction.description
          }
        }
      })
    })

    this.version(7).stores({
      accounts: '++id, name, currentBalance, isArchived, excludeFromTotal, createdAt',
      transactions: '++id, accountId, categoryId, type, status, date, fromAccountId, toAccountId, createdAt'
    }).upgrade(tx => {
      return tx.table('accounts').toCollection().modify((account: Account) => {
        if (account.excludeFromTotal === undefined) {
          account.excludeFromTotal = false
        }
        if (account.isArchived === undefined) {
          account.isArchived = false
        }
        if (account.archivedAt === undefined) {
          account.archivedAt = undefined
        }
        if (account.description === undefined) {
          account.description = undefined
        }
      })
    })
  }
}

export const db = new FinanceDatabase()