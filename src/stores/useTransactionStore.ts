import { create } from "zustand";
import { db } from "@/lib/db";
import type { Transaction } from "@/types/finance";
import { useAccountStore } from "./useAccountStore";

type CreateTransactionInput = Omit<
  Transaction,
  "id" | "createdAt" | "updatedAt"
>;

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: CreateTransactionInput) => Promise<void>;
  updateTransaction: (
    id: number,
    transaction: Partial<Transaction>
  ) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  completeTransaction: (id: number) => Promise<void>;
  getTransactionsByAccount: (accountId: number) => Transaction[];
  getTransactionsByCategory: (categoryId: number) => Transaction[];
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[];
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await db.transactions.toArray();
      set({ transactions, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addTransaction: async (transactionData) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date();
      const newTransaction: Transaction = {
        ...transactionData,
        generatedDates: transactionData.isRecurring ? [] : undefined,
        createdAt: now,
        updatedAt: now,
      };

      await db.transactions.add(newTransaction);

      // Atualizar saldo(s) se transação completada E não for futura
      if (transactionData.status === "completed") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const transactionDate = new Date(transactionData.date);
        transactionDate.setHours(0, 0, 0, 0);

        // Só atualiza saldo se a data for hoje ou no passado
        if (transactionDate <= today) {
          if (transactionData.type === "transfer") {
            // TRANSFERÊNCIA: atualiza DUAS contas
            if (
              !transactionData.fromAccountId ||
              !transactionData.toAccountId
            ) {
              throw new Error(
                "Transferência precisa de fromAccountId e toAccountId"
              );
            }

            // Deduz da origem
            await useAccountStore
              .getState()
              .updateBalance(
                transactionData.fromAccountId,
                -transactionData.amount
              );

            // Adiciona no destino
            await useAccountStore
              .getState()
              .updateBalance(
                transactionData.toAccountId,
                transactionData.amount
              );
          } else {
            // RECEITA/DESPESA: atualiza UMA conta
            const amount =
              transactionData.type === "income"
                ? transactionData.amount
                : -transactionData.amount;
            await useAccountStore
              .getState()
              .updateBalance(transactionData.accountId, amount);
          }
        }
      }

      await get().fetchTransactions();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateTransaction: async (id, transactionData) => {
    set({ isLoading: true, error: null });
    try {
      const oldTransaction = await db.transactions.get(id);

      // ✨ VALIDAÇÃO: Impedir edição de transações de contas arquivadas
      if (oldTransaction) {
        const account = await db.accounts.get(oldTransaction.accountId);

        if (account?.isArchived) {
          set({ isLoading: false });
          throw new Error(
            "Não é possível editar transações de contas arquivadas"
          );
        }

        // Se é transferência, verificar ambas as contas
        if (oldTransaction.type === "transfer") {
          if (oldTransaction.fromAccountId) {
            const fromAccount = await db.accounts.get(
              oldTransaction.fromAccountId
            );
            if (fromAccount?.isArchived) {
              set({ isLoading: false });
              throw new Error(
                "Não é possível editar transferências de contas arquivadas"
              );
            }
          }

          if (oldTransaction.toAccountId) {
            const toAccount = await db.accounts.get(oldTransaction.toAccountId);
            if (toAccount?.isArchived) {
              set({ isLoading: false });
              throw new Error(
                "Não é possível editar transferências de contas arquivadas"
              );
            }
          }
        }

        // Verificar se é data passada (afeta saldo)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const oldDate = new Date(oldTransaction.date);
        oldDate.setHours(0, 0, 0, 0);
        const oldAffectsBalance = oldDate <= today;

        const newDate = transactionData.date
          ? new Date(transactionData.date)
          : oldDate;
        newDate.setHours(0, 0, 0, 0);
        const newAffectsBalance = newDate <= today;

        // Reverter saldo anterior se estava completada E afetava saldo
        if (oldTransaction.status === "completed" && oldAffectsBalance) {
          if (oldTransaction.type === "transfer") {
            // Reverter transferência
            if (oldTransaction.fromAccountId && oldTransaction.toAccountId) {
              await useAccountStore
                .getState()
                .updateBalance(
                  oldTransaction.fromAccountId,
                  oldTransaction.amount
                );
              await useAccountStore
                .getState()
                .updateBalance(
                  oldTransaction.toAccountId,
                  -oldTransaction.amount
                );
            }
          } else {
            // Reverter receita/despesa
            const oldAmount =
              oldTransaction.type === "income"
                ? -oldTransaction.amount
                : oldTransaction.amount;
            await useAccountStore
              .getState()
              .updateBalance(oldTransaction.accountId, oldAmount);
          }
        }

        // Aplicar novo saldo se completada E afeta saldo
        const newStatus = transactionData.status || oldTransaction.status;
        if (newStatus === "completed" && newAffectsBalance) {
          const newType = transactionData.type || oldTransaction.type;

          if (newType === "transfer") {
            // Nova transferência
            const fromId =
              transactionData.fromAccountId || oldTransaction.fromAccountId;
            const toId =
              transactionData.toAccountId || oldTransaction.toAccountId;
            const newAmount = transactionData.amount || oldTransaction.amount;

            if (fromId && toId) {
              await useAccountStore
                .getState()
                .updateBalance(fromId, -newAmount);
              await useAccountStore.getState().updateBalance(toId, newAmount);
            }
          } else {
            // Nova receita/despesa
            const newAmount = transactionData.amount || oldTransaction.amount;
            const amount = newType === "income" ? newAmount : -newAmount;
            await useAccountStore
              .getState()
              .updateBalance(
                transactionData.accountId || oldTransaction.accountId,
                amount
              );
          }
        }
      }

      await db.transactions.update(id, {
        ...transactionData,
        updatedAt: new Date(),
      });
      await get().fetchTransactions();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const transaction = await db.transactions.get(id);

      if (transaction && transaction.status === "completed") {
        // Verificar se a transação afeta saldo (data <= hoje)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const transactionDate = new Date(transaction.date);
        transactionDate.setHours(0, 0, 0, 0);

        // Só reverte saldo se a data for hoje ou no passado
        if (transactionDate <= today) {
          if (transaction.type === "transfer") {
            // Reverter transferência
            if (transaction.fromAccountId && transaction.toAccountId) {
              await useAccountStore
                .getState()
                .updateBalance(transaction.fromAccountId, transaction.amount);
              await useAccountStore
                .getState()
                .updateBalance(transaction.toAccountId, -transaction.amount);
            }
          } else {
            // Reverter receita/despesa
            const amount =
              transaction.type === "income"
                ? -transaction.amount
                : transaction.amount;
            await useAccountStore
              .getState()
              .updateBalance(transaction.accountId, amount);
          }
        }
      }

      await db.transactions.delete(id);
      await get().fetchTransactions();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  completeTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const transaction = await db.transactions.get(id);

      if (transaction && transaction.status === "pending") {
        await db.transactions.update(id, {
          status: "completed",
          updatedAt: new Date(),
        });

        // Verificar se afeta saldo (data <= hoje)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const transactionDate = new Date(transaction.date);
        transactionDate.setHours(0, 0, 0, 0);

        // Só atualiza saldo se a data for hoje ou no passado
        if (transactionDate <= today) {
          if (transaction.type === "transfer") {
            // Completar transferência
            if (transaction.fromAccountId && transaction.toAccountId) {
              await useAccountStore
                .getState()
                .updateBalance(transaction.fromAccountId, -transaction.amount);
              await useAccountStore
                .getState()
                .updateBalance(transaction.toAccountId, transaction.amount);
            }
          } else {
            // Completar receita/despesa
            const amount =
              transaction.type === "income"
                ? transaction.amount
                : -transaction.amount;
            await useAccountStore
              .getState()
              .updateBalance(transaction.accountId, amount);
          }
        }

        await get().fetchTransactions();
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  getTransactionsByAccount: (accountId) => {
    return get().transactions.filter(
      (t) =>
        t.accountId === accountId ||
        t.fromAccountId === accountId ||
        t.toAccountId === accountId
    );
  },

  getTransactionsByCategory: (categoryId) => {
    return get().transactions.filter((t) => t.categoryId === categoryId);
  },

  getTransactionsByDateRange: (startDate, endDate) => {
    return get().transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= startDate && date <= endDate;
    });
  },
}));
