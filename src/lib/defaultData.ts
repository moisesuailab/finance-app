import type { Category } from '@/types/finance'

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Despesas
  { name: 'Alimentação', color: '#ef4444', icon: 'utensils', type: 'expense' },
  { name: 'Transporte', color: '#f59e0b', icon: 'car', type: 'expense' },
  { name: 'Habitação', color: '#7c3aed', icon: 'home', type: 'expense' },
  { name: 'Serviços', color: '#0ea5e9', icon: 'zap', type: 'expense' },
  { name: 'Assinaturas', color: '#ec4899', icon: 'credit-card', type: 'expense' },
  { name: 'Saúde', color: '#10b981', icon: 'heart', type: 'expense' },
  { name: 'Educação', color: '#3b82f6', icon: 'book', type: 'expense' },
  { name: 'Lazer', color: '#06b6d4', icon: 'gamepad', type: 'expense' },
  { name: 'Compras', color: '#84cc16', icon: 'shopping-bag', type: 'expense' },
  { name: 'Outros', color: '#6b7280', icon: 'more-horizontal', type: 'expense' },
  
  // Receitas
  { name: 'Salário', color: '#10b981', icon: 'briefcase', type: 'income' },
  { name: 'Investimentos', color: '#3b82f6', icon: 'trending-up', type: 'income' },
  { name: 'Freelance', color: '#8b5cf6', icon: 'code', type: 'income' },
  { name: 'Outros', color: '#6b7280', icon: 'more-horizontal', type: 'income' },
]
