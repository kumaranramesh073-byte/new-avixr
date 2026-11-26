"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON Control — Client Auth Context
   Lightweight session kept in localStorage. This is a back-door monitoring
   tool, not a public app, so we intentionally keep auth simple. Swap to a
   cookie/JWT against the main backend when wiring real data.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as React from "react";
import { authenticate, type SessionUser } from "@/lib/auth-config";

const STORAGE_KEY = "qsim-control-session";

interface AuthState {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => SessionUser | null;
  logout: () => void;
}

const AuthContext = React.createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as SessionUser);
    } catch {
      /* ignore corrupt session */
    }
    setReady(true);
  }, []);

  const login = React.useCallback((email: string, password: string) => {
    const session = authenticate(email, password);
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setUser(session);
    }
    return session;
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
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
