import type { Club, Financial, FinancialRatio, MediaAsset, Valuation } from '@/lib/db/schema'

// Re-export Drizzle types
export type { Club, Financial, FinancialRatio, MediaAsset, Valuation }

// Extended types for computed fields
export type FinancialMetric = {
  id: number
  club_id: number
  year: number
  revenue: number
  ebitda: number
  wages: number | null
  yoy_change: number | null
  yoy_percentage: number | null
}

export type ClubWithFinancials = Club & {
  financials: Financial[]
}

export type ClubWithAllData = Club & {
  financials: Financial[]
  financialRatios: FinancialRatio[]
  mediaAssets: MediaAsset[]
  valuations: Valuation[]
}