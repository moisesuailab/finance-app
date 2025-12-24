import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Category } from '@/types/finance'

interface CategoryStore {
  categories: Category[]
  isLoading: boolean
  error: string | null
  
  fetchCategories: () => Promise<void>
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateCategory: (id: number, category: Partial<Category>) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null })
    try {
      const categories = await db.categories.toArray()
      set({ categories, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  addCategory: async (categoryData) => {
    set({ isLoading: true, error: null })
    try {
      const now = new Date()
      const newCategory: Category = {
        ...categoryData,
        createdAt: now,
        updatedAt: now
      }
      
      await db.categories.add(newCategory)
      await get().fetchCategories()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  updateCategory: async (id, categoryData) => {
    set({ isLoading: true, error: null })
    try {
      await db.categories.update(id, {
        ...categoryData,
        updatedAt: new Date()
      })
      await get().fetchCategories()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await db.categories.delete(id)
      await get().fetchCategories()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  }
}))