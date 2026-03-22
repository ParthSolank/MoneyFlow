# Architecture: MoneyFlow Pro

## System Pattern
- **Pattern**: Client-Server with Monolithic Backend
- **Layers**: 
  - **Frontend**: Next.js (App Router), SWR for data fetching, Client Components for interactivity.
  - **Backend**: ASP.NET Core Web API, Controllers/Services/Data architecture.
  - **Data**: Entity Framework Core with SQL Server.

## Data Flow
1. **Frontend** makes HTTP requests using `lib/api-client.ts`.
2. **Backend Controllers** handle requests, validate rights via `AuthorizeRight` attribute.
3. **Services** perform business logic (e.g., updating ledger balance when a transaction is created).
4. **EF Core** persists data to SQL Server.

## Entry Points
- **Frontend**: `src/app/page.tsx` (Dashboard)
- **Backend**: `Program.cs` (API Startup)

## Abstractions
- **TransactionService**: Central logic for all financial records.
- **LedgerService**: Management of bank and credit accounts.
- **AuthService**: JWT-based authentication logic.
