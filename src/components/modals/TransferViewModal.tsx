import { ArrowRight, PiggyBank, Calendar, FileText } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { useAccountStore } from '@/stores/useAccountStore'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { Transaction } from '@/types/finance'

interface TransferViewModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction
}

export function TransferViewModal({ isOpen, onClose, transaction }: TransferViewModalProps) {
  const accounts = useAccountStore(state => state.accounts)

  const fromAccount = accounts.find(a => a.id === transaction.fromAccountId)
  const toAccount = accounts.find(a => a.id === transaction.toAccountId)

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes da Transferência"
      confirmText=""
    >
      <div className="space-y-4">
        {/* Aviso de Read-Only */}
        <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-lg text-sm">
          ⓘ Transferências não podem ser editadas
        </div>

        {/* Fluxo Visual */}
        <div className="p-4 bg-stone-100 dark:bg-stone-900 rounded-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center mx-auto mb-2">
                <PiggyBank className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-stone-500">De</p>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                {fromAccount?.name || 'Conta removida'}
              </p>
            </div>

            <ArrowRight className="w-6 h-6 text-stone-400 flex-shrink-0" />

            <div className="flex-1 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-2">
                <PiggyBank className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs text-stone-500">Para</p>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                {toAccount?.name || 'Conta removida'}
              </p>
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="space-y-3">
          {/* Valor */}
          <div className="p-4 bg-stone-100 dark:bg-stone-900 rounded-xl">
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 mb-2">
              <span className="text-sm">Valor Transferido</span>
            </div>
            <p className="text-3xl font-bold text-stone-900 dark:text-stone-50">
              {formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Data */}
          <div className="flex items-center gap-3 p-3 bg-stone-100 dark:bg-stone-900 rounded-lg">
            <Calendar className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            <div className="flex-1">
              <p className="text-xs text-stone-500">Data</p>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                {formatDate(new Date(transaction.date))}
              </p>
            </div>
          </div>

          {/* Descrição */}
          {transaction.description && (
            <div className="flex items-start gap-3 p-3 bg-stone-100 dark:bg-stone-900 rounded-lg">
              <FileText className="w-5 h-5 text-stone-600 dark:text-stone-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-stone-500">Descrição</p>
                <p className="text-sm text-stone-900 dark:text-stone-50">
                  {transaction.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}