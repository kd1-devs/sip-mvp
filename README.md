# Football Finance Dashboard (SIP MVP)

A Next.js application for exploring football club financial data, featuring interactive charts, year-over-year comparisons, and natural language queries.

## Features

- 📊 **Interactive Charts**: Visualize revenue trends over time
- 📈 **YoY Analysis**: Automatic year-over-year percentage calculations
- 🔍 **Natural Language Queries**: Ask questions about club finances in plain English
- 🎯 **Type-Safe**: Full TypeScript coverage with Drizzle ORM
- ⚡ **Server Components**: Fast initial page loads with Next.js 16
- 📄 **Pagination Ready**: Efficient data loading for large datasets
- 💱 **[Nice-to-Have][Bonus] Currency Toggle**: Switch between GBP and EUR with fixed demo FX rate
- 🏆 **[Nice-to-Have][Bonus] CAGR Badge**: Displays revenue CAGR across shown seasons (hidden if insufficient data)
- 🆚 **[Nice-to-Have][Bonus] Two-Team Comparison**: Select and compare two teams on the same revenue chart with legend
- 📊 **[Nice-to-Have][Bonus] Sortable Table + CSV Download**: Sort by season/revenue/YoY and download CSV of current rows (client-side)
- 📉 **[Nice-to-Have][Bonus] Sparkline in Table**: Tiny inline sparkline showing revenue trend up to each year
- 🧪 **[Nice-to-Have][Bonus] Unit Tests for Metrics Util**: Comprehensive test coverage for YoY and CAGR edge cases (missing prior year, zero values, negative values)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **UI**: React 19, Tailwind CSS, shadcn/ui
- **Charts**: Recharts
- **Testing**: Vitest, @testing-library/react

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- PostgreSQL database (Supabase recommended)
- **Supabase CLI** (for local development)

### Installation

**1. Install Dependencies:**
```bash
# Clone the repository
git clone <repository-url>
cd sip-mvp

# Install dependencies
pnpm install
```

**2. Install Supabase CLI:**
```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via npm (not recommended, use native CLI)
npm install -g supabase
```

**3. Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials:

```bash
# Supabase (for auth and RLS)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Direct database connection (for Drizzle ORM)
DATABASE_URL=postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Database Setup

**Option 1: Use Remote Supabase (Recommended for Quick Start)**

Seed your remote database with sample data:
```bash
pnpm db:seed
```

This populates your remote database with 3 clubs and 3 seasons of financial data.

**Option 2: Local Development with Supabase**

> **Requirements:** Docker Desktop must be running

```bash
# Initialize and start local Supabase
supabase start

# This will:
# - Download Docker images (~2GB, first time only)
# - Start local Postgres, Auth, Storage, etc.
# - Run migrations automatically
# - Output local connection URLs

# Seed local database (included in reset)
supabase db reset

# Check status
supabase status

# Stop when done
supabase stop
```

**Your local Supabase will be available at:**
- Studio: http://localhost:54323
- Database: postgresql://postgres:postgres@localhost:54322/postgres
- API: http://localhost:54321

**Working with Migrations:**
```bash
# Link to your remote Supabase project (first time)
supabase link

# Pull schema from remote
supabase db pull

# Push local migrations to remote
supabase db push

# Compare local vs remote
supabase db diff
```

**Troubleshooting:**
- **Docker errors**: Ensure Docker Desktop is running
- **Port conflicts**: Stop services on ports 54321-54323  
- **Slow start**: First run downloads images (~2GB), takes 5-10 minutes
- **Update CLI**: `brew upgrade supabase` to fix issues

**Database Management:**
```bash
# View/edit data with Drizzle Studio (works with any DATABASE_URL)
pnpm db:studio
```

**Important:** We use Supabase SQL migrations (`supabase/migrations/`) as the single source of truth for schema. Drizzle is used only for:
- Type-safe queries in application code
- Drizzle Studio for database visualization

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Testing

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

---

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/sip-mvp)

1. Click the button above or visit [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
4. Deploy

### Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGci...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres...` |

**Finding Your Values**:
- Supabase Dashboard → Settings → API → Project URL & anon key
- Supabase Dashboard → Settings → Database → Connection String (use pooler for serverless)

---

## Documentation

📚 **Comprehensive documentation is available in `/docs`:**

