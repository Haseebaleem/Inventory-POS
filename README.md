# Inventory POS

A single-tenant Point-of-Sale and Inventory Management system for small businesses.
One owner, multiple cashiers, one POS counter — no marketplace, no multi-store.

> **Status — Phase 2 complete.** All admin pages (dashboard, products, categories, staff,
> business settings, audit logs, sales) and the POS counter are wired to the backend.
> Backend Jest suite still green at 28/28.

## Stack

**Backend** — Node 22 · Express · TypeScript (strict) · PostgreSQL · Prisma 6 · JWT · bcryptjs ·
Zod · Multer + Sharp · express-rate-limit · Winston · Jest + supertest.

**Frontend** — React 18 · Vite · TypeScript (strict) · Tailwind CSS · shadcn/ui-style components ·
TanStack Query v5 · Zustand · React Router v6 · React Hook Form + Zod · Recharts · react-hot-toast ·
lucide-react.

## Ports — locked

| Service  | Port | URL                            |
| -------- | ---- | ------------------------------ |
| Backend  | 5000 | http://localhost:5000/api/v1   |
| Frontend | 3000 | http://localhost:3000          |

These ports are pinned. Backend `.env` sets `PORT=5000`, Vite uses `strictPort: true` for 3000.

## Folder structure

```
Inventory-POS/
├── backend/      Express + Prisma API
│   ├── src/
│   ├── prisma/   schema, migrations, seed
│   └── uploads/  product/logo images (gitignored)
├── frontend/     React + Vite SPA
│   └── src/
└── README.md
```

## Prerequisites

- Node.js ≥ 20 (tested on 22.13)
- PostgreSQL ≥ 14 running locally
- A Postgres user that can `CREATE DATABASE`

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env       # then edit DATABASE_URL etc. if needed
npm install
npx prisma migrate dev     # creates the schema
npx prisma db seed         # populates demo data
npm run dev                # http://localhost:5000
```

### 2. Frontend (separate terminal)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:3000
```

Open <http://localhost:3000>, sign in with one of the seeded accounts:

| Role    | Email               | Password     |
| ------- | ------------------- | ------------ |
| Owner   | owner@demo.local    | Owner123!    |
| Cashier | cashier@demo.local  | Cashier123!  |

Owner lands on `/dashboard`, cashier on `/pos`.

## API surface (v1)

All routes are mounted at `/api/v1`.

### Public

- `POST /auth/login` — body `{ email, password }`, returns `{ token, user }`. Rate-limited.
- `GET  /health` — `{ status, dbConnected, timestamp }`

### Authenticated (owner or cashier)

- `GET  /auth/me`
- `GET  /pos/products/search?q=&limit=` — POS counter search
- `POST /pos/sales` — atomic sale creation
- `GET  /pos/sales` — cashiers see own; owners see all
- `GET  /pos/sales/:id`
- `POST /pos/sales/:id/refund` — cashier may refund own same-day sales; owner may refund any

### Owner-only (`/admin/*`)

Business · staff · categories · products (with Multer/Sharp image upload) · stock adjustments ·
reports (dashboard, sales, audit logs).

A short selection:

- `PATCH /admin/business`, `POST /admin/business/logo`
- `POST /admin/staff`, `PATCH /admin/staff/:id/suspend`, `DELETE /admin/staff/:id`
- `POST /admin/products` (multipart, `image` field) · `POST /admin/products/:id/stock` (adjustments)
- `GET  /admin/reports/dashboard` — today, last 7 days, top products, low stock, stock value
- `GET  /admin/audit-logs`

## Business rules

- **Sale completion is atomic.** Inside a serializable transaction:
  - Acquire `pg_advisory_xact_lock(YYYYMMDD)` so daily counters don't collide.
  - `SELECT ... FOR UPDATE` every product row in the cart.
  - Validate stock, decrement, write `Sale` + `SaleItem[]` + `StockMovement[]`.
  - Compute `subtotal`, apply business `taxRate`, store `taxAmount` and `total`.
- **Sale number:** `S-YYYYMMDD-NNNNN` (zero-padded daily counter).
- **Refund is atomic.** Restores stock, writes RETURN movements, sets `REFUNDED` + `refundedAt` +
  `refundReason`.
- **Stock adjustment** by owner: signed quantity; rejects if it would push stock below zero.
- **Low-stock alert:** `product.stock <= product.lowStockThreshold` (computed on read).
- **Product delete:** if any sale references it, soft delete (`active=false`); otherwise hard delete.

## Tests

The backend has a Jest + supertest integration suite hitting a real Postgres database.

```bash
cd backend
# .env must have DATABASE_URL_TEST pointing at an empty test database
npm test
```

Coverage includes: auth (login, suspended, /me), role gating, products CRUD, stock adjustment,
sale creation (atomic, tax, stock decrement, monotonic sale numbers), refund (stock restoration,
double-refund rejection), reports, staff lifecycle, and the health endpoint.

28 test cases, 60+ assertions. Run as Phase 1 acceptance gate.

## Frontend pages

```
/login                  public — role-based redirect on success
/dashboard              owner — 4 stat cards + 7-day revenue line + top-5 month bar + recent sales
/pos                    owner + cashier — debounced search, product grid, cart, tax, receipt
/products               owner — list w/ search, category, status filters, pagination
/products/new           owner — create form with image upload
/products/:id           owner — details tab + stock-history tab + adjust-stock modal
/categories             owner — inline create/edit/delete (blocked if products assigned)
/staff                  owner — add cashier, suspend/unsuspend, delete (soft if sales exist)
/business               owner — name, currency, tax rate, address, logo upload
/sales                  owner sees all · cashier sees own — filterable + paginated
/sales/:id              detail with refund button (rules per scope)
/audit-logs             owner — paginated, action/entity filter, expandable JSON metadata
```

## Phase plan

- **Phase 1 (Day 1)** — Backend complete + tested · frontend scaffold · login + role-based layout · README. ✅
- **Phase 2 (Day 2)** — Dashboard · products CRUD · categories · staff · business settings · POS
  counter (debounced search + cart + tax + receipt + print + keyboard shortcuts) · sales history
  · refund flow · audit log viewer · loading skeletons · top progress bar · error boundaries. ✅

## Cross-cutting UX

- **Loading**: skeletons on every list/detail page; a top progress bar reflects TanStack
  Query fetch + mutation state with a 150ms show delay.
- **Errors**: every page uses `RetryError` for failed queries; mutations toast the actual API
  error code in dev (e.g. `[CONFLICT] Email already in use`).
- **Currency**: business profile loaded once into a Zustand store at app boot — every money
  display uses `formatCurrency(amount, currency)`. No raw numbers.
- **Receipt printing**: `@media print` strips everything except the receipt and sizes it to 80mm
  thermal width. The print button triggers `window.print()`.
- **POS keyboard**: `/` focuses search · `Enter` adds first result · `Esc` clears query.

## License

See [LICENSE](./LICENSE).
