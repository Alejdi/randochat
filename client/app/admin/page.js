"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TABS = [
  { id: "overview", label: "overview" },
  { id: "live",     label: "live"     },
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
  const [live, setLive] = useState(null);
  const [liveError, setLiveError] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [s, ss, r, b, l] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/sessions"),
        fetch("/api/admin/reports"),
        fetch("/api/admin/bans"),
        fetch("/api/admin/live"),
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
      if (l.ok) {
        setLive(await l.json());
        setLiveError("");
      } else {
        const lj = await l.json().catch(() => ({}));
        setLiveError(lj.error || `live fetch ${l.status}`);
        setLive(null);
      }
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = tab === "live" ? 4_000 : 15_000;
    const t = setInterval(load, interval);
    return () => clearInterval(t);
  }, [load, tab]);

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
        <div className="flex gap-2 items-center flex-wrap">
          <a href="/api/admin/export?type=events" download className="btn btn-ghost" style={{ padding: "0.5rem 0.8rem", fontSize: 11 }}>
            ⬇ events.csv
          </a>
          <a href="/api/admin/export?type=reports" download className="btn btn-ghost" style={{ padding: "0.5rem 0.8rem", fontSize: 11 }}>
            ⬇ reports.csv
          </a>
          <a href="/api/admin/export?type=bans" download className="btn btn-ghost" style={{ padding: "0.5rem 0.8rem", fontSize: 11 }}>
            ⬇ bans.csv
          </a>
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

      {tab === "live" && (
        <div>
          {liveError && (
            <div className="card p-3 mb-3" style={{ color: "var(--tomato-dark)" }}>
              live feed error: {liveError}
              <div className="text-xs mt-1 opacity-70">
                make sure SIGNAL_URL and ADMIN_RELAY_SECRET are set on Vercel, and the same secret is set on your signaling server, then restart both.
              </div>
            </div>
          )}

          {live && (
            <div className="flex gap-3 flex-wrap mb-3 text-sm">
              <span className="tag tag-live">● {live.sessions?.length || 0} connected</span>
              <span className="tag">queue {live.queue_size ?? 0}</span>
              <span className="tag">bans {live.active_bans ?? 0}</span>
              <span className="opacity-50 text-xs self-center">updated {live.now ? new Date(live.now).toLocaleTimeString() : "—"}</span>
            </div>
          )}

          <div className="card p-0 overflow-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#eee", color: "var(--ink)", textAlign: "left" }}>
                  <th className="px-3 py-2">state</th>
                  <th className="px-3 py-2">user</th>
                  <th className="px-3 py-2">country</th>
                  <th className="px-3 py-2">ip</th>
                  <th className="px-3 py-2">uptime</th>
                  <th className="px-3 py-2">matches</th>
                  <th className="px-3 py-2">skips</th>
                  <th className="px-3 py-2">partner</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody style={{ color: "var(--ink)" }}>
                {(live?.sessions || []).map((s) => (
                  <tr key={s.sid} style={{ borderTop: "1px solid #ccc", background: "#fff" }}>
                    <td className="px-3 py-2">
                      <span className={
                        s.state === "matched" ? "tag tag-live" :
                        s.state === "searching" ? "tag tag-warm" :
                        "tag tag-idle"
                      }>{s.state}</span>
                    </td>
                    <td className="px-3 py-2">{s.username || <span className="opacity-50">—</span>}</td>
                    <td className="px-3 py-2">{s.country || "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{s.ip || "—"}</td>
                    <td className="px-3 py-2">{fmtDur(s.uptime_ms)}</td>
                    <td className="px-3 py-2">{s.matches}</td>
                    <td className="px-3 py-2">{s.skips}</td>
                    <td className="px-3 py-2 font-mono text-xs">{s.partner ? `${s.partner.slice(0, 8)}…` : "—"}</td>
                    <td className="px-3 py-2">
                      {s.ip && (
                        <button
                          onClick={() => banIp(s.ip, `live kick ${s.username || s.sid.slice(0, 6)}`)}
                          className="btn btn-primary"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                        >
                          ban
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(live?.sessions || []).length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-6 text-center" style={{ color: "#666" }}>
                    {liveError ? "no live feed" : "nobody connected right now"}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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

      <div className="mt-6 text-xs opacity-50">
        auto-refresh {tab === "live" ? "every 4s" : "every 15s"}
      </div>
    </main>
  );
}
