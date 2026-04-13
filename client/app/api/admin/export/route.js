import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function toCSV(rows, headers) {
  const esc = (v) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = headers.join(",");
  const body = rows.map((r) => headers.map((h) => esc(r[h])).join(",")).join("\n");
  return head + (body ? "\n" + body : "");
}

const EXPORTS = {
  events: {
    table: "events",
    orderBy: "created_at",
    columns: ["id", "session_id", "type", "country", "ip", "username", "duration_ms", "data", "created_at"],
  },
  reports: {
    table: "reports",
    orderBy: "created_at",
    columns: ["id", "reporter_sid", "reported_sid", "reason", "reported_ip", "reported_username", "created_at"],
  },
  bans: {
    table: "bans",
    orderBy: "banned_at",
    columns: ["id", "ip", "reason", "banned_by", "banned_at", "expires_at", "active"],
  },
};

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "events";
  const spec = EXPORTS[type];
  if (!spec) {
    return NextResponse.json({ error: "unknown export type" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(spec.table)
    .select(spec.columns.join(","))
    .order(spec.orderBy, { ascending: false })
    .limit(10000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csv = toCSV(data || [], spec.columns);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `randochat-${type}-${date}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
