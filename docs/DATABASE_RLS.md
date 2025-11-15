# Database & Row Level Security (RLS)

## Database Setup

### Provider: Supabase

Supabase provides:
- Managed PostgreSQL database
- Built-in authentication
- Row Level Security (RLS)
- Real-time subscriptions (not currently used)
- Storage (not currently used)
- Auto-generated REST API (not currently used)

### Why Supabase + Drizzle?

**Supabase**: For auth infrastructure and RLS  
**Drizzle ORM**: For type-safe queries and migrations

This hybrid approach allows:
- RLS enforcement when needed
- Type-safe database queries
- Migration management
- Direct SQL performance

---

## Database Architecture

### Connection Methods

#### 1. Drizzle ORM (Primary)

Used for all application queries:

```typescript
// lib/db/index.ts
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
```

**Characteristics**:
- Direct connection to PostgreSQL
- Bypasses RLS (uses connection pool user)
- Best for server-side queries
- Type-safe with schema inference

#### 2. Supabase Client (Auth)

Reserved for future authentication:

```typescript
// lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* ... */ } }
  );
}
```

**Characteristics**:
- Respects RLS policies
- User context available
- Good for authenticated operations

---

## Schema Migrations

### Migration Files

**Location**: `/lib/supabase/migrations/`

#### 0001_create_schema.sql
- Creates all tables
- Defines constraints
- Creates indexes
- Enables RLS
- Sets up policies

#### 0002_seed_data.sql
- Inserts 3 clubs
- Adds 3 seasons per club (2021-2023)
- Includes financial ratios
- Adds club valuations

### Running Migrations

#### Option 1: Drizzle Push (Development)

```bash
pnpm db:push
```

Reads schema from `lib/db/schema.ts` and pushes to database.

#### Option 2: Manual SQL (Production)

In Supabase Dashboard:
1. Go to SQL Editor
2. Create new query
3. Copy contents of migration file
4. Execute

#### Option 3: Command Line

```bash
psql $DATABASE_URL -f lib/supabase/migrations/0001_create_schema.sql
psql $DATABASE_URL -f lib/supabase/migrations/0002_seed_data.sql
```

---

## Row Level Security (RLS)

### Current Policy: Demo-Level Public Access

**Design Choice**: For MVP demonstration purposes, we've implemented a permissive RLS policy.

### Policy Structure

#### READ Access (SELECT)

```sql
create policy "Allow public read access to clubs"
    on public.clubs for select
    using (true);
```

**Who**: Anyone (anonymous + authenticated)  
**What**: All rows  
**Why**: Financial data for major clubs is publicly available

Applied to all tables:
- `clubs`
- `financials`
- `financial_ratios`
- `media_assets`
- `valuations`

#### WRITE Access (INSERT/UPDATE/DELETE)

```sql
create policy "Authenticated users can manage clubs"
    on public.clubs for all
    using (auth.role() = 'authenticated');
```

**Who**: Only authenticated users  
**What**: All operations (INSERT, UPDATE, DELETE)  
**Why**: Prevents anonymous vandalism

Applied to all tables:
- `clubs`
- `financials`
- `financial_ratios`
- `media_assets`
- `valuations`

### Why This Approach?

1. **MVP Simplicity**: Demonstrates functionality without authentication barriers
2. **Public Data**: Financial data for major clubs is publicly available (Forbes, Deloitte)
3. **Security Awareness**: RLS is enabled and ready to be tightened
4. **Future-Ready**: Easy to migrate to more restrictive policies
5. **Development Speed**: No auth setup required for demo

### Security Warning

⚠️ **This is for demonstration only**. The `using (true)` policy allows unrestricted read access.

Before deploying to production with sensitive data, implement proper access controls.

---

## Production RLS Strategies

### Option A: Authenticated-Only Access

Require authentication for all operations:

```sql
-- Drop existing public read policies
drop policy "Allow public read access to clubs" on public.clubs;
drop policy "Allow public read access to financials" on public.financials;
-- ... repeat for all tables

-- Create authenticated-only policies
create policy "Authenticated users can read clubs"
    on public.clubs for select
    using (auth.role() = 'authenticated');

create policy "Authenticated users can read financials"
    on public.financials for select
    using (auth.role() = 'authenticated');
```

**Use Case**: Internal tools, private dashboards

### Option B: Per-User "Followed Teams" Model

Users can only see clubs they follow:

```sql
-- Create junction table
create table public.user_followed_clubs (
    user_id uuid references auth.users(id) on delete cascade,
    club_id bigint references public.clubs(id) on delete cascade,
    created_at timestamp with time zone default now(),
    primary key (user_id, club_id)
);

-- Enable RLS
alter table public.user_followed_clubs enable row level security;

-- Policy: Users see only their followed clubs
create policy "Users see followed clubs"
    on public.clubs for select
    using (
        id in (
            select club_id 
            from user_followed_clubs 
            where user_id = auth.uid()
        )
    );

-- Policy: Users can manage their follows
create policy "Users manage own follows"
    on public.user_followed_clubs
    using (user_id = auth.uid());

-- Cascade to financials
create policy "Users see followed club financials"
    on public.financials for select
    using (
        club_id in (
            select club_id 
            from user_followed_clubs 
            where user_id = auth.uid()
        )
    );
```

