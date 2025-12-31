import { useState, useEffect, useCallback } from 'react'
import { Shield, AlertTriangle } from 'lucide-react'
import { PinInput } from '@/components/ui/PinInput'
import { useSecurityStore } from '@/stores/useSecurityStore'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from 'react-toastify'

export function PinLogin() {
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const { validatePin, resetAllData } = useSecurityStore()

  const MAX_ATTEMPTS = 5

  const handleSubmit = useCallback(async () => {
    if (pin.length < 6) {
      return
    }

    if (attempts >= MAX_ATTEMPTS) {
      toast.error('Muitas tentativas. Use "Esqueci meu PIN" para resetar')
      return
    }

    setIsLoading(true)

    try {
      const isValid = await validatePin(pin)

      if (isValid) {
        toast.success('Bem-vindo de volta!')
        setAttempts(0)
      } else {
        const remainingAttempts = MAX_ATTEMPTS - attempts - 1
        setAttempts(prev => prev + 1)
        setPin('')

        if (remainingAttempts > 0) {
          toast.error(`PIN incorreto. ${remainingAttempts} tentativa(s) restante(s)`)
        } else {
          toast.error('Muitas tentativas. Use "Esqueci meu PIN"')
        }
      }
    } catch (error) {
      console.error('Erro ao validar PIN:', error)
      toast.error('Erro ao validar PIN')
      setPin('')
    } finally {
      setIsLoading(false)
    }
  }, [pin, attempts, validatePin])

  // Auto-submit quando completar 6 dígitos
  useEffect(() => {
    if (pin.length === 6 && attempts < MAX_ATTEMPTS) {
      handleSubmit()
    }
  }, [pin, attempts, handleSubmit])

  // Limpar PIN quando exceder tentativas
  useEffect(() => {
    if (attempts >= MAX_ATTEMPTS) {
      setPin('')
    }
  }, [attempts])

  const handleReset = async () => {
    if (confirmText !== 'EXCLUIR TUDO') {
      toast.error('Digite "EXCLUIR TUDO" para confirmar')
      return
    }

    setIsLoading(true)

    try {
      await resetAllData()
      toast.success('Todos os dados foram apagados')
      setShowResetDialog(false)
      
      // Recarregar página para iniciar setup
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Erro ao resetar:', error)
      toast.error('Erro ao resetar dados')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
        <div className="w-full max-w-md space-y-8">
          {/* Logo/Ícone */}
          <div className="text-center">
            <div className="inline-flex p-6 bg-stone-300 dark:bg-stone-700 rounded-3xl mb-6">
              <Shield className="w-16 h-16 text-stone-700 dark:text-stone-300" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">
              Digite seu PIN
            </h1>
            <p className="text-stone-600 dark:text-stone-400 mt-2">
              Para acessar suas finanças
            </p>
          </div>

          {/* Input de PIN */}
          <div className="space-y-6">
            <PinInput
              value={pin}
              onChange={setPin}
              length={6}
              disabled={attempts >= MAX_ATTEMPTS || isLoading}
              autoFocus
              error={attempts > 0}
            />

            {/* Aviso de tentativas */}
            {attempts > 0 && attempts < MAX_ATTEMPTS && (
              <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p>
                  {MAX_ATTEMPTS - attempts} tentativa(s) restante(s)
                </p>
              </div>
            )}

            {/* Bloqueio por tentativas */}
            {attempts >= MAX_ATTEMPTS && (
              <div className="p-3 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-lg text-sm">
                <p className="font-semibold mb-1">Muitas tentativas incorretas</p>
                <p className="text-xs">Use "Esqueci meu PIN" para resetar o aplicativo</p>
              </div>
            )}

            {/* Botão "Esqueci meu PIN" */}
            <button
              type="button"
              onClick={() => setShowResetDialog(true)}
              className="w-full py-3 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors text-sm"
            >
              Esqueci meu PIN
            </button>
          </div>

          {/* Info de segurança */}
          <p className="text-xs text-center text-stone-500">
            Seus dados estão seguros no seu dispositivo
          </p>
        </div>
      </div>

      {/* Dialog de Reset */}
      <Dialog
        isOpen={showResetDialog}
        onClose={() => {
          setShowResetDialog(false)
          setConfirmText('')
        }}
        onConfirm={handleReset}
        title="Resetar Aplicativo"
        confirmText="Excluir Tudo"
        variant="danger"
        isLoading={isLoading}
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-lg text-sm">
            <p className="font-semibold mb-2">Esta ação é IRREVERSÍVEL!</p>
            <p className="text-xs">Você perderá permanentemente:</p>
            <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
              <li>Todas as contas</li>
              <li>Todas as transações</li>
              <li>Todas as categorias</li>
              <li>Todas as configurações</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Digite "EXCLUIR TUDO" para confirmar:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="EXCLUIR TUDO"
              className="w-full h-12 px-4 rounded-xl bg-stone-100 dark:bg-stone-900 border-2 border-transparent focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </Dialog>
    </>
  )
}