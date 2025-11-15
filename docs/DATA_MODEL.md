# Data Model & YoY Calculation

## Database Schema

### Core Tables

#### **clubs**
Stores football club information and metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key (auto-increment) |
| `name` | text | Club name (unique) |
| `country` | text | Country of the club |
| `league` | text | Primary league |
| `year_founded` | int | Year the club was founded |
| `website` | text | Official website URL |
| `owners` | text | Club ownership information |
| `owner_location` | text | Location of owners |
| `ceo` | text | Chief Executive Officer |
| `chairman` | text | Chairman of the board |
| `company_overview` | text | General club description |
| `profile` | text | Detailed club profile |
| `location` | text | Club headquarters location |
| `created_at` | timestamp | Record creation timestamp |
| `updated_at` | timestamp | Record update timestamp |

#### **financials**
Annual financial data for each club.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `club_id` | bigint | References `clubs.id` |
| `year` | int | Financial year |
| `revenue` | numeric | Total revenue (millions) |
| `revenue_yoy` | numeric | Year-over-year change (stored, not used) |
| `ebitda` | numeric | Earnings before interest, taxes, depreciation, and amortization |
| `wages` | numeric | Player and staff wages |
| `amortization` | numeric | Player contract amortization |
| `other_expenses` | numeric | Other operating expenses |
| `matchday_revenue` | numeric | Revenue from matchday operations |
| `commercial_revenue` | numeric | Sponsorship and commercial income |
| `broadcasting_revenue` | numeric | TV and media rights |
| `created_at` | timestamp | Record creation timestamp |
| `updated_at` | timestamp | Record update timestamp |

**Constraint**: `unique(club_id, year)` - One financial record per club per year

#### **financial_ratios**
Calculated financial metrics and ratios.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `club_id` | bigint | References `clubs.id` |
| `year` | int | Year of calculation |
| `wage_to_revenue` | numeric | Wages as % of revenue |
| `wages_amort_to_revenue` | numeric | (Wages + Amortization) / Revenue |
| `other_expenses_to_revenue` | numeric | Other expenses as % of revenue |
| `ebitda_margin` | numeric | EBITDA as % of revenue |
| `created_at` | timestamp | Record creation timestamp |
| `updated_at` | timestamp | Record update timestamp |

**Constraint**: `unique(club_id, year)` - One ratio record per club per year

#### **valuations**
Club valuation estimates from various sources.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `club_id` | bigint | References `clubs.id` |
| `year` | int | Valuation year |
| `valuation` | numeric | Estimated club value (millions) |
| `source` | text | Source of valuation (e.g., Forbes, Deloitte) |
| `created_at` | timestamp | Record creation timestamp |

**Constraint**: `unique(club_id, year)` - One valuation per club per year

#### **media_assets**
Images, logos, and other media for clubs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `club_id` | bigint | References `clubs.id` |
| `asset_type` | text | Type (logo, stadium, badge, etc.) |
| `url` | text | Asset URL |
| `alt_text` | text | Accessibility description |
| `created_at` | timestamp | Record creation timestamp |

### Entity Relationships

```
clubs (1) ──── (many) financials
      (1) ──── (many) financial_ratios
      (1) ──── (many) valuations
      (1) ──── (many) media_assets
```

All foreign keys use `ON DELETE CASCADE` to maintain referential integrity.

### Indexes

Performance indexes are created on:
- `financials.club_id` - Fast lookups by club
- `financials.year` - Fast lookups by year
- `financial_ratios.club_id` - Fast ratio queries
- `valuations.club_id` - Fast valuation queries
- `media_assets.club_id` - Fast media queries

---

## Year-over-Year (YoY) Calculation

### Overview

YoY calculations are performed **server-side** to ensure:
- Consistent calculations across the application
- Reduced client-side bundle size
- Cacheable results
- Single source of truth

### Implementation

**Location**: `/lib/utils/financials.ts`

#### Algorithm

