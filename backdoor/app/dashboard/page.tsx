import { fetchDashboardOverview } from "@/lib/api";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const data = await fetchDashboardOverview();
    return <DashboardClient data={data} />;
  } catch (error) {
    console.error("Failed to fetch dashboard data", error);
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <h2 className="text-xl font-semibold mb-2">Error loading dashboard</h2>
        <p className="text-muted-foreground">Ensure the backend API is running and connected to Supabase.</p>
      </div>
    );
  }
}
