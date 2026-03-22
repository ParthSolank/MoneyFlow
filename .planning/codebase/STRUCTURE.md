# Structure: MoneyFlow Pro

## Root Directory
- `/src`: Frontend React/Next.js application.
- `/api`: Backend ASP.NET Core application.
- `/.planning`: GSD project planning documents.

## Frontend (`/src`)
- `/app`: Next.js App Router pages (transactions, ledgers, masters, etc.).
- `/components`: Reusable UI components (shadcn/ui).
- `/context`: React Context providers (auth, etc.).
- `/hooks`: Custom React hooks (transactions, permissions, etc.).
- `/lib`: Utility functions and API client.

## Backend (`/api`)
- `/Controllers`: API endpoints.
- `/Services`: Business logic services.
- `/Models`: Data models and DTOs.
- `/Data`: DB Context and configurations.
- `/Attributes`: Custom attributes (authorization rights).

## Key Files
- `src/lib/api-client.ts`: Main frontend API interface.
- `api/Services/TransactionService.cs`: Core transaction processing logic.
- `api/Services/LedgerService.cs`: Core account balance logic.
