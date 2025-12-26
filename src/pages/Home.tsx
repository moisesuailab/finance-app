import { useMemo, useState } from "react";
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

export function Home() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<number | null>(
    null
  );
  const [initialTransactionType, setInitialTransactionType] = useState<
    "income" | "expense"
  >("income");
  const [showTransfer, setShowTransfer] = useState(false);
  const [viewingTransfer, setViewingTransfer] = useState<Transaction | null>(null);
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
    const monthTransactions = transactions.filter((t) =>
      isInMonthRange(new Date(t.date), selectedMonth)
    );

    const income = monthTransactions
      .filter((t) => t.type === "income" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter((t) => t.type === "expense" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);

    // Calcular os três saldos
    const availableBalance = accounts
      .filter((a) => !a.isArchived && !a.excludeFromTotal)
      .reduce((sum, acc) => sum + acc.currentBalance, 0);

    const reservedBalance = accounts
      .filter((a) => !a.isArchived && a.excludeFromTotal)
      .reduce((sum, acc) => sum + acc.currentBalance, 0);

    const totalBalance = availableBalance + reservedBalance;

    const monthBalance = income - expenses;

    return { income, expenses, availableBalance, reservedBalance, totalBalance, monthBalance };
  }, [transactions, accounts, selectedMonth]);

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .filter((t) => isInMonthRange(new Date(t.date), selectedMonth))
      .filter((t) =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // Pendentes primeiro
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        // Depois por data
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [transactions, selectedMonth, searchTerm]);

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

  const getAccountName = (accountId: number) => {
    return accounts.find((a) => a.id === accountId)?.name || "Sem conta";
  };

  const handleEdit = (transactionId: number) => {
    const transaction = transactions.find(t => t.id === transactionId)
    
    if (transaction?.type === 'transfer') {
      // Abrir modal de visualização read-only
      setViewingTransfer(transaction)
    } else {
      // Abrir formulário de edição normal
      setEditingTransaction(transactionId)
      setShowForm(true)
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
            {isCurrentMonth && (
              <button
                onClick={() => setShowTransfer(true)}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
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
              <span className="text-sm">Saldo Disponível</span>
            </div>
            <BlurValue isVisible={isVisible}>
              <p className={`text-3xl sm:text-4xl font-bold ${
                stats.availableBalance >= 0 ? 'text-white' : 'text-red-400'
              }`}>
                <CompactCurrency value={stats.availableBalance} />
              </p>
            </BlurValue>
            <div className="mt-3 pt-3 border-t border-stone-700">
              <p className="text-sm text-stone-400">Balanço do Mês</p>
              <BlurValue isVisible={isVisible}>
                <p className={`text-xl font-bold ${
                  stats.monthBalance >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {stats.monthBalance >= 0 ? "+" : ""}
                  <CompactCurrency value={stats.monthBalance} />
                </p>
              </BlurValue>
            </div>
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
                <span className="text-xs font-medium">Receitas</span>
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
                <span className="text-xs font-medium">Despesas</span>
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
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Transações */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Transações
            </h2>
          </div>

          {filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-stone-500">
                  {searchTerm
                    ? "Nenhuma transação encontrada"
                    : "Nenhuma transação neste mês"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => {
                // Verificar se é transferência
                const isTransfer = transaction.type === 'transfer'
                const fromAccount = isTransfer ? accounts.find(a => a.id === transaction.fromAccountId) : null
                const toAccount = isTransfer ? accounts.find(a => a.id === transaction.toAccountId) : null

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
                            {isTransfer ? (
                              // Para transferências, mostrar só o fluxo no título
                              `${fromAccount?.name || 'Conta removida'} → ${toAccount?.name || 'Conta removida'}`
                            ) : (
                              transaction.description
                            )}
                          </p>
                          <p className="text-sm text-stone-500 mt-1">
                            {isTransfer ? (
                              // Para transferências, não mostrar descrição duplicada
                              'Transferência'
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
                              {!isTransfer && transaction.type === "income" ? "+" : ""}
                              <CompactCurrency value={transaction.amount} disableTap />
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
                )
              })}
            </div>
          )}

          {/* Contador de transações */}
          {filteredTransactions.length > 0 && (
            <p className="text-center text-sm text-stone-500 mt-3">
              {filteredTransactions.length}{" "}
              {filteredTransactions.length === 1 ? "transação" : "transações"}
              {searchTerm && " encontrada(s)"}
            </p>
          )}
        </div>
      </div>

      {/* Modal de Transferência */}
      <TransferModal isOpen={showTransfer} onClose={() => setShowTransfer(false)} />

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