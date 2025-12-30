import { useMemo } from 'react'
import { SubPageLayout } from '@/components/layout/SubPageLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { formatCurrency } from '@/lib/formatters'
import { Repeat, Calendar, TrendingUp, Clock } from 'lucide-react'

export function RecurrenceManager() {
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

  // Separar por tipo
  const { determined, indeterminate } = useMemo(() => {
    return {
      determined: activeRecurrences.filter(t => t.recurrenceOccurrences !== undefined),
      indeterminate: activeRecurrences.filter(t => t.recurrenceOccurrences === undefined)
    }
  }, [activeRecurrences])

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
    const generatedCount = transaction.generatedDates?.length || 0
    const totalOccurrences = transaction.recurrenceOccurrences || 0
    const progress = totalOccurrences > 0 ? (generatedCount / totalOccurrences) * 100 : 0

    return (
      <Card key={transaction.id}>
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
              {transaction.recurrenceOccurrences && (
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
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <p className={`text-lg font-bold ${
                transaction.type === 'income'
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
              }`}>
                {transaction.type === 'income' ? '+' : ''}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <SubPageLayout title="Recorrências">
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
        {activeRecurrences.length === 0 && (
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
    </SubPageLayout>
  )
}