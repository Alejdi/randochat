import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = process.env.SIGNAL_URL || process.env.NEXT_PUBLIC_SIGNAL_URL;
  const secret = process.env.ADMIN_RELAY_SECRET;
  if (!url) {
    return NextResponse.json({ error: "SIGNAL_URL or NEXT_PUBLIC_SIGNAL_URL must be set" }, { status: 500 });
  }
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_RELAY_SECRET must be set" }, { status: 500 });
  }
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/live`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const text = await r.text();
    if (!r.ok) {
      return NextResponse.json({ error: `signaling ${r.status}: ${text.slice(0, 200)}` }, { status: 502 });
    }
    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 502 });
  }
}
