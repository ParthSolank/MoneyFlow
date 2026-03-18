export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'bank' | 'credit' | 'cash';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  ledgerId?: string; // Made optional for now to avoid breaking if not present, though mock data has it
}

export interface Ledger {
  id: string;
  name: string;
  description: string;
  balance: number;
  icon: string;
  accountType: 'bank' | 'credit' | 'cash';
}

/* aria-label */
