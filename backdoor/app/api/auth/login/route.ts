import { NextResponse } from "next/server";
import { BACKEND_URL, ADMIN_COOKIE_NAME } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Server missing SUPABASE_URL or SUPABASE_ANON_KEY configuration" },
        { status: 500 }
      );
    }

    // 1. Authenticate via official Supabase Auth password grant (never hardcoded passwords)
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (!authRes.ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const authData = (await authRes.json()) as {
      access_token?: string;
      expires_in?: number;
      user?: { id: string; email?: string; user_metadata?: Record<string, string> };
    };

    if (!authData.access_token) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // 2. Verify authoritative DB role via backend /api/auth/me (reads user_profiles.role)
    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authData.access_token}` },
      cache: "no-store",
    });

    if (!meRes.ok) {
      return NextResponse.json({ error: "Failed to verify user authorization" }, { status: 403 });
    }

    const me = (await meRes.json()) as { id: string; email: string; fullName?: string | null; role: string };
    if (me.role !== "admin" && me.role !== "superadmin") {
      return NextResponse.json(
        { error: "Access denied: account does not have verified administrator privileges" },
        { status: 403 }
      );
    }

    const user = {
      id: me.id,
      email: me.email,
      name: me.fullName || me.email.split("@")[0] || "Admin",
      role: me.role as "admin" | "superadmin",
    };

    const res = NextResponse.json({ user });
    res.cookies.set(ADMIN_COOKIE_NAME, authData.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.min(authData.expires_in || 3600, 3600),
    });
    return res;
  } catch (err: any) {
    console.error("[BACKDOOR_AUTH] Login error:", err?.message);
    return NextResponse.json({ error: "Authentication error" }, { status: 500 });
  }
}
