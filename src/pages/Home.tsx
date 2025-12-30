import { useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  Search,
  Plus,
  PiggyBank,
  Eye,
  EyeOff,
  Repeat,
} from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { MonthSelector } from "@/components/ui/MonthSelector";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAccountStore } from "@/stores/useAccountStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { formatDate } from "@/lib/formatters";
import { isInMonthRange } from "@/lib/dateUtils";
import { useVisibility } from "@/hooks/useVisibility";
import { BlurValue } from "@/components/ui/BlurValue";
import { CompactCurrency } from "@/components/ui/CompactCurrency";
import type { Transaction } from "@/types/finance";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { TransferModal } from "@/components/modals/TransferModal";
import { TransferViewModal } from "@/components/modals/TransferViewModal";
import { calculateRecurringProjections } from "@/lib/projections";

export function Home() {
  const navigate = useNavigate()
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['all']));
  const [editingTransaction, setEditingTransaction] = useState<number | null>(
    null
  );
  const [initialTransactionType, setInitialTransactionType] = useState<
    "income" | "expense"
  >("income");
  const [showTransfer, setShowTransfer] = useState(false);
  const [viewingTransfer, setViewingTransfer] = useState<Transaction | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  const accounts = useAccountStore((state) => state.accounts);
  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);
  const { isVisible, toggleVisibility } = useVisibility();

  // Verificar se está no mês atual
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      selectedMonth.getMonth() === now.getMonth() &&
      selectedMonth.getFullYear() === now.getFullYear()
    );
  }, [selectedMonth]);

  const stats = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthTransactions = transactions.filter((t) =>
    isInMonthRange(new Date(t.date), selectedMonth)
  );

  // Transações até hoje (já realizadas)
  const pastTransactions = monthTransactions.filter((t) => {
    const date = new Date(t.date);
    date.setHours(0, 0, 0, 0);
    return date <= today && t.status === 'completed';
  });

  // Transações futuras (projeção) - JÁ CADASTRADAS
  const futureTransactions = monthTransactions.filter((t) => {
    const date = new Date(t.date);
    date.setHours(0, 0, 0, 0);
    return date > today || t.status === 'pending';
  });

  const income = pastTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = pastTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // ✨ NOVO: Incluir recorrências determinadas no cálculo
  const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
  
  const recurringProjections = calculateRecurringProjections(
    transactions,
    today > startOfMonth ? today : startOfMonth, // Do hoje até fim do mês
    endOfMonth
  );

  const futureIncome = futureTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0) + recurringProjections.projectedIncome;

  const futureExpenses = futureTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0) + recurringProjections.projectedExpenses;

  // Calcular os três saldos
  const availableBalance = accounts
    .filter((a) => !a.isArchived && !a.excludeFromTotal)
    .reduce((sum, acc) => sum + acc.currentBalance, 0);

  const reservedBalance = accounts
    .filter((a) => !a.isArchived && a.excludeFromTotal)
    .reduce((sum, acc) => sum + acc.currentBalance, 0);

  const totalBalance = availableBalance + reservedBalance;
  const monthBalance = income - expenses;

  // ✨ NOVO: Projeção 12 meses com recorrências determinadas
  let next12MonthsProjection = 0;
  if (isCurrentMonth) {
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const next12Months = new Date(today);
    next12Months.setMonth(next12Months.getMonth() + 12);
    
    // Transações futuras JÁ cadastradas
    const futureTransactionsNext12 = transactions.filter((t) => {
      const date = new Date(t.date);
      date.setHours(0, 0, 0, 0);
      return date >= startOfNextMonth && date <= next12Months;
    });
    
    const projectedIncome = futureTransactionsNext12
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const projectedExpenses = futureTransactionsNext12
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    // ✨ Adicionar recorrências determinadas
    const recurringNext12 = calculateRecurringProjections(
      transactions,
      startOfNextMonth,
      next12Months
    );
    
    next12MonthsProjection = 
      (projectedIncome + recurringNext12.projectedIncome) - 
      (projectedExpenses + recurringNext12.projectedExpenses);
  }

  return { 
    income, 
    expenses, 
    availableBalance, 
    reservedBalance, 
    totalBalance, 
    monthBalance,
    futureIncome,
    futureExpenses,
    next12MonthsProjection
  };
}, [transactions, accounts, selectedMonth, isCurrentMonth]);

  const filteredTransactions = useMemo(() => {
    return [...transactions]
        .filter((t) => isInMonthRange(new Date(t.date), selectedMonth))
        .filter((t) =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter((t) => {
        // Se "Todos" está ativo, não filtra por tipo/status
        if (activeFilters.has('all')) return true;
        
        // Filtros de tipo
        const matchesType = 
            (activeFilters.has('income') && t.type === 'income') ||
            (activeFilters.has('expense') && t.type === 'expense') ||
            (activeFilters.has('transfer') && t.type === 'transfer') ||
            (!activeFilters.has('income') && !activeFilters.has('expense') && !activeFilters.has('transfer'));
        
        // Filtro de status
        const matchesStatus = 
            (activeFilters.has('pending') && t.status === 'pending') ||
            (!activeFilters.has('pending'));
        
        return matchesType && matchesStatus;
        })
        .sort((a, b) => {
          // Ordem cronológica inversa (mais recente primeiro)
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    }, [transactions, selectedMonth, searchTerm, activeFilters]);

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

  const getAccountName = (accountId: number) => {
    return accounts.find((a) => a.id === accountId)?.name || "Sem conta";
  };

  const handleEdit = (transactionId: number) => {
    const transaction = transactions.find((t) => t.id === transactionId);

    if (transaction?.type === "transfer") {
      // Abrir modal de visualização read-only
      setViewingTransfer(transaction);
    } else {
      // Abrir formulário de edição normal
      setEditingTransaction(transactionId);
      setShowForm(true);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleOpenFormWithType = (type: "income" | "expense") => {
    setInitialTransactionType(type);
    setEditingTransaction(null);
    setShowForm(true);
  };
  
  const handleFilterToggle = (filter: string) => {
    setActiveFilters(prev => {
        const newFilters = new Set(prev);
        
        // Se clicar em "Todos"
        if (filter === 'all') {
        return new Set(['all']);
        }
        
        // Remove "Todos" se clicar em qualquer outro
        newFilters.delete('all');
        
        // Toggle do filtro clicado
        if (newFilters.has(filter)) {
        newFilters.delete(filter);
        } else {
        newFilters.add(filter);
        }
        
        // Se nenhum filtro, volta para "Todos"
        if (newFilters.size === 0) {
        return new Set(['all']);
        }
        
        return newFilters;
    });
  };

  return (
    <MobileLayout>
      <Header
        title="Início"
        action={
            <div className="flex gap-2">
            <button
                onClick={toggleVisibility}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                title={isVisible ? "Ocultar valores" : "Mostrar valores"}
            >
                {isVisible ? (
                <Eye className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                ) : (
                <EyeOff className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                )}
            </button>
            <button
                onClick={() => navigate('/settings/recurrence')}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                title="Gerenciar fixas"
            >
                <Repeat className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </button>
            {isCurrentMonth && (
                <button
                onClick={() => setShowTransfer(true)}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                title="Transferência"
                >
                <PiggyBank className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                </button>
            )}
            <Button
                size="sm"
                onClick={() => setShowForm(true)}
                className="gap-2"
            >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nova</span>
            </Button>
            </div>
          }
        />

      <div className="p-4 sm:p-6 space-y-4">
        {/* Seletor de Mês */}
        <MonthSelector
          currentMonth={selectedMonth}
          onChange={setSelectedMonth}
        />

        {/* Saldo Total */}
        <Card className="bg-gradient-to-br from-stone-900 to-stone-800 dark:from-stone-800 dark:to-stone-900 border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-stone-400 mb-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Saldo Disponível hoje</span>
            </div>
            <BlurValue isVisible={isVisible}>
              <p
                className={`text-3xl sm:text-4xl font-bold ${
                  stats.availableBalance >= 0 ? "text-white" : "text-red-400"
                }`}
              >
                <CompactCurrency value={stats.availableBalance} />
              </p>
            </BlurValue>

            {/* Balanço do Mês */}
            <div className="mt-3 pt-3 border-t border-stone-700">
              <p className="text-sm text-stone-400">Resultado do Mês</p>
              <BlurValue isVisible={isVisible}>
                <p
                  className={`text-xl font-bold ${
                    stats.monthBalance >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stats.monthBalance >= 0 ? "+" : ""}
                  <CompactCurrency value={stats.monthBalance} />
                </p>
              </BlurValue>

              {/* Projeções Futuras do Mês - Só mostra se houver */}
              {(stats.futureIncome > 0 || stats.futureExpenses > 0) && (
                <div className="mt-2 flex gap-4 text-xs">
                  {stats.futureIncome > 0 && (
                    <BlurValue isVisible={isVisible}>
                      <span className="text-green-400/80">
                        A receber:{" "}
                        <CompactCurrency value={stats.futureIncome} />
                      </span>
                    </BlurValue>
                  )}
                  {stats.futureExpenses > 0 && (
                    <BlurValue isVisible={isVisible}>
                      <span className="text-red-400/80">
                        A pagar:{" "}
                        <CompactCurrency value={stats.futureExpenses} />
                      </span>
                    </BlurValue>
                  )}
                </div>
              )}
            </div>

            {/* Projeção 12 Meses - Só no mês atual e se != 0 */}
            {isCurrentMonth && stats.next12MonthsProjection !== 0 && (
              <div className="mt-3 pt-3 border-t border-stone-700/50">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-stone-400">
                    Próximos 12 meses
                  </span>
                  <BlurValue isVisible={isVisible}>
                    <span
                      className={`text-sm font-semibold ${
                        stats.next12MonthsProjection >= 0
                          ? "text-green-400/90"
                          : "text-red-400/90"
                      }`}
                    >
                      {stats.next12MonthsProjection >= 0 ? "+" : ""}
                      <CompactCurrency value={stats.next12MonthsProjection} />
                    </span>
                  </BlurValue>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cards Resumo */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className="cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md"
            onClick={() => handleOpenFormWithType("income")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500 mb-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-950 rounded-lg">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium">Entradas</span>
              </div>
              <BlurValue isVisible={isVisible}>
                <p className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50">
                  <CompactCurrency value={stats.income} />
                </p>
              </BlurValue>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md"
            onClick={() => handleOpenFormWithType("expense")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-500 mb-2">
                <div className="p-1.5 bg-red-100 dark:bg-red-950 rounded-lg">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium">Saídas</span>
              </div>
              <BlurValue isVisible={isVisible}>
                <p className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50">
                  <CompactCurrency value={stats.expenses} />
                </p>
              </BlurValue>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Input
            placeholder="Buscar movimentações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Filtros por Tags */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => handleFilterToggle('all')}
            className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${activeFilters.has('all')
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-2 border-stone-900 dark:border-stone-50'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-transparent hover:bg-stone-300 dark:hover:bg-stone-700'
                }
            `}
            >
            Todas
          </button>
          
          <button
            onClick={() => handleFilterToggle('pending')}
            className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${activeFilters.has('pending')
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-2 border-stone-900 dark:border-stone-50'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-transparent hover:bg-stone-300 dark:hover:bg-stone-700'
                }
            `}
            >
            Pendentes
          </button>
          
          <button
            onClick={() => handleFilterToggle('income')}
            className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${activeFilters.has('income')
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-2 border-stone-900 dark:border-stone-50'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-transparent hover:bg-stone-300 dark:hover:bg-stone-700'
                }
            `}
            >
            Entradas
          </button>
          
          <button
            onClick={() => handleFilterToggle('expense')}
            className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${activeFilters.has('expense')
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-2 border-stone-900 dark:border-stone-50'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-transparent hover:bg-stone-300 dark:hover:bg-stone-700'
                }
            `}
            >
            Saídas
          </button>

          <button
            onClick={() => handleFilterToggle('transfer')}
            className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${activeFilters.has('transfer')
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-2 border-stone-900 dark:border-stone-50'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-transparent hover:bg-stone-300 dark:hover:bg-stone-700'
                }
            `}
            >
            Transferências
          </button>
        </div>

        {/* Transações */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Movimentações
            </h2>
          </div>

          {filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-stone-500">
                  {searchTerm
                    ? "Nenhuma movimentação encontrada"
                    : "Nenhuma movimentação neste mês"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => {
                // Verificar se é transferência
                const isTransfer = transaction.type === "transfer";
                const fromAccount = isTransfer
                  ? accounts.find((a) => a.id === transaction.fromAccountId)
                  : null;
                const toAccount = isTransfer
                  ? accounts.find((a) => a.id === transaction.toAccountId)
                  : null;

                return (
                  <Card
                    key={transaction.id}
                    onClick={() => handleEdit(transaction.id!)}
                    className="active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-xl flex-shrink-0 ${
                            isTransfer
                              ? "bg-stone-100 dark:bg-stone-800"
                              : transaction.type === "income"
                              ? "bg-green-100 dark:bg-green-950"
                              : "bg-red-100 dark:bg-red-950"
                          }`}
                        >
                          {isTransfer ? (
                            <PiggyBank className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                          ) : transaction.type === "income" ? (
                            <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-900 dark:text-stone-50 truncate">
                            {isTransfer
                              ? // Para transferências, mostrar só o fluxo no título
                                `${fromAccount?.name || "Conta removida"} → ${
                                  toAccount?.name || "Conta removida"
                                }`
                              : transaction.description}
                          </p>
                          <p className="text-sm text-stone-500 mt-1">
                            {isTransfer ? (
                              // Para transferências, não mostrar descrição duplicada
                              "Transferência"
                            ) : (
                              <>
                                {getCategoryName(transaction.categoryId)} •{" "}
                                {getAccountName(transaction.accountId)}
                              </>
                            )}
                          </p>
                          <p className="text-xs text-stone-400 mt-1">
                            {formatDate(new Date(transaction.date))}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <BlurValue isVisible={isVisible}>
                            <p
                              className={`text-lg font-bold ${
                                isTransfer
                                  ? "text-stone-600 dark:text-stone-400"
                                  : transaction.type === "income"
                                  ? "text-green-600 dark:text-green-500"
                                  : "text-red-600 dark:text-red-500"
                              }`}
                            >
                              {!isTransfer && transaction.type === "income"
                                ? "+"
                                : ""}
                              <CompactCurrency
                                value={transaction.amount}
                                disableTap
                              />
                            </p>
                          </BlurValue>
                          {transaction.status === "pending" && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                              <Clock className="w-3 h-3" />
                              Pendente
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Contador de transações */}
          {filteredTransactions.length > 0 && (
            <p className="text-center text-sm text-stone-500 mt-3">
              {filteredTransactions.length}{" "}
              {filteredTransactions.length === 1 ? "movimentação" : "movimentações"}
              {searchTerm && " encontrada(s)"}
            </p>
          )}
        </div>
      </div>

      {/* Modal de Transferência */}
      <TransferModal
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
      />

      {/* Modal de Visualização de Transferência */}
      {viewingTransfer && (
        <TransferViewModal
          isOpen={!!viewingTransfer}
          onClose={() => setViewingTransfer(null)}
          transaction={viewingTransfer}
        />
      )}

      {/* Formulário de Transação */}
      {showForm && (
        <TransactionForm
          isOpen={showForm}
          onClose={handleCloseForm}
          transactionId={editingTransaction}
          initialType={editingTransaction ? undefined : initialTransactionType}
          suggestedMonth={selectedMonth}
        />
      )}
    </MobileLayout>
  );
}
