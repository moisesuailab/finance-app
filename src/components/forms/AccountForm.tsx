import { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { useAccountStore } from '@/stores/useAccountStore'
import { toast } from 'react-toastify'

interface AccountFormProps {
  isOpen: boolean
  onClose: () => void
  accountId?: number | null
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

export function AccountForm({ isOpen, onClose, accountId }: AccountFormProps) {
  const [name, setName] = useState('')
  const [initialBalance, setInitialBalance] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [isLoading, setIsLoading] = useState(false)

  const { accounts, addAccount, updateAccount, deleteAccount } = useAccountStore()

  const isEditing = !!accountId
  const account = accounts.find(a => a.id === accountId)

  useEffect(() => {
    if (account) {
      setName(account.name)
      setInitialBalance(String(account.initialBalance))
      setColor(account.color)
    }
  }, [account])

  const handleSubmit = async () => {
    if (!name || !initialBalance) {
      toast.error('Preencha todos os campos')
      return
    }

    const numBalance = parseFloat(initialBalance)
    if (numBalance < 0) {
      toast.error('O saldo não pode ser negativo')
      return
    }

    setIsLoading(true)
    try {
      if (isEditing && accountId) {
        // Calcular a diferença no saldo inicial
        const oldInitialBalance = account?.initialBalance || 0
        const difference = numBalance - oldInitialBalance
        
        await updateAccount(accountId, {
          name,
          color,
          initialBalance: numBalance,
          currentBalance: (account?.currentBalance || 0) + difference
        })
        toast.success('Conta atualizada com sucesso!')
      } else {
        await addAccount({
          name,
          initialBalance: numBalance,
          color,
          icon: 'wallet'
        })
        toast.success('Conta criada com sucesso!')
      }
      onClose()
    } catch {
      toast.error('Erro ao salvar conta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!accountId) return

    setIsLoading(true)
    try {
      await deleteAccount(accountId)
      toast.success('Conta excluída com sucesso!')
      onClose()
    } catch {
      toast.error('Erro ao excluir conta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={isEditing ? 'Editar Conta' : 'Nova Conta'}
      confirmText={isEditing ? 'Salvar' : 'Criar'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <Input
          label="Nome da Conta"
          placeholder="Ex: Carteira, Banco..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
        />

        <CurrencyInput
          label="Saldo Inicial"
          value={initialBalance}
          onChange={setInitialBalance}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Cor
          </label>
          <div className="grid grid-cols-8 gap-2">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                onClick={() => setColor(presetColor)}
                className="w-10 h-10 rounded-lg transition-transform active:scale-95"
                style={{ 
                  backgroundColor: presetColor,
                  border: color === presetColor ? '3px solid currentColor' : 'none',
                  opacity: color === presetColor ? 1 : 0.6
                }}
              />
            ))}
          </div>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full py-3 px-4 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            Excluir Conta
          </button>
        )}
      </div>
    </Dialog>
  )
}