- **[Data Model & Schema](./docs/DATA_MODEL.md)**: Database tables, relationships, YoY calculation algorithm
- **[Ask Box Implementation](./docs/ASK_BOX.md)**: Natural language query system, pattern matching, examples
- **[Database & RLS](./docs/DATABASE_RLS.md)**: Row Level Security policies, production strategies, migrations

---

## Project Structure

```
app/
├── page.tsx                 # Main dashboard (server component)
├── actions/
│   └── financials.ts       # Server actions for data fetching
└── api/
    ├── ask/                # Natural language query endpoint
    └── auth/               # Supabase auth callbacks

components/
├── platform/
│   ├── dashboard-client.tsx   # Client component for interactivity
│   ├── club-selector.tsx      # Club dropdown
│   ├── revenue-chart.tsx      # Recharts visualization
│   ├── metrics-table.tsx      # Financial metrics display
│   └── ask-box.tsx           # Natural language query interface
└── ui/                    # shadcn/ui components

lib/
├── data/
│   ├── queries.ts         # Database queries (Drizzle)
│   └── index.ts          # Re-exports
├── db/
│   ├── index.ts          # Drizzle client
│   └── schema.ts         # Database schema
├── supabase/
│   ├── client.ts         # Browser client
│   ├── server.ts         # Server client
│   └── migrations/       # SQL migrations
└── utils/
    ├── financials.ts     # YoY calculations
    └── formatters.ts     # Data formatting

docs/
├── DATA_MODEL.md         # Database schema documentation
├── ASK_BOX.md           # Natural language query docs
└── DATABASE_RLS.md      # RLS policies and security
```

---

## Database Commands

```bash
# npm scripts (simplified)
pnpm db:seed           # Seed remote database with sample data
pnpm db:studio         # Open Drizzle Studio to view/edit data

# Supabase CLI (use directly for full control)
supabase start         # Start local Supabase (Docker required)
supabase stop          # Stop local Supabase
supabase status        # Check local Supabase status
supabase db reset      # Reset local DB (migrations + seed)
supabase link          # Link to remote Supabase project
supabase db push       # Push local migrations to remote
supabase db pull       # Pull schema from remote
supabase db diff       # Compare local vs remote schemas
```

**Note:** We use Supabase CLI directly for database management. Install it with `brew install supabase/tap/supabase` on macOS.

---

## Usage Examples

### Ask Box Queries

Try asking questions like:

```
What was Manchester United's revenue in 2022?
```

```
What was Real Madrid's revenue in 2021?
```

```
Tell me about Barcelona's revenue in 2023
```

**Response Format**:
> Manchester United's revenue in 2022 was £502,000M (GBP). The year-over-year change was +12.3%.

See [Ask Box Documentation](./docs/ASK_BOX.md) for detailed implementation.

---

## Architecture Decisions

### Server-Side Data Fetching

Initial data is fetched on the server for fast page loads:

```typescript
// app/page.tsx (server component)
const clubs = await getAllClubs();
const initialFinancials = await getClubFinancialsWithYoY(initialClubId);
```

Client components handle interactivity only:

```typescript
// components/platform/dashboard-client.tsx (client component)
"use client";
// Receives pre-calculated data as props
```

### Why Drizzle ORM?

- **Type Safety**: Full TypeScript integration with schema inference
- **Performance**: Direct SQL queries, minimal overhead
- **Developer Experience**: Autocomplete and type checking
- **Migration-First**: Schema as code with version control

### Server Components + Server Actions

- **Initial Load**: Data fetched on server for fast FCP
- **Interactivity**: Client components handle user interactions
- **Server Actions**: Type-safe client-to-server communication

---

## Security

### Row Level Security (RLS)

**Current Policy**: Demo-level public read access

✅ Anyone can view data (financial data is public)  
🔒 Only authenticated users can modify data

**Production Recommendations**:
- Authenticated-only access
- Per-user "followed teams" model
- Role-based access control (RBAC)

See [Database & RLS Documentation](./docs/DATABASE_RLS.md) for detailed policies and migration guides.

---

## Contributing

This is an MVP project. For production use, consider implementing:

1. ✅ Proper authentication and authorization
2. ✅ Error boundaries and loading states
3. ✅ Input validation and sanitization
4. ✅ Rate limiting on API endpoints
5. ✅ Monitoring and logging
6. ✅ Comprehensive testing

---

## License

MIT
