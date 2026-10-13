import {
  ROOM_TTL_SECONDS, MAX_COMMENT, keys, cleanRoom, cleanName, cleanEmail, cleanRating, cleanRatedStep, cleanStepRatings,
  parseRecord, readBody, storeOr503, roomHasSpace,
} from "../lib/store.js";

/**
 * A student rates the workshop, or one step of it.
 *
 *   POST /api/feedback?room=default   body: { name, email, rating: 1-5, comment }
 *     the overall rating from the Finish screen. Sending again replaces it.
 *
 *   POST /api/feedback?room=default   body: { name, email, rating: 1-5, step: "build" }
 *     a mid-workshop rating from a step's Done button (step 5, "how's tonight
 *     going?"). Stored under stepRatings, next to the overall rating, so the
 *     two never overwrite each other.
 *
 * Write-only; the instructor reads feedback through /api/instructor.
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const db = storeOr503(res);
  if (!db) return;

  const room = cleanRoom(req.query?.room);
  const body = readBody(req);
  const name = cleanName(body.name);
  const email = cleanEmail(body.email);
  const rating = cleanRating(body.rating);
  const step = cleanRatedStep(body.step);
  const comment = String(body.comment || "").trim().slice(0, MAX_COMMENT);

  if (!name || !email) {
    return res.status(400).json({ ok: false, error: "bad_student", message: "Name and email are required." });
  }
  if (!rating) {
    return res.status(400).json({ ok: false, error: "bad_rating", message: "Rating must be a whole number from 1 to 5." });
  }
  if (body.step && !step) {
    return res.status(400).json({ ok: false, error: "bad_step", message: "That step doesn't take a rating." });
  }

  try {
    const key = keys.feedback(room);

    if (!(await roomHasSpace(db, key, email))) {
      return res.status(429).json({ ok: false, error: "room_full", message: "This room is full." });
    }

    const prev = parseRecord(await db.hget(key, email)) || {};
    const now = new Date().toISOString();
    const stepRatings = cleanStepRatings(prev.stepRatings);

    const record = {
      name,
      email,
      rating: step ? (cleanRating(prev.rating) || null) : rating,
      comment: step ? String(prev.comment || "") : comment,
      stepRatings: step ? { ...stepRatings, [step]: { rating, at: now } } : stepRatings,
      firstAt: prev.firstAt || now,
      at: step ? (prev.at || null) : now,
      updatedAt: now,
    };

    await db.hset(key, { [email]: JSON.stringify(record) });
    await db.expire(key, ROOM_TTL_SECONDS);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("feedback handler failed", err);
    return res.status(500).json({ ok: false, error: "server_error", message: "Could not reach the database." });
  }
}
