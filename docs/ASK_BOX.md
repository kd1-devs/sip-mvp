# "Ask" Box Implementation

## Overview

The "Ask" box feature allows users to query club financial data using natural language questions. The implementation uses **pattern matching and direct database queries** (no LLM) to provide fast, accurate responses.

## Design Choice: DB-First Approach

### Why No LLM?

1. **Speed**: Direct database queries are faster than LLM API calls
2. **Reliability**: Deterministic results, no hallucinations
3. **Cost**: No API costs for LLM services
4. **Security**: No risk of SQL injection or arbitrary query execution
5. **Type Safety**: Full TypeScript coverage with Drizzle ORM

### When to Use LLM?

Consider adding LLM integration if:
- Need to handle complex, multi-part questions
- Want to provide conversational follow-ups
- Need to interpret ambiguous or varied phrasing
- Want natural language explanations beyond data

**Note**: If adding LLM, always pass structured data to the LLM, never let it execute SQL directly.

---

## Implementation

### API Route

**Location**: `/app/api/ask/route.ts`

**Method**: `POST`

**Request Body**:
```json
{
  "question": "What was Manchester United's revenue in 2022?"
}
```

**Response**:
```json
{
  "answer": "Manchester United's revenue in 2022 was £583,000M (GBP). The year-over-year change was +18.0%."
}
```

### Pattern Matching

The system extracts two key pieces of information:

#### 1. Year Extraction

```typescript
const yearMatch = question.match(/\b(20\d{2})\b/);
const year = yearMatch ? parseInt(yearMatch[1]) : null;
```

**Matches**:
- 2021, 2022, 2023, etc.
- Must be 4-digit year starting with "20"

#### 2. Club Name Extraction

```typescript
const clubPatterns = [
  /what was ([^']+)'s revenue/i,
  /tell me about ([^']+)'s revenue/i,
  /([^']+) revenue/i,
];

let clubName: string | null = null;
for (const pattern of clubPatterns) {
  const match = question.match(pattern);
  if (match && match[1]) {
    clubName = match[1].trim();
    break;
  }
}
```

**Supported Patterns**:
- "What was [Club Name]'s revenue in [Year]?"
- "Tell me about [Club Name]'s revenue in [Year]"
- "[Club Name] revenue [Year]"

### Database Queries

All queries use Drizzle ORM for type safety:

```typescript
// 1. Find club by name (case-insensitive)
const club = await getClubByName(clubName);

// 2. Get financial data for specific year
const financial = await getClubFinancialByYear(club.id, year);

// 3. Get all financials with YoY pre-calculated
const withYoY = await getClubFinancialsWithYoY(club.id);

// 4. Find data for requested year
const currentYearData = withYoY.find((f) => f.year === year);
```

### Response Formatting

```typescript
const revenueFormatted = `£${currentYearData.revenue.toLocaleString()}M`;

const yoyText = currentYearData.yoy_percentage !== null
  ? `${currentYearData.yoy_percentage > 0 ? '+' : ''}${currentYearData.yoy_percentage.toFixed(1)}%`
  : 'N/A (no prior year data)';

const answer = `${club.name}'s revenue in ${year} was ${revenueFormatted} (GBP). The year-over-year change was ${yoyText}.`;
```

---

## Supported Query Examples

### ✅ Supported Questions

```
What was Manchester United's revenue in 2022?
```
**Response**: "Manchester United's revenue in 2022 was £583,000M (GBP). The year-over-year change was +18.0%."

```
What was Real Madrid's revenue in 2023?
```
**Response**: "Real Madrid's revenue in 2023 was £831,000M (GBP). The year-over-year change was +16.4%."

```
Tell me about Barcelona's revenue in 2021
```
**Response**: "FC Barcelona's revenue in 2021 was £631,000M (GBP). The year-over-year change was N/A (no prior year data)."

### ❌ Unsupported Questions

These will return error messages:

```
What was the average revenue in 2022?
```
**Error**: "Could not identify the club name."

```
How much did Manchester United make?
```
**Error**: "Could not find a year in your question."

```
Compare Manchester United and Real Madrid
```
**Error**: "Could not find a year in your question."

---

## Error Handling

### Client-Side Errors

```typescript
// Invalid/empty question
if (!question.trim()) return;

// Network errors
catch (err) {
  setError(err instanceof Error ? err.message : "An error occurred");
}
```

### Server-Side Errors

```typescript
// 400 - Bad Request
if (!question || typeof question !== 'string') {
  return NextResponse.json({ error: 'Invalid question' }, { status: 400 });
}

if (!year) {
  return NextResponse.json(
    { error: 'Could not find a year in your question. Please include a year like 2022.' },
    { status: 400 }
  );
}

if (!clubName) {
  return NextResponse.json(
    { error: 'Could not identify the club name. Please mention the club clearly.' },
    { status: 400 }
  );
}

