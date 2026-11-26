/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON Control — Admin Session Types
   Authentication is handled exclusively via server-side Supabase Auth +
   verified user_profiles.role ('admin' | 'superadmin'). No hardcoded passwords.
   ═══════════════════════════════════════════════════════════════════════════ */

export type Role = "superadmin" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}
