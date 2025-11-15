'use client'

import { FinancialMetric } from '@/types/db'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { convertCurrency, getCurrencySymbol, CurrencyCode, DEFAULT_CURRENCY } from '@/lib/utils/formatters'
import { calculateCAGRFromMetrics } from '@/lib/utils/financials'
import { Badge } from '@/components/ui/badge'

interface RevenueChartProps {
  data: FinancialMetric[]
  clubName: string
  currency?: CurrencyCode
  comparisonData?: FinancialMetric[]
  comparisonClubName?: string
}

export function RevenueChart({ 
  data, 
  clubName, 
  currency = DEFAULT_CURRENCY,
  comparisonData,
  comparisonClubName
}: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center border rounded-lg bg-gray-50">
        <p className="text-gray-500">No financial data available</p>
      </div>
    )
  }

  const currencySymbol = getCurrencySymbol(currency);
  const cagr = calculateCAGRFromMetrics(data);
  const comparisonCagr = comparisonData ? calculateCAGRFromMetrics(comparisonData) : null;

  // For comparison mode, merge data from both clubs by year
  const isComparisonMode = comparisonData && comparisonData.length > 0;
  
  let chartData;
  if (isComparisonMode) {
    // Get all unique years from both datasets
    const allYears = new Set([
      ...data.map(d => d.year),
      ...comparisonData.map(d => d.year)
    ]);
    
    chartData = Array.from(allYears).sort().map(year => {
      const item1 = data.find(d => d.year === year);
      const item2 = comparisonData.find(d => d.year === year);
      
      return {
        year: year.toString(),
        [clubName]: item1 ? convertCurrency(item1.revenue, "GBP", currency) : null,
        [comparisonClubName!]: item2 ? convertCurrency(item2.revenue, "GBP", currency) : null,
      };
    });
  } else {
    chartData = data.map((item) => ({
      year: item.year.toString(),
      revenue: convertCurrency(item.revenue, "GBP", currency),
    }));
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {isComparisonMode 
            ? `Revenue Comparison - ${clubName} vs ${comparisonClubName}`
            : `Revenue Over Time - ${clubName}`
          }
        </h2>
        <div className="flex gap-2">
          {cagr !== null && (
            <Badge variant={cagr >= 0 ? "info" : "warning"}>
              {clubName} CAGR: {cagr >= 0 ? '+' : ''}{cagr.toFixed(1)}%
            </Badge>
          )}
          {comparisonCagr !== null && (
            <Badge variant={comparisonCagr >= 0 ? "success" : "destructive"}>
              {comparisonClubName} CAGR: {comparisonCagr >= 0 ? '+' : ''}{comparisonCagr.toFixed(1)}%
            </Badge>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Season', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ value: `Revenue (${currencySymbol}M)`, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: any) => [
              value !== null && value !== undefined ? `${currencySymbol}${Number(value).toLocaleString()}M` : 'N/A',
              'Revenue'
            ]}
          />
          <Legend />
          {isComparisonMode ? (
            <>
              <Line 
                type="monotone" 
                dataKey={clubName}
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={clubName}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey={comparisonClubName!}
                stroke="#dc2626" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={comparisonClubName}
                connectNulls
              />
            </>
          ) : (
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Revenue"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}