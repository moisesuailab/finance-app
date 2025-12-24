import { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { toast } from 'react-toastify'
import { cn } from '@/lib/utils'
import type { TransactionType } from '@/types/finance'

interface CategoryFormProps {
  isOpen: boolean
  onClose: () => void
  categoryId?: number | null
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#f43f5e', // rose
]

export function CategoryForm({ isOpen, onClose, categoryId }: CategoryFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [isLoading, setIsLoading] = useState(false)

  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore()

  const isEditing = !!categoryId
  const category = categories.find(c => c.id === categoryId)

  useEffect(() => {
    if (category) {
      setName(category.name)
      setType(category.type)
      setColor(category.color)
    }
  }, [category])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Digite o nome da categoria')
      return
    }

    // Verificar se já existe categoria com mesmo nome e tipo
    const exists = categories.some(
      c => c.name.toLowerCase() === name.trim().toLowerCase() && 
           c.type === type && 
           c.id !== categoryId
    )

    if (exists) {
      toast.error('Já existe uma categoria com esse nome')
      return
    }

    setIsLoading(true)
    try {
      if (isEditing && categoryId) {
        await updateCategory(categoryId, {
          name: name.trim(),
          color,
          type
        })
        toast.success('Categoria atualizada!')
      } else {
        await addCategory({
          name: name.trim(),
          color,
          type,
          icon: 'tag'
        })
        toast.success('Categoria criada!')
      }
      onClose()
    } catch {
      toast.error('Erro ao salvar categoria')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!categoryId) return

    setIsLoading(true)
    try {
      await deleteCategory(categoryId)
      toast.success('Categoria excluída!')
      onClose()
    } catch {
      toast.error('Erro ao excluir categoria')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={isEditing ? 'Editar Categoria' : 'Nova Categoria'}
      confirmText={isEditing ? 'Salvar' : 'Criar'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {/* Tipo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Tipo
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                'flex-1 py-3 rounded-xl font-medium transition-all',
                type === 'income'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                  : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
              )}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                'flex-1 py-3 rounded-xl font-medium transition-all',
                type === 'expense'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
              )}
            >
              Despesa
            </button>
          </div>
        </div>

        <Input
          label="Nome"
          placeholder="Ex: Alimentação, Salário..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Cor
          </label>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                onClick={() => setColor(presetColor)}
                className="w-full aspect-square rounded-lg transition-transform active:scale-95"
                style={{
                  backgroundColor: presetColor,
                  border: color === presetColor ? '3px solid currentColor' : 'none',
                  opacity: color === presetColor ? 1 : 0.6
                }}
              />
            ))}
          </div>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full py-3 px-4 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            Excluir Categoria
          </button>
        )}
      </div>
    </Dialog>
  )
}