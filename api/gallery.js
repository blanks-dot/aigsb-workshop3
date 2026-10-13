import { keys, cleanRoom, parseRecord, storeOr503, galleryEntry } from "../lib/store.js";

/**
 * The class gallery, for gallery.html. No key: it is the one public read.
 *
 *   GET /api/gallery?room=default
 *   -> { ok, room, entries: [{ name, liveUrl, version }] }
 *
 * A student is in it when their progress record has galleryOptIn true (the box
 * on step 6, ticked by default) and a live link that passed cleanLiveUrl.
 * Nothing else from the record leaves the server: no email, no progress, no
 * feedback. Unticking the box on step 6 removes them on the next save.
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const db = storeOr503(res);
  if (!db) return;

  const room = cleanRoom(req.query?.room);

  try {
    const raw = await db.hgetall(keys.students(room));
    const entries = Object.values(raw || {})
      .map((r) => galleryEntry(parseRecord(r)))
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
    return res.status(200).json({ ok: true, room, entries });
  } catch (err) {
    console.error("gallery handler failed", err);
    return res.status(500).json({ ok: false, error: "server_error", message: "Could not reach the database." });
  }
}
