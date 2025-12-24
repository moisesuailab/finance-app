import { useState, useMemo } from 'react'
import { Plus, ArrowUpRight, ArrowDownRight, Search, Clock, Download } from 'lucide-react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { BarChart } from '@/components/ui/BarChart'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { isInMonthRange } from '@/lib/dateUtils'
import { TransactionForm } from '@/components/forms/TransactionForm'
import { ExportModal } from '@/components/modals/ExportModal'

export function Transactions() {
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [showExport, setShowExport] = useState(false)
  
  const transactions = useTransactionStore(state => state.transactions)
  const categories = useCategoryStore(state => state.categories)
  const accounts = useAccountStore(state => state.accounts)

  // Estatísticas do mês (apenas completed)
  const monthStats = useMemo(() => {
    const monthTransactions = transactions.filter(t => 
      isInMonthRange(new Date(t.date), selectedMonth) &&
      t.status === 'completed'
    )

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return { income, expenses }
  }, [transactions, selectedMonth])

  // Transações filtradas por mês e busca
  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .filter(t => isInMonthRange(new Date(t.date), selectedMonth))
      .filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // Pendentes primeiro
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (a.status !== 'pending' && b.status === 'pending') return 1
        // Depois por data
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
  }, [transactions, selectedMonth, searchTerm])

  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name || 'Sem categoria'
  }

  const getAccountName = (accountId: number) => {
    return accounts.find(a => a.id === accountId)?.name || 'Sem conta'
  }

  const handleEdit = (transactionId: number) => {
    setEditingTransaction(transactionId)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTransaction(null)
  }

  return (
    <MobileLayout>
      <Header 
        title="Transações"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowExport(true)}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </button>
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova</span>
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-4">
        {/* Seletor de Mês */}
        <MonthSelector 
          currentMonth={selectedMonth}
          onChange={setSelectedMonth}
        />

        {/* Gráfico de Barras */}
        <Card>
          <CardContent className="p-4">
            <BarChart income={monthStats.income} expenses={monthStats.expenses} />
          </CardContent>
        </Card>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Input
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Lista de Transações */}
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-stone-500 mb-4">
                {searchTerm 
                  ? 'Nenhuma transação encontrada' 
                  : 'Nenhuma transação neste mês'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar transação
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((transaction) => (
              <Card 
                key={transaction.id} 
                className="active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => handleEdit(transaction.id!)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                      transaction.type === 'income'
                        ? 'bg-green-100 dark:bg-green-950'
                        : 'bg-red-100 dark:bg-red-950'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 dark:text-stone-50 truncate">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-stone-500 mt-1">
                        {getCategoryName(transaction.categoryId)} • {getAccountName(transaction.accountId)}
                      </p>
                      <p className="text-xs text-stone-400 mt-1">
                        {formatDate(new Date(transaction.date))}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'income'
                          ? 'text-green-600 dark:text-green-500'
                          : 'text-red-600 dark:text-red-500'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      {transaction.status === 'pending' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Contador de transações */}
        {filteredTransactions.length > 0 && (
          <p className="text-center text-sm text-stone-500">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transação' : 'transações'}
            {searchTerm && ' encontrada(s)'}
          </p>
        )}
      </div>

      {/* Modal de Exportação */}
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />

      {/* Formulário de Transação */}
      {showForm && (
        <TransactionForm
          isOpen={showForm}
          onClose={handleCloseForm}
          transactionId={editingTransaction}
        />
      )}
    </MobileLayout>
  )
}