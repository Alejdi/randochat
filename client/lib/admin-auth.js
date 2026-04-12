import crypto from "crypto";

const COOKIE_NAME = "rc_admin";
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function secret() {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 16) {
    throw new Error("ADMIN_SECRET env var must be set (min 16 chars)");
  }
  return s;
}

function sign(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueToken() {
  const payload = `${Date.now() + TTL_MS}:admin`;
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string") return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = sign(payload);
  let ok = false;
  try {
    ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
  if (!ok) return false;
  const [expStr] = payload.split(":");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return true;
}

export function cookieName() {
  return COOKIE_NAME;
}

export function isAdminRequest(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

export function adminCookieAttrs() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  };
}