**Use Case**: Personalized dashboards, subscription models

### Option C: Role-Based Access Control (RBAC)

Different permissions based on user role:

```sql
-- Assuming user roles stored in user metadata
-- Set in Supabase: auth.users -> raw_user_meta_data -> { role: 'admin' }

-- Viewers can only read
create policy "Viewers can read financials"
    on public.financials for select
    using (
        auth.jwt() ->> 'role' in ('viewer', 'analyst', 'admin')
    );

-- Analysts can read and insert
create policy "Analysts can insert financials"
    on public.financials for insert
    with check (
        auth.jwt() ->> 'role' in ('analyst', 'admin')
    );

-- Only admins can update/delete
create policy "Admins can update financials"
    on public.financials for update
    using (auth.jwt() ->> 'role' = 'admin')
    with check (auth.jwt() ->> 'role' = 'admin');

create policy "Admins can delete financials"
    on public.financials for delete
    using (auth.jwt() ->> 'role' = 'admin');
```

**Use Case**: Multi-tenant SaaS, enterprise applications

### Option D: Organization-Based Access

Users see data for their organization:

```sql
-- Add org_id to clubs
alter table public.clubs add column org_id uuid references public.organizations(id);

-- Policy: Users see clubs in their org
create policy "Users see org clubs"
    on public.clubs for select
    using (
        org_id = (
            select org_id 
            from public.users 
            where id = auth.uid()
        )
    );
```

**Use Case**: B2B platforms, agency tools

---

## RLS Testing

### Verify Policies Are Enabled

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should show rowsecurity = true for all tables
```

### List All Policies

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public';
```

### Test as Anonymous User

```sql
-- This should work (public read)
SELECT * FROM clubs;

-- This should fail (authenticated write)
INSERT INTO clubs (name, country) VALUES ('Test Club', 'England');
```

### Test with Authentication

Use Supabase client with user context:

```typescript
const supabase = await createClient();
const { data, error } = await supabase
  .from('clubs')
  .select('*');
  
// If using auth.role() = 'authenticated'
// This will only work if user is logged in
```

---

## Database Performance

### Indexes

All foreign keys have indexes for fast lookups:

```sql
create index idx_financials_club_id on public.financials(club_id);
create index idx_financials_year on public.financials(year);
create index idx_financial_ratios_club_id on public.financial_ratios(club_id);
create index idx_valuations_club_id on public.valuations(club_id);
create index idx_media_assets_club_id on public.media_assets(club_id);
```

### Query Optimization

1. **Use SELECT specific columns** instead of SELECT *
2. **Add WHERE clauses** to filter early
3. **Use LIMIT** for pagination
4. **Join efficiently** with proper indexes

### Monitoring

Use Supabase Dashboard:
- **Database** → **Query Performance**
- Shows slow queries
- Identifies missing indexes
- Tracks query frequency

---

## Backup & Recovery

### Automated Backups (Supabase)

Supabase provides:
- Daily automated backups
- Point-in-time recovery (paid plans)
- Backup retention based on plan

### Manual Backups

```bash
# Export entire database
pg_dump $DATABASE_URL > backup.sql

# Restore from backup
psql $DATABASE_URL < backup.sql

# Export specific table
pg_dump $DATABASE_URL -t public.clubs > clubs_backup.sql
```

---

## Environment Variables

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Direct Database Connection (Drizzle)
DATABASE_URL=postgresql://postgres.[project]:password@aws-0-region.pooler.supabase.com:6543/postgres
```

### Security Notes

- ✅ `.env*` files are in `.gitignore`
- ✅ `.env.example` provides template
- ✅ Never commit actual credentials
- ✅ Use Vercel/platform environment variables for production
- ✅ Rotate keys periodically

### Finding Your Values

**Supabase Dashboard** → **Settings** → **API**:
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key

**Supabase Dashboard** → **Settings** → **Database**:
- `DATABASE_URL`: Connection string (use pooler for serverless)

---

## Troubleshooting

### Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check if tables exist
psql $DATABASE_URL -c "\dt"
```

### RLS Policy Issues

```sql
-- Disable RLS temporarily (development only)
ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;

-- Check current user/role
SELECT current_user, session_user;

-- Test policy manually
SET ROLE authenticated;
SELECT * FROM clubs;
```

### Migration Conflicts

```sql
-- Drop all tables (DANGEROUS - development only)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Re-run migrations
```

### Performance Issues

```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Analyze table
ANALYZE clubs;
```

---

## Future Considerations

1. **Real-time Subscriptions**: Use Supabase Realtime for live updates
2. **Storage**: Use Supabase Storage for club logos/images
3. **Functions**: PostgreSQL functions for complex calculations
4. **Views**: Create materialized views for aggregated data
5. **Partitioning**: Partition financials table by year for scale
6. **Replication**: Set up read replicas for high traffic
