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
      
      // Atualizar saldo(s) se transação completada
      if (transactionData.status === 'completed') {
        if (transactionData.type === 'transfer') {
          // TRANSFERÊNCIA: atualiza DUAS contas
          if (!transactionData.fromAccountId || !transactionData.toAccountId) {
            throw new Error('Transferência precisa de fromAccountId e toAccountId')
          }
          
          // Deduz da origem
          await useAccountStore.getState().updateBalance(
            transactionData.fromAccountId, 
            -transactionData.amount
          )
          
          // Adiciona no destino
          await useAccountStore.getState().updateBalance(
            transactionData.toAccountId, 
            transactionData.amount
          )
        } else {
          // RECEITA/DESPESA: atualiza UMA conta
          const amount = transactionData.type === 'income' 
            ? transactionData.amount 
            : -transactionData.amount
          await useAccountStore.getState().updateBalance(
            transactionData.accountId, 
            amount
          )
        }
      }
      
      await get().fetchTransactions()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  updateTransaction: async (id, transactionData) => {
    set({ isLoading: true, error: null })
    try {
      const oldTransaction = await db.transactions.get(id)
      
      if (oldTransaction) {
        // Reverter saldo anterior se estava completada
        if (oldTransaction.status === 'completed') {
          if (oldTransaction.type === 'transfer') {
            // Reverter transferência
            if (oldTransaction.fromAccountId && oldTransaction.toAccountId) {
              await useAccountStore.getState().updateBalance(
                oldTransaction.fromAccountId, 
                oldTransaction.amount
              )
              await useAccountStore.getState().updateBalance(
                oldTransaction.toAccountId, 
                -oldTransaction.amount
              )
            }
          } else {
            // Reverter receita/despesa
            const oldAmount = oldTransaction.type === 'income' 
              ? -oldTransaction.amount 
              : oldTransaction.amount
            await useAccountStore.getState().updateBalance(
              oldTransaction.accountId, 
              oldAmount
            )
          }
        }
        
        // Aplicar novo saldo se completada
        const newStatus = transactionData.status || oldTransaction.status
        if (newStatus === 'completed') {
          const newType = transactionData.type || oldTransaction.type
          
          if (newType === 'transfer') {
            // Nova transferência
            const fromId = transactionData.fromAccountId || oldTransaction.fromAccountId
            const toId = transactionData.toAccountId || oldTransaction.toAccountId
            const newAmount = transactionData.amount || oldTransaction.amount
            
            if (fromId && toId) {
              await useAccountStore.getState().updateBalance(fromId, -newAmount)
              await useAccountStore.getState().updateBalance(toId, newAmount)
            }
          } else {
            // Nova receita/despesa
            const newAmount = transactionData.amount || oldTransaction.amount
            const amount = newType === 'income' ? newAmount : -newAmount
            await useAccountStore.getState().updateBalance(
              transactionData.accountId || oldTransaction.accountId, 
              amount
            )
          }
        }
      }
      
      await db.transactions.update(id, {
        ...transactionData,
        updatedAt: new Date()
      })
      await get().fetchTransactions()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const transaction = await db.transactions.get(id)
      
      if (transaction && transaction.status === 'completed') {
        if (transaction.type === 'transfer') {
          // Reverter transferência
          if (transaction.fromAccountId && transaction.toAccountId) {
            await useAccountStore.getState().updateBalance(
              transaction.fromAccountId, 
              transaction.amount
            )
            await useAccountStore.getState().updateBalance(
              transaction.toAccountId, 
              -transaction.amount
            )
          }
        } else {
          // Reverter receita/despesa
          const amount = transaction.type === 'income' 
            ? -transaction.amount 
            : transaction.amount
          await useAccountStore.getState().updateBalance(
            transaction.accountId, 
            amount
          )
        }
      }
      
      await db.transactions.delete(id)
      await get().fetchTransactions()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
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
        
        if (transaction.type === 'transfer') {
          // Completar transferência
          if (transaction.fromAccountId && transaction.toAccountId) {
            await useAccountStore.getState().updateBalance(
              transaction.fromAccountId, 
              -transaction.amount
            )
            await useAccountStore.getState().updateBalance(
              transaction.toAccountId, 
              transaction.amount
            )
          }
        } else {
          // Completar receita/despesa
          const amount = transaction.type === 'income' 
            ? transaction.amount 
            : -transaction.amount
          await useAccountStore.getState().updateBalance(
            transaction.accountId, 
            amount
          )
        }
        
        await get().fetchTransactions()
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  getTransactionsByAccount: (accountId) => {
    return get().transactions.filter(t => 
      t.accountId === accountId || 
      t.fromAccountId === accountId || 
      t.toAccountId === accountId
    )
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