import { useState } from 'react'
import { Moon, Sun, Trash2, Download, Upload, Database, Wallet } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Card, CardContent } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { db } from '@/lib/db'
import { toast } from 'react-toastify'

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark')
  })
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const toggleDarkMode = () => {
    const html = document.documentElement
    if (html.classList.contains('dark')) {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setDarkMode(false)
    } else {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setDarkMode(true)
    }
  }

  const handleExportData = async () => {
    try {
      const data = {
        accounts: await db.accounts.toArray(),
        categories: await db.categories.toArray(),
        transactions: await db.transactions.toArray(),
        budgets: await db.budgets.toArray(),
        exportDate: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financas-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Dados exportados com sucesso!')
    } catch {
      toast.error('Erro ao exportar dados')
    }
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        await db.transaction('rw', db.accounts, db.categories, db.transactions, db.budgets, async () => {
          if (data.accounts) await db.accounts.bulkAdd(data.accounts)
          if (data.categories) await db.categories.bulkAdd(data.categories)
          if (data.transactions) await db.transactions.bulkAdd(data.transactions)
          if (data.budgets) await db.budgets.bulkAdd(data.budgets)
        })

        toast.success('Dados importados com sucesso!')
        window.location.reload()
      } catch {
        toast.error('Erro ao importar dados. Verifique o arquivo.')
      }
    }
    input.click()
  }

  const handleClearData = async () => {
    setIsLoading(true)
    try {
      await db.transaction('rw', db.accounts, db.categories, db.transactions, db.budgets, async () => {
        await db.accounts.clear()
        await db.categories.clear()
        await db.transactions.clear()
        await db.budgets.clear()
      })

      toast.success('Todos os dados foram apagados!')
      setShowClearDialog(false)
      window.location.reload()
    } catch {
      toast.error('Erro ao apagar dados')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Drawer isOpen={isOpen} onClose={onClose} title="Configurações">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Aparência */}
          <div>
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-3 px-2">
              APARÊNCIA
            </h2>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {darkMode ? (
                      <Moon className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                    ) : (
                      <Sun className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                    )}
                    <div>
                      <p className="font-medium text-stone-900 dark:text-stone-50">
                        Modo Escuro
                      </p>
                      <p className="text-sm text-stone-500">
                        {darkMode ? 'Ativado' : 'Desativado'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      darkMode ? 'bg-stone-700' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Aplicativo */}
          <div>
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-3 px-2">
              APLICATIVO
            </h2>
            <Card>
              <CardContent className="p-4">
                <button
                  onClick={() => {
                    localStorage.removeItem('hasSeenWelcome')
                    window.location.reload()
                  }}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <Wallet className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-50">
                      Rever Apresentação
                    </p>
                    <p className="text-sm text-stone-500">
                      Visualizar recursos do app novamente
                    </p>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Dados */}
          <div>
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-3 px-2">
              DADOS
            </h2>
            <div className="space-y-2">
              <Card>
                <CardContent className="p-4">
                  <button
                    onClick={handleExportData}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <Download className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                    <div>
                      <p className="font-medium text-stone-900 dark:text-stone-50">
                        Exportar Dados
                      </p>
                      <p className="text-sm text-stone-500">
                        Baixar backup em JSON
                      </p>
                    </div>
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <button
                    onClick={handleImportData}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <Upload className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                    <div>
                      <p className="font-medium text-stone-900 dark:text-stone-50">
                        Importar Dados
                      </p>
                      <p className="text-sm text-stone-500">
                        Restaurar backup de arquivo
                      </p>
                    </div>
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <button
                    onClick={() => setShowClearDialog(true)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-500" />
                    <div>
                      <p className="font-medium text-red-600 dark:text-red-500">
                        Apagar Todos os Dados
                      </p>
                      <p className="text-sm text-stone-500">
                        Limpar banco de dados local
                      </p>
                    </div>
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Informações */}
          <div>
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-3 px-2">
              SOBRE
            </h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-50">
                      Armazenamento Local
                    </p>
                    <p className="text-sm text-stone-500">
                      Seus dados nunca saem do dispositivo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Drawer>

      {/* Dialog de Confirmação */}
      <Dialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={handleClearData}
        title="Apagar Todos os Dados"
        confirmText="Apagar Tudo"
        variant="danger"
        isLoading={isLoading}
      >
        <p className="text-stone-600 dark:text-stone-400">
          Tem certeza que deseja apagar <strong>todos os dados</strong> do aplicativo?
        </p>
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
          Esta ação é irreversível! Todas as contas, categorias, transações e orçamentos serão perdidos permanentemente.
        </p>
      </Dialog>
    </>
  )
}