// 404 - Not Found
if (!club) {
  return NextResponse.json(
    { error: `Could not find club "${clubName}" in the database.` },
    { status: 404 }
  );
}

if (!financial) {
  return NextResponse.json(
    { error: `No financial data found for ${club.name} in ${year}.` },
    { status: 404 }
  );
}

// 500 - Internal Server Error
catch (error) {
  console.error('Ask API error:', error);
  return NextResponse.json(
    { error: 'An error occurred processing your question.' },
    { status: 500 }
  );
}
```

---

## UI Component

**Location**: `/components/platform/ask-box.tsx`

### Features

1. **Input Field**: Text input for questions
2. **Submit Button**: Click or press Enter to submit
3. **Loading State**: Shows spinner while processing
4. **Success State**: Displays answer in blue card
5. **Error State**: Displays error message in red card
6. **Disabled States**: Prevents submission while loading or if input is empty

### User Experience

```tsx
<Input
  value={question}
  onChange={(e) => setQuestion(e.target.value)}
  onKeyPress={handleKeyPress}  // Enter key support
  placeholder="Ask a question about club finances..."
  disabled={loading}
/>

<Button onClick={handleAsk} disabled={loading || !question.trim()}>
  {loading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Asking...
    </>
  ) : (
    "Ask"
  )}
</Button>
```

---

## Extension Ideas

### Enhanced Pattern Matching

Add support for more question formats:

```typescript
const patterns = [
  /what was ([^']+)'s revenue in (\d{4})/i,
  /how much revenue did ([^']+) make in (\d{4})/i,
  /([^']+) revenue for (\d{4})/i,
  /show me ([^']+) (\d{4}) revenue/i,
];
```

### Multiple Metrics

Support queries beyond revenue:

```typescript
const metricPatterns = {
  revenue: /revenue/i,
  ebitda: /ebitda|earnings/i,
  wages: /wages|payroll|salary/i,
  valuation: /valuation|worth|value/i,
};
```

### Fuzzy Matching

Handle club name variations:

```typescript
import Fuse from 'fuse.js';

const fuse = new Fuse(allClubs, {
  keys: ['name'],
  threshold: 0.3,
});

const matches = fuse.search(clubName);
```

### Historical Range Queries

Support questions like "Manchester United's revenue from 2020 to 2023":

```typescript
const rangeMatch = question.match(/from (\d{4}) to (\d{4})/i);
if (rangeMatch) {
  const startYear = parseInt(rangeMatch[1]);
  const endYear = parseInt(rangeMatch[2]);
  // Query range...
}
```

### LLM Enhancement (Optional)

If adding LLM, use this pattern:

```typescript
// 1. Query database first
const financialData = await getClubFinancialsWithYoY(club.id);

// 2. Create structured context
const context = {
  club: club.name,
  year: year,
  revenue: currentYearData.revenue,
  yoy_percentage: currentYearData.yoy_percentage,
  currency: 'GBP',
};

// 3. Send to LLM with strict instructions
const prompt = `
Given this financial data: ${JSON.stringify(context)}

Answer the user's question: "${question}"

Rules:
- Only use the provided data
- Include the revenue, currency, and YoY percentage
- Keep response concise (1-2 sentences)
`;

const llmResponse = await callLLM(prompt);
```

---

## Testing

### Manual Test Cases

1. **Valid Query**: "What was Manchester United's revenue in 2022?"
   - Expected: Success with formatted answer

2. **Missing Year**: "What was Manchester United's revenue?"
   - Expected: Error asking for year

3. **Missing Club**: "What was revenue in 2022?"
   - Expected: Error asking for club name

4. **Unknown Club**: "What was Fake FC's revenue in 2022?"
   - Expected: 404 error

5. **Data Not Found**: "What was Manchester United's revenue in 1900?"
   - Expected: 404 error for that year

6. **First Year**: "What was Barcelona's revenue in 2021?"
   - Expected: Success with "N/A (no prior year data)"

### Automated Testing

```typescript
// Example test
describe('Ask API', () => {
  it('should return revenue and YoY for valid query', async () => {
    const response = await fetch('/api/ask', {
      method: 'POST',
      body: JSON.stringify({
        question: "What was Manchester United's revenue in 2022?"
      }),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.answer).toContain('Manchester United');
    expect(data.answer).toContain('2022');
    expect(data.answer).toContain('£');
    expect(data.answer).toContain('%');
  });
});
```

---

## Performance Considerations

1. **Database Queries**: Uses indexes on `club_id` and `year`
2. **Caching**: Consider adding caching for frequently asked questions
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Input Validation**: Sanitize input to prevent injection attempts

## Security

✅ **Current Protections**:
- No arbitrary SQL execution
- Type-safe Drizzle queries
- Input validation
- Error message sanitization

⚠️ **Production Recommendations**:
- Add rate limiting (e.g., 10 requests per minute)
- Implement CAPTCHA for public deployments
- Log queries for monitoring
- Add request authentication
