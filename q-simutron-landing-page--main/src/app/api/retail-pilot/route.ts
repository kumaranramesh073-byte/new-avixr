import { NextResponse } from "next/server";

/**
 * Placeholder handler for the "Secure Your Retail Pilot" application form.
 *
 * Wire this up later to your CRM / email / database — e.g. forward to HubSpot,
 * store in Supabase, push to a Slack channel, or send a confirmation email.
 * For now it validates the shape and echoes success so the UI can be built/tested.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, company, email, role, phone } = body ?? {};

    // Minimal server-side guard mirroring the client validation.
    if (!fullName || !company || !email || !role || !phone) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    // TODO: persist / forward the application here.
    console.log("[retail-pilot] new application:", { fullName, company, email, role, phone });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }
}
