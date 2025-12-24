import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '@/lib/formatters'

interface BarChartProps {
  income: number
  expenses: number
}

export function BarChart({ income, expenses }: BarChartProps) {
  const data = [
    {
      name: 'Receitas',
      value: income,
      color: '#10b981', // green-600
      label: formatCurrency(income)
    },
    {
      name: 'Despesas',
      value: expenses,
      color: '#ef4444', // red-600
      label: formatCurrency(expenses)
    }
  ]

  const maxValue = Math.max(income, expenses, 100)
  const balance = income - expenses

  return (
    <div className="space-y-2 select-none">
      {/* Gráfico */}
      <div className="h-60 [&_*]:outline-none [&_*]:focus:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart 
            data={data} 
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
            <XAxis 
              dataKey="name" 
              stroke="currentColor"
              className="text-xs text-stone-500"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              stroke="currentColor"
              className="text-xs text-stone-500"
              tick={{ fill: 'currentColor' }}
              domain={[0, maxValue]}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `R$ ${(value / 1000).toFixed(1)}k`
                }
                return `R$ ${value}`
              }}
            />
            <Bar 
              dataKey="value" 
              radius={[12, 12, 0, 0]}
              isAnimationActive={true}
              label={{
                position: 'top',
                fill: 'currentColor',
                className: 'text-xs font-bold',
                formatter: (value) => typeof value === 'number' ? formatCurrency(value) : ''
              }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  style={{ outline: 'none' }}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>

      {/* Balanço */}
      <div className="text-center pt-4 border-t border-stone-200 dark:border-stone-800">
        <p className="text-sm text-stone-500 mb-2">Balanço</p>
        <p className={`text-2xl font-bold ${
          balance >= 0 
            ? 'text-green-600 dark:text-green-500' 
            : 'text-red-600 dark:text-red-500'
        }`}>
          {balance >= 0 ? '+' : ''}
          {formatCurrency(balance)}
        </p>
      </div>
    </div>
  )
}