import { useState } from 'react'
import { Shield, Clock, Eye, EyeOff } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { useSecurityStore } from '@/stores/useSecurityStore'
import { toast } from 'react-toastify'

interface SecurityModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'enable' | 'change'
}

const TIMEOUT_OPTIONS = [
  { value: '5', label: '5 minutos' },
  { value: '15', label: '15 minutos' },
  { value: '30', label: '30 minutos' },
  { value: '60', label: '1 hora' },
  { value: '0', label: 'Nunca expirar' }
]

export function SecurityModal({ isOpen, onClose, mode }: SecurityModalProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [timeout, setTimeout] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [showCurrentPin, setShowCurrentPin] = useState(false)

  const { enableAuth, validatePin, logout } = useSecurityStore()

  const handleSubmit = async () => {
    // Validações
    if (mode === 'change' && !currentPin) {
      toast.error('Digite o PIN atual')
      return
    }

    if (!pin) {
      toast.error('Digite o novo PIN')
      return
    }

    if (pin.length !== 6) {
      toast.error('O PIN deve ter exatamente 6 dígitos')
      return
    }

    if (!/^\d+$/.test(pin)) {
      toast.error('O PIN deve conter apenas números')
      return
    }

    if (pin !== confirmPin) {
      toast.error('Os PINs não coincidem')
      return
    }

    setIsLoading(true)

    try {
      // Se está alterando, validar PIN atual primeiro
      if (mode === 'change') {
        const isValid = await validatePin(currentPin)
        if (!isValid) {
          toast.error('PIN atual incorreto')
          setIsLoading(false)
          return
        }
      }

      // Habilitar autenticação
      await enableAuth(pin, parseInt(timeout))

      toast.success(
        mode === 'enable' 
          ? 'Autenticação habilitada com sucesso!' 
          : 'PIN alterado com sucesso!'
      )
      
      // Limpar campos
      setPin('')
      setConfirmPin('')
      setCurrentPin('')
      setTimeout('0')
      
      onClose()

      // Fazer logout para forçar re-autenticação
      if (mode === 'enable') {
        logout()
      }
    } catch (error) {
      console.error('Erro ao configurar PIN:', error)
      toast.error('Erro ao configurar PIN')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={mode === 'enable' ? 'Habilitar Autenticação' : 'Alterar PIN'}
      confirmText={mode === 'enable' ? 'Habilitar' : 'Alterar'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {/* Aviso Importante */}
        <div className="p-4 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-xl text-sm space-y-2">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Importante:</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Se esquecer seu PIN, você perderá acesso aos seus dados</li>
                <li>• Não compartilhe seu PIN com ninguém</li>
                <li>• Use um PIN de 6 dígitos que você lembrará</li>
              </ul>
            </div>
          </div>
        </div>

        {/* PIN Atual (apenas ao alterar) */}
        {mode === 'change' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
              PIN Atual
            </label>
            <div className="relative">
              <input
                type={showCurrentPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                placeholder="Digite o PIN atual (6 dígitos)"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                className="w-full h-12 px-4 pr-12 rounded-xl bg-stone-100 dark:bg-stone-900 border-2 border-transparent text-stone-900 dark:text-stone-50 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
              >
                {showCurrentPin ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Novo PIN */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            {mode === 'enable' ? 'Criar PIN' : 'Novo PIN'}
          </label>
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={6}
              placeholder="6 dígitos"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full h-12 px-4 pr-12 rounded-xl bg-stone-100 dark:bg-stone-900 border-2 border-transparent text-stone-900 dark:text-stone-50 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
            >
              {showPin ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Confirmar PIN */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Confirmar PIN
          </label>
          <div className="relative">
            <input
              type={showConfirmPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={6}
              placeholder="Digite novamente"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full h-12 px-4 pr-12 rounded-xl bg-stone-100 dark:bg-stone-900 border-2 border-transparent text-stone-900 dark:text-stone-50 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPin(!showConfirmPin)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
            >
              {showConfirmPin ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Timeout de Sessão (apenas ao habilitar) */}
        {mode === 'enable' && (
          <Select
            label="Tempo de Sessão"
            value={timeout}
            onChange={(e) => setTimeout(e.target.value)}
          >
            {TIMEOUT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}

        {/* Info sobre timeout */}
        <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-lg text-sm flex items-start gap-2">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            {timeout === '0' 
              ? 'Você permanecerá autenticado até fechar o aplicativo'
              : `Você será desconectado após ${TIMEOUT_OPTIONS.find(o => o.value === timeout)?.label.toLowerCase()} de inatividade`
            }
          </p>
        </div>
      </div>
    </Dialog>
  )
}