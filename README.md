# 💰 MoneyFlow Pro - Modern Personal Finance Management

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![.NET Core](https://img.shields.io/badge/.NET_Core-8.0-512BD4?style=for-the-badge&logo=dotnet)](https://dotnet.microsoft.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**MoneyFlow Pro** is an enterprise-grade personal and business finance tracking application built with a modern tech stack. It combines the speed of a **Next.js** frontend with the robust reliability of a **.NET Web API** backend to provide a seamless financial management experience.

---

## ✨ Key Features

### 📊 Professional Dashboard
*   **Real-time Analytics**: Visualise your cash flow with interactive Area and Pie charts (Recharts).
*   **Spending Heatmap**: Identify peak spending days with a GitHub-style activity grid.
*   **Wealth Mix**: Track the distribution of funds across Cash, Bank, and Credit accounts.

### 🤖 Smart Auto-Categorization
*   **Keyword Intelligence**: Define "Smart Keywords" for categories (e.g., "Zomato", "Uber", "Amazon").
*   **Automated Imports**: When importing Excel or CSV statements, the system automatically groups transactions into categories based on your rules.

### 📂 Advanced Transaction Management
*   **Dual-Entry Integrity**: Every transaction automatically updates corresponding Ledger balances using atomic database operations.
*   **Excel/CSV Import**: Batch upload statements from major banks with automated parsing.
*   **Soft Deletion**: Never lose historical context with audit-ready soft deletions.

### 🛡️ Enterprise Control
*   **RBAC (Role-Based Access Control)**: Administrative portal for managing users and specific permissions.
*   **Financial Year Closing**: Secure your records by closing financial years to prevent back-dated alterations.
*   **Audit Logging**: Comprehensive tracking of every action (Create, Update, Delete) for full transparency.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS & Shadcn UI
- **State/Fetching**: SWR (Stale-While-Revalidate)
- **Charts**: Recharts & Lucide Icons
- **Auth**: JWT-based Authentication with interceptors

### Backend
- **Framework**: ASP.NET Core Web API (.NET 9)
- **ORM**: Entity Framework Core
- **Database**: SQL Server / LocalDB
- **Processors**: ExcelDataReader & CsvHelper for mass data handling

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- .NET 8/9 SDK
- SQL Server (or LocalDB)

### Setup Backend (.NET API)
1. Navigate to the `api` folder:
   ```bash
   cd api
   ```
2. Update the connection string in `appsettings.json`.
3. Run migrations and start the server:
   ```bash
   dotnet run
   ```

### Setup Frontend (Next.js)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5039
   ```
3. Launch development server:
   ```bash
   npm run dev
   ```

---

## 📸 Screenshots

*(Add your beautiful dashboard screenshots here!)*

> **Tip**: You can use the `Recent Activity` and `Spending Heat` components to show off the premium aesthetics of your app.

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by [Parth Solanki](https://github.com/ParthSolank)
