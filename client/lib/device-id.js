const KEY = "rc_device_id";

// Stable per-browser UUID. Generated on first visit and persisted in
// localStorage. Shapes like `rc_...` to be distinguishable in logs.
export function getDeviceId() {
  if (typeof window === "undefined") return null;
  let id = null;
  try { id = localStorage.getItem(KEY); } catch {}
  if (id && id.length >= 16) return id;

  let uuid;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    uuid = crypto.randomUUID();
  } else {
    // Fallback for ancient browsers
    uuid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
  }
  id = `rc_${uuid}`;
  try { localStorage.setItem(KEY, id); } catch {}
  return id;
}
