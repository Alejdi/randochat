import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const since = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

  const [day, week, allMatches, allSkips, endedDay, topCountries, activeBans] = await Promise.all([
    supabase.from("events").select("session_id", { count: "exact", head: true }).eq("type", "session_start").gte("created_at", since(24)),
    supabase.from("events").select("session_id", { count: "exact", head: true }).eq("type", "session_start").gte("created_at", since(24 * 7)),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("type", "match").gte("created_at", since(24)),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("type", "skip").gte("created_at", since(24)),
    supabase.from("events").select("duration_ms").eq("type", "session_end").gte("created_at", since(24 * 7)).limit(2000),
    supabase.from("events").select("country").eq("type", "session_start").gte("created_at", since(24 * 7)).limit(5000),
    supabase.from("bans").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  const durations = (endedDay.data || []).map((r) => r.duration_ms).filter((n) => Number.isFinite(n) && n > 0);
  const avgMs = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const medianMs = durations.length
    ? [...durations].sort((a, b) => a - b)[Math.floor(durations.length / 2)]
    : 0;

  const countryCounts = {};
  for (const row of topCountries.data || []) {
    const c = row.country || "??";
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  }
  const top = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }));

  return NextResponse.json({
    sessions_24h: day.count || 0,
    sessions_7d: week.count || 0,
    matches_24h: allMatches.count || 0,
    skips_24h: allSkips.count || 0,
    avg_session_ms: Math.round(avgMs),
    median_session_ms: Math.round(medianMs),
    match_rate: day.count ? (allMatches.count || 0) / day.count : 0,
    top_countries: top,
    active_bans: activeBans.count || 0,
  });
}
