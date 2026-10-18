import { Redis } from "@upstash/redis";
import { createClient } from "redis";
import { timingSafeEqual } from "node:crypto";

/**
 * Shared storage and validation for the workshop API.
 * Carried over from the Workshop 1 site (ADA110/outreach-workshop-site),
 * minus the level picker and, since revision 3, without a track field.
 *
 * One Redis hash per room for progress and one for feedback, both keyed by
 * the student's email. Both expire on their own, so old workshops clean
 * themselves up.
 *
 * Never stored: anything a student types into a "Make it yours" form (writing
 * samples, sign-offs, colors). The zip generator runs entirely in the browser
 * and never sends them here.
 */

/** Core steps, in order. Keep in sync with STEPS in js/app.js. */
export const MAIN_STEPS = [
  "what", "setup", "voice", "design", "three", "build", "host",
];

/** Step 0 sub-steps (0.1 to 0.5), tracked so the dashboard shows where prep stalls. Only 0.1 is required. 0.5 is the optional Vercel account. Keep in sync with SUBS in js/app.js. */
export const SUB_STEPS = ["setup-1", "setup-2", "setup-3", "setup-4", "setup-5"];

/** Side quests 1 to 8, ticked individually on step 6. Keep in sync with QUESTS in js/app.js. */
export const QUEST_STEPS = ["quest-1", "quest-2", "quest-3", "quest-4", "quest-5", "quest-6", "quest-7", "quest-8"];

export const STEPS = SUB_STEPS.concat(MAIN_STEPS, QUEST_STEPS);

/** The vibes a student can pick in the voice step: three presets, or their own. */
export const VERSIONS = ["polished", "warm", "playful", "custom"];

/** Steps that ask for a 1 to 5 rating on their Done button. */
export const RATED_STEPS = ["build"];

export const MAX_STUDENTS = 300;
export const MAX_NAME = 60;
export const MAX_EMAIL = 120;
export const MAX_COMMENT = 2000;
export const MAX_LIVE_URL = 200;
export const ROOM_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let redis = null;

/** Parse a stored value the way the Upstash client does: JSON if it is JSON, else the raw string. */
function parseStored(v) {
  if (v === null || v === undefined) return null;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

/**
 * Adapter for a standard Redis connection string (REDIS_URL, what Vercel's
 * Redis integration provides). Exposes only the commands the API uses, with
 * the same shapes as the Upstash client, so the API files don't change.
 */
export function redisUrlStore(url, create = createClient) {
  const client = create({ url });
  client.on("error", () => {}); // surfaced per command instead
  let connecting = null;
  const ready = () => {
    if (client.isReady) return Promise.resolve();
    if (!connecting) connecting = client.connect().catch((e) => { connecting = null; throw e; });
    return connecting;
  };
  return {
    async hget(key, field) { await ready(); return parseStored(await client.hGet(key, field)); },
    async hset(key, obj) { await ready(); return client.hSet(key, obj); },
    async hgetall(key) {
      await ready();
      const all = await client.hGetAll(key);
      const fields = Object.keys(all);
      if (!fields.length) return null;
      const out = {};
      for (const f of fields) out[f] = parseStored(all[f]);
      return out;
    },
    async hexists(key, field) { await ready(); return Number(await client.hExists(key, field)); },
    async hlen(key) { await ready(); return client.hLen(key); },
    async expire(key, seconds) { await ready(); return client.expire(key, seconds); },
    async scan(cursor, opts = {}) {
      await ready();
      const res = await client.scan(String(cursor), { MATCH: opts.match, COUNT: opts.count });
      return [res.cursor, res.keys];
    },
  };
}

export function getRedis() {
  // Local development (scripts/dev-server.mjs) swaps in an in-memory store.
  if (globalThis.__WORKSHOP_MEMORY_STORE__) return globalThis.__WORKSHOP_MEMORY_STORE__;
  if (!redis) {
    const hasRest = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    // Upstash REST credentials win if present; otherwise use a plain REDIS_URL.
    redis = !hasRest && process.env.REDIS_URL ? redisUrlStore(process.env.REDIS_URL) : Redis.fromEnv();
  }
  return redis;
}

export const keys = {
  students: (room) => `workshop3:${room}:students`,
  feedback: (room) => `workshop3:${room}:feedback`,
};

export function cleanRoom(value) {
  const room = String(value || "default")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
  return room || "default";
}

export function cleanName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME);
}

