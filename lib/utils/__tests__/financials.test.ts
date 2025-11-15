import { describe, it, expect } from "vitest";
import { calculateYoY, calculateCAGR, calculateCAGRFromMetrics } from "../financials";
import { Financial, FinancialMetric } from "@/types/db";

// Helper function to create a Financial object with all required fields
const createFinancial = (
  id: number,
  clubId: number,
  year: number,
  revenue: string,
  ebitda: string = "0",
  wages: string = "0",
  revenueYoy: string | null = null
): Financial => ({
  id,
  clubId,
  year,
  revenue,
  revenueYoy,
  ebitda,
  wages,
  amortization: null,
  otherExpenses: null,
  matchdayRevenue: null,
  commercialRevenue: null,
  broadcastingRevenue: null,
  createdAt: null,
  updatedAt: null,
});

describe("calculateYoY", () => {
  it("should return null YoY values for the first year", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "100000000", "10000000", "50000000"),
    ];

    const result = calculateYoY(financials);

    expect(result).toHaveLength(1);
    expect(result[0].yoy_change).toBeNull();
    expect(result[0].yoy_percentage).toBeNull();
    expect(result[0].revenue).toBe(100000000);
  });

  it("should calculate YoY correctly for multiple years", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "100000000", "10000000", "50000000"),
      createFinancial(2, 1, 2021, "120000000", "12000000", "55000000", "20000000"),
    ];

    const result = calculateYoY(financials);

    expect(result).toHaveLength(2);
    
    // First year
    expect(result[0].year).toBe(2020);
    expect(result[0].yoy_change).toBeNull();
    expect(result[0].yoy_percentage).toBeNull();
    
    // Second year
    expect(result[1].year).toBe(2021);
    expect(result[1].yoy_change).toBe(20000000);
    expect(result[1].yoy_percentage).toBe(20);
  });

  it("should handle zero previous revenue", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "0", "0", "0"),
      createFinancial(2, 1, 2021, "100000000", "10000000", "50000000", "100000000"),
    ];

    const result = calculateYoY(financials);

    expect(result[1].yoy_change).toBe(100000000);
    expect(result[1].yoy_percentage).toBeNull(); // Cannot calculate percentage from zero
  });

  it("should handle negative revenue growth", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "100000000", "10000000", "50000000"),
      createFinancial(2, 1, 2021, "80000000", "8000000", "48000000", "-20000000"),
    ];

    const result = calculateYoY(financials);

    expect(result[1].yoy_change).toBe(-20000000);
    expect(result[1].yoy_percentage).toBe(-20);
  });

  it("should sort years correctly even if input is unordered", () => {
    const financials: Financial[] = [
      createFinancial(2, 1, 2021, "120000000", "12000000", "55000000", "20000000"),
      createFinancial(1, 1, 2020, "100000000", "10000000", "50000000"),
    ];

    const result = calculateYoY(financials);

    expect(result[0].year).toBe(2020);
    expect(result[1].year).toBe(2021);
    expect(result[1].yoy_percentage).toBe(20);
  });

  it("should handle string number formats correctly", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "100,000,000", "10,000,000", "50,000,000"),
      createFinancial(2, 1, 2021, "110,000,000", "11,000,000", "52,000,000", "10,000,000"),
    ];

    const result = calculateYoY(financials);

    expect(result[1].yoy_change).toBe(10000000);
    expect(result[1].yoy_percentage).toBe(10);
  });
});

