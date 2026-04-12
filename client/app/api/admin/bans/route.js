import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bans")
    .select("*")
    .order("banned_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bans: data || [] });
}

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const ip = String(body?.ip || "").trim().slice(0, 64);
  const reason = String(body?.reason || "").trim().slice(0, 500) || null;
  if (!ip) return NextResponse.json({ error: "ip required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  // Deactivate any existing active ban for this ip, then insert fresh
  await supabase.from("bans").update({ active: false }).eq("ip", ip).eq("active", true);
  const { data, error } = await supabase
    .from("bans")
    .insert({ ip, reason, banned_by: "admin", active: true })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ban: data });
}

export async function DELETE(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const ip = searchParams.get("ip");
  const supabase = getSupabaseAdmin();
  let q = supabase.from("bans").update({ active: false });
  if (id) q = q.eq("id", Number(id));
  else if (ip) q = q.eq("ip", ip).eq("active", true);
  else return NextResponse.json({ error: "id or ip required" }, { status: 400 });
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
