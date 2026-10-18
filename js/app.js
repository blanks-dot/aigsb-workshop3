/*
 * AI@GSB Workshop 3: student site mechanics.
 *
 * Structure carried over from the Workshop 2 site (and Abhi's Workshop 1
 * site before it): name + email sign-in, ?room=, one step at a time with a
 * side rail, steps open in order, progress saved in the browser and synced
 * to /api/progress keyed by email, "Now you know" after each step, copy
 * cards, a Stuck? drawer.
 *
 * New for Workshop 3: the version picker, the "Make it yours" forms that fill
 * a starter SKILL.md and zip it in the browser, the step 5 rating, the live
 * link + gallery opt-in (step 6, in the room), the deploy date fallback, and
 * the ladder at the top of the Stuck? drawer. Revision 3 removed the track
 * toggle: there is one path, the forms, with "build it with Claude" as an aside.
 * Revision 4: rail groups WHY / VOICE / DESIGN / BUILD / HOST, step 6 hosts with
 * Vercel Drop, the forms are grouped by the formula (samples + tone + nevers,
 * assets + vibe + nevers), and the GSB voice starter downloads from step 2.
 *
 * Content lives in index.html. This file only wires it up.
 * Form values (writing samples, colors) are never saved or sent anywhere.
 */
(function () {
  "use strict";

  /* ---------- config ---------- */

  const STEPS = ["what", "setup", "voice", "design", "three", "build", "host"]; // Revision 6: picking a version is part of the voice step // in order, then "finish"
  const SUBS = ["setup-1", "setup-2", "setup-3"]; // Revision 7: open Claude, raw material, Vercel
  const QUESTS = []; // Revision 7: no side quests, Go further is prompts
  const EXTRAS = ["further"]; // Go further: always open, never counted, sits between step 6 and Finish
  const REQUIRED_SUBS = []; // Revision 5: nothing in step 0 is required. Skip anything you've already done.
  const CHECKPOINTS = {}; // Revision 6: no star badges in the rail // 2 = the bigger one (step 5, Build it once)
  const RATED = { build: 1 }; // steps whose Done button asks for a 1 to 5 rating (step 5)
  const KEY = "aigsb-workshop3-v1";

  const VERSION_NAME = { polished: "Polished", warm: "Warm", playful: "Playful", custom: "Your own" }; // Revision 6: "custom" = start from scratch
  const DESIGN_SKILL = { polished: "design-polished", warm: "design-warm", playful: "design-playful", custom: "design-custom" };
  const SWATCHES = {
    polished: [["deep navy", "#24426B"], ["charcoal", "#1F1E1B"], ["Stanford red", "#8C1515"], ["forest", "#3E6B4A"]],
    warm: [["clay", "#B4532A"], ["forest", "#3E6B4A"], ["pink", "#E03870"], ["deep navy", "#24426B"]],
    playful: [["sky blue", "#38B6FF"], ["sunshine", "#F5A623"], ["lime", "#7CB342"], ["pink", "#E03870"]],
    custom: [["ink", "#141413"], ["clay", "#B4532A"], ["deep navy", "#24426B"], ["forest", "#3E6B4A"]],
  };
  const FONTS = ["Playfair Display + Source Sans 3", "Fraunces + Inter", "Nunito + JetBrains Mono"];
  const DEFAULT_FONT = { polished: FONTS[0], warm: FONTS[1], playful: FONTS[2], custom: "" };
  const DEFAULT_FEEL = { polished: "clear, structured, confident", warm: "warm, direct, bright", playful: "playful, candid, light", custom: "your 3 words" };

  const params = new URLSearchParams(location.search);
  const ROOM = (params.get("room") || "default").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) || "default";
  const API = "/api/progress?room=" + encodeURIComponent(ROOM);
  const LOCAL = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname);
  const DRAFT = params.get("draft") === "1" || (LOCAL && params.get("draft") !== "0");
  if (DRAFT) document.body.classList.add("draft");

  const reduceMotion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- state + sync ---------- */

  const state = { name: "", email: "", version: "", deployDate: "", deployTime: "", liveUrl: "", galleryOptIn: true, step5Rating: 0, steps: {}, feedback: null, notes: {} };
  const LIVE_RE = /^https:\/\/[^\s]{4,}$/i; // same rule as lib/store.js cleanLiveUrl: https only, 200 chars max
  let syncOff = false;
  let saveTimer = null;
  let viewing = null;
  let busy = false;
  const SESSION = Math.random().toString(36).slice(2, 12); // one per page load, for the dashboard's step timing

  function load() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY) || "null");
      if (p && typeof p === "object") {
        ["name", "email", "deployDate", "deployTime", "liveUrl"].forEach((k) => { if (typeof p[k] === "string") state[k] = p[k]; });
        if (!LIVE_RE.test(state.liveUrl) || state.liveUrl.length > 200) state.liveUrl = "";
        if (VERSION_NAME[p.version]) state.version = p.version;
        state.galleryOptIn = p.galleryOptIn !== false; // opt-out: on unless they unticked it
        if (Number.isInteger(p.step5Rating)) state.step5Rating = p.step5Rating;
        ["steps", "notes"].forEach((k) => { if (p[k] && typeof p[k] === "object") state[k] = p[k]; });
        if (p.feedback && typeof p.feedback === "object") state.feedback = p.feedback;
      }
    } catch (e) { /* private window or blocked storage */ }
  }
  function saveLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function pushRemote() {
    if (syncOff || !state.name || !state.email) return Promise.resolve();
    const steps = {};
    STEPS.concat(SUBS, QUESTS).forEach((s) => { if (state.steps[s]) steps[s] = true; });
    return fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: state.name, email: state.email, steps, viewing: viewing || "", session: SESSION,
        version: state.version, deployDate: state.deployDate, deployTime: state.deployTime, liveUrl: state.liveUrl, galleryOptIn: state.galleryOptIn,
      }),
    }).then((r) => r.json().catch(() => ({})).then((j) => {
      if (!r.ok && j && j.error === "storage_unconfigured") syncOff = true;
    })).catch(() => {});
  }
  function save() {
    saveLocal();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(pushRemote, 400);
  }
  load(); // before anything renders, so forms, radios and the checklist see the saved state

  /* ---------- helpers ---------- */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $all = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((resolve, reject) => {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      ta.remove();
    });
  }
  function download(filename, blobOrText, type) {
    const blob = blobOrText instanceof Blob ? blobOrText : new Blob([blobOrText], { type: type || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function srcText(id) {
    const el = document.getElementById("src-" + id);
    return el ? el.textContent.replace(/^\n/, "").replace(/\s+$/, "") : "";
  }
  const versionName = () => VERSION_NAME[state.version] || "";
  /* The signed-in name fills "[name]" in prompt cards and in the zipped skills (keep [brackets] for unknown facts). */
  const fullName = () => state.name.trim().replace(/\s+/g, " ");
  const firstName = () => fullName().split(" ")[0] || "";

  /* ---------- confetti ---------- */

  const canvas = $("#confetti");
  const ctx = canvas.getContext("2d");
  let parts = [];
  let raf = 0;
  const PALETTE = { why: ["#FF6A3D", "#FFD23F", "#FFE1D6"], voice: ["#7C5CFF", "#FFD23F", "#E6DFFF"], design: ["#14B8A6", "#FFD23F", "#D4F3EE"], build: ["#F2B705", "#141413", "#FCEFB4"], deploy: ["#2B4BFF", "#FFD23F", "#DCE2FF"], core: ["#141413", "#F2B705", "#FF6A3D", "#7C5CFF", "#14B8A6", "#2B4BFF"], finish: ["#2B4BFF", "#F2B705", "#FF6A3D", "#7C5CFF", "#14B8A6"] };
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function burst(x, y, n, colors, power) {
    return; // Revision 6: no confetti, the deck is calm
    if (reduceMotion) return;
    if (!raf) sizeCanvas();
    power = power || 10;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const v = power * (0.45 + Math.random() * 0.75);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 4 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: colors[i % colors.length], shape: i % 3, born: performance.now(), life: 1500 + Math.random() * 900 });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => t - p.born < p.life);
    parts.forEach((p) => {
      p.vy += 0.32; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      const fade = 1 - (t - p.born) / p.life;
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, fade * 1.6)); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      if (p.shape === 0) ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      else if (p.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, p.r / 2.4, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.moveTo(0, -p.r / 2); ctx.lineTo(p.r / 2, p.r / 2); ctx.lineTo(-p.r / 2, p.r / 2); ctx.fill(); }
      ctx.restore();
    });
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  addEventListener("resize", () => { if (raf) sizeCanvas(); });

  /* ---------- sections ---------- */

  const sections = {};
  $all(".step[data-step]").forEach((s) => { sections[s.dataset.step] = s; });
  const ORDER = STEPS.concat(EXTRAS, ["finish"]);
  const isExtra = (id) => EXTRAS.indexOf(id) >= 0;
  const TITLES = {}; const LEARNED = {}; const PART = {};
  ORDER.forEach((id) => {
    const s = sections[id];
    TITLES[id] = s.dataset.title;
    LEARNED[id] = s.dataset.learned || "";
    PART[id] = s.dataset.part || "core";
  });

  const isDone = (id) => !!state.steps[id];
  const doneCount = () => STEPS.filter(isDone).length;
  /* The first step not done yet, or "finish" once they're all done. */
  function currentId() {
    for (const id of STEPS) if (!isDone(id)) return id;
    return "finish";
  }
  const idx = (id) => ORDER.indexOf(id);
  /* Revision 5: every step is open. Students can skip ahead to anything they've already done. */
  function reachable(id) {
    return !!sections[id];
  }
  /* The next step after this one that isn't done yet, or "finish". Used after completing or skipping a
     step, so finishing step 4 out of order never throws someone back to a step they skipped on purpose. */
  function nextAfter(id) {
    const i = STEPS.indexOf(id);
    for (const s of STEPS.slice(i + 1)) if (!isDone(s)) return s;
    return "finish";
  }
  function stepLabel(id) {
    const n = sections[id].dataset.num;
    return n !== undefined ? "Step " + n : TITLES[id];
  }

  /* ---------- rail ---------- */

  const rail = $("#rail");
  const railPill = $(".rail-pill", rail);
  const railItems = {};
  (function buildRail() {
    let lastGroup = null;
    const addGroup = (group, part) => {
      const g = document.createElement("li");
      g.className = "rail-group";
      g.setAttribute("aria-hidden", "true");
      g.dataset.part = part;
      g.textContent = group;
      rail.appendChild(g);
    };
    ORDER.forEach((id) => {
      const s = sections[id];
      const group = s.dataset.group || "Wrap up";
      if (group !== lastGroup) { addGroup(group, s.dataset.part); lastGroup = group; }
      const li = document.createElement("li");
      li.className = "rail-item" + (CHECKPOINTS[id] ? " checkpoint" : "");
      li.dataset.part = s.dataset.part || "core";
      const num = s.dataset.num !== undefined ? s.dataset.num : (s.dataset.icon || "✓");
      const sub = s.dataset.subTitle || s.dataset.when || "";
      li.innerHTML = '<button type="button"><span class="node"><span class="n">' + esc(num) + '</span><svg class="tick"><use href="#i-check"/></svg></span>' +
        '<span class="rail-text"><span class="rail-title">' + esc(TITLES[id]) + "</span>" + (sub ? '<span class="rail-sub">' + esc(sub) + "</span>" : "") + "</span></button>";
      li.querySelector("button").addEventListener("click", () => go(id));
      rail.appendChild(li);
      railItems[id] = li;
    });
  })();

  function placeRailPill() {
    const li = railItems[viewing];
    if (!li) return;
    const horizontal = getComputedStyle(rail).display === "flex";
    const btn = li.querySelector("button");
    if (horizontal) {
      railPill.style.height = btn.offsetHeight + "px";
      railPill.style.width = btn.offsetWidth + "px";
      railPill.style.transform = "translate(" + li.offsetLeft + "px," + li.offsetTop + "px)";
      const sc = $(".rail-scroll");
      const left = li.offsetLeft - sc.clientWidth / 2 + li.offsetWidth / 2;
      sc.scrollTo({ left: Math.max(0, left), behavior: reduceMotion ? "auto" : "smooth" });
    } else {
      railPill.style.width = "";
      railPill.style.height = btn.offsetHeight + "px";
      railPill.style.transform = "translateY(" + li.offsetTop + "px)";
    }
  }
  addEventListener("resize", () => { placeRailPill(); });

  /* progress bar */
  const bar = $("#progress-bar");
  const segs = {};
  STEPS.forEach((id) => {
    const i = document.createElement("i");
    i.style.setProperty("--seg", getComputedStyle(railItems[id]).getPropertyValue("--rc") || "#141413");
    bar.appendChild(i);
    segs[id] = i;
  });

  function paintNav() {
    const cur = currentId();
    ORDER.forEach((id) => {
      const li = railItems[id];
      const done = id === "finish" ? cur === "finish" : isDone(id);
      li.classList.toggle("done", done);
      li.classList.toggle("current", id === viewing);
      li.classList.toggle("locked", !reachable(id));
      const btn = li.querySelector("button");
      btn.setAttribute("aria-current", id === viewing ? "step" : "false");
      btn.setAttribute("aria-label", TITLES[id] + (CHECKPOINTS[id] ? " (checkpoint)" : "") + (done ? ", done" : !reachable(id) ? ", locked" : ""));
    });
    STEPS.forEach((id) => segs[id].classList.toggle("done", isDone(id)));
    $("#progress-text").innerHTML = doneCount() + " of " + STEPS.length + ' <span class="lbl">done</span>';
    placeRailPill();
    paintBackbar();
  }

  function paintBackbar() {
    const cur = currentId();
    const show = viewing && !isExtra(viewing) && viewing !== cur && $("#app") && !$("#app").hidden && idx(viewing) < idx(cur);
    const bb = $("#backbar");
    bb.hidden = !show;
    if (show) $("#backbar-text").textContent = "You're looking back at " + stepLabel(viewing) + ". " + (cur === "finish" ? "You've finished every step" : "You're up to " + stepLabel(cur) + ": " + TITLES[cur]);
  }
  $("#backbar-go").addEventListener("click", () => go(currentId()));
  $("#backbar-go").textContent = "Back to where you are →";

  /* ---------- version (step 1) ---------- */

  function paintVersion() {
    const v = state.version;
    const chip = $("#version-chip");
    chip.hidden = !v || $("#app").hidden;
    chip.textContent = v ? VERSION_NAME[v] : "";
    chip.dataset.version = v || "";
    $all(".version-card").forEach((c) => c.classList.toggle("chosen", c.dataset.version === v));
    $all(".pick-version").forEach((b) => { b.textContent = b.dataset.version === v ? "Your vibe ✓" : "This one"; });
    $all("[data-version-name]").forEach((el) => { el.textContent = v ? VERSION_NAME[v] : "your version"; });
    $all("[data-design-name]").forEach((el) => { el.textContent = v ? DESIGN_SKILL[v] : "design-…"; });
    const gate = $("#version-gate");
    if (gate) gate.hidden = !!v;
    const tc = $("#thumb-chip-text");
    if (tc) tc.textContent = v ? VERSION_NAME[v] : "Warm";
    $all('.myform input[type="radio"][name$="-version"]').forEach((r) => { r.checked = r.value === v; });
    $all(".mf-own").forEach((el) => { el.hidden = v !== "custom"; });
    $all(".copy-card[data-copy]").filter((c) => VERSION_CARDS[c.dataset.copy]).forEach(renderCopyCard);
    if (viewing === "version" && !isDone("version")) renderFooter("version");
  }
  function setVersion(v, fromForm) {
    if (!VERSION_NAME[v]) return;
    const changed = state.version !== v;
    const ownFlip = (state.version === "custom") !== (v === "custom");
    state.version = v;
    save();
    paintVersion();
    if (changed && !fromForm) {
      $all(".myform").forEach((f) => renderForm(f));
      toast(VERSION_NAME[v] + ". It's in the header now");
      const card = $('.version-card[data-version="' + v + '"]');
      if (card) { const r = card.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 40, 40, PALETTE.voice, 8); }
    } else if (changed && fromForm) {
      $all(".myform").forEach((f) => { if (!f.contains(document.activeElement) || (ownFlip && f.dataset.kind === "design")) renderForm(f); });
      $all('.myform[data-kind="design"]').forEach((f) => renderSwatches(f));
    }
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".pick-version");
    if (b) setVersion(b.dataset.version);
  });

  /* ---------- step footers ---------- */

  function renderFooter(id) {
    if (id === "finish") return;
    const sec = sections[id];
    let foot = $(".step-foot", sec);
    if (!foot) { foot = document.createElement("div"); foot.className = "step-foot"; sec.appendChild(foot); }
    let learned = $(".learned", sec);
    foot.innerHTML = "";
    if (isExtra(id)) {
      const cur = currentId();
      const n = document.createElement("button");
      n.type = "button"; n.className = "btn ghost";
      n.textContent = cur === "finish" ? "Finish →" : "Back to " + (sections[cur].dataset.num !== undefined ? stepLabel(cur) + ": " : "") + TITLES[cur] + " →";
      n.addEventListener("click", () => go(cur));
      foot.appendChild(n);
      const st = document.createElement("button");
      st.type = "button"; st.className = "stuck-inline"; st.textContent = "Stuck?";
      st.addEventListener("click", () => openDrawer(id));
      foot.appendChild(st);
      return;
    }
    let nextId = ORDER[idx(id) + 1];
    while (nextId && isExtra(nextId)) nextId = ORDER[idx(nextId) + 1];
    if (isDone(id)) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn complete is-done";
      b.innerHTML = '<svg class="tick"><use href="#i-check"/></svg> Done';
      foot.appendChild(b);
      if (nextId && reachable(nextId)) {
        const n = document.createElement("button");
        n.type = "button"; n.className = "btn ghost";
        n.textContent = (nextId === "finish" ? "Finish" : "Next: " + TITLES[nextId]) + " →";
        n.addEventListener("click", () => go(nextId));
        foot.appendChild(n);
      }
      if (!learned && LEARNED[id]) {
        learned = document.createElement("p");
        learned.className = "learned";
        learned.textContent = LEARNED[id];
        sec.appendChild(learned);
      }
    } else {
      if (learned) learned.remove();
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn complete";
      b.innerHTML = '<svg class="tick"><use href="#i-check"/></svg><span>' + (id === "what" ? "Got it, let's go" : id === "setup" ? "I'm set up" : "I've done this step") + "</span> →";
      b.addEventListener("click", () => { if (RATED[id]) askRating(id, foot); else completeStep(id); });
      foot.appendChild(b);
      if (id === "version") {
        b.disabled = !state.version;
        const note = document.createElement("span");
        note.className = "foot-note";
        note.textContent = state.version ? "Your version is " + VERSION_NAME[state.version] : "Pick a version first";
        foot.appendChild(note);
      }
      /* Revision 5: every step can be skipped. Skipping doesn't tick it, so it stays in the progress bar. */
      if (id !== "what") {
        const sk = document.createElement("button");
        sk.type = "button"; sk.className = "linkish skip-step";
        sk.textContent = "Skip for now →";
        sk.addEventListener("click", () => go(nextAfter(id)));
        foot.appendChild(sk);
      }
      const st = document.createElement("button");
      st.type = "button"; st.className = "stuck-inline"; st.textContent = "Stuck?";
      st.addEventListener("click", () => openDrawer(id));
      foot.appendChild(st);
    }
  }

  /* Step 5: a quick 1 to 5 before the step completes. Sent to /api/feedback with the step id. */
  function askRating(id, foot) {
    if ($(".rate-ask", foot)) return;
    const box = document.createElement("div");
    box.className = "rate-ask";
    box.innerHTML = '<p class="rate-q">Quick one. How\'s tonight going?</p><div class="rate-row" role="radiogroup" aria-label="1 to 5">' +
      [1, 2, 3, 4, 5].map((n) => '<button type="button" class="rate-n" data-n="' + n + '" role="radio" aria-checked="false">' + n + "</button>").join("") +
      '</div><div class="rate-foot"><span class="small">1 is rough, 5 is great. Goes to the team</span><button type="button" class="linkish rate-skip">Skip</button></div>';
    foot.appendChild(box);
    $all(".rate-n", box).forEach((b) => b.addEventListener("click", () => {
      const n = Number(b.dataset.n);
      $all(".rate-n", box).forEach((x) => { x.classList.toggle("on", Number(x.dataset.n) <= n); x.setAttribute("aria-checked", String(x === b)); });
      state.step5Rating = n;
      saveLocal();
      fetch("/api/feedback?room=" + encodeURIComponent(ROOM), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: state.name, email: state.email, rating: n, step: id }),
      }).catch(() => {});
      toast("Thanks. Noted: " + n + " of 5");
      setTimeout(() => { box.remove(); completeStep(id); }, 350);
    }));
    $(".rate-skip", box).addEventListener("click", () => { box.remove(); completeStep(id); });
    box.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  /* ---------- navigation ---------- */

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  function focusHeading(sec) {
    const h = $("h2", sec);
    if (!h) return;
    h.setAttribute("tabindex", "-1");
    h.focus({ preventScroll: true });
  }
  function onShow(id) {
    if (window.__listen) window.__listen.stepChanged();
    if (id === "setup") openFirstSub();
    if (id === "finish") renderRecap();
    if (id === "host") paintDeploy();
  }

  /* A click that lands mid-transition is queued, not dropped (dropped clicks felt like the site was stuck). */
  let pendingGo = null;
  function runPending() {
    if (busy || !pendingGo) return;
    const id = pendingGo; pendingGo = null;
    if (id !== viewing) go(id);
  }
  function go(id, instant) {
    if (!sections[id]) return;
    if (busy) { pendingGo = id; return; }
    if (id === viewing) { scrollTop(); return; }
    const from = viewing ? sections[viewing] : null;
    const to = sections[id];
    renderFooter(id);
    if (instant || !from || reduceMotion) {
      if (from) from.hidden = true;
      to.hidden = false;
      viewing = id; paintNav(); onShow(id); scrollTop();
      save();
      return Promise.resolve();
    }
    busy = true;
    from.classList.add("leaving");
    return wait(190).then(() => {
      from.hidden = true; from.classList.remove("leaving");
      viewing = id;
      paintNav();
      scrollTop();
      to.hidden = false;
      to.classList.add("entering");
      onShow(id);
      save();
      return wait(650);
    }).then(() => {
      to.classList.remove("entering");
      busy = false;
      focusHeading(to);
      runPending();
    }, () => { busy = false; runPending(); });
  }

  let tickerTimer = null;
  function showTicker(text) {
    if (!text) return;
    const t = $("#ticker");
    $("#ticker-text").textContent = text.replace(/^Now you know /, "");
    t.classList.add("show");
    clearTimeout(tickerTimer);
    tickerTimer = setTimeout(() => t.classList.remove("show"), 3600);
  }

  function completeStep(id) {
    if (busy || isDone(id)) return;
    if (id === "setup" && !REQUIRED_SUBS.every(isDone)) return;
    if (id === "version" && !state.version) return;
    busy = true;
    const sec = sections[id];
    const btn = $(".complete", sec);
    state.steps[id] = true;
    save();

    if (btn) {
      btn.classList.add("is-done");
      btn.querySelector("span").textContent = "Done";
      const r = btn.getBoundingClientRect();
      const colors = PALETTE[PART[id]] || PALETTE.core;
      const cp = CHECKPOINTS[id] || 0;
      burst(r.left + r.width / 2, r.top + r.height / 2, cp ? 110 + cp * 20 : 70, colors, cp ? 14 + cp : 11);
      if (cp) setTimeout(() => burst(innerWidth / 2, innerHeight * 0.95, 80 + cp * 30, PALETTE.core, 16 + cp * 2), 220);
      if (cp === 2) setTimeout(() => { burst(innerWidth * 0.2, innerHeight * 0.9, 90, PALETTE.finish, 17); burst(innerWidth * 0.8, innerHeight * 0.9, 90, PALETTE.finish, 17); }, 450);
    }
    const seg = segs[id];
    seg.classList.remove("flash"); void seg.offsetWidth; seg.classList.add("flash");
    paintNav();
    showTicker(LEARNED[id]);

    const learned = document.createElement("p");
    learned.className = "learned enter";
    learned.textContent = LEARNED[id];
    sec.appendChild(learned);

    const nextId = nextAfter(id);
    if (currentId() === "finish") {
      setTimeout(() => burst(innerWidth * 0.25, innerHeight * 0.9, 110, PALETTE.finish, 17), 300);
      setTimeout(() => burst(innerWidth * 0.75, innerHeight * 0.9, 110, PALETTE.finish, 17), 480);
    }
    wait(1300).then(() => {
      busy = false;
      renderFooter(id);
      // a rail click during the celebration wins over the automatic next step
      const queued = pendingGo; pendingGo = null;
      go(queued || nextId);
    });
  }

  /* ---------- in-page links to a step ---------- */

  document.addEventListener("click", (e) => {
    const dg = e.target.closest("[data-go]");
    if (dg) { e.preventDefault(); go(dg.dataset.go); }
    const jump = e.target.closest('a[href^="#quest-"]');
    if (jump) {
      e.preventDefault();
      const target = $(jump.getAttribute("href"));
      if (!target) return;
      if (!drawer.hidden) closeDrawer();
      const show = () => { setOpen(target, true); setTimeout(() => target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }), 120); };
      if (viewing !== "further") { go("further"); setTimeout(show, 450); }
      else show();
    }
  });

  /* ---------- step 0 sub-steps and side quests (same collapsible) ---------- */

  function setOpen(el, open) {
    el.classList.toggle("open", open);
    const head = $(":scope > .sub-head, :scope > .fold-head", el);
    if (head) head.setAttribute("aria-expanded", String(open));
  }
  function paintSubs() {
    $all(".sub[data-sub]").forEach((el) => {
      const id = el.dataset.sub;
      el.classList.toggle("done", isDone(id));
      const b = $(".sub-done", el);
      if (b) {
        if (isDone(id)) { b.textContent = "Undo check"; b.classList.add("ghost"); b.classList.remove("accent"); }
        else { b.textContent = id === SUBS[SUBS.length - 1] ? "Done" : "Done, next →"; b.classList.remove("ghost"); b.classList.add("accent"); }
      }
      const sk = $(".sub-skip", el);
      if (sk) sk.hidden = isDone(id);
    });
    if (viewing === "setup" && !isDone("setup")) renderFooter("setup");
  }
  function openFirstSub() {
    if ($(".sub.open", sections.setup)) return;
    const first = SUBS.find((s) => !isDone(s));
    if (first) setOpen($('.sub[data-sub="' + first + '"]'), true);
  }
  $all(".sub[data-sub]").forEach((el) => {
    const id = el.dataset.sub;
    const quest = QUESTS.indexOf(id) >= 0;
    // Side quests are one-line cards: the whole line is the tick. Step 0 items open and have a Done button.
    // Revision 5: the circle on the right ticks it straight away, no need to open it. Already done it? One click.
    $(".sub-head", el).addEventListener("click", (e) => { if (quest || e.target.closest(".sub-tick")) tick(); else setOpen(el, !el.classList.contains("open")); });
    const doneBtn = $(".sub-done", el);
    if (doneBtn) doneBtn.addEventListener("click", tick);
    const skipBtn = $(".sub-skip", el);
    if (skipBtn) skipBtn.addEventListener("click", () => { setOpen(el, false); openNext(); });
    /* Open the next item not done yet, or, at the end of step 0, scroll to the step button. */
    function openNext() {
      const next = SUBS.slice(SUBS.indexOf(id) + 1).find((s) => !isDone(s));
      if (next) {
        const nel = $('.sub[data-sub="' + next + '"]');
        setOpen(nel, true);
        setTimeout(() => nel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }), 120);
      } else {
        const foot = $(".step-foot", sections.setup);
        if (foot) setTimeout(() => foot.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }), 120);
      }
    }
    function tick() {
      if (isDone(id)) { delete state.steps[id]; save(); paintSubs(); return; }
      state.steps[id] = true; save();
      el.classList.add("pop"); setTimeout(() => el.classList.remove("pop"), 700);
      const r = $(".sub-tick", el).getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 28, quest ? PALETTE.deploy : PALETTE.why, 7);
      paintSubs();
      if (quest) {
        toast("Side quest " + id.slice(-1) + " done");
        return;
      }
      setTimeout(() => { setOpen(el, false); openNext(); }, 420);
    }
  });

  /* ---------- "Upload the skill to Claude" (shared block, steps 2 and 3) ---------- */

  function zipName(skill) { return skill === "design" ? "design.zip" : skill + ".zip"; }
  function listName(skill) { return skill === "design" ? (DESIGN_SKILL[state.version] || "design-…") : skill; }
  function uploadSteps(skill) {
    return '<ol class="do">' +
      '<li><strong>Customize</strong>, bottom of the left sidebar</li>' +
      "<li><strong>+ Add</strong>, top right, then <strong>Upload skill</strong></li>" +
      "<li>Pick <code>" + esc(zipName(skill)) + "</code> from Downloads. The .zip, not the folder.</li>" +
      '<li><strong>Yours</strong> tab: <strong><span data-list-name="' + esc(skill) + '">' + esc(listName(skill)) + "</span></strong> is there and switched on.</li>" +
      "</ol>" +
      '<div class="crops crops-small"><figure><img src="img/screens/claude-step-b.jpg" alt="The + Add button marked 2, Upload skill marked 3, the Yours tab marked 4" loading="lazy"></figure></div>';
  }
  $all(".upload-skill[data-skill]").forEach((el) => {
    const skill = el.dataset.skill;
    if (el.hasAttribute("data-open")) {
      el.classList.add("open-block");
      el.innerHTML = uploadSteps(skill);
    } else {
      el.innerHTML = '<div class="fold"><button type="button" class="fold-head" aria-expanded="false">Upload <code>' + esc(zipName(skill)) + '</code>, the steps again<svg class="chev" aria-hidden="true"><use href="#i-chev"/></svg></button>' +
        '<div class="collapse"><div class="collapse-inner"><div class="fold-body">' + uploadSteps(skill) + "</div></div></div></div>";
    }
  });

  /* folds */
  $all(".fold").forEach((el) => {
    $(":scope > .fold-head", el).addEventListener("click", () => setOpen(el, !el.classList.contains("open")));
  });

  /* ---------- screenshot slots + links ---------- */

  /* Revision 6: the real Customize screenshot, cleaned, with circled numbers that match the numbered steps */
  const PINS = { "claude-customize-skills": { src: "img/screens/claude-customize-skills-clean.png", w: 1000, h: 628,
    pins: [[1, 15.2, 19.3, "Customize"], [2, 79, 11.9, "+ Add", 1], [3, 74, 15.9, "Upload skill", 1], [4, 47, 5.6, "Yours"]] } };
  function pinnedShot(fig, cfg) {
    const cap = $("figcaption", fig);
    const box = document.createElement("div");
    box.className = "annot";
    box.innerHTML = '<img src="' + cfg.src + '" alt="' + esc(cap ? cap.textContent : "Screenshot") + '" width="' + cfg.w + '" height="' + cfg.h + '" loading="lazy">' +
      cfg.pins.map((p) => '<span class="pin' + (p[4] ? " flip" : "") + '" style="' + (p[4] ? "right:" + (100 - p[1]) : "left:" + p[1]) + "%;top:" + p[2] + '%"><i>' + p[0] + "</i><b>" + esc(p[3]) + "</b></span>").join("");
    fig.insertBefore(box, fig.firstChild);
    if (cap) cap.hidden = true;
  }
  $all("figure.shot[data-shot]").forEach((fig) => {
    const id = fig.dataset.shot;
    if (PINS[id]) { pinnedShot(fig, PINS[id]); return; }
    const cap = $("figcaption", fig);
    const capHtml = cap ? cap.innerHTML : "";
    const img = new Image();
    img.alt = cap ? cap.textContent : "Screenshot " + id;
    const ALIAS = { "4-preview": "img/slides/mary-text-now.jpg" };
    const srcs = (ALIAS[id] ? [ALIAS[id]] : []).concat(["png", "svg", "jpg", "webp"].map((x) => "img/screens/" + id + "." + x));
    let i = 0;
    const placeholder = () => {
      if (!DRAFT) { fig.hidden = true; return; } // a missing screenshot shows nothing to students
      const ph = document.createElement("div");
      ph.className = "shot-empty";
      ph.innerHTML = '<svg aria-hidden="true"><use href="#i-img"/></svg><div><b>Screenshot ' + esc(id) + "</b>" + capHtml + "</div>";
      if (cap) cap.hidden = true;
      fig.insertBefore(ph, fig.firstChild);
    };
    img.onerror = () => { i++; if (i < srcs.length) img.src = srcs[i]; else placeholder(); };
    img.onload = () => { fig.insertBefore(img, fig.firstChild); };
    img.src = srcs[0];
    img.addEventListener("click", () => {
      const lb = document.createElement("div");
      lb.className = "lightbox";
      lb.innerHTML = '<img alt="">';
      lb.firstChild.src = img.src;
      lb.addEventListener("click", () => lb.remove());
      document.body.appendChild(lb);
    });
  });

  $all("a.go-link").forEach((a) => {
    a.insertAdjacentHTML("beforeend", '<svg aria-hidden="true"><use href="#i-ext"/></svg>');
    if (a.hasAttribute("data-verify")) {
      a.insertAdjacentHTML("afterend", '<span class="verify-tag" title="This link still needs to be verified">verify</span>');
    }
  });

  /* Placeholder links: <span class="link-pending" data-url="[SOME_URL]" data-label="Open it">. Once data-url is a real
     URL (swap the bracket for the link), the span turns into a go-link. None are left on the page as of revision 4. */
  $all(".link-pending[data-url]").forEach((s) => {
    const url = (s.dataset.url || "").trim();
    if (!/^https?:\/\//.test(url)) return;
    const a = document.createElement("a");
    a.className = "go-link"; a.href = url; a.target = "_blank"; a.rel = "noopener";
    a.textContent = s.dataset.label || url;
    a.insertAdjacentHTML("beforeend", '<svg aria-hidden="true"><use href="#i-ext"/></svg>');
    s.replaceWith(a);
  });

  /* ---------- copy cards ---------- */

  const VERSION_CARDS = { "voice-builder": 1, "design-builder": 1 };
  function cardText(id) {
    let t = srcText(id);
    if (VERSION_CARDS[id]) t = t.replace(/\{\{VERSION\}\}/g, state.version === "custom" ? "my own. Ask me to describe it in 3 words and show you 2 things I love" : versionName() || "[your version]");
    if (fullName()) t = t.replace(/\[(name|your name)\]/gi, fullName());
    if (id === "stuck-ask") {
      const cur = viewing || currentId();
      const s = sections[cur] || sections.what;
      t = t.replace(/\{\{STEP\}\}/g, s.dataset.num !== undefined ? "step " + s.dataset.num : cur === "finish" ? "the finish page" : cur === "further" ? "the Go further page" : "the start page").replace(/\{\{STEP_TITLE\}\}/g, TITLES[cur] || "");
    }
    return t;
  }
  function cardHtml(id) {
    const t = cardText(id);
    if (VERSION_CARDS[id]) {
      if (state.version === "custom") return esc(t);
      return esc(t).replace(esc(versionName() || "[your version]"), '<span class="fill' + (state.version ? "" : " missing") + '">' + esc(versionName() || "your version") + "</span>");
    }
    return esc(t);
  }

  function renderCopyCard(card) {
    const id = card.dataset.copy;
    card.innerHTML =
      '<div class="copy-top"><div class="copy-title"><b>' + esc(card.dataset.title || "Copy this") + "</b>" +
      (card.dataset.sub ? "<span>" + esc(card.dataset.sub) + "</span>" : "") + "</div>" +
      '<div class="copy-actions"><button type="button" class="btn small copy-btn">Copy</button>' +
      (card.dataset.download ? '<button type="button" class="btn small ghost dl-btn">Download</button>' : "") + "</div></div>" +
      '<pre class="copy-pre">' + cardHtml(id) + "</pre>";
    const pre = $(".copy-pre", card);
    requestAnimationFrame(() => {
      if (pre.scrollHeight > pre.clientHeight + 8 && !$(".copy-more", card)) {
        const more = document.createElement("button");
        more.type = "button"; more.className = "copy-more"; more.textContent = "Show all";
        more.addEventListener("click", () => {
          card.classList.toggle("expanded");
          more.textContent = card.classList.contains("expanded") ? "Show less" : "Show all";
        });
        card.appendChild(more);
      }
    });
    const cb = $(".copy-btn", card);
    cb.addEventListener("click", () => {
      copyText(cardText(id)).then(() => {
        cb.textContent = "Copied ✓"; cb.classList.add("copied");
        setTimeout(() => { cb.textContent = "Copy"; cb.classList.remove("copied"); }, 1800);
        toast(/builder/.test(id) ? "Copied. Paste it into the skill builder" : "Copied. Paste it into Claude");
      }, () => toast("Copy was blocked. Select the text and copy it by hand"));
    });
    const db = $(".dl-btn", card);
    if (db) db.addEventListener("click", () => { download(card.dataset.download, cardText(id) + "\n", "text/markdown"); toast("Downloaded " + card.dataset.download); });
  }
  $all(".copy-card[data-copy]").forEach(renderCopyCard);

  /* ---------- Make it yours forms + zip download ---------- */

  const fileCache = {};
  function fetchSkill(skill) {
    if (fileCache[skill]) return fileCache[skill];
    // The voice starter is embedded in index.html (<script type="text/plain" id="skill-voice">), so the
    // anatomy renders even from file://. Anything not embedded is fetched from skills/<skill>/SKILL.md.
    const embed = document.getElementById("skill-" + skill);
    if (embed && embed.textContent.trim()) { fileCache[skill] = Promise.resolve(embed.textContent.replace(/^\n/, "")); return fileCache[skill]; }
    fileCache[skill] = fetch("skills/" + skill + "/SKILL.md", { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error("SKILL.md " + r.status); return r.text(); });
    fileCache[skill].catch(() => { delete fileCache[skill]; });
    return fileCache[skill];
  }

  function radioHtml(name, value, label, checked) {
    return '<label class="mf-radio"><input type="radio" name="' + name + '" value="' + value + '"' + (checked ? " checked" : "") + "><span>" + esc(label) + "</span></label>";
  }
  function versionRadios(kind) {
    return '<fieldset class="mf-row mf-versions"><legend>Pick one <span class="small muted">same as the cards above</span></legend>' +
      Object.keys(VERSION_NAME).map((v) => radioHtml(kind + "-version", v, VERSION_NAME[v], state.version === v)).join("") + "</fieldset>";
  }

  function renderForm(el) {
    const kind = el.dataset.kind;
    const v = state.version || "warm";
    if (kind === "voice") {
      el.innerHTML = '<form class="myform-inner" novalidate>' +
        '<div class="mf-head"><span class="mf-file">voice/SKILL.md</span><span class="mf-tag">Make it yours</span></div>' +
        '<div class="mf-group"><span class="mf-group-label">Assets</span>' +
        '<label class="field"><span>My samples <small>3 things you wrote, a <code>---</code> line between them</small></span><textarea name="samples" rows="9" placeholder="Hey Sam, quick one. Can you send the deck by Thursday? Thanks tons.&#10;---&#10;Second sample&#10;---&#10;Third sample" spellcheck="false"></textarea></label>' +
        '<label class="field"><span>Words and phrases I actually use <small>comma-separated</small></span><input name="words" placeholder="quick one, thanks tons, no worries" autocomplete="off"></label>' +
        '<label class="field"><span>How I sign off</span><input name="signoff" value="' + esc(firstName()) + '" placeholder="your first name" autocomplete="off"></label></div>' +
        '<div class="mf-group"><span class="mf-group-label">Vibe</span>' + versionRadios("voice") +
        '<label class="field mf-own"' + (v === "custom" ? "" : " hidden") + '><span>My vibe, in my own words <small>3 words, like warm, direct, specific</small></span><input name="vibe" placeholder="warm, direct, specific" autocomplete="off"></label></div>' +
        '<div class="mf-group"><span class="mf-group-label">Icks</span>' +
        '<div class="field"><span>Never say <small>up to 3</small></span><div class="mf-three"><input name="never1" placeholder="excited to share" autocomplete="off"><input name="never2" placeholder="circle back" autocomplete="off"><input name="never3" placeholder="" autocomplete="off"></div></div></div>' +
        '<div class="mf-foot"><button type="submit" class="btn accent mf-dl">Download voice.zip</button><span class="small">Built on your laptop. Nothing is sent</span></div>' +
        "</form>";
    } else {
      el.innerHTML = '<form class="myform-inner" novalidate>' +
        '<div class="mf-head"><span class="mf-file"><span data-design-name>' + esc(DESIGN_SKILL[v]) + "</span>/SKILL.md</span><span class=\"mf-tag\">Make it yours</span></div>" +
        versionRadios("design") +
        '<div class="mf-group"><span class="mf-group-label">Assets</span>' +
        '<fieldset class="mf-row"><legend>Photo</legend>' + radioHtml("design-photo", "yes", "Yes, use my photo", false) + radioHtml("design-photo", "no", "No photo", false) + "</fieldset>" +
        '<p class="small photo-note" hidden>Nothing to upload here. Attach your photo in the Claude chat when you test this (below) and when you build your site in step 4. Claude puts it inside the file, so it still works once it\'s live.</p>' +
        '<div class="field"><span>Sites I like <small>up to 2 links, optional</small></span><div class="mf-two"><input name="site1" type="url" inputmode="url" placeholder="https://a-site-you-like.com" autocomplete="off" spellcheck="false" aria-label="Site I like, 1"><input name="site2" type="url" inputmode="url" placeholder="https://another-one.com" autocomplete="off" spellcheck="false" aria-label="Site I like, 2"></div></div></div>' +
        '<div class="mf-group"><span class="mf-group-label">Vibe</span>' +
        '<div class="field"><span>Accent color <small>one color, the rest stays neutral</small></span><div class="mf-accent"><div class="swatches"></div><label class="hex-wrap"><span class="hex-dot"></span><input name="accent" class="hex" placeholder="#24426B" maxlength="7" autocomplete="off" spellcheck="false" aria-label="Hex color"></label></div></div>' +
        (v === "custom"
          ? '<label class="field"><span>Font pair <small>any two Google Fonts, headline + text</small></span><input name="font" placeholder="Fraunces + Inter" autocomplete="off"></label>'
          : '<label class="field"><span>Font pair</span><select name="font">' + FONTS.map((f) => '<option value="' + esc(f) + '"' + (f === DEFAULT_FONT[v] ? " selected" : "") + ">" + esc(f) + "</option>").join("") + "</select></label>") +
        '<label class="field"><span>3 words for how it should feel</span><input name="feel" placeholder="' + esc(DEFAULT_FEEL[v]) + '" autocomplete="off"></label></div>' +
        '<div class="mf-group"><span class="mf-group-label">Icks</span>' +
        '<div class="field"><span>Never do <small>up to 3</small></span><div class="mf-three"><input name="never1" placeholder="no stock photos" autocomplete="off"><input name="never2" placeholder="no rainbow gradients" autocomplete="off"><input name="never3" placeholder="" autocomplete="off"></div></div></div>' +
        '<div class="mf-foot"><button type="submit" class="btn accent mf-dl">Download design.zip</button><span class="small">Built on your laptop. Nothing is sent</span></div>' +
        "</form>";
      renderSwatches(el);
      $all('input[name="design-photo"]', el).forEach((r) => r.addEventListener("change", () => { $(".photo-note", el).hidden = !$('input[name="design-photo"][value="yes"]', el).checked; }));
      const hex = $("input.hex", el), dot = $(".hex-dot", el);
      const paintDot = () => { const ok = /^#[0-9a-f]{6}$/i.test(hex.value.trim()); dot.style.background = ok ? hex.value.trim() : "transparent"; hex.classList.toggle("bad", !!hex.value.trim() && !ok); if (ok) $all(".swatch", el).forEach((s) => s.classList.toggle("on", s.dataset.hex.toLowerCase() === hex.value.trim().toLowerCase())); };
      hex.addEventListener("input", paintDot);
      el.addEventListener("click", (e) => {
        const sw = e.target.closest(".swatch");
        if (!sw) return;
        hex.value = sw.dataset.hex;
        $all(".swatch", el).forEach((s) => s.classList.toggle("on", s === sw));
        paintDot();
      });
    }
    $all('input[type="radio"][name$="-version"]', el).forEach((r) => r.addEventListener("change", () => { if (r.checked) setVersion(r.value, true); }));
    $("form", el).addEventListener("submit", (e) => { e.preventDefault(); downloadFromForm(el); });
  }
  function renderSwatches(el) {
    const box = $(".swatches", el);
    if (!box) return;
    const v = state.version || "warm";
    const hex = $("input.hex", el);
    box.innerHTML = SWATCHES[v].map((s) => '<button type="button" class="swatch' + (hex && hex.value.trim().toLowerCase() === s[1].toLowerCase() ? " on" : "") + '" data-hex="' + s[1] + '" style="--sw:' + s[1] + '" title="' + esc(s[0] + " " + s[1]) + '" aria-label="' + esc(s[0] + " " + s[1]) + '"><span class="sw-name">' + esc(s[0]) + "</span></button>").join("");
  }
  function formFields(el) {
    const f = $("form", el);
    const g = (n) => { const i = f.elements[n]; return i ? String(i.value || "").trim() : ""; };
    const kind = el.dataset.kind;
    const vRadio = f.querySelector('input[name="' + kind + '-version"]:checked');
    const version = vRadio ? VERSION_NAME[vRadio.value] : versionName();
    if (kind === "voice") {
      const own = vRadio && vRadio.value === "custom";
      const vibeWords = g("vibe");
      return { name: fullName(), version: own ? "My own" + (vibeWords ? ": " + vibeWords : ", described in my samples") : version, samples: g("samples"), words: g("words"), signoff: g("signoff"), neverSay: [g("never1"), g("never2"), g("never3")] };
    }
    const sw = f.querySelector(".swatch.on");
    const hexV = g("accent");
    const accent = /^#[0-9a-f]{6}$/i.test(hexV) ? (sw && sw.dataset.hex.toLowerCase() === hexV.toLowerCase() ? sw.getAttribute("aria-label").replace(/ #.*/, "") + " " + hexV : hexV) : "";
    const photo = f.querySelector('input[name="design-photo"]:checked');
    return { name: fullName(), accent, font: g("font"), photo: photo ? photo.value : "", sites: [g("site1"), g("site2")], feel: g("feel"), neverDo: [g("never1"), g("never2"), g("never3")] };
  }
  function downloadFromForm(el) {
    const kind = el.dataset.kind;
    const btn = $(".mf-dl", el);
    if (kind === "design" && !state.version) setVersion("warm", true); // skipped step 1? Start on Warm, the default
    const skill = kind === "voice" ? "voice" : DESIGN_SKILL[state.version];
    const fields = formFields(el);
    if (kind === "design") {
      const hexV = ($("input.hex", el).value || "").trim();
      if (hexV && !/^#[0-9a-f]{6}$/i.test(hexV)) { toast("That hex doesn't look right. Six characters after the #, like #24426B"); $("input.hex", el).focus(); return; }
    }
    btn.disabled = true;
    fetchSkill(skill).then((template) => {
      const zip = SkillZip.buildSkillZip(skill, template, fields);
      download(zipName(kind), new Blob([zip], { type: "application/zip" }));
      el.classList.add("downloaded");
      btn.disabled = false; btn.textContent = "Downloaded ✓ (again?)";
      const filled = kind === "voice" ? [fields.samples, fields.words, fields.signoff].filter(Boolean).length + (fields.neverSay.filter(Boolean).length ? 1 : 0) : [fields.accent, fields.feel].filter(Boolean).length + (fields.neverDo.filter(Boolean).length ? 1 : 0);
      toast("Downloaded " + zipName(kind) + (filled ? ". Now upload it to Claude" : ". Every field was blank, so the [brackets] stay"));
    }).catch(() => { btn.disabled = false; toast("Couldn't build " + zipName(kind) + ". Reload the page and try again"); });
  }
  $all(".myform[data-kind]").forEach(renderForm);

  /* "Borrow ours" in the Stuck? drawer, and the GSB starter on step 2: a starter, zipped. Only [name] is filled in.
     The GSB starter's skill name is "voice", so its folder in the zip is voice/ (the zip itself is voice-gsb.zip). */
  const STARTER_FOLDER = { "voice-gsb": "voice" };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-starter]");
    if (!b) return;
    const skill = b.dataset.starter;
    b.disabled = true;
    fetchSkill(skill).then((template) => {
      download(skill + ".zip", new Blob([SkillZip.buildSkillZip(STARTER_FOLDER[skill] || skill, template, { name: fullName() })], { type: "application/zip" }));
      toast("Downloaded " + skill + ".zip. Upload it under Customize › Skills");
      b.disabled = false;
    }).catch(() => { b.disabled = false; toast("Couldn't build " + skill + ".zip. Reload and try again"); });
  });

  /* ---------- skill anatomy (step 2) ---------- */

  const ANAT = {
    name: { k: "Name", v: "The skill's ID. The folder name in the zip has to match it" },
    desc: { k: "Description", v: "When to use it, in one line" },
    title: { k: "Title", v: "A heading for people. The body starts here" },
    edit: { k: "Make it yours", tag: "Editable", v: "Your part. Samples, words, sign-off" },
    locked: { k: "Locked", tag: "Locked", v: "The rules that make it work. Change them and the skill stops working the same way, so leave them" },
    never: { k: "Never", tag: "Never", v: "What makes writing sound like a machine" },
    check: { k: "Check before you finish", v: "The test. Read it out loud. Would a friend know you wrote it?" },
  };
  const HEADING_KEY = {
    "Make it yours (edit this part)": "edit", "Locked (leave this alone)": "locked", "Check before you finish": "check",
  };
  function headingKey(h) {
    if (HEADING_KEY[h]) return HEADING_KEY[h];
    if (/^Never/.test(h)) return "never";
    if (/^Make it yours/.test(h)) return "edit";
    if (/locked/i.test(h)) return "locked";
    return "other";
  }

  function splitSkill(text) {
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    const blocks = [];
    let i = 0;
    if (lines[0] === "---") {
      const end = lines.indexOf("---", 1);
      const fm = lines.slice(0, end + 1);
      const descI = fm.findIndex((l) => /^description:/.test(l));
      blocks.push({ key: "name", text: fm.slice(0, descI).join("\n") });
      blocks.push({ key: "desc", text: fm.slice(descI).join("\n") });
      i = end + 1;
    }
    let cur = { key: "title", lines: [] };
    for (; i < lines.length; i++) {
      const m = /^## (.+)$/.exec(lines[i]);
      if (m) {
        blocks.push({ key: cur.key, text: cur.lines.join("\n").replace(/^\n+|\n+$/g, "") });
        cur = { key: headingKey(m[1].trim()), lines: [lines[i]] };
      } else cur.lines.push(lines[i]);
    }
    blocks.push({ key: cur.key, text: cur.lines.join("\n").replace(/^\n+|\n+$/g, "") });
    return blocks.filter((b) => b.text.trim());
  }

  function anatRow(b) {
    const a = ANAT[b.key] || { k: b.key, v: "" };
    const long = b.text.length > 700;
    return '<div class="arow ac-' + (ANAT[b.key] ? b.key : "other") + '" data-key="' + b.key + '">' +
      '<div class="ablock' + (long ? " long" : "") + '"><span class="tag">' + esc((a.tag || a.k).replace(/ \(.*\)$/, "")) + "</span><pre>" + esc(b.text) + "</pre>" +
      (long ? '<button type="button" class="more">Show all</button>' : "") + "</div>" +
      '<div class="aarrow" aria-hidden="true"></div>' +
      '<div class="aexp"><span class="ak">' + esc(a.k) + '</span><span class="av">' + esc(a.v) + "</span></div></div>";
  }

  function renderAnatomy(el) {
    const skill = el.dataset.skill;
    fetchSkill(skill).then((text) => {
      const blocks = splitSkill(text);
      const front = blocks.filter((b) => b.key === "name" || b.key === "desc");
      const body = blocks.filter((b) => b.key !== "name" && b.key !== "desc");
      el.innerHTML = '<div class="anat-head"><div class="anat-top"><span class="chrome"><i></i><i></i><i></i></span>' + esc(skill) + "/SKILL.md</div><div></div>" +
        (front.length ? '<div class="afront-note">Top: name and description. Claude reads this in every chat to decide when to use the skill.</div>' : "") + "</div>" +
        '<div class="anat-rows">' +
        (front.length ? '<div class="afront"><div class="afront-box">' + front.map(anatRow).join("") + "</div></div>" : "") +
        (body.length ? '<div class="abody"><div class="abody-box"><div class="abody-note">The body, three regions</div>' + body.map(anatRow).join("") + "</div></div>" : "") + "</div>";
      $all(".more", el).forEach((m) => m.addEventListener("click", () => {
        const b = m.closest(".ablock");
        b.classList.toggle("expanded");
        m.textContent = b.classList.contains("expanded") ? "Show less" : "Show all";
      }));
    }).catch(() => { el.innerHTML = '<p class="anat-loading">Couldn\'t load ' + esc(skill) + "/SKILL.md. Reload the page to try again.</p>"; });
  }
  $all(".anatomy[data-skill]").forEach(renderAnatomy);

  /* ---------- step 6 (host): checklist, deploy plan, gallery ---------- */

  (function saveList() {
    state.notes.save = state.notes.save || {};
    $all("#save-list input[data-save]").forEach((cb) => {
      cb.checked = !!state.notes.save[cb.dataset.save];
      cb.closest("li").classList.toggle("on", cb.checked);
      cb.addEventListener("change", () => { state.notes.save[cb.dataset.save] = cb.checked; cb.closest("li").classList.toggle("on", cb.checked); saveLocal(); });
    });
  })();

  function deployWords() {
    if (!state.deployDate) return "";
    const d = new Date(state.deployDate + "T" + (state.deployTime || "12:00") + ":00");
    if (Number.isNaN(d.getTime())) return "";
    const day = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    const time = state.deployTime ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";
    return day + (time ? " at " + time : "");
  }
  function paintDeploy() {
    const dateIn = $("#deploy-date"), timeIn = $("#deploy-time"), gal = $("#gallery-opt"), echo = $("#deploy-echo"), live = $("#live-url"), lecho = $("#live-echo");
    if (!dateIn) return;
    dateIn.value = state.deployDate; timeIn.value = state.deployTime; gal.checked = state.galleryOptIn;
    const w = deployWords();
    echo.textContent = w ? "Saved. " + w + (state.deployTime ? "" : ". Add a time") : "";
    $("#deploy-plan").classList.toggle("set", !!(state.deployDate && state.deployTime));
    if (live && document.activeElement !== live) live.value = state.liveUrl;
    if (lecho) {
      lecho.innerHTML = state.liveUrl ? 'Saved. <a href="' + esc(state.liveUrl) + '" target="_blank" rel="noopener">' + esc(state.liveUrl.replace(/^https:\/\//, "")) + "</a>" + (state.galleryOptIn ? ". It's in the gallery" : ". Not in the gallery") : "";
    }
    $("#live-link").classList.toggle("set", !!state.liveUrl);
  }
  (function deploy() {
    const dateIn = $("#deploy-date"), timeIn = $("#deploy-time"), gal = $("#gallery-opt"), live = $("#live-url");
    if (!dateIn) return;
    const min = new Date(); dateIn.min = min.toISOString().slice(0, 10);
    const onChange = () => {
      state.deployDate = /^\d{4}-\d{2}-\d{2}$/.test(dateIn.value) ? dateIn.value : "";
      state.deployTime = /^\d{2}:\d{2}$/.test(timeIn.value) ? timeIn.value : "";
      save(); paintDeploy();
      if (state.deployDate && state.deployTime) toast("Date saved. " + deployWords());
    };
    dateIn.addEventListener("change", onChange);
    timeIn.addEventListener("change", onChange);
    gal.addEventListener("change", () => { state.galleryOptIn = gal.checked; save(); paintDeploy(); toast(gal.checked ? "Gallery on. Your link shows once you paste it" : "Gallery off. Untick stays until you tick it again"); });
    /* The live link: https only, 200 chars max (lib/store.js checks the same). Saved with progress and, with the box ticked, shown in gallery.html. */
    const onLive = (final) => {
      const v = live.value.trim().slice(0, 200);
      const ok = LIVE_RE.test(v);
      live.classList.toggle("bad", !!v && !ok);
      if (ok && v !== state.liveUrl) { state.liveUrl = v; save(); paintDeploy(); toast(state.galleryOptIn ? "Link saved. It's in the class gallery" : "Link saved"); }
      else if (!v && state.liveUrl) { state.liveUrl = ""; save(); paintDeploy(); }
      else if (final && v && !ok) toast("The link has to start with https://");
    };
    live.addEventListener("input", () => onLive(false));
    live.addEventListener("change", () => onLive(true));
    live.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); onLive(true); live.blur(); } });
    paintDeploy();
  })();

  /* ---------- stuck drawer ---------- */

  const drawer = $("#drawer");
  let lastFocus = null;
  function openDrawer(groupId) {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    drawer.classList.remove("closing");
    const body = $("#drawer-body");
    let gid = groupId || viewing;
    if (gid === "setup") {
      const openSub = $(".sub.open", sections.setup);
      gid = openSub ? openSub.dataset.sub : SUBS.find((s) => !isDone(s)) || "setup-1";
    }
    if (gid === "what" || gid === "finish") gid = "any";
    $all(".stuck-group", body).forEach((g) => g.classList.toggle("here", g.dataset.group === gid));
    const target = $('.stuck-group[data-group="' + gid + '"]', body);
    const ask = $('.copy-card[data-copy="stuck-ask"]', body);
    if (ask) renderCopyCard(ask);
    $("#stuck-search").value = ""; filterStuck("");
    setTimeout(() => {
      if (target && gid !== "any") {
        body.scrollTo({ top: target.offsetTop - body.offsetTop - 8, behavior: reduceMotion ? "auto" : "smooth" });
        target.classList.remove("flash"); void target.offsetWidth; target.classList.add("flash");
      } else body.scrollTo({ top: 0 });
    }, 220);
    $("[data-close]", drawer).focus();
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    if (drawer.hidden) return;
    drawer.classList.add("closing");
    setTimeout(() => { drawer.hidden = true; drawer.classList.remove("closing"); }, reduceMotion ? 0 : 260);
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function filterStuck(q) {
    q = q.trim().toLowerCase();
    let any = false;
    $all(".stuck-group[data-group]", drawer).forEach((g) => {
      let vis = 0;
      $all(".stuck-item", g).forEach((it) => {
        const hit = !q || it.textContent.toLowerCase().indexOf(q) >= 0;
        it.hidden = !hit; if (hit) vis++;
        if (q && hit) it.open = true;
      });
      g.hidden = !vis; if (vis) any = true;
    });
    $("#ladder").hidden = !!q;
    $("#stuck-empty").hidden = any;
  }
  $("#stuck-search").addEventListener("input", (e) => filterStuck(e.target.value));
  $("#stuck-open").addEventListener("click", () => openDrawer());
  drawer.addEventListener("click", (e) => { if (e.target === drawer || e.target.closest("[data-close]")) closeDrawer(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeDrawer(); const lb = $(".lightbox"); if (lb) lb.remove(); }
  });
  document.addEventListener("click", (e) => {
    const s = e.target.closest(".stuck-inline[data-stuck]");
    if (s) openDrawer(s.dataset.stuck);
  });
  /* the house rules from "What you're building", copied into the drawer */
  (function copyRules() {
    const src = $("#house-rules"), dst = $("#house-rules-copy");
    if (src && dst) dst.innerHTML = src.innerHTML;
  })();

  /* ---------- finish: recap + feedback ---------- */

  function recapLine(t) {
    const r = t.replace(/^Now you know /, "");
    return r.charAt(0).toUpperCase() + r.slice(1);
  }
  function renderRecap() {
    if ($("#recap").dataset.static) return; // Revision 6: the deck's recap, written in index.html
    $("#recap").innerHTML = STEPS.map((id) =>
      '<li data-part="' + PART[id] + '"><span class="rn">' + esc(sections[id].dataset.num !== undefined ? sections[id].dataset.num : sections[id].dataset.icon) + "</span><span>" + esc(recapLine(LEARNED[id])) + "</span></li>").join("");
  }
  let rating = state.feedback ? state.feedback.rating : 0;
  (function feedback() {
    const stars = $(".stars");
    if (!stars) return; // Revision 9: feedback is the form only
    for (let i = 1; i <= 5; i++) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "star"; b.setAttribute("role", "radio"); b.setAttribute("aria-label", i + (i === 1 ? " star" : " stars"));
      b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z" stroke-width="1.2"/></svg>';
      b.addEventListener("click", () => { rating = i; paintStars(); });
      stars.appendChild(b);
    }
    const comment = $("#fb-comment");
    if (state.feedback) comment.value = state.feedback.comment || "";
    function paintStars() {
      $all(".star", stars).forEach((s, i) => { s.classList.toggle("on", i < rating); s.setAttribute("aria-checked", String(i + 1 === rating)); });
      $("#fb-send").disabled = !rating;
    }
    paintStars();
    comment.addEventListener("keydown", (e) => { if (e.key === "Enter" && !$("#fb-send").disabled) { e.preventDefault(); $("#fb-send").click(); } });
    $("#fb-send").addEventListener("click", () => {
      const st = $("#fb-status");
      const btn = $("#fb-send");
      btn.disabled = true;
      state.feedback = { rating, comment: comment.value.trim() };
      saveLocal();
      fetch("/api/feedback?room=" + encodeURIComponent(ROOM), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: state.name, email: state.email, rating, comment: comment.value.trim() }),
      }).then((r) => r.json().catch(() => ({})).then((j) => ({ ok: r.ok, j }))).then(({ ok, j }) => {
        st.hidden = false;
        if (ok) {
          st.className = "fb-status ok"; st.textContent = "Thank you. Sent to the workshop team";
          const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 70, PALETTE.finish, 11);
          paintNav();
        } else {
          st.className = "fb-status err"; st.textContent = (j && j.error === "storage_unconfigured") ? "Couldn't send: no database is connected yet. Tell us in person instead" : "Couldn't send that. Try again in a moment";
        }
        btn.disabled = false; btn.textContent = "Send again";
      }).catch(() => { st.hidden = false; st.className = "fb-status err"; st.textContent = "Couldn't send that. Check your connection and try again"; btn.disabled = false; });
    });
  })();

  /* ---------- Listen: read the current step out loud at 1x, 2x or 3x (Revision 6) ---------- */
  (function listenMode() {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const bar = $("#listen-bar"), openBtn = $("#listen-open"), playBtn = $("#lb-play"), now = $("#lb-now");
    const SKIP = ".copy-card, .anatomy, .myform, figure, .acct-grid, .vprev, .version-card dl, .step-foot, .learned, .backbar, .sites-row, .ideas .copy-card, button, .lvls .collapse";
    let rate = 2, queue = [], idx = 0, playing = false, paused = false, current = null, voice = null, gen = 0;
    try { const r = Number(localStorage.getItem("aigsb-w3-rate")); if ([1, 2, 3].indexOf(r) >= 0) rate = r; } catch (e) {}
    function pickVoice() {
      const vs = synth.getVoices().filter((v) => /^en(-|_)/i.test(v.lang));
      const pref = [/natural/i, /premium/i, /enhanced/i, /samantha/i, /ava/i, /allison/i, /google us english/i, /jenny/i, /aria/i];
      for (const re of pref) { const v = vs.find((x) => re.test(x.name)); if (v) return v; }
      return vs.find((v) => /en-US/i.test(v.lang)) || vs[0] || null;
    }
    if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = () => { voice = pickVoice(); };
    voice = pickVoice();
    function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
    function chunks(text) {
      const out = []; let cur = "";
      text.split(/(?<=[.!?])\s+/).forEach((sn) => { if ((cur + " " + sn).length > 220 && cur) { out.push(cur); cur = sn; } else cur = cur ? cur + " " + sn : sn; });
      if (cur) out.push(cur);
      return out;
    }
    function build() {
      const sec = sections[viewing]; if (!sec) return [];
      const picked = [];
      $all("h2, .step-lede, h3, h4, p, li", sec).forEach((el) => {
        if (el.closest(SKIP) || !visible(el)) return;
        if (picked.some((c) => c.contains(el))) return;
        const t = el.textContent.replace(/\s+/g, " ").replace(/›/g, ", then ").trim();
        if (t.length < 2) return;
        picked.push(el);
      });
      const q = [];
      picked.forEach((el) => chunks(el.textContent.replace(/\s+/g, " ").replace(/›/g, ", then ").replace(/\.zip/g, " dot zip").trim()).forEach((t) => q.push({ el, t })));
      return q;
    }
    function mark(el) { if (current) current.classList.remove("reading"); current = el; if (el) { el.classList.add("reading"); el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); } }
    function speakNext() {
      if (!playing || paused) return;
      if (idx >= queue.length) { stop(false); now.textContent = "Done. Next step when you're ready"; return; }
      const item = queue[idx];
      if (!current || current !== item.el) mark(item.el);
      const u = new SpeechSynthesisUtterance(item.t);
      if (voice) u.voice = voice;
      u.rate = rate; u.pitch = 1;
      const my = ++gen; // a cancel (pause, speed change, stop) must not skip ahead
      u.onend = () => { if (my !== gen) return; idx++; speakNext(); };
      u.onerror = () => { if (my !== gen) return; idx++; speakNext(); };
      synth.speak(u);
    }
    function paint() {
      bar.classList.toggle("paused", paused || !playing);
      playBtn.setAttribute("aria-label", paused || !playing ? "Play" : "Pause");
      $all("[data-rate]", bar).forEach((b) => { b.classList.toggle("on", Number(b.dataset.rate) === rate); b.setAttribute("aria-checked", String(Number(b.dataset.rate) === rate)); });
      openBtn.setAttribute("aria-pressed", String(!bar.hidden));
    }
    function start() {
      gen++; synth.cancel(); queue = build(); idx = 0; playing = true; paused = false;
      bar.hidden = false; now.textContent = "Reading " + (sections[viewing] ? stepLabel(viewing) + ": " + TITLES[viewing] : "this step");
      paint(); speakNext();
    }
    function stop(hide) { playing = false; paused = false; gen++; synth.cancel(); mark(null); if (hide) bar.hidden = true; paint(); }
    openBtn.addEventListener("click", () => { if (!bar.hidden && playing) stop(true); else start(); });
    playBtn.addEventListener("click", () => {
      if (!playing) { start(); return; }
      if (paused) { paused = false; gen++; synth.cancel(); speakNext(); } else { paused = true; gen++; synth.cancel(); }
      paint();
    });
    $("#lb-close").addEventListener("click", () => stop(true));
    $all("[data-rate]", bar).forEach((b) => b.addEventListener("click", () => {
      rate = Number(b.dataset.rate);
      try { localStorage.setItem("aigsb-w3-rate", String(rate)); } catch (e) {}
      if (playing && !paused) { gen++; synth.cancel(); speakNext(); }
      paint();
    }));
    window.__listen = { stepChanged() { if (playing) { stop(false); setTimeout(start, 400); } }, start, stop };
    paint();
  })();

  /* ---------- sign in ---------- */

  const welcome = $("#welcome"), app = $("#app");
  const who = $("#who"), emailIn = $("#email"), goBtn = $("#go"), formErr = $("#form-err");
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (ROOM !== "default") $("#room-note").textContent = "Room: " + ROOM;

  function formReady() { goBtn.disabled = !(who.value.trim() && emailIn.value.trim()); formErr.hidden = true; }
  who.addEventListener("input", formReady);
  emailIn.addEventListener("input", formReady);

  function chrome(signedIn) {
    ["#progress", "#stuck-open", "#who-wrap"].forEach((s) => { $(s).hidden = !signedIn; });
    $("#listen-open").hidden = !signedIn || !("speechSynthesis" in window);
    if (signedIn) {
      $("#who-btn").textContent = (state.name.trim()[0] || "?").toUpperCase();
      $("#whoami").textContent = "Signed in as " + state.name + " (" + state.email + ")" + (ROOM !== "default" ? " | room: " + ROOM : "");
      $all(".myform").forEach((f) => { if (!f.contains(document.activeElement)) renderForm(f); }); // the sign-off field is prefilled with the first name
      $all(".copy-card[data-copy]").forEach(renderCopyCard); // "[name]" in the prompts becomes the signed-in name
    }
    paintVersion();
  }
  function showWelcome() {
    app.hidden = true; welcome.hidden = false;
    who.value = state.name; emailIn.value = state.email; formReady();
    chrome(false);
    setTimeout(() => who.focus(), 50);
  }
  function enterApp() {
    welcome.hidden = true;
    chrome(true);
    ORDER.forEach((id) => { sections[id].hidden = true; });
    app.hidden = false;
    viewing = null;
    const deep = { "#side-quests": "further", "#further": "further", "#deploy": "host" }[location.hash];
    go(deep && reachable(deep) ? deep : currentId(), true);
    paintSubs();
    paintVersion();
    requestAnimationFrame(() => { placeRailPill(); });
  }
  $("#signin").addEventListener("submit", (e) => {
    e.preventDefault();
    const n = who.value.trim().replace(/\s+/g, " "), m = emailIn.value.trim().toLowerCase();
    if (!n) { formErr.textContent = "Add your name"; formErr.hidden = false; return; }
    if (!EMAIL_RE.test(m)) { formErr.textContent = "That email doesn't look right"; formErr.hidden = false; return; }
    state.name = n.slice(0, 60); state.email = m.slice(0, 120);
    save();
    pushRemote();
    enterApp();
  });

  /* account menu */
  const whoBtn = $("#who-btn"), whoMenu = $("#who-menu");
  whoBtn.addEventListener("click", (e) => { e.stopPropagation(); whoMenu.hidden = !whoMenu.hidden; whoBtn.setAttribute("aria-expanded", String(!whoMenu.hidden)); $("#reset").textContent = "Start over on this device"; });
  document.addEventListener("click", (e) => { if (!whoMenu.hidden && !e.target.closest("#who-wrap")) whoMenu.hidden = true; });
  $("#change-name").addEventListener("click", () => { whoMenu.hidden = true; showWelcome(); });
  $("#reset").addEventListener("click", (e) => {
    const b = e.currentTarget;
    if (b.dataset.armed !== "1") { b.dataset.armed = "1"; b.textContent = "Click again to clear your progress here"; setTimeout(() => { b.dataset.armed = ""; b.textContent = "Start over on this device"; }, 4000); return; }
    try { localStorage.removeItem(KEY); } catch (err) {}
    location.reload();
  });

  /* ---------- boot ---------- */

  paintVersion();
  if (state.name && state.email) { enterApp(); pushRemote(); } else showWelcome();

  /* expose a little for testing in the console */
  window.__w3 = { state, go, currentId, setVersion, STEPS, SUBS, QUESTS };
})();
