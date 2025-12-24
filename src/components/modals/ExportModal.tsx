import { useState, useMemo } from 'react'
import { Download, FileText, FileJson } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { PeriodSelector } from '@/components/ui/PeriodSelector'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { exportToCSV, downloadCSV, exportToJSON, downloadJSON } from '@/lib/export'
import { toast } from 'react-toastify'
import { format, subDays } from 'date-fns'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  // Inicializar com período padrão (últimos 30 dias)
  const [period, setPeriod] = useState<{ startDate: Date; endDate: Date }>(() => {
    const now = new Date()
    return {
      startDate: subDays(now, 30),
      endDate: now
    }
  })
  
  const transactions = useTransactionStore(state => state.transactions)
  const categories = useCategoryStore(state => state.categories)
  const accounts = useAccountStore(state => state.accounts)

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date)
      return date >= period.startDate && date <= period.endDate
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, period])

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Nenhuma transação encontrada no período selecionado')
      return
    }

    try {
      const csv = exportToCSV(filteredTransactions, categories, accounts)
      const filename = `transacoes_${format(period.startDate, 'dd-MM-yyyy')}_a_${format(period.endDate, 'dd-MM-yyyy')}.csv`
      downloadCSV(csv, filename)
      toast.success(`${filteredTransactions.length} transações exportadas!`)
      onClose()
    } catch {
      toast.error('Erro ao exportar transações')
    }
  }

  const handleExportJSON = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Nenhuma transação encontrada no período selecionado')
      return
    }

    try {
      const json = exportToJSON(filteredTransactions, categories, accounts)
      const filename = `transacoes_${format(period.startDate, 'dd-MM-yyyy')}_a_${format(period.endDate, 'dd-MM-yyyy')}.json`
      downloadJSON(json, filename)
      toast.success(`${filteredTransactions.length} transações exportadas!`)
      onClose()
    } catch {
      toast.error('Erro ao exportar transações')
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Exportar Transações"
      confirmText=""
    >
      <div className="space-y-4">
        <PeriodSelector onChange={setPeriod} />

        <div className="p-4 bg-stone-100 dark:bg-stone-900 rounded-xl">
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
            Período selecionado
          </p>
          <p className="font-semibold text-stone-900 dark:text-stone-50">
            {format(period.startDate, 'dd/MM/yyyy')} até {format(period.endDate, 'dd/MM/yyyy')}
          </p>
          <p className="text-sm text-stone-500 mt-2">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transação' : 'transações'} encontrada(s)
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Formato de exportação
          </p>
          
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="w-full p-4 flex items-center gap-3 bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-xl hover:border-stone-400 dark:hover:border-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-6 h-6 text-green-600" />
            <div className="text-left flex-1">
              <p className="font-semibold text-stone-900 dark:text-stone-50">
                Excel / CSV
              </p>
              <p className="text-sm text-stone-500">
                Abrir no Excel, Google Sheets, etc
              </p>
            </div>
            <Download className="w-5 h-5 text-stone-400" />
          </button>

          <button
            onClick={handleExportJSON}
            disabled={filteredTransactions.length === 0}
            className="w-full p-4 flex items-center gap-3 bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-xl hover:border-stone-400 dark:hover:border-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileJson className="w-6 h-6 text-blue-600" />
            <div className="text-left flex-1">
              <p className="font-semibold text-stone-900 dark:text-stone-50">
                JSON
              </p>
              <p className="text-sm text-stone-500">
                Formato para desenvolvedores
              </p>
            </div>
            <Download className="w-5 h-5 text-stone-400" />
          </button>
        </div>
      </div>
    </Dialog>
  )
}