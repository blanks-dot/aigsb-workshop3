/*
 * Zip generator for the workshop starters. Runs entirely in the browser.
 *
 * - fillSkill():    take a starter SKILL.md and the student's "Make it yours"
 *                   form values, and fill the bracketed placeholders inside the
 *                   "## Make it yours" section. Blank fields leave their
 *                   placeholder in place. Everything from the next "## " heading
 *                   on (the locked parts) is copied byte for byte.
 * - makeZip():      a plain "stored" (uncompressed) zip with one entry,
 *                   <skill>/SKILL.md. The folder name has to match the skill's
 *                   name, which is why it's inside the zip.
 * - buildSkillZip(): the two together.
 *
 * Nothing here sends the form values anywhere or saves them.
 * Also loaded by scripts/test-zip.mjs, so it avoids browser-only APIs at load time.
 */
(function (root) {
  "use strict";

  var EDIT_HEADING = /^## Make it yours/;

  /* ---------- helpers ---------- */

  function clean(v) {
    return String(v == null ? "" : v).replace(/\r\n/g, "\n").trim();
  }
  function list(v) {
    if (Array.isArray(v)) return v.map(clean).filter(Boolean);
    return clean(v).split("\n").map(function (s) { return s.replace(/^\s*[-*]\s*/, "").trim(); }).filter(Boolean);
  }
  /** "a, b, c" or one per line -> ["a", "b", "c"] */
  function words(v) {
    if (Array.isArray(v)) return v.map(clean).filter(Boolean);
    return clean(v).split(/\n|,/).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  /** Samples: separated by a line of --- (or three or more blank lines). */
  function samples(v) {
    if (Array.isArray(v)) return v.map(clean).filter(Boolean);
    return clean(v).split(/\n[ \t]*-{3,}[ \t]*\n|\n{3,}/).map(clean).filter(Boolean);
  }

  /**
   * Replace the "- [example: ...]" lines that follow a header line with the
   * student's own items. Only the first run of example lines after the header
   * is touched; nothing happens when items is empty.
   */
  function replaceList(lines, headerRe, items) {
    if (!items.length) return;
    for (var i = 0; i < lines.length; i++) {
      if (!headerRe.test(lines[i])) continue;
      var start = i + 1;
      while (start < lines.length && /^\s*$/.test(lines[start])) start++;
      var end = start;
      while (end < lines.length && /^- \[example:/.test(lines[end])) end++;
      if (end === start) return;
      var repl = items.map(function (t) { return "- " + t; });
      lines.splice.apply(lines, [start, end - start].concat(repl));
      return;
    }
  }

  /**
   * fields (all optional; blank or missing fields keep their placeholder):
   *   name      string, the student's name: replaces every [name] in the file (the
   *             "Hi, I'm [name]" line in the design starters). Blank leaves [name].
   *   version   "Polished" | "Warm" | "Playful"
   *   samples   string (samples separated by --- lines) or array
   *   words     string ("a, b, c" or one per line) or array
   *   signoff   string
   *   neverSay  array of up to 3 strings            (voice)
   *   accent    string, e.g. "#24426B" or "navy #24426B"   (design)
   *   font      string, e.g. "Poppins + Source Sans 3"
   *   photo     "yes" | "no"
   *   sites     array of up to 2 links, or one per line ("Sites I like:", design)
   *   feel      string, e.g. "clear, structured, confident"
   *   neverDo   array of up to 3 strings            (design)
   */
  function fillSkill(template, fields) {
    fields = fields || {};
    var text = String(template).replace(/\r\n/g, "\n");
    var all = text.split("\n");

    // find the editable section: from "## Make it yours" to the next "## "
    var from = -1, to = all.length;
    for (var i = 0; i < all.length; i++) {
      if (from < 0 && EDIT_HEADING.test(all[i])) { from = i; continue; }
      if (from >= 0 && /^## /.test(all[i])) { to = i; break; }
    }
    if (from < 0) throw new Error("SKILL.md has no \"## Make it yours\" section.");

    var head = all.slice(0, from);
    var edit = all.slice(from, to);
    var rest = all.slice(to);

    var version = clean(fields.version);
    var accent = clean(fields.accent);
    var font = clean(fields.font).replace(/^"|"$/g, "");
    var photo = clean(fields.photo).toLowerCase();
    var feel = words(fields.feel).join(", ");
    var signoff = clean(fields.signoff);

    edit = edit.map(function (line) {
      if (version && /^Version:/.test(line)) return "Version: " + version;
      if (accent && /^Accent color:/.test(line)) return "Accent color: " + accent;
      if (font && /^Font pair:/.test(line)) return "Font pair: \"" + font + "\"";
      if (photo && /^Photo:/.test(line)) return "Photo: " + (photo === "yes" ? "yes, use my photo" : "no photo");
      if (feel && /^3 words for how it should feel:/.test(line)) return "3 words for how it should feel: " + feel;
      return line;
    });

    // samples: [sample 1] .. [sample 3], extra samples get their own fenced block
    var s = samples(fields.samples);
    if (s.length) {
      var lastFence = -1;
      edit = edit.map(function (line, idx) {
        var m = /^\[sample (\d+)\]$/.exec(line);
        if (!m) return line;
        var n = Number(m[1]) - 1;
        if (s[n] !== undefined) { lastFence = idx; return s[n]; }
        return line;
      });
      if (s.length > 3) {
        // insert after the fence that follows the last filled sample
        var at = -1;
        for (var k = 0; k < edit.length; k++) if (/^\[sample 3\]$|^---$/.test(edit[k]) && k > lastFence) { at = k; break; }
        if (at >= 0) {
          var extra = [];
          s.slice(3).forEach(function (t) { extra.push(t, "---"); });
          edit.splice.apply(edit, [at + 1, 0].concat(extra));
        }
      }
    }

    replaceList(edit, /^Words and phrases I actually use:/, words(fields.words));
    replaceList(edit, /^How I sign off:/, signoff ? [signoff] : []);
    replaceList(edit, /^Never say/, list(fields.neverSay).slice(0, 3));
    replaceList(edit, /^Never do/, list(fields.neverDo).slice(0, 3));
    replaceList(edit, /^Sites I like:/, list(fields.sites).slice(0, 2));

    var out = head.concat(edit, rest).join("\n");
    var name = clean(fields.name);
    if (name) out = out.replace(/\[name\]/g, name);
    return out;
  }

  /** The text from the first heading after "## Make it yours" to the end: the part that must not change. */
  function lockedPart(template) {
    var all = String(template).replace(/\r\n/g, "\n").split("\n");
    var from = -1;
    for (var i = 0; i < all.length; i++) {
      if (from < 0 && EDIT_HEADING.test(all[i])) { from = i; continue; }
      if (from >= 0 && /^## /.test(all[i])) return all.slice(i).join("\n");
    }
    return "";
  }

  /* ---------- zip writer (stored, no compression) ---------- */

  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function utf8(s) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(s);
    return Uint8Array.from(Buffer.from(s, "utf8")); // Node fallback
  }

  function dosTime(d) {
    return {
      time: ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() / 2) & 31),
      date: (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31),
    };
  }

  /** files: [{ name: "voice/SKILL.md", data: Uint8Array }] */
  function makeZip(files, when) {
    var t = dosTime(when || new Date());
    var parts = [], central = [], offset = 0;

    files.forEach(function (f) {
      var name = utf8(f.name), data = f.data, crc = crc32(data);
      var local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);       // version needed
      local.setUint16(6, 0x0800, true);   // UTF-8 names
      local.setUint16(8, 0, true);        // stored
      local.setUint16(10, t.time, true);
      local.setUint16(12, t.date, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, data.length, true);
      local.setUint32(22, data.length, true);
      local.setUint16(26, name.length, true);
      local.setUint16(28, 0, true);
      parts.push(new Uint8Array(local.buffer), name, data);

      var cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true);
      cen.setUint16(4, 0x031e, true);     // made by: unix, 3.0
      cen.setUint16(6, 20, true);
      cen.setUint16(8, 0x0800, true);
      cen.setUint16(10, 0, true);
      cen.setUint16(12, t.time, true);
      cen.setUint16(14, t.date, true);
      cen.setUint32(16, crc, true);
      cen.setUint32(20, data.length, true);
      cen.setUint32(24, data.length, true);
      cen.setUint16(28, name.length, true);
      cen.setUint16(30, 0, true);
      cen.setUint16(32, 0, true);
      cen.setUint16(34, 0, true);
      cen.setUint16(36, 0, true);
      cen.setUint32(38, 0x81a40000, true); // -rw-r--r--
      cen.setUint32(42, offset, true);
      central.push(new Uint8Array(cen.buffer), name);

      offset += 30 + name.length + data.length;
    });

    var cenSize = central.reduce(function (n, p) { return n + p.length; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, cenSize, true);
    end.setUint32(16, offset, true);

    var all = parts.concat(central, [new Uint8Array(end.buffer)]);
    var total = all.reduce(function (n, p) { return n + p.length; }, 0);
    var out = new Uint8Array(total), pos = 0;
    all.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }

  /**
   * Build one skill zip: <skill>/SKILL.md, filled in from the form.
   * skill: the folder name inside the zip (must match the skill's name line)
   * template: the starter SKILL.md as text
   * fields: see fillSkill
   */
  function buildSkillZip(skill, template, fields, when) {
    return makeZip([{ name: skill + "/SKILL.md", data: utf8(fillSkill(template, fields)) }], when);
  }

  root.SkillZip = {
    fillSkill: fillSkill,
    lockedPart: lockedPart,
    makeZip: makeZip,
    buildSkillZip: buildSkillZip,
    crc32: crc32,
  };
})(typeof window !== "undefined" ? window : globalThis);
