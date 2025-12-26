import { useState, useEffect } from "react";
import { Archive, ArchiveRestore, Trash2, PiggyBank } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { useAccountStore } from "@/stores/useAccountStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: number | null;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export function AccountForm({ isOpen, onClose, accountId }: AccountFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [excludeFromTotal, setExcludeFromTotal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { accounts, addAccount, updateAccount, deleteAccount } =
    useAccountStore();
  const transactions = useTransactionStore((state) => state.transactions);

  const isEditing = !!accountId;
  const account = accounts.find((a) => a.id === accountId);

  // Contar transações da conta
  const transactionCount = accountId
    ? transactions.filter(
        (t) =>
          t.accountId === accountId ||
          t.fromAccountId === accountId ||
          t.toAccountId === accountId
      ).length
    : 0;

  useEffect(() => {
    if (account) {
      setName(account.name);
      setDescription(account.description || "");
      setInitialBalance(String(account.initialBalance));
      setColor(account.color);
      setExcludeFromTotal(account.excludeFromTotal || false);
    }
  }, [account]);

  const handleSubmit = async () => {
    if (!name || !initialBalance) {
      toast.error("Preencha todos os campos");
      return;
    }

    const numBalance = parseFloat(initialBalance);
    if (numBalance < 0) {
      toast.error("O saldo não pode ser negativo");
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && accountId) {
        // Calcular a diferença no saldo inicial
        const oldInitialBalance = account?.initialBalance || 0;
        const difference = numBalance - oldInitialBalance;
        const newCurrentBalance = (account?.currentBalance || 0) + difference;

        // VALIDAÇÃO: Não permitir se resultar em saldo negativo
        if (newCurrentBalance < 0) {
          toast.error(
            `O saldo atual ficaria negativo (${formatCurrency(
              newCurrentBalance
            )}). Não é possível realizar esta alteração.`
          );
          setIsLoading(false);
          return;
        }

        await updateAccount(accountId, {
          name,
          description: description.trim() || undefined,
          color,
          initialBalance: numBalance,
          currentBalance: newCurrentBalance,
          excludeFromTotal,
        });
        toast.success("Conta atualizada com sucesso!");
      } else {
        await addAccount({
          name,
          description: description.trim() || undefined,
          initialBalance: numBalance,
          color,
          icon: "wallet",
          excludeFromTotal,
        });
        toast.success("Conta criada com sucesso!");
      }
      onClose();
    } catch {
      toast.error("Erro ao salvar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!accountId || !account) return;

    // Validar saldo zerado
    if (account.currentBalance !== 0) {
      toast.error("Só é possível arquivar contas com saldo R$ 0,00");
      return;
    }

    setIsLoading(true);
    try {
      await updateAccount(accountId, {
        isArchived: true,
        archivedAt: new Date(),
      });
      toast.success("Conta arquivada com sucesso!");
      onClose();
    } catch {
      toast.error("Erro ao arquivar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnarchive = async () => {
    if (!accountId) return;

    setIsLoading(true);
    try {
      await updateAccount(accountId, {
        isArchived: false,
        archivedAt: undefined,
      });
      toast.success("Conta desarquivada com sucesso!");
      onClose();
    } catch {
      toast.error("Erro ao desarquivar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!accountId || !account) return;

    // Validar saldo zerado
    if (account.currentBalance !== 0) {
      toast.error("Só é possível excluir contas com saldo R$ 0,00");
      return;
    }

    // Validar zero transações
    if (transactionCount > 0) {
      toast.error(
        `Esta conta possui ${transactionCount} transação(ões). Delete ou transfira todas as transações primeiro.`
      );
      return;
    }

    setIsLoading(true);
    try {
      await deleteAccount(accountId);
      toast.success("Conta excluída permanentemente!");
      onClose();
    } catch {
      toast.error("Erro ao excluir conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={isEditing ? "Editar Conta" : "Nova Conta"}
      confirmText={isEditing ? "Salvar" : "Criar"}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <Input
          label="Nome da Conta"
          placeholder="Ex: Carteira, Banco..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
        />

        <Input
          label="Descrição (opcional)"
          placeholder={
            excludeFromTotal
              ? "Ex: Para viagem de férias"
              : "Ex: Conta principal"
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={100}
        />

        <CurrencyInput
          label="Saldo Inicial"
          value={initialBalance}
          onChange={setInitialBalance}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Cor
          </label>
          <div className="grid grid-cols-8 gap-2">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                onClick={() => setColor(presetColor)}
                className="w-10 h-10 rounded-lg transition-transform active:scale-95"
                style={{
                  backgroundColor: presetColor,
                  border:
                    color === presetColor ? "3px solid currentColor" : "none",
                  opacity: color === presetColor ? 1 : 0.6,
                }}
              />
            ))}
          </div>
        </div>

        {/* Toggle de Reserva */}
        <div className="flex items-center justify-between p-4 bg-stone-100 dark:bg-stone-900 rounded-xl">
          <div className="flex items-center gap-3">
            <PiggyBank className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            <div>
              <p className="font-medium text-stone-900 dark:text-stone-50">
                É uma reserva?
              </p>
              <p className="text-sm text-stone-500">
                Saldo não conta no "Disponível"
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExcludeFromTotal(!excludeFromTotal)}
            className={cn(
              "relative w-14 h-8 rounded-full transition-colors",
              excludeFromTotal
                ? "bg-blue-600"
                : "bg-stone-300 dark:bg-stone-700"
            )}
          >
            <div
              className={cn(
                "absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow-md",
                excludeFromTotal ? "translate-x-7" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {/* Botões de Ação (se editando) */}
        {isEditing && account && (
          <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
            {account.isArchived ? (
              // Conta arquivada - botão de desarquivar
              <button
                type="button"
                onClick={handleUnarchive}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArchiveRestore className="w-5 h-5" />
                Desarquivar
              </button>
            ) : (
              // Conta ativa - mostrar arquivar APENAS se saldo zero
              account.currentBalance === 0 && (
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl font-medium hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Archive className="w-5 h-5" />
                  Arquivar
                </button>
              )
            )}

            {/* Excluir - APENAS se saldo zero E sem transações */}
            {account.currentBalance === 0 && transactionCount === 0 && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
