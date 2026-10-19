const APP_VERSION = "1.78";
/* ---------- Zustand und Speicher ---------- */
const app = document.getElementById("app");
const backBtn = document.getElementById("back");
FWZ.onChange(() => { if (state.view === "les") lesView(); greetUpd(); });
let state = { mod: null, tab: "cards", ch: null, cf: null, lc: null };
let prog = {};
try { prog = JSON.parse(localStorage.getItem("fwz-progress") || "{}"); } catch (e) { prog = {}; }
if (prog.einsatz && !prog.einsatz.v2) prog.einsatz = { known: [], best: null, v2: 1 };
function save() { try { localStorage.setItem("fwz-progress", JSON.stringify(prog)); } catch (e) {} }
function mp(id) { return prog[id] || (prog[id] = { known: [], best: null, v2: 1 }); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function getMod(id) { return MODS.find(m => m.id === id); }

/* ---------- Startseite ---------- */
const LOGO_OLD = `<svg viewBox="0 0 120 140" width="120" height="140" role="img" aria-label="Wappen Feuerwehr Zuchwil"><path d="M60 4 112 22v50c0 32-22 52-52 64C30 124 8 104 8 72V22z" fill="var(--red)"/><path d="M60 14 102 28v44c0 26-17 43-42 53-25-10-42-27-42-53V28z" fill="none" stroke="var(--red-ink)" stroke-width="2.5"/><path d="M60 30c4 14 20 22 20 42a20 20 0 0 1-40 0c0-10 5-16 9-22 1 7 4 10 8 11-3-12-1-22 3-31z" fill="var(--red-ink)"/><path d="M60 68c2 7 10 10 10 19a10 10 0 0 1-20 0c0-5 3-8 5-11 1 3 2 5 5 5-1-5-1-9 0-13z" fill="var(--red)"/></svg>`;
/* ---------- Wetter Zuchwil (Open-Meteo) ---------- */
const WX_URL = "https://api.open-meteo.com/v1/forecast?latitude=47.2&longitude=7.56&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,precipitation&hourly=temperature_2m,precipitation_probability,weather_code,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,sunrise,sunset&timezone=Europe%2FZurich&forecast_days=7";
function wxIcon(c, night) {
  if (c === 0) return night ? "🌙" : "☀️"; if (c === 1) return night ? "🌙" : "🌤️"; if (c === 2) return "⛅"; if (c === 3) return "☁️";
  if (c === 45 || c === 48) return "🌫️"; if (c >= 51 && c <= 57) return "🌦️"; if (c >= 61 && c <= 67) return "🌧️"; if (c >= 71 && c <= 77) return "🌨️";
  if (c >= 80 && c <= 82) return "🌦️"; if (c === 85 || c === 86) return "🌨️"; if (c >= 95) return "⛈️"; return "🌡️";
}
function wxText(c) {
  const t = { 0: "Klar", 1: "Überwiegend klar", 2: "Teils bewölkt", 3: "Bedeckt", 45: "Nebel", 48: "Reifnebel", 51: "Leichter Niesel", 53: "Niesel", 55: "Starker Niesel", 56: "Gefrierender Niesel", 57: "Gefrierender Niesel", 61: "Leichter Regen", 63: "Regen", 65: "Starker Regen", 66: "Gefrierender Regen", 67: "Gefrierender Regen", 71: "Leichter Schnee", 73: "Schnee", 75: "Starker Schnee", 77: "Schneegriesel", 80: "Leichte Schauer", 81: "Schauer", 82: "Heftige Schauer", 85: "Schneeschauer", 86: "Starke Schneeschauer", 95: "Gewitter", 96: "Gewitter mit Hagel", 99: "Starkes Gewitter mit Hagel" };
  return t[c] || "Wetter";
}
async function wxGet() {
  let cache = null; try { cache = JSON.parse(localStorage.getItem("fwz-wx") || "null"); } catch (e) {}
  if (cache && Date.now() - cache.t < 20 * 60 * 1000) return { d: cache.d, t: cache.t, old: false };
  try {
    const d = await (await fetch(WX_URL)).json(); if (!d.current) throw new Error("x");
    try { localStorage.setItem("fwz-wx", JSON.stringify({ t: Date.now(), d })); } catch (e) {}
    return { d, t: Date.now(), old: false };
  } catch (e) { if (cache) return { d: cache.d, t: cache.t, old: true }; throw e; }
}
async function wxStrip() {
  const b = document.getElementById("wxs"); if (!b) return;
  try {
    const { d } = await wxGet(), c = d.current, h = new Date(c.time).getHours(), night = h < 6 || h >= 21;
    if (!document.getElementById("wxs")) return;
    const idx = []; d.hourly.time.forEach((t, i) => { const ms = new Date(t).getTime(); if (ms >= new Date(c.time).getTime() + 30 * 60 * 1000 && idx.length < 5 && (new Date(t).getHours() % 3 === 0)) idx.push(i); });
    b.innerHTML = `<div class="wxtop"><span class="wxbi">${wxIcon(c.weather_code, night)}</span><div class="wxtemp">${Math.round(c.temperature_2m)}°</div><div class="wxinfo"><b>${esc(wxText(c.weather_code))}</b><span>Zuchwil · ${Math.round(d.daily.temperature_2m_min[0])}° / ${Math.round(d.daily.temperature_2m_max[0])}°</span></div></div>
      <div class="wxrow">${idx.map(i => { const t = new Date(d.hourly.time[i]), n = t.getHours() < 6 || t.getHours() >= 21; return `<div><span>${String(t.getHours()).padStart(2, "0") + ":00"}</span><i>${wxIcon(d.hourly.weather_code[i], n)}</i><b>${Math.round(d.hourly.temperature_2m[i])}°</b></div>`; }).join("")}</div>`;
  } catch (e) { b.textContent = "Wetter Zuchwil"; }
}
async function wxView() {
  state.mod = null; state.view = "wx"; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  app.innerHTML = '<section class="hero"><h1>Wetter Zuchwil</h1><p>Prognose für die nächsten Tage. Quelle: Open-Meteo.</p></section><div id="wxb" class="note">Lade Wetter …</div>';
  window.scrollTo(0, 0);
  let r; try { r = await wxGet(); } catch (e) { const bx = document.getElementById("wxb"); if (bx) bx.textContent = "Wetter nicht verfügbar (keine Verbindung)."; return; }
  if (state.view !== "wx") return;
  const d = r.d, c = d.current, dy = d.daily, now = new Date(c.time).getTime(), day = x => new Date(x).toLocaleDateString("de-CH", { weekday: "short" });
  const hrs = []; d.hourly.time.forEach((t, i) => { const ms = new Date(t).getTime(); if (ms >= now - 30 * 60 * 1000 && hrs.length < 24) hrs.push(i); });
  const gust = Math.max(...d.hourly.wind_gusts_10m.slice(0, 48), c.wind_gusts_10m || 0), thunder = d.hourly.weather_code.slice(0, 48).some(x => x >= 95);
  const warn = [];
  if (gust >= 60) warn.push("Böen bis " + Math.round(gust) + " km/h in den nächsten 48 Stunden");
  if (thunder) warn.push("Gewitter in den nächsten 48 Stunden möglich");
  if (dy.precipitation_sum.slice(0, 2).some(x => x >= 20)) warn.push("Viel Regen erwartet (über 20 mm pro Tag)");
  if (dy.temperature_2m_min.slice(0, 2).some(x => x <= 0)) warn.push("Frost möglich (Glatteisgefahr)");
  document.getElementById("wxb").outerHTML = `
    <div class="wxnow"><div class="wxbig">${wxIcon(c.weather_code, new Date(c.time).getHours() < 6 || new Date(c.time).getHours() >= 21)}</div><div><div class="wxt">${Math.round(c.temperature_2m)}°</div><div class="wxd">${esc(wxText(c.weather_code))}</div></div>
      <div class="wxs"><div>Gefühlt ${Math.round(c.apparent_temperature)}°</div><div>Wind ${Math.round(c.wind_speed_10m)} km/h</div><div>Böen ${Math.round(c.wind_gusts_10m)} km/h</div><div>Regen ${c.precipitation} mm</div></div></div>
    ${warn.length ? `<div class="note wxwarn"><b>Achtung</b><ul>${warn.map(w => `<li>${esc(w)}</li>`).join("")}</ul></div>` : ""}
    <h3 class="zh">Nächste 24 Stunden</h3>
    <div class="wxh">${hrs.map(i => { const t = new Date(d.hourly.time[i]), n = t.getHours() < 6 || t.getHours() >= 21; return `<div class="wxc"><div>${String(t.getHours()).padStart(2, "0") + ":00"}</div><div class="wxi">${wxIcon(d.hourly.weather_code[i], n)}</div><b>${Math.round(d.hourly.temperature_2m[i])}°</b><div class="wxp">${d.hourly.precipitation_probability[i]}%</div></div>`; }).join("")}</div>
    <h3 class="zh">7 Tage</h3>
    <div class="wxdays">${dy.time.map((t, i) => `<div class="wxr"><span class="wxdn">${i === 0 ? "Heute" : day(t)}</span><span class="wxi">${wxIcon(dy.weather_code[i])}</span><span class="wxp">${dy.precipitation_probability_max[i]}% · ${dy.precipitation_sum[i]} mm</span><span class="wxmm"><span>${Math.round(dy.temperature_2m_min[i])}°</span> <b>${Math.round(dy.temperature_2m_max[i])}°</b></span></div>`).join("")}</div>
    <p class="foot">Sonne: ${esc(dy.sunrise[0].slice(11))} bis ${esc(dy.sunset[0].slice(11))} Uhr. Stand ${new Date(r.t).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}${r.old ? " (zuletzt gespeichert, keine Verbindung)" : ""}. Amtliche Warnungen: <a class="lnk" href="https://www.meteoschweiz.admin.ch/lokal/warnungen.html" target="_blank" rel="noopener">MeteoSchweiz</a>.</p>`;
}
function greetUpd() {
  const el = document.getElementById("greet"); if (!el) return;
  const h = new Date().getHours(), tod = h < 5 ? "night" : h < 10 ? "morning" : h < 17 ? "day" : h < 22 ? "evening" : "night";
  const hi = h < 5 ? "Gute Nacht" : h < 10 ? "Guten Morgen" : h < 17 ? "Guten Tag" : h < 22 ? "Guten Abend" : "Gute Nacht";
  let n = ""; try { n = FWZ.user ? FWZ.label() : ""; } catch (e) {}
  n = n ? n.charAt(0).toUpperCase() + n.slice(1) : "";
  const t = hi + (n ? ", " + n : "");
  if (el.textContent !== t) el.textContent = t;
  const L = document.querySelector(".landing"); if (L && L.dataset.tod !== tod) L.dataset.tod = tod;
}
function start() {
  state.mod = null; state.from = null; state.view = "start"; backBtn.hidden = true;
  document.body.classList.add("startpage"); document.querySelector(".top").hidden = true;
  app.innerHTML = `
    <section class="landing">
      <div class="clock" id="clock"></div>
      <div class="date" id="date"></div>
      <button class="logobtn" id="logoup" aria-label="Nach Update suchen"><img src="logo.jpg" alt="Feuerwehr Zuchwil"></button>
      <div class="greet" id="greet"></div>
      <div class="menu">
        <button class="mbtn main" id="t-reg">Reglemente</button>
        <button class="mbtn main" id="t-les">Lektionen</button>
        <button class="mbtn main" id="t-ao">Lernen für den Ausbildungsoffizier</button>
      </div>
      <div class="bottom">
        <button class="wxcard" id="wxs" aria-label="Wetter Zuchwil"><span class="wxl">Wetter Zuchwil …</span></button>
        <div class="ver-foot" id="verf">V${APP_VERSION} · Logo antippen zum Aktualisieren</div>
        <button class="thm" id="thm">Design: ${document.documentElement.classList.contains("zw") ? "Zuchwil hell · auf Dunkel wechseln" : "Dunkel · auf Zuchwil hell wechseln"}</button>
      </div>
    </section>`;
  document.getElementById("thm").onclick = () => { const h = document.documentElement.classList, z = h.toggle("zw"); try { localStorage.setItem("fwz-theme", z ? "zw" : "dark"); } catch (e) {} const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = z ? "#c8161d" : "#121419"; document.getElementById("thm").textContent = z ? "Design: Zuchwil hell · auf Dunkel wechseln" : "Design: Dunkel · auf Zuchwil hell wechseln"; };
  const tick = () => { const c = document.getElementById("clock"); if (!c) return clearInterval(clk); c.textContent = new Date().toLocaleTimeString("de-CH", { hour12: false }); const dt = document.getElementById("date"); if (dt) dt.textContent = new Date().toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); greetUpd(); };
  clearInterval(window.clk); tick(); window.clk = setInterval(tick, 1000); var clk = window.clk;
  document.getElementById("logoup").onclick = appUpdate;
  document.getElementById("wxs").onclick = wxView; wxStrip();
  document.getElementById("t-reg").onclick = home;
  document.getElementById("t-les").onclick = () => { state.lc = null; lesView(); };
  document.getElementById("t-ao").onclick = aoView;
  window.scrollTo(0, 0);
}

