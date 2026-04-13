import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  // Pull all recent gifts (30-day window) and aggregate in JS.
  // Capped at 10k rows which is plenty for MVP analytics.
  const { data: gifts, error: giftsError } = await supabase
    .from("gifts")
    .select("id, sender_id, receiver_id, gift_type, amount_cents, receiver_cut_cents, platform_cut_cents, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(10000);
  if (giftsError) return NextResponse.json({ error: giftsError.message }, { status: 500 });

  let totalRevenue = 0;
  let totalVolume = 0;
  const bySender = new Map();
  const byReceiver = new Map();
  const byGiftType = {};
  for (const g of gifts || []) {
    totalRevenue += g.platform_cut_cents;
    totalVolume  += g.amount_cents;
    bySender.set(g.sender_id,   (bySender.get(g.sender_id)   || 0) + g.amount_cents);
    byReceiver.set(g.receiver_id, (byReceiver.get(g.receiver_id) || 0) + g.receiver_cut_cents);
    byGiftType[g.gift_type] = (byGiftType[g.gift_type] || 0) + 1;
  }

  const topSenderIds   = [...bySender].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topReceiverIds = [...byReceiver].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const allIds = [...new Set([...topSenderIds, ...topReceiverIds].map(([id]) => id))];

  let userMap = {};
  if (allIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, username, device_id, balance_cents, created_at")
      .in("id", allIds);
    userMap = Object.fromEntries((users || []).map((u) => [u.id, u]));
  }

  // Total balances (coins currently held across all users)
  const { data: allUsers } = await supabase
    .from("users")
    .select("balance_cents");
  const coinsInCirculation = (allUsers || []).reduce((acc, u) => acc + Number(u.balance_cents || 0), 0);

  // Recent gifts (5 latest)
  const recent = (gifts || []).slice(0, 10).map((g) => ({
    ...g,
    sender: userMap[g.sender_id] || null,
    receiver: userMap[g.receiver_id] || null,
  }));

  return NextResponse.json({
    window_days: 30,
    total_gifts: (gifts || []).length,
    total_volume_cents: totalVolume,
    total_revenue_cents: totalRevenue,
    coins_in_circulation: coinsInCirculation,
    users_total: (allUsers || []).length,
    gifts_by_type: byGiftType,
    top_senders: topSenderIds.map(([id, amount]) => ({
      user: userMap[id] || { id },
      total_cents: amount,
    })),
    top_receivers: topReceiverIds.map(([id, amount]) => ({
      user: userMap[id] || { id },
      total_cents: amount,
    })),
    recent_gifts: recent,
  });
}
