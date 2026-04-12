"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TABS = [
  { id: "overview", label: "overview" },
  { id: "sessions", label: "sessions" },
  { id: "reports",  label: "reports"  },
  { id: "bans",     label: "bans"     },
];

function fmtDur(ms) {
  if (!ms || ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return `${m}m ${r}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

function Stat({ label, value, sub }) {
  return (
    <div className="card p-4" style={{ transform: `rotate(${(Math.random() - 0.5) * 0.8}deg)` }}>
      <div className="text-xs uppercase tracking-wider opacity-60 mb-1" style={{ fontFamily: "Space Grotesk" }}>{label}</div>
      <div className="font-display text-4xl font-black italic leading-none">{value}</div>
      {sub && <div className="text-xs opacity-60 mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reports, setReports] = useState([]);
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [s, ss, r, b] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/sessions"),
        fetch("/api/admin/reports"),
        fetch("/api/admin/bans"),
      ]);
      if (s.status === 401 || ss.status === 401) {
        router.push("/admin/login");
        return;
      }
      const [sj, ssj, rj, bj] = await Promise.all([s.json(), ss.json(), r.json(), b.json()]);
      setStats(sj);
      setSessions(ssj.sessions || []);
      setReports(rj.reports || []);
      setBans(bj.bans || []);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  async function banIp(ip, reason = "manual") {
    if (!ip) return;
    if (!confirm(`Ban ${ip}?`)) return;
    const r = await fetch("/api/admin/bans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, reason }),
    });
    if (!r.ok) { alert("ban failed"); return; }
    load();
  }

  async function unban(id) {
    if (!confirm("Unban?")) return;
    const r = await fetch(`/api/admin/bans?id=${id}`, { method: "DELETE" });
    if (!r.ok) { alert("unban failed"); return; }
    load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen p-4 sm:p-6" style={{ background: "var(--ink)", color: "var(--paper)" }}>
      <header className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <span className="font-display text-3xl font-black italic">
            Rando<span style={{ color: "var(--tomato)" }}>Chat</span>
          </span>
          <span className="scribble text-xs ml-2 -rotate-2 inline-block">admin</span>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={load} className="btn btn-ghost" style={{ padding: "0.5rem 0.9rem", fontSize: 12 }}>
            {loading ? "…" : "refresh"}
          </button>
          <button onClick={logout} className="btn btn-ghost" style={{ padding: "0.5rem 0.9rem", fontSize: 12 }}>
            sign out
          </button>
        </div>
      </header>

      <nav className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? "btn btn-primary" : "btn btn-ghost"}
            style={{ padding: "0.5rem 1rem", fontSize: 13 }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {err && <div className="card p-3 mb-4" style={{ color: "var(--tomato-dark)" }}>{err}</div>}

      {tab === "overview" && stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Stat label="sessions · 24h" value={stats.sessions_24h} />
            <Stat label="sessions · 7d"  value={stats.sessions_7d} />
            <Stat label="matches · 24h"  value={stats.matches_24h} />
            <Stat label="skips · 24h"    value={stats.skips_24h} />
            <Stat label="avg session"    value={fmtDur(stats.avg_session_ms)} sub="last 7 days" />
            <Stat label="median session" value={fmtDur(stats.median_session_ms)} sub="last 7 days" />
            <Stat label="match rate"     value={`${(stats.match_rate * 100).toFixed(0)}%`} sub="matches ÷ sessions" />
            <Stat label="active bans"    value={stats.active_bans} />
          </div>
          <div className="card p-4">
            <div className="text-xs uppercase tracking-wider opacity-60 mb-2" style={{ fontFamily: "Space Grotesk" }}>top countries · 7 days</div>
            <div className="flex flex-wrap gap-2">
              {(stats.top_countries || []).length === 0 && <span className="opacity-60 text-sm">no data</span>}
              {(stats.top_countries || []).map((c) => (
                <span key={c.country} className="tag">{c.country} · {c.count}</span>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "sessions" && (
        <div className="card p-0 overflow-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#eee", color: "var(--ink)", textAlign: "left" }}>
                <th className="px-3 py-2">when</th>
                <th className="px-3 py-2">session</th>
                <th className="px-3 py-2">user</th>
                <th className="px-3 py-2">country</th>
                <th className="px-3 py-2">ip</th>
                <th className="px-3 py-2">duration</th>
                <th className="px-3 py-2">match</th>
                <th className="px-3 py-2">skip</th>
                <th className="px-3 py-2">reports</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody style={{ color: "var(--ink)" }}>
              {sessions.map((s) => (
                <tr key={s.session_id} style={{ borderTop: "1px solid #ccc", background: "#fff" }}>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtTime(s.started_at)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.session_id?.slice(0, 10)}…</td>
                  <td className="px-3 py-2">{s.username || "—"}</td>
                  <td className="px-3 py-2">{s.country || "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.ip || "—"}</td>
                  <td className="px-3 py-2">{fmtDur(s.duration_ms)}</td>
                  <td className="px-3 py-2">{s.matches}</td>
                  <td className="px-3 py-2">{s.skips}</td>
                  <td className="px-3 py-2">{s.reports}</td>
                  <td className="px-3 py-2">
                    {s.ip && (
                      <button
                        onClick={() => banIp(s.ip, `session ${s.session_id?.slice(0, 8)}`)}
                        className="btn btn-primary"
                        style={{ padding: "4px 10px", fontSize: 11 }}
                      >
                        ban ip
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-6 text-center" style={{ color: "#666" }}>no sessions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "reports" && (
        <div className="card p-0 overflow-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#eee", color: "var(--ink)", textAlign: "left" }}>
                <th className="px-3 py-2">when</th>
                <th className="px-3 py-2">reporter</th>
                <th className="px-3 py-2">reported</th>
                <th className="px-3 py-2">ip</th>
                <th className="px-3 py-2">username</th>
                <th className="px-3 py-2">reason</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody style={{ color: "var(--ink)" }}>
              {reports.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #ccc", background: "#fff" }}>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtTime(r.created_at)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.reporter_sid?.slice(0, 8)}…</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.reported_sid?.slice(0, 8)}…</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.reported_ip || "—"}</td>
                  <td className="px-3 py-2">{r.reported_username || "—"}</td>
                  <td className="px-3 py-2">{r.reason || "—"}</td>
                  <td className="px-3 py-2">
                    {r.reported_ip && (
                      <button
                        onClick={() => banIp(r.reported_ip, `report #${r.id}`)}
                        className="btn btn-primary"
                        style={{ padding: "4px 10px", fontSize: 11 }}
                      >
                        ban ip
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center" style={{ color: "#666" }}>no reports yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "bans" && (
        <div className="card p-0 overflow-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#eee", color: "var(--ink)", textAlign: "left" }}>
                <th className="px-3 py-2">when</th>
                <th className="px-3 py-2">ip</th>
                <th className="px-3 py-2">reason</th>
                <th className="px-3 py-2">by</th>
                <th className="px-3 py-2">status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody style={{ color: "var(--ink)" }}>
              {bans.map((b) => (
                <tr key={b.id} style={{ borderTop: "1px solid #ccc", background: "#fff" }}>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtTime(b.banned_at)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{b.ip}</td>
                  <td className="px-3 py-2">{b.reason || "—"}</td>
                  <td className="px-3 py-2">{b.banned_by || "—"}</td>
                  <td className="px-3 py-2">{b.active ? "🔴 active" : "⚪ lifted"}</td>
                  <td className="px-3 py-2">
                    {b.active && (
                      <button
                        onClick={() => unban(b.id)}
                        className="btn btn-ghost"
                        style={{ padding: "4px 10px", fontSize: 11, color: "var(--ink)", borderColor: "var(--ink)", boxShadow: "3px 3px 0 0 var(--ink)" }}
                      >
                        unban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {bans.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center" style={{ color: "#666" }}>no bans</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-xs opacity-50">auto-refresh every 15s</div>
    </main>
  );
}