function fireFx(btn) {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return { level() {} };
  let cv = btn.querySelector("canvas.fire");
  if (!cv) { cv = document.createElement("canvas"); cv.className = "fire"; cv.style.position = "absolute"; btn.appendChild(cv); }
  const im = btn.querySelector("img"), dpr = Math.min(window.devicePixelRatio || 1, 2), W = im.clientWidth, H = im.clientHeight, PX = 60, PT = 280;
  cv.style.cssText = `position:absolute;left:${-PX}px;top:${-PT}px;width:${W + 2 * PX}px;height:${H + PT + 20}px;pointer-events:none`;
  cv.width = (W + 2 * PX) * dpr; cv.height = (H + PT + 20) * dpr;
  const g = cv.getContext("2d"); g.scale(dpr, dpr);
  const ps = []; if (btn.isConnected) { /* Platz nach oben */ } let lvl = 0, rate = 0, last = 0, run = false;
  const rates = [0, 200, 450];
  function frame(t) {
    if (!cv.isConnected) return;
    const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
    rate += (rates[lvl] - rate) * Math.min(1, dt * 6);
    let n = rate * dt + Math.random(); n = n | 0;
    for (let i = 0; i < n; i++) {
      const edge = Math.random() < .4, x = edge ? (Math.random() < .5 ? Math.random() * .2 : 1 - Math.random() * .2) : Math.random(), big = lvl === 2, spark = Math.random() < .08;
      ps.push({ x: PX + x * W, y: PT + H - 4 - Math.random() * H * (big ? .5 : .15), vx: (Math.random() - .5) * (spark ? 140 : 44), vy: -(spark ? 200 + Math.random() * 260 : 110 + Math.random() * 190) * (big ? 1.5 : 1.1), l: 0, life: spark ? .8 + Math.random() * 1.2 : .9 + Math.random() * 1.1, r: spark ? 2 + Math.random() * 2.5 : (12 + Math.random() * 20) * (big ? 1.2 : 1), spark });
    }
    g.clearRect(0, 0, W + 2 * PX, H + PT + 20); g.globalCompositeOperation = "lighter";
    if (rate > 40) { const gl = g.createRadialGradient(PX + W / 2, PT + H * .7, 10, PX + W / 2, PT + H * .7, W * .75); gl.addColorStop(0, `rgba(255,120,20,${Math.min(.2, rate / 3500)})`); gl.addColorStop(1, "rgba(255,60,0,0)"); g.fillStyle = gl; g.fillRect(0, 0, W + 2 * PX, H + PT + 20); }
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]; p.l += dt; if (p.l >= p.life) { ps.splice(i, 1); continue; }
      const a = p.l / p.life; p.x += (p.vx + Math.sin(p.l * 9 + i) * 18) * dt; p.y += p.vy * dt; p.vy *= .995;
      const r = p.spark ? p.r * (1 - a * .5) : p.r * (1 - a * .7), col = p.spark ? "255,240,170" : a < .2 ? "255,200,70" : a < .5 ? "255,130,20" : a < .8 ? "235,50,20" : "90,40,35", al = p.spark ? 1 - a : (a > .8 ? .3 : (1 - a) * .45);
      g.globalCompositeOperation = p.spark ? "lighter" : "source-over"; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); gr.addColorStop(0, `rgba(${col},${al})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r, 0, 6.2832); g.fill();
    }
    if (ps.length || lvl) requestAnimationFrame(frame); else { run = false; g.clearRect(0, 0, W + 2 * PX, H + PT + 20); }
  }
  return { level(l) { lvl = l; if (!run) { run = true; last = performance.now(); requestAnimationFrame(frame); } } };
}
async function appUpdate() {
  const v = document.getElementById("verf"); if (!v) return;
  const lb = document.getElementById("logoup"); if (lb.classList.contains("busy")) return;
  const fx = c => { lb.classList.remove("busy", "ok", "upd"); void lb.offsetWidth; if (c) lb.classList.add(c); };
  const fire = lb._fire || (lb._fire = fireFx(lb)); fire.level(1);
  fx("busy"); v.textContent = "Suche nach Update …"; const t0 = Date.now(), wait = () => new Promise(r => setTimeout(r, Math.max(0, 900 - (Date.now() - t0))));
  try {
    const t = await (await fetch("app.js?u=" + Date.now(), { cache: "no-store" })).text();
    const nv = (t.match(/APP_VERSION = "([^"]+)"/) || [])[1];
    if (nv && nv === APP_VERSION) { await wait(); fire.level(0); fx("ok"); setTimeout(() => lb.classList.remove("ok"), 1200); v.textContent = "Die App ist aktuell (V" + APP_VERSION + ")"; setTimeout(() => { const e = document.getElementById("verf"); if (e) e.textContent = "V" + APP_VERSION + " · Logo antippen zum Aktualisieren"; }, 3500); return; }
    await wait(); fire.level(2); fx("upd"); v.textContent = "Neue Version" + (nv ? " V" + nv : "") + " wird geladen …";
    if ("caches" in window) for (const k of await caches.keys()) await caches.delete(k);
    if ("serviceWorker" in navigator) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    await new Promise(r => setTimeout(r, 2000)); location.reload();
  } catch (e) { fire.level(0); lb.classList.remove("busy", "ok", "upd"); v.textContent = "Keine Verbindung, Update nicht möglich."; }
}

/* ---------- Suche ---------- */
const fold = t => t.toLowerCase().replace(/[äàâá]/g, "a").replace(/[öòôó]/g, "o").replace(/[üùûú]/g, "u").replace(/[éèêë]/g, "e").replace(/[îì]/g, "i");
function hl(text, words) {
  const f = fold(text), r = [];
  words.forEach(w => { let p = 0, k; while ((k = f.indexOf(w, p)) >= 0) { r.push([k, k + w.length]); p = k + w.length; } });
  r.sort((a, b) => a[0] - b[0]);
  let out = "", pos = 0;
  r.forEach(([a, b]) => { if (a < pos) { if (b > pos) { out += "<mark>" + esc(text.slice(pos, b)) + "</mark>"; pos = b; } return; } out += esc(text.slice(pos, a)) + "<mark>" + esc(text.slice(a, b)) + "</mark>"; pos = b; });
  return out + esc(text.slice(pos));
}
function snip(text, words) {
  const f = fold(text); let k = -1;
  words.forEach(w => { const x = f.indexOf(w); if (x >= 0 && (k < 0 || x < k)) k = x; });
  if (text.length <= 170 || k < 0) return text.length > 170 ? text.slice(0, 170) + "…" : text;
  const a = Math.max(0, k - 60), b = Math.min(text.length, k + 110);
  return (a > 0 ? "…" : "") + text.slice(a, b) + (b < text.length ? "…" : "");
}
function search(q) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  const res = [];
  MODS.forEach(m => {
    m.sections.forEach((s, i) => {
      const paras = s.p.concat((s.bx || []).flatMap(b => b[2])).filter(p => words.every(w => fold(s.t + " " + p).includes(w)));
      const titleHit = words.every(w => fold(s.t).includes(w));
      if ((paras.length || titleHit) && (s.t.match(/^(\d+(?:\.\d+)*)\s/) && rgNum(m.id, s.t.match(/^(\d+(?:\.\d+)*)\s/)[1]))) res.push({ t: "s", m, s, i, paras: paras.length ? paras.slice(0, 2) : [s.p[0]], score: titleHit ? 2 : 1 });
    });
    m.cards.forEach((c, i) => { if (words.every(w => fold(c[0] + " " + c[1]).includes(w))) res.push({ t: "c", m, c, score: 0 }); });
  });
  res.sort((a, b) => b.score - a.score);
  return { words, res };
}
function renderSearch(q, box) {
  const { words, res } = search(q);
  const shown = res.slice(0, 40);
  box.innerHTML = `<p class="sinfo">${res.length} Treffer${res.length > 40 ? " (die ersten 40)" : ""}</p><div class="sres">` + shown.map((r, n) => {
    if (r.t === "s") {
      const k = r.s.g ? "Kap. " + r.s.g.split(" ")[0] + " · " : "";
      return `<button class="hit" data-n="${n}"><div class="where">${esc(r.m.title)} · ${esc(k)}im Reglement (PDF)</div><h3>${hl(r.s.t, words)}</h3>${r.paras.map(p => `<p>${hl(snip(p, words), words)}</p>`).join("")}</button>`;
    }
    return `<div class="hit card"><div class="where">${esc(r.m.title)} · Lernkarte${r.c[2] ? " · Kap. " + esc(r.c[2]) : ""}</div><p>${hl(r.c[0], words)}</p><p class="ans">${hl(r.c[1], words)}</p></div>`;
  }).join("") + "</div>";
  box.querySelectorAll(".hit[data-n]").forEach(b => b.addEventListener("click", () => {
    const r = shown[+b.dataset.n];
    const n = (r.s.t.match(/^(\d+(?:\.\d+)*)\s/) || [])[1], t = n && rgNum(r.m.id, n); if (t) rgJump(r.m.id, t.page, () => home());
  }));
}
function subView(g) {
  state.sub = g; state.mod = null; state.from = null; state.view = "sub"; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  const bt = (id, t, sm) => `<button class="mbtn main pdfbtn" data-id="${id}"><span>${esc(t)}</span><small>${esc(sm)}</small></button>`;
  let h;
  if (g === "basis") {
    const bm = getMod("basis"), gb = (mp("basis").gbs || {})[bm.quiz.length];
    h = bt("pdf:basis", "Basiswissen komplett", "PDF · " + RGDEF.basis.pages + " S.") +
      bt("basis", "Lernkarten", mp("basis").known.length + " von " + bm.cards.length + " gewusst") +
      bt("gq", "Quiz", bm.quiz.length + " Fragen" + (gb != null ? " · Best " + gb : "")) +
      bt("spick", "Spickzettel", "wichtigste Zahlen · PDF");
  } else if (g === "abc") {
    h = (((window.QZX || {}).abc || []).length ? bt("gq:abc", "ABC-Handbuch Quiz", window.QZX.abc.length + " Fragen") : "") + [1, 2, 3, 4].map(n => bt("pdf:abc" + n, RGDEF["abc" + n].short.replace("ABC-Handbuch ", ""), "Teil " + n + " · PDF · " + RGDEF["abc" + n].pages + " S.")).join("");
  } else if (g === "veg") {
    h = bt("pdf:veg", "Vegetationsbrände komplett", "PDF · " + RGDEF.veg.pages + " S.") + (((window.QZX || {}).veg || []).length ? bt("gq:veg", "Vegetationsbrände Quiz", window.QZX.veg.length + " Fragen") : "");
  } else {
    const em = getMod("einsatz");
    h = bt("pdf:einsatz", "Einsatzführung komplett", "PDF · " + RGDEF.einsatz.pages + " S.") +
      bt("einsatz", "Karten & Quiz", mp("einsatz").known.length + " von " + em.cards.length + " gewusst");
  }
  app.innerHTML = `<section class="hero"><h1>${g === "basis" ? "Basiswissen" : g === "abc" ? "ABC-Handbuch" : g === "veg" ? "Vegetationsbrände" : "Einsatzführung"}</h1><p>${g === "abc" ? "Handbuch für ABC-Einsätze (FKS), 508 Seiten in vier Teilen." : g === "veg" ? "Handbuch Spezialwissen Vegetationsbrände (FKS) mit Quiz." : "Reglement als PDF, Lernkarten und Quiz."}</p></section><div class="menu rgmenu">${h}</div>`;
  app.querySelectorAll(".pdfbtn").forEach(b => b.addEventListener("click", () => { const i = b.dataset.id; state.sub = g; i === "gq" ? gquizView() : i.startsWith("gq:") ? gquizView(i.slice(3)) : i === "spick" ? spickView() : i.startsWith("pdf:") ? rgJump(i.slice(4), 0, () => subView(g)) : openMod(i, "cards"); }));
  window.scrollTo(0, 0);
}
function home() {
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  state.mod = null; state.from = null; state.sub = null; state.view = "list"; backBtn.hidden = false;
  app.innerHTML = `
    <section class="hero">
      <h1>Reglemente</h1>
      <p>Lies das ganze Reglement im PDF, übe mit Lernkarten und teste dich im Quiz.</p>
    </section>
    <div class="srch"><input type="search" id="q" placeholder="Reglemente durchsuchen (z. B. Atemschutz, OAABS, 118)" aria-label="Suche" autocomplete="off"></div>
    <div id="sbox" hidden></div>
    <div class="menu rgmenu" id="mgrid">${(() => {
      const bt = (id, t, sm) => `<button class="mbtn main pdfbtn" data-id="${id}"><span>${esc(t)}</span><small>${esc(sm)}</small></button>`;
      return bt("sub:basis", "Basiswissen", "PDF, Lernkarten, Quiz, Spickzettel") +
        bt("sub:einsatz", "Einsatzführung", "PDF, Karten & Quiz") +
        bt("sgv", "Kantonale Ergänzungen (SGV)", "Original-PDF + " + SGV.length + " Merkblätter") +
        bt("sub:abc", "ABC-Handbuch", "FKS · 508 S. in 4 Teilen + Quiz") +
        bt("sub:veg", "Vegetationsbrände", "Handbuch Spezialwissen · PDF + Quiz");
    })()}</div>
    <p class="foot">Lernhilfe aus den FKS-Reglementen von feukos.ch. Massgebend ist immer das jeweilige Reglement in der gültigen Fassung.</p>`;
  app.querySelectorAll(".pdfbtn").forEach(b => b.addEventListener("click", () => b.dataset.id.startsWith("sub:") ? subView(b.dataset.id.slice(4)) : b.dataset.id === "gq" ? gquizView() : b.dataset.id === "sgv" ? sgvView() : b.dataset.id === "spick" ? spickView() : b.dataset.id.startsWith("pdf:") ? rgView(b.dataset.id.slice(4)) : openMod(b.dataset.id, "cards")));
  const qi = document.getElementById("q"), sb = document.getElementById("sbox"), mg = document.getElementById("mgrid");
  qi.addEventListener("input", () => {
    const v = qi.value.trim();
    if (v.length < 2) { sb.hidden = true; mg.hidden = false; return; }
    mg.hidden = true; sb.hidden = false; renderSearch(v, sb);
  });
  window.scrollTo(0, 0);
}
/* ---------- Sprung ins Reglement (PDF) ---------- */
function rgNum(id, num) { const r = ((window.RGTOC || {})[id] || []).find(x => x[0] === num); return r ? { page: r[2], t: r[0] + " " + r[1] } : null; }
function rgJump(id, page, back) { state.pdfBack = back || null; rgView(id, page); }
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest(".rgjump"); if (!b) return;
  const id = b.dataset.id, p = +b.dataset.p, ch = state.ch, sec = b.dataset.sec, ar = state.aoR;
  if (sec == null) return rgJump(id, p, () => { if (ar != null) aoGo(ar); else home(); });
  rgJump(id, p, () => { state.mod = id; state.tab = "sum"; state.ch = ch; renderMod(); window.scrollTo(0, 0); if (sec != null) { const d = document.getElementById("sec-" + sec); if (d) { d.open = true; d.scrollIntoView({ block: "start" }); } } });
});
const RGDEF = {
  basis: { pages: 296, short: "Basiswissen", enc: "reglement-basiswissen.enc", file: "Reglement Basiswissen FKS.pdf", tile: "Das ganze Reglement mit allen 296 Seiten (FKS 07/2026), direkt in der App zum Blättern.", hero: "Das ganze Reglement Basiswissen, FKS 07/2026.", online: "https://docs.feukos.ch/Basiswissen/ReglementBasiswissenDE/" },
  sgv: { pages: 10, short: "Kantonale Ergänzungen", enc: "reglement-sgv.enc", file: "Kantonale Ergänzungen SGV 14.10.2026.pdf", c: "© SGV Solothurn", tile: "", hero: "Basiswissen Kantonale Ergänzungen SGV Solothurn, Version 14.10.2026.", online: "" },
  abc1: { pages: 137, short: "ABC-Handbuch Kap. 1–2 Allgemeines, ABC-Wehr", enc: "reglement-abc1.enc", file: "FKS Handbuch ABC Teil 1.pdf", tile: "", hero: "Handbuch für ABC-Einsätze, FKS, Version 1.1 / 15.11.2019 – Teil 1 von 4 (Kap. 1–2 Allgemeines, ABC-Wehr).", online: "" },
  abc2: { pages: 76, short: "ABC-Handbuch Kap. 3–4 A-Wehr, B-Wehr", enc: "reglement-abc2.enc", file: "FKS Handbuch ABC Teil 2.pdf", tile: "", hero: "Handbuch für ABC-Einsätze, FKS, Version 1.1 / 15.11.2019 – Teil 2 von 4 (Kap. 3–4 A-Wehr, B-Wehr).", online: "" },
  abc3: { pages: 158, short: "ABC-Handbuch Kap. 5 C-Wehr", enc: "reglement-abc3.enc", file: "FKS Handbuch ABC Teil 3.pdf", tile: "", hero: "Handbuch für ABC-Einsätze, FKS, Version 1.1 / 15.11.2019 – Teil 3 von 4 (Kap. 5 C-Wehr).", online: "" },
  abc4: { pages: 137, short: "ABC-Handbuch Kap. 6–9 Tabellen, Spezialeinsatzmittel, Glossar, Register", enc: "reglement-abc4.enc", file: "FKS Handbuch ABC Teil 4.pdf", tile: "", hero: "Handbuch für ABC-Einsätze, FKS, Version 1.1 / 15.11.2019 – Teil 4 von 4 (Kap. 6–9 Tabellen, Spezialeinsatzmittel, Glossar, Register).", online: "" },
  veg: { pages: 120, short: "Vegetationsbrände", enc: "reglement-veg.enc", file: "FKS Handbuch Vegetationsbrände.pdf", tile: "", hero: "Handbuch Spezialwissen «Vegetationsbrände», FKS.", online: "" },
  einsatz: { pages: 84, short: "Einsatzführung", enc: "reglement-einsatzfuehrung.enc", file: "Reglement Einsatzführung FKS.pdf", tile: "Das ganze Reglement mit allen 84 Seiten, direkt in der App zum Blättern.", hero: "Das ganze Reglement Einsatzführung, FKS.", online: "" }
};
const RGFILES = {}, RGDOCS = {};
async function rgLoad(m, id) {
  if (RGFILES[id]) return RGFILES[id];
  if (!window.FWZ_CODE) throw new Error("Bitte App neu laden und PIN eingeben.");
  m.textContent = "Lade PDF …";
  const r = await fetch(RGDEF[id].enc); if (!r.ok) throw new Error("PDF nicht erreichbar (offline?).");
  const raw = new Uint8Array(await r.arrayBuffer()); m.textContent = "Entschlüssle …";
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(window.FWZ_CODE), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: raw.slice(0, 16), iterations: 600000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(16, 28) }, key, raw.slice(28));
  m.textContent = "";
  return RGFILES[id] = new File([pt], RGDEF[id].file, { type: "application/pdf" });
}
let RGOBS = null;
function rgClose() { if (RGOBS) { RGOBS.disconnect(); RGOBS = null; } window.removeEventListener("scroll", rgScroll); }
let rgScroll = () => {};
async function rgView(id, page) {
  rgClose(); const D = RGDEF[id]; let RGDOC = RGDOCS[id];
  state.mod = null; state.view = "pdf"; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  app.innerHTML = `<section class="hero"><h1>${esc(D.short)} komplett</h1><p>${D.hero} ${D.c || "© FKS"}, nur zur internen Ausbildung.${D.online ? ' <a class="lnk" href="' + D.online + '" target="_blank" rel="noopener">Online-Version</a>' : ""}</p></section>
    <div id="rgm" role="status" class="note">Lade Reglement …</div><div id="rgv"></div>`;
  window.scrollTo(0, 0);
  const msg = document.getElementById("rgm");
  let file;
  try { file = await rgLoad(msg, id); msg.textContent = "Öffne …"; if (!RGDOC) { const lib = await import("./pdfjs/pdf.min.mjs"); lib.GlobalWorkerOptions.workerSrc = new URL("./pdfjs/pdf.worker.min.mjs", location.href).href; RGDOC = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; RGDOCS[id] = RGDOC; } }
  catch (e) { msg.textContent = (e && e.message) || "Fehler beim Laden."; return; }
  if (state.view !== "pdf") return;
  const N = RGDOC.numPages, host = document.getElementById("rgv"), p1 = await RGDOC.getPage(1), vp1 = p1.getViewport({ scale: 1 }), ratio = vp1.height / vp1.width;
  let zoom = 1, saved = 1; try { saved = Math.min(N, Math.max(1, +localStorage.getItem("fwz-rgp-" + id) || 1)); } catch (e) {}
  if (page) saved = Math.min(N, Math.max(1, page | 0));
  msg.className = "rgbar"; msg.innerHTML = `<button class="btn" id="rgz-">−</button><button class="btn" id="rgz+">+</button><span class="rgpg"><input id="rgn" type="number" min="1" max="${N}" value="${saved}" inputmode="numeric" aria-label="Seite"> / ${N}</span><button class="btn" id="rgs">Teilen</button><button class="btn" id="rgp">Drucken</button>${(window.RGTOC && RGTOC[id]) ? `<select id="rgt" aria-label="Inhaltsverzeichnis"><option value="">Inhalt …</option>${RGTOC[id].map(r => `<option value="${r[2]}">${esc(r[0] + " " + r[1])} · S. ${r[2]}</option>`).join("")}</select>` : ""}`;
  const acts = aoPdfActs(file, msg), W = () => Math.min(host.clientWidth || 360, 1000) * zoom;
  host.className = "rgpages"; host.innerHTML = "";
  const pages = []; for (let i = 1; i <= N; i++) { const d = document.createElement("div"); d.className = "rgpage"; d.dataset.n = i; const c = document.createElement("canvas"); d.appendChild(c); host.appendChild(d); pages.push(d); }
  const size = () => { const w = W(); pages.forEach(d => { d.style.width = w + "px"; d.style.height = w * ratio + "px"; d._r = 0; d.firstChild.width = 0; }); };
  let queue = [], busy = false;
  async function pump() {
    if (busy) return; busy = true;
    while (queue.length) {
      const d = queue.shift(); if (!d.isConnected || d._r === 1) continue;
      try {
        const pg = await RGDOC.getPage(+d.dataset.n), w = parseFloat(d.style.width), dpr = Math.min(window.devicePixelRatio || 1, 2), sc = w * dpr / pg.getViewport({ scale: 1 }).width, vp = pg.getViewport({ scale: sc }), c = d.firstChild;
        c.width = vp.width; c.height = vp.height; c.style.width = "100%"; c.style.height = "100%"; d._r = 1;
        await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      } catch (e) {}
    }
    busy = false;
  }
  RGOBS = new IntersectionObserver(es => { es.forEach(e => { const d = e.target; if (e.isIntersecting) { if (d._r !== 1) queue.push(d); } else if (d._r === 1) { d._r = 0; d.firstChild.width = 0; } }); queue.sort((a, b) => Math.abs(a.dataset.n - cur) - Math.abs(b.dataset.n - cur)); pump(); }, { rootMargin: "120% 0px" });
  let cur = saved;
  size(); pages.forEach(d => RGOBS.observe(d));
  const goto = n => { n = Math.min(N, Math.max(1, n | 0)); cur = n; pages[n - 1].scrollIntoView({ block: "start" }); window.scrollBy(0, -130); };
  const inp = document.getElementById("rgn");
  let tk = 0; rgScroll = () => { if (tk) return; tk = requestAnimationFrame(() => { tk = 0; const mid = window.innerHeight / 3; let lo = 0, hi = N - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (pages[m].getBoundingClientRect().top <= mid) lo = m; else hi = m - 1; } cur = lo + 1; if (document.activeElement !== inp) inp.value = cur; try { localStorage.setItem("fwz-rgp-" + id, cur); } catch (e) {} }); };
  window.addEventListener("scroll", rgScroll, { passive: true });
  inp.addEventListener("change", () => goto(+inp.value));
  const sel = document.getElementById("rgt"); if (sel) sel.addEventListener("change", () => { if (sel.value) goto(+sel.value); inp.value = sel.value; sel.value = ""; });
  const setZ = z => { const keep = cur; zoom = Math.min(3, Math.max(1, z)); host.style.overflowX = zoom > 1 ? "auto" : ""; RGOBS.disconnect(); size(); pages.forEach(d => RGOBS.observe(d)); goto(keep); };
  document.getElementById("rgz+").onclick = () => setZ(zoom + .5); document.getElementById("rgz-").onclick = () => setZ(zoom - .5);
  document.getElementById("rgs").onclick = () => acts.share(); document.getElementById("rgp").onclick = () => acts.print();
  if (saved > 1) { setTimeout(() => goto(saved), 50); setTimeout(() => goto(saved), 600); }
}

/* ---------- Reglement ---------- */
function openMod(id, tab) { state.ch = null; state.cf = null; state.lc = null; state.mod = id; state.tab = tab || "cards"; renderMod(); window.scrollTo(0, 0); }
function renderMod() {
  const m = getMod(state.mod); backBtn.hidden = false;
  app.innerHTML = `
    <section class="head"><h1>${esc(m.title)}</h1><div class="ver">${esc(m.ver)}</div></section>
    <div class="tabs" role="tablist">
      ${[["cards", "Lernkarten"], ["quiz", "Quiz"]].map(([k, l]) => `<button role="tab" data-tab="${k}" aria-selected="${state.tab === k}">${l}</button>`).join("")}
    </div>
    <div id="body"></div>`;
  app.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => { state.tab = b.dataset.tab; state.lc = null; renderMod(); }));
  const body = document.getElementById("body");
  if (state.tab === "cards" || state.tab === "sum") cards(m, body);
  else quiz(m, body);
}
const CH = {
 "1": {s:"15–26", z:[["bis 50 m / 150–250 m","Notsignalisation innerorts / ausserorts"],["3 × 250 m + 1 × 1000 m","Vorsignalisation auf richtungsgetrennten Strassen"],["5 Schritte","Ständiger Auftrag: Sichern, Retten, Halten, Schützen, Bewältigen"],["4 Prioritäten","Menschen, Tiere, Umwelt, Sachwerte"],["4 Brandursachen","natürlich, unfallbedingt, vorsätzlich, unbekannt"]]},
 "2": {s:"27–36", z:[["5 Schritte","Führungsablauf: Feststellen, Beurteilen, Entscheiden, Handeln, Kontrollieren"],["WAS, WO, WOMIT, BESONDERS","So wird ein Auftrag erteilt"],["OAABS","Orientierung, Absicht, Auftrag, Besonderes, Standort"],["1 Auftrag","Pro Befehlsempfänger auf einmal"],["5 Phasen","Ereignis, Alarmierung, Anfahrt, Einsatz, Einsatzende"]]},
 "3": {s:"37–66", z:[["3 Kompetenzen","Selbst-, Fach- und Sozialkompetenz"],["ca. 30 Sekunden","Kurzzeitgedächtnis (sensorisch: wenige Sekunden)"],["max. 3","Beurteilungskriterien in der Besprechung"],["Schriftgrösse cm = Abstand m","Faustregel für Plakate (max. 3 Farben)"]]},
 "4": {s:"67–72", z:[["ca. 4 km","Direktbetrieb Polycom im offenen Gelände"],["ca. 10 km / 20 km","Direktbetrieb mit Relais (IDR): Umkreis / zwischen zwei Geräten"],["denken – drücken – schlucken – sprechen","Sprechtechnik"],["Gegenstation zuerst","Dann der eigene Rufname"]]},
 "5": {s:"73–112", z:[["144","Notruf Rettungsdienst"],["30 : 2","Kompressionen zu Beatmungen (Erwachsene)"],["100–120 / min, 5–6 cm","Frequenz und Tiefe der Herzdruckmassage"],["5 Beatmungen, 15 : 2, 1/3","Kinder: Start, Verhältnis, Tiefe (Brustkorbdurchmesser)"],["bis 10 Sekunden","Atmung prüfen"],["10–15 Min., 10–20 °C","Verbrennung kühlen"],["15 % / 5–10 %","Lebensgefahr bei Verbrennung: Erwachsene / Kinder"],["70–75°","Anstellwinkel Leiter"],["bis 30 m","Hubrettungsfahrzeuge"]]},
 "6": {s:"113–178", z:[["118","Notruf Feuerwehr"],["1'700 l / 4'000 l","Dampf aus 1 l Wasser bei 100 °C / 600 °C"],["0,1–6 %","Zumischrate Schaum und CAFS (Netzmittel 0,1–0,8 %)"],["bis 20 / 20–200 / über 200","Verschäumungszahl Schwer-, Mittel-, Leichtschaum"],["ca. –72 °C","Kälteverbrennung bei CO2"],["bis 20 kg","Kleinlöschgeräte"],["mind. 7 bar / 3 bar","Zumischer / Schaumrohr (Schaumleitung)"],["10 m = 1 bar","Höhendifferenz"],["4-facher Druckverlust","bei doppelter Wassermenge"],["250–500 l/min, 5–10 s","Fensterimpuls (Vollstrahl an die Decke)"],["mind. 2 bar","Eingangsdruck MS ab Hydrant"],["50 cm / 30 cm","Seiher überdeckt: stehend / fliessend"],["55 °C / 70 °C","Futterstock: Kontrolle / Brandgefahr"]]},
 "7": {s:"179–198", z:[["21 % / 17 % / 15 %","Sauerstoff: normal / Sicherheitsgrenze / Gefahrengrenze"],["ca. 300 bar","Solldruck der Druckluftflasche nach dem Retablieren"],["50 ± 10 bar","Warneinrichtung spricht akustisch an"],["270 bar / 180 bar","Flaschendruck melden, wenn er darunter liegt (PA / Regenerationsgerät)"],["2/3 Luftvorrat","Spätestens dann Lagebeurteilung: Anmarsch, Rückweg, Trupp"],["5–6 l/min / ca. 100 l/min","Luftverbrauch in Ruhe / bei starker Belastung"],["3–4 Trupps","Pro Truppüberwacher"],["5 Minuten","Kein Kontakt: Kontrollruf"],["4 × hupen / 3er-Takt","Rückzug / SOS"]]},
 "8": {s:"199–210", z:[["10'000–50'000 m³/h","Überdrucklüfter und Turbolüfter"],["20'000–60'000 m³/h","Überdrucklüfter mit Wasserturbine"],["100'000–350'000 m³/h","Grosslüfter"],["Zuluft grösser als Abluft","Bedingung für Überdruck"]]},
 "9": {s:"211–214", z:[["360°","Raum horizontal und vertikal scannen"],["kein Bild","bei starkem Russ"],["keine Wärme sichtbar","hinter Glas"]]},
 "10": {s:"215–264", z:[["12 kN","Mindestlast Anschlagpunkt"],["max. 60°","Neigungswinkel beim Anschlagen"],["1. Rückhalten, 2. Positionieren, 3. Auffangen","Systempriorisierung Absturzsicherung"],["bis ca. 700 bar","Hydraulikdruck"],["2 m","Wirkungsbereich Kettensäge"],["30 / 60 / 90 cm","Abstand zu Seiten-/Kopf-, Fahrer-, Beifahrerairbag"],["45 Minuten","Airbags nach Abklemmen der Batterie noch versorgt"],["bis 2'500 l/min","Tauchpumpe"],["ca. 3'500 Säcke","100 m Sandsackdamm, 0,5 m hoch"]]},
 "11": {s:"265–276", z:[["unter / über 1'000 V","Niederspannung / Hochspannung"],["1 m / 7 m / 20 m","Sicherheitsabstand: Niederspannung / Hochspannung störungsfrei / gestört"],["1 m / 3 m / 7 m","Wasser im Sprühstrahl: Niederspannung / bis 110 kV / bis 440 kV"],["bis 1'500 V","Gleichspannung bei Photovoltaik"],["über 80 °C / über 200 °C","Kollektor: Wasser / Kollektor ohne Pumpe"]]},
 "12": {s:"277–296", z:[["60 m + 30 m","Gefahrenzonenradius und zusätzlicher Abstand"],["40 × 30 cm","Orange Warntafel"],["10 % / 20 % UEG","Typische Alarmwerte Ex-Messgerät"],["4,4 Vol.-%","Methan bei 100 % UEG"],["118 / 144 / 112 / 117","Feuerwehr / Rettungsdienst / Euro-Notruf / Polizei"]]},
 "Neu": {s:"", z:[["1. Juli 2026","Inkrafttreten"],["13, 14, 15","Wegfallende Kapitel"],["Brandklasse L","Lithium-Ionen"],["bis 30 m","Hubrettungsfahrzeuge"]]}
};
const CHS = {basis: CH, einsatz: {"1": {"s": "9–16", "z": [["3 Kompetenzen", "Selbst-, Fach- und Sozialkompetenz bilden die Handlungskompetenz"], ["Sender", "Verantwortlich, dass die Botschaft ankommt und verstanden wird"]]}, "2": {"s": "17–29", "z": [["5 Phasen", "Ereignis, Alarmierung, Anfahrt, Einsatz, Einsatzende"], ["4 Prioritäten", "Menschen, Tiere, Umwelt, Sachwerte"], ["5 Schritte", "Ständiger Auftrag: Sichern, Retten, Halten, Schützen, Bewältigen"], ["3 Ereignisgrössen", "Alltagsereignis, Grossereignis, Katastrophe"], ["Unklar = Dringlichkeit", "Dringlichkeitsfahrt bei zeitkritischen und unklaren Einsätzen"]]}, "3": {"s": "31–44", "z": [["5 Schritte", "Feststellen, Beurteilen, Entscheiden, Handeln, Kontrollieren"], ["OAABS", "Orientierung, Absicht, Auftrag, Besonderes, Standort"], ["1 Auftrag", "Pro Befehlsempfänger auf einmal"], ["5–10 Minuten", "Vorausdenken beim Beurteilen"], ["Gesamtverantwortung", "Beim Einsatzleiter, nicht teilbar"]]}, "4": {"s": "45–57", "z": [["bis 11 m", "Gebäude geringer Höhe"], ["bis 30 m", "Gebäude mittlerer Höhe"], ["über 30 m", "Hochhaus"], ["4 Grundsätze", "Innenangriff, Treppenhaus sichern, Halten von gesunder Seite, Entwicklung voraussehen"], ["5 Fragen", "Chancen- und Risikenanalyse des Einsatzleiters"]]}, "5": {"s": "59–81", "z": [["max. 3", "Ziele je Stufe und Beurteilungskriterien in der Besprechung"], ["6 Punkte", "Übungsvorbereitung"], ["5 Finger", "Ablauf der Übungsbesprechung"], ["Gelb / Grün / Rot / Blau / Orange", "Fanions: Rettung, Unfall, Feuer, Wasser, gefährliche Stoffe"]]}}};
const CHNS = {basis: CHN, einsatz: {"1": "Allgemeines", "2": "Einsatzphasen", "3": "Führungsrhythmus", "4": "Gebäudebrand", "5": "Ausbildung"}};
function bxHtml(s) {
  return (s.bx || []).map(([k, p, l, t]) => `<div class="bx ${k}"><div class="bxh">${k === "r" ? "⚠ Achtung" : "☞ Hinweis"}<span>S. ${p}</span></div>${t ? `<div class="bxt">Thema: ${esc(t)}</div>` : ""}<ul>${l.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("");
}
function secHtml(s, i, open, mid) {
  const imgs = (s.img || []).map(([k, c]) => IMG[k] ? `<figure class="fig"><button class="zoom" data-k="${k}" aria-label="Bild vergrössern"><img src="${IMG[k]}" alt="${esc(c)}" loading="lazy"></button><figcaption>${esc(c)}</figcaption></figure>` : "").join("");
  return `<details class="sec" id="sec-${i}"${open ? " open" : ""}><summary>${esc(s.t)}</summary><ul>${s.p.map(x => `<li>${esc(x)}</li>`).join("")}</ul>${bxHtml(s)}${imgs}${rgBtn(mid || "basis", s, i)}</details>`;
}
function rgBtn(mid, s, i) {
  const n = (s.t.match(/^(\d+(?:\.\d+)*)\s/) || [])[1], r = n && rgNum(mid, n); if (!r) return "";
  return `<div class="rgjrow"><button class="btn rgjump" data-id="${mid}" data-p="${r.page}" data-sec="${i}">Im Reglement lesen · S. ${r.page}</button></div>`;
}
function bindZoom(el) { el.querySelectorAll(".zoom").forEach(b => b.addEventListener("click", () => zoom(b.dataset.k))); }
function chKey(g) { return /^\d+ /.test(g) ? g.split(" ")[0] : "Neu"; }
function chName(g) { return /^\d+ /.test(g) ? g.replace(/^\d+ /, "") : "Änderungen 2026"; }
/* ---------- Spickzettel (PDF mit den wichtigsten Zahlen) ---------- */
function spickPdf(m, only) {
  const src = CHS[m.id] || {}, groups = [], blocks = [];
  m.sections.forEach(s => { if (s.g && !groups.includes(s.g)) groups.push(s.g); });
  groups.forEach(g => {
    const k = chKey(g); if (only && k !== only) return;
    const z = (src[k] || {}).z || []; if (!z.length) return;
    blocks.push({ h: (k === "Neu" ? "" : k + " ") + chName(g), t: z.map(([x, y]) => "· " + x + ": " + y).join("\n") });
  });
  if (!blocks.length) return null;
  const nm = m.title + (only ? " Kapitel " + only : "");
  return aoPdf("Spickzettel " + nm, "Feuerwehr Zuchwil · aus dem " + (m.src || m.title), blocks, "Spickzettel " + nm + ".pdf");
}
function spickBar(label) { return `<div class="row spick"><button class="btn" data-sp="open">${label} öffnen</button><button class="btn" data-sp="share">Teilen</button><button class="btn" data-sp="print">Drucken</button></div><div class="sinfo" id="spmsg" role="status"></div>`; }
function spickBind(el, m, only) {
  const msg = el.querySelector("#spmsg");
  el.querySelectorAll("[data-sp]").forEach(b => b.addEventListener("click", () => {
    try { const f = spickPdf(m, only); if (!f) { msg.textContent = "Für dieses Kapitel gibt es keine Zahlen."; return; } msg.textContent = ""; aoPdfActs(f, msg)[b.dataset.sp](); }
    catch (e) { msg.textContent = "PDF konnte nicht erstellt werden."; }
  }));
}
function summary(m, el) {
  if (!m.sections.some(s => s.g)) {
    el.innerHTML = (m.note ? `<div class="note">${esc(m.note)}</div>` : "") + m.sections.map((s, i) => secHtml(s, i, i === 0, m.id)).join("");
    return bindZoom(el);
  }
  const groups = [];
  m.sections.forEach((s, i) => { let g = groups.find(x => x.g === s.g); if (!g) { g = { g: s.g, items: [] }; groups.push(g); } g.items.push([s, i]); });
  const idx = groups.findIndex(x => x.g === state.ch);
  if (idx < 0) {
    el.innerHTML = (m.note ? `<div class="note">${esc(m.note)}</div>` : "") + `<div class="grid">${groups.map(g => {
      const k = chKey(g.g), pg = ((CHS[m.id] || {})[k] || {}).s;
      return `<button class="tile chtile" data-g="${esc(g.g)}"><span class="num">${k === "Neu" ? "Neu" : "Kapitel " + k}</span><h2>${esc(chName(g.g))}</h2><div class="facts"><span>${g.items.length} Abschnitte</span>${pg ? `<span>Seiten ${pg}</span>` : ""}</div></button>`;
    }).join("")}</div>`;
    el.querySelectorAll(".chtile").forEach(b => b.addEventListener("click", () => { state.ch = b.dataset.g; renderMod(); window.scrollTo(0, 0); }));
    el.insertAdjacentHTML("beforeend", '<h3 class="zh">Spickzettel</h3><div class="note">Die wichtigsten Zahlen aller Kapitel auf wenigen Seiten, zum Ausdrucken oder Teilen.</div>' + spickBar("Spickzettel"));
    spickBind(el, m, null);
    return;
  }
  const g = groups[idx], k = chKey(g.g), info = (CHS[m.id] || {})[k] || { s: "", z: [] };
  const title = k === "Neu" ? "Änderungen 2026" : `Kapitel ${k} – ${chName(g.g)}`;
  const sub = k === "Neu" ? "Was sich gegenüber der alten Ausgabe geändert hat (Reglement Basiswissen, FKS, 07/2026)" : `Zusammenfassung mit Abbildungen aus dem ${m.src || m.title}, Seiten ${info.s}`;
  const z = info.z.length ? `<h3 class="zh">Die wichtigsten Zahlen</h3><div class="ztw"><table class="zt">${info.z.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</table></div>` : "";
  const prev = groups[idx - 1], next = groups[idx + 1];
  el.innerHTML = `<div class="banner"><h2>${esc(title)}</h2><p>${esc(sub)}</p></div>
    <div class="chips">${g.items.map(([s, i]) => `<button class="chip" data-i="${i}">${esc(s.t)}</button>`).join("")}</div>
    ${z}${g.items.map(([s, i]) => secHtml(s, i, true, m.id)).join("")}
    <div class="chnav">${prev ? `<button class="btn" data-g="${esc(prev.g)}">← ${esc(chName(prev.g))}</button>` : "<span></span>"}${next ? `<button class="btn primary" data-g="${esc(next.g)}">${esc(chName(next.g))} →</button>` : "<span></span>"}</div>`;
  if (info.z.length) { el.querySelector(".zh").insertAdjacentHTML("beforebegin", spickBar("Spickzettel")); spickBind(el, m, k); }
  el.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => { const d = document.getElementById("sec-" + b.dataset.i); d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); }));
  el.querySelectorAll(".chnav .btn").forEach(b => b.addEventListener("click", () => { state.ch = b.dataset.g; renderMod(); window.scrollTo(0, 0); }));
  bindZoom(el);
}
function zoom(k) {
  const o = document.createElement("div"); o.className = "lb";
  o.innerHTML = `<button class="lbx">Schliessen</button><div class="lbs"><img src="${IMG[k]}" alt=""></div>`;
  o.addEventListener("click", e => { if (e.target.tagName !== "IMG") o.remove(); });
  document.body.appendChild(o);
}

