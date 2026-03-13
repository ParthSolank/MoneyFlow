/**
 * Utility functions for exporting data to various formats
 */

import { Transaction } from "./api-client";

/**
 * Converts a list of transactions to a CSV string and triggers a download
 */
export function exportTransactionsToCSV(transactions: Transaction[]) {
    if (!transactions || transactions.length === 0) return;

    // Define headers
    const headers = ["Date", "Description", "Category", "Type", "Amount", "Method"];

    // Map data to rows
    const rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString('en-IN'),
        `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
        t.category,
        t.type,
        t.amount,
        t.paymentMethod
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `MoneyFlow_Transactions_${timestamp}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
