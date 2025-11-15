import { getClubFinancials } from '@/lib/data/queries'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get('clubId')

    // validation check for clubId
    if (!clubId || isNaN(Number(clubId))) {
      return NextResponse.json(
        { error: 'clubId is required and must be a number' },
        { status: 400 }
      )
    }

    const financials = await getClubFinancials(Number(clubId))
    return NextResponse.json(financials)
  } catch (error) {
    console.error('Failed to fetch financials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financials' },
      { status: 500 }
    )
  }
}