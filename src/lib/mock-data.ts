import { Transaction, Ledger } from './types';

export const MOCK_LEDGERS: Ledger[] = [
  { id: '1', name: 'HDFC Savings', description: 'Primary savings account', balance: 45000.50, icon: 'Wallet', accountType: 'bank' },
  { id: '2', name: 'ICICI Current', description: 'Business and utility account', balance: 125000.00, icon: 'Wallet', accountType: 'bank' },
  { id: '3', name: 'SBI Salary', description: 'Main salary deposit', balance: 85000.00, icon: 'Banknote', accountType: 'bank' },
  { id: '4', name: 'Axis Digital', description: 'Online transactions and UPI', balance: 12000.75, icon: 'Wallet', accountType: 'bank' },
  { id: '5', name: 'Amex Platinum', description: 'Premium rewards card', balance: -12500.00, icon: 'CreditCard', accountType: 'credit' },
  { id: '6', name: 'HDFC Regalia', description: 'Travel and dining', balance: -8400.20, icon: 'CreditCard', accountType: 'credit' },
  { id: '7', name: 'ICICI Amazon Pay', description: 'Shopping card', balance: -3200.50, icon: 'CreditCard', accountType: 'credit' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2024-03-01', description: 'Monthly Salary', amount: 95000, type: 'income', category: 'Salary', paymentMethod: 'bank', ledgerId: '3' },
  { id: 't2', date: '2024-03-02', description: 'Rent Payment', amount: 25000, type: 'expense', category: 'Rent', paymentMethod: 'bank', ledgerId: '1' },
  { id: 't3', date: '2024-03-05', description: 'Zomato Order', amount: 450.75, type: 'expense', category: 'Food & Dining', paymentMethod: 'credit', ledgerId: '7' },
  { id: 't4', date: '2024-03-08', description: 'Electricity Bill', amount: 1800.20, type: 'expense', category: 'Utilities', paymentMethod: 'bank', ledgerId: '2' },
  { id: 't5', date: '2024-03-10', description: 'Amazon.in Shopping', amount: 5499, type: 'expense', category: 'Shopping', paymentMethod: 'credit', ledgerId: '7' },
  { id: 't6', date: '2024-03-12', description: 'Vegetable Market', amount: 350, type: 'expense', category: 'Food & Dining', paymentMethod: 'cash' },
];
