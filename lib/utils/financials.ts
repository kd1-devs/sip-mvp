import { Financial, FinancialMetric } from "@/types/db";
import { toNumber } from "./formatters";

export function calculateYoY(financials: Financial[]): FinancialMetric[] {
  // Sort by year ascending
  const sorted = [...financials].sort((a, b) => a.year - b.year);

  return sorted.map((current, index) => {
    const revenue = toNumber(current.revenue);
    const ebitda = toNumber(current.ebitda);
    const wages = toNumber(current.wages);

    if (index === 0) {
      // First year has no previous year
      return {
        id: current.id,
        club_id: current.clubId,
        year: current.year,
        revenue,
        ebitda,
        wages,
        yoy_change: null,
        yoy_percentage: null,
      };
    }

    const previous = sorted[index - 1];
    const previousRevenue = toNumber(previous.revenue);
    const change = revenue - previousRevenue;
    const percentage =
      previousRevenue !== 0 ? (change / previousRevenue) * 100 : null;

    return {
      id: current.id,
      club_id: current.clubId,
      year: current.year,
      revenue,
      ebitda,
      wages,
      yoy_change: change,
      yoy_percentage: percentage,
    };
  });
}

export function calculateCAGR(financials: Financial[]): number | null {
  if (financials.length < 2) return null;

  const sorted = [...financials].sort((a, b) => a.year - b.year);
  const firstRevenue = toNumber(sorted[0].revenue);
  const lastRevenue = toNumber(sorted[sorted.length - 1].revenue);

  if (firstRevenue <= 0 || lastRevenue <= 0) return null;

  const years = sorted[sorted.length - 1].year - sorted[0].year;
  if (years <= 0) return null;

  const cagr = (Math.pow(lastRevenue / firstRevenue, 1 / years) - 1) * 100;

  return cagr;
}

// Calculate CAGR from FinancialMetric array
export function calculateCAGRFromMetrics(metrics: FinancialMetric[]): number | null {
  if (metrics.length < 2) return null;

  const sorted = [...metrics].sort((a, b) => a.year - b.year);
  const firstRevenue = sorted[0].revenue;
  const lastRevenue = sorted[sorted.length - 1].revenue;

  if (firstRevenue <= 0 || lastRevenue <= 0) return null;

  const years = sorted[sorted.length - 1].year - sorted[0].year;
  if (years <= 0) return null;

  const cagr = (Math.pow(lastRevenue / firstRevenue, 1 / years) - 1) * 100;

  return cagr;
}