describe("calculateCAGR", () => {
  it("should return null for single data point", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "100000000", "10000000", "50000000"),
    ];

    const result = calculateCAGR(financials);
    expect(result).toBeNull();
  });

  it("should return null for empty array", () => {
    const financials: Financial[] = [];
    const result = calculateCAGR(financials);
    expect(result).toBeNull();
  });

  it("should calculate CAGR correctly for 2 years", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "100000000", "10000000", "50000000"),
      createFinancial(2, 1, 2021, "121000000", "12000000", "55000000", "21000000"),
    ];

    const result = calculateCAGR(financials);
    expect(result).toBeCloseTo(21, 1); // 21% growth
  });

  it("should calculate CAGR correctly for multiple years", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "100000000", "10000000", "50000000"),
      createFinancial(2, 1, 2021, "110000000", "11000000", "52000000", "10000000"),
      createFinancial(3, 1, 2022, "121000000", "12000000", "54000000", "11000000"),
    ];

    const result = calculateCAGR(financials);
    expect(result).toBeCloseTo(10, 1); // ~10% CAGR over 2 years
  });

  it("should return null when first revenue is zero", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "0", "0", "0"),
      createFinancial(2, 1, 2021, "100000000", "10000000", "50000000", "100000000"),
    ];

    const result = calculateCAGR(financials);
    expect(result).toBeNull();
  });

  it("should return null when last revenue is zero", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "100000000", "10000000", "50000000"),
      createFinancial(2, 1, 2021, "0", "0", "0", "-100000000"),
    ];

    const result = calculateCAGR(financials);
    expect(result).toBeNull();
  });

  it("should return null when first revenue is negative", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "-100000000", "-10000000", "50000000"),
      createFinancial(2, 1, 2021, "100000000", "10000000", "50000000", "200000000"),
    ];

    const result = calculateCAGR(financials);
    expect(result).toBeNull();
  });

  it("should handle negative CAGR (decline)", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "100000000", "10000000", "50000000"),
      createFinancial(2, 1, 2021, "90000000", "9000000", "48000000", "-10000000"),
      createFinancial(3, 1, 2022, "81000000", "8000000", "46000000", "-9000000"),
    ];

    const result = calculateCAGR(financials);
    expect(result).toBeLessThan(0);
    expect(result).toBeCloseTo(-10, 1); // ~-10% CAGR
  });

  it("should sort years correctly even if input is unordered", () => {
    const financials: Financial[] = [
      createFinancial(3, 1, 2022, "121000000", "12000000", "54000000", "11000000"),
      createFinancial(1, 1, 2020, "100000000", "10000000", "50000000"),
      createFinancial(2, 1, 2021, "110000000", "11000000", "52000000", "10000000"),
    ];

    const result = calculateCAGR(financials);
    expect(result).toBeCloseTo(10, 1);
  });

  it("should return null when years are the same", () => {
    const financials: Financial[] = [
      createFinancial(1, 1, 2020, "100000000", "10000000", "50000000"),
      createFinancial(2, 1, 2020, "110000000", "11000000", "52000000", "10000000"),
    ];

    const result = calculateCAGR(financials);
    expect(result).toBeNull();
  });
});