/* ---------- Kapitelfilter ---------- */
function poolIdx(arr, get) { return arr.map((x, i) => i).filter(i => !state.cf || get(arr[i]) === state.cf); }
function chapBar(m, arr, get) {
  const ks = [];
  arr.forEach(x => { const c = get(x); if (c && !ks.includes(c)) ks.push(c); });
  if (!ks.length) return "";
  ks.sort((a, b) => a - b);
  const n = k => arr.filter(x => get(x) === k).length;
  return `<div class="chips fbar" role="group" aria-label="Kapitel">
    <button class="chip" aria-pressed="${!state.cf}" data-k="">Alle (${arr.length})</button>
    ${ks.map(k => `<button class="chip" aria-pressed="${state.cf === k}" data-k="${k}" title="${esc((CHNS[m.id] || {})[k] || "")}">${k} ${esc((CHNS[m.id] || {})[k] || "")} (${n(k)})</button>`).join("")}</div>`;
}
function bindBar(el) {
  el.querySelectorAll(".fbar .chip").forEach(b => b.addEventListener("click", () => { state.cf = b.dataset.k || null; renderMod(); }));
}

/* ---------- Lernkarten ---------- */
function cards(m, el) {
  const p = mp(m.id);
  const bar = chapBar(m, m.cards, c => c[2]);
  el.innerHTML = bar + '<div id="cb"></div>'; bindBar(el);
  el = document.getElementById("cb");
  if (state.cf && !m.cards.some(c => c[2] === state.cf)) state.cf = null;
  const pool = poolIdx(m.cards, c => c[2]);
  const known = () => pool.filter(i => p.known.includes(i)).length;
  let queue = [], pos = 0, flipped = false, mode = "open";
  function build() {
    queue = shuffle(mode === "all" ? pool : pool.filter(i => !p.known.includes(i)));
    pos = 0; flipped = false;
  }
  function draw() {
    if (!queue.length || pos >= queue.length) {
      const k = known(), all = k === pool.length;
      el.innerHTML = `<div class="card-area">
        <div class="flash"><span class="lab">Fertig</span><div class="txt">${all ? "Alle " + pool.length + " Karten sitzen." : "Runde beendet. " + k + " von " + pool.length + " Karten gewusst."}</div></div>
        <div class="row"><button class="btn primary" id="again">${all ? "Alle nochmal" : "Offene Karten üben"}</button><button class="btn ghost" id="reset">Fortschritt löschen</button></div></div>`;
      document.getElementById("again").onclick = () => { mode = all ? "all" : "open"; build(); draw(); };
      document.getElementById("reset").onclick = () => { p.known = p.known.filter(i => !pool.includes(i)); save(); mode = "open"; build(); draw(); };
      return;
    }
    const c = m.cards[queue[pos]];
    el.innerHTML = `<div class="card-area">
      <div class="count"><span>Karte ${pos + 1} von ${queue.length}</span><span>${known()} gewusst</span></div>
      <button class="flash${flipped ? " back" : ""}" id="flip" aria-label="Karte umdrehen">
        <span class="lab">${flipped ? "Antwort" : "Frage"}${c[2] ? " · Kapitel " + c[2] : ""}</span><span class="txt">${esc(flipped ? c[1] : c[0])}</span>
        ${flipped ? "" : '<span class="lab">Tippen zum Umdrehen</span>'}
      </button>
      ${flipped ? `<div class="row"><button class="btn" id="no">Nochmal</button><button class="btn primary" id="yes">Gewusst</button></div>` : ""}
    </div>`;
    document.getElementById("flip").onclick = () => { flipped = !flipped; draw(); };
    if (flipped) {
      document.getElementById("yes").onclick = () => { const i = queue[pos]; if (!p.known.includes(i)) p.known.push(i); save(); pos++; flipped = false; draw(); };
      document.getElementById("no").onclick = () => { const i = queue[pos]; p.known = p.known.filter(x => x !== i); save(); queue.push(queue[pos]); pos++; flipped = false; draw(); };
    }
  }
  build(); draw();
}

