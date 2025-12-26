import Dexie, { type EntityTable } from 'dexie'
import type { Account, Budget, Category, Transaction } from '@/types/finance'

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
  }
}

export const db = new FinanceDatabase()
