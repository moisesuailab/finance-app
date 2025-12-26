import { useState, useEffect } from 'react'
import { BottomNav, type TabType } from '@/components/layout/BottomNav'
import { Home } from '@/pages/Home'
import { Accounts } from '@/pages/Accounts'
import { Categories } from '@/pages/Categories'
import { Reports } from '@/pages/Reports'
import { Settings } from '@/pages/Settings'
import { Welcome } from '@/pages/Welcome'
import { useAccountStore } from '@/stores/useAccountStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useInitialSetup } from '@/hooks/useInitialSetup'
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('hasSeenWelcome')
  })
  const isInitialized = useInitialSetup()
  
  const fetchAccounts = useAccountStore(state => state.fetchAccounts)
  const fetchCategories = useCategoryStore(state => state.fetchCategories)
  const fetchTransactions = useTransactionStore(state => state.fetchTransactions)

  useRecurringTransactions()

  useEffect(() => {
    if (isInitialized) {
      fetchAccounts()
      fetchCategories()
      fetchTransactions()
    }
  }, [isInitialized, fetchAccounts, fetchCategories, fetchTransactions])

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
      case 'accounts':
        return <Accounts />
      case 'categories':
        return <Categories />
      case 'reports':
        return <Reports />
      case 'settings':
        return <Settings />
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