/** A lowercased email, or "" if it doesn't look like one. */
export function cleanEmail(value) {
  const email = String(value || "").trim().toLowerCase().slice(0, MAX_EMAIL);
  return EMAIL_RE.test(email) ? email : "";
}

/** Keep only the step flags we know about, as real booleans. */
export function cleanSteps(input) {
  const out = {};
  if (input && typeof input === "object") {
    for (const step of STEPS) if (input[step] === true) out[step] = true;
  }
  return out;
}

/** The step the student is looking at right now, if it's a known step or "finish". */
export function cleanViewing(value) {
  const v = String(value || "");
  return MAIN_STEPS.indexOf(v) >= 0 || v === "finish" ? v : "";
}

/** One of the vibes, or "". */
export function cleanVersion(value) {
  const v = String(value || "").toLowerCase();
  return VERSIONS.indexOf(v) >= 0 ? v : "";
}

/** A deploy date as YYYY-MM-DD (what an <input type="date"> sends), or "". */
export function cleanDeployDate(value) {
  const v = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : "";
}

/** A deploy time as HH:MM (24h, what an <input type="time"> sends), or "". */
export function cleanDeployTime(value) {
  const v = String(value || "").trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : "";
}

/** Gallery opt-in: a real boolean. The page sends it on every save; the box is ticked by default. */
export function cleanGalleryOptIn(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

/**
 * The student's live link, pasted on step 6: https only, no whitespace, 200
 * characters max, or "". Only this and the name are ever shown on gallery.html.
 */
export function cleanLiveUrl(value) {
  const v = String(value || "").trim();
  if (!v || v.length > MAX_LIVE_URL) return "";
  if (!/^https:\/\/[^\s"'<>\\]{4,}$/i.test(v)) return "";
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" || !u.hostname.includes(".")) return "";
  } catch {
    return "";
  }
  return v;
}

/**
 * What the public gallery shows for one student record, or null when they are
 * not in it: a live link plus the opt-in. Name, link and version only.
 */
export function galleryEntry(rec) {
  if (!rec || !cleanGalleryOptIn(rec.galleryOptIn)) return null;
  const liveUrl = cleanLiveUrl(rec.liveUrl);
  if (!liveUrl) return null;
  return { name: cleanName(rec.name), liveUrl, version: cleanVersion(rec.version) };
}

/** A whole number from 1 to 5, or null. */
export function cleanRating(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

/** A step id that takes a rating on its Done button ("build" for step 5), or "". */
export function cleanRatedStep(value) {
  const v = String(value || "");
  return RATED_STEPS.indexOf(v) >= 0 ? v : "";
}

/** Per-step ratings as stored: { build: { rating: 4, at: "2026-..." } }. Keeps only known steps and valid ratings. */
export function cleanStepRatings(input) {
  const out = {};
  if (input && typeof input === "object") {
    for (const step of RATED_STEPS) {
      const r = input[step];
      const rating = r && cleanRating(r.rating);
      if (rating) out[step] = { rating, at: typeof r.at === "string" ? r.at : null };
    }
  }
  return out;
}

/** Upstash deserializes JSON on read; older writes may still be strings. */
export function parseRecord(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch {
      return {};
    }
  }
  return req.body && typeof req.body === "object" ? req.body : {};
}

/** The Redis client, or null after answering 503 when no store is connected. */
export function storeOr503(res) {
  try {
    return getRedis();
  } catch {
    res.status(503).json({
      ok: false,
      error: "storage_unconfigured",
      message: "No database is connected yet. Connect a Redis database to the Vercel project (REDIS_URL, or Upstash KV_REST_API_URL / KV_REST_API_TOKEN).",
    });
    return null;
  }
}

/**
 * Whether the request carries the instructor key. Returns "unconfigured" when
 * the site has no key set, so the dashboard can say so instead of failing open.
 */
export function instructorCheck(req) {
  const expected = process.env.INSTRUCTOR_KEY || "";
  if (!expected) return "unconfigured";
  const given = Buffer.from(String(req.headers["x-instructor-key"] || ""));
  const want = Buffer.from(expected);
  return given.length === want.length && timingSafeEqual(given, want);
}

/** Refuse a new entry once a room's hash is full; existing entries always pass. */
export async function roomHasSpace(db, key, id) {
  if (await db.hexists(key, id)) return true;
  return (await db.hlen(key)) < MAX_STUDENTS;
}
