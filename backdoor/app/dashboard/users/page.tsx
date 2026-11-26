import { fetchMonitoredUsers } from "@/lib/api";
import { UsersClient } from "@/components/users-client";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  try {
    const users = await fetchMonitoredUsers();
    return <UsersClient users={users} />;
  } catch (error) {
    console.error("Failed to fetch users data", error);
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <h2 className="text-xl font-semibold mb-2">Error loading users</h2>
        <p className="text-muted-foreground">Ensure the backend API is running and connected to Supabase.</p>
      </div>
    );
  }
}
