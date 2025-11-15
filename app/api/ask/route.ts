import { NextResponse } from 'next/server'
import { getClubByName, getClubFinancialByYear, getClubFinancialsWithYoY } from '@/lib/data/queries'
import { convertCurrency, getCurrencySymbol, CurrencyCode, DEFAULT_CURRENCY } from '@/lib/utils/formatters'

export async function POST(request: Request) {
  try {
    const { question, currency = DEFAULT_CURRENCY } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Invalid question' },
        { status: 400 }
      )
    }

    // Simple parsing: extract club name and year
    // Pattern: "What was [Club Name]'s revenue in [YEAR]"
    const yearMatch = question.match(/\b(20\d{2})\b/)
    const year = yearMatch ? parseInt(yearMatch[1]) : null

    if (!year) {
      return NextResponse.json(
        { error: 'Could not find a year in your question. Please include a year like 2022.' },
        { status: 400 }
      )
    }

    // Extract club name - look for common patterns
    const clubPatterns = [
      /what was ([^']+)'s revenue/i,
      /tell me about ([^']+)'s revenue/i,
      /([^']+) revenue/i,
    ]

    let clubName: string | null = null
    for (const pattern of clubPatterns) {
      const match = question.match(pattern)
      if (match && match[1]) {
        clubName = match[1].trim()
        break
      }
    }

    if (!clubName) {
      return NextResponse.json(
        { error: 'Could not identify the club name. Please mention the club clearly.' },
        { status: 400 }
      )
    }

    // Find club in database
    const club = await getClubByName(clubName)
    if (!club) {
      return NextResponse.json(
        { error: `Could not find club "${clubName}" in the database.` },
        { status: 404 }
      )
    }

    // Get financial data for the year
    const financial = await getClubFinancialByYear(club.id, year)
    if (!financial) {
      return NextResponse.json(
        { error: `No financial data found for ${club.name} in ${year}.` },
        { status: 404 }
      )
    }

    // Get all financials with YoY pre-calculated
    const withYoY = await getClubFinancialsWithYoY(club.id)
    const currentYearData = withYoY.find((f) => f.year === year)

    if (!currentYearData) {
      return NextResponse.json(
        { error: 'Could not calculate YoY change.' },
        { status: 500 }
      )
    }

    // Convert to requested currency
    const convertedRevenue = convertCurrency(currentYearData.revenue, "GBP", currency as CurrencyCode);
    const currencySymbol = getCurrencySymbol(currency as CurrencyCode);
    
    // Format the answer
    const revenueFormatted = `${currencySymbol}${convertedRevenue?.toLocaleString() ?? 'N/A'}M`
    const yoyText = currentYearData.yoy_percentage !== null
      ? `${currentYearData.yoy_percentage > 0 ? '+' : ''}${currentYearData.yoy_percentage.toFixed(1)}%`
      : 'N/A (no prior year data)'

    const answer = `${club.name}'s revenue in ${year} was ${revenueFormatted} (${currency}). The year-over-year change was ${yoyText}.`

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('Ask API error:', error)
    return NextResponse.json(
      { error: 'An error occurred processing your question.' },
      { status: 500 }
    )
  }
}