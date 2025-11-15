import { getAllClubs, getClubFinancialsWithYoY } from "@/lib/data/queries";
import { DashboardClient } from "@/components/platform/dashboard-client";

export default async function DashboardPage() {
  // Fetch clubs on the server (all clubs for dashboard selector)
  const clubs = await getAllClubs();
  
  // Auto-select first club and fetch its financials with YoY pre-calculated
  const initialClubId = clubs.length > 0 ? clubs[0].id : null;
  const initialFinancials = initialClubId 
    ? await getClubFinancialsWithYoY(initialClubId)
    : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Football Finance Dashboard</h1>
        <p className="text-gray-600">
          Explore club financials and revenue trends
        </p>
      </header>

      <DashboardClient
        clubs={clubs}
        initialClubId={initialClubId}
        initialFinancials={initialFinancials}
      />
    </div>
  );
}
