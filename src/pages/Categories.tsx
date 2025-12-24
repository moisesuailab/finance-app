import { useState, useMemo } from 'react'
import { Plus, Tag, Search } from 'lucide-react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { CategoryForm } from '@/components/forms/CategoryForm'

export function Categories() {
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const categories = useCategoryStore(state => state.categories)

  const filteredCategories = useMemo(() => {
    let filtered = categories

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.type === filterType)
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [categories, filterType, searchTerm])

  const incomeCount = categories.filter(c => c.type === 'income').length
  const expenseCount = categories.filter(c => c.type === 'expense').length

  const handleEdit = (categoryId: number) => {
    setEditingCategory(categoryId)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCategory(null)
  }

  return (
    <MobileLayout>
      <Header 
        title="Categorias"
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
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setFilterType('all')}
            className={`p-4 rounded-xl transition-all ${
              filterType === 'all'
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 shadow-lg'
                : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
            }`}
          >
            <p className="text-2xl font-bold">{categories.length}</p>
            <p className="text-xs mt-1">Todas</p>
          </button>

          <button
            onClick={() => setFilterType('income')}
            className={`p-4 rounded-xl transition-all ${
              filterType === 'income'
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
            }`}
          >
            <p className="text-2xl font-bold">{incomeCount}</p>
            <p className="text-xs mt-1">Receitas</p>
          </button>

          <button
            onClick={() => setFilterType('expense')}
            className={`p-4 rounded-xl transition-all ${
              filterType === 'expense'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
            }`}
          >
            <p className="text-2xl font-bold">{expenseCount}</p>
            <p className="text-xs mt-1">Despesas</p>
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Input
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Lista de Categorias */}
        {filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Tag className="w-12 h-12 text-stone-400 mx-auto mb-4" />
              <p className="text-stone-500 mb-4">
                {searchTerm 
                  ? 'Nenhuma categoria encontrada' 
                  : 'Nenhuma categoria neste filtro'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar categoria
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredCategories.map((category) => (
              <Card
                key={category.id}
                onClick={() => handleEdit(category.id!)}
                className="active:scale-[0.98] transition-transform cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      <Tag
                        className="w-6 h-6"
                        style={{ color: category.color }}
                      />
                    </div>
                    <div className="w-full">
                      <p className="font-semibold text-stone-900 dark:text-stone-50 truncate">
                        {category.name}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {category.type === 'income' ? 'Receita' : 'Despesa'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredCategories.length > 0 && (
          <p className="text-center text-sm text-stone-500">
            {filteredCategories.length} {filteredCategories.length === 1 ? 'categoria' : 'categorias'}
            {searchTerm && ' encontrada(s)'}
          </p>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <CategoryForm
          isOpen={showForm}
          onClose={handleCloseForm}
          categoryId={editingCategory}
        />
      )}
    </MobileLayout>
  )
}