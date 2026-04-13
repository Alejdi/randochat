import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const supabase = getSupabaseAdmin();
  let q = supabase
    .from("cashout_requests")
    .select("id, user_id, amount_cents, method, destination, note, status, admin_note, created_at, processed_at, processed_by")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status);

  const { data: requests, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = [...new Set((requests || []).map((r) => r.user_id))];
  let userMap = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, username, device_id, balance_cents")
      .in("id", userIds);
    userMap = Object.fromEntries((users || []).map((u) => [u.id, u]));
  }

  const rows = (requests || []).map((r) => ({ ...r, user: userMap[r.user_id] || null }));
  return NextResponse.json({ requests: rows });
}

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const id = Number(body?.id);
  const action = String(body?.action || "");
  const adminNote = String(body?.admin_note || "").slice(0, 500) || null;

  if (!Number.isFinite(id)) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (action !== "paid" && action !== "rejected") {
    return NextResponse.json({ error: "action must be 'paid' or 'rejected'" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("process_cashout_request", {
    p_request_id:   id,
    p_new_status:   action,
    p_admin_note:   adminNote,
    p_processed_by: "admin",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, result: data });
}
