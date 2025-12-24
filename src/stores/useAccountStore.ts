import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Account } from '@/types/finance'

type CreateAccountInput = Omit<Account, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'>

interface AccountStore {
  accounts: Account[]
  isLoading: boolean
  error: string | null
  
  fetchAccounts: () => Promise<void>
  addAccount: (account: CreateAccountInput) => Promise<void>
  updateAccount: (id: number, account: Partial<Account>) => Promise<void>
  deleteAccount: (id: number) => Promise<void>
  updateBalance: (id: number, amount: number) => Promise<void>
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null })
    try {
      const accounts = await db.accounts.toArray()
      set({ accounts, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  addAccount: async (accountData) => {
    set({ isLoading: true, error: null })
    try {
      const now = new Date()
      const newAccount: Account = {
        ...accountData,
        currentBalance: accountData.initialBalance,
        createdAt: now,
        updatedAt: now
      }
      
      await db.accounts.add(newAccount)
      await get().fetchAccounts()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  updateAccount: async (id, accountData) => {
    set({ isLoading: true, error: null })
    try {
      await db.accounts.update(id, {
        ...accountData,
        updatedAt: new Date()
      })
      await get().fetchAccounts()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  deleteAccount: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await db.accounts.delete(id)
      await get().fetchAccounts()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  updateBalance: async (id, amount) => {
    try {
      const account = await db.accounts.get(id)
      if (account) {
        await db.accounts.update(id, {
          currentBalance: account.currentBalance + amount,
          updatedAt: new Date()
        })
        await get().fetchAccounts()
      }
    } catch (error) {
      set({ error: (error as Error).message })
    }
  }
}))