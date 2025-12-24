import { useEffect } from "react";
import { useTransactionStore } from "@/stores/useTransactionStore";
import {
  shouldGenerateRecurrence,
  getNextRecurrenceDate,
} from "@/lib/recurrence";
import { startOfDay } from "date-fns";

export function useRecurringTransactions() {
  const { transactions, addTransaction } = useTransactionStore();

  useEffect(() => {
    const checkAndGenerateRecurring = async () => {
      const recurringTransactions = transactions.filter(
        (t) => t.isRecurring && t.recurrenceType !== "none"
      );

      for (const transaction of recurringTransactions) {
        const lastDate = new Date(transaction.date);

        if (
          shouldGenerateRecurrence(
            lastDate,
            transaction.recurrenceType,
            transaction.recurrenceEndDate
          )
        ) {
          const nextDate = getNextRecurrenceDate(
            lastDate,
            transaction.recurrenceType
          );

          if (nextDate) {
            const exists = transactions.some(
              (t) =>
                t.description === transaction.description &&
                t.categoryId === transaction.categoryId &&
                t.accountId === transaction.accountId &&
                t.amount === transaction.amount &&
                startOfDay(new Date(t.date)).getTime() ===
                  startOfDay(nextDate).getTime()
            );

            if (!exists) {
              await addTransaction({
                type: transaction.type,
                status: "pending",
                amount: transaction.amount,
                description: transaction.description,
                categoryId: transaction.categoryId,
                accountId: transaction.accountId,
                date: nextDate,
                isRecurring: false,
                recurrenceType: "none",
                recurrenceEndDate: undefined,
                tags: transaction.tags,
              });
            }
          }
        }
      }
    };

    checkAndGenerateRecurring();

    const interval = setInterval(checkAndGenerateRecurring, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [transactions, addTransaction]);
}
