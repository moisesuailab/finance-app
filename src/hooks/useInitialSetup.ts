import { useEffect, useState } from 'react'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { DEFAULT_CATEGORIES } from '@/lib/defaultData'

export function useInitialSetup() {
  const [isInitialized, setIsInitialized] = useState(false)
  
  const categories = useCategoryStore(state => state.categories)
  const addCategory = useCategoryStore(state => state.addCategory)
  const fetchCategories = useCategoryStore(state => state.fetchCategories)
  
  const accounts = useAccountStore(state => state.accounts)
  const addAccount = useAccountStore(state => state.addAccount)
  const fetchAccounts = useAccountStore(state => state.fetchAccounts)

  useEffect(() => {
    const initializeApp = async () => {
      await fetchCategories()
      await fetchAccounts()
      
      setIsInitialized(true)
    }

    initializeApp()
  }, [fetchCategories, fetchAccounts])

  // Adicionar categorias padrão se não existirem
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

  // Criar conta padrão "Carteira" se não existir nenhuma
  useEffect(() => {
    const createDefaultAccount = async () => {
      if (isInitialized && accounts.length === 0) {
        await addAccount({
          name: 'Carteira',
          initialBalance: 0,
          color: '#3b82f6', // Azul
          icon: 'wallet'
        })
      }
    }

    createDefaultAccount()
  }, [isInitialized, accounts.length, addAccount])

  return isInitialized
}
