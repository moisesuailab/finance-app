import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Transaction } from '@/types/finance'
import { useAccountStore } from './useAccountStore'

type CreateTransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>

interface TransactionStore {
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  
  fetchTransactions: () => Promise<void>
  addTransaction: (transaction: CreateTransactionInput) => Promise<void>
  updateTransaction: (id: number, transaction: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: number) => Promise<void>
  completeTransaction: (id: number) => Promise<void>
  getTransactionsByAccount: (accountId: number) => Transaction[]
  getTransactionsByCategory: (categoryId: number) => Transaction[]
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[]
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null })
    try {
      const transactions = await db.transactions.toArray()
      set({ transactions, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  addTransaction: async (transactionData) => {
    set({ isLoading: true, error: null })
    try {
      const now = new Date()
      const newTransaction: Transaction = {
        ...transactionData,
        createdAt: now,
        updatedAt: now
      }
      
      await db.transactions.add(newTransaction)
      
      if (transactionData.status === 'completed') {
        const amount = transactionData.type === 'income' 
          ? transactionData.amount 
          : -transactionData.amount
        await useAccountStore.getState().updateBalance(transactionData.accountId, amount)
      }
      
      await get().fetchTransactions()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  updateTransaction: async (id, transactionData) => {
    set({ isLoading: true, error: null })
    try {
      const oldTransaction = await db.transactions.get(id)
      
      if (oldTransaction) {
        if (oldTransaction.status === 'completed') {
          const oldAmount = oldTransaction.type === 'income' 
            ? -oldTransaction.amount 
            : oldTransaction.amount
          await useAccountStore.getState().updateBalance(oldTransaction.accountId, oldAmount)
        }
        
        const newStatus = transactionData.status || oldTransaction.status
        if (newStatus === 'completed') {
          const newType = transactionData.type || oldTransaction.type
          const newAmount = transactionData.amount || oldTransaction.amount
          const amount = newType === 'income' ? newAmount : -newAmount
          await useAccountStore.getState().updateBalance(
            transactionData.accountId || oldTransaction.accountId, 
            amount
          )
        }
      }
      
      await db.transactions.update(id, {
        ...transactionData,
        updatedAt: new Date()
      })
      await get().fetchTransactions()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const transaction = await db.transactions.get(id)
      
      if (transaction && transaction.status === 'completed') {
        const amount = transaction.type === 'income' 
          ? -transaction.amount 
          : transaction.amount
        await useAccountStore.getState().updateBalance(transaction.accountId, amount)
      }
      
      await db.transactions.delete(id)
      await get().fetchTransactions()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  completeTransaction: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const transaction = await db.transactions.get(id)
      
      if (transaction && transaction.status === 'pending') {
        await db.transactions.update(id, {
          status: 'completed',
          updatedAt: new Date()
        })
        
        const amount = transaction.type === 'income' 
          ? transaction.amount 
          : -transaction.amount
        await useAccountStore.getState().updateBalance(transaction.accountId, amount)
        
        await get().fetchTransactions()
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  getTransactionsByAccount: (accountId) => {
    return get().transactions.filter(t => t.accountId === accountId)
  },

  getTransactionsByCategory: (categoryId) => {
    return get().transactions.filter(t => t.categoryId === categoryId)
  },

  getTransactionsByDateRange: (startDate, endDate) => {
    return get().transactions.filter(t => {
      const date = new Date(t.date)
      return date >= startDate && date <= endDate
    })
  }
}))