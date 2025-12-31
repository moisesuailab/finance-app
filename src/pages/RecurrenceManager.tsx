import { useMemo, useState } from 'react'
import { SubPageLayout } from '@/components/layout/SubPageLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { TransactionForm } from '@/components/forms/TransactionForm'
import { BlurValue } from '@/components/ui/BlurValue'
import { Input } from '@/components/ui/Input'
import { useVisibility } from '@/hooks/useVisibility'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { formatCurrency } from '@/lib/formatters'
import { Repeat, Calendar, TrendingUp, Clock, Search, Eye, EyeOff } from 'lucide-react'

export function RecurrenceManager() {
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<number | null>(null)
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['all']))

  const { isVisible, toggleVisibility } = useVisibility()
  const [searchTerm, setSearchTerm] = useState('')

  const handleEditRecurrence = (transactionId: number) => {
    setEditingTransaction(transactionId)
    setShowForm(true)
  }

  const handleFilterToggle = (filter: string) => {
    setActiveFilters(prev => {
        const newFilters = new Set(prev)
        
        // Se clicar em "Todos"
        if (filter === 'all') {
        return new Set(['all'])
        }
        
        // Remove "Todos" se clicar em qualquer outro
        newFilters.delete('all')
        
        // Toggle do filtro clicado
        if (newFilters.has(filter)) {
        newFilters.delete(filter)
        } else {
        newFilters.add(filter)
        }
        
        // Se nenhum filtro, volta para "Todos"
        if (newFilters.size === 0) {
        return new Set(['all'])
        }
        
        return newFilters
    })
  }

  const transactions = useTransactionStore(state => state.transactions)
  const categories = useCategoryStore(state => state.categories)
  const accounts = useAccountStore(state => state.accounts)

  // Filtrar recorrências ativas
  const activeRecurrences = useMemo(() => {
    return transactions.filter(t => 
      t.isRecurring && 
      t.recurrenceType !== 'none'
    )
  }, [transactions])

  // Aplicar filtros e separar por tipo
  const { determined, indeterminate, allFiltered } = useMemo(() => {
    let filtered = activeRecurrences

    // Filtro de busca textual
    if (searchTerm) {
        filtered = filtered.filter(t => {
        const desc = (t.baseDescription || t.description).toLowerCase()
        return desc.includes(searchTerm.toLowerCase())
        })
    }

    // Aplicar filtros de tags
    if (!activeFilters.has('all')) {
        filtered = filtered.filter(t => {
        // Filtro: Determinadas
        if (activeFilters.has('determined') && t.recurrenceOccurrences !== undefined) return true
        
        // Filtro: Indeterminadas
        if (activeFilters.has('indeterminate') && t.recurrenceOccurrences === undefined) return true
        
        // Filtro: Parcelamentos
        if (activeFilters.has('installment') && t.isInstallment) return true
        
        // Filtro: Concluídas (todas parcelas geradas)
        if (activeFilters.has('completed')) {
            const generatedCount = t.isInstallment 
            ? (t.generatedDates?.length || 0) + 1
            : (t.generatedDates?.length || 0)
            const totalOccurrences = t.recurrenceOccurrences || 0
            return totalOccurrences > 0 && generatedCount >= totalOccurrences
        }
        
        // Filtro: Ativas (ainda tem parcelas a gerar)
        if (activeFilters.has('active')) {
            if (!t.recurrenceOccurrences) return true // Indeterminadas são sempre ativas
            const generatedCount = t.isInstallment 
            ? (t.generatedDates?.length || 0) + 1
            : (t.generatedDates?.length || 0)
            return generatedCount < t.recurrenceOccurrences
        }
        
        return false
        })
    }

    return {
        determined: filtered.filter(t => t.recurrenceOccurrences !== undefined),
        indeterminate: filtered.filter(t => t.recurrenceOccurrences === undefined),
        allFiltered: filtered
    }
  }, [activeRecurrences, activeFilters, searchTerm])

  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name || 'Sem categoria'
  }

  const getAccountName = (accountId: number) => {
    return accounts.find(a => a.id === accountId)?.name || 'Sem conta'
  }

  const getFrequencyLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: 'Diária',
      weekly: 'Semanal',
      monthly: 'Mensal',
      yearly: 'Anual'
    }
    return labels[type] || type
  }

  const renderRecurrenceCard = (transaction: typeof transactions[0]) => {
    const generatedCount = transaction.recurrenceOccurrences !== undefined
      ? (transaction.generatedDates?.length || 0) + 1
      : (transaction.generatedDates?.length || 0)
    const totalOccurrences = transaction.recurrenceOccurrences || 0
    const progress = totalOccurrences > 0 ? (generatedCount / totalOccurrences) * 100 : 0

    return (
        <Card 
            key={transaction.id}
            onClick={() => handleEditRecurrence(transaction.id!)}
            className="cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md"
        >
            <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${
              transaction.type === 'income'
                ? 'bg-green-100 dark:bg-green-950'
                : 'bg-red-100 dark:bg-red-950'
            }`}>
              <Repeat className={`w-5 h-5 ${
                transaction.type === 'income'
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
              }`} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50 truncate">
                {transaction.baseDescription || transaction.description}
              </h3>
              
              <div className="flex items-center gap-2 mt-1 text-sm text-stone-500">
                <Calendar className="w-4 h-4" />
                <span>{getFrequencyLabel(transaction.recurrenceType)}</span>
                {transaction.isInstallment && (
                  <>
                    <span>•</span>
                    <span>Parcelamento</span>
                  </>
                )}
              </div>

              <p className="text-sm text-stone-500 mt-1">
                {getCategoryName(transaction.categoryId)} • {getAccountName(transaction.accountId)}
              </p>

              {/* Progresso */}
              {transaction.recurrenceOccurrences !== undefined ? (
                // Determinadas: mostra progresso com barra
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>{generatedCount} de {totalOccurrences} geradas</span>
                    <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${
                        transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                    </div>
                </div>
                ) : generatedCount > 0 ? (
                // Indeterminadas: mostra apenas quantidade (sem barra)
                <div className="mt-2">
                    <p className="text-xs text-stone-500">
                    {generatedCount} {generatedCount === 1 ? 'gerada' : 'geradas'}
                    </p>
                </div>
              ) : null}
            </div>

            <div className="text-right flex-shrink-0">
                <BlurValue isVisible={isVisible}>
                    <p className={`text-lg font-bold ${
                    transaction.type === 'income'
                        ? 'text-green-600 dark:text-green-500'
                        : 'text-red-600 dark:text-red-500'
                    }`}>
                    {transaction.type === 'income' ? '+' : ''}
                    {formatCurrency(transaction.amount)}
                    </p>
                </BlurValue>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
  <SubPageLayout 
    title="Recorrências"
    action={
      <button
        onClick={toggleVisibility}
        className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
        title={isVisible ? "Ocultar valores" : "Mostrar valores"}
      >
        {isVisible ? (
          <Eye className="w-5 h-5 text-stone-600 dark:text-stone-400" />
        ) : (
          <EyeOff className="w-5 h-5 text-stone-600 dark:text-stone-400" />
        )}
      </button>
    }
  >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Determinadas</span>
              </div>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">
                {determined.length}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Com data de término
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Indeterminadas</span>
              </div>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">
                {indeterminate.length}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Perpétuas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Input
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Filtros por Tags */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => handleFilterToggle('all')}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${activeFilters.has('all')
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-2 border-stone-900 dark:border-stone-50'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-transparent hover:bg-stone-300 dark:hover:bg-stone-700'
              }
            `}
          >
            Todas
          </button>
          
          <button
            onClick={() => handleFilterToggle('active')}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${activeFilters.has('active')
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-2 border-stone-900 dark:border-stone-50'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-transparent hover:bg-stone-300 dark:hover:bg-stone-700'
              }
            `}
          >
            Ativas
          </button>
          
          <button
            onClick={() => handleFilterToggle('completed')}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${activeFilters.has('completed')
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-2 border-stone-900 dark:border-stone-50'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-transparent hover:bg-stone-300 dark:hover:bg-stone-700'
              }
            `}
          >
            Concluídas
          </button>
          
          <button
            onClick={() => handleFilterToggle('installment')}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${activeFilters.has('installment')
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-2 border-stone-900 dark:border-stone-50'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-transparent hover:bg-stone-300 dark:hover:bg-stone-700'
              }
            `}
          >
            Parcelamentos
          </button>
          
          <button
            onClick={() => handleFilterToggle('determined')}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${activeFilters.has('determined')
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-2 border-stone-900 dark:border-stone-50'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-transparent hover:bg-stone-300 dark:hover:bg-stone-700'
              }
            `}
          >
            Determinadas
          </button>
          
          <button
            onClick={() => handleFilterToggle('indeterminate')}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${activeFilters.has('indeterminate')
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-2 border-stone-900 dark:border-stone-50'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-transparent hover:bg-stone-300 dark:hover:bg-stone-700'
              }
            `}
          >
            Indeterminadas
          </button>
        </div>

        {/* Determinadas */}
        {determined.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide px-2">
              Determinadas
            </h2>
            <div className="space-y-2">
              {determined.map(renderRecurrenceCard)}
            </div>
          </div>
        )}

        {/* Indeterminadas */}
        {indeterminate.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide px-2">
              Indeterminadas
            </h2>
            <div className="space-y-2">
              {indeterminate.map(renderRecurrenceCard)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {allFiltered.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Repeat className="w-12 h-12 text-stone-400 mx-auto mb-4" />
              <p className="text-stone-500 mb-2">Nenhuma recorrência ativa</p>
              <p className="text-sm text-stone-400">
                Crie transações recorrentes para gerenciá-las aqui
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {showForm && (
        <TransactionForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingTransaction(null)
          }}
          transactionId={editingTransaction}
        />
      )}
    </SubPageLayout>
  )
}