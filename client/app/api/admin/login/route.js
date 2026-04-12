import { NextResponse } from "next/server";
import crypto from "crypto";
import { issueToken, adminCookieAttrs } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function safeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const password = String(body?.password || "");
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) {
    return NextResponse.json({ error: "admin not configured" }, { status: 500 });
  }
  if (!password || !safeEqual(password, expected)) {
    return NextResponse.json({ error: "invalid password" }, { status: 401 });
  }
  const token = issueToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...adminCookieAttrs(), value: token });
  return res;
}
