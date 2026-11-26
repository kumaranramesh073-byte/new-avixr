"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconLoader2 } from "@tabler/icons-react";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, ready } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!ready) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [ready, user, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <IconLoader2 className="size-7 animate-spin text-muted-foreground" />
    </div>
  );
}
