'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkline } from '@/components/ui/sparkline'
import { formatCurrency, formatPercentage, convertCurrency, CurrencyCode, DEFAULT_CURRENCY, getCurrencySymbol } from '@/lib/utils/formatters'
import { calculateCAGRFromMetrics } from '@/lib/utils/financials'
import { convertToCSV, downloadCSV } from '@/lib/utils/csv'
import { FinancialMetric } from '@/types/db'
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react'

type SortField = 'year' | 'revenue' | 'yoy_percentage';
type SortDirection = 'asc' | 'desc';

interface MetricsTableProps {
  data: FinancialMetric[]
  currency?: CurrencyCode
  clubName?: string
}

export function MetricsTable({ data, currency = DEFAULT_CURRENCY, clubName }: MetricsTableProps) {
  const [sortField, setSortField] = useState<SortField>('year');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  if (data.length === 0) {
    return (
      <div className="w-full p-8 text-center border rounded-lg bg-gray-50">
        <p className="text-gray-500">No metrics to display</p>
      </div>
    )
  }

  const convertValue = (value: number | null) => {
    return convertCurrency(value, "GBP", currency);
  };

  // Calculate CAGR for the shown data
  const cagr = calculateCAGRFromMetrics(data);

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      let aValue: number | null;
      let bValue: number | null;

      switch (sortField) {
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'revenue':
          aValue = a.revenue;
          bValue = b.revenue;
          break;
        case 'yoy_percentage':
          aValue = a.yoy_percentage;
          bValue = b.yoy_percentage;
          break;
        default:
          return 0;
      }

      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      const comparison = aValue - bValue;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortField, sortDirection]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to desc
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    const currencySymbol = getCurrencySymbol(currency);
    
    const csvData = sortedData.map((row) => ({
      Season: row.year,
      [`Revenue (${currencySymbol}M)`]: convertValue(row.revenue)?.toFixed(2) ?? 'N/A',
      [`EBITDA (${currencySymbol}M)`]: convertValue(row.ebitda)?.toFixed(2) ?? 'N/A',
      [`YoY Change (${currencySymbol}M)`]: convertValue(row.yoy_change)?.toFixed(2) ?? 'N/A',
      'YoY %': row.yoy_percentage?.toFixed(1) ?? 'N/A',
    }));

    const csv = convertToCSV(csvData);
    const filename = clubName 
      ? `${clubName.replace(/\s+/g, '_')}_financials_${currency}.csv`
      : `financials_${currency}.csv`;
    
    downloadCSV(csv, filename);
  };

  // Get revenue trend data up to each year for sparklines
  const getRevenueTrendUpToYear = (yearIndex: number): number[] => {
    return sortedData
      .slice(0, yearIndex + 1)
      .map(item => convertValue(item.revenue) ?? 0);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Financial Metrics</h2>
        <div className="flex items-center gap-2">
          {cagr !== null && (
            <Badge variant={cagr >= 0 ? "success" : "destructive"}>
              CAGR: {cagr >= 0 ? '+' : ''}{cagr.toFixed(1)}%
            </Badge>
          )}
          <Button 
            onClick={handleDownloadCSV} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer select-none hover:bg-gray-50"
                onClick={() => handleSort('year')}
              >
                <div className="flex items-center">
                  Season
                  <SortIcon field="year" />
                </div>
              </TableHead>
              <TableHead>Trend</TableHead>
              <TableHead 
                className="text-right cursor-pointer select-none hover:bg-gray-50"
                onClick={() => handleSort('revenue')}
              >
                <div className="flex items-center justify-end">
                  Revenue
                  <SortIcon field="revenue" />
                </div>
              </TableHead>
              <TableHead className="text-right">EBITDA</TableHead>
              <TableHead className="text-right">YoY Change</TableHead>
              <TableHead 
                className="text-right cursor-pointer select-none hover:bg-gray-50"
                onClick={() => handleSort('yoy_percentage')}
              >
                <div className="flex items-center justify-end">
                  YoY %
                  <SortIcon field="yoy_percentage" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, index) => (
              <TableRow key={row.year}>
                <TableCell className="font-medium">{row.year}</TableCell>
                <TableCell>
                  <Sparkline 
                    data={getRevenueTrendUpToYear(index)}
                    width={80}
                    height={24}
                    strokeColor={row.yoy_percentage && row.yoy_percentage >= 0 ? '#16a34a' : '#dc2626'}
                  />
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(convertValue(row.revenue), currency)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(convertValue(row.ebitda), currency)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(convertValue(row.yoy_change), currency)}
                </TableCell>
                <TableCell className="text-right">
                  <span className={
                    row.yoy_percentage !== null
                      ? row.yoy_percentage > 0
                        ? 'text-green-600 font-medium'
                        : row.yoy_percentage < 0
                        ? 'text-red-600 font-medium'
                        : ''
                      : ''
                  }>
                    {formatPercentage(row.yoy_percentage)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}