describe("calculateCAGRFromMetrics", () => {
  it("should return null for single data point", () => {
    const metrics: FinancialMetric[] = [
      {
        id: 1,
        club_id: 1,
        year: 2020,
        revenue: 100000000,
        ebitda: 10000000,
        wages: 50000000,
        yoy_change: null,
        yoy_percentage: null,
      },
    ];

    const result = calculateCAGRFromMetrics(metrics);
    expect(result).toBeNull();
  });

  it("should return null for empty array", () => {
    const metrics: FinancialMetric[] = [];
    const result = calculateCAGRFromMetrics(metrics);
    expect(result).toBeNull();
  });

  it("should calculate CAGR correctly for 2 years", () => {
    const metrics: FinancialMetric[] = [
      {
        id: 1,
        club_id: 1,
        year: 2020,
        revenue: 100000000,
        ebitda: 10000000,
        wages: 50000000,
        yoy_change: null,
        yoy_percentage: null,
      },
      {
        id: 2,
        club_id: 1,
        year: 2021,
        revenue: 121000000,
        ebitda: 12000000,
        wages: 55000000,
        yoy_change: 21000000,
        yoy_percentage: 21,
      },
    ];

    const result = calculateCAGRFromMetrics(metrics);
    expect(result).toBeCloseTo(21, 1);
  });

  it("should calculate CAGR correctly for multiple years", () => {
    const metrics: FinancialMetric[] = [
      {
        id: 1,
        club_id: 1,
        year: 2020,
        revenue: 100000000,
        ebitda: 10000000,
        wages: 50000000,
        yoy_change: null,
        yoy_percentage: null,
      },
      {
        id: 2,
        club_id: 1,
        year: 2021,
        revenue: 110000000,
        ebitda: 11000000,
        wages: 52000000,
        yoy_change: 10000000,
        yoy_percentage: 10,
      },
      {
        id: 3,
        club_id: 1,
        year: 2022,
        revenue: 121000000,
        ebitda: 12000000,
        wages: 54000000,
        yoy_change: 11000000,
        yoy_percentage: 10,
      },
    ];

    const result = calculateCAGRFromMetrics(metrics);
    expect(result).toBeCloseTo(10, 1);
  });

  it("should return null when first revenue is zero", () => {
    const metrics: FinancialMetric[] = [
      {
        id: 1,
        club_id: 1,
        year: 2020,
        revenue: 0,
        ebitda: 0,
        wages: 0,
        yoy_change: null,
        yoy_percentage: null,
      },
      {
        id: 2,
        club_id: 1,
        year: 2021,
        revenue: 100000000,
        ebitda: 10000000,
        wages: 50000000,
        yoy_change: 100000000,
        yoy_percentage: null,
      },
    ];

    const result = calculateCAGRFromMetrics(metrics);
    expect(result).toBeNull();
  });

  it("should return null when last revenue is zero", () => {
    const metrics: FinancialMetric[] = [
      {
        id: 1,
        club_id: 1,
        year: 2020,
        revenue: 100000000,
        ebitda: 10000000,
        wages: 50000000,
        yoy_change: null,
        yoy_percentage: null,
      },
      {
        id: 2,
        club_id: 1,
        year: 2021,
        revenue: 0,
        ebitda: 0,
        wages: 0,
        yoy_change: -100000000,
        yoy_percentage: -100,
      },
    ];

    const result = calculateCAGRFromMetrics(metrics);
    expect(result).toBeNull();
  });

  it("should return null when first revenue is negative", () => {
    const metrics: FinancialMetric[] = [
      {
        id: 1,
        club_id: 1,
        year: 2020,
        revenue: -100000000,
        ebitda: -10000000,
        wages: 50000000,
        yoy_change: null,
        yoy_percentage: null,
      },
      {
        id: 2,
        club_id: 1,
        year: 2021,
        revenue: 100000000,
        ebitda: 10000000,
        wages: 50000000,
        yoy_change: 200000000,
        yoy_percentage: null,
      },
    ];

    const result = calculateCAGRFromMetrics(metrics);
    expect(result).toBeNull();
  });

  it("should handle negative CAGR (decline)", () => {
    const metrics: FinancialMetric[] = [
      {
        id: 1,
        club_id: 1,
        year: 2020,
        revenue: 100000000,
        ebitda: 10000000,
        wages: 50000000,
        yoy_change: null,
        yoy_percentage: null,
      },
      {
        id: 2,
        club_id: 1,
        year: 2021,
        revenue: 90000000,
        ebitda: 9000000,
        wages: 48000000,
        yoy_change: -10000000,
        yoy_percentage: -10,
      },
      {
        id: 3,
        club_id: 1,
        year: 2022,
        revenue: 81000000,
        ebitda: 8000000,
        wages: 46000000,
        yoy_change: -9000000,
        yoy_percentage: -10,
      },
    ];

    const result = calculateCAGRFromMetrics(metrics);
    expect(result).toBeLessThan(0);
    expect(result).toBeCloseTo(-10, 1);
  });

  it("should sort years correctly even if input is unordered", () => {
    const metrics: FinancialMetric[] = [
      {
        id: 3,
        club_id: 1,
        year: 2022,
        revenue: 121000000,
        ebitda: 12000000,
        wages: 54000000,
        yoy_change: 11000000,
        yoy_percentage: 10,
      },
      {
        id: 1,
        club_id: 1,
        year: 2020,
        revenue: 100000000,
        ebitda: 10000000,
        wages: 50000000,
        yoy_change: null,
        yoy_percentage: null,
      },
      {
        id: 2,
        club_id: 1,
        year: 2021,
        revenue: 110000000,
        ebitda: 11000000,
        wages: 52000000,
        yoy_change: 10000000,
        yoy_percentage: 10,
      },
    ];

    const result = calculateCAGRFromMetrics(metrics);
    expect(result).toBeCloseTo(10, 1);
  });

  it("should return null when years are the same", () => {
    const metrics: FinancialMetric[] = [
      {
        id: 1,
        club_id: 1,
        year: 2020,
        revenue: 100000000,
        ebitda: 10000000,
        wages: 50000000,
        yoy_change: null,
        yoy_percentage: null,
      },
      {
        id: 2,
        club_id: 1,
        year: 2020,
        revenue: 110000000,
        ebitda: 11000000,
        wages: 52000000,
        yoy_change: 10000000,
        yoy_percentage: 10,
      },
    ];

    const result = calculateCAGRFromMetrics(metrics);
    expect(result).toBeNull();
  });
});
