import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { BottomNav, type TabType } from '@/components/layout/BottomNav'
import { Home } from '@/pages/Home'
import { Accounts } from '@/pages/Accounts'
import { Categories } from '@/pages/Categories'
import { Reports } from '@/pages/Reports'
import { Settings } from '@/pages/Settings'
import { RecurrenceManager } from '@/pages/RecurrenceManager'
import { Welcome } from '@/pages/Welcome'
import { useAccountStore } from '@/stores/useAccountStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useInitialSetup } from '@/hooks/useInitialSetup'
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions'

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const mainRoutes = ['/', '/accounts', '/categories', '/reports', '/settings']
  const isMainRoute = mainRoutes.includes(location.pathname)

  const getActiveTabFromPath = (pathname: string): TabType => {
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/accounts')) return 'accounts'
    if (pathname.startsWith('/categories')) return 'categories'
    if (pathname.startsWith('/reports')) return 'reports'
    if (pathname.startsWith('/settings')) return 'settings'
    return 'home'
  }

  const activeTab = getActiveTabFromPath(location.pathname)
  
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
  }, [location.pathname])

  const handleTabChange = (tab: TabType) => {
    const routes: Record<TabType, string> = {
      home: '/',
      accounts: '/accounts',
      categories: '/categories',
      reports: '/reports',
      settings: '/settings'
    }
    navigate(routes[tab])
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

  return (
    <>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/recurrence" element={<RecurrenceManager />} />
        </Routes>
        {isMainRoute && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}
    </>
  )
}

function App() {
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('hasSeenWelcome')
  })

  const handleWelcomeComplete = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setShowWelcome(false)
  }

  if (showWelcome) {
    return <Welcome onComplete={handleWelcomeComplete} />
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </BrowserRouter>
  )
}

export default App