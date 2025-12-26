import { useState, useEffect, useMemo } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Select } from "@/components/ui/Select";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useAccountStore } from "@/stores/useAccountStore";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { formatDateForInput, createDateInMonth, parseInputDate } from '@/lib/dateUtils';
import { validateOccurrences, RECURRENCE_DEFAULTS } from "@/lib/recurrence";
import { Repeat } from "lucide-react";
import type {
  TransactionType,
  TransactionStatus,
  RecurrenceType,
} from "@/types/finance";

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId?: number | null;
  initialType?: "income" | "expense";
  suggestedMonth?: Date;
}

export function TransactionForm({
  isOpen,
  onClose,
  transactionId,
  initialType,
  suggestedMonth,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialType || "income");
  const [status, setStatus] = useState<TransactionStatus>("completed");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(() => {
    if (transactionId) {
      return formatDateForInput(new Date());
    }

    if (suggestedMonth) {
      return createDateInMonth(suggestedMonth);
    }

    return formatDateForInput(new Date());
  });

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("monthly");
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState("");
  const [isInstallment, setIsInstallment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { transactions, addTransaction, updateTransaction, deleteTransaction } =
    useTransactionStore();
  const allCategories = useCategoryStore((state) => state.categories);
  const accounts = useAccountStore((state) => state.accounts);

  const isEditing = !!transactionId;
  const transaction = transactions.find((t) => t.id === transactionId);

  const categories = useMemo(() => {
    return allCategories
      .filter((c) => c.type === type)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [allCategories, type]);

  // NOVO: Filtrar apenas contas ativas de pagamento
  const availableAccounts = useMemo(() => {
    return accounts
      .filter((a) => !a.isArchived && !a.excludeFromTotal)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [accounts]);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setStatus(transaction.status);
      setAmount(String(transaction.amount));
      setDescription(transaction.description);
      setCategoryId(String(transaction.categoryId));
      setAccountId(String(transaction.accountId));
      setDate(formatDateForInput(new Date(transaction.date)));
      setIsRecurring(transaction.isRecurring);
      setRecurrenceType(transaction.recurrenceType);
      setRecurrenceOccurrences(
        transaction.recurrenceOccurrences 
          ? String(transaction.recurrenceOccurrences) 
          : ""
      );
      setIsInstallment(transaction.isInstallment || false);
    }
  }, [transaction]);

  useEffect(() => {
    if (!isEditing) {
      setCategoryId("");
    }
  }, [type, isEditing]);

  useEffect(() => {
    if (availableAccounts.length > 0 && !accountId) {
      setAccountId(String(availableAccounts[0].id));
    }
  }, [availableAccounts, accountId]);

  const handleToggleRecurring = () => {
    const newValue = !isRecurring;
    setIsRecurring(newValue);

    if (newValue && !isEditing && recurrenceOccurrences === "") {
      setRecurrenceOccurrences(String(RECURRENCE_DEFAULTS[recurrenceType]));
    }

    if (!newValue) {
      setIsInstallment(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description || !categoryId || !accountId) {
      toast.error("Preencha todos os campos");
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      toast.error("O valor deve ser maior que zero");
      return;
    }

    if (isRecurring) {
      if (recurrenceType === "none") {
        toast.error("Selecione a frequência da recorrência");
        return;
      }

      if (!recurrenceOccurrences || recurrenceOccurrences.trim() === "") {
        toast.error("Defina o número de ocorrências");
        return;
      }

      const numOccurrences = parseInt(recurrenceOccurrences);
      
      if (isNaN(numOccurrences) || numOccurrences < 1) {
        toast.error("O número de ocorrências deve ser no mínimo 1");
        return;
      }

      const validation = validateOccurrences(recurrenceType, numOccurrences);
      
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }
    }

    setIsLoading(true);
    try {
      let finalDescription = description;
      let baseDescription: string | undefined = undefined;
      
      if (isRecurring && recurrenceType === 'monthly' && isInstallment && recurrenceOccurrences) {
        const totalOccurrences = parseInt(recurrenceOccurrences);
        baseDescription = description;
        finalDescription = `${description} - 1/${totalOccurrences}`;
      }

      const transactionData = {
        type,
        status,
        amount: numAmount,
        description: finalDescription,
        baseDescription,
        categoryId: parseInt(categoryId),
        accountId: parseInt(accountId),
        date: parseInputDate(date),
        isRecurring,
        recurrenceType: isRecurring
          ? recurrenceType
          : ("none" as RecurrenceType),
        recurrenceOccurrences: isRecurring && recurrenceOccurrences 
          ? parseInt(recurrenceOccurrences) 
          : undefined,
        isInstallment: isRecurring && recurrenceType === 'monthly' 
          ? isInstallment 
          : false,
      };

      if (isEditing && transactionId) {
        await updateTransaction(transactionId, transactionData);
        toast.success("Transação atualizada com sucesso!");
      } else {
        await addTransaction(transactionData);
        toast.success(
          isRecurring
            ? "Transação recorrente criada!"
            : "Transação adicionada com sucesso!"
        );
      }
      onClose();
    } catch {
      toast.error("Erro ao salvar transação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transactionId) return;

    setIsLoading(true);
    try {
      await deleteTransaction(transactionId);
      toast.success("Transação excluída com sucesso!");
      onClose();
    } catch {
      toast.error("Erro ao excluir transação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={isEditing ? "Editar Transação" : "Nova Transação"}
      confirmText={isEditing ? "Salvar" : "Adicionar"}
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
              onClick={() => setType("income")}
              disabled={isEditing}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium transition-all",
                type === "income"
                  ? "bg-green-600 text-white shadow-lg shadow-green-600/30"
                  : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
                isEditing && "opacity-50 cursor-not-allowed"
              )}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              disabled={isEditing}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium transition-all",
                type === "expense"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
                isEditing && "opacity-50 cursor-not-allowed"
              )}
            >
              Despesa
            </button>
          </div>
        </div>

        {/* Status como toggle */}
        <div className="flex items-center justify-between p-4 bg-stone-100 dark:bg-stone-900 rounded-xl">
          <div>
            <p className="font-medium text-stone-900 dark:text-stone-50">
              Marcar como paga
            </p>
            <p className="text-sm text-stone-500">
              {status === "completed"
                ? "Afeta o saldo da conta"
                : "Não afeta o saldo"}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setStatus(status === "completed" ? "pending" : "completed")
            }
            className={cn(
              "relative w-14 h-8 rounded-full transition-colors",
              status === "completed"
                ? "bg-green-600"
                : "bg-stone-300 dark:bg-stone-700"
            )}
          >
            <div
              className={cn(
                "absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow-md",
                status === "completed" ? "translate-x-7" : "translate-x-1"
              )}
            />
          </button>
        </div>

        <CurrencyInput label="Valor" value={amount} onChange={setAmount} />

        <Input
          label="Descrição"
          placeholder="Ex: Almoço, Salário..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={100}
        />

        <Select
          label="Categoria"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Selecione uma categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Select
          label="Conta"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="">Selecione uma conta</option>
          {availableAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>

        <Input
          label="Data"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* Recorrência */}
        <div className="flex items-center justify-between p-4 bg-stone-100 dark:bg-stone-900 rounded-xl">
          <div className="flex items-center gap-3">
            <Repeat className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            <div>
              <p className="font-medium text-stone-900 dark:text-stone-50">
                Repetir automaticamente
              </p>
              <p className="text-sm text-stone-500">Transação recorrente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleRecurring}
            className={cn(
              "relative w-14 h-8 rounded-full transition-colors",
              isRecurring ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            )}
          >
            <div
              className={cn(
                "absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow-md",
                isRecurring ? "translate-x-7" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {/* Opções de recorrência */}
        {isRecurring && (
          <div className="space-y-3 p-4 bg-stone-100 dark:bg-stone-900 rounded-xl">
            <Select
              label="Frequência"
              value={recurrenceType}
              onChange={(e) => {
                const newType = e.target.value as RecurrenceType;
                setRecurrenceType(newType);
                if (newType !== 'monthly') {
                  setIsInstallment(false);
                }
              }}
            >
              <option value="none">Selecione...</option>
              <option value="daily">Diária</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </Select>

            <Input
              label="Número de ocorrências"
              type="text"
              inputMode="numeric"
              placeholder="Ex: 12"
              value={recurrenceOccurrences}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d+$/.test(value)) {
                  setRecurrenceOccurrences(value);
                }
              }}
            />

            {recurrenceType === 'monthly' && (
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800">
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-50 text-sm">
                    É um parcelamento?
                  </p>
                  <p className="text-xs text-stone-500">
                    Adiciona contador de parcelas (ex: 1/12)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInstallment(!isInstallment)}
                  className={cn(
                    "relative w-14 h-8 rounded-full transition-colors",
                    isInstallment ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow-md",
                      isInstallment ? "translate-x-7" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full py-3 px-4 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            Excluir Transação
          </button>
        )}
      </div>
    </Dialog>
  );
}