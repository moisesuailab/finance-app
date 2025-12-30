import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubPageLayoutProps {
  children: ReactNode
  title: string
  action?: ReactNode
  className?: string
}

export function SubPageLayout({ children, title, action, className }: SubPageLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pb-0">
      {/* Header Fixo */}
      <header className="sticky top-0 z-30 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-lg border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors -ml-2"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 truncate">
              {title}
            </h1>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </header>

      {/* Conteúdo */}
      <main className={cn('max-w-screen-lg mx-auto', className)}>
        {children}
      </main>
    </div>
  )
}