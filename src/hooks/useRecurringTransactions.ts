import { useEffect } from 'react'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { shouldGenerateRecurrence, getNextRecurrenceDate } from '@/lib/recurrence'
import { startOfDay } from 'date-fns'

export function useRecurringTransactions() {
  const { transactions, addTransaction } = useTransactionStore()

  useEffect(() => {
    const checkAndGenerateRecurring = async () => {
      const recurringTransactions = transactions.filter(t => t.isRecurring && t.recurrenceType !== 'none')

      for (const transaction of recurringTransactions) {
        const lastDate = new Date(transaction.date)
        
        if (shouldGenerateRecurrence(lastDate, transaction.recurrenceType, transaction.recurrenceEndDate)) {
          const nextDate = getNextRecurrenceDate(lastDate, transaction.recurrenceType)
          
          if (nextDate) {
            // Verificar se já não existe uma transação para essa data
            const exists = transactions.some(t => 
              t.description === transaction.description &&
              t.categoryId === transaction.categoryId &&
              t.accountId === transaction.accountId &&
              t.amount === transaction.amount &&
              startOfDay(new Date(t.date)).getTime() === startOfDay(nextDate).getTime()
            )

            if (!exists) {
              // Criar nova transação pendente (removendo campos que não existem em CreateTransactionInput)
              await addTransaction({
                type: transaction.type,
                status: 'pending', // Sempre criar como pendente
                amount: transaction.amount,
                description: transaction.description,
                categoryId: transaction.categoryId,
                accountId: transaction.accountId,
                date: nextDate,
                isRecurring: transaction.isRecurring,
                recurrenceType: transaction.recurrenceType,
                recurrenceEndDate: transaction.recurrenceEndDate,
                tags: transaction.tags
              })
            }
          }
        }
      }
    }

    // Executar verificação ao carregar
    checkAndGenerateRecurring()

    // Executar verificação a cada 1 hora
    const interval = setInterval(checkAndGenerateRecurring, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [transactions, addTransaction])
}