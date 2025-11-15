"use client";

import { useState } from "react";
import { FinancialMetric, Club } from "@/types/db";
import { ClubSelector } from "@/components/platform/club-selector";
import { RevenueChart } from "@/components/platform/revenue-chart";
import { MetricsTable } from "@/components/platform/metrics-table";
import { AskBox } from "@/components/platform/ask-box";
import { getClubFinancialsAction } from "@/app/actions/financials";
import { Button } from "@/components/ui/button";
import { CurrencyCode, getCurrencyDisplayName } from "@/lib/utils/formatters";

type DashboardClientProps = {
  clubs: Club[];
  initialClubId: number | null;
  initialFinancials: FinancialMetric[];
};

export function DashboardClient({
  clubs,
  initialClubId,
  initialFinancials,
}: DashboardClientProps) {
  const [selectedClubId, setSelectedClubId] = useState<number | null>(
    initialClubId
  );
  const [financials, setFinancials] = useState<FinancialMetric[]>(
    initialFinancials
  );
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>("GBP");
  
  // Comparison mode state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedClubId2, setSelectedClubId2] = useState<number | null>(null);
  const [financials2, setFinancials2] = useState<FinancialMetric[]>([]);
  const [loadingFinancials2, setLoadingFinancials2] = useState(false);

  const selectedClub = clubs.find((c) => c.id === selectedClubId);
  const selectedClub2 = clubs.find((c) => c.id === selectedClubId2);

  const handleClubChange = async (id: string) => {
    const newClubId = parseInt(id);
    setSelectedClubId(newClubId);
    setLoadingFinancials(true);

    try {
      const data = await getClubFinancialsAction(newClubId);
      setFinancials(data);
    } catch (error) {
      console.error("Failed to load financials:", error);
      setFinancials([]);
    } finally {
      setLoadingFinancials(false);
    }
  };

  const handleClubChange2 = async (id: string) => {
    const newClubId = parseInt(id);
    setSelectedClubId2(newClubId);
    setLoadingFinancials2(true);

    try {
      const data = await getClubFinancialsAction(newClubId);
      setFinancials2(data);
    } catch (error) {
      console.error("Failed to load financials for second club:", error);
      setFinancials2([]);
    } finally {
      setLoadingFinancials2(false);
    }
  };

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === "GBP" ? "EUR" : "GBP"));
  };

  const toggleComparisonMode = () => {
    setComparisonMode((prev) => !prev);
    if (comparisonMode) {
      // Turning off comparison mode, clear second club
      setSelectedClubId2(null);
      setFinancials2([]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Club Selector and Currency Toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <ClubSelector
            clubs={clubs}
            selectedClubId={selectedClubId}
            onClubChange={handleClubChange}
          />
          {comparisonMode && (
            <ClubSelector
              clubs={clubs.filter((c) => c.id !== selectedClubId)}
              selectedClubId={selectedClubId2}
              onClubChange={handleClubChange2}
              placeholder="Select second club..."
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleComparisonMode}
            variant={comparisonMode ? "default" : "outline"}
            size="sm"
          >
            {comparisonMode ? "Exit Comparison" : "Compare Teams"}
          </Button>
          <span className="text-sm text-gray-600">Currency:</span>
          <Button
            onClick={toggleCurrency}
            variant="outline"
            size="sm"
            className="min-w-20"
          >
            {getCurrencyDisplayName(currency)}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {(loadingFinancials || loadingFinancials2) && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Chart and Table */}
      {!loadingFinancials && selectedClub && (
        <>
          <RevenueChart 
            data={financials} 
            clubName={selectedClub.name} 
            currency={currency}
            comparisonData={comparisonMode && selectedClub2 ? financials2 : undefined}
            comparisonClubName={comparisonMode && selectedClub2 ? selectedClub2.name : undefined}
          />
          <MetricsTable 
            data={financials} 
            currency={currency}
            clubName={selectedClub.name}
          />
          {comparisonMode && selectedClub2 && financials2.length > 0 && (
            <MetricsTable 
              data={financials2} 
              currency={currency}
              clubName={selectedClub2.name}
            />
          )}
        </>
      )}

      {/* Empty State */}
      {!loadingFinancials && !selectedClubId && clubs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No clubs found. Please add some data to get started.
          </p>
        </div>
      )}

      {/* Ask Box */}
      <AskBox currency={currency} />
    </div>
  );
}
