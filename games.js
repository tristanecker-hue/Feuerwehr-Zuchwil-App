/* ---------- Feuerwehr Spiele ---------- */
const GM_GAMES = [
  ["memory", "Feuerwehr-Memory", "Finde Bild und Beschriftung aus dem Basiswissen"],
  ["loesch", "Feuer löschen", "Tippe die Flammen aus, bevor das Haus brennt"],
  ["klassen", "Brandklassen-Blitz", "Welche Brandklasse hat der Stoff?"],
  ["rohr", "Leitungsbau", "Dreh die Rohre: Wasser vom Hydranten zum Strahlrohr"],
  ["wort", "Feuer-Wörter", "Rate das Feuerwehr-Wort Buchstabe für Buchstabe"],
  ["fahrt", "Einsatzfahrt", "Weiche dem Verkehr aus und komm schnell zum Brand"]
];
const gmGet = (k, d) => { try { const v = localStorage.getItem("fwz-gm-" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const gmSet = (k, v) => { try { localStorage.setItem("fwz-gm-" + k, JSON.stringify(v)); } catch (e) {} };
const gmShuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
let gmTimers = [];
function gmStop() { gmTimers.forEach(t => { clearInterval(t); clearTimeout(t); }); gmTimers = []; }
const gmEvery = (fn, ms, el) => { const t = setInterval(() => { if (!el.isConnected) { clearInterval(t); return; } fn(); }, ms); gmTimers.push(t); return t; };

function gamesView() {
  gmStop(); state.mod = null; state.view = "games"; state.gm = null; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  app.innerHTML = `<section class="hero"><h1>Feuerwehr Spiele</h1><p>Kleine Spiele für zwischendurch. Alles rund ums Feuerwehr.</p></section>
    <div class="gmgrid">${GM_GAMES.map(g => `<button class="gmtile" data-g="${g[0]}"><span class="gmic">${GM_ICON[g[0]]}</span><span class="gmtx"><b>${g[1]}</b><small>${g[2]}</small><em id="gb-${g[0]}"></em></span></button>`).join("")}</div>`;
  const best = { memory: gmGet("memory", 0), loesch: gmGet("loesch", 0), klassen: gmGet("klassen", 0), rohr: gmGet("rohr", 0), wort: gmGet("wort", 0), fahrt: gmGet("fahrt", 0) };
  const txt = { memory: v => v ? "Bestzeit " + v + " s" : "", loesch: v => v ? "Rekord " + v + " Punkte" : "", klassen: v => v ? "Rekord " + v + " Punkte" : "", rohr: v => v ? "Bestzeit " + v + " s" : "", wort: v => v ? "Rekord " + v + " Wörter" : "", fahrt: v => v ? "Rekord " + v + " m" : "" };
  Object.keys(best).forEach(k => { const e = document.getElementById("gb-" + k); if (e) e.textContent = txt[k](best[k]); });
  app.querySelectorAll(".gmtile").forEach(b => b.onclick = () => gamesStart(b.dataset.g));
  window.scrollTo(0, 0);
}
const GM_ICON = {
  memory: '<svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><rect x="5" y="9" width="17" height="24" rx="3"/><rect x="26" y="15" width="17" height="24" rx="3"/><path d="M13.5 17c3 3 3 6 0 9-3-3-3-6 0-9z" fill="currentColor"/></svg>',
  loesch: '<svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M24 5c3 7 11 10 11 20a11 11 0 0 1-22 0c0-5 3-7 4-11 3 2 4 4 4 6 3-4 3-9 3-15z" fill="currentColor"/></svg>',
  klassen: '<svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><circle cx="24" cy="24" r="18"/><path d="M16 32l8-18 8 18M19 27h10"/></svg>',
  rohr: '<svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14h14v20h22"/><circle cx="6" cy="14" r="1" /><circle cx="42" cy="34" r="1"/></svg>',
  fahrt: '<svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><rect x="4" y="18" width="30" height="16" rx="3"/><path d="M34 22h6l4 6v6H34z"/><circle cx="14" cy="36" r="4" fill="currentColor"/><circle cx="36" cy="36" r="4" fill="currentColor"/><path d="M12 14h6M15 11v6"/></svg>',
  wort: '<svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 40h32M14 40V12h20M24 12v6"/><circle cx="24" cy="23" r="4"/><path d="M24 27v8M18 31h12"/></svg>'
};
function gamesStart(id) {
  gmStop(); state.gm = id; backBtn.hidden = false;
  const f = { memory: gmMemory, loesch: gmLoesch, klassen: gmKlassen, rohr: gmRohr, wort: gmWort, fahrt: gmFahrt }[id];
  const g = GM_GAMES.find(x => x[0] === id);
  app.innerHTML = `<section class="hero"><h1>${g[1]}</h1><p>${g[2]}</p></section><div id="gmbody" class="gmbody"></div>`;
  f(document.getElementById("gmbody")); window.scrollTo(0, 0);
}
const gmEnd = (el, title, lines, again) => { el.innerHTML = `<div class="gmend"><h2>${title}</h2>${lines.map(l => `<p>${l}</p>`).join("")}<div class="row"><button class="btn primary" id="gmagain">Nochmal</button><button class="btn" id="gmmenu">Alle Spiele</button></div></div>`; document.getElementById("gmagain").onclick = again; document.getElementById("gmmenu").onclick = gamesView; };

/* ----- 1. Memory: Bild und Beschriftung aus dem Basiswissen ----- */
function gmMemory(el) {
  const m = getMod("basis"), all = [];
  m.sections.forEach(s => (s.img || []).forEach(([k, c]) => { if (typeof IMG !== "undefined" && IMG[k]) all.push({ k, c: c.replace(/\s*\(S\. \d+\)\s*$/, "") }); }));
  const pairs = gmShuffle(all).slice(0, 6);
  if (pairs.length < 4) { el.innerHTML = '<div class="note">Bilder aus dem Basiswissen sind nicht geladen.</div>'; return; }
  const cards = gmShuffle(pairs.flatMap((p, i) => [{ i, t: "img", k: p.k }, { i, t: "txt", c: p.c }]));
  el.innerHTML = `<div class="gmbar"><span id="gmn">Züge: 0</span><span id="gmt">0 s</span><span id="gmp">0 / ${pairs.length}</span></div>
    <div class="memgrid">${cards.map((c, n) => `<button class="memc" data-n="${n}" aria-label="Karte ${n + 1}"><span class="memf"><span class="memb">🔥</span><span class="memfr">${c.t === "img" ? `<img src="${IMG[c.k]}" alt="">` : `<span class="memtx">${esc(c.c)}</span>`}</span></span></button>`).join("")}</div>
    <p class="foot">Finde zu jedem Bild die passende Beschriftung.</p>`;
  let open = [], moves = 0, found = 0, lock = false, t0 = 0;
  const tm = gmEvery(() => { if (t0) document.getElementById("gmt").textContent = Math.round((Date.now() - t0) / 1000) + " s"; }, 500, el);
  el.querySelectorAll(".memc").forEach(b => b.onclick = () => {
    if (lock || b.classList.contains("up") || b.classList.contains("done")) return;
    if (!t0) t0 = Date.now(); b.classList.add("up"); open.push(b);
    if (open.length < 2) return;
    moves++; document.getElementById("gmn").textContent = "Züge: " + moves;
    const [a, c] = open.map(x => cards[x.dataset.n]);
    if (a.i === c.i) { open.forEach(x => x.classList.add("done")); open = []; found++; document.getElementById("gmp").textContent = found + " / " + pairs.length;
      if (found === pairs.length) { clearInterval(tm); const s = Math.round((Date.now() - t0) / 1000), bst = gmGet("memory", 0), nb = !bst || s < bst; if (nb) gmSet("memory", s);
        gmTimers.push(setTimeout(() => gmEnd(el, "Geschafft!", ["Zeit: " + s + " s, " + moves + " Züge.", nb ? "Neue Bestzeit!" : "Bestzeit: " + bst + " s"], () => gamesStart("memory")), 700)); } }
    else { lock = true; gmTimers.push(setTimeout(() => { open.forEach(x => x.classList.remove("up")); open = []; lock = false; }, 950)); }
  });
}

/* ----- 2. Feuer löschen: Flammen antippen ----- */
function gmLoesch(el) {
  const N = 9, DUR = 30;
  el.innerHTML = `<div class="gmbar"><span id="gls">Punkte: 0</span><span id="glt">${DUR} s</span><span id="glh">Haus: 100 %</span></div>
    <div class="house"><div class="roof"></div><div class="hgrid">${Array.from({ length: N }, (_, i) => `<button class="win" data-i="${i}" aria-label="Fenster ${i + 1}"><span class="fl">🔥</span><span class="wt">💦</span></button>`).join("")}</div></div>
    <p class="foot">Tippe jede Flamme aus. Brennt ein Fenster zu lange, leidet das Haus.</p>`;
  let score = 0, t = DUR, hp = 100, tick = 0; const burn = new Array(N).fill(0), wins = [...el.querySelectorAll(".win")];
  const gap = () => Math.max(380, 1000 - (DUR - t) * 20);
  wins.forEach((b, i) => b.onclick = () => { if (burn[i] > 0) { burn[i] = 0; b.classList.remove("on"); b.classList.add("wet"); setTimeout(() => b.classList.remove("wet"), 350); score += 10; document.getElementById("gls").textContent = "Punkte: " + score; } });
  const loop = () => {
    if (!el.isConnected) return;
    tick++;
    if (tick % Math.max(1, Math.round(gap() / 200)) === 0) { const free = burn.map((v, i) => v ? -1 : i).filter(i => i >= 0); if (free.length) { const i = free[Math.random() * free.length | 0]; burn[i] = 1; wins[i].classList.add("on"); } }
    burn.forEach((v, i) => { if (v > 0) { burn[i] += 1; if (burn[i] > 22) hp = Math.max(0, hp - .35); } });
    document.getElementById("glh").textContent = "Haus: " + Math.round(hp) + " %"; el.querySelector(".house").style.setProperty("--dmg", (100 - hp) / 100);
    if (hp <= 0) return fin(false);
    gmTimers.push(setTimeout(loop, 200));
  };
  const clock = gmEvery(() => { t--; document.getElementById("glt").textContent = t + " s"; if (t <= 0) fin(true); }, 1000, el);
  let done = false;
  function fin(win) { if (done) return; done = true; clearInterval(clock); const pts = score + Math.round(hp) * (win ? 2 : 0), bst = gmGet("loesch", 0), nb = pts > bst; if (nb) gmSet("loesch", pts);
    gmEnd(el, win ? "Haus gerettet!" : "Das Haus brennt ab …", [score + " Punkte" + (win ? " + " + Math.round(hp) * 2 + " Bonus für das Haus" : ""), nb ? "Neuer Rekord: " + pts : "Rekord: " + bst], () => gamesStart("loesch")); }
  gmTimers.push(setTimeout(loop, 500));
}

/* ----- 3. Brandklassen-Blitz ----- */
const GM_BK = [["Holz", "A"], ["Papier", "A"], ["Kohle", "A"], ["Stroh", "A"], ["Benzin", "B"], ["Heizöl", "B"], ["Lack", "B"], ["Alkohol", "B"], ["Erdgas", "C"], ["Propan", "C"], ["Methan", "C"], ["Acetylen", "C"], ["Magnesium", "D"], ["Aluminiumstaub", "D"], ["Natrium", "D"], ["Frittieröl", "F"], ["Bratfett", "F"], ["Speiseöl in der Pfanne", "F"], ["E-Bike-Akku", "L"], ["Akku eines E-Autos", "L"], ["Lithium-Ionen-Batterie", "L"], ["PV-Speicher (Heimbatterie)", "L"], ["Handy-Akku", "L"]];
const GM_BKN = { A: "feste Stoffe", B: "flüssige Stoffe", C: "Gase", D: "Metalle", F: "Speisefette und -öle", L: "Lithium-Ionen-Akkus" };
function gmKlassen(el) {
  const qs = gmShuffle(Object.keys(GM_BKN).flatMap(k => gmShuffle(GM_BK.filter(x => x[1] === k)).slice(0, 2))); let i = 0, pts = 0, streak = 0;
  const show = () => {
    if (i >= qs.length) { const bst = gmGet("klassen", 0), nb = pts > bst; if (nb) gmSet("klassen", pts); return gmEnd(el, "Fertig!", [pts + " Punkte von " + qs.length * 10, nb ? "Neuer Rekord!" : "Rekord: " + bst], () => gamesStart("klassen")); }
    el.innerHTML = `<div class="gmbar"><span>Frage ${i + 1} / ${qs.length}</span><span>Punkte: ${pts}</span></div><div class="bkq"><small>Brandklasse von</small><b>${esc(qs[i][0])}</b></div>
      <div class="bkb">${Object.keys(GM_BKN).map(k => `<button class="btn bkbtn" data-k="${k}"><b>${k}</b><small>${GM_BKN[k]}</small></button>`).join("")}</div><div id="bkm" class="sinfo" role="status"></div>`;
    el.querySelectorAll(".bkbtn").forEach(b => b.onclick = () => {
      const ok = b.dataset.k === qs[i][1]; el.querySelectorAll(".bkbtn").forEach(x => { x.disabled = true; if (x.dataset.k === qs[i][1]) x.classList.add("good"); }); if (!ok) b.classList.add("badc");
      if (ok) { streak++; pts += 10 + (streak > 2 ? 5 : 0); } else streak = 0; document.getElementById("bkm").textContent = ok ? "Richtig!" + (streak > 2 ? " Serie: " + streak : "") : qs[i][0] + " ist Klasse " + qs[i][1] + " (" + GM_BKN[qs[i][1]] + ").";
      i++; gmTimers.push(setTimeout(show, ok ? 650 : 1500));
    });
  };
  show();
}

/* ----- 4. Leitungsbau: Rohre drehen ----- */
function gmRohr(el) {
  const S = 5, open = { I: [0, 2], L: [0, 1], T: [0, 1, 3] };
  /* Öffnungen: N=0 O=1 S=2 W=3. Pfad vom Hydranten (links oben) zum Strahlrohr (rechts unten), Rest zufällige Rohre */
  const g = Array.from({ length: S }, () => Array.from({ length: S }, () => ({ t: ["L", "I", "T", "L", "I"][Math.random() * 5 | 0], r: Math.random() * 4 | 0 })));
  const path = [[0, 0]]; let px = 0, py = 0;
  while (px < S - 1 || py < S - 1) { if (px === S - 1) py++; else if (py === S - 1) px++; else if (Math.random() < .5) px++; else py++; path.push([px, py]); }
  const same = (a, b) => a.length === b.length && a.every(d => b.includes(d));
  path.forEach(([cx, cy], k) => {
    const need = [], p = path[k - 1], n = path[k + 1];
    [p, n].forEach(q => { if (q) need.push(q[0] > cx ? 1 : q[0] < cx ? 3 : q[1] > cy ? 2 : 0); });
    if (k === 0) need.push(3); if (k === path.length - 1) need.push(1);
    const t = (need[0] + 2) % 4 === need[1] ? "I" : "L"; let r = 0; for (let q = 0; q < 4; q++) if (same(open[t].map(d => (d + q) % 4), need)) { r = q; break; }
    g[cy][cx] = { t, sr: r, r: t === "I" ? (r + 1) % 2 : (r + 1 + (Math.random() * 3 | 0)) % 4 };
  });
  const dirsOf = c => open[c.t].map(d => (d + c.r) % 4);
  const svg = c => { const ds = dirsOf(c), P = { 0: "M24 24V0", 1: "M24 24H48", 2: "M24 24V48", 3: "M24 24H0" }; return `<svg viewBox="0 0 48 48" class="pipe">${ds.map(d => `<path d="${P[d]}"/>`).join("")}<circle cx="24" cy="24" r="5"/></svg>`; };
  const D = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const wet = () => { const w = Array.from({ length: S }, () => new Array(S).fill(false)); const q = []; if (dirsOf(g[0][0]).includes(3)) { w[0][0] = true; q.push([0, 0]); }
    while (q.length) { const [cx, cy] = q.shift(); dirsOf(g[cy][cx]).forEach(d => { const nx = cx + D[d][0], ny = cy + D[d][1]; if (nx < 0 || ny < 0 || nx >= S || ny >= S || w[ny][nx]) return; if (dirsOf(g[ny][nx]).includes((d + 2) % 4)) { w[ny][nx] = true; q.push([nx, ny]); } }); }
    return w; };
  el.innerHTML = `<div class="gmbar"><span id="gmn">Drehungen: 0</span><span id="gmt">0 s</span></div>
    <div class="rohrw"><span class="hyd" title="Hydrant">💧</span><div class="rgrid" style="--s:${S}"></div><span class="nzl" title="Strahlrohr">🚒</span></div>
    <p class="foot">Tippe ein Rohr, um es zu drehen. Das Wasser läuft vom Hydranten links oben bis zum Strahlrohr rechts unten.</p>`;
  const gr = el.querySelector(".rgrid"); let moves = 0, t0 = 0, done = false;
  const draw = () => { const w = wet(); gr.innerHTML = g.map((row, yy) => row.map((c, xx) => `<button class="rc${w[yy][xx] ? " wet" : ""}" data-x="${xx}" data-y="${yy}" style="--rot:${c.r * 90}deg" aria-label="Rohr">${svg({ t: c.t, r: 0 })}</button>`).join("")).join("");
    gr.querySelectorAll(".rc").forEach(b => b.onclick = () => rot(+b.dataset.x, +b.dataset.y)); return w; };
  function rot(cx, cy) { if (done) return; if (!t0) t0 = Date.now(); g[cy][cx].r = (g[cy][cx].r + 1) % 4; moves++; document.getElementById("gmn").textContent = "Drehungen: " + moves; const w = draw();
    if (w[S - 1][S - 1] && dirsOf(g[S - 1][S - 1]).includes(1)) { done = true; const s = Math.round((Date.now() - t0) / 1000), bst = gmGet("rohr", 0), nb = !bst || s < bst; if (nb) gmSet("rohr", s); gmTimers.push(setTimeout(() => gmEnd(el, "Wasser marsch!", ["Zeit: " + s + " s, " + moves + " Drehungen.", nb ? "Neue Bestzeit!" : "Bestzeit: " + bst + " s"], () => gamesStart("rohr")), 900)); } }
  gmEvery(() => { if (t0 && !done) document.getElementById("gmt").textContent = Math.round((Date.now() - t0) / 1000) + " s"; }, 500, el);
  /* Falls schon beim Start gelöst: nochmal mischen */
  let w0 = draw(); while (w0[S - 1][S - 1] && dirsOf(g[S - 1][S - 1]).includes(1)) { const [qx, qy] = path[1 + (Math.random() * (path.length - 2) | 0)]; g[qy][qx].r = (g[qy][qx].r + 1) % 4; w0 = draw(); }
}

/* ----- 5. Feuer-Wörter (Galgenmännchen) ----- */
const GM_WORDS = ["HYDRANT", "STRAHLROHR", "ATEMSCHUTZ", "LÖSCHWASSER", "SCHLAUCH", "DREHLEITER", "TAUCHPUMPE", "WÄRMEBILDKAMERA", "FEUERLÖSCHER", "BRANDMELDER", "SCHIEBELEITER", "MOTORSPRITZE", "RETTUNGSKETTE", "BRANDKLASSE", "EINSATZLEITER", "FLASHOVER", "PRESSLUFTATMER", "SCHAUMROHR", "STANDROHR", "GRUPPENFÜHRER", "TANKLÖSCHFAHRZEUG", "FEUERWEHRHELM", "NOTRUF", "LÖSCHDECKE", "VERKEHRSDIENST", "SAUERSTOFF", "DRUCKLEITUNG", "ABSPERRBAND"];
function gmWort(el) {
  const words = gmShuffle(GM_WORDS); let wi = 0, score = 0, lives = 6, miss = 0, used = new Set();
  const render = () => {
    const w = words[wi], shown = [...w].map(c => used.has(c) ? c : "_").join(" "), won = ![...w].some(c => !used.has(c)), lost = miss >= lives;
    const keys = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ"].map(k => `<button class="key${used.has(k) ? (w.includes(k) ? " good" : " badc") : ""}" data-k="${k}"${used.has(k) || won || lost ? " disabled" : ""}>${k}</button>`).join("");
    el.innerHTML = `<div class="gmbar"><span>Wörter: ${score}</span><span>Leben: ${"❤️".repeat(lives - miss)}${"🖤".repeat(miss)}</span></div>
      <div class="hang"><div class="hose" style="--p:${miss / lives}"></div><div class="hw">${shown}</div></div>
      <div class="keys">${keys}</div>${won ? '<button class="btn primary" id="wnext">Nächstes Wort</button>' : ""}`;
    if (won) { score++; document.getElementById("wnext").onclick = () => { wi++; used = new Set(); miss = 0; render(); }; el.querySelector(".gmbar span").textContent = "Wörter: " + score; }
    if (lost) { const bst = gmGet("wort", 0), nb = score > bst; if (nb) gmSet("wort", score); return gmEnd(el, "Verbrannt!", ["Das Wort war " + w + ".", score + " Wörter geschafft." + (nb ? " Neuer Rekord!" : " Rekord: " + bst)], () => gamesStart("wort")); }
    el.querySelectorAll(".key").forEach(b => b.onclick = () => { used.add(b.dataset.k); if (!w.includes(b.dataset.k)) miss++; render(); });
  };
  render();
}

/* ----- 6. Einsatzfahrt: dem Verkehr ausweichen ----- */
function gmFahrt(el) {
  const W = Math.min(360, el.clientWidth || 360), H = Math.round(W * 1.45), L = 3, LW = W / L;
  el.innerHTML = `<div class="gmbar"><span id="fm">0 m</span><span id="fl">Tempo 1</span><span id="fb">Tropfen: 0</span></div><canvas id="fc" width="${W}" height="${H}" class="fcv" aria-label="Spielfeld"></canvas><p class="foot">Tippe links oder rechts (oder wische), um die Spur zu wechseln. Sammle Wassertropfen, weiche den Autos aus.</p>`;
  const cv = document.getElementById("fc"), g = cv.getContext("2d"); cv.style.width = W + "px";
  let lane = 1, tx = lane * LW + LW / 2, x = tx, dist = 0, v = 150, obs = [], drops = 0, nxt = .6, tt = 0, dead = false, last = performance.now(), stripe = 0;
  const cols = ["#3a7bd5", "#2fa66b", "#8e5bd0", "#d98a1f", "#e8d23a"];
  const go = d => { lane = Math.max(0, Math.min(L - 1, lane + d)); };
  cv.addEventListener("pointerdown", e => { const r = cv.getBoundingClientRect(); go(e.clientX - r.left < r.width / 2 ? -1 : 1); e.preventDefault(); });
  let sx = null; cv.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
  cv.addEventListener("touchend", e => { if (sx !== null && Math.abs(e.changedTouches[0].clientX - sx) > 30) go(e.changedTouches[0].clientX > sx ? 1 : -1); sx = null; });
  const key = e => { if (!el.isConnected) return removeEventListener("keydown", key); if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); };
  addEventListener("keydown", key);
  function car(cx, cy, w, h, c, truck) { g.fillStyle = c; g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, 6); g.fill(); g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(cx - w / 2 + 4, cy - h / 2 + (truck ? 6 : 10), w - 8, h * .18); g.fillStyle = "#111"; g.fillRect(cx - w / 2 - 2, cy - h / 2 + 8, 3, 12); g.fillRect(cx + w / 2 - 1, cy - h / 2 + 8, 3, 12); g.fillRect(cx - w / 2 - 2, cy + h / 2 - 20, 3, 12); g.fillRect(cx + w / 2 - 1, cy + h / 2 - 20, 3, 12); }
  function frame(now) {
    if (!el.isConnected || over) return; const dt = Math.min(.05, (now - last) / 1000); last = now; tt += dt;
    if (!dead) { v = Math.min(420, 150 + dist / 14); dist += v * dt / 8; stripe = (stripe + v * dt) % 60; tx = lane * LW + LW / 2; x += (tx - x) * Math.min(1, dt * 14);
      nxt -= dt; if (nxt <= 0) { nxt = Math.max(.32, .95 - dist / 3000) * (.7 + Math.random() * .6); const ln = Math.random() * L | 0, drop = Math.random() < .28; obs.push({ ln, y: -50, drop, c: cols[Math.random() * cols.length | 0], big: !drop && Math.random() < .25 }); }
      obs.forEach(o => { o.y += v * dt * (o.drop ? 1 : .78); }); obs = obs.filter(o => o.y < H + 60);
      const px = x, py = H - 80;
      obs.forEach(o => { if (o.done) return; const ox = o.ln * LW + LW / 2, hw = o.drop ? 16 : (o.big ? 24 : 18), hh = o.drop ? 16 : (o.big ? 46 : 32);
        if (Math.abs(ox - px) < hw + 17 && Math.abs(o.y - py) < hh + 34) { if (o.drop) { o.done = true; drops++; dist += 12; } else { dead = true; } } }); }
    g.fillStyle = "#4b5058"; g.fillRect(0, 0, W, H); g.fillStyle = "#2f7d4f"; g.fillRect(0, 0, 5, H); g.fillRect(W - 5, 0, 5, H);
    g.fillStyle = "#e9e1d6"; for (let l = 1; l < L; l++) for (let y = -60 + stripe; y < H; y += 60) g.fillRect(l * LW - 2, y, 4, 30);
    obs.forEach(o => { if (o.done) return; const ox = o.ln * LW + LW / 2;
      if (o.drop) { g.fillStyle = "#5bb6ff"; g.beginPath(); g.moveTo(ox, o.y - 16); g.quadraticCurveTo(ox + 16, o.y + 6, ox, o.y + 14); g.quadraticCurveTo(ox - 16, o.y + 6, ox, o.y - 16); g.fill(); }
      else car(ox, o.y, o.big ? 48 : 36, o.big ? 92 : 64, o.c, o.big); });
    const py = H - 80, blink = Math.floor(tt * 8) % 2;
    car(x, py, 38, 72, "#c8161d", true); g.fillStyle = "#fff"; g.fillRect(x - 15, py + 6, 30, 5); g.fillStyle = blink ? "#3a8bff" : "#ff3030"; g.fillRect(x - 12, py - 26, 10, 6); g.fillStyle = blink ? "#ff3030" : "#3a8bff"; g.fillRect(x + 2, py - 26, 10, 6);
    if (dead) { g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(0, 0, W, H); g.fillStyle = "#fff"; g.font = "700 26px system-ui,sans-serif"; g.textAlign = "center"; g.fillText("Unfall!", W / 2, H / 2); }
    document.getElementById("fm").textContent = Math.round(dist) + " m"; document.getElementById("fl").textContent = "Tempo " + Math.round(v / 60); document.getElementById("fb").textContent = "Tropfen: " + drops;
    if (dead && !last0) { last0 = now; gmTimers.push(setTimeout(() => { over = true; const pts = Math.round(dist), bst = gmGet("fahrt", 0), nb = pts > bst; if (nb) gmSet("fahrt", pts); gmEnd(el, "Angekommen? Leider nicht.", [pts + " m gefahren, " + drops + " Tropfen gesammelt.", nb ? "Neuer Rekord!" : "Rekord: " + bst + " m"], () => gamesStart("fahrt")); }, 900)); }
    requestAnimationFrame(frame);
  }
  let last0 = 0, over = false; requestAnimationFrame(frame);
}
