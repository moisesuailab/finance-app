import { useMemo, useState } from "react";
import { TrendingUp, PieChart, Calendar, Download } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { MonthSelector } from "@/components/ui/MonthSelector";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { formatCurrency } from "@/lib/formatters";
import { isInMonthRange } from "@/lib/dateUtils";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExportModal } from "@/components/modals/ExportModal";
import { cn } from "@/lib/utils";
import { calculateRecurringProjections } from "@/lib/projections";

export function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showExport, setShowExport] = useState(false);
  const [projectionPeriod, setProjectionPeriod] = useState(36);

  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);

  // Despesas por categoria no mês
  const expensesByCategory = useMemo(() => {
    const monthTransactions = transactions.filter(
      (t) =>
        isInMonthRange(new Date(t.date), selectedMonth) &&
        t.status === "completed" &&
        t.type === "expense"
    );

    const grouped = monthTransactions.reduce((acc, t) => {
      const categoryId = t.categoryId;
      if (!acc[categoryId]) {
        acc[categoryId] = 0;
      }
      acc[categoryId] += t.amount;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(grouped)
      .map(([categoryId, amount]) => {
        const category = categories.find((c) => c.id === parseInt(categoryId));
        return {
          name: category?.name || "Outros",
          value: amount,
          color: category?.color || "#6b7280",
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categorias
  }, [transactions, categories, selectedMonth]);

  // Projeção de longo prazo
  const yearlyProjections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const years: { year: number; balance: number }[] = [];
    const currentYear = today.getFullYear();
    const yearsToProject = Math.ceil(projectionPeriod / 12);

    for (let yearOffset = 0; yearOffset < yearsToProject; yearOffset++) {
      const year = currentYear + yearOffset;
      const yearStart = new Date(year, 0, 1); // 1º de janeiro
      const yearEnd = new Date(year, 11, 31); // 31 de dezembro

      // Ajustar para começar do mês atual no primeiro ano
      const startDate = yearOffset === 0 ? today : yearStart;

      // Transações futuras JÁ cadastradas neste ano
      const futureInYear = transactions.filter((t) => {
        const date = new Date(t.date);
        date.setHours(0, 0, 0, 0);
        return date >= startDate && date <= yearEnd && !t.isRecurring;
      });

      const income = futureInYear
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = futureInYear
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      // Recorrências determinadas neste ano
      const recurringProjections = calculateRecurringProjections(
        transactions,
        startDate,
        yearEnd
      );

      const totalIncome = income + recurringProjections.projectedIncome;
      const totalExpenses = expenses + recurringProjections.projectedExpenses;
      const balance = totalIncome - totalExpenses;

      years.push({ year, balance });
    }

    return years;
  }, [transactions, projectionPeriod]);

  // Valor máximo para cálculo das barras de progresso
  const maxProjectionValue = useMemo(() => {
    const maxPositive = Math.max(
      ...yearlyProjections.filter((y) => y.balance > 0).map((y) => y.balance),
      0
    );
    const maxNegative = Math.abs(
      Math.min(
        ...yearlyProjections.filter((y) => y.balance < 0).map((y) => y.balance),
        0
      )
    );
    return Math.max(maxPositive, maxNegative, 1); // Evitar divisão por zero
  }, [yearlyProjections]);

  // Evolução dos últimos 6 meses
  const monthlyEvolution = useMemo(() => {
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const month = subMonths(selectedMonth, i);
      const monthStart = startOfMonth(month);

      const monthTransactions = transactions.filter((t) => {
        const date = new Date(t.date);
        return isInMonthRange(date, month) && t.status === "completed";
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        month: format(monthStart, "MMM", { locale: ptBR }),
        receitas: income,
        despesas: expenses,
        saldo: income - expenses,
      });
    }

    return data;
  }, [transactions, selectedMonth]);

  // Estatísticas do mês
  const monthStats = useMemo(() => {
    const monthTransactions = transactions.filter(
      (t) =>
        isInMonthRange(new Date(t.date), selectedMonth) &&
        t.status === "completed"
    );

    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;
    const transactionCount = monthTransactions.length;

    return { income, expenses, balance, transactionCount };
  }, [transactions, selectedMonth]);

  const totalExpenses = expensesByCategory.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <MobileLayout>
      <Header
        title="Relatórios"
        action={
          <button
            onClick={() => setShowExport(true)}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="Exportar transações"
          >
            <Download className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </button>
        }
      />

      <div className="p-4 sm:p-6 space-y-4">
        {/* Seletor de Mês */}
        <MonthSelector
          currentMonth={selectedMonth}
          onChange={setSelectedMonth}
        />

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-stone-500 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Transações</span>
              </div>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">
                {monthStats.transactionCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-stone-500 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Balanço</span>
              </div>
              <p
                className={`text-xl font-bold ${
                  monthStats.balance >= 0
                    ? "text-green-600 dark:text-green-500"
                    : "text-red-600 dark:text-red-500"
                }`}
              >
                {monthStats.balance >= 0 ? "+" : ""}
                {formatCurrency(monthStats.balance)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Evolução Mensal */}
        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Evolução dos Últimos 6 Meses
            </h3>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height={256}>
                <LineChart
                  data={monthlyEvolution}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="opacity-10"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="currentColor"
                    className="text-xs text-stone-500"
                    tick={{ fill: "currentColor" }}
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-xs text-stone-500"
                    tick={{ fill: "currentColor" }}
                    tickFormatter={(value) => {
                      if (value >= 1000) {
                        return `${(value / 1000).toFixed(1)}k`;
                      }
                      return `${value}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                    }}
                    formatter={(value) =>
                      typeof value === "number" ? formatCurrency(value) : ""
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="receitas"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    name="Receitas"
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: "#ef4444", r: 4 }}
                    name="Despesas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        {expensesByCategory.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Despesas por Categoria
              </h3>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height={256}>
                  <RechartsPie>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => {
                        const percentValue = percent ?? 0;
                        return `${name} ${(percentValue * 100).toFixed(0)}%`;
                      }}
                      labelLine={{ stroke: "currentColor", strokeWidth: 1 }}
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        border: "none",
                        borderRadius: "8px",
                        color: "white",
                      }}
                      formatter={(value) =>
                        typeof value === "number" ? formatCurrency(value) : ""
                      }
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              {/* Lista de Categorias */}
              <div className="mt-4 space-y-2">
                {expensesByCategory.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                        {formatCurrency(item.value)}
                      </p>
                      <p className="text-xs text-stone-500">
                        {((item.value / totalExpenses) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <PieChart className="w-12 h-12 text-stone-400 mx-auto mb-4" />
              <p className="text-stone-500">
                Nenhuma despesa registrada neste mês
              </p>
            </CardContent>
          </Card>
        )}

        {/* Maiores Despesas do Mês */}
        {expensesByCategory.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50">
                Maiores Categorias de Despesa
              </h3>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              {expensesByCategory.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex-shrink-0">
                    <span className="text-sm font-bold text-stone-600 dark:text-stone-400">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 dark:text-stone-50 truncate">
                      {item.name}
                    </p>
                    <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2 mt-1">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (item.value / expensesByCategory[0].value) * 100
                          }%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-stone-900 dark:text-stone-50">
                      {formatCurrency(item.value)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Projeção de Longo Prazo */}
        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Projeção Futura
            </h3>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {/* Seletor de Período */}
            <div className="flex gap-2 mb-4">
              {[24, 36, 48, 60].map((months) => (
                <button
                  key={months}
                  onClick={() => setProjectionPeriod(months)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all active:scale-95",
                    projectionPeriod === months
                      ? "bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 shadow-md"
                      : "bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400"
                  )}
                >
                  {months}m
                </button>
              ))}
            </div>

            {/* Projeção por Ano */}
            <div className="space-y-3">
              {yearlyProjections.map((year) => (
                <div key={year.year} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {year.year}
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        year.balance >= 0
                          ? "text-green-600 dark:text-green-500"
                          : "text-red-600 dark:text-red-500"
                      )}
                    >
                      {year.balance >= 0 ? "+" : ""}
                      {formatCurrency(year.balance)}
                    </span>
                  </div>
                  {/* Barra de Progresso */}
                  <div className="h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all rounded-full",
                        year.balance >= 0 ? "bg-green-500" : "bg-red-500"
                      )}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.abs(year.balance / maxProjectionValue) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Info sobre o cálculo */}
            <p className="text-xs text-stone-500 mt-4 text-center">
              Baseado em recorrências determinadas (parcelamentos, contratos
              fixos)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Exportação */}
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </MobileLayout>
  );
}
