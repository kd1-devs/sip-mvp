-- =====================================
-- EXTENSIONS
-- =====================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================
-- TABLE: clubs
-- =====================================
create table public.clubs (
    id bigint generated always as identity primary key,
    name text not null unique,
    company_overview text,
    website text,
    country text,
    league text,
    year_founded int,
    location text,
    owners text,
    owner_location text,
    ceo text,
    chairman text,
    profile text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- =====================================
-- TABLE: financials
-- =====================================
create table public.financials (
    id bigint generated always as identity primary key,
    club_id bigint not null references public.clubs(id) on delete cascade,
    year int not null,

    revenue numeric,
    revenue_yoy numeric,
    ebitda numeric,

    wages numeric,
    amortization numeric,
    other_expenses numeric,

    matchday_revenue numeric,
    commercial_revenue numeric,
    broadcasting_revenue numeric,

    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),

    unique (club_id, year)
);

-- =====================================
-- TABLE: financial_ratios
-- =====================================
create table public.financial_ratios (
    id bigint generated always as identity primary key,
    club_id bigint not null references public.clubs(id) on delete cascade,
    year int not null,

    wage_to_revenue numeric,
    wages_amort_to_revenue numeric,
    other_expenses_to_revenue numeric,
    ebitda_margin numeric,

    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),

    unique (club_id, year)
);

-- =====================================
-- TABLE: media_assets
-- =====================================
create table public.media_assets (
    id bigint generated always as identity primary key,
    club_id bigint not null references public.clubs(id) on delete cascade,
    asset_type text,
    url text,
    alt_text text,
    created_at timestamp with time zone default now()
);

-- =====================================
-- TABLE: valuations
-- =====================================
create table public.valuations (
    id bigint generated always as identity primary key,
    club_id bigint not null references public.clubs(id) on delete cascade,
    year int not null,
    valuation numeric,
    source text,
    created_at timestamp with time zone default now(),

    unique (club_id, year)
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================
create index idx_financials_club_id on public.financials(club_id);
create index idx_financials_year on public.financials(year);
create index idx_financial_ratios_club_id on public.financial_ratios(club_id);
create index idx_valuations_club_id on public.valuations(club_id);
create index idx_media_assets_club_id on public.media_assets(club_id);

-- =====================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================
alter table public.clubs enable row level security;
alter table public.financials enable row level security;
alter table public.financial_ratios enable row level security;
alter table public.media_assets enable row level security;
alter table public.valuations enable row level security;

-- =====================================
-- RLS POLICIES
-- =====================================

-- Allow anonymous read access for demo purposes
-- In production, you'd want authenticated-only access
create policy "Allow public read access to clubs"
    on public.clubs for select
    using (true);

create policy "Allow public read access to financials"
    on public.financials for select
    using (true);

create policy "Allow public read access to financial_ratios"
    on public.financial_ratios for select
    using (true);

create policy "Allow public read access to media_assets"
    on public.media_assets for select
    using (true);

create policy "Allow public read access to valuations"
    on public.valuations for select
    using (true);

-- Only authenticated users can insert/update/delete
-- You can make this more restrictive (admin-only) in production
create policy "Authenticated users can manage clubs"
    on public.clubs for all
    using (auth.role() = 'authenticated');

create policy "Authenticated users can manage financials"
    on public.financials for all
    using (auth.role() = 'authenticated');

create policy "Authenticated users can manage financial_ratios"
    on public.financial_ratios for all
    using (auth.role() = 'authenticated');

create policy "Authenticated users can manage media_assets"
    on public.media_assets for all
    using (auth.role() = 'authenticated');

create policy "Authenticated users can manage valuations"
    on public.valuations for all
    using (auth.role() = 'authenticated');