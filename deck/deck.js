// Static viewer for "The Art of Personalization" (exported from the Claude Slides deck).
(function () {
  const W = 1920, H = 1080;
  const withNotes = document.body.dataset.notes === "1";
  let slides = [], notes = [], i = 0;
  const stage = document.getElementById("stage"), frame = document.getElementById("frame");
  const count = document.getElementById("count");

  function fit() {
    const box = frame.getBoundingClientRect();
    const s = Math.min(box.width / W, box.height / H);
    stage.style.transform = `translate(${(box.width - W * s) / 2}px, ${(box.height - H * s) / 2}px) scale(${s})`;
  }
  function show(n) {
    i = Math.max(0, Math.min(slides.length - 1, n));
    [...stage.children].forEach((el, k) => {
      const on = k === i;
      el.style.display = on ? "block" : "none";
      el.querySelectorAll("video").forEach(v => { if (on) { v.currentTime = 0; v.play().catch(() => {}); } else v.pause(); });
    });
    count.textContent = `${i + 1} / ${slides.length}`;
    if (history.replaceState) history.replaceState(null, "", "#" + (i + 1));
    if (withNotes) {
      document.getElementById("notes").innerHTML = notes[i] || "<i>No notes on this slide</i>";
      document.getElementById("notes-count").textContent = `Slide ${i + 1} of ${slides.length}`;
    }
  }
  function go(d) { show(i + d); }

  window.addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT") return;
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); go(1); }
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); go(-1); }
    else if (e.key === "Home") show(0);
    else if (e.key === "End") show(slides.length - 1);
    else if (e.key === "f" || e.key === "F") (document.fullscreenElement ? document.exitFullscreen() : frame.requestFullscreen()).catch(() => {});
  });
  frame.addEventListener("click", e => { const r = frame.getBoundingClientRect(); go(e.clientX - r.left > r.width / 3 ? 1 : -1); });
  let tx = null;
  frame.addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
  frame.addEventListener("touchend", e => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); tx = null; });
  document.getElementById("prev").onclick = e => { e.stopPropagation(); go(-1); };
  document.getElementById("next").onclick = e => { e.stopPropagation(); go(1); };
  window.addEventListener("resize", fit);

  window.startDeck = async function (noteList) {
    notes = noteList || [];
    const data = await (await fetch("/deck/slides.json", { cache: "no-cache" })).json();
    data.fonts.forEach(href => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); });
    slides = data.slides;
    stage.innerHTML = slides.join("");
    fit();
    const start = parseInt((location.hash || "#1").slice(1), 10);
    show(isNaN(start) ? 0 : start - 1);
  };
  if (!withNotes) window.startDeck();
})();
