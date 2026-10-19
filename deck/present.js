// Presenter view for "The Art of Personalization".
// Shows the current slide, the next slide, a timer and the speaker notes, and keeps
// any audience window (/deck/?audience) on the same slide through a BroadcastChannel.
(function () {
  const W = 1920, H = 1080, TALK_MIN = 20;
  const $ = id => document.getElementById(id);
  const SECTIONS = { walkin: "Intro", trust4: "1 Why", skill: "2 Voice", designform: "3 Design", payoff: "4 Payoff", rf7: "5 Rapid fire", yourturn: "Close" };
  let slides = [], ids = [], titles = [], sections = [], full = [], tight = [], i = 0;
  let mode = "tight", fs = 26, aud = null;
  const bc = "BroadcastChannel" in window ? new BroadcastChannel("aop-deck") : null;

  const store = (k, v) => { try { localStorage.setItem("present." + k, JSON.stringify(v)); } catch (e) {} };
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem("present." + k)); return v == null ? d : v; } catch (e) { return d; } };

  function fit(frameId, stageId) {
    const f = $(frameId).getBoundingClientRect(), s = f.width / W;
    $(stageId).style.transform = `scale(${s})`;
  }
  function fitAll() { fit("curF", "cur"); fit("nxtF", "nxt"); }

  const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  function fmtTight(line) {
    let key = false, t = line;
    if (t.startsWith("[KEY POINT]")) { key = true; t = t.slice(11).trim(); }
    const aside = /^\[[^\]]*\]$/.test(t);
    let h = esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    if (key) return `<p class="key"><span class="tag">KEY POINT</span>${h}</p>`;
    return `<p class="${aside ? "aside" : ""}">${h}</p>`;
  }
  function renderNotes() {
    const n = $("notes");
    if (mode === "tight") {
      const lines = tight[i] || [];
      n.innerHTML = lines.length ? lines.map(fmtTight).join("") : '<p class="none">No notes. Walk-in slide.</p>';
    } else {
      n.innerHTML = full[i] ? `<p class="full">${full[i]}</p>` : '<p class="none">No notes. Walk-in slide.</p>';
    }
    n.parentElement.scrollTop = 0;
  }
  function show(n, fromRemote) {
    i = Math.max(0, Math.min(slides.length - 1, n));
    $("cur").innerHTML = slides[i];
    $("nxt").innerHTML = i + 1 < slides.length ? slides[i + 1] : "";
    $("nxt").querySelectorAll("video").forEach(v => { v.removeAttribute("autoplay"); v.pause(); });
    $("num").textContent = `SLIDE ${i + 1} / ${slides.length}`;
    $("sec").textContent = sections[i];
    $("title").textContent = titles[i];
    $("nextTitle").textContent = i + 1 < slides.length ? titles[i + 1] : "That's the end. Go build!";
    renderNotes(); fitAll();
    if (!fromRemote && bc) bc.postMessage({ type: "go", i });
    if (!fromRemote && aud && !aud.closed && !bc) aud.location.hash = "#" + (i + 1);
    if (history.replaceState) history.replaceState(null, "", "#" + (i + 1));
    if (!started && i > 0) startTimer();
  }
  const go = d => show(i + d);

  // Timer
  let started = false, t0 = 0, acc = 0, tick = null;
  function fmt(ms) { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
  function paint() {
    const ms = acc + (started ? Date.now() - t0 : 0);
    $("elapsed").textContent = fmt(ms);
    $("timerbox").classList.toggle("warn", ms >= (TALK_MIN - 2) * 60000 && ms < TALK_MIN * 60000);
    $("timerbox").classList.toggle("over", ms >= TALK_MIN * 60000);
    $("clock").textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  function startTimer() { if (started) return; started = true; t0 = Date.now(); $("tstart").textContent = "Pause"; }
  function pauseTimer() { if (!started) return; acc += Date.now() - t0; started = false; $("tstart").textContent = "Start"; }
  $("tstart").onclick = () => (started ? pauseTimer() : startTimer());
  $("treset").onclick = () => { started = false; acc = 0; $("tstart").textContent = "Start"; paint(); };
  setInterval(paint, 500); paint();

  // Controls
  function setMode(m) { mode = m; store("mode", m); $("vTight").setAttribute("aria-pressed", m === "tight"); $("vFull").setAttribute("aria-pressed", m === "full"); renderNotes(); }
  function setFs(v) { fs = Math.max(16, Math.min(44, v)); store("fs", fs); document.documentElement.style.setProperty("--fs", fs + "px"); }
  $("vTight").onclick = () => setMode("tight");
  $("vFull").onclick = () => setMode("full");
  $("aMinus").onclick = () => setFs(fs - 2);
  $("aPlus").onclick = () => setFs(fs + 2);
  $("prev").onclick = () => go(-1);
  $("next").onclick = () => go(1);
  $("curF").onclick = () => go(1);
  $("nxtF").onclick = () => go(1);
  $("openAud").onclick = () => {
    aud = window.open(`/deck/?audience#${i + 1}`, "aop-audience", "popup,width=1280,height=720");
    if (!aud) $("help").textContent = "Your browser blocked the new window. Allow pop-ups for this site, or open aigsb-workshop3.vercel.app/deck/?audience in a new window yourself.";
  };
  window.addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT") return;
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); go(1); }
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); go(-1); }
    else if (e.key === "Home") show(0);
    else if (e.key === "End") show(slides.length - 1);
  });
  window.addEventListener("resize", fitAll);
  if (bc) bc.onmessage = e => {
    const m = e.data || {};
    if (m.type === "go" && slides.length && m.i !== i) show(m.i, true);
    if (m.type === "hello" && slides.length) bc.postMessage({ type: "go", i });
  };

  function titleOf(html, id) {
    const rc = /^recap(\d)$/.exec(id); if (rc) return `Recap ${rc[1]} of 5`;
    const d = document.createElement("div"); d.innerHTML = html.replace(/<iframe[\s\S]*?<\/iframe>/g, "");
    const h = d.querySelector("h1,h2");
    if (h && h.textContent.trim()) return h.textContent.replace(/\s+/g, " ").trim().replace("The Art ofPersonalization", "The Art of Personalization");
    if (id === "payoff") return "Run Your City, live";
    if (id === "mysite") return "My site, live";
    const img = d.querySelector("img[alt]"); return img ? img.alt : id;
  }

  async function start(key) {
    const r = await fetch("/api/deck-notes", { headers: { "x-instructor-key": key } });
    if (!r.ok) return false;
    const d = await r.json(); full = d.notes || []; tight = d.tight || [];
    try { sessionStorage.setItem("deckKey", key); } catch (e) {}
    const data = await (await fetch("/deck/slides.json", { cache: "no-cache" })).json();
    data.fonts.forEach(href => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); });
    slides = data.slides;
    let cur = "Intro";
    slides.forEach(s => {
      const id = (s.match(/<section id="([^"]+)"/) || [])[1] || "";
      ids.push(id); cur = SECTIONS[id] || cur; sections.push(cur); titles.push(titleOf(s, id));
    });
    $("gate").remove();
    setMode(load("mode", "tight")); setFs(load("fs", 26));
    const startAt = parseInt((location.hash || "#1").slice(1), 10);
    show(isNaN(startAt) ? 0 : startAt - 1, true);
    return true;
  }
  $("f").addEventListener("submit", async e => {
    e.preventDefault(); $("err").textContent = "";
    if (!(await start($("k").value))) $("err").textContent = "That password isn't right.";
  });
  try { const k = sessionStorage.getItem("deckKey"); if (k) start(k); } catch (e) {}
})();
