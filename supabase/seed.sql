-- =====================================
-- SEED DATA: Clubs and Financial Data
-- =====================================
-- This migration adds sample data for testing and demonstration
-- 3 clubs with 3 seasons each (2021, 2022, 2023)

-- =====================================
-- INSERT CLUBS
-- =====================================

INSERT INTO public.clubs (name, country, league, year_founded, website, owners, location, ceo, chairman, company_overview) VALUES
(
    'Manchester United',
    'England',
    'Premier League',
    1878,
    'https://www.manutd.com',
    'Glazer Family',
    'Manchester, England',
    'Omar Berrada',
    'Joel Glazer',
    'Manchester United Football Club is one of the most successful and widely supported football clubs in the world, competing in the English Premier League.'
),
(
    'Real Madrid',
    'Spain',
    'La Liga',
    1902,
    'https://www.realmadrid.com',
    'Club Members (Socios)',
    'Madrid, Spain',
    'José Ángel Sánchez',
    'Florentino Pérez',
    'Real Madrid Club de Fútbol is a Spanish professional football club based in Madrid, known as one of the most successful clubs in European football history.'
),
(
    'FC Barcelona',
    'Spain',
    'La Liga',
    1899,
    'https://www.fcbarcelona.com',
    'Club Members (Socios)',
    'Barcelona, Spain',
    'Joan Laporta',
    'Joan Laporta',
    'Futbol Club Barcelona is a professional football club based in Barcelona, Catalonia, Spain, renowned for its attacking style and La Masia youth academy.'
);

-- =====================================
-- INSERT FINANCIAL DATA
-- =====================================

-- Manchester United Financial Data (2021-2023)
-- Revenue figures in millions (GBP equivalent)
INSERT INTO public.financials (club_id, year, revenue, ebitda, wages, amortization, other_expenses, matchday_revenue, commercial_revenue, broadcasting_revenue) VALUES
(
    (SELECT id FROM public.clubs WHERE name = 'Manchester United'),
    2021,
    494.0,  -- Revenue
    120.5,  -- EBITDA
    323.0,  -- Wages
    122.0,  -- Amortization
    49.0,   -- Other expenses
    NULL,   -- Matchday (COVID impact)
    279.0,  -- Commercial
    215.0   -- Broadcasting
),
(
    (SELECT id FROM public.clubs WHERE name = 'Manchester United'),
    2022,
    583.0,  -- Revenue (↑18% YoY)
    145.2,  -- EBITDA
    384.0,  -- Wages
    130.0,  -- Amortization
    55.0,   -- Other expenses
    110.0,  -- Matchday
    312.0,  -- Commercial
    161.0   -- Broadcasting
),
(
    (SELECT id FROM public.clubs WHERE name = 'Manchester United'),
    2023,
    648.4,  -- Revenue (↑11.2% YoY)
    158.0,  -- EBITDA
    331.0,  -- Wages
    141.0,  -- Amortization
    60.0,   -- Other expenses
    136.0,  -- Matchday
    353.0,  -- Commercial
    159.4   -- Broadcasting
);

-- Real Madrid Financial Data (2021-2023)
-- Revenue figures in millions (EUR converted to GBP for consistency)
INSERT INTO public.financials (club_id, year, revenue, ebitda, wages, amortization, other_expenses, matchday_revenue, commercial_revenue, broadcasting_revenue) VALUES
(
    (SELECT id FROM public.clubs WHERE name = 'Real Madrid'),
    2021,
    640.7,  -- Revenue
    170.0,  -- EBITDA
    370.0,  -- Wages
    115.0,  -- Amortization
    65.0,   -- Other expenses
    98.0,   -- Matchday
    312.0,  -- Commercial
    230.7   -- Broadcasting
),
(
    (SELECT id FROM public.clubs WHERE name = 'Real Madrid'),
    2022,
    713.8,  -- Revenue (↑11.4% YoY)
    192.0,  -- EBITDA
    411.0,  -- Wages
    118.0,  -- Amortization
    70.0,   -- Other expenses
    124.0,  -- Matchday
    344.0,  -- Commercial
    245.8   -- Broadcasting
),
(
    (SELECT id FROM public.clubs WHERE name = 'Real Madrid'),
    2023,
    831.0,  -- Revenue (↑16.4% YoY)
    225.0,  -- EBITDA
    454.0,  -- Wages
    125.0,  -- Amortization
    75.0,   -- Other expenses
    154.0,  -- Matchday
    403.0,  -- Commercial
    274.0   -- Broadcasting
);

