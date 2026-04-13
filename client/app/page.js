"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { genUsername } from "@/lib/username";
import { COUNTRIES, flag, countryName } from "@/lib/countries";

const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || "http://localhost:4000";

const GIFTS = [
  { type: "heart", emoji: "❤️", cost: 5 },
  { type: "fire",  emoji: "🔥", cost: 10 },
  { type: "star",  emoji: "⭐", cost: 20 },
];

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80",             username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443",            username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

const CAMERA_OFF_LIMIT_MS = 10_000;

export default function Page() {
  const [status, setStatus] = useState("idle"); // idle | searching | connected
  const [username, setUsername] = useState("");
  const [coins, setCoins] = useState(100);
  const [giftFlash, setGiftFlash] = useState(null);
  const [toast, setToast] = useState("");
  const [permPrompt, setPermPrompt] = useState(null); // null | denied | error | insecure
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);
  const [online, setOnline] = useState(null);
  const [bannedNotice, setBannedNotice] = useState(null);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const [messages, setMessages] = useState([]); // { id, from: 'me'|'them', text }
  const [chatInput, setChatInput] = useState("");
  const chatListRef = useRef(null);
  const [filter, setFilter] = useState("any"); // "any" | "AL" | "DE" | ...
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [searchHint, setSearchHint] = useState(false);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const audioCtxRef = useRef(null);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoMobileRef = useRef(null);
  const localVideoDesktopRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const partnerRef = useRef(null);
  const roundRef = useRef(0);
  const watchdogRef = useRef(null);

  useEffect(() => {
    const u = localStorage.getItem("rc_user");
    const welcomed = localStorage.getItem("rc_welcomed");
    if (u) setUsername(u);
    if (!welcomed) {
      setWelcomeOpen(true);
    } else if (!u) {
      setNameDraft(genUsername());
      setNameModalOpen(true);
    }
    const c = Number(localStorage.getItem("rc_coins"));
    if (!Number.isNaN(c) && c > 0) setCoins(c);
    const savedFilter = localStorage.getItem("rc_filter");
    if (savedFilter) setFilter(savedFilter);
    // Open the signaling socket immediately so the presence counter is live
    // before the user presses Start.
    connectSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismissWelcome() {
    localStorage.setItem("rc_welcomed", "1");
    setWelcomeOpen(false);
    if (!localStorage.getItem("rc_user")) {
      setNameDraft(genUsername());
      setNameModalOpen(true);
    }
  }

  function playMatchSound() {
    try {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, t);
      osc.frequency.exponentialRampToValueAtTime(990, t + 0.12);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    } catch {}
  }

  // Country-filter hint: if user has been searching with a specific country
  // for > 20s with no match, suggest widening to "any".
  useEffect(() => {
    if (status !== "searching" || filter === "any") {
      setSearchHint(false);
      return;
    }
    const t = setTimeout(() => setSearchHint(true), 20_000);
    return () => clearTimeout(t);
  }, [status, filter]);

  function openNameModal() {
    setNameDraft(username || genUsername());
    setNameError("");
    setNameModalOpen(true);
  }

  function saveName() {
    const clean = nameDraft.trim().replace(/\s+/g, "_");
    if (clean.length < 2) { setNameError("at least 2 characters"); return; }
    if (clean.length > 20) { setNameError("max 20 characters"); return; }
    if (!/^[A-Za-z0-9_]+$/.test(clean)) { setNameError("letters, numbers, _ only"); return; }
    localStorage.setItem("rc_user", clean);
    setUsername(clean);
    setNameModalOpen(false);
    setNameError("");
    try { socketRef.current?.emit("hello", { username: clean }); } catch {}
  }

  useEffect(() => {
    if (username) localStorage.setItem("rc_coins", String(coins));
  }, [coins, username]);

  useEffect(() => {
    const el = chatListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => {
      try { socketRef.current?.disconnect(); } catch {}
      try { peerRef.current?.destroy(); } catch {}
      clearWatchdog();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }, []);

  // Auto-give-up: after 30s of searching with no match, stop the search and
  // surface a toast so the user isn't staring at a stale "dialing…" forever.
  // NOTE: must be defined AFTER showToast because the dep array references it
  // (const TDZ would throw on first render otherwise).
  useEffect(() => {
    if (status !== "searching") return;
    const t = setTimeout(() => {
      setStatus("idle");
      socketRef.current?.emit("stop");
      showToast("no one around. try again");
    }, 30_000);
    return () => clearTimeout(t);
  }, [status, filter, showToast]);

  function clearWatchdog() {
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
  }

  function startCameraWatchdog(remoteStream, myRound) {
    clearWatchdog();
    const videoTrack = remoteStream.getVideoTracks()[0];
    if (!videoTrack) return;

    let mutedSince = videoTrack.muted ? Date.now() : null;
    const onMute   = () => { mutedSince = Date.now(); };
    const onUnmute = () => { mutedSince = null; };
    videoTrack.addEventListener("mute", onMute);
    videoTrack.addEventListener("unmute", onUnmute);

    watchdogRef.current = setInterval(() => {
      if (myRound !== roundRef.current) {
        clearWatchdog();
        videoTrack.removeEventListener("mute", onMute);
        videoTrack.removeEventListener("unmute", onUnmute);
        return;
      }
      const v = remoteVideoRef.current;
      const blank = !v || v.videoWidth === 0 || v.videoHeight === 0;
      const silent = videoTrack.muted || videoTrack.readyState === "ended" || !videoTrack.enabled;
      if (silent || blank) {
        if (mutedSince == null) mutedSince = Date.now();
        if (Date.now() - mutedSince > CAMERA_OFF_LIMIT_MS) {
          showToast("Skipping — camera off");
          clearWatchdog();
          videoTrack.removeEventListener("mute", onMute);
          videoTrack.removeEventListener("unmute", onUnmute);
          next();
        }
      } else {
        mutedSince = null;
      }
    }, 1000);
  }

  function attachLocalStream(s) {
    if (localVideoMobileRef.current) localVideoMobileRef.current.srcObject = s;
    if (localVideoDesktopRef.current) localVideoDesktopRef.current.srcObject = s;
  }

  async function ensureMedia() {
    if (localStreamRef.current) {
      attachLocalStream(localStreamRef.current);
      return localStreamRef.current;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      const err = new Error("insecure context");
      err.name = "InsecureContextError";
      throw err;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      const err = new Error("mediaDevices unavailable");
      err.name = "InsecureContextError";
      throw err;
    }
    const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = s;
    attachLocalStream(s);
    setPermPrompt(null);
    return s;
  }

  async function requestPermissions() {
    try {
      await ensureMedia();
      return true;
    } catch (err) {
      console.warn("getUserMedia error:", err);
      if (err?.name === "InsecureContextError") setPermPrompt("insecure");
      else if (err?.name === "NotAllowedError" || err?.name === "SecurityError") setPermPrompt("denied");
      else setPermPrompt("error");
      return false;
    }
  }

  function teardownPeer() {
    roundRef.current += 1;
    clearWatchdog();
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch {}
      peerRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    partnerRef.current = null;
    setNeedsTapToPlay(false);
    setMessages([]);
    setChatInput("");
    setRemoteTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }

  async function createPeer(peerId, initiator) {
    const myRound = roundRef.current;
    const { default: Peer } = await import("simple-peer");
    if (myRound !== roundRef.current) return;
    const stream = await ensureMedia();
    if (myRound !== roundRef.current) return;

    const p = new Peer({
      initiator,
      trickle: true,
      stream,
      config: { iceServers: ICE_SERVERS },
    });
    peerRef.current = p;
    partnerRef.current = peerId;

    p.on("signal", (data) => {
      if (myRound !== roundRef.current) return;
      socketRef.current?.emit("signal", { to: peerId, data });
    });
    p.on("stream", (remote) => {
      if (myRound !== roundRef.current) return;
      const v = remoteVideoRef.current;
      if (v) {
        v.srcObject = remote;
        v.muted = false;
        const tryPlay = () =>
          v.play().then(() => setNeedsTapToPlay(false)).catch(() => {
            v.muted = true;
            v.play().then(() => setNeedsTapToPlay(true)).catch(() => setNeedsTapToPlay(true));
          });
        tryPlay();
      }
      setStatus("connected");
      playMatchSound();
      startCameraWatchdog(remote, myRound);
    });
    p.on("data", (raw) => {
      if (myRound !== roundRef.current) return;
      try {
        const msg = JSON.parse(raw.toString());
        if (msg?.type === "msg" && typeof msg.text === "string") {
          const text = msg.text.slice(0, 500);
          setMessages((m) => [
            ...m.slice(-49),
            { id: `${Date.now()}-${Math.random()}`, from: "them", text },
          ]);
          setRemoteTyping(false);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        } else if (msg?.type === "typing") {
          setRemoteTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setRemoteTyping(false), 2500);
        }
      } catch {}
    });
    p.on("error", (err) => { console.warn("peer error", err); });
    p.on("close", () => {});
    p.on("connect", () => console.log("peer connected"));
  }

  function applyFilter(next) {
    setFilter(next);
    localStorage.setItem("rc_filter", next);
    try { socketRef.current?.emit("set-filter", { filter: next }); } catch {}
    setCountryModalOpen(false);
    setCountrySearch("");
  }

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const data = { title: "RandoChat", text: "random video chat, try it →", url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share(data); return; } catch { /* user cancelled or unsupported */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("link copied");
    } catch {
      showToast("couldn't copy — long-press the URL");
    }
  }

  function sendMessage(e) {
    e?.preventDefault?.();
    const text = chatInput.trim();
    if (!text || status !== "connected" || !peerRef.current) return;
    try {
      peerRef.current.send(JSON.stringify({ type: "msg", text }));
    } catch (err) {
      console.warn("send failed", err);
      return;
    }
    setMessages((m) => [
      ...m.slice(-49),
      { id: `${Date.now()}-${Math.random()}`, from: "me", text },
    ]);
    setChatInput("");
    lastTypingSentRef.current = 0;
  }

  function handleChatInput(e) {
    const value = e.target.value;
    setChatInput(value);
    if (!value || status !== "connected" || !peerRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 1500) {
      try { peerRef.current.send(JSON.stringify({ type: "typing" })); } catch {}
      lastTypingSentRef.current = now;
    }
  }

  async function connectSocket() {
    if (socketRef.current) return socketRef.current;
    const { io } = await import("socket.io-client");
    const s = io(SIGNAL_URL, { transports: ["websocket"] });
    socketRef.current = s;

    s.on("matched", ({ peer, initiator }) => {
      teardownPeer();
      roundRef.current += 1;
      createPeer(peer, initiator);
    });
    s.on("signal", ({ data }) => {
      if (!peerRef.current) return;
      try { peerRef.current.signal(data); } catch (e) { console.warn(e); }
    });
    s.on("partner-left", () => {
      teardownPeer();
      setStatus("searching");
      s.emit("join-queue");
    });
    s.on("gift", ({ type }) => {
      const g = GIFTS.find((x) => x.type === type);
      setGiftFlash(g?.emoji || "🎁");
      setTimeout(() => setGiftFlash(null), 1400);
    });
    s.on("disconnect", () => {
      teardownPeer();
      setStatus("idle");
      setOnline(null);
    });
    s.on("presence", ({ online }) => setOnline(online));
    s.on("banned", ({ reason }) => {
      setBannedNotice(reason || "Your access has been restricted.");
    });
    s.on("connect", () => {
      const u = localStorage.getItem("rc_user");
      const f = localStorage.getItem("rc_filter") || "any";
      s.emit("hello", { username: u || undefined, filter: f });
    });
    return s;
  }

  async function start() {
    const ok = await requestPermissions();
    if (!ok) return;
    const s = await connectSocket();
    setStatus("searching");
    s.emit("join-queue");
  }

  function next() {
    teardownPeer();
    setStatus("searching");
    socketRef.current?.emit("next");
  }

  function stop() {
    teardownPeer();
    setStatus("idle");
    socketRef.current?.emit("stop");
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      attachLocalStream(null);
    }
  }

  function block() {
    const peer = partnerRef.current;
    if (!peer) return;
    socketRef.current?.emit("block", { peer });
    teardownPeer();
    showToast("Blocked");
    setStatus("searching");
    socketRef.current?.emit("join-queue");
  }

  function report() {
    const peer = partnerRef.current;
    if (!peer) return;
    socketRef.current?.emit("report", { peer, reason: "user report" });
    showToast("Reported. Thanks.");
  }

  function sendGift(g) {
    if (status !== "connected") return;
    if (coins < g.cost) { showToast("Out of coins"); return; }
    setCoins((c) => c - g.cost);
    socketRef.current?.emit("gift", { type: g.type });
    setGiftFlash(g.emoji);
    setTimeout(() => setGiftFlash(null), 1400);
  }

  const tagClass =
    status === "connected" ? "tag tag-live"
    : status === "searching" ? "tag tag-warm"
    : "tag tag-idle";
  const tagText =
    status === "connected" ? "● live"
    : status === "searching" ? "● dialing"
    : "offline";

  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: "var(--ink)" }}>
      <header className="flex items-end justify-between px-4 pt-4 pb-3 z-10 gap-3">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-display text-3xl font-black italic leading-none whitespace-nowrap" style={{ color: "var(--paper)" }}>
            Rando<span style={{ color: "var(--tomato)" }}>Chat</span>
          </span>
          <span className="scribble text-xs -rotate-2 translate-y-[-2px] hidden sm:inline">talk to strangers</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="stamp" style={{ transform: "rotate(-1deg)" }}>
            <span className="inline-block w-2 h-2 rounded-full mr-1 blip" style={{ background: "var(--mint)" }} />
            {online == null ? "…" : online.toLocaleString()} online
          </span>
          <button onClick={share} className="stamp" style={{ transform: "rotate(1deg)", cursor: "pointer" }} title="share randochat">
            ↗ share
          </button>
          <span className={tagClass}>{tagText}</span>
        </div>
      </header>

      <div className="flex items-center justify-between px-3 sm:px-4 pb-1.5 sm:pb-2 z-10 gap-1.5 sm:gap-2 flex-nowrap overflow-x-auto">
        <button onClick={openNameModal} className="stamp shrink-0" title="change name">
          @{username || "pick"}
        </button>
        <button
          onClick={() => setCountryModalOpen(true)}
          className="stamp shrink-0"
          style={{ transform: "rotate(-0.8deg)" }}
          title="match by country"
        >
          {filter === "any" ? "🌍 any" : `${flag(filter)} ${filter}`}
        </button>
        <span className="stamp shrink-0" style={{ transform: "rotate(1.5deg)" }}>🪙 {coins}</span>
      </div>

      <section className="flex-1 min-h-0 mx-2 sm:mx-4 mb-2 sm:mb-3 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
        {/* Remote panel — full width on mobile, left half on desktop */}
        <div
          className="relative overflow-hidden border-2 border-black rounded-[6px] min-h-0"
          style={{ boxShadow: "6px 6px 0 0 #000", background: "#000" }}
        >
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {status !== "connected" && (
            <div className="absolute inset-0 flex items-center justify-center text-center px-6">
              <div>
                <div className="font-display text-4xl md:text-5xl font-black italic mb-2" style={{ color: "var(--paper)" }}>
                  {status === "searching" ? "dialing…" : "who's out there?"}
                </div>
                <div className="scribble text-sm">
                  {status === "searching" ? (
                    <span className="blip">looking for a stranger</span>
                  ) : (
                    "press start to meet someone"
                  )}
                </div>
                {status === "searching" && searchHint && filter !== "any" && (
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <span className="stamp" style={{ transform: "rotate(-1deg)", background: "var(--tomato)", color: "var(--paper)" }}>
                      no {flag(filter)} {countryName(filter)} online right now
                    </span>
                    <button
                      onClick={() => applyFilter("any")}
                      className="btn btn-paper"
                      style={{ padding: "0.5rem 1rem", fontSize: 12 }}
                    >
                      🌍 match with anyone
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Local PiP — mobile only; desktop gets its own panel */}
          <video
            ref={localVideoMobileRef}
            autoPlay
            playsInline
            muted
            className="pip absolute bottom-2 right-2 w-[38vw] h-[28vh] max-w-[180px] max-h-[240px] object-cover md:hidden"
            style={{ transform: "scaleX(-1)" }}
          />

          {giftFlash && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-[8rem] pop">{giftFlash}</div>
            </div>
          )}

          {needsTapToPlay && status === "connected" && (
            <button
              onClick={() => {
                const v = remoteVideoRef.current;
                if (!v) return;
                v.muted = false;
                v.play().then(() => setNeedsTapToPlay(false)).catch(() => {});
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/50"
            >
              <span className="btn btn-paper">🔊 tap to unmute</span>
            </button>
          )}

          {toast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2">
              <span className="stamp" style={{ transform: "rotate(-1deg)" }}>{toast}</span>
            </div>
          )}

          {status === "connected" && (
            <div className="absolute top-2 right-2 flex gap-1.5 sm:gap-2">
              <button onClick={report} className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 11 }}>
                report
              </button>
              <button onClick={block} className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }}>
                block
              </button>
            </div>
          )}

          {status === "connected" && (
            <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-2 pointer-events-none">
              <div
                ref={chatListRef}
                className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-2 pointer-events-auto"
                style={{ maskImage: "linear-gradient(to top, black 80%, transparent)", WebkitMaskImage: "linear-gradient(to top, black 80%, transparent)" }}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] px-3 py-1.5 text-sm leading-snug break-words ${m.from === "me" ? "self-end" : "self-start"}`}
                    style={{
                      background: m.from === "me" ? "var(--tomato)" : "var(--paper)",
                      color: m.from === "me" ? "var(--paper)" : "var(--ink)",
                      border: "2px solid var(--line)",
                      borderRadius: 6,
                      boxShadow: "2px 2px 0 0 var(--line)",
                      fontFamily: "Space Grotesk, sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              {remoteTyping && (
                <div className="pointer-events-auto self-start px-2 py-1 text-xs"
                  style={{
                    background: "rgba(15,13,12,0.6)",
                    color: "var(--paper)",
                    border: "2px solid var(--paper)",
                    borderRadius: 4,
                    fontStyle: "italic",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <span className="blip">stranger is typing…</span>
                </div>
              )}
              <form onSubmit={sendMessage} className="flex gap-2 pointer-events-auto pr-28 md:pr-0">
                <input
                  value={chatInput}
                  onChange={handleChatInput}
                  placeholder="say something…"
                  maxLength={500}
                  className="flex-1 px-3 py-2 text-sm outline-none"
                  style={{
                    background: "rgba(15,13,12,0.7)",
                    color: "var(--paper)",
                    border: "2px solid var(--paper)",
                    borderRadius: 4,
                    fontFamily: "Space Grotesk, sans-serif",
                    backdropFilter: "blur(6px)",
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="btn btn-primary"
                  style={{ padding: "0.4rem 0.9rem", fontSize: 13 }}
                >
                  send
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Local panel — desktop only, equal size to remote */}
        <div
          className="hidden md:block relative overflow-hidden border-2 border-black rounded-[6px] min-h-0"
          style={{ boxShadow: "6px 6px 0 0 #000", background: "#000" }}
        >
          <video
            ref={localVideoDesktopRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          {!localStreamRef.current && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="font-display text-3xl font-black italic" style={{ color: "var(--paper)" }}>
                  that's you
                </div>
                <div className="scribble text-xs mt-1">camera preview</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="px-3 sm:px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 z-10">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          {GIFTS.map((g) => (
            <button
              key={g.type}
              onClick={() => sendGift(g)}
              disabled={status !== "connected"}
              className="gift"
            >
              <span className="emoji">{g.emoji}</span>
              <span className="cost">{g.cost}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {status === "idle" ? (
            <button onClick={start} className="btn btn-primary btn-compact flex-1 max-w-sm">
              start →
            </button>
          ) : (
            <>
              <button onClick={stop} className="btn btn-ghost btn-compact">
                stop
              </button>
              <button onClick={next} className="btn btn-mint btn-compact flex-1 max-w-sm">
                next →
              </button>
            </>
          )}
        </div>
      </footer>

      {welcomeOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-6" style={{ background: "rgba(15,13,12,0.92)" }}>
          <div className="card w-full max-w-sm p-6" style={{ transform: "rotate(-0.6deg)" }}>
            <div className="font-display text-4xl font-black italic leading-none mb-1">
              welcome to <span style={{ color: "var(--tomato)" }}>RandoChat</span>
            </div>
            <div className="scribble text-sm mb-5">-1 on-1 video with strangers</div>
            <ul className="text-sm space-y-2 mb-5" style={{ color: "#222" }}>
              <li>📹 <strong>press start</strong> — we find you someone instantly.</li>
              <li>⏭️ <strong>next</strong> skips, <strong>stop</strong> quits.</li>
              <li>🌍 filter by <strong>country</strong> or meet anyone.</li>
              <li>💬 chat by text while on video.</li>
              <li>⛔ be kind. <strong>3 reports and you're banned</strong>.</li>
            </ul>
            <button onClick={dismissWelcome} className="btn btn-primary w-full" style={{ padding: "1rem", fontSize: 15 }}>
              let&apos;s go →
            </button>
          </div>
        </div>
      )}

      {countryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(15,13,12,0.88)" }}>
          <div className="card w-full max-w-sm p-5 flex flex-col" style={{ transform: "rotate(-0.5deg)", maxHeight: "80vh" }}>
            <div className="font-display text-2xl font-black italic mb-1">match by country</div>
            <div className="scribble text-xs mb-3">pick a country or keep it global</div>
            <input
              autoFocus
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder="search…"
              className="px-3 py-2 text-sm outline-none mb-3"
              style={{
                background: "#fff",
                color: "var(--ink)",
                border: "2px solid var(--line)",
                borderRadius: 4,
                fontFamily: "Space Grotesk, sans-serif",
              }}
            />
            <div className="flex-1 overflow-y-auto pr-1" style={{ minHeight: 0 }}>
              <button
                onClick={() => applyFilter("any")}
                className={`w-full text-left px-3 py-2 mb-1 text-sm flex items-center gap-2 ${filter === "any" ? "font-bold" : ""}`}
                style={{
                  background: filter === "any" ? "var(--tomato)" : "transparent",
                  color: filter === "any" ? "var(--paper)" : "var(--ink)",
                  border: "2px solid var(--line)",
                  borderRadius: 4,
                }}
              >
                <span>🌍</span> <span>any country</span>
              </button>
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => applyFilter(c.code)}
                  className={`w-full text-left px-3 py-2 mb-1 text-sm flex items-center gap-2 ${filter === c.code ? "font-bold" : ""}`}
                  style={{
                    background: filter === c.code ? "var(--tomato)" : "transparent",
                    color: filter === c.code ? "var(--paper)" : "var(--ink)",
                    border: "2px solid var(--line)",
                    borderRadius: 4,
                  }}
                >
                  <span>{flag(c.code)}</span>
                  <span>{c.name}</span>
                  <span className="ml-auto text-xs opacity-50">{c.code}</span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="text-center text-sm py-6" style={{ color: "#666" }}>no matches</div>
              )}
            </div>
            <button onClick={() => { setCountryModalOpen(false); setCountrySearch(""); }} className="btn btn-paper mt-3" style={{ padding: "0.7rem" }}>
              close
            </button>
          </div>
        </div>
      )}

      {nameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(15,13,12,0.88)" }}>
          <div className="card w-full max-w-sm p-6" style={{ transform: "rotate(-0.8deg)" }}>
            <div className="font-display text-2xl font-black italic mb-1">pick a name</div>
            <div className="scribble text-xs mb-4">strangers will see this. no real names please.</div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display text-2xl font-black" style={{ color: "var(--tomato)" }}>@</span>
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => { setNameDraft(e.target.value); setNameError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
                maxLength={20}
                placeholder="yourname"
                className="flex-1 px-3 py-2 text-lg font-bold outline-none"
                style={{
                  background: "#fff",
                  color: "var(--ink)",
                  border: "2px solid var(--line)",
                  borderRadius: 4,
                  fontFamily: "Space Grotesk, sans-serif",
                }}
              />
            </div>
            <div className="flex items-center justify-between mb-4 min-h-[18px]">
              <span className="text-xs" style={{ color: nameError ? "var(--tomato-dark)" : "#666" }}>
                {nameError || "2–20 chars · letters, numbers, _"}
              </span>
              <button
                onClick={() => { setNameDraft(genUsername()); setNameError(""); }}
                className="text-xs underline"
                style={{ color: "#666" }}
              >
                shuffle
              </button>
            </div>
            <div className="flex gap-2">
              {username && (
                <button onClick={() => setNameModalOpen(false)} className="btn btn-paper flex-1" style={{ padding: "0.8rem" }}>
                  cancel
                </button>
              )}
              <button onClick={saveName} className="btn btn-primary flex-1" style={{ padding: "0.8rem" }}>
                {username ? "save" : "let's go"}
              </button>
            </div>
          </div>
        </div>
      )}

      {bannedNotice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ background: "rgba(15,13,12,0.95)" }}>
          <div className="card w-full max-w-sm p-6 text-center" style={{ transform: "rotate(-0.5deg)" }}>
            <div className="text-5xl mb-2">⛔</div>
            <h2 className="font-display text-2xl font-black italic mb-2">banned</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#333" }}>{bannedNotice}</p>
          </div>
        </div>
      )}

      {permPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(15,13,12,0.88)" }}>
          <div className="card w-full max-w-sm p-6 text-center" style={{ transform: "rotate(-0.8deg)" }}>
            <div className="text-5xl mb-2">
              {permPrompt === "denied" ? "🚫" : permPrompt === "error" ? "⚠️" : permPrompt === "insecure" ? "🔒" : "🎥"}
            </div>
            <h2 className="font-display text-2xl font-black italic mb-2">
              {permPrompt === "denied" ? "Access blocked"
                : permPrompt === "error" ? "No camera found"
                : permPrompt === "insecure" ? "HTTPS required"
                : "Camera & mic"}
            </h2>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: "#333" }}>
              {permPrompt === "denied" ? (
                <>Your browser is blocking camera and mic access. Open site settings, set both to <strong>Allow</strong>, then reload.</>
              ) : permPrompt === "error" ? (
                <>No camera or microphone was detected. Check that nothing else is using it.</>
              ) : permPrompt === "insecure" ? (
                <>Mobile browsers only allow camera/mic on <strong>HTTPS</strong> or <code>localhost</code>. Use an HTTPS tunnel.</>
              ) : (
                <>RandoChat needs access to your camera and microphone.</>
              )}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPermPrompt(null)} className="btn btn-paper flex-1" style={{ padding: "0.8rem" }}>
                cancel
              </button>
              {permPrompt === "denied" || permPrompt === "insecure" ? (
                <button onClick={() => location.reload()} className="btn btn-primary flex-1" style={{ padding: "0.8rem" }}>
                  reload
                </button>
              ) : (
                <button onClick={start} className="btn btn-primary flex-1" style={{ padding: "0.8rem" }}>
                  try again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
