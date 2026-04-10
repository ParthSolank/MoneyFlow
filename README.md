# 💰 MoneyFlow Pro - Modern Personal Finance Management

[![Next.js](https://img.shields.io/badge/Next.js-16--LTS-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**MoneyFlow Pro** is an enterprise-grade personal and business finance tracking application built with a modern tech stack. It combines the speed of a **Next.js** fullstack framework with the robust reliability of **Supabase** backend to provide a seamless financial management experience.

---

## ✨ Key Features

### 📊 Professional Dashboard
*   **Real-time Analytics**: Visualize your cash flow with interactive Area and Pie charts (Recharts).
*   **Spending Heatmap**: Identify peak spending days with a GitHub-style activity grid.
*   **Wealth Mix**: Track the distribution of funds across Cash, Bank, and Credit accounts.

### 🤖 Smart Auto-Categorization
*   **Keyword Intelligence**: Define "Smart Keywords" for categories (e.g., "Zomato", "Uber", "Amazon").
*   **Automated Imports**: When importing bank statements (CSV/PDF), the system automatically categorizes transactions based on intelligent keyword matching.

### 📥 Bank Statement Import (NEW!)
*   **Multi-Format Support**: Import CSV and PDF bank statements
*   **Intelligent Parsing**: Auto-detects date, description, debit, credit columns
*   **Auto-Categorization**: 15+ smart categories based on transaction description
*   **Multi-Bank Support**: Works with various bank statement formats

### 📂 Advanced Transaction Management
*   **Dual-Entry Integrity**: Every transaction automatically updates corresponding Ledger balances using database triggers.
*   **Batch Import**: Upload bank statements with automated parsing and preview.
*   **Audit Trail**: Never lose historical context with comprehensive audit logging.

### 🛡️ Enterprise Control
*   **Row Level Security**: Supabase RLS ensures users only access their own data.
*   **Financial Year Closing**: Secure your records by closing financial years.
*   **Audit Logging**: Comprehensive tracking of every action for full transparency.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (Active LTS)
- **Bundler**: Turbopack (Stable)
- **Styling**: Tailwind CSS & Shadcn UI
- **State/Fetching**: SWR (Stale-While-Revalidate)
- **Charts**: Recharts & Lucide Icons
- **Auth**: Supabase Auth with automatic session management

### Backend
- **BaaS**: Supabase (Backend as a Service)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Auth**: Supabase Auth (Email/Password)
- **Real-time**: PostgreSQL triggers for automatic balance updates
- **File Parsing**: PapaParse (CSV) & pdf.js (PDF)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account (free tier available)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd moneyflow-pro
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Setup Supabase**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Run the SQL schema from `/supabase-schema.sql` in Supabase SQL Editor

4. **Configure environment variables**
   
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Launch development server**
   ```bash
   yarn dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

---

## 📸 Screenshots

*(Add your beautiful dashboard screenshots here!)*

> **Tip**: You can use the `Recent Activity` and `Spending Heat` components to show off the premium aesthetics of your app.

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by [Parth Solanki](https://github.com/ParthSolank)
