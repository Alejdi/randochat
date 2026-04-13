import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const query   = String(body?.query || "").trim();        // username or device id fragment
  const userId  = body?.userId ? Number(body.userId) : null;
  const amount  = Number(body?.amount || 0);
  const note    = String(body?.note || "").slice(0, 500) || null;
  const ref     = String(body?.ref  || "").slice(0, 200) || null;

  if (!Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: "amount required (positive = credit, negative = debit)" }, { status: 400 });
  }
  if (!userId && !query) {
    return NextResponse.json({ error: "userId or query required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  let targetId = userId;
  if (!targetId) {
    const { data: matches, error: searchError } = await supabase
      .from("users")
      .select("id, username, device_id, balance_cents")
      .or(`username.ilike.%${query}%,device_id.ilike.%${query}%`)
      .limit(5);
    if (searchError) return NextResponse.json({ error: searchError.message }, { status: 500 });
    if (!matches || matches.length === 0) return NextResponse.json({ error: "no user matched" }, { status: 404 });
    if (matches.length > 1) return NextResponse.json({ error: "multiple matches — pass userId", matches }, { status: 409 });
    targetId = matches[0].id;
  }

  const { data, error } = await supabase.rpc("admin_credit", {
    p_user_id:      targetId,
    p_amount_cents: amount,
    p_note:         note,
    p_ref:          ref,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, user_id: targetId, balance_cents: data?.balance_cents ?? null });
}

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();
  if (!query) return NextResponse.json({ users: [] });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("id, username, device_id, balance_cents, created_at, last_seen_at")
    .or(`username.ilike.%${query}%,device_id.ilike.%${query}%`)
    .order("last_seen_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data || [] });
}
