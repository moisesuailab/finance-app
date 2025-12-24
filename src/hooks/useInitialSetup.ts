import { useEffect, useState } from 'react'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { DEFAULT_CATEGORIES } from '@/lib/defaultData'

export function useInitialSetup() {
  const [isInitialized, setIsInitialized] = useState(false)
  const categories = useCategoryStore(state => state.categories)
  const addCategory = useCategoryStore(state => state.addCategory)
  const fetchCategories = useCategoryStore(state => state.fetchCategories)

  useEffect(() => {
    const initializeApp = async () => {
      await fetchCategories()
      
      setIsInitialized(true)
    }

    initializeApp()
  }, [fetchCategories])

  useEffect(() => {
    const addDefaultCategories = async () => {
      if (isInitialized && categories.length === 0) {
        for (const category of DEFAULT_CATEGORIES) {
          await addCategory(category)
        }
      }
    }

    addDefaultCategories()
  }, [isInitialized, categories.length, addCategory])

  return isInitialized
}