/* ---------- Quiz ---------- */
function quiz(m, el) {
  const p = mp(m.id);
  const bar = chapBar(m, m.quiz, q => q.c);
  el.innerHTML = bar + '<div id="qb"></div>'; bindBar(el);
  el = document.getElementById("qb");
  if (state.cf && !m.quiz.some(q => q.c === state.cf)) state.cf = null;
  const pool = poolIdx(m.quiz, q => q.c), key = state.cf || "all";
  let list = shuffle(pool), pos = 0, score = 0, wrong = [], answered = false;
  function draw() {
    if (pos >= list.length) {
      const total = list.length;
      p.bs = p.bs || {};
      if (list.length === pool.length && (p.bs[key] == null || score > p.bs[key])) { p.bs[key] = score; if (key === "all") p.best = score; save(); }
      const bst = p.bs[key];
      el.innerHTML = `<div class="card-area">
        <div class="count"><span>Ergebnis${state.cf ? " · Kapitel " + state.cf : ""}</span>${bst != null ? `<span>Bestwert ${bst}/${pool.length}</span>` : ""}</div>
        <div class="score">${score}<span style="color:var(--muted);font-size:2rem"> / ${total}</span></div>
        <div>${score === total ? "Alles richtig." : wrong.length + (wrong.length === 1 ? " Frage" : " Fragen") + " zum Wiederholen."}</div>
        <div class="row">${wrong.length ? '<button class="btn primary" id="rep">Falsche wiederholen</button>' : ""}<button class="btn" id="new">Neues Quiz</button></div></div>`;
      if (wrong.length) document.getElementById("rep").onclick = () => { list = shuffle(wrong); pos = 0; score = 0; wrong = []; answered = false; draw(); };
      document.getElementById("new").onclick = () => { list = shuffle(pool); pos = 0; score = 0; wrong = []; answered = false; draw(); };
      return;
    }
    const q = m.quiz[list[pos]];
    const order = shuffle(q.o.map((_, i) => i));
    answered = false;
    el.innerHTML = `<div class="card-area">
      <div class="count"><span>Frage ${pos + 1} von ${list.length}${q.c ? " · Kapitel " + q.c : ""}</span><span>${score} richtig</span></div>
      <div class="q">${esc(q.q)}</div>
      <div class="opts">${order.map(i => `<button class="opt" data-i="${i}">${esc(q.o[i])}</button>`).join("")}</div>
      <div id="fb"></div></div>`;
    el.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
      if (answered) return; answered = true;
      const pick = +b.dataset.i, ok = pick === q.a;
      if (ok) score++; else wrong.push(list[pos]);
      el.querySelectorAll(".opt").forEach(o => { o.disabled = true; if (+o.dataset.i === q.a) o.classList.add("right"); else if (o === b) o.classList.add("wrong"); });
      document.getElementById("fb").innerHTML = `<div class="expl"><b>${ok ? "Richtig." : "Nicht ganz."}</b> ${esc(q.e)}</div><div style="margin-top:12px"><button class="btn primary" id="next" style="width:100%">${pos + 1 >= list.length ? "Ergebnis" : "Weiter"}</button></div>`;
      document.getElementById("next").onclick = () => { pos++; draw(); };
      document.getElementById("next").focus();
    }));
  }
  draw();
}


