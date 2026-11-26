import {
  fetchOrganizations,
  fetchAgentActivity,
  fetchNewsMonitoring,
  fetchNotificationsMonitoring,
  fetchDataSourcesMonitoring,
} from "@/lib/api";
import { OperationsClient } from "@/components/operations-client";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  try {
    const [organizations, activity, news, notifications, dataSources] = await Promise.all([
      fetchOrganizations(),
      fetchAgentActivity(),
      fetchNewsMonitoring(),
      fetchNotificationsMonitoring(),
      fetchDataSourcesMonitoring(),
    ]);

    return (
      <OperationsClient
        organizations={organizations}
        activity={activity}
        news={news}
        notifications={notifications}
        dataSources={dataSources}
      />
    );
  } catch (error: any) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        <h2 className="text-xl font-semibold mb-2">Error loading operations telemetry</h2>
        <p className="text-muted-foreground text-sm">
          {error?.message || "Ensure you are signed in as a verified administrator and the backend is running."}
        </p>
      </div>
    );
  }
}
