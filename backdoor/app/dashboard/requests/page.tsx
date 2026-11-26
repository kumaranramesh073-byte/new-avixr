import { fetchRequestLogs } from "@/lib/api";
import { RequestsClient } from "@/components/requests-client";

export const dynamic = 'force-dynamic';

export default async function RequestsPage() {
  try {
    const requests = await fetchRequestLogs();
    return <RequestsClient requests={requests} />;
  } catch (error) {
    console.error("Failed to fetch requests data", error);
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <h2 className="text-xl font-semibold mb-2">Error loading requests</h2>
        <p className="text-muted-foreground">Ensure the backend API is running and connected to Supabase.</p>
      </div>
    );
  }
}
