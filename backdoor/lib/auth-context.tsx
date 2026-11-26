"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON Control — Server-Verified Admin Auth Context
   Backed by HttpOnly cookie + Supabase Auth + backend user_profiles.role.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as React from "react";
import type { SessionUser } from "@/lib/auth-config";

interface AuthState {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ user: SessionUser | null; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (active) setUser(d.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        return { user: null, error: data.error || "Invalid credentials or insufficient privileges" };
      }
      setUser(data.user as SessionUser);
      return { user: data.user as SessionUser };
    } catch {
      return { user: null, error: "Authentication request failed" };
    }
  }, []);

  const logout = React.useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
