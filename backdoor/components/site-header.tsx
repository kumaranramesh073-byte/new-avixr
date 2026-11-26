"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { IconPointFilled } from "@tabler/icons-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/users": "Users",
  "/dashboard/requests": "LLM Requests",
  "/dashboard/costs": "Cost Settings",
  "/dashboard/commits": "Commits",
};

export function SiteHeader() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Control Panel";

  React.useEffect(() => {
    console.info(`[BACKDOOR_UI] SiteHeader: INFO - Mounted/Rendered page title: ${title}`);
  }, [title]);

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
            <IconPointFilled className="size-2 animate-pulse" />
            Live
          </Badge>
        </div>
      </div>
    </header>
  );
}
