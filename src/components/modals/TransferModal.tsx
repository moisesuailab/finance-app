import { useState, useEffect, useMemo } from 'react'
import { ArrowRight, PiggyBank, Wallet } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { useAccountStore } from '@/stores/useAccountStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { toast } from 'react-toastify'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/formatters'

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'save' | 'withdraw' // save = Guardar, withdraw = Resgatar
}

export function TransferModal({ isOpen, onClose, mode = 'save' }: TransferModalProps) {
  const [transferMode, setTransferMode] = useState<'save' | 'withdraw'>(mode)
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const accounts = useAccountStore(state => state.accounts)
  const addTransaction = useTransactionStore(state => state.addTransaction)

  // Contas de origem conforme modo
  const sourceAccounts = useMemo(() => {
    if (transferMode === 'save') {
      // Guardar: origem = contas de pagamento
      return accounts.filter(a => !a.isArchived && !a.excludeFromTotal)
    } else {
      // Resgatar: origem = contas de reserva
      return accounts.filter(a => !a.isArchived && a.excludeFromTotal)
    }
  }, [accounts, transferMode])

  // Contas de destino conforme modo
  const destinationAccounts = useMemo(() => {
    if (transferMode === 'save') {
      // Guardar: destino = contas de reserva
      return accounts.filter(a => !a.isArchived && a.excludeFromTotal)
    } else {
      // Resgatar: destino = contas de pagamento
      return accounts.filter(a => !a.isArchived && !a.excludeFromTotal)
    }
  }, [accounts, transferMode])

  // Saldo da conta de origem
  const sourceAccount = accounts.find(a => a.id === parseInt(fromAccountId))
  const availableBalance = sourceAccount?.currentBalance || 0

  // Auto-selecionar primeira conta disponível
  useEffect(() => {
    if (sourceAccounts.length > 0 && !fromAccountId) {
      setFromAccountId(String(sourceAccounts[0].id))
    }
  }, [sourceAccounts, fromAccountId])

  useEffect(() => {
    if (destinationAccounts.length > 0 && !toAccountId) {
      setToAccountId(String(destinationAccounts[0].id))
    }
  }, [destinationAccounts, toAccountId])

  // Resetar ao mudar de modo
  useEffect(() => {
    setFromAccountId('')
    setToAccountId('')
    setAmount('')
  }, [transferMode])

  const handleSubmit = async () => {
    if (!fromAccountId || !toAccountId || !amount) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const numAmount = parseFloat(amount)
    if (numAmount <= 0) {
      toast.error('O valor deve ser maior que zero')
      return
    }

    // Validar saldo
    if (numAmount > availableBalance) {
      toast.error('Saldo insuficiente na conta de origem')
      return
    }

    // Validar contas diferentes
    if (fromAccountId === toAccountId) {
      toast.error('Selecione contas diferentes')
      return
    }

    setIsLoading(true)
    try {
      const now = new Date()
      
      // Descrição automática baseada nas contas
      const fromName = accounts.find(a => a.id === parseInt(fromAccountId))?.name || ''
      const toName = accounts.find(a => a.id === parseInt(toAccountId))?.name || ''
      const description = `${fromName} → ${toName}`

      // Criar transação de transferência
      await addTransaction({
        type: 'transfer',
        status: 'completed',
        amount: numAmount,
        description: description,
        categoryId: 0, // Transferências não têm categoria
        accountId: parseInt(fromAccountId), // Para compatibilidade
        fromAccountId: parseInt(fromAccountId),
        toAccountId: parseInt(toAccountId),
        date: now,
        isRecurring: false,
        recurrenceType: 'none'
      })

      toast.success(
        transferMode === 'save' 
          ? 'Dinheiro guardado com sucesso!'
          : 'Dinheiro resgatado com sucesso!'
      )
      onClose()
    } catch (error) {
      console.error('Erro na transferência:', error)
      toast.error('Erro ao realizar transferência')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title="Transferência"
      confirmText={transferMode === 'save' ? 'Guardar' : 'Resgatar'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {/* Seletor de Modo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Tipo de Transferência
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTransferMode('save')}
              className={cn(
                'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                transferMode === 'save'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
              )}
            >
              <PiggyBank className="w-5 h-5" />
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setTransferMode('withdraw')}
              className={cn(
                'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                transferMode === 'withdraw'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                  : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
              )}
            >
              <Wallet className="w-5 h-5" />
              Resgatar
            </button>
          </div>
        </div>

        {/* Visualização do fluxo */}
        <div className="p-4 bg-stone-100 dark:bg-stone-900 rounded-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 text-center">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2",
                transferMode === 'save' 
                  ? "bg-blue-100 dark:bg-blue-950"
                  : "bg-green-100 dark:bg-green-950"
              )}>
                {transferMode === 'save' ? (
                  <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                ) : (
                  <PiggyBank className="w-6 h-6 text-green-600 dark:text-green-400" />
                )}
              </div>
              <p className="text-xs text-stone-500">De</p>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                {transferMode === 'save' ? 'Pagamento' : 'Reserva'}
              </p>
            </div>

            <ArrowRight className="w-6 h-6 text-stone-400 flex-shrink-0" />

            <div className="flex-1 text-center">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2",
                transferMode === 'save' 
                  ? "bg-green-100 dark:bg-green-950"
                  : "bg-blue-100 dark:bg-blue-950"
              )}>
                {transferMode === 'save' ? (
                  <PiggyBank className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <p className="text-xs text-stone-500">Para</p>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                {transferMode === 'save' ? 'Reserva' : 'Pagamento'}
              </p>
            </div>
          </div>
        </div>

        {/* Conta de Origem */}
        <Select
          label="De (Origem)"
          value={fromAccountId}
          onChange={(e) => setFromAccountId(e.target.value)}
        >
          <option value="">Selecione a conta</option>
          {sourceAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>

        {/* Saldo disponível */}
        {fromAccountId && (
          <div className="p-3 bg-stone-100 dark:bg-stone-900 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600 dark:text-stone-400">Saldo disponível:</span>
              <span className={cn(
                "font-bold",
                availableBalance >= 0 
                  ? "text-green-600 dark:text-green-500" 
                  : "text-red-600 dark:text-red-500"
              )}>
                {formatCurrency(availableBalance)}
              </span>
            </div>
          </div>
        )}

        {/* Valor */}
        <CurrencyInput
          label="Valor"
          value={amount}
          onChange={setAmount}
        />

        {/* Conta de Destino */}
        <Select
          label="Para (Destino)"
          value={toAccountId}
          onChange={(e) => setToAccountId(e.target.value)}
        >
          <option value="">Selecione a conta</option>
          {destinationAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>

        {/* Avisos */}
        {sourceAccounts.length === 0 && (
          <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
            Não há contas {transferMode === 'save' ? 'de pagamento' : 'de reserva'} disponíveis.
          </div>
        )}

        {destinationAccounts.length === 0 && (
          <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
            Não há contas {transferMode === 'save' ? 'de reserva' : 'de pagamento'} disponíveis. 
            Crie uma primeiro.
          </div>
        )}
      </div>
    </Dialog>
  )
}