/* ---------- Kantonale Ergänzungen (SGV) ---------- */
const SGV = [
  { id: "luft", t: "Merkschema L.U.F.T.", sub: "Lüften · Kap. 8", b: [
    ["note", "Gehört zu Kapitel 8 Lüften."], ["img", "luft", "Merkschema L.U.F.T. (SGV)"],
    ["rows", [["L", "Lüfter einsetzen", "Richtung Zuluftöffnung, mit reduzierter Drehzahl."], ["U", "Überblick verschaffen", "3 Gebäudeseiten, Rettungen, Rauchaustritt, Windrichtung."], ["F", "Front Rückmeldungen", "Rauch im Treppenhaus? Wo brennt es? Aufenthaltsprinzip? Abluftöffnungen?"], ["T", "Taktik festlegen", "Wird durch den Einsatzleiter (EL) angeordnet."]]],
    ["src", "Merkschema der Solothurnischen Gebäudeversicherung (SGV), Stand 25.11.22. Es ist nicht Teil des FKS-Reglements."]] },
  { id: "block", t: "Blockierungsknoten", sub: "Knoten · Sicherheit", b: [
    ["note", "Gehört zu den Knoten und Bindungen (Kapitel 10)."],
    ["warn", "Muss ein Arbeitsplatz vom AdF verlassen werden, ist der Halbmastwurf zwingend zu blockieren/sichern."],
    ["img", "sgv_block", "Blockierungsknoten in 4 Schritten"],
    ["ul", ["Schritt 1–3: Halbmastwurf legen und das Seil wie abgebildet durch die Schlaufe führen.", "Schritt 4: Schlaufe mit doppeltem Spierenstich (siehe «Doppelter Spierenstich») sichern."]],
    ["src", "Abbildungen: SGV Feuerwehr, Merkblatt Blockierungsknoten (S. 13), Copyright 2020 by SFV."]] },
  { id: "spier", t: "Doppelter Spierenstich", sub: "Sicherungsknoten", b: [
    ["note", "Sicherungsknoten, wird zum Sichern der Schlaufe beim Blockierungsknoten verwendet."],
    ["img", "sgv_spier", "Doppelter Spierenstich in 3 Schritten"],
    ["src", "Abbildungen: SGV Feuerwehr, Merkblatt Sicherungsknoten (S. 11), Copyright 2020 by SFV."]] },
  { id: "fenster", t: "Fensterimpuls", sub: "Ausbildungshilfe · Version 04.05.2026", b: [
    ["p", "Wohnungsbrand in einem Mehrfamilienhaus: Die Flammen schlagen beim Eintreffen bereits aus dem Fenster. Bevor der erste Trupp unter Atemschutz in die Brandwohnung vorrückt, kann mit einer zeitlich begrenzten Wasserabgabe im Vollstrahl von aussen das Feuer eingedämmt werden. Der an der Zimmerdecke abprallende Wasserstrahl entfaltet eine ähnliche Wirkung wie ein Sprinkler. Parallel dazu wird eine Überdruckbelüftung im Treppenhaus eingeleitet, um dieses rauchfrei zu halten und als Flucht- und Angriffsweg zu sichern."],
    ["p", "Die kombinierte Anwendung von Aussenangriff mit Sprinklereffekt und Überdruckbelüftung kann die Bedingungen für den Innenangriff deutlich verbessern, die Sicherheit der Einsatzkräfte erhöhen und die Ausbreitung des Brandes wirksam begrenzen."],
    ["warn", "Vor dem Betreten der Brandwohnung durch den Trupp im Innenangriff MUSS die Wasserabgabe über das Fenster (Fensterimpuls) eingestellt werden, um eine Gefährdung durch Wasserdampf oder Druckeffekte zu vermeiden."],
    ["h", "Vorteile"], ["ul", ["Wärme wird dem Feuer rasch entzogen und die Brandintensität nimmt ab.", "Der entstehende Wasserdampf kann durch das bereits offene Fenster entweichen.", "Die Verhältnisse für den Trupp im Innenangriff werden besser."]],
    ["h", "Nachteile"], ["ul", ["Koordinationsaufwand mit dem vorrückenden Atemschutztrupp.", "Der Brand wird in der Regel nicht komplett abgelöscht, der Innenangriff bleibt notwendig.", "Die Wurfweite beträgt ungefähr 12 bis 15 Meter, was etwa der Höhe des 3. bis 4. Geschosses entspricht."]],
    ["h", "Wichtig"], ["ul", ["Es darf sich kein Trupp im Brandraum befinden.", "Lüfter mit reduzierter Drehzahl einsetzen gemäss L.U.F.T.-Schema.", "Fensterimpuls ca. 10–30 Sekunden mit 200 bis 500 L/min.", "Wirksamkeit durch die Entstehung von Dampf und die Abnahme der Intensität des Feuers beobachten.", "Allenfalls Wiederholung aus anderer Position.", "KEIN Sprühstrahl: Er verschliesst die Abluftöffnung, und der Rauch bzw. Wasserdampf sucht sich seinen Weg ins Gebäudeinnere."]],
    ["img", "sgv_fenst", "Links richtig: Vollstrahl durchs Fenster. Rechts falsch: Sprühstrahl verschliesst die Öffnung."],
    ["img", "sgv_flip", "Merkblatt: Vollstrahl, steiler Winkel, grosser Durchfluss, L.U.F.T., Koordination mit Angriffstrupp, KEIN Sprühstrahl"],
    ["link", "https://vimeo.com/336040327", "Video: Realbrandversuche Feuerwehr Kleve"],
    ["src", "SGV Feuerwehr, Ausbildungshilfe Fensterimpuls, Version 04.05.2026."]] },
  { id: "asnot", t: "Atemschutz-Notsituationen", sub: "Hinweise zur Ausbildung · 08.05.2017", b: [
    ["h", "Was ist ein AS-Notfall?"],
    ["p", "Ein Ereignis im Atemschutzeinsatz, welches die Tätigkeit des eingesetzten Atemschutztrupps einschränkt und eine Gefahr für Leib und Leben darstellt. Der betroffene Trupp ist nicht mehr in der Lage, durch gezielte Massnahmen die Gefahr zu minimieren oder sich selbst aus dem Gefahrenbereich zu retten."],
    ["h", "Grundsatz"],
    ["ul", ["Der AS-Notfall ist eine absolute Ausnahmesituation und bedeutet für alle Beteiligten zusätzlichen Stress.", "Für die Vielfalt möglicher Notsituationen gibt es keine standardisierten Vorgehensweisen, und zum Thema ist nichts reglementiert.", "Bei korrektem Vorgehen, Einhaltung aller Sicherheitsbestimmungen und der gültigen Einsatzgrundsätze kommt es nicht zu einem Atemschutznotfall.", "Trainings und Übungen basieren auf den Fähigkeiten der eingesetzten AdF und den verfügbaren Mitteln."]],
    ["h", "Aufgaben des Sicherungstrupps"],
    ["p", "Bei Auftrag «Sicherungstrupp»: Atemschutz bereitstellen, Truppüberwachung vorbereiten, situativ Rettungs-/Löschmaterial zurechtlegen."],
    ["ul", ["Gefahren an der Einsatzstelle beachten", "Suchen und Auffinden von verunglückten Helfern", "Stabilisierung der Lage", "Erkennen der Notfallursache", "Sicherung / Wiederherstellung der Atemluftversorgung", "Erstversorgung", "Ggf. technische Rettung aus einer Zwangslage", "Rettung aus der Gefahrenzone"]],
    ["h", "Ablaufschema im Notfall: Situationsbeurteilung (LAGE)"],
    ["rows", [["L", "Lage feststellen", "Überblick, Standort, Situation, sofort Notruf an EL."], ["A", "Atmung vorhanden", "Hören, sehen, fühlen."], ["G", "Genügend Luftvorrat", "Manometer, Flaschenventil, Defekte."], ["E", "Erweiterte Erkundung", "AdF frei, zweiter Rettungsweg, sicherer Bereich."]]],
    ["note", "Das Merkschema «LAGE» ist eine Metapher, keine Ablaufregel. Es ist immer der Situation bzw. dem Ereignis anzupassen."],
    ["h", "Notruf an EL"],
    ["ul", ["«Mayday – Mayday – Mayday»", "Funkrufname oder Trupp-Nr.", "Standort", "Situation", "Flaschendruck", "«Mayday – Antworten»"]],
    ["warn", "Mit dem Absetzen eines «Mayday» wird der Funkverkehr zugunsten des in Not geratenen Trupps für alle anderen Kräfte unterbrochen. Der Einsatzleiter organisiert die nötigen Massnahmen und definiert allfällige Funkkanaländerungen."],
    ["note", "Das Schema dient der besseren Verständlichkeit. Können Punkte nicht oder nur ungenau ermittelt werden, entfallen sie: ZEIT vor Präzision."],
    ["h", "Ausbildung: Welche Elemente trainieren?"],
    ["rows", [["a", "Funkübung", "Verbale Visualisierung und Entgegennahme der Informationen durch die Gegenstelle."], ["b", "Luftversorgung", "Sichere Herstellung einer stabilen Luftversorgung im Trupp (z. B. Wechsel Lungenautomat in diversen Lagen)."], ["c", "Verhalten im Trupp", "Verhaltensregeln bei einem Notfall (Rettungsmöglichkeiten, Absetzen Notruf)."], ["d", "Suchtechniken", "Orientierungsübung."], ["e", "Sicherheitstrupp", "AS-Trupp komplett bereitstellen: Verbindung, Truppüberwachung und Rettungsmaterial rasch bereit, schnelle Einsatzbereitschaft."], ["f", "AS-Einsatz", "Notsituationen und Unfälle vermeiden durch ständige Ausbildung, sicheres Beherrschen der Atemschutztechnik, Einhalten der Sicherheitsbestimmungen und Einsatzgrundsätze sowie körperliche Fitness."]]],
    ["src", "SGV Solothurnische Gebäudeversicherung, «Atemschutz Notsituationen: Hinweise zur Ausbildung», 08.05.2017."]] },
  { id: "k04", pg: 1, t: "04 Kommunikation", sub: "Funk · Verbindungskontrolle · Stand 14.10.2026", b: [
    ["h", "4.3.4 Verbindungskontrolle"],
    ["p", "Das Basiswissen lässt die Art und Weise der Verbindungskontrolle offen. Bisher wurden «uno, due, tre» ausgebildet (aus älteren Reglementen, nicht falsch). Zur Angleichung an die Partnerorganisationen des Bevölkerungsschutzes wurden im Funk Behelf für die Ausbildung «one, two, three» (Reglement BABS) übernommen."],
    ["ul", ["«one, two, three»", "«eins, zwei, drei»", "«schlecht, mässig, gut»", "«uno, due, tre» (älter, nicht falsch)"]],
    ["img", "k_funk", "Auszug Funk Behelf: Sprachqualität"],
    ["note", "Entscheidend im Einsatz: Es wird eine Verbindungskontrolle gemacht, damit sich alle Stationen verstehen."],
    ["p", "Der ganze Funk Behelf ist in der Dateiverwaltung abgelegt."],
    ["src", "SGV, Basiswissen Kantonale Ergänzungen, Kap. 04, Version 14.10.2026."]] },
  { id: "k05", pg: 2, t: "05 Rettungsdienst", sub: "Retten · Schiebeleiter · Sicherung · Stand 14.10.2026", b: [
    ["h", "5.1 / 5.11.8 Retten"],
    ["warn", "Die alte Rettungsart «Steigunfähige Person über Leitern» wird nicht mehr ausgebildet!"],
    ["p", "Definition «Retten»: Menschen und Tiere aus unmittelbarer Gefahrenzone bringen. Retten von Personen über Leitern erfolgt dann, wenn sie unmittelbare Gefahrenzonen nicht über reguläre Fluchtwege verlassen können."],
    ["h", "Unterstützendes taktisches Vorgehen"],
    ["ul", ["Volumenmethode zur Beurteilung anwenden (Regl. Einsatzführung 4.6), um Entwicklungstendenzen zu erkennen.", "Aufenthaltsprinzip prüfen: Personen in sicheren Bereichen belassen.", "Selbstrettungen ermöglichen: rascher Lüftereinsatz in Treppenhäusern (Fluchtwege).", "Einsatz von Hubrettungsfahrzeugen."]],
    ["h", "5.11.7 Schiebeleiter mit Stützen"],
    ["p", "Wird mit 1 Chargierten und 4 AdF eingesetzt. Die Stützen werden beim Verlängern bzw. Verkürzen der Leiter durch die AdF gesichert, welche den Leiterfuss sichern."],
    ["img", "k_schieb", "Schiebeleiter mit Stützen: Verlängern/Verkürzen"],
    ["h", "5.11.8 / 10.2 Indirekte Sicherung"],
    ["img", "k_seil", "Bandschlinge um die Sprossen"],
    ["img", "k_karab", "Fixpunkt am Leiterkopf"],
    ["ul", ["Ist beim Sichern von Personen im Objekt kein Anschlagpunkt (12 kN) vorhanden: Leiterkopf als Fixpunkt wählen.", "Die Bandschlinge vorzugsweise um eine oder mehrere Sprossen führen.", "Reduktion der Bruchkraft der Bandschlinge durch ungünstiges Anbringen vermeiden (siehe Kapitel 10.2.6).", "An SGV-Kursen wird bei Rettungen über Leitern ausschliesslich der Fixpunkt am Leiterkopf ausgebildet.", "Immer auf straffe Seilführung achten: ein freier Fall des Patienten muss ausgeschlossen sein."]],
    ["src", "SGV, Basiswissen Kantonale Ergänzungen, Kap. 05, Version 14.10.2026."]] },
  { id: "k06", pg: 4, t: "06 Brandbekämpfung", sub: "Hohlstrahlrohr · Leitungen · MS ab Hydrant · Stand 14.10.2026", b: [
    ["h", "6.6.2 / 6.11.1 Hohlstrahlrohr / Wasser"],
    ["p", "Es gibt keine fest definierten Einstellungen (z. B. nur Auf/Zu, kleinste Wassermenge bei Beginn, nur Sprühstrahl). Strahlrohreinstellungen sind laufend der Situation anzupassen!"],
    ["rows", [["K", "Kühlen", "Sprühstrahl führt viel Wärme ab."], ["S", "Sprühstrahl", "Grosse Wasserdampfbildung = Stickeffekt im Raum. Wasserdampf in geschlossenen Räumen = hohe Belastung für Einsatzkräfte."], ["L", "Löschen", "Gezielte Wasserabgabe in geeigneter Form."], ["W", "Wasserschaden vermeiden", "Impulslöschtechnik; Wassermenge und Strahlart (grosse/kleine Tropfen) gezielt anwenden."]]],
    ["h", "6.8.1 / 6.8.2 Leitungsnummerierung"],
    ["p", "Im Kanton Solothurn wird die Leitungsnummerierung beibehalten:"],
    ["ul", ["TL: 10er-Nummerierung (10 / 20 / 30 usw.)", "DL: 11 / 12 / 13 usw.", "DL ab TLF sind «Schnellangriffe» (Nummerierung wenn sinnvoll / nach Situation)"]],
    ["h", "6.8.5 Leitung über Leitern"],
    ["p", "Leitern werden mit leerer bzw. gefüllter Druckleitung unterschiedlich bestiegen (siehe Abbildung im Original-Merkblatt)."],
    ["img", "k_dl", "Druckleitung leer"],
    ["img", "k_lleit", "Druckleitung gefüllt"],
    ["note", "Begründung: Die Standsicherheit auf der Leiter soll jederzeit gewährleistet sein."],
    ["h", "6.13.2 MS ab Hydrant"],
    ["ul", ["Es werden nur die Zubringervarianten 1 × 75 oder 2 × 55 ausgebildet und angewendet.", "Dem dosierten Öffnen der Druckstutzen ist grosse Beachtung zu schenken.", "Bedienung / Handling des Teilstücks gemäss Basiswissen."]],
    ["img", "k_zub", "Zubringervarianten: 1 × 75 oder 2 × 55"],
    ["img", "k_hydr", "MS ab Hydrant"],
    ["h", "MS retablieren"],
    ["ul", ["Zum Spülen der MS den Eingangsdruck auf kleiner als 2 bar reduzieren, damit die Ansaugvorrichtung anspricht und mitgespült wird.", "Druckreduzierung NICHT am Hydrant vornehmen, sondern mit dem Teilstück am Hydrant.", "Hydrantenbedienung (Schieber) nur «auf» oder «zu»."]],
    ["warn", "Je nach Hydrantentyp wird bei Druckreduzierung am Hydrant die Entwässerung geöffnet (Ausspülung der Sickerung). Zudem beschädigen hohe Fliessgeschwindigkeiten und verklemmte Verunreinigungen bei Teilöffnung die Dichtungen im Hydrant."],
    ["h", "Rückflussverhinderer"],
    ["p", "Für den Einsatz eines Rückflussverhinderers beim Wasserbezug ab Hydrant gilt das technische Informationsblatt «T-03 Löschwasserbezug ab Hydranten» der FKS."],
    ["link", "https://www.feukos.ch/wp-content/uploads/2022/04/T-03-Ru%CC%88ckflussverhinderer_V1.0_de-NEU.pdf", "FKS T-03 Rückflussverhinderer (PDF)"],
    ["src", "SGV, Basiswissen Kantonale Ergänzungen, Kap. 06, Version 14.10.2026."]] },
  { id: "k07", pg: 6, t: "07 Atemschutz", sub: "Führungsleine · Verbindung · Retablierung · Stand 14.10.2026", b: [
    ["h", "7.6.1 Rückwegsicherung / Führungsleine"],
    ["p", "Damit der Grundsatz «Die Rückwegsicherung muss jederzeit gewährleistet sein» erfüllt ist: Der letzte AdF fixiert den Sack der Führungsleine sicher (z. B. mit Karabiner am AS-Gerät); die Hände bleiben frei."],
    ["warn", "Der Sack der Führungsleine darf nicht nur über die AS-Flasche gehängt werden: Er kann abgestreift werden, und Verknotungen im Sack lassen sich auf dem Rücken nicht beheben. Befestigungsringe an Brandschutzjacken sind als Befestigungspunkt ungeeignet: Die Nähte sind nicht für solche Belastungen ausgelegt und können ausreissen."],
    ["img", "k_fuehr", "Truppverbindungsseil / Führungsleine"],
    ["h", "7.6.4 / 7.7 Verbindung sicherstellen"],
    ["p", "BW 4.3.4: Die Verbindungskontrolle fordert Stationen auf, die hörbare Verständlichkeit (Sprachdurchsage) anzugeben."],
    ["rows", [["1", "Erst-Einsatzphase", "Verbindung Trupp – Einsatzleiter (der EL ist zugleich Truppüberwacher)."], ["2", "Weiterer Einsatzverlauf", "Der EL kann die Truppüberwachung an einen von ihm definierten Truppüberwacher übergeben. Verbindungskontrolle zwischen EL und Truppüberwacher; danach hört der Truppüberwacher mit."], ["3", "Arbeitsphase", "Der EL definiert mit dem Auftrag an einen Trupp den Truppüberwacher. Der Trupp stellt vor dem Einsatz die Verbindung zu EL und Truppüberwacher sicher."]]],
    ["h", "7.9 AS-Retablierung / Prüfung"],
    ["ul", ["Gerätewarte: Ausbildung durch Lieferanten, Beitrag SGV, Bestand geregelt in Kdo-Akten.", "An SGV-Kursen erfolgt eine Funktionskontrolle mittels Checkliste.", "Die Geräteprüfung erfolgt danach gemäss Herstellerangaben durch die Feuerwehr.", "Siehe Kdo-Akten 07-302 «Retablierung Pressluftatmer an Kursen der SGV»."]],
    ["note", "Atemschutz-Notsituation: Das Thema ist nicht reglementiert; das PowerPoint vom 08.05.2017 dient im Kanton Solothurn als Hilfestellung (siehe «Atemschutz-Notsituationen»)."],
    ["src", "SGV, Basiswissen Kantonale Ergänzungen, Kap. 07, Version 14.10.2026."]] },
  { id: "k12", pg: 8, t: "12 ABC-Einsatz", sub: "Absperren · Crash-Rettung · Stand 14.10.2026", b: [
    ["h", "12.4.4 Absperren"],
    ["p", "Die Deko-Stelle wird als Anhang an die Gefahrenzone erstellt. Die Gefahrenzone bleibt bis zur vollständigen Erstellung der Deko-Stelle geschlossen (kein Ausgang). Nachher wird die Gefahrenzone um die Deko-Stelle erweitert."],
    ["h", "Sofortige Dekontamination bei sofortiger Rettung (Crash-Rettung), Stufe Feuerwehr"],
    ["img", "k_deko", "Gefahrenzone mit Deko-Stelle (Stufe Feuerwehr)"],
    ["rows", [["1", "ABC-Einsatzautomatik", "«Feststellen / Erste Massnahmen» anwenden (HB ABC 2.3)."], ["2", "GAMS / 4-A-Regel", "Umsetzung (HB ABC 2.4.1 und 2.4.2)."], ["3", "Dekontamination", "HB ABC 2.15.1."]]],
    ["note", "Grundsatz: Schnelligkeit vor Perfektion!"],
    ["src", "SGV, Basiswissen Kantonale Ergänzungen, Kap. 12, Version 14.10.2026."]] }

];
function sgvBlock(x) {
  const t = x[0];
  if (t === "note") return `<div class="note">${esc(x[1])}</div>`;
  if (t === "warn") return `<div class="bx r"><div class="bxh">⚠ Achtung</div><div class="bxt">${esc(x[1])}</div></div>`;
  if (t === "h") return `<h3 class="zh">${esc(x[1])}</h3>`;
  if (t === "p") return `<p class="sgvp">${esc(x[1])}</p>`;
  if (t === "ul") return `<ul class="sgvu">${x[1].map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;
  if (t === "img") return IMG[x[1]] ? `<figure class="fig" style="margin:8px 0"><button class="zoom" data-k="${x[1]}" aria-label="Bild vergrössern"><img src="${IMG[x[1]]}" alt="${esc(x[2])}"></button><figcaption>${esc(x[2])}</figcaption></figure>` : "";
  if (t === "rows") return `<div class="sgvl">${x[1].map(r => `<div class="sgvr"><b>${esc(r[0])}</b><div><strong>${esc(r[1])}</strong><span>${esc(r[2])}</span></div></div>`).join("")}</div>`;
  if (t === "link") return `<p class="sgvp"><a class="lnk" href="${esc(x[1])}" target="_blank" rel="noopener">${esc(x[2])}</a></p>`;
  if (t === "src") return `<p class="foot">Quelle: ${esc(x[1])}</p>`;
  return "";
}
function sgvView(id) {
  state.mod = null; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  const x = id && SGV.find(i => i.id === id);
  if (x) {
    state.view = "sgv-item";
    app.innerHTML = `<section class="hero"><h1>${esc(x.t)}</h1><p>${esc(x.sub)} · Kantonale Ergänzung (SGV)</p></section>${x.pg ? `<button class="btn sgvpdf" data-pg="${x.pg}">Im Original-PDF ansehen (S. ${x.pg})</button>` : ""}${x.b.map(sgvBlock).join("")}`;
    bindZoom(app);
    app.querySelectorAll(".sgvpdf").forEach(b => b.addEventListener("click", () => rgJump("sgv", +b.dataset.pg, () => sgvView(x.id))));
  } else {
    state.view = "sgv";
    app.innerHTML = `<section class="hero"><h1>Kantonale Ergänzungen</h1><p>Ergänzungen der Solothurnischen Gebäudeversicherung (SGV) zum Basiswissen.</p></section>
      <div class="menu rgmenu"><button class="mbtn main pdfbtn" data-pg="1"><span>Original-PDF komplett</span><small>10 Seiten · Stand 14.10.2026</small></button>${SGV.map(i => `<button class="mbtn main pdfbtn" data-s="${i.id}"><span>${esc(i.t)}</span><small>${esc(i.sub)}</small></button>`).join("")}</div>`;
    app.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => sgvView(b.dataset.s)));
    app.querySelectorAll("[data-pg]").forEach(b => b.addEventListener("click", () => rgJump("sgv", +b.dataset.pg, () => sgvView())));
  }
  window.scrollTo(0, 0);
}

function spickView() {
  state.mod = null; state.view = "spick"; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  app.innerHTML = `<section class="hero"><h1>Spickzettel</h1><p>Die wichtigsten Zahlen aller Kapitel des Basiswissens auf wenigen Seiten, zum Ausdrucken oder Teilen.</p></section>${spickBar("Spickzettel")}`;
  spickBind(app, getMod("basis"), null); window.scrollTo(0, 0);
}

/* ---------- Basiswissen Gesamtquiz ---------- */
const QX = { abc: { t: "ABC-Handbuch", d: "Multiple Choice zum FKS-Handbuch für ABC-Einsätze." }, veg: { t: "Vegetationsbrände", d: "Multiple Choice zum FKS-Handbuch Spezialwissen Vegetationsbrände." } };
function gquizView(id) {
  id = typeof id === "string" ? id : "basis"; state.gqid = id;
  const m = id === "basis" ? getMod("basis") : { quiz: (window.QZX || {})[id] || [] }, p = mp(id === "basis" ? "basis" : "q-" + id); p.gbs = p.gbs || {};
  state.mod = null; state.view = "gq"; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  const N = m.quiz.length, sizes = N > 45 ? [20, 40, N] : [20, N];
  app.innerHTML = `<section class="hero"><h1>${id === "basis" ? "Basiswissen" : QX[id].t} Quiz</h1><p>${id === "basis" ? "Multiple Choice über das ganze Basiswissen (Kapitel 1–12). Die Fragen werden zufällig und gleichmässig über die Kapitel gemischt." : QX[id].d + " Die Fragen werden zufällig und gleichmässig über die Kapitel gemischt."}</p></section>
    <div class="menu rgmenu" id="gqs">${sizes.map(n => `<button class="mbtn main pdfbtn" data-n="${n}"><span>${n === N ? "Alle Fragen" : n === 20 ? "Kurz · 20 Fragen" : "Mittel · 40 Fragen"}</span><small>${p.gbs[n] != null ? "Best " + p.gbs[n] + "/" + n : n + " Fragen"}</small></button>`).join("")}</div>
    <div id="gqb"></div>`;
  document.querySelectorAll("#gqs button").forEach(b => b.addEventListener("click", () => gquizRun(m, p, +b.dataset.n)));
  window.scrollTo(0, 0);
}
function gquizRun(m, p, n) {
  const el = document.getElementById("gqb"); document.getElementById("gqs").hidden = true;
  const hero = app.querySelector(".hero"); if (hero) hero.hidden = true;
  const by = {}; shuffle(m.quiz.map((_, i) => i)).forEach(i => (by[m.quiz[i].c] = by[m.quiz[i].c] || []).push(i));
  let list = [];
  if (n >= m.quiz.length) list = shuffle(m.quiz.map((_, i) => i));
  else { const ks = shuffle(Object.keys(by)); while (list.length < n && ks.some(k => by[k].length)) for (const k of ks) { if (list.length < n && by[k].length) list.push(by[k].pop()); } list = shuffle(list); }
  let pos = 0, score = 0, wrong = [], answered = false, per = {}, first = true;
  function draw() {
    if (pos >= list.length) {
      const total = list.length;
      if (first && total === n && (p.gbs[n] == null || score > p.gbs[n])) { p.gbs[n] = score; save(); }
      const rows = Object.keys(per).sort((a, b) => state.gqid === "basis" ? a - b : String(a).localeCompare(b)).map(k => `<div class="count"><span>${k} ${esc(state.gqid === "basis" ? ((CHN || {})[k] || "") : "")}</span><span>${per[k][0]} / ${per[k][1]}</span></div>`).join("");
      el.innerHTML = `<div class="card-area">
        <div class="count"><span>Ergebnis</span>${p.gbs[n] != null ? `<span>Bestwert ${p.gbs[n]}/${n}</span>` : ""}</div>
        <div class="score">${score}<span style="color:var(--muted);font-size:2rem"> / ${total}</span></div>
        <div>${score === total ? "Alles richtig." : wrong.length + (wrong.length === 1 ? " Frage" : " Fragen") + " zum Wiederholen."}</div>
        <div style="margin:14px 0">${rows}</div>
        <div class="row">${wrong.length ? '<button class="btn primary" id="rep">Falsche wiederholen</button>' : ""}<button class="btn" id="new">Neues Quiz</button></div></div>`;
      if (wrong.length) document.getElementById("rep").onclick = () => { list = shuffle(wrong); pos = 0; score = 0; wrong = []; per = {}; first = false; draw(); };
      document.getElementById("new").onclick = () => gquizView(state.gqid);
      return;
    }
    const q = m.quiz[list[pos]], order = shuffle(q.o.map((_, i) => i)); answered = false;
    el.innerHTML = `<div class="card-area">
      <div class="count"><span>Frage ${pos + 1} von ${list.length}${q.c ? (state.gqid === "basis" ? " · Kapitel " + q.c + " " + esc((CHN || {})[q.c] || "") : " · " + esc(q.c)) : ""}</span><span>${score} richtig</span></div>
      <div class="q">${esc(q.q)}</div>
      <div class="opts">${order.map(i => `<button class="opt" data-i="${i}">${esc(q.o[i])}</button>`).join("")}</div>
      <div id="fb"></div></div>`;
    el.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
      if (answered) return; answered = true;
      const pick = +b.dataset.i, ok = pick === q.a, c = q.c || "–";
      per[c] = per[c] || [0, 0]; per[c][1]++; if (ok) { score++; per[c][0]++; } else wrong.push(list[pos]);
      el.querySelectorAll(".opt").forEach(o => { o.disabled = true; if (+o.dataset.i === q.a) o.classList.add("right"); else if (o === b) o.classList.add("wrong"); });
      document.getElementById("fb").innerHTML = `<div class="expl"><b>${ok ? "Richtig." : "Nicht ganz."}</b> ${esc(q.e)}</div><div style="margin-top:12px"><button class="btn primary" id="next" style="width:100%">${pos + 1 >= list.length ? "Ergebnis" : "Weiter"}</button></div>`;
      document.getElementById("next").onclick = () => { pos++; draw(); window.scrollTo(0, 0); };
      document.getElementById("next").focus();
    }));
  }
  draw(); window.scrollTo(0, 0);
}

/* ---------- Lektionen-Seite ---------- */
function lesView() {
  state.mod = null; state.view = "les"; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  const ml = typeof AO_LEK !== "undefined" && typeof AO_T !== "undefined";
  if (ml && state.lc && /^[mf]:/.test(state.lc)) {
    const fest = state.lc[0] === "f", src = fest ? (typeof AO_LEKF !== "undefined" ? AO_LEKF : {}) : AO_LEK;
    const t = AO_T.find(x => x.id === state.lc.slice(2));
    if (t && src[t.id]) { app.innerHTML = '<section class="hero"><h1>Musterlektion</h1></section>' + aoLekHtml(t, fest); aoLekBind(app); return; }
    state.lc = null;
  }
  const loginBox = !FWZ.user && FWZ.enabled ? '<div class="loginbox"><div><b>Nicht angemeldet</b><span>Melde dich an, um Dateien mit allen zu teilen und die Lektionen der anderen zu sehen.</span></div><button class="btn primary" id="lgo">Anmelden</button></div>' : "";
  const tiles = (src, p) => '<div class="grid">' + AO_T.filter(t => src[t.id]).map(t => `<button class="tile chtile" data-m="${p}:${t.id}"><span class="num">${t.l.map(n => "L " + n).join(" · ")}</span><h2>${esc(t.t)}</h2></button>`).join("") + "</div>";
  const nA = ml ? AO_T.filter(t => AO_LEK[t.id]).length : 0, nF = ml && typeof AO_LEKF !== "undefined" ? AO_T.filter(t => AO_LEKF[t.id]).length : 0;
  const grp = (t, n, inner) => `<details class="lgrp"><summary><span>${t}</span><b>${n}</b></summary><div class="lgbody">${inner}</div></details>`;
  const mlHtml = ml && !state.lc ? grp("Musterlektionen (50 Min.)", nA + nF, '<h3 class="zh">Anlernstufe</h3>' + tiles(AO_LEK, "m") + (nF ? '<h3 class="zh">Festigungsstufe</h3>' + tiles(AO_LEKF, "f") : "")) : "";
  if (state.lc === "vl" || state.lc === "vn") { vorlageView(state.lc === "vn"); return; }
  if (state.lc === "v") { app.innerHTML = '<section class="hero"><h1>Vorlagen</h1><p>Vorlagen der Feuerwehr Zuchwil (PDF / Word), für alle angemeldeten Mitglieder.</p></section><button class="lgrp vlink" id="vlt"><span>Vorlage Lektion (bearbeiten, PDF / Word)</span></button><button class="lgrp vlink" id="vln"><span>Lektion Vorlage Neutral (ohne Kopfzeile)</span></button><div id="body"></div>'; document.getElementById("vlt").onclick = () => { state.lc = "vl"; lesView(); }; document.getElementById("vln").onclick = () => { state.lc = "vn"; lesView(); }; lektionen(VMOD, document.getElementById("body")); return; }
  app.innerHTML = '<section class="hero"><h1>Lektionen</h1></section>' + loginBox + mlHtml + (state.lc ? '<div id="body"></div>' : '<button class="lgrp vlink" id="vlk"><span>Vorlagen Feuerwehr Zuchwil</span><b id="vn">…</b></button><details class="lgrp" id="eig"><summary><span>Eigene Lektionen (PDF / Word)</span><b id="eign">…</b></summary><div class="lgbody" id="body"></div></details>');
  const lgo0 = document.getElementById("lgo"); if (lgo0) lgo0.onclick = loginView;
  document.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { state.lc = b.dataset.m; lesView(); window.scrollTo(0, 0); }));
  const vlk = document.getElementById("vlk"); if (vlk) { vlk.onclick = () => { state.lc = "v"; lesView(); window.scrollTo(0, 0); };
    (async () => { try { const fl = FWZ.user ? await FWZ.lessons() : await LDB.all(); document.getElementById("vn").textContent = fl.filter(f => f.mod === "vorlagen").length; } catch (e) { document.getElementById("vn").textContent = "–"; } })(); }
  lektionen(getMod("basis"), document.getElementById("body"));
}

/* ---------- Anmeldung ---------- */
function loginView() {
  state.mod = null; state.view = "login"; backBtn.hidden = false;
  app.innerHTML = `<section class="hero"><h1>Anmelden</h1><p>Mit der Anmeldung sind die Lektionen für alle Mitglieder gemeinsam abrufbar. Die Zugangsdaten bekommst du vom Kader.</p></section>
    <form id="lgf" class="lgf">
      <input id="lgu" type="text" autocomplete="username" autocapitalize="none" placeholder="Benutzername" aria-label="Benutzername">
      <input id="lgp" type="password" autocomplete="current-password" placeholder="Passwort" aria-label="Passwort">
      <button class="btn primary" type="submit">Anmelden</button>
      <div id="lgm" role="alert" class="sinfo"></div>
    </form>`;
  try { document.getElementById("lgu").value = localStorage.getItem("fwz-user") || ""; } catch (e) {}
  document.getElementById("lgf").addEventListener("submit", async e => {
    e.preventDefault(); const m = document.getElementById("lgm"), u = document.getElementById("lgu").value, p = document.getElementById("lgp").value;
    if (!u.trim() || !p) return; m.textContent = "Anmelden …";
    try { await FWZ.login(u, p); try { localStorage.setItem("fwz-user", u.trim()); } catch (e2) {} if (state.after) { const f = state.after; state.after = null; await aoSync(); f(); } else lesView(); }
    catch (err) { m.textContent = /Firebase konnte/.test(err.message) ? err.message : "Anmeldung fehlgeschlagen. Benutzername oder Passwort prüfen."; }
  });
}

/* ---------- Lektionen (PDFs je Kapitel, lokal im Browser gespeichert) ---------- */
const isWord = n => /\.docx?$/i.test(n || "");
const fileMime = n => /\.docx$/i.test(n) ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : /\.doc$/i.test(n) ? "application/msword" : "application/pdf";
const LDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      const r = indexedDB.open("fwz-lektionen", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("files", { keyPath: "id", autoIncrement: true });
      r.onsuccess = () => { this.db = r.result; res(r.result); };
      r.onerror = () => rej(r.error);
    });
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => { const t = db.transaction("files", mode), s = t.objectStore("files"); const q = fn(s); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); });
  },
  all() { return this.tx("readonly", s => s.getAll()); },
  add(rec) { return this.tx("readwrite", s => s.add(rec)); },
  del(id) { return this.tx("readwrite", s => s.delete(id)); }
};
const VMOD = { id: "vorlagen", chs: [{ k: "v", n: "Vorlagen Feuerwehr Zuchwil" }], sections: [] };
function chaptersOf(m) {
  if (m.chs) return m.chs;
  const seen = [];
  m.sections.forEach(s => { if (s.g && /^\d+ /.test(s.g) && !seen.includes(s.g)) seen.push(s.g); });
  return seen.map(g => ({ g, k: g.split(" ")[0], n: g.replace(/^\d+ /, "") }));
}
function fmtSize(b) { return b > 1048576 ? (b / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
async function lektionen(m, el) {
  const chs = chaptersOf(m);
  let files = [];
  let cloudErr = "";
  try {
    files = FWZ.user ? await FWZ.lessons() : await LDB.all();
    files = files.filter(f => f.mod === m.id);
  } catch (e) {
    if (FWZ.user) { cloudErr = /permission|insufficient/i.test(e.message || "") ? "Keine Berechtigung für Lektionen in der Datenbank (Firestore-Regeln fehlen)." : "Lektionen konnten nicht geladen werden (offline?)."; files = []; }
    else { el.innerHTML = '<div class="note">Der Speicher im Browser ist nicht verfügbar (z. B. im privaten Modus). Lektionen können hier nicht abgelegt werden.</div>'; return; }
  }
  if (!state.lc) {
    el.innerHTML = '<div class="note">' + (FWZ.user ? 'Angemeldet als <b>' + esc(FWZ.label()) + '</b>. Lektionen sind für alle angemeldeten Mitglieder sichtbar. <button class="linkbtn" id="lgx">Abmelden</button>' : 'Lege hier PDF- oder Word-Lektionen pro Kapitel ab. Ohne Anmeldung bleiben sie nur auf diesem Gerät.') + (cloudErr ? '<br><b>' + cloudErr + '</b>' : '') + '</div><div class="grid">' + chs.map(c => {
      const n = files.filter(f => f.ch === c.k).length;
      return `<button class="tile chtile" data-k="${c.k}"><span class="num">Kapitel ${c.k}</span><h2>${esc(c.n)}</h2><div class="facts"><span>${n === 0 ? "Noch keine Dateien" : n + (n === 1 ? " Datei" : " Dateien")}</span></div></button>`;
    }).join("") + "</div>";
    const en = document.getElementById("eign"); if (en) en.textContent = files.length;
    el.querySelectorAll(".chtile").forEach(b => b.addEventListener("click", () => { state.lc = b.dataset.k; lesView(); window.scrollTo(0, 0); }));
    const lgx = document.getElementById("lgx"); if (lgx) lgx.onclick = () => FWZ.logout().then(() => lesView());
    return;
  }
  const c = chs.find(x => x.k === state.lc) || chs[0];
  const mine = files.filter(f => f.ch === c.k).sort((a, b) => b.added - a.added);
  el.innerHTML = `<div class="banner"><h2>Kapitel ${c.k} – ${esc(c.n)}</h2><p>Lektionen als PDF oder Word-Datei</p></div>
    <div class="lesbar"><label class="btn primary lesup">Datei hinzufügen (PDF / Word)<input type="file" id="lfile" accept="application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple hidden></label></div>
    <div id="lmsg" class="sinfo" role="status"></div>
    <div class="sres">${mine.length ? mine.map(f => `<div class="hit les" data-id="${f.id}"><h3>${esc(f.name)}${isWord(f.name) ? ' <span class="tag plain">Word</span>' : ""}</h3><p>${fmtSize(f.size)} · ${new Date(f.added).toLocaleDateString("de-CH")}${f.by ? " · von " + esc(f.by) : ""}</p>
      <div class="lesact"><button class="btn" data-a="open">${isWord(f.name) ? "Öffnen / Laden" : "Öffnen"}</button><button class="btn" data-a="share">Teilen</button>${isWord(f.name) ? "" : '<button class="btn" data-a="print">Drucken</button>'}<button class="btn ghost" data-a="del">Löschen</button></div></div>`).join("") : '<p class="sinfo">Noch keine Dateien in diesem Kapitel.</p>'}</div>`;
  const msg = document.getElementById("lmsg");
  document.getElementById("lfile").addEventListener("change", async e => {
    const list = [...e.target.files]; let ok = 0;
    for (const f of list) {
      if (!/\.(pdf|docx?)$/i.test(f.name) && f.type !== "application/pdf") { msg.textContent = "«" + f.name + "» ist weder PDF noch Word-Datei."; continue; }
      try {
        if (FWZ.user) await FWZ.addLesson(f, m.id, c.k, (i, n) => { msg.textContent = "Lade «" + f.name + "» hoch … " + i + "/" + n; });
        else await LDB.add({ mod: m.id, ch: c.k, name: f.name, size: f.size, added: Date.now(), blob: f });
        ok++;
      } catch (err) { msg.textContent = /permission|insufficient/i.test(err.message || "") ? "Keine Berechtigung (Firestore-Regeln fehlen)." : (err.message || "Speichern nicht möglich: " + f.name); }
    }
    if (ok) lesView();
  });
  el.querySelectorAll(".les").forEach(row => {
    const f = mine.find(x => String(x.id) === row.dataset.id);
    row.querySelectorAll("button").forEach(b => b.addEventListener("click", async () => {
      const a = b.dataset.a;
      if (a !== "del") { msg.textContent = f.cloud ? "Lade Datei …" : ""; }
      let file = null;
      if (a !== "del") { try { file = new File([f.cloud ? await FWZ.getLesson(f) : f.blob], f.name, { type: fileMime(f.name) }); msg.textContent = ""; } catch (err) { msg.textContent = err.message || "Datei konnte nicht geladen werden."; return; } }
      if (a === "open") { const u = URL.createObjectURL(file); const w = window.open(u, "_blank"); if (!w) location.href = u; setTimeout(() => URL.revokeObjectURL(u), 60000); }
      else if (a === "share") {
        try { if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: f.name }); else msg.textContent = "Teilen wird von diesem Gerät nicht unterstützt. Nutze «Öffnen» und dort das Teilen-Symbol."; }
        catch (err) { if (err && err.name !== "AbortError") msg.textContent = "Teilen nicht möglich."; }
      }
      else if (a === "print") {
        const u = URL.createObjectURL(file), fr = document.createElement("iframe");
        fr.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0";
        fr.src = u; document.body.appendChild(fr);
        fr.onload = () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (err) { window.open(u, "_blank"); } setTimeout(() => { fr.remove(); URL.revokeObjectURL(u); }, 60000); };
        msg.textContent = "Falls kein Druckfenster erscheint: «Öffnen» wählen und dort drucken.";
      }
      else if (a === "del") {
        if (b.dataset.sure) { try { if (f.cloud) await FWZ.delLesson(f); else await LDB.del(f.id); lesView(); } catch (err) { msg.textContent = "Löschen nicht möglich."; } }
        else { b.dataset.sure = "1"; b.textContent = "Wirklich löschen?"; setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = "Löschen"; } }, 4000); }
      }
    }));
  });
}

backBtn.addEventListener("click", () => { if (state.view === "les" && (state.lc === "vl" || state.lc === "vn")) { state.lc = "v"; lesView(); window.scrollTo(0, 0); return; } if (state.view === "sub" && !state.mod) { home(); return; } if (state.view === "sgv-item") { sgvView(); return; } if (state.view === "gq" || state.view === "sgv" || state.view === "spick") { (state.sub ? subView(state.sub) : home()); return; } if (state.view === "pdf") { rgClose(); const pb = state.pdfBack; state.pdfBack = null; if (pb) pb(); else (state.sub ? subView(state.sub) : home()); return; } if (state.view === "les" && state.lc) { state.lc = null; lesView(); window.scrollTo(0, 0); } else if (state.mod && state.from === "ao" && state.direct) { aoGo(state.aoR || ""); } else if (state.mod && state.ch && state.tab === "sum") { state.ch = null; renderMod(); window.scrollTo(0, 0); } else if (state.mod && state.from === "ao") { aoGo(state.aoR || ""); } else if (state.mod) (state.sub ? subView(state.sub) : home()); else if (state.view === "ao" || state.view === "ao-sub") aoBack(); else start(); });
start();

if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

(() => { const br = document.querySelector(".top .brand"); if (!br) return; br.style.cursor = "pointer"; br.setAttribute("role", "link"); br.tabIndex = 0; br.setAttribute("aria-label", "Zur Startseite");
  const go = () => { try { rgClose(); } catch (e) {} state.sub = null; state.pdfBack = null; start(); window.scrollTo(0, 0); };
  br.addEventListener("click", go); br.addEventListener("keydown", e => { if (e.key === "Enter") go(); }); })();

/* ---------- Vorlage Lektion (bearbeiten, PDF + Word) ---------- */
const VL_DEF = () => { const d = new Date(); return { kopf2: "Feuerwehrdienst", nr: "gem. Aufgebot", ver: String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear(), thema: "gemäss Ausbildungsauftrag | Aufgebot", stufe: "Anlernstufe", dauer: "", ziele: "Ziel 1\nZiel 2", krit: "1\n2\n3", mat: "", fz: "", ab: [{ min: "10", t: "Lerngespräch", z: "", h: "" }, { min: "30", t: "Übung 1", z: "", h: "" }, { min: "10", t: "Retablieren | Zusammenfassung | Erfolgskontrolle", z: "", h: "" }] }; };
let VL = null, VLN = false;
function vlLoad() { try { VL = JSON.parse(localStorage.getItem(VLN ? "fwz-vorl-n" : "fwz-vorl") || "null"); } catch (e) {} if (!VL || !Array.isArray(VL.ab)) VL = VL_DEF(); }
function vlSave() { try { localStorage.setItem(VLN ? "fwz-vorl-n" : "fwz-vorl", JSON.stringify(VL)); return true; } catch (e) { return false; } }
const vlLines = s => String(s || "").split("\n").map(x => x.trim()).filter(Boolean);
const vlSum = () => VL.ab.reduce((n, r) => n + (parseInt(r.min, 10) || 0), 0);
const vlDauer = () => (String(VL.dauer || "").trim() || String(vlSum()));
function vlCheck() { const d = parseInt(VL.dauer, 10), sm = vlSum(); if (!VL.dauer || isNaN(d)) return { ok: true, t: "Summe Ablauf: " + sm + " Min. (wird als Gesamtdauer verwendet)" }; return d === sm ? { ok: true, t: "Gesamtdauer " + d + " Min. stimmt mit dem Ablauf überein ✓" } : { ok: false, t: "Achtung: Gesamtdauer " + d + " Min., die Zeiten im Ablauf ergeben " + sm + " Min. (" + (sm > d ? "+" : "−") + Math.abs(sm - d) + " Min.). Bitte anpassen." }; }
const vlToc = () => (window.RGTOC || {}).basis || [];
function vlFind(t) { t = String(t || "").trim().toLowerCase(); if (!t) return null; return vlToc().find(x => x[1].toLowerCase() === t) || null; }
const vlRef = x => "Basiswissen " + x[0] + " " + x[1] + " (S. " + x[2] + ")";
function vlQuelle() { const x = vlFind(VL.thema); return x ? "Basiswissen, Kap. " + x[0] + " " + x[1] + " (S. " + x[2] + ")" : ""; }
function vlImg(file) { return new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { const k = Math.min(1, 700 / Math.max(im.width, im.height)), w = Math.round(im.width * k), h = Math.round(im.height * k), c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h); URL.revokeObjectURL(u); res({ w, h, d: c.toDataURL("image/jpeg", 0.72) }); }; im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("Bild konnte nicht gelesen werden.")); }; im.src = u; }); }
function vlModel() {
  return { nr: VL.nr || "", kopf1: "Ausbildung", kopf2: VL.kopf2 || "", version: VL.ver || "", thema: VL.thema || "", ziele: vlLines(VL.ziele), krit: vlLines(VL.krit), material: vlLines(VL.mat), fahrzeuge: vlLines(VL.fz),
    stufeTxt: VL.stufe + "   |   Dauer: " + vlDauer() + " Min.", logo: VLN ? null : (window.LOGOJ || null),
    quelle: vlQuelle(), c2: 135,
    ablauf: VL.ab.map(r => ({ min: r.min || "", titel: r.t || "", zeilen: vlLines(r.z), hinweis: (r.h || "").trim(), imgs: (r.im || []).map(u => ({ w: u.w, h: u.h, b64: u.d.split(",")[1] })) })), fname: "Lektion " + (VLN ? "Neutral " : "") + (VL.nr || "").replace(/[\\/:*?"<>|]/g, "-") + " " + VL.stufe + ".pdf" };
}
const CRC_T = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u) { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC_T[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function vlDocx() {
  const T = window.DOCXT; if (!T) throw new Error("Word-Vorlage nicht geladen.");
  const m = vlModel(), X = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const rp = o => `<w:rPr><w:rFonts w:cs="Arial"/>${o.b ? "<w:b/>" : ""}${o.u ? '<w:u w:val="single"/>' : ""}${o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : '<w:szCs w:val="22"/>'}</w:rPr>`;
  const r = (t, o = {}) => `<w:r>${rp(o)}<w:t xml:space="preserve">${X(t)}</w:t></w:r>`, tb = (o = {}) => `<w:r>${rp(o)}<w:tab/></w:r>`;
  const para = (inner, ppr = "") => `<w:p><w:pPr>${ppr}</w:pPr>${inner}</w:p>`, empty = () => para("");
  const hdrTabs = '<w:pStyle w:val="Kopfzeile"/><w:tabs><w:tab w:val="clear" w:pos="4536"/><w:tab w:val="clear" w:pos="9072"/><w:tab w:val="right" w:pos="9639"/></w:tabs>';
  let imgN = 0; const media = [];
  let b = para(r(m.kopf1, { b: 1, sz: 28 }) + tb({ b: 1, sz: 28 }) + r("Lektion Nr. " + m.nr, { b: 1, sz: 28 }), hdrTabs);
  b += para(r(m.kopf2, { b: 1, sz: 28 }) + tb({ b: 1, sz: 28 }) + r("Version: " + m.version, { sz: 16 }), hdrTabs) + empty() + empty();
  b += para(r("Thema:", { b: 1 }) + tb() + r(m.thema), '<w:tabs><w:tab w:val="left" w:pos="2552"/></w:tabs>') + empty();
  if (m.quelle) b += para(r("Quelle:", { b: 1 }) + tb() + r(m.quelle), '<w:tabs><w:tab w:val="left" w:pos="2552"/></w:tabs><w:ind w:left="2552" w:hanging="2552"/>') + empty();
  b += para(r("Ausbildungsstufe:", { b: 1 }) + tb() + r(VL.stufe) + tb() + r("Dauer:", { b: 1 }) + tb() + r(vlDauer() + " Min."), '<w:tabs><w:tab w:val="left" w:pos="2552"/><w:tab w:val="left" w:pos="7797"/><w:tab w:val="right" w:pos="9639"/></w:tabs>') + empty();
  const list = (label, items, ch) => { const L = items.length ? items : [""]; return L.map((t, i) => para((i === 0 ? r(label, { b: 1 }) + tb() : "") + r(t ? ch + "  " + t : ""), i === 0 ? '<w:tabs><w:tab w:val="left" w:pos="2552"/></w:tabs><w:ind w:left="2552" w:hanging="2552"/>' : '<w:ind w:left="2552"/>')).join("") + empty(); };
  b += list("Ziele:", m.ziele, "▪") + list("Beurteilungskriterien:", m.krit, "✓") + list("Material:", m.material, "☐") + list("Fahrzeuge:", m.fahrzeuge, "☐");
  const W3 = [700, 6139, 2800], bd = '<w:tblBorders>' + ["top", "left", "bottom", "right", "insideH", "insideV"].map(k => `<w:${k} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join("") + '</w:tblBorders>';
  const cell = (w, inner, shade) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${shade ? '<w:shd w:val="clear" w:color="auto" w:fill="BFBFBF"/>' : ""}</w:tcPr>${inner || para("")}</w:tc>`;
  const sp = '<w:spacing w:before="60" w:after="60"/>';
  let tbl = `<w:tbl><w:tblPr><w:tblW w:w="9639" w:type="dxa"/><w:tblInd w:w="0" w:type="dxa"/>${bd}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="85" w:type="dxa"/><w:right w:w="85" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${W3.map(w => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
  tbl += `<w:tr><w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>${cell(W3[0], para(r("Zeit", { b: 1 }), sp), 1)}${cell(W3[1], para(r("Ablauf der Lektion", { b: 1 }), sp), 1)}${cell(W3[2], para(r("Hinweise | Hilfen", { b: 1 }), sp), 1)}</w:tr>`;
  m.ablauf.forEach(a => {
    const mid = para(r(a.titel, { b: 1 }), sp) + a.zeilen.map(z => para(r(z), sp)).join(""), hin = (a.hinweis ? a.hinweis.split("\n").map(z => para(r(z), sp)).join("") : "") + a.imgs.map(im => { const k = ++imgN, cx = 1000000, cy = Math.round(cx * im.h / im.w); media.push({ n: "word/media/vl" + k + ".jpg", b64: im.b64, rid: "rId" + (100 + k) }); return para(`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${200 + k}" name="Bild ${k}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${k}" name="vl${k}.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${100 + k}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`, sp); }).join("");
    tbl += `<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="560"/></w:trPr>${cell(W3[0], para(r(a.min ? a.min + "’" : "", { b: 1 }), sp))}${cell(W3[1], mid)}${cell(W3[2], hin)}</w:tr>`;
  });
  tbl += "</w:tbl>";
  const xml = new TextEncoder().encode(T.pre + b + tbl + para("") + (VLN ? T.sect.replace(/<w:headerReference[^>]*\/>/g, "").replace('w:top="1666"', 'w:top="1134"') : T.sect) + "</w:body></w:document>");
  const parts = [], cd = [], enc = new TextEncoder(); let off = 0;
  const u16 = n => [n & 255, (n >> 8) & 255], u32 = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  const ents = T.ents.map(e => e.n === "word/_rels/document.xml.rels" ? { n: e.n, t: e.t.replace("</Relationships>", media.map(x => `<Relationship Id="${x.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${x.n.split("/").pop()}"/>`).join("") + "</Relationships>") } : e.n === "[Content_Types].xml" ? { n: e.n, t: media.length ? e.t.replace("<Default Extension=\"png\"", "<Default Extension=\"jpg\" ContentType=\"image/jpeg\"/><Default Extension=\"png\"") : e.t } : e).concat(media.map(x => ({ n: x.n, b64: x.b64 })));
  ents.forEach(e => {
    const nm = enc.encode(e.n); let data, meth, crc, cs, us;
    if (e.t != null) { data = enc.encode(e.t); meth = 0; crc = crc32(data); cs = us = data.length; } else if (e.b64) { const bin = atob(e.b64); data = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i); meth = 0; crc = crc32(data); cs = us = data.length; } else if (e.doc) { data = xml; meth = 0; crc = crc32(xml); cs = us = xml.length; } else { const bin = atob(e.d); data = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i); meth = e.m; crc = e.c; cs = e.cs; us = e.us; }
    const lh = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), ...u16(0), ...u16(meth), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(cs), ...u32(us), ...u16(nm.length), ...u16(0), ...nm]);
    cd.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0), ...u16(meth), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(cs), ...u32(us), ...u16(nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off), ...nm]));
    parts.push(lh, data); off += lh.length + data.length;
  });
  const cdLen = cd.reduce((n, c) => n + c.length, 0), end = new Uint8Array([0x50, 0x4b, 5, 6, ...u16(0), ...u16(0), ...u16(cd.length), ...u16(cd.length), ...u32(cdLen), ...u32(off), ...u16(0)]);
  return new File([...parts, ...cd, end], m.fname.replace(/\.pdf$/, ".docx"), { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
function vorlageView(neutral) {
  VLN = !!neutral; vlLoad(); state.mod = null; state.view = "les"; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  const inp = (k, l, ph, ls) => `<label class="vlf"><span>${l}</span><input data-k="${k}" value="${esc(VL[k])}" placeholder="${esc(ph || "")}"${ls ? ` list="${ls}" autocomplete="off"` : ""}></label>`;
  const ta = (k, l, n, ph) => `<label class="vlf"><span>${l}</span><textarea data-k="${k}" rows="${n}" placeholder="${esc(ph || "")}">${esc(VL[k])}</textarea></label>`;
  const rows = () => VL.ab.map((r, i) => `<div class="vlrow" data-i="${i}"><div class="vlr1"><span class="vlh" aria-label="Verschieben" title="Zum Verschieben ziehen">⋮⋮</span><input data-r="min" inputmode="numeric" value="${esc(r.min)}" aria-label="Minuten" placeholder="Min."><input data-r="t" value="${esc(r.t)}" aria-label="Titel" placeholder="Titel des Abschnitts"><button class="btn vldel" aria-label="Zeile löschen">×</button></div><div class="vlmv"><button class="btn vlup" aria-label="Nach oben">▲</button><button class="btn vldn" aria-label="Nach unten">▼</button></div><textarea data-r="z" rows="2" placeholder="Ablauf / Inhalt (eine Zeile pro Absatz)">${esc(r.z)}</textarea><textarea data-r="h" rows="2" placeholder="Hinweise | Hilfen">${esc(r.h)}</textarea><input data-bw list="vlbw2" autocomplete="off" placeholder="+ Verweis auf Basiswissen (Thema suchen)"><div class="vlimgs">${(r.im || []).map((u, j) => `<span class="vlth"><img src="${u.d}" alt="Bild ${j + 1}"><button class="vlx" data-j="${j}" aria-label="Bild entfernen">×</button></span>`).join("")}<label class="btn vladdimg">+ Bild<input type="file" accept="image/*" multiple hidden></label></div></div>`).join("");
  app.innerHTML = `<section class="hero"><h1>${VLN ? "Lektion Vorlage Neutral" : "Vorlage Lektion"}</h1><p>${VLN ? "Ohne Kopfzeile (Logo). " : ""}Felder ausfüllen, dann als PDF oder Word exportieren. Deine Eingaben bleiben auf diesem Gerät gespeichert.</p></section>
    <div class="vlform">
      <div class="vl2">${inp("kopf2", "Bereich", "Feuerwehrdienst")}${inp("nr", "Lektion Nr.", "gem. Aufgebot")}</div>
      <div class="vl2">${inp("ver", "Version / Datum", "TT.MM.JJJJ")}<label class="vlf"><span>Ausbildungsstufe</span><select data-k="stufe">${["Anlernstufe", "Festigungsstufe", "Anwendungsstufe"].map(s => `<option${VL.stufe === s ? " selected" : ""}>${s}</option>`).join("")}</select></label></div>
      ${inp("thema", "Thema (Vorschläge aus dem Basiswissen)", "gemäss Ausbildungsauftrag | Aufgebot", "vlbw")}<div id="vlq" class="vlq"></div><datalist id="vlbw">${vlToc().map(x => `<option value="${esc(x[1])}" label="${esc(x[0] + " · S. " + x[2])}"></option>`).join("")}</datalist><datalist id="vlbw2">${vlToc().map(x => `<option value="${esc(vlRef(x))}"></option>`).join("")}</datalist>${inp("dauer", "Gesamtdauer (Min.)", "z. B. 50 – muss zur Summe im Ablauf passen")}
      ${ta("ziele", "Ziele (eine pro Zeile)", 3)}${ta("krit", "Beurteilungskriterien (eine pro Zeile)", 3)}${ta("mat", "Material (eine pro Zeile)", 2, "…")}${ta("fz", "Fahrzeuge (eine pro Zeile)", 2, "…")}
      <h3 class="zh">Ablauf der Lektion</h3><div id="vlchk" class="vlchk" role="status"></div><div id="vlrows">${rows()}</div>
      <button class="btn" id="vladd">+ Zeile hinzufügen</button>
      <div class="vlact"><button class="btn primary" id="vlpdf">PDF öffnen</button><button class="btn" id="vlpsh">PDF teilen</button><button class="btn" id="vlprn">Drucken</button><button class="btn primary" id="vldoc">Word (.docx)</button><button class="btn" id="vldsh">Word teilen</button></div>
      <div class="vlsave"><label class="vlf"><span>In «Eigene Lektionen» speichern (PDF und Word)</span><select id="vlch">${chaptersOf(getMod("basis")).map(c => `<option value="${esc(c.k)}">Kapitel ${esc(c.k)} – ${esc(c.n)}</option>`).join("")}</select></label><button class="btn primary" id="vlsv">Speichern in Meine Lektionen</button></div>
      <div id="vlmsg" class="sinfo" role="status"></div>
      <button class="linkbtn" id="vlreset">Alles zurücksetzen</button>
    </div>`;
  const msg = document.getElementById("vlmsg");
  app.querySelectorAll("[data-k]").forEach(e => e.addEventListener("input", () => { VL[e.dataset.k] = e.value; vlSave(); }));
  const chk = () => { const c = vlCheck(), e = document.getElementById("vlchk"); e.textContent = c.t; e.className = "vlchk " + (c.ok ? "ok" : "bad"); };
  const redraw = () => { document.getElementById("vlrows").innerHTML = rows(); bindRows(); chk(); };
  const move = (i, j) => { if (j < 0 || j >= VL.ab.length) return; const [x] = VL.ab.splice(i, 1); VL.ab.splice(j, 0, x); vlSave(); redraw(); };
  const bindRows = () => { document.querySelectorAll(".vlrow").forEach(row => { const i = +row.dataset.i;
    row.querySelectorAll("[data-r]").forEach(e => e.addEventListener("input", () => { VL.ab[i][e.dataset.r] = e.value; vlSave(); if (e.dataset.r === "min") chk(); }));
    const bw = row.querySelector("[data-bw]"); bw.addEventListener("change", () => { const x = vlToc().find(t => vlRef(t) === bw.value); if (!x) return; const ta = row.querySelector("[data-r=h]"); ta.value = (ta.value ? ta.value.replace(/\s+$/, "") + "\n" : "") + bw.value; VL.ab[i].h = ta.value; vlSave(); bw.value = ""; });
    row.querySelector("input[type=file]").addEventListener("change", async e => { const msg = document.getElementById("vlmsg"); msg.textContent = ""; for (const f of [...e.target.files]) { try { const im = await vlImg(f); (VL.ab[i].im = VL.ab[i].im || []).push(im); if (!vlSave()) { VL.ab[i].im.pop(); msg.textContent = "Speicher voll: Bild nicht gespeichert. Entferne andere Bilder."; break; } } catch (er) { msg.textContent = er.message; } } redraw(); });
    row.querySelectorAll(".vlx").forEach(x => x.onclick = () => { VL.ab[i].im.splice(+x.dataset.j, 1); vlSave(); redraw(); });
    row.querySelector(".vldel").onclick = () => { VL.ab.splice(i, 1); vlSave(); redraw(); };
    row.querySelector(".vlup").onclick = () => move(i, i - 1); row.querySelector(".vldn").onclick = () => move(i, i + 1);
    const h = row.querySelector(".vlh");
    h.addEventListener("pointerdown", ev => { ev.preventDefault(); h.setPointerCapture(ev.pointerId); row.classList.add("drag"); const host = document.getElementById("vlrows");
      const mv = e2 => { const rs = [...host.children].filter(r => r !== row); let before = null; for (const r of rs) { const bx = r.getBoundingClientRect(); if (e2.clientY < bx.top + bx.height / 2) { before = r; break; } } if (before !== row.nextSibling) host.insertBefore(row, before); };
      const up = () => { h.removeEventListener("pointermove", mv); h.removeEventListener("pointerup", up); h.removeEventListener("pointercancel", up); row.classList.remove("drag"); const order = [...host.children].map(r => +r.dataset.i); VL.ab = order.map(k => VL.ab[k]); vlSave(); redraw(); };
      h.addEventListener("pointermove", mv); h.addEventListener("pointerup", up); h.addEventListener("pointercancel", up); }); }); };
  bindRows(); chk();
  const quelle = () => { const x = vlFind(VL.thema), q = document.getElementById("vlq"); q.innerHTML = x ? `Quelle im Basiswissen: <b>Kap. ${esc(x[0])} ${esc(x[1])}</b> (S. ${x[2]}) <button class="linkbtn" id="vlq-o">Öffnen</button>` : ""; const o = document.getElementById("vlq-o"); if (o) o.onclick = () => rgJump("basis", x[2], () => vorlageView(VLN)); };
  quelle(); app.querySelector("[data-k=thema]").addEventListener("input", quelle);
  app.querySelector("[data-k=dauer]").addEventListener("input", chk);
  document.getElementById("vladd").onclick = () => { VL.ab.push({ min: "", t: "", z: "", h: "" }); vlSave(); redraw(); const l = document.querySelectorAll(".vlrow"); l[l.length - 1].querySelector("input[data-r=t]").focus(); };
  const pdf = () => aoPdfActs(aoLekPdfBuild(vlModel()), msg), doc = () => aoPdfActs(vlDocx(), msg);
  const run = (f) => () => { msg.textContent = ""; const c = vlCheck(); if (!c.ok) { msg.textContent = c.t; document.getElementById("vlchk").scrollIntoView({ block: "center" }); return; } try { f(); } catch (e) { msg.textContent = (e && e.message) || "Export nicht möglich."; } };
  document.getElementById("vlpdf").onclick = run(() => pdf().open()); document.getElementById("vlpsh").onclick = run(() => pdf().share()); document.getElementById("vlprn").onclick = run(() => pdf().print());
  document.getElementById("vlsv").onclick = async () => {
    msg.textContent = ""; const c = vlCheck(); if (!c.ok) { msg.textContent = c.t; document.getElementById("vlchk").scrollIntoView({ block: "center" }); return; }
    const ch = document.getElementById("vlch").value;
    try {
      const files = [aoLekPdfBuild(vlModel()), vlDocx()];
      for (const f of files) { if (FWZ.user) await FWZ.addLesson(f, "basis", ch, () => { msg.textContent = "Speichere «" + f.name + "» …"; }); else await LDB.add({ mod: "basis", ch, name: f.name, size: f.size, added: Date.now(), blob: f }); }
      msg.textContent = "Gespeichert in «Eigene Lektionen», Kapitel " + ch + ": " + files.map(f => f.name).join(" und ");
    } catch (e) { msg.textContent = /permission|insufficient/i.test((e && e.message) || "") ? "Keine Berechtigung (Firestore-Regeln fehlen)." : ((e && e.message) || "Speichern nicht möglich."); }
  };
  document.getElementById("vldoc").onclick = run(() => doc().open()); document.getElementById("vldsh").onclick = run(() => doc().share());
  document.getElementById("vlreset").onclick = () => { if (document.getElementById("vlreset").dataset.c) { VL = VL_DEF(); vlSave(); vorlageView(VLN); } else { document.getElementById("vlreset").dataset.c = 1; document.getElementById("vlreset").textContent = "Wirklich zurücksetzen? Nochmals tippen."; } };
  window.scrollTo(0, 0);
}
