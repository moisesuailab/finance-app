import { useState, useMemo } from 'react'
import { Plus, Wallet, PiggyBank, Archive, Eye, EyeOff } from 'lucide-react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAccountStore } from '@/stores/useAccountStore'
import { useVisibility } from '@/hooks/useVisibility'
import { BlurValue } from '@/components/ui/BlurValue'
import { CompactCurrency } from '@/components/ui/CompactCurrency'
import { AccountForm } from '@/components/forms/AccountForm'

export function Accounts() {
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<number | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  
  const accounts = useAccountStore(state => state.accounts)
  const { isVisible, toggleVisibility } = useVisibility()

  // Separar contas por tipo
  const { paymentAccounts, reserveAccounts, archivedAccounts } = useMemo(() => {
    const active = accounts.filter(a => !a.isArchived)
    const archived = accounts.filter(a => a.isArchived)

    return {
      paymentAccounts: active.filter(a => !a.excludeFromTotal),
      reserveAccounts: active.filter(a => a.excludeFromTotal),
      archivedAccounts: archived
    }
  }, [accounts])

  // Calcular subtotais
  const paymentTotal = paymentAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
  const reserveTotal = reserveAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0)

  const handleEdit = (accountId: number) => {
    setEditingAccount(accountId)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingAccount(null)
  }

  const renderAccountCard = (account: typeof accounts[0], isReserve = false) => (
    <Card 
      key={account.id}
      onClick={() => handleEdit(account.id!)}
      className="active:scale-[0.98] transition-transform cursor-pointer"
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: account.color + '20' }}
          >
            {isReserve ? (
              <PiggyBank 
                className="w-6 h-6"
                style={{ color: account.color }}
              />
            ) : (
              <Wallet 
                className="w-6 h-6"
                style={{ color: account.color }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 truncate">
              {account.name}
            </h3>
            {account.description && (
              <p className="text-xs text-stone-500 truncate mt-0.5">
                {account.description}
              </p>
            )}
            <BlurValue isVisible={isVisible}>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1">
                <CompactCurrency value={account.currentBalance} disableTap />
              </p>
            </BlurValue>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <MobileLayout>
      <Header 
        title="Contas"
        action={
          <div className="flex gap-2">
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
        {/* Cards de Subtotal */}
        <div className="grid grid-cols-2 gap-4">
          {/* Contas de Pagamento */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 mb-2">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-medium">Pagamento</span>
              </div>
              <BlurValue isVisible={isVisible}>
                <p className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 break-all">
                  <CompactCurrency value={paymentTotal} />
                </p>
              </BlurValue>
              <p className="text-xs text-stone-500 mt-1">
                {paymentAccounts.length} {paymentAccounts.length === 1 ? 'conta' : 'contas'}
              </p>
            </CardContent>
          </Card>

          {/* Contas de Reserva */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 mb-2">
                <PiggyBank className="w-4 h-4" />
                <span className="text-xs font-medium">Reservas</span>
              </div>
              <BlurValue isVisible={isVisible}>
                <p className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 break-all">
                  <CompactCurrency value={reserveTotal} />
                </p>
              </BlurValue>
              <p className="text-xs text-stone-500 mt-1">
                {reserveAccounts.length} {reserveAccounts.length === 1 ? 'conta' : 'contas'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Toggle de Arquivadas */}
        {archivedAccounts.length > 0 && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between p-3 bg-stone-100 dark:bg-stone-900 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              {showArchived ? (
                <EyeOff className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              ) : (
                <Eye className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              )}
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {showArchived ? 'Ocultar' : 'Mostrar'} arquivadas ({archivedAccounts.length})
              </span>
            </div>
          </button>
        )}

        {/* Seção: Contas de Pagamento */}
        {paymentAccounts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Contas de Pagamento
              </h2>
            </div>
            
            <div className="space-y-2">
              {paymentAccounts.map((account) => renderAccountCard(account, false))}
            </div>
          </div>
        )}

        {/* Seção: Reservas e Objetivos */}
        {reserveAccounts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Reservas e Objetivos
              </h2>
            </div>
            
            <div className="space-y-2">
              {reserveAccounts.map((account) => renderAccountCard(account, true))}
            </div>
          </div>
        )}

        {/* Seção: Arquivadas (se toggle ativo) */}
        {showArchived && archivedAccounts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Arquivadas
              </h2>
            </div>
            
            <div className="space-y-2 opacity-60">
              {archivedAccounts.map((account) => (
                <Card 
                  key={account.id}
                  onClick={() => handleEdit(account.id!)}
                  className="active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-stone-200 dark:bg-stone-800">
                        <Archive className="w-6 h-6 text-stone-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-stone-900 dark:text-stone-50 truncate">
                            {account.name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full">
                            Arquivada
                          </span>
                        </div>
                        <BlurValue isVisible={isVisible}>
                          <p className="text-xl font-bold text-stone-500 dark:text-stone-600 mt-1">
                            <CompactCurrency value={account.currentBalance} disableTap />
                          </p>
                        </BlurValue>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {paymentAccounts.length === 0 && reserveAccounts.length === 0 && !showArchived && (
          <Card>
            <CardContent className="p-12 text-center">
              <Wallet className="w-12 h-12 text-stone-400 mx-auto mb-4" />
              <p className="text-stone-500 mb-4">Nenhuma conta cadastrada</p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar primeira conta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <AccountForm
          isOpen={showForm}
          onClose={handleCloseForm}
          accountId={editingAccount}
        />
      )}
    </MobileLayout>
  )
}