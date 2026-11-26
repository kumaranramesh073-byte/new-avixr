import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL, ADMIN_COOKIE_NAME } from "@/lib/api";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!meRes.ok) {
      const res = NextResponse.json({ user: null });
      res.cookies.delete(ADMIN_COOKIE_NAME);
      return res;
    }

    const me = (await meRes.json()) as { id: string; email: string; fullName?: string | null; role: string };
    if (me.role !== "admin" && me.role !== "superadmin") {
      const res = NextResponse.json({ user: null });
      res.cookies.delete(ADMIN_COOKIE_NAME);
      return res;
    }

    return NextResponse.json({
      user: {
        id: me.id,
        email: me.email,
        name: me.fullName || me.email.split("@")[0] || "Admin",
        role: me.role,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
