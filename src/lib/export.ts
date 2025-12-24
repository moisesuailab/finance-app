import type { Transaction } from '@/types/finance'
import { format } from 'date-fns'
import { formatCurrency } from './formatters'

interface ExportTransaction {
  date: string
  description: string
  category: string
  account: string
  type: string
  amount: string
  status: string
}

export function exportToCSV(
  transactions: Transaction[],
  categories: { id?: number; name: string }[],
  accounts: { id?: number; name: string }[]
) {
  const data: ExportTransaction[] = transactions.map(t => ({
    date: format(new Date(t.date), 'dd/MM/yyyy'),
    description: t.description,
    category: categories.find(c => c.id === t.categoryId)?.name || 'Sem categoria',
    account: accounts.find(a => a.id === t.accountId)?.name || 'Sem conta',
    type: t.type === 'income' ? 'Receita' : 'Despesa',
    amount: formatCurrency(t.amount),
    status: t.status === 'completed' ? 'Paga' : 'Pendente'
  }))

  const headers = ['Data', 'Descrição', 'Categoria', 'Conta', 'Tipo', 'Valor', 'Status']
  const csv = [
    headers.join(','),
    ...data.map(row => 
      [
        row.date,
        `"${row.description}"`,
        `"${row.category}"`,
        `"${row.account}"`,
        row.type,
        `"${row.amount}"`,
        row.status
      ].join(',')
    )
  ].join('\n')

  return csv
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportToJSON(
  transactions: Transaction[],
  categories: { id?: number; name: string }[],
  accounts: { id?: number; name: string }[]
) {
  const data = {
    transactions: transactions.map(t => ({
      ...t,
      categoryName: categories.find(c => c.id === t.categoryId)?.name,
      accountName: accounts.find(a => a.id === t.accountId)?.name,
    })),
    exportDate: new Date().toISOString(),
    totalTransactions: transactions.length
  }

  return JSON.stringify(data, null, 2)
}

export function downloadJSON(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}