-- FC Barcelona Financial Data (2021-2023)
-- Revenue figures in millions (EUR converted to GBP for consistency)
INSERT INTO public.financials (club_id, year, revenue, ebitda, wages, amortization, other_expenses, matchday_revenue, commercial_revenue, broadcasting_revenue) VALUES
(
    (SELECT id FROM public.clubs WHERE name = 'FC Barcelona'),
    2021,
    631.0,  -- Revenue (COVID impact)
    55.0,   -- EBITDA (low due to debt restructuring)
    560.0,  -- Wages (high wage bill)
    145.0,  -- Amortization
    85.0,   -- Other expenses
    82.0,   -- Matchday
    283.0,  -- Commercial
    266.0   -- Broadcasting
),
(
    (SELECT id FROM public.clubs WHERE name = 'FC Barcelona'),
    2022,
    582.0,  -- Revenue (↓7.8% YoY - financial crisis)
    48.0,   -- EBITDA
    470.0,  -- Wages (reduced)
    138.0,  -- Amortization
    78.0,   -- Other expenses
    98.0,   -- Matchday
    269.0,  -- Commercial
    215.0   -- Broadcasting
),
(
    (SELECT id FROM public.clubs WHERE name = 'FC Barcelona'),
    2023,
    800.0,  -- Revenue (↑37.5% YoY - recovery)
    135.0,  -- EBITDA
    520.0,  -- Wages
    155.0,  -- Amortization
    90.0,   -- Other expenses
    165.0,  -- Matchday
    388.0,  -- Commercial
    247.0   -- Broadcasting
);

-- =====================================
-- INSERT FINANCIAL RATIOS (Optional)
-- =====================================

-- Manchester United Ratios
INSERT INTO public.financial_ratios (club_id, year, wage_to_revenue, wages_amort_to_revenue, ebitda_margin) VALUES
((SELECT id FROM public.clubs WHERE name = 'Manchester United'), 2021, 65.4, 90.1, 24.4),
((SELECT id FROM public.clubs WHERE name = 'Manchester United'), 2022, 65.9, 88.2, 24.9),
((SELECT id FROM public.clubs WHERE name = 'Manchester United'), 2023, 51.0, 72.8, 24.4);

-- Real Madrid Ratios
INSERT INTO public.financial_ratios (club_id, year, wage_to_revenue, wages_amort_to_revenue, ebitda_margin) VALUES
((SELECT id FROM public.clubs WHERE name = 'Real Madrid'), 2021, 57.7, 75.7, 26.5),
((SELECT id FROM public.clubs WHERE name = 'Real Madrid'), 2022, 57.6, 74.1, 26.9),
((SELECT id FROM public.clubs WHERE name = 'Real Madrid'), 2023, 54.6, 69.7, 27.1);

-- FC Barcelona Ratios
INSERT INTO public.financial_ratios (club_id, year, wage_to_revenue, wages_amort_to_revenue, ebitda_margin) VALUES
((SELECT id FROM public.clubs WHERE name = 'FC Barcelona'), 2021, 88.7, 111.7, 8.7),
((SELECT id FROM public.clubs WHERE name = 'FC Barcelona'), 2022, 80.8, 104.5, 8.2),
((SELECT id FROM public.clubs WHERE name = 'FC Barcelona'), 2023, 65.0, 84.4, 16.9);

-- =====================================
-- INSERT VALUATIONS (Optional)
-- =====================================

INSERT INTO public.valuations (club_id, year, valuation, source) VALUES
-- Manchester United Valuations
((SELECT id FROM public.clubs WHERE name = 'Manchester United'), 2021, 4200.0, 'Forbes'),
((SELECT id FROM public.clubs WHERE name = 'Manchester United'), 2022, 4600.0, 'Forbes'),
((SELECT id FROM public.clubs WHERE name = 'Manchester United'), 2023, 4880.0, 'Forbes'),

-- Real Madrid Valuations
((SELECT id FROM public.clubs WHERE name = 'Real Madrid'), 2021, 4750.0, 'Forbes'),
((SELECT id FROM public.clubs WHERE name = 'Real Madrid'), 2022, 5100.0, 'Forbes'),
((SELECT id FROM public.clubs WHERE name = 'Real Madrid'), 2023, 5360.0, 'Forbes'),

-- FC Barcelona Valuations
((SELECT id FROM public.clubs WHERE name = 'FC Barcelona'), 2021, 4760.0, 'Forbes'),
((SELECT id FROM public.clubs WHERE name = 'FC Barcelona'), 2022, 5100.0, 'Forbes'),
((SELECT id FROM public.clubs WHERE name = 'FC Barcelona'), 2023, 5160.0, 'Forbes');

-- =====================================
-- VERIFICATION QUERIES
-- =====================================
-- Uncomment to verify data after migration

-- SELECT c.name, COUNT(f.id) as seasons
-- FROM clubs c
-- LEFT JOIN financials f ON c.id = f.club_id
-- GROUP BY c.id, c.name;

-- SELECT c.name, f.year, f.revenue
-- FROM clubs c
-- JOIN financials f ON c.id = f.club_id
-- ORDER BY c.name, f.year;
