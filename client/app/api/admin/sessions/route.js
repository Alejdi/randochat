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
    .from("events")
    .select("id, session_id, type, country, ip, username, duration_ms, data, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group events by session_id
  const bySession = new Map();
  for (const e of data) {
    if (!bySession.has(e.session_id)) {
      bySession.set(e.session_id, {
        session_id: e.session_id,
        started_at: null,
        ended_at: null,
        duration_ms: null,
        ip: e.ip,
        country: e.country,
        username: e.username,
        matches: 0,
        skips: 0,
        reports: 0,
        events: [],
      });
    }
    const row = bySession.get(e.session_id);
    row.events.push({ type: e.type, created_at: e.created_at });
    if (e.ip && !row.ip) row.ip = e.ip;
    if (e.country && !row.country) row.country = e.country;
    if (e.username && !row.username) row.username = e.username;
    if (e.type === "session_start") row.started_at = e.created_at;
    if (e.type === "session_end") {
      row.ended_at = e.created_at;
      row.duration_ms = e.duration_ms;
    }
    if (e.type === "match") row.matches += 1;
    if (e.type === "skip") row.skips += 1;
    if (e.type === "report") row.reports += 1;
  }

  const rows = [...bySession.values()].sort((a, b) => {
    const ta = new Date(a.ended_at || a.started_at || 0).getTime();
    const tb = new Date(b.ended_at || b.started_at || 0).getTime();
    return tb - ta;
  });

  return NextResponse.json({ sessions: rows });
}
