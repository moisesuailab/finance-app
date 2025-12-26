import { useEffect, useState, useCallback } from 'react'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { DEFAULT_CATEGORIES } from '@/lib/defaultData'

const INITIAL_SETUP_KEY = 'hasCompletedInitialSetup'

export function useInitialSetup() {
  const [isInitialized, setIsInitialized] = useState(false)
  
  const categories = useCategoryStore(state => state.categories)
  const addCategory = useCategoryStore(state => state.addCategory)
  const fetchCategories = useCategoryStore(state => state.fetchCategories)
  
  const fetchAccounts = useAccountStore(state => state.fetchAccounts)

  // Carregar dados iniciais
  useEffect(() => {
    const initializeApp = async () => {
      await fetchCategories()
      await fetchAccounts()
      setIsInitialized(true)
    }

    initializeApp()
  }, [fetchCategories, fetchAccounts])

  // Adicionar categorias padrão
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

  // Criar contas padrão - usar callback para pegar dados frescos
  const createDefaultAccounts = useCallback(async () => {
    const { accounts, addAccount } = useAccountStore.getState()
    
    // Verificar se já completou
    const hasCompletedSetup = localStorage.getItem(INITIAL_SETUP_KEY) === 'true'
    if (hasCompletedSetup) return

    // Verificar se as contas já existem
    const hasCarteira = accounts.some(a => a.name === 'Carteira')
    const hasPoupanca = accounts.some(a => a.name === 'Poupança')

    // Criar apenas as que não existem
    if (!hasCarteira) {
      await addAccount({
        name: 'Carteira',
        initialBalance: 0,
        color: '#3b82f6',
        icon: 'wallet',
        excludeFromTotal: false
      })
    }

    if (!hasPoupanca) {
      await addAccount({
        name: 'Poupança',
        initialBalance: 0,
        color: '#10b981',
        icon: 'piggy-bank',
        excludeFromTotal: true
      })
    }

    localStorage.setItem(INITIAL_SETUP_KEY, 'true')
  }, [])

  useEffect(() => {
    if (isInitialized) {
      createDefaultAccounts()
    }
  }, [isInitialized, createDefaultAccounts])

  return isInitialized
}