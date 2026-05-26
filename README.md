# Inventory & POS System

> Point-of-sale and inventory management system for small businesses. Multi-cashier POS counter with keyboard shortcuts, real-time stock tracking with atomic operations, comprehensive audit trail, and sales reporting. Built with React 18, TypeScript, Node.js, Express, PostgreSQL, and Prisma.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Status:** Shipped and polished. UI uses emerald accent (distinct from my [TextKit](https://github.com/Haseebaleem/TextKit) and [NewsHub](https://github.com/Haseebaleem/NewsHub) which use amber) — each project has its own visual identity tied to domain. Dark mode is the default, Geist Sans/Mono fonts, categorized sidebar.

---

## 🎬 Demo

> Demo GIF coming soon — showcasing the POS counter workflow, keyboard shortcuts, atomic sale completion with receipt printing, stock adjustments, and the real-time dashboard.

<!-- Once recorded:
![POS demo](./demo.gif)
-->

---

## ✨ Features

### Authentication & Roles
- 🔐 **JWT-based authentication** with 7-day tokens and rate-limited login (5 attempts per 15 minutes per IP)
- 👥 **Two distinct roles** — `OWNER` (full admin) and `CASHIER` (POS + own sales)
- 🚫 **Suspended account enforcement** — instant lockout, no token rotation needed
- 🌱 **Owner-seeded setup** — no public registration, idempotent seed script for clean deploys

### Owner Capabilities
- 📊 **Live dashboard** — today's revenue, sales count, low-stock count, total stock value, 7-day revenue chart, top-5 selling products
- 📦 **Product management** — full CRUD with image upload, SKU & barcode, category assignment, low-stock threshold per product
- 🏷️ **Category management** — flat categories with slug generation and referential integrity (deletion blocked when products exist)
- 👨‍💼 **Staff management** — add cashiers, suspend/unsuspend, delete
- ⚙️ **Business settings** — name, address, currency (PKR/SAR/USD/EUR/AED), configurable tax rate, business logo
- 📈 **Sales reporting** — paginated with filters (date range, cashier, payment method, status)
- 📜 **Full audit log viewer** — every mutation captured with actor, IP, entity, and metadata

### POS Counter (Cashier + Owner)
- ⚡ **Fast product search** — debounced 200ms, searches name + SKU + barcode simultaneously
- ⌨️ **Keyboard shortcuts** — `/` focuses search, `Esc` clears it, optimized for tablet/keyboard-driven flow
- 🛒 **Real-time cart** — instant total calculation with tax breakdown, quantity steppers, line removal
- 💰 **Multi-payment support** — Cash or Card (UI-level; integration-ready)
- 🧾 **Print-ready receipts** — 80mm thermal-receipt CSS, monochrome, hides UI chrome during print
- 🔢 **Sequential sale numbers** — `S-YYYYMMDD-NNNNN` format, monotonic per day
- ⛔ **Stock-aware UI** — out-of-stock products grayed out, qty steppers cap at available stock
- ↩️ **Refund workflow** — same-day own-sale refunds for cashiers; any-time refunds for owners (with required reason)

### Inventory & Stock
- 📊 **Real-time stock tracking** with atomic `SELECT FOR UPDATE` locking on sale completion
- 🔄 **Stock movement history** — every change typed (`PURCHASE`/`SALE`/`RETURN`/`ADJUSTMENT`/`DAMAGE`) with reason, actor, and timestamp
- ⚠️ **Configurable low-stock thresholds** per product
- 🔁 **Auto-restore on refund** — refunding a sale automatically restores stock with audit trail

### Cross-cutting
- 📝 **System-wide audit log** — `USER_LOGIN`, `PRODUCT_CREATED`, `STOCK_ADJUSTED`, `SALE_CREATED`, `SALE_REFUNDED`, etc., with actor IP and field-level metadata
- 🚦 **Loading skeletons** matching every page layout — perceived-performance optimization
- 📶 **Top progress bar** — route transitions and TanStack mutations/queries
- 🍞 **Error toasts with codes** — `[INSUFFICIENT_STOCK]`, `[UNAUTHORIZED]`, etc., in dev mode for fast diagnosis
- 💵 **Locale-aware currency formatting** — `Intl.NumberFormat` driven by business currency setting

---

## 💡 Design Decisions

This isn't just a CRUD app — several patterns are intentional for production realism.

### Why `SELECT FOR UPDATE` on sale completion
A POS system runs on a critical assumption: **stock cannot oversell**. Two cashiers ringing up the last unit of an item simultaneously would corrupt inventory without proper locking. Sale completion runs inside a transaction that row-locks each product, validates stock, decrements atomically, creates the sale + line items + stock movements, and commits — all-or-nothing. Failed validation rolls back cleanly; partial sales don't exist.

### Why atomic sale completion combines row-level locking and advisory transaction locks
Sale completion runs inside a transaction that locks each product row via `SELECT ... FOR UPDATE`, validates stock, decrements atomically, and creates the Sale + SaleItem + StockMovement rows. But generating the daily sale number (`S-YYYYMMDD-NNNNN`) requires a separate guarantee — two cashiers ringing up simultaneously must get different sequential numbers, not duplicates. A row lock on Products doesn't help here because the contention is on a counter, not a row. The pattern: `pg_advisory_xact_lock(YYYYMMDD::int8)` at the start of the transaction, scoped to the current day. Released automatically on commit or rollback. This serializes sale-number generation across cashiers without locking unrelated rows or requiring SERIALIZABLE isolation level. The combination — row locks for stock, advisory lock for sale number — is precise about what's actually contended.

### Why snapshot product name and price in `SaleItem`
Receipts and historical reports must remain accurate even after products are deleted or repriced. `SaleItem.productName` and `productPrice` are denormalized at sale time. Reprinting a 6-month-old receipt shows the price the customer actually paid, not the current price. Same pattern used in production systems like Shopify and Square.

### Why no public registration
A real shop's POS isn't a sign-up form — the owner is provisioned once during setup, and only the owner creates cashiers. This eliminates an entire class of security concerns (account farming, spam registrations) and reflects how POS systems actually deploy. Seed script is idempotent: running it twice doesn't duplicate.

### Why strict port binding (`strictPort: true` in Vite)
Vite's default behavior is to fall back to the next available port if 3000 is taken. That silent fallback creates configuration drift — the frontend talks to backend on a port the dev didn't realize had changed. `strictPort` fails loudly when the port is taken, which is easier to debug than figuring out which port your services actually landed on.

### Why per-route rate limiting
A shared rate-limit counter across all auth routes means an attacker spamming `/register` can lock out legitimate `/login` attempts on the same IP. Per-route counters keep failure modes isolated.

### Why audit log captures IP at action time
For after-the-fact incident investigation. If a staff member's account is compromised, the audit log shows whether the suspicious actions came from the usual IP or a new one. Trivial to add at the middleware layer, invaluable when something goes wrong.

### Why monotonic daily sale numbers
Sequential numbers within a day are required by some tax authorities and make reconciliation trivial. The format `S-20260524-00001` is human-readable, sortable, and obviously a sale identifier. Generated atomically inside the sale transaction to prevent gaps or duplicates under concurrency.

### Why `randInt(2, 30)` for seeded low stock
The dashboard's "Low Stock" widget should mean something out of the box. If all seeded stocks land at 50+, the widget shows zero and recruiters cloning the repo see a useless tile. Tight range guarantees the demo experience is meaningful immediately.

---

## 🛠️ Tech Stack

### Backend
| Category | Technology |
|----------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript (strict mode) |
| Framework | Express.js |
| Database | PostgreSQL 13+ |
| ORM | Prisma 6.x |
| Auth | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| Validation | Zod |
| File Upload | Multer 2.x |
| Image Processing | Sharp |
| Rate Limiting | express-rate-limit |
| Logging | Winston |
| Testing | Jest + supertest |

### Frontend
| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Language | TypeScript (strict mode) |
| Build Tool | Vite 5.x |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (Radix primitives) |
| Data Fetching | TanStack Query v5 |
| State Management | Zustand |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | lucide-react |
| Notifications | react-hot-toast |

---

## 🏗️ Architecture

```
┌──────────────────┐         ┌──────────────────┐
│  React + Vite    │◄────────│  Express API     │
│  (Owner UI +     │  HTTPS  │  (port 5000)     │
│   POS Counter)   │────────►│  + JWT Auth      │
│  port 3000       │         │  + Rate Limit    │
└──────────────────┘         └──────────┬───────┘
                                        │
                                        │ Prisma 6
                                        ▼
                              ┌──────────────────┐
                              │   PostgreSQL     │
                              │   8 models       │
                              │   + indexes      │
                              └──────────────────┘
```

**Sale completion flow:**
1. POS cart submitted with items + payment method
2. Backend opens transaction
3. `SELECT FOR UPDATE` on each product (row lock)
4. Validate stock for each item
5. Decrement stock atomically
6. Generate next daily sale number (`S-YYYYMMDD-NNNNN`)
7. Create `Sale`, `SaleItem` rows (with denormalized product snapshots), `StockMovement` rows
8. Commit transaction
9. Create `AuditLog` entry
10. Return sale ID + receipt data to frontend
11. Frontend opens receipt modal with print option

---

## 📋 Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** 13 or higher
- **npm** 9+

---

## 🚀 Getting Started

### Clone

```bash
git clone https://github.com/Haseebaleem/Inventory-POS.git
cd Inventory-POS
```

### Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret

# Create the database
psql -U postgres -c "CREATE DATABASE inventory_pos;"

# Run migrations
npx prisma migrate dev

# Seed the database with demo data
npx prisma db seed

# Start the dev server (locked to port 5000 via strictPort)
npm run dev
```

You should see: `🚀 API listening on http://localhost:5000`

### Frontend Setup

In a new terminal:

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env

# Start the dev server (locked to port 3000)
npm run dev
```

Open `http://localhost:3000`.

### Demo Credentials

The seed script creates:

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@demo.local` | `Owner123!` |
| Cashier | `cashier@demo.local` | `Cashier123!` |

Plus 5 categories, 20 sample products with realistic stock distribution, and one configured business profile (Demo Store, PKR currency, 0% tax).

### Quick Tour
1. Log in as **owner** → land on `/dashboard`, see live stats and charts
2. Visit `/products` → 20 seeded products with categories and varying stock levels
3. Visit `/staff` → demo cashier listed
4. Sign out, log in as **cashier** → land on `/pos`
5. Search a product, add to cart, complete sale → receipt modal with print option
6. Sign out, log in as owner → check `/sales` for the new sale, `/audit-logs` for the trail

---

## 📡 REST API Endpoints

All endpoints under `/api/v1`. JWT in `Authorization: Bearer <token>` header.

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Owner or cashier login | ❌ |
| GET | `/auth/me` | Current user + business profile | ✅ |

### Owner Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/business` | Get business profile |
| PATCH | `/admin/business` | Update business profile |
| POST | `/admin/business/logo` | Upload business logo |
| GET | `/admin/staff` | List cashiers |
| POST | `/admin/staff` | Create cashier |
| PATCH | `/admin/staff/:id/suspend` | Suspend cashier |
| PATCH | `/admin/staff/:id/unsuspend` | Restore cashier |
| DELETE | `/admin/staff/:id` | Delete cashier |
| GET | `/admin/categories` | List categories |
| POST | `/admin/categories` | Create category |
| PATCH | `/admin/categories/:id` | Update category |
| DELETE | `/admin/categories/:id` | Delete (blocked if products reference it) |
| GET | `/admin/products` | List with filters (search, category, lowStock, active) |
| POST | `/admin/products` | Create with image upload |
| GET | `/admin/products/:id` | Detail with stock history |
| PATCH | `/admin/products/:id` | Update |
| DELETE | `/admin/products/:id` | Soft or hard delete |
| POST | `/admin/products/:id/stock` | Stock adjustment |
| GET | `/admin/reports/dashboard` | Dashboard widgets data |
| GET | `/admin/reports/sales` | Paginated sales with filters |
| GET | `/admin/audit-logs` | Paginated audit log with filters |

### POS (Owner + Cashier)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pos/products/search` | Search for POS counter (name/SKU/barcode) |
| POST | `/pos/sales` | Complete a sale (atomic) |
| GET | `/pos/sales` | List sales (own or all by role) |
| GET | `/pos/sales/:id` | Sale detail |
| POST | `/pos/sales/:id/refund` | Refund with reason + stock restore |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service + DB health check |

---

## 📁 Project Structure

```
Inventory-POS/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.ts          # singleton client
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── role.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── audit.service.ts
│   │   │   ├── sale.service.ts
│   │   │   └── stock.service.ts
│   │   ├── utils/
│   │   ├── validators/
│   │   └── index.ts
│   ├── uploads/                   # gitignored
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                   # axios client + endpoint wrappers
│   │   ├── components/
│   │   │   ├── ui/                # shadcn primitives
│   │   │   ├── layout/            # sidebar, topbar, route guards
│   │   │   ├── pos/               # POS-specific components
│   │   │   └── shared/            # empty states, retry, confirm dialog
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── owner/             # dashboard, products, staff, etc.
│   │   │   ├── pos/
│   │   │   └── sales/
│   │   ├── stores/                # zustand stores (auth, business, cart)
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── currency.ts
│   │   │   ├── date.ts
│   │   │   └── query-client.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🔐 Security Practices

- Passwords hashed with bcrypt (10 rounds) — never returned in any response
- JWT secret loaded from environment, never committed
- Per-route rate limiting on `/auth/login` (5 attempts / 15 min / IP) — independent counters so one endpoint can't lock out another
- Role middleware enforces OWNER vs CASHIER access on every protected route
- Suspended accounts return 403 immediately on any request, not at next token refresh
- File uploads: MIME filter as first pass, Sharp metadata validation as the actual gate (MIME headers are spoofable; image bytes are not)
- All uploads converted to WebP and resized server-side — original files never served
- Prisma's parameterized queries (built-in)
- CORS configured to frontend origin only, configurable per environment
- Audit log captures IP per action for post-incident investigation
- TypeScript strict mode in both backend and frontend — entire classes of runtime errors eliminated at compile time
- `.env` files always gitignored; `.env.example` committed with placeholder values

> **Note:** JWT stored in localStorage is appropriate for this demonstration. Production deployments should consider httpOnly cookies with CSRF protection for hardened XSS resistance.

---

## 🧪 Testing

End-to-end integration tests cover authentication, role gating, product CRUD, atomic stock adjustment, atomic sale creation (decrement + movements + tax + sale-number generation), monotonic daily sale numbers, refunds (stock restoration + double-refund rejection), reports, staff lifecycle, and health.

```bash
cd backend
npm test
```

**Coverage:** 28 test cases, 60+ assertions, all passing across both Phase 1 and Phase 2 development.

---

## 🗺️ Roadmap — Real-World Productization

Features for transitioning this from portfolio to commercial product:

### Hardware Integration
- [ ] Thermal receipt printer support via ESC/POS protocol (USB + Bluetooth)
- [ ] Native barcode scanner integration — handheld USB HID (already works via keyboard wedge) and camera-based mobile
- [ ] Cash drawer control via printer kick-out
- [ ] Customer-facing display (second screen) showing transaction total
- [ ] Card reader / payment terminal integration

### Business Features
- [ ] Bulk product import from Excel/CSV with row-by-row validation and error reporting
- [ ] Multi-branch support with inventory transfers between locations
- [ ] Customer database with purchase history and loyalty points
- [ ] Discounts, coupons, and promotional pricing rules
- [ ] Returns and exchanges (not just full refunds) — partial refund and item swap
- [ ] End-of-day Z-reports and cashier shift reconciliation
- [ ] Multiple tax rates per product category (e.g., 0% food, 17% electronics)
- [ ] Quick-add shortcut buttons for top-selling products on POS counter
- [ ] Hold / recall transactions when customer interrupts checkout

### Operations
- [ ] Offline mode with sync queue for unreliable internet connections
- [ ] Concurrent multi-cashier transaction handling beyond row-level locking
- [ ] Customizable receipt templates (logo, footer message, return policy)
- [ ] Inventory low-stock auto-reorder alerts to suppliers
- [ ] Supplier management with purchase orders and payment tracking
- [ ] Advanced reporting: sales by hour, dead stock, fast movers, profit margins
- [ ] Backup & disaster recovery with cloud sync

### Tax Compliance
- [ ] Pakistan FBR-compliant tax invoicing for registered categories
- [ ] Saudi ZATCA e-invoicing integration (Phase 2 mandatory format)

### Frontend Polish
- [ ] Demo GIF recording showing POS workflow
- [ ] Mobile-responsive cashier mode for tablet POS
- [ ] Keyboard shortcut overlay (press `?` to view)
- [ ] PWA installability with offline cache for the POS counter

This codebase is structured to support these extensions — domain models are clean, transactions are atomic, the audit log captures everything, and the API is REST-versioned (`/api/v1`) ready for v2 migrations.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file. Use it as a reference, starting point, or learning resource.

---

## 👤 Author

**Haseeb Aleem**
Senior Full Stack Developer & Team Lead

- 💼 **LinkedIn:** [linkedin.com/in/haseeb-aleem-dev](https://www.linkedin.com/in/haseeb-aleem-dev/)
- 💻 **GitHub:** [github.com/Haseebaleem](https://github.com/Haseebaleem)
- 📧 **Email:** haseebaleem2802@gmail.com
- 📍 **Location:** Multan, Pakistan

---

⭐ If you found this project useful or interesting, consider giving it a star.
