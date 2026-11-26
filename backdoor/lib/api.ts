import { cookies } from "next/headers";

export const LOCAL_DEV_URL = "http://localhost:3100";
export const PROD_URL = "https://q-simutron-backend.onrender.com";

const isProd = process.env.NODE_ENV === "production";
export const BACKEND_URL = process.env.BACKEND_API_URL || (isProd ? PROD_URL : LOCAL_DEV_URL);
export const ADMIN_COOKIE_NAME = "qsim_admin_token";

async function adminFetch(path: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    throw new Error("Admin authentication required");
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("Unauthorized: verified admin session required");
  }
  if (!res.ok) {
    throw new Error(`Backend request failed (${res.status}) for ${path}`);
  }
  return res.json();
}

export async function fetchDashboardOverview() {
  return adminFetch("/api/monitoring/dashboard");
}

export async function fetchMonitoredUsers() {
  return adminFetch("/api/monitoring/users");
}

export async function fetchRequestLogs() {
  return adminFetch("/api/monitoring/requests");
}

export async function fetchOrganizations() {
  return adminFetch("/api/monitoring/organizations");
}

export async function fetchAgentActivity() {
  return adminFetch("/api/monitoring/activity");
}

export async function fetchNewsMonitoring() {
  return adminFetch("/api/monitoring/news");
}

export async function fetchNotificationsMonitoring() {
  return adminFetch("/api/monitoring/notifications");
}

export async function fetchDataSourcesMonitoring() {
  return adminFetch("/api/monitoring/data-sources");
}
