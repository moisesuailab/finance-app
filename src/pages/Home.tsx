import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  Clock,
  Settings,
} from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { MonthSelector } from "@/components/ui/MonthSelector";
import { useAccountStore } from "@/stores/useAccountStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { isInMonthRange } from "@/lib/dateUtils";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { SettingsDrawer } from "@/components/modals/SettingsDrawer";

interface HomeProps {
  onNavigate: (
    tab: "home" | "transactions" | "accounts" | "categories" | "reports"
  ) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<number | null>(
    null
  );
  const [initialTransactionType, setInitialTransactionType] = useState<
    "income" | "expense"
  >("income");
  const [showSettings, setShowSettings] = useState(false);

  const accounts = useAccountStore((state) => state.accounts);
  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);

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

    const balance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const monthBalance = income - expenses;

    return { income, expenses, balance, monthBalance };
  }, [transactions, accounts, selectedMonth]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .filter((t) => isInMonthRange(new Date(t.date), selectedMonth))
      .sort((a, b) => {
        // Pendentes primeiro
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        // Depois por data
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 5);
  }, [transactions, selectedMonth]);

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

  const getAccountName = (accountId: number) => {
    return accounts.find((a) => a.id === accountId)?.name || "Sem conta";
  };

  const handleEdit = (transactionId: number) => {
    setEditingTransaction(transactionId);
    setShowForm(true);
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
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </button>
        }
      />

      <div className="p-4 sm:p-6 space-y-4">
        {/* Seletor de Mês */}
        <MonthSelector
          currentMonth={selectedMonth}
          onChange={setSelectedMonth}
        />

        {/* Saldo Total */}
        <Card
          className="bg-gradient-to-br from-stone-900 to-stone-800 dark:from-stone-800 dark:to-stone-900 border-0 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => onNavigate("accounts")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-stone-400 mb-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Saldo Total</span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-white">
              {formatCurrency(stats.balance)}
            </p>
            <div className="mt-3 pt-3 border-t border-stone-700">
              <p className="text-sm text-stone-400">Balanço do Mês</p>
              <p
                className={`text-xl font-bold ${
                  stats.monthBalance >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stats.monthBalance >= 0 ? "+" : ""}
                {formatCurrency(stats.monthBalance)}
              </p>
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
              <p className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50">
                {formatCurrency(stats.income)}
              </p>
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
              <p className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50">
                {formatCurrency(stats.expenses)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transações Recentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Transações Recentes
            </h2>
            <TrendingUp className="w-5 h-5 text-stone-400" />
          </div>

          {recentTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-stone-500">Nenhuma transação neste mês</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  onClick={() => handleEdit(transaction.id!)}
                  className="active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2.5 rounded-xl flex-shrink-0 ${
                          transaction.type === "income"
                            ? "bg-green-100 dark:bg-green-950"
                            : "bg-red-100 dark:bg-red-950"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-900 dark:text-stone-50 truncate">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-stone-500 mt-1">
                          {getCategoryName(transaction.categoryId)} •{" "}
                          {getAccountName(transaction.accountId)}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          {formatDate(new Date(transaction.date))}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <p
                          className={`text-lg font-bold ${
                            transaction.type === "income"
                              ? "text-green-600 dark:text-green-500"
                              : "text-red-600 dark:text-red-500"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : ""}
                          {formatCurrency(transaction.amount)}
                        </p>
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

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
