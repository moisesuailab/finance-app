import { useState } from 'react'
import { Wallet, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface WelcomeProps {
  onComplete: () => void
}

export function Welcome({ onComplete }: WelcomeProps) {
  const [step, setStep] = useState(0)

  const features = [
    {
      icon: '💰',
      title: 'Controle Total',
      description: 'Gerencie suas finanças de forma simples e eficiente'
    },
    {
      icon: '🔒',
      title: 'Privacidade Garantida',
      description: 'Seus dados ficam apenas no seu dispositivo'
    },
    {
      icon: '📱',
      title: 'Offline First',
      description: 'Funciona perfeitamente sem conexão com a internet'
    },
    {
      icon: '🔄',
      title: 'Transações Recorrentes',
      description: 'Automatize lançamentos mensais como salário e contas fixas'
    }
  ]

  if (step > 0 && step <= features.length) {
    const feature = features[step - 1]
    return (
      <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
        <div className="w-full max-w-md pt-12">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {features.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 rounded-full transition-all ${
                  index < step
                    ? 'bg-stone-900 dark:bg-stone-50'
                    : 'bg-stone-300 dark:bg-stone-700'
                }`}
              />
            ))}
          </div>

          {/* Feature */}
          <div className="text-center space-y-6">
            <div className="text-7xl mb-8">{feature.icon}</div>
            <h2 className="text-3xl font-bold text-stone-900 dark:text-stone-50">
              {feature.title}
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400">
              {feature.description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full max-w-md space-y-3 pb-8">
          <Button
            onClick={() => step === features.length ? onComplete() : setStep(step + 1)}
            className="w-full gap-2"
          >
            {step === features.length ? (
              <>
                <Check className="w-5 h-5" />
                Começar
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
          <button
            onClick={onComplete}
            className="w-full py-3 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
          >
            Pular
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-6 bg-stone-200 dark:bg-stone-800 rounded-3xl">
            <Wallet className="w-16 h-16 text-stone-700 dark:text-stone-300" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50">
            Finanças Pessoais
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-lg">
            Controle suas finanças de forma simples, privada e offline-first
          </p>
        </div>

        <div className="pt-4 space-y-4">
          <Button 
            onClick={() => setStep(1)}
            className="w-full gap-2"
          >
            Começar
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          <p className="text-sm text-stone-500">
            Seus dados permanecem no seu dispositivo
          </p>
        </div>
      </div>
    </div>
  )
}