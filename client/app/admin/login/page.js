"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || "login failed");
        setBusy(false);
        return;
      }
      router.push("/admin");
    } catch {
      setError("network error");
      setBusy(false);
    }
  }

  return (
    <main className="fixed inset-0 flex items-center justify-center p-6" style={{ background: "var(--ink)" }}>
      <form onSubmit={submit} className="card w-full max-w-sm p-6" style={{ transform: "rotate(-0.7deg)" }}>
        <div className="font-display text-3xl font-black italic mb-1">admin</div>
        <div className="scribble text-xs mb-5">restricted area</div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          placeholder="password"
          className="w-full px-3 py-2 text-lg font-bold outline-none mb-3"
          style={{
            background: "#fff",
            color: "var(--ink)",
            border: "2px solid var(--line)",
            borderRadius: 4,
            fontFamily: "Space Grotesk, sans-serif",
          }}
        />
        {error && (
          <div className="text-xs mb-3" style={{ color: "var(--tomato-dark)" }}>{error}</div>
        )}
        <button type="submit" disabled={busy || !password} className="btn btn-primary w-full" style={{ padding: "0.8rem" }}>
          {busy ? "…" : "sign in"}
        </button>
      </form>
    </main>
  );
}