```typescript
export function calculateYoY(financials: Financial[]): FinancialMetric[] {
  // 1. Sort by year ascending to ensure chronological order
  const sorted = [...financials].sort((a, b) => a.year - b.year);

  // 2. Calculate for each year
  return sorted.map((current, index) => {
    const revenue = toNumber(current.revenue);
    const ebitda = toNumber(current.ebitda);
    const wages = toNumber(current.wages);

    // First year has no previous year for comparison
    if (index === 0) {
      return {
        id: current.id,
        club_id: current.clubId,
        year: current.year,
        revenue,
        ebitda,
        wages,
        yoy_change: null,      // No prior year
        yoy_percentage: null,  // No prior year
      };
    }

    // Calculate YoY for subsequent years
    const previous = sorted[index - 1];
    const previousRevenue = toNumber(previous.revenue);
    
    // Absolute change
    const change = revenue - previousRevenue;
    
    // Percentage change: (new - old) / old * 100
    const percentage = previousRevenue !== 0 
      ? (change / previousRevenue) * 100 
      : null;

    return {
      id: current.id,
      club_id: current.clubId,
      year: current.year,
      revenue,
      ebitda,
      wages,
      yoy_change: change,        // Absolute change in millions
      yoy_percentage: percentage, // Percentage change
    };
  });
}
```

### Formula

**Absolute Change**:
```
YoY Change = Current Year Revenue - Previous Year Revenue
```

**Percentage Change**:
```
YoY % = (Current Year Revenue - Previous Year Revenue) / Previous Year Revenue × 100
```

### Example Calculation

Given data:
- Year 2021: £400M
- Year 2022: £500M
- Year 2023: £450M

**Year 2021**:
- YoY Change: `null` (no prior year)
- YoY %: `null`

**Year 2022**:
- YoY Change: `£500M - £400M = £100M`
- YoY %: `(100 / 400) × 100 = 25.0%`

**Year 2023**:
- YoY Change: `£450M - £500M = -£50M`
- YoY %: `(-50 / 500) × 100 = -10.0%`

### Data Flow

```
1. Database Query (Drizzle ORM)
   ↓
2. getAllClubFinancials(clubId) → Financial[]
   ↓
3. getClubFinancialsWithYoY(clubId) → calls calculateYoY()
   ↓
4. Server Component / Server Action → FinancialMetric[]
   ↓
5. Client Component (React) → Display
```

### Type Definitions

```typescript
// Raw database type
type Financial = {
  id: number;
  clubId: number;
  year: number;
  revenue: string | null;  // Stored as numeric/string
  ebitda: string | null;
  wages: string | null;
  // ... other fields
};

// Computed type with YoY
type FinancialMetric = {
  id: number;
  club_id: number;
  year: number;
  revenue: number;          // Converted to number
  ebitda: number;
  wages: number | null;
  yoy_change: number | null;     // Calculated
  yoy_percentage: number | null; // Calculated
};
```

### Edge Cases Handled

1. **No Previous Year**: First year in dataset returns `null` for YoY values
2. **Zero Revenue**: If previous revenue is 0, percentage returns `null` to avoid division by zero
3. **Missing Data**: `toNumber()` helper converts null to 0
4. **Unsorted Data**: Always sorts by year before calculation
5. **Currency Consistency**: All values assumed to be in same currency (GBP by default)

### Usage in Code

**Server Component**:
```typescript
// app/page.tsx
const financials = await getClubFinancialsWithYoY(clubId);
// Returns FinancialMetric[] with YoY pre-calculated
```

**Server Action**:
```typescript
// app/actions/financials.ts
export async function getClubFinancialsAction(clubId: number) {
  return await getClubFinancialsWithYoY(clubId);
}
```

**Client Component**:
```typescript
// components/platform/dashboard-client.tsx
const [financials, setFinancials] = useState<FinancialMetric[]>(initialFinancials);
// No client-side calculation needed
```

---

## Additional Calculations

### CAGR (Compound Annual Growth Rate)

Available but not currently displayed in UI:

```typescript
export function calculateCAGR(financials: Financial[]): number | null {
  if (financials.length < 2) return null;

  const sorted = [...financials].sort((a, b) => a.year - b.year);
  const firstRevenue = toNumber(sorted[0].revenue);
  const lastRevenue = toNumber(sorted[sorted.length - 1].revenue);

  if (firstRevenue <= 0 || lastRevenue <= 0) return null;

  const years = sorted[sorted.length - 1].year - sorted[0].year;
  if (years <= 0) return null;

  // CAGR = (Ending Value / Beginning Value)^(1/years) - 1
  const cagr = (Math.pow(lastRevenue / firstRevenue, 1 / years) - 1) * 100;

  return cagr;
}
```

### Future Enhancements

Potential additional metrics:
- Revenue CAGR display
- Multi-year trend analysis
- Benchmark comparisons between clubs
- Currency conversion support
- Inflation-adjusted values
