import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAccountStore } from '@/stores/useAccountStore'
import { formatCurrency } from '@/lib/formatters'
import { AccountForm } from '@/components/forms/AccountForm'

export function Accounts() {
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<number | null>(null)
  
  const accounts = useAccountStore(state => state.accounts)

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)

  const handleEdit = (accountId: number) => {
    setEditingAccount(accountId)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingAccount(null)
  }

  return (
    <MobileLayout>
      <Header 
        title="Contas"
        action={
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova</span>
          </Button>
        }
      />

      <div className="p-4 sm:p-6 space-y-4">
        {/* Total */}
        <Card className="bg-gradient-to-br from-stone-900 to-stone-800 dark:from-stone-800 dark:to-stone-900 border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-stone-400 mb-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Saldo Total</span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-white">
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-sm text-stone-400 mt-2">
              {accounts.length} {accounts.length === 1 ? 'conta' : 'contas'}
            </p>
          </CardContent>
        </Card>

        {/* Lista de Contas */}
        {accounts.length === 0 ? (
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
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
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
                      <Wallet 
                        className="w-6 h-6"
                        style={{ color: account.color }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-stone-900 dark:text-stone-50 truncate">
                        {account.name}
                      </h3>
                      <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1">
                        {formatCurrency(account.currentBalance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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