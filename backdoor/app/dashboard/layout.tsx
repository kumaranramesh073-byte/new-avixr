"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconLoader2 } from "@tabler/icons-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (ready && !user) {
      console.warn("[BACKDOOR_AUTH] DashboardLayout: WARN - User not authenticated, redirecting to login");
      router.replace("/login");
    } else if (ready && user) {
      console.info(`[BACKDOOR_AUTH] DashboardLayout: INFO - User authenticated: ${user.email}`);
    }
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <IconLoader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "3rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
