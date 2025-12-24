import { useState, useEffect } from 'react'
import { BottomNav, type TabType } from '@/components/layout/BottomNav'
import { Home } from '@/pages/Home'
import { Transactions } from '@/pages/Transactions'
import { Accounts } from '@/pages/Accounts'
import { Categories } from '@/pages/Categories'
import { Reports } from '@/pages/Reports'
import { Welcome } from '@/pages/Welcome'
import { useAccountStore } from '@/stores/useAccountStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useInitialSetup } from '@/hooks/useInitialSetup'
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  // Inicialização lazy: verifica localStorage apenas na primeira renderização
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('hasSeenWelcome')
  })
  const isInitialized = useInitialSetup()
  
  const fetchAccounts = useAccountStore(state => state.fetchAccounts)
  const fetchCategories = useCategoryStore(state => state.fetchCategories)
  const fetchTransactions = useTransactionStore(state => state.fetchTransactions)

  // Hook para gerar transações recorrentes
  useRecurringTransactions()

  // Carregar dados ao iniciar
  useEffect(() => {
    if (isInitialized) {
      fetchAccounts()
      fetchCategories()
      fetchTransactions()
    }
  }, [isInitialized, fetchAccounts, fetchCategories, fetchTransactions])

  // Scroll para o topo ao trocar de aba
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeTab])

  const handleWelcomeComplete = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setShowWelcome(false)
  }

  if (showWelcome) {
    return <Welcome onComplete={handleWelcomeComplete} />
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-200 dark:border-stone-800 border-t-stone-900 dark:border-t-stone-50 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 dark:text-stone-400">Carregando...</p>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <Home />
      case 'transactions':
        return <Transactions />
      case 'accounts':
        return <Accounts />
      case 'categories':
        return <Categories />
      case 'reports':
        return <Reports />
      default:
        return <Home />
    }
  }

  return (
    <>
      {renderPage()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  )
}

export default App