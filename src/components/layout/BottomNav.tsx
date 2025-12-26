import { Home, Wallet, Tag, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabType = 'home' | 'accounts' | 'categories' | 'reports' | 'settings'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs = [
  { id: 'accounts' as TabType, label: 'Contas', icon: Wallet },
  { id: 'categories' as TabType, label: 'Categorias', icon: Tag },
  { id: 'home' as TabType, label: 'Início', icon: Home },
  { id: 'reports' as TabType, label: 'Relatórios', icon: BarChart3 },
  { id: 'settings' as TabType, label: 'Ajustes', icon: Settings },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 pb-safe">
      <div className="flex items-center justify-around h-16 sm:h-20 max-w-screen-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px]',
                'active:scale-95',
                isActive
                  ? 'text-stone-900 dark:text-stone-50'
                  : 'text-stone-400 dark:text-stone-600'
              )}
            >
              <Icon
                className={cn(
                  'transition-all',
                  isActive ? 'w-6 h-6' : 'w-5 h-5'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-all',
                  isActive ? 'opacity-100' : 'opacity-70'
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}