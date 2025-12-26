import { useEffect, useRef } from "react";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { db } from "@/lib/db";
import { generateMissingRecurrenceDates } from "@/lib/recurrence";
import { parseISO } from "date-fns";

export function useRecurringTransactions() {
  const { transactions, fetchTransactions } = useTransactionStore();
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const processRecurringTransactions = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        const recurringTransactions = transactions.filter(
          (t) => t.isRecurring && t.recurrenceType !== "none" && t.id
        );

        for (const transaction of recurringTransactions) {
          const alreadyGenerated = transaction.generatedDates || [];

          const missingDates = generateMissingRecurrenceDates(
            new Date(transaction.date),
            transaction.recurrenceType,
            transaction.recurrenceEndDate
              ? new Date(transaction.recurrenceEndDate)
              : undefined,
            alreadyGenerated
          );

          if (missingDates.length === 0) continue;

          const newTransactions = missingDates.map((dateISO) => ({
            accountId: transaction.accountId,
            categoryId: transaction.categoryId,
            type: transaction.type,
            status: "pending" as const,
            amount: transaction.amount,
            description: transaction.description,
            date: parseISO(dateISO),
            isRecurring: false,
            recurrenceType: "none" as const,
            tags: transaction.tags,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          await db.transactions.bulkAdd(newTransactions);

          const updatedGeneratedDates = [...alreadyGenerated, ...missingDates];
          await db.transactions.update(transaction.id!, {
            generatedDates: updatedGeneratedDates,
            updatedAt: new Date(),
          });
        }

        await fetchTransactions();
      } catch (error) {
        console.error("Erro ao processar recorrências:", error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    processRecurringTransactions();
  }, [transactions, fetchTransactions]);
}
