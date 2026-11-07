const APP_VERSION = "1.186";
const fwzViewMode = () => { try { return localStorage.getItem("fwz-view") || "auto"; } catch (e) { return "auto"; } };
const fwzViewApply = () => { const m = fwzViewMode(); document.documentElement.classList.toggle("dv", m === "desktop" || (m === "auto" && window.innerWidth >= 1000)); };
fwzViewApply(); window.addEventListener("resize", fwzViewApply);
/* ---------- Zustand und Speicher ---------- */
const app = document.getElementById("app");
const backBtn = document.getElementById("back");
FWZ.onChange(() => { if (FWZ.enabled && !FWZ.user && state.view !== "gate" && typeof gateNeeded === "function" && gateNeeded()) { start(); return; } if (state.view === "les") lesView(); greetUpd(); });
let state = { mod: null, tab: "quiz", ch: null, cf: null, lc: null };
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
  if (typeof gateNeeded === "function" && gateNeeded()) { gateView(); return; }
  state.mod = null; state.from = null; state.view = "start"; backBtn.hidden = true;
  document.body.classList.add("startpage"); document.querySelector(".top").hidden = true;
  app.innerHTML = `
    <section class="landing">
      <div class="clock" id="clock"></div>
      <div class="date" id="date"></div>
      <button class="logobtn" id="logoup" aria-label="Nach Update suchen"><img src="logo.jpg" alt="Feuerwehr Zuchwil"></button>
      <div class="greet" id="greet"></div>
      <div class="menu">
        ${typeof fwzHidden === "function" && fwzHidden("home:reg") ? "" : '<button class="mbtn main" id="t-reg">Reglemente</button>'}
        ${typeof fwzHidden === "function" && fwzHidden("home:les") ? "" : '<button class="mbtn main" id="t-les">Lektionen</button>'}
        ${typeof fwzHidden === "function" && fwzHidden("home:ao") ? "" : '<button class="mbtn main" id="t-ao">Ausbildungsoffizier</button>'}
        ${typeof fwzHidden === "function" && fwzHidden("home:vor") ? "" : '<button class="mbtn main" id="t-vor">Vorlagen</button>'}
        ${typeof fwzHidden === "function" && fwzHidden("home:games") ? "" : '<button class="mbtn main" id="t-gm">Feuerwehr Spiele</button>'}
      </div>
      <div class="bottom">
        <button class="wxcard" id="wxs" aria-label="Wetter Zuchwil"><span class="wxl">Wetter Zuchwil …</span></button>
        <div class="ver-foot" id="verf">V${APP_VERSION} · Logo antippen zum Aktualisieren</div>
      </div>
    </section>`;
  const tick = () => { const c = document.getElementById("clock"); if (!c) return clearInterval(clk); c.textContent = new Date().toLocaleTimeString("de-CH", { hour12: false }); const dt = document.getElementById("date"); if (dt) dt.textContent = new Date().toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); greetUpd(); };
  clearInterval(window.clk); tick(); window.clk = setInterval(tick, 1000); var clk = window.clk;
  document.getElementById("logoup").onclick = appUpdate;
  document.getElementById("wxs").onclick = wxView; wxStrip();
  const tr = document.getElementById("t-reg"), tl = document.getElementById("t-les"), ta = document.getElementById("t-ao"), tv = document.getElementById("t-vor"), tg = document.getElementById("t-gm");
  if (tg) tg.onclick = gamesView;
  if (tv) tv.onclick = () => { state.vorHome = true; state.lc = "v"; lesView(); };
  if (tr) tr.onclick = home; if (tl) tl.onclick = () => { state.vorHome = false; state.lc = null; lesView(); }; if (ta) ta.onclick = aoView;
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
/* Marin, der Feuerwehrmann, löscht das brennende Logo: jedes Mal andere Position und anderer Auftritt */
const FF_JOKES = ["Feuer ist wie Montag: am besten sofort löschen.", "Eine Feuerwehr ohne Humor ist wie ein Hydrant ohne Wasser.", "Ich lösche alles, nur nicht den Durst nach Kaffee.", "Warum tragen Feuerwehrleute rote Hosenträger? Damit der Schlauch nicht verrutscht!", "Wer zu spät kommt, den bestraft der Brandmelder.", "Zuchwil brennt nicht an. Dafür sorge ich.", "Keine Panik, ich hab den Schlauch im Griff!", "Schlauch ab, Feierabend!", "Was ist heiss, nass und rot? @ im Einsatz!", "Ich bin nicht aus Zucker, aber bei Feuer schmelz ich trotzdem dahin.", "Grillieren kann jeder. Löschen kann nur ich.", "Brandklasse M: das Mittagessen von @. Wasser marsch!"];
function extinguishFx(lb, fire) {
  return new Promise(done => {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { fire.level(0); done(); return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2), VW = innerWidth, VH = innerHeight, r = lb.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const cv = document.createElement("canvas"); cv.width = VW * dpr; cv.height = VH * dpr;
    cv.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:60";
    document.body.appendChild(cv); const g = cv.getContext("2d"); g.scale(dpr, dpr);
    const pick = a => a[Math.random() * a.length | 0];
    /* Skills: ein Hauptauftritt, dazu mit 65 % die Siegerpose */
    let nm = window.__fxName; if (!nm) { const NM = ["Marin", "Tristan", "Daniele"]; let k = 0; try { k = (parseInt(localStorage.getItem("fwz-ffn") || "-1", 10) + 1) % 3; localStorage.setItem("fwz-ffn", k); } catch (e) { k = Math.floor(Math.random() * 3); } nm = NM[k]; }
    const skill = window.__fxSkill || pick(["strahl", "schwenk", "salto", "eimer", "fontaene", "pirouette", "pulver", "kette", "leiter"]), pose = skill === "leiter" ? false : window.__fxJoke ? true : window.__fxPose !== undefined ? window.__fxPose : Math.random() < .65, joke = skill === "kette" || skill === "leiter" ? false : window.__fxJoke !== undefined ? window.__fxJoke : Math.random() < .5, say = (joke ? pick(FF_JOKES) : pick(["Gelöscht!", "Alles im Griff!", "@ ist da!", "Wasser marsch!", "Feuer aus!"])).replace("@", nm);
    const zones = [[-25, 25], [155, 205], [55, 125], [-60, -30], [210, 240]], z = pick(zones), th = (z[0] + Math.random() * (z[1] - z[0])) * Math.PI / 180;
    const R = Math.min(r.width / 2 + 70, 210), sc = Math.min(1.5, Math.max(1.05, VW / 390 * 1.26));
    let fx = Math.min(VW - 45 * sc, Math.max(45 * sc, cx + Math.cos(th) * R * 1.15)), fy = Math.min(VH - 70 * sc, Math.max(95 * sc, cy + Math.sin(th) * R * .95));
    const dir = cx >= fx ? 1 : -1, slideFrom = dir === 1 ? -120 * sc : VW + 120 * sc, ps = [], t0 = performance.now();
    const IN = 650, SPRAY = skill === "eimer" ? 1700 : skill === "kette" || skill === "leiter" ? 2400 : 1900, POSE = joke ? 4300 : pose ? 900 : 0, OUT = 500, TOT = IN + SPRAY + POSE + OUT;
    let last = t0, sprayT = 0, out = false, thrown = false, bucket = null;
    const ease = x => 1 - Math.pow(1 - x, 3);
    function man(x, y, t, aim, o) {
      g.save(); g.translate(x, y); g.scale(dir * sc, sc);
      if (o.rot) { g.translate(0, 8); g.rotate(o.rot); g.translate(0, -8); }
      const sw = o.walk ? Math.sin(t / 75) * .55 : 0;
      g.fillStyle = "#222"; [[-6, sw], [6, -sw]].forEach(([lx, a]) => { g.save(); g.translate(lx, 20); g.rotate(a); g.fillRect(-5, 0, 9, 28); g.fillStyle = "#111"; g.fillRect(-6, 27, 12, 6); g.fillStyle = "#222"; g.restore(); });
      g.fillStyle = "#3a3f4a"; g.beginPath(); g.roundRect(-14, -18, 28, 40, 5); g.fill();
      g.fillStyle = "#e8d23a"; g.fillRect(-14, 2, 28, 4); g.fillRect(-14, 12, 28, 3);
      g.fillStyle = "#f0c9a0"; g.beginPath(); g.arc(0, -28, 9, 0, 6.3); g.fill();
      g.fillStyle = "#222"; g.fillRect(2, -30, 2, 2); g.fillRect(-4, -30, 2, 2);
      if (o.smile) { g.strokeStyle = "#a55"; g.lineWidth = 1.2; g.beginPath(); g.arc(1, -25, 4, .2, Math.PI - .2); g.stroke(); }
      g.fillStyle = "#c8161d"; g.beginPath(); g.arc(0, -31, 11, Math.PI, 0); g.fill(); g.fillRect(-12, -31, 24, 4); g.fillRect(2, -29, 14, 3);
      g.fillStyle = "#e8d23a"; g.fillRect(-2, -42, 4, 6);
      g.strokeStyle = "#3a3f4a"; g.lineWidth = 6; g.lineCap = "round";
      if (o.thumb) {                                                                          // Siegerpose: Daumen hoch
        g.beginPath(); g.moveTo(4, -10); g.lineTo(18, -26); g.stroke(); g.fillStyle = "#f0c9a0"; g.beginPath(); g.arc(19, -29, 4.5, 0, 6.3); g.fill(); g.fillRect(17, -39, 4, 9);
        g.strokeStyle = "#3a3f4a"; g.beginPath(); g.moveTo(-4, -10); g.lineTo(-10, 6); g.stroke();
      } else {
        const a = aim + Math.sin(t / 60) * .02;
        g.beginPath(); g.moveTo(4, -10); g.lineTo(4 + Math.cos(a) * 22, -4 + Math.sin(a) * 22); g.stroke();
        if (o.ext) { const hx = 4 + Math.cos(a) * 24, hy = -4 + Math.sin(a) * 24; g.fillStyle = "#c8161d"; g.beginPath(); g.roundRect(hx - 6, hy - 9, 12, 26, 3); g.fill(); g.fillStyle = "#222"; g.fillRect(hx - 3, hy - 14, 7, 6); g.strokeStyle = "#222"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(hx + 3, hy - 11); g.lineTo(hx + 3 + Math.cos(a) * 16, hy - 11 + Math.sin(a) * 16 + 6); g.stroke(); g.lineWidth = 6; }
        else if (o.bucket) { g.fillStyle = "#8a93a1"; g.beginPath(); const bx = 4 + Math.cos(a) * 26, by = -4 + Math.sin(a) * 26; g.moveTo(bx - 9, by - 8); g.lineTo(bx + 9, by - 8); g.lineTo(bx + 6, by + 8); g.lineTo(bx - 6, by + 8); g.fill(); g.fillStyle = "rgba(120,190,255,.9)"; g.fillRect(bx - 8, by - 8, 16, 3); }
        else if (!o.noNozzle) { g.strokeStyle = "#c8a82a"; g.lineWidth = 7; g.beginPath(); g.moveTo(4 + Math.cos(a) * 20, -4 + Math.sin(a) * 20); g.lineTo(4 + Math.cos(a) * 40, -4 + Math.sin(a) * 40); g.stroke(); }
      }
      g.restore();
      g.save(); g.font = "700 " + Math.round(11 * sc) + "px system-ui, sans-serif"; g.textAlign = "center"; const NN = o.nm || nm, tw = g.measureText(NN).width + 12, ty = y - 58 * sc + (o.dy || 0);
      g.fillStyle = "rgba(255,255,255,.92)"; g.strokeStyle = "#c8161d"; g.lineWidth = 1.5; g.beginPath(); g.roundRect(x - tw / 2, ty - 12 * sc, tw, 17 * sc, 8); g.fill(); g.stroke();
      g.fillStyle = "#c8161d"; g.fillText(NN, x, ty + 1 * sc);
      if (o.say) {
        const fs = Math.round(13 * sc), maxW = Math.min(VW - 28, 250 * Math.max(1, sc / 1.3)); g.font = "700 " + fs + "px system-ui, sans-serif"; g.textAlign = "center";
        const ws = o.say.split(" "), lines = []; let cur = ""; ws.forEach(w => { const t = cur ? cur + " " + w : w; if (g.measureText(t).width > maxW - 22 && cur) { lines.push(cur); cur = w; } else cur = t; }); lines.push(cur);
        const bw = Math.max(...lines.map(l => g.measureText(l).width)) + 22, bh = lines.length * fs * 1.25 + 14, bx = Math.min(VW - bw / 2 - 8, Math.max(bw / 2 + 8, x));
        let by = ty - 20 * sc - bh; if (by < 8) by = Math.min(VH - bh - 8, y + 62 * sc);
        g.fillStyle = "#fff"; g.strokeStyle = "#c8161d"; g.lineWidth = 2; g.beginPath(); g.roundRect(bx - bw / 2, by, bw, bh, 12); g.fill(); g.stroke();
        g.fillStyle = "#c8161d"; lines.forEach((l, k) => g.fillText(l, bx, by + 7 + fs * (1.05 + k * 1.25)));
      }
      g.restore();
      return [x + dir * sc * (4 + Math.cos(aim) * 41), y + sc * (-4 + Math.sin(aim) * 41)];
    }
    const splash = (px, py, n) => { for (let i = 0; i < n; i++) { const d = Math.random() * 6.28, sp = 80 + Math.random() * 280; ps.push({ x: px, y: py, vx: Math.cos(d) * sp, vy: Math.sin(d) * sp - 80, w: 1, l: 0 }); } for (let i = 0; i < 8; i++) ps.push({ x: px + (Math.random() - .5) * 90, y: py + (Math.random() - .5) * 40, vx: (Math.random() - .5) * 60, vy: -20 - Math.random() * 40, w: 0, l: 0 }); };
    function frame(now) {
      const el = now - t0, dt = Math.min(.05, (now - last) / 1000); last = now;
      g.clearRect(0, 0, VW, VH);
      const tOut = IN + SPRAY + POSE, k = el < IN ? ease(el / IN) : el > tOut ? 1 - ease((el - tOut) / OUT) : 1, x = slideFrom + (fx - slideFrom) * k, sp = el - IN;
      const spraying = sp > (skill === "leiter" ? 500 : 0) && sp < SPRAY, o = { walk: k < 1 && (el < IN || el > tOut), noNozzle: skill === "eimer" || skill === "pulver", ext: skill === "pulver" };
      let jump = 0, tx = cx, ty = cy;
      if (skill === "schwenk" && spraying) tx = cx + Math.sin(sp / 170) * r.width * .45;
      if (skill === "fontaene" && spraying && sp < 700) { tx = cx + (cx - fx) * .2; ty = cy - 230; }
      if (skill === "salto" && spraying && sp > 350 && sp < 1100) { const u = (sp - 350) / 750; jump = -Math.sin(u * Math.PI) * 75 * sc; o.rot = -dir * u * 6.283 * -1; }
      if (skill === "pirouette" && spraying && sp > 300 && sp < 1000) { const u = (sp - 300) / 700; o.dirFlip = Math.cos(u * 6.283 * 2); }
      let aim = Math.atan2(ty - fy, Math.abs(tx - fx)); aim = Math.max(-1.1, Math.min(1.1, aim));
      if (skill === "eimer") { o.bucket = !thrown && el > IN * .4; if (!o.bucket) o.noNozzle = true; }
      if (el > IN + SPRAY && pose && el < tOut) { o.thumb = true; o.smile = true; o.say = say; }
      const flipSave = dir; if (o.dirFlip !== undefined) { /* Pirouette: Körper dreht sich um die Hochachse */ g.save(); g.translate(x, 0); g.scale(Math.abs(o.dirFlip) < .12 ? .12 : Math.abs(o.dirFlip), 1); g.translate(-x, 0); }
      let nx, ny; const H = [];
      if (skill === "kette") {            /* Eimerkette: alle drei Feuerwehrleute */
        const others = ["Marin", "Tristan", "Daniele"].filter(n => n !== nm), nms = [nm, others[0], others[1]];
        for (let i = 2; i >= 0; i--) { const xi = slideFrom + ((cx + dir * 64 * sc * (1 - i)) - slideFrom) * k; H[i] = man(xi, Math.min(VH - 70 * sc, r.bottom + 80 * sc), now + i * 90, 0, { walk: o.walk, noNozzle: true, nm: nms[i], thumb: o.thumb, smile: o.smile, say: i === 0 ? o.say : undefined }); }
        [nx, ny] = H[0];
      } else if (skill === "leiter") {    /* Drehleiter fährt ein und spritzt */
        const s = sc * .9, gy = fy + 30 * sc, q = el > tOut ? 1 - ease((el - tOut) / OUT) : Math.max(0, Math.min(1, (el - 250) / (IN + 250)));
        g.save(); g.translate(x, gy); g.scale(dir * s, s);
        g.fillStyle = "#c8161d"; g.fillRect(-72, -42, 104, 30); g.fillRect(32, -50, 36, 38);
        g.fillStyle = "#eee"; g.fillRect(-72, -27, 104, 4); g.fillStyle = "#9fd0ee"; g.fillRect(52, -44, 14, 14);
        g.fillStyle = "#555"; g.fillRect(-72, -14, 140, 4); g.fillStyle = "#8a93a1"; g.fillRect(-34, -50, 24, 8);
        g.fillStyle = Math.floor(now / 180) % 2 ? "#3b82f6" : "#bcd7ff"; g.fillRect(44, -57, 12, 7);
        [[-46, -6], [44, -6]].forEach(([wx, wy]) => { g.fillStyle = "#222"; g.beginPath(); g.arc(wx, wy, 11, 0, 6.3); g.fill(); g.fillStyle = "#aaa"; g.beginPath(); g.arc(wx, wy, 4, 0, 6.3); g.fill(); });
        g.restore();
        const pvx = x + dir * s * -22, pvy = gy - 48 * s, ta = Math.max(.25, Math.min(1.25, Math.atan2(pvy - cy, Math.abs(cx - pvx)))), a = ta * ease(q), len = (70 + 120 * ease(q)) * s, tipx = pvx + dir * Math.cos(a) * len, tipy = pvy - Math.sin(a) * len;
        g.lineCap = "round"; g.strokeStyle = "#3a3f4a"; g.lineWidth = 8 * s; g.beginPath(); g.moveTo(pvx, pvy); g.lineTo(tipx, tipy); g.stroke();
        g.strokeStyle = "#c9ccd1"; g.lineWidth = 3 * s; g.setLineDash([5 * s, 5 * s]); g.beginPath(); g.moveTo(pvx, pvy); g.lineTo(tipx, tipy); g.stroke(); g.setLineDash([]);
        g.fillStyle = "#fff"; g.strokeStyle = "#23262b"; g.lineWidth = 2; g.beginPath(); g.roundRect(tipx - 9 * s, tipy - 7 * s, 18 * s, 12 * s, 2); g.fill(); g.stroke();
        nx = tipx; ny = tipy;
      } else [nx, ny] = man(x, fy + jump, now, aim, o);
      if (o.dirFlip !== undefined) g.restore();
      /* Schlauch vom Bildrand zum Strahlrohr (nicht beim Eimer) */
      if (!["eimer", "pulver", "kette", "leiter"].includes(skill)) { g.strokeStyle = "#d4b22a"; g.lineWidth = 6 * sc / 1.2; g.lineCap = "round"; g.beginPath(); g.moveTo(slideFrom, fy + 40 * sc); g.bezierCurveTo(slideFrom + (x - slideFrom) * .4, fy + 60 * sc, x - dir * 20 * sc, fy + 50 * sc, x + dir * 4 * sc, fy + 2 * sc + jump); g.stroke(); }
      if (skill === "eimer" || skill === "kette") {
        if (skill === "eimer" && !thrown && sp > 250) { thrown = true; bucket = { x0: nx, y0: ny, t: 0 }; }
        if (skill === "kette" && !thrown) {   /* Eimer wandert von Hand zu Hand */
          if (sp < 900) { const a0 = sp < 450 ? 2 : 1, a1 = a0 - 1, u = Math.max(0, (sp < 450 ? sp : sp - 450) / 450), bx = H[a0][0] + (H[a1][0] - H[a0][0]) * u, by = H[a0][1] + (H[a1][1] - H[a0][1]) * u - Math.sin(u * Math.PI) * 16;
            g.fillStyle = "#8a93a1"; g.beginPath(); g.moveTo(bx - 9, by - 8); g.lineTo(bx + 9, by - 8); g.lineTo(bx + 6, by + 8); g.lineTo(bx - 6, by + 8); g.fill(); }
          else { thrown = true; bucket = { x0: nx, y0: ny, t: 0 }; }
        }
        if (bucket) { bucket.t += dt; const u = Math.min(1, bucket.t / .65), bx = bucket.x0 + (cx - bucket.x0) * u, by = bucket.y0 + (cy - bucket.y0) * u - Math.sin(u * Math.PI) * 140;
          if (u < 1) { g.save(); g.translate(bx, by); g.rotate(u * 9 * dir); g.fillStyle = "#8a93a1"; g.beginPath(); g.moveTo(-9, -8); g.lineTo(9, -8); g.lineTo(6, 8); g.lineTo(-6, 8); g.fill(); g.restore(); }
          else if (!bucket.done) { bucket.done = true; splash(cx, cy, 160); fire.level(0); } }
      } else if (spraying && !(skill === "salto" && o.rot)) {
        if (skill === "pulver") { for (let i = 0; i < 4; i++) { const d = Math.atan2(ty - ny, tx - nx) + (Math.random() - .5) * .35, s2 = 300 + Math.random() * 160; ps.push({ x: nx, y: ny, vx: Math.cos(d) * s2, vy: Math.sin(d) * s2, w: 0, l: 0 }); } }
        else for (let i = 0; i < 9; i++) { const d = Math.atan2(ty - ny, tx - nx) + (Math.random() - .5) * .09, s2 = 600 + Math.random() * 140; ps.push({ x: nx, y: ny, vx: Math.cos(d) * s2, vy: Math.sin(d) * s2, w: 1, l: 0 }); }
        sprayT += dt; if (sprayT > .55 && !(skill === "fontaene" && sp < 700)) fire.level(0);
      }
      g.globalCompositeOperation = "source-over";
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; p.l += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.w ? 260 : -40) * dt;
        const inLogo = p.w && p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom;
        if (inLogo && Math.random() < .35) { p.w = 0; p.vx = (Math.random() - .5) * 120; p.vy = -30 - Math.random() * 60; p.l = 0; }
        if (p.l > (p.w ? 1.2 : .7) || p.y > VH + 20) { ps.splice(i, 1); continue; }
        if (p.w) { g.fillStyle = "rgba(120,190,255,.85)"; g.beginPath(); g.arc(p.x, p.y, 2.6 * sc / 1.3, 0, 6.3); g.fill(); }
        else { const a = 1 - p.l / .7; g.fillStyle = `rgba(235,240,245,${a * .5})`; g.beginPath(); g.arc(p.x, p.y, 7 + p.l * 22, 0, 6.3); g.fill(); }
      }
      if (el < TOT || ps.length) requestAnimationFrame(frame); else { cv.remove(); done(); }
    }
    requestAnimationFrame(frame);
  });
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
    if (nv && nv === APP_VERSION) { await wait(); await extinguishFx(lb, fire); fire.level(0); fx("ok"); setTimeout(() => lb.classList.remove("ok"), 1200); v.textContent = "Die App ist aktuell (V" + APP_VERSION + ")"; setTimeout(() => { const e = document.getElementById("verf"); if (e) e.textContent = "V" + APP_VERSION + " · Logo antippen zum Aktualisieren"; }, 3500); return; }
    await wait(); fire.level(2); fx("upd"); v.textContent = "Neue Version" + (nv ? " V" + nv : "") + " wird geladen …";
    if ("caches" in window) for (const k of await caches.keys()) await caches.delete(k);
    if ("serviceWorker" in navigator) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    await new Promise(r => setTimeout(r, 900)); await extinguishFx(lb, fire); await new Promise(r => setTimeout(r, 300)); location.reload();
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
    if (typeof fwzHidden === "function" && fwzHidden("reg:" + m.id)) return;
    m.sections.forEach((s, i) => {
      const paras = s.p.concat((s.bx || []).flatMap(b => b[2])).filter(p => words.every(w => fold(s.t + " " + p).includes(w)));
      const titleHit = words.every(w => fold(s.t).includes(w));
      if ((paras.length || titleHit) && (s.t.match(/^(\d+(?:\.\d+)*)\s/) && rgNum(m.id, s.t.match(/^(\d+(?:\.\d+)*)\s/)[1]))) res.push({ t: "s", m, s, i, paras: paras.length ? paras.slice(0, 2) : [s.p[0]], score: titleHit ? 2 : 1 });
    });
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
      bt("gq", "Quiz", bm.quiz.length + " Fragen" + (gb != null ? " · Best " + gb : "")) +
      bt("spick", "Spickzettel", "wichtigste Zahlen · PDF");
  } else if (g === "abc") {
    h = (((window.QZX || {}).abc || []).length ? bt("gq:abc", "ABC-Handbuch Quiz", window.QZX.abc.length + " Fragen") : "") + [1, 2, 3, 4].map(n => bt("pdf:abc" + n, RGDEF["abc" + n].short.replace("ABC-Handbuch ", ""), "Teil " + n + " · PDF · " + RGDEF["abc" + n].pages + " S.")).join("");
  } else if (g === "veg") {
    h = bt("pdf:veg", "Vegetationsbrände komplett", "PDF · " + RGDEF.veg.pages + " S.") + (((window.QZX || {}).veg || []).length ? bt("gq:veg", "Vegetationsbrände Quiz", window.QZX.veg.length + " Fragen") : "");
  } else {
    const em = getMod("einsatz");
    h = bt("pdf:einsatz", "Einsatzführung komplett", "PDF · " + RGDEF.einsatz.pages + " S.") +
      bt("einsatz", "Quiz", em.quiz.length + " Fragen");
  }
  app.innerHTML = `<section class="hero"><h1>${g === "basis" ? "Basiswissen" : g === "abc" ? "ABC-Handbuch" : g === "veg" ? "Vegetationsbrände" : "Einsatzführung"}</h1><p>${g === "abc" ? "Handbuch für ABC-Einsätze (FKS), 508 Seiten in vier Teilen." : g === "veg" ? "Handbuch Spezialwissen Vegetationsbrände (FKS) mit Quiz." : "Reglement als PDF und Quiz."}</p></section><div class="menu rgmenu">${h}</div>`;
  app.querySelectorAll(".pdfbtn").forEach(b => b.addEventListener("click", () => { const i = b.dataset.id; state.sub = g; i === "gq" ? gquizView() : i.startsWith("gq:") ? gquizView(i.slice(3)) : i === "spick" ? spickView() : i.startsWith("pdf:") ? rgJump(i.slice(4), 0, () => subView(g)) : openMod(i, "quiz"); }));
  window.scrollTo(0, 0);
}
function home() {
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  state.mod = null; state.from = null; state.sub = null; state.view = "list"; backBtn.hidden = false;
  app.innerHTML = `
    <section class="hero">
      <h1>Reglemente</h1>
      <p>Lies das ganze Reglement im PDF, teste dich im Quiz.</p>
    </section>
    <div class="srch"><input type="search" id="q" placeholder="Reglemente durchsuchen (z. B. Atemschutz, OAABS, 118)" aria-label="Suche" autocomplete="off"></div>
    <div id="sbox" hidden></div>
    <div class="menu rgmenu" id="mgrid">${(() => {
      const bt = (id, t, sm) => `<button class="mbtn main pdfbtn" data-id="${id}"><span>${esc(t)}</span><small>${esc(sm)}</small></button>`;
      const sh = id => !(typeof fwzHidden === "function" && fwzHidden("reg:" + id));
      return (sh("basis") ? bt("sub:basis", "Basiswissen", "PDF, Quiz, Spickzettel") : "") +
        (sh("einsatz") ? bt("sub:einsatz", "Einsatzführung", "PDF und Quiz") : "") +
        (sh("sgv") ? bt("sgv", "Kantonale Ergänzungen (SGV)", "Original-PDF + " + SGV.length + " Merkblätter") : "") +
        (sh("abc") ? bt("sub:abc", "ABC-Handbuch", "FKS · 508 S. in 4 Teilen + Quiz") : "") +
        (sh("veg") ? bt("sub:veg", "Vegetationsbrände", "Handbuch Spezialwissen · PDF + Quiz") : "") +
        (sh("adl") ? bt("adl", "Autodrehleiter", "Anleitungen und Simulator") : "");
    })()}</div>
    <p class="foot">Lernhilfe aus den FKS-Reglementen von feukos.ch. Massgebend ist immer das jeweilige Reglement in der gültigen Fassung.</p>`;
  app.querySelectorAll(".pdfbtn").forEach(b => b.addEventListener("click", () => b.dataset.id.startsWith("sub:") ? subView(b.dataset.id.slice(4)) : b.dataset.id === "gq" ? gquizView() : b.dataset.id === "adl" ? adlView() : b.dataset.id === "sgv" ? sgvView() : b.dataset.id === "spick" ? spickView() : b.dataset.id.startsWith("pdf:") ? rgView(b.dataset.id.slice(4)) : openMod(b.dataset.id, "quiz")));
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
  adl2: { pages: 138, short: "ADL Einweisung", enc: "reglement-adl2.enc", file: "Einweisungsunterlage L32A-XS Zuchwil.pdf", c: "© Rosenbauer", tile: "", hero: "Einweisungsunterlage (Teilnehmerunterlage) Drehleiter L32A-XS, CAN Safety 3.2, 138 Seiten.", online: "" },
  adl: { pages: 265, short: "Autodrehleiter", enc: "reglement-adl.enc", file: "Betriebsanleitung L32A-XS Zuchwil.pdf", c: "© Rosenbauer", tile: "", hero: "Betriebsanleitung Autodrehleiter L32A-XS, Feuerwehr Zuchwil (265 Seiten).", online: "" },
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
function openMod(id, tab) { state.ch = null; state.cf = null; state.lc = null; state.mod = id; state.tab = tab || "quiz"; renderMod(); window.scrollTo(0, 0); }
function renderMod() {
  const m = getMod(state.mod); backBtn.hidden = false;
  app.innerHTML = `
    <section class="head"><h1>${esc(m.title)}</h1><div class="ver">${esc(m.ver)}</div></section>
    <div id="body"></div>`;
  app.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => { state.tab = b.dataset.tab; state.lc = null; renderMod(); }));
  const body = document.getElementById("body");
  if (state.tab === "sum") cards(m, body);
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
/* Autodrehleiter: Anleitungen (PDF) */
function adlView() {
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  state.mod = null; state.sub = null; state.view = "adl"; backBtn.hidden = false;
  app.innerHTML = `<section class="hero"><h1>Autodrehleiter</h1><p>Anleitungen zur Drehleiter L32A-XS der Feuerwehr Zuchwil.</p></section>
    <div class="menu rgmenu">
      <button class="mbtn main pdfbtn" id="adlsim"><span>Ausladungs Simulator</span><small>Ausladung, Personen, Zuladungsreserve interaktiv</small></button>
      <button class="mbtn main pdfbtn" id="adljoy"><span>Drehleiter Simulator</span><small>3D-Simulator: Bedienhebel der Drehleiter üben</small></button>
      <button class="mbtn main pdfbtn" id="adlmas"><span>Drehleiter Masse</span><small>Abstützbreite und Wandabstand</small></button>
      <button class="mbtn main pdfbtn" id="adlpdf"><span>Betriebsanleitung L32A-XS</span><small>PDF · ${RGDEF.adl.pages} S.</small></button>
      <button class="mbtn main pdfbtn" id="adlpdf2"><span>Einweisungsunterlage</span><small>PDF · ${RGDEF.adl2.pages} S. · Kurzfassung zum Lernen</small></button>
    </div>
    <p class="foot">Unterlagen des Herstellers Rosenbauer, Ausgabe 12/2022, nur zur internen Verwendung.</p>`;
  document.getElementById("adlsim").onclick = () => simView();
  document.getElementById("adlmas").onclick = () => masseView();
  document.getElementById("adljoy").onclick = () => joystickView();
  document.getElementById("adlpdf").onclick = () => { state.pdfBack = () => adlView(); rgView("adl"); };
  document.getElementById("adlpdf2").onclick = () => { state.pdfBack = () => adlView(); rgView("adl2"); };
  window.scrollTo(0, 0);
}
/* Drehleiter Simulator (3D): 3D-Hebel-Simulator (eigene Seite joystick.html im Rahmen) */
function joystickView() {
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  state.mod = null; state.sub = null; state.view = "joystick"; backBtn.hidden = false;
  app.innerHTML = '<iframe id="joyf" title="Drehleiter Simulator" src="joystick.html?v=' + APP_VERSION + '" allow="fullscreen" style="position:fixed;left:0;right:0;bottom:0;border:0;width:100%;background:#0f1216"></iframe>';
  const fit = () => { const f = document.getElementById("joyf"); if (!f) return; const t = Math.ceil(document.querySelector(".top").getBoundingClientRect().bottom); f.style.top = t + "px"; f.style.height = (window.innerHeight - t) + "px"; };
  fit(); window.addEventListener("resize", fit, { once: true }); window.scrollTo(0, 0);
}
/* Zuchwil-Drehleiter (Seitenansicht) nach Fahrzeugvorlage: ox/oy = Pixelposition der Drehachse am Boden, kk = Pixel pro Vorlageneinheit */
function adlTruck(ox, oy, kk) {
    const R = "#c0141b", D = "#3b3e44";
    const wh = (cx) => `<circle cx="${cx}" cy="362" r="52" fill="#1a1b1e"/><circle cx="${cx}" cy="362" r="35" fill="#c9ccd1" stroke="#8a8f98" stroke-width="3"/><circle cx="${cx}" cy="362" r="12" fill="#7d8189"/>${[0, 1, 2, 3, 4, 5].map(q => `<circle cx="${cx + 23 * Math.cos(q * 1.047)}" cy="${362 + 23 * Math.sin(q * 1.047)}" r="4" fill="#8a8f98"/>`).join("")}`;
    const shut = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1f2024"/>` + Array.from({ length: Math.floor(h / 9) }, (_, q) => `<line x1="${x}" y1="${y + 6 + q * 9}" x2="${x + w}" y2="${y + 6 + q * 9}" stroke="#3a3c42" stroke-width="2"/>`).join("");
    const leg = x => `<rect x="${x - 9}" y="318" width="18" height="90" fill="#9aa0a8" stroke="${D}" stroke-width="3"/><rect x="${x - 5}" y="318" width="10" height="45" fill="#d4d7dc"/><rect x="${x - 34}" y="402" width="68" height="10" fill="#1f2024"/><path d="M${x - 34} 402 l14 10 M${x - 12} 402 l14 10 M${x + 10} 402 l14 10" stroke="#d9322f" stroke-width="4"/>`;
    const turm = `<g transform="translate(1670 0) scale(-1 1)"><rect x="776" y="244" width="110" height="20" fill="#6b6f76"/>${Array.from({ length: 11 }, (_, q) => `<line x1="${780 + q * 10}" y1="246" x2="${780 + q * 10}" y2="262" stroke="#9aa0a8" stroke-width="3"/>`).join("")}<path d="M752 240 L775 213 L862 216 L880 150 L842 96 L836 82 L1015 74 L1060 98 L1078 180 L1052 190 L1034 232 L985 250 L905 246 L860 246 Z" fill="${R}" stroke="#7d0e13" stroke-width="3"/><path d="M880 150 L842 96 L1015 74 L1000 150 Z" fill="#a30f15" opacity=".5"/><rect x="882" y="108" width="40" height="22" fill="#d4d7dc" stroke="${D}" stroke-width="2"/><rect x="822" y="100" width="12" height="38" fill="#222"/><path d="M1010 90 L1040 96 L1052 200" fill="none" stroke="#7d0e13" stroke-width="3"/></g>`;
    const trk = `<g transform="translate(${ox - 835 * kk} ${oy - 412 * kk}) scale(${kk})">${leg(1000)}${leg(500)}
      <rect x="410" y="262" width="650" height="112" fill="${R}"/><rect x="622" y="262" width="436" height="12" fill="${D}"/><rect x="405" y="150" width="112" height="224" fill="${R}"/>${shut(422, 152, 84, 194)}${shut(637, 276, 126, 98)}${shut(887, 276, 54, 98)}${shut(1006, 276, 40, 98)}<rect x="765" y="276" width="120" height="98" fill="${R}"/><rect x="415" y="346" width="650" height="28" fill="${R}"/>
      <path d="M760 292 H1058" stroke="#f08a5d" stroke-width="10"/><path d="M425 360 H760" stroke="#9c0f15" stroke-width="3"/>
      <path d="M203 332 V225 L214 198 L240 150 L392 138 L400 372 L292 372 L284 335 Z" fill="${R}" stroke="#7d0e13" stroke-width="3"/><path d="M255 160 L336 160 L336 236 L242 236 Z" fill="#b9c3cc" stroke="#23262b" stroke-width="3"/><path d="M200 175 L240 165 L245 215 L205 222 Z" fill="#9aa4ad" stroke="#23262b" stroke-width="3"/>
      <path d="M245 266 L300 248 L395 244 L395 252 L304 258 L252 276 Z" fill="#f4f1ee"/><path d="M262 280 L346 244 L392 241 L392 236 L344 238 Z" fill="#e8663a"/><path d="M215 300 L285 262 L300 262 L225 306 Z" fill="#e8663a"/>
      <text x="233" y="283" font-size="17" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">Feuerwehr</text><text x="233" y="296" font-size="17" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">ZUCHWIL</text>
      <path d="M203 322 H298 L308 372 H210 Z" fill="#4a4d52"/><path d="M205 345 L225 330 L255 336 L215 360 Z" fill="#c9ccd1"/>
      <path d="M288 372 A52 52 0 0 1 392 372 Z" fill="#33353a"/><path d="M768 372 A52 52 0 0 1 872 372 Z" fill="#33353a"/>${wh(340)}${wh(820)}</g>${turm.replace("<g ", `<g transform-origin="0 0" `).replace('transform="translate(1670 0) scale(-1 1)"', `transform="translate(${ox - 835 * kk} ${oy - 412 * kk}) scale(${kk}) translate(1670 0) scale(-1 1)"`)}`;
  return trk;
}
function adlLadder(px, py, a, L, U) {
  const e = L - 12, H = [1.5, 1.25, 1.05, .85], st = [0, 1 + e / 3, 2 + 2 * e / 3, 3 + e], ln0 = [9.5, 9, 9, 9];
  const truss = (s0, l, h) => { const n = Math.max(3, Math.round(l / (h * 1.05))), w = l / n; let d = `M${s0} ${-h / 2}`; for (let q = 0; q < n; q++) d += ` L${s0 + w * (q + .5)} ${h / 2} L${s0 + w * (q + 1)} ${-h / 2}`; return `<rect x="${s0}" y="${-h / 2}" width="${l}" height="${h}" fill="none" stroke="#2a2d33" stroke-width=".2"/><path d="${d}" fill="none" stroke="#5b5f66" stroke-width=".09"/>`; };
  return `<g transform="translate(${px} ${py}) rotate(${-a}) scale(${U})">${st.map((s0, q) => truss(s0, ln0[q], H[q])).join("")}</g><circle cx="${px}" cy="${py}" r="2.2" fill="#c9ccd1" stroke="#23262b" stroke-width="1"/>`;
}
/* Ausladungs Simulator L32A-XS nach Ausladungsdiagramm (Betriebsanleitung S. 260, Prinzipdarstellung) */
const SIM_LIM = [["500 kg", 16.7, 5], ["4", 18.2, 4], ["3", 19.3, 3], ["2", 20.9, 2], ["1", 22.7, 1]], SIM_USE = 24.7, SIM = { a: 45, L: 20, res: 1, n: 1, tr: false };
function simView() {
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  state.mod = null; state.sub = null; state.view = "sim"; backBtn.hidden = false;
  app.innerHTML = `<section class="hero"><h1>Ausladungs Simulator</h1><p>L32A-XS: Leiter bewegen, Zuladungsreserve wählen, Personen in den Korb setzen.</p></section>
    <div class="simbox"><svg id="simsvg" viewBox="0 0 333 380" role="img" aria-label="Seitenansicht Drehleiter"></svg></div>
    <div class="simro" id="simro" role="status"></div>
    <div class="simc"><label>Aufrichtewinkel <b id="sva"></b><input type="range" id="sia" min="-20" max="76" step="1"></label>
      <label>Auszug <b id="svl"></b><input type="range" id="sil" min="12" max="28.4" step="0.1"></label>
      <div class="simg"><span>Zuladungsreserve wählen</span><div id="simres" class="simchips"></div></div>
      <div class="simg"><span>Personen im Korb</span><div id="simn" class="simchips"></div></div>
      <div class="simg"><span>Zusatz · Schnellwahl</span><div class="simchips"><button type="button" class="chip" id="simtr">Trage +50 kg</button><button type="button" class="chip" data-p="h">Max. Höhe</button><button type="button" class="chip" data-p="r">Max. Ausl.</button><button type="button" class="chip" data-p="t">Ablage</button></div></div></div>
    <p class="foot">Der Korbarm (4,2 m, gestreckt) ist Teil des Auszugs. Prinzipdarstellung nach dem Ausladungsdiagramm der Betriebsanleitung (S. 260), aus dem Diagramm abgelesen und gerundet; volle Abstützbreite. Pro Person werden 100 kg gerechnet (500 kg / 5 Personen). Nur zur Ausbildung, nicht für den Einsatz. Massgebend ist immer die Anzeige am Fahrzeug.</p>`;
  const P0 = { x: -2.14, h: 3.73 }, CX = .6, CY = -1.0, X = x => 81 + 9 * x, Y = h => 300 - 9 * h, $ = id => document.getElementById(id);
  const PIC = (m) => `<svg class="pic ${m}" viewBox="0 0 12 22" aria-hidden="true"><circle cx="6" cy="3.4" r="2.7"/><path d="M2.4 7.4h7.2a1.4 1.4 0 0 1 1.4 1.4v6.2H9.2v6.6H6.9V16H5.1v5.6H2.8V15H1V8.8a1.4 1.4 0 0 1 1.4-1.4z"/></svg>`;
  const resList = [["4", 1], ["3", 2], ["2", 3], ["1", 4]];
  const limKg = [[100, 22.7], [200, 20.9], [300, 19.3], [400, 18.2], [500, 16.7]];
  const limOf = r => { let kg = r < 0 ? 500 : (5 - r) * 100; if (SIM.tr) kg = Math.min(500, kg + 50); for (let q = 0; q < 4; q++) if (kg <= limKg[q + 1][0]) { const a = limKg[q], b = limKg[q + 1]; return a[1] + (b[1] - a[1]) * (kg - a[0]) / (b[0] - a[0]); } return limKg[4][1]; };
  $("simres").innerHTML = resList.map(r => `<button type="button" class="chip rc" data-r="${r[1]}" aria-label="${r[0] === "500 kg" ? "500 kg" : r[0] + " Personen"}">${r[0] === "500 kg" ? "500 kg" : Array.from({ length: 5 }, (_, q) => PIC(q < +r[0] ? "fill" : "dim")).join("")}</button>`).join("");
  $("simn").innerHTML = [0, 1, 2, 3, 4, 5].map(n => `<button type="button" class="chip" data-n="${n}" aria-label="${n} Personen">${n ? PIC("out").repeat(n) : "0"}</button>`).join("");
  const calc = () => {
    const al = SIM.a * Math.PI / 180, c = Math.cos(al), sn = Math.sin(al); let L = SIM.L, clamp = false;
    let cx = P0.x + L * c + CX; const lm = limOf(SIM.res);
    if (cx > lm && c > .05) { L = Math.max(12, (lm - P0.x - CX) / c); cx = P0.x + L * c + CX; clamp = true; }
    const tx = P0.x + L * c, th = P0.h + L * sn, fx = tx + CX, fh = th + CY;
    return { al, L, tx, th, fx, fh, clamp, lm };
  };
  const allowed = r => r <= SIM_LIM[0][1] ? { p: 5, kg: 500, t: "500 kg" } : r <= SIM_LIM[1][1] ? { p: 4, kg: 400 } : r <= SIM_LIM[2][1] ? { p: 3, kg: 300 } : r <= SIM_LIM[3][1] ? { p: 2, kg: 200 } : r <= SIM_LIM[4][1] ? { p: 1, kg: 100 } : r <= SIM_USE ? { p: 0, kg: 100, nb: 1 } : { p: -1, kg: 0 };
  const draw = () => {
    const k = calc(), A = allowed(k.fx), extra = SIM.tr ? 50 : 0, resKg = (A.p < 0 || A.nb) ? 0 : A.kg - SIM.n * 100 - extra, res = Math.floor(resKg / 100), over = A.p < 0 || resKg < 0 || (A.nb && (SIM.n > 0 || SIM.tr)) || (SIM.tr && SIM.n > 2), reserveOk = !over;
    $("sia").value = SIM.a; $("sil").value = k.L; $("sva").textContent = Math.round(SIM.a) + "°"; $("svl").textContent = k.L.toFixed(1) + " m";
    document.querySelectorAll("#simres .chip").forEach(b => b.classList.toggle("on", +b.dataset.r === SIM.res));
    document.querySelectorAll("#simn .chip").forEach(b => b.classList.toggle("on", +b.dataset.n === SIM.n));
    $("simtr").classList.toggle("on", SIM.tr);
    const sel = limOf(SIM.res), lines = SIM_LIM.map((l, i) => { const ly = 9 + (i % 3) * 9; return `<line x1="${X(l[1])}" y1="${ly + 2}" x2="${X(l[1])}" y2="${Y(-7)}" stroke="currentColor" stroke-width=".8" stroke-dasharray="3 3" opacity=".45"/><text x="${X(l[1])}" y="${ly}" font-size="8" text-anchor="middle" fill="currentColor">${l[0] === "500 kg" ? "500kg" : l[0] + "P"}</text>`; }).join("") + `<line x1="${X(sel)}" y1="${Y(32)}" x2="${X(sel)}" y2="${Y(-7)}" stroke="#c8161d" stroke-width="1.8"/>`;
    const ticks = [0, 5, 10, 15, 20, 25].map(x => `<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(0) + 4}" stroke="currentColor"/><text x="${X(x)}" y="${Y(0) + 13}" font-size="8" text-anchor="middle" fill="currentColor" opacity=".7">${x}</text>`).join("") + [10, 20, 30].map(h => `<line x1="318" y1="${Y(h)}" x2="323" y2="${Y(h)}" stroke="currentColor"/><text x="316" y="${Y(h) + 3}" font-size="8" text-anchor="end" fill="currentColor" opacity=".7">${h}m</text>`).join("");
    const U = 9, kk = 9 / 81.6, trk = adlTruck(X(0), Y(0), kk);
    const px = X(P0.x), py = Y(P0.h), tx = X(k.tx), ty = Y(k.th), e = k.L - 12, H = [1.5, 1.25, 1.05, .85], st = [0, 1 + e / 3, 2 + 2 * e / 3, 3 + e], ln0 = [9.5, 9, 9, 9];
    const truss = (s0, l, h, i) => { const n = Math.max(3, Math.round(l / (h * 1.05))), w = l / n; let d = `M${s0} ${-h / 2}`; for (let q = 0; q < n; q++) d += ` L${s0 + w * (q + .5)} ${h / 2} L${s0 + w * (q + 1)} ${-h / 2}`; return `<rect x="${s0}" y="${-h / 2}" width="${l}" height="${h}" fill="none" stroke="#2a2d33" stroke-width=".2"/><path d="${d}" fill="none" stroke="#5b5f66" stroke-width=".09"/>`; };
    const ladder = `<g transform="translate(${px} ${py}) rotate(${-SIM.a}) scale(${U})"><g transform="scale(${(k.L - MS_KA) / k.L} 1)">${st.map((s0, i) => truss(s0, ln0[i], H[i], i)).join("")}</g>${truss(k.L - MS_KA, MS_KA, .46, 0)}<circle cx="${k.L - MS_KA}" cy="0" r=".2" fill="#fff" stroke="#23262b" stroke-width=".1"/><circle cx="${k.L}" cy="0" r=".2" fill="#fff" stroke="#23262b" stroke-width=".1"/></g><circle cx="${px}" cy="${py}" r="2.2" fill="#c9ccd1" stroke="#23262b" stroke-width="1"/>`;
    const cxp = X(k.fx), cyp = Y(k.fh), cw = U * 1.7, chh = U * 1.15, pc = ["#23262b", "#2b3a55", "#3b3f46", "#23262b", "#2b3a55"];
    const cage = `<g><polyline points="${tx},${ty} ${cxp - cw / 2 - 1},${Y(k.fh + 1.3)} ${cxp - cw / 2},${Y(k.fh + 1.1)}" fill="none" stroke="#23262b" stroke-width="1.6" stroke-linejoin="round"/>${SIM.tr ? `<g><rect x="${cxp - cw / 2 - 3}" y="${cyp - U * .5}" width="${cw + 14}" height="3" rx="1.5" fill="#fff" stroke="#23262b" stroke-width=".9"/><line x1="${cxp + cw / 2 + 11}" y1="${cyp - U * .5 - 2}" x2="${cxp + cw / 2 + 11}" y2="${cyp - U * .5 + 3}" stroke="#23262b" stroke-width=".9"/><path d="M${cxp - cw / 2 + 2} ${cyp - U * .5 - 1} h${cw + 6}" stroke="#c8161d" stroke-width="1.2" stroke-dasharray="2 2"/></g>` : ""}
      ${Array.from({ length: SIM.n }, (_, i) => { const hx = cxp - cw / 2 + 6 + i * (cw - 10) / 4; return `<rect x="${hx - 2}" y="${cyp - U * 1.55}" width="4" height="${U * 1.3}" rx="1.6" fill="${pc[i]}"/><circle cx="${hx}" cy="${cyp - U * 1.7}" r="2.2" fill="#f0c9a4"/><path d="M${hx - 2.5} ${cyp - U * 1.75} a2.5 2.5 0 0 1 5 0 z" fill="${reserveOk ? "#c8161d" : "#ffd54a"}"/>`; }).join("")}
      <rect x="${cxp - cw / 2}" y="${cyp - chh}" width="${cw}" height="${chh}" rx="1.5" fill="${reserveOk ? "#fff" : "#fdd"}" fill-opacity=".5" stroke="${reserveOk ? "#23262b" : "#c8161d"}" stroke-width="1.2"/><rect x="${cxp - cw / 2}" y="${cyp - U * .55}" width="${cw}" height="${U * .55}" rx="1.5" fill="#fff" stroke="#23262b" stroke-width="1"/><rect x="${cxp - cw / 2}" y="${cyp - chh}" width="5" height="${chh}" fill="#c8161d"/><path d="M${cxp - cw / 2} ${cyp - chh + 3} l5 -3 M${cxp - cw / 2} ${cyp - chh + 8} l5 -3 M${cxp - cw / 2} ${cyp - chh + 13} l5 -3" stroke="#fff" stroke-width="1.6"/><line x1="${cxp - cw / 2}" y1="${cyp - U * .9}" x2="${cxp + cw / 2}" y2="${cyp - U * .9}" stroke="#6b6f76" stroke-width=".6"/></g>`;
    $("simsvg").innerHTML = `<rect x="${X(-9)}" y="${Y(33)}" width="${X(sel) - X(-9)}" height="${Y(-7) - Y(33)}" fill="#2f7d4f" opacity=".09"/>
      <line x1="${X(0)}" y1="${Y(-7)}" x2="${X(0)}" y2="${Y(33)}" stroke="currentColor" stroke-dasharray="6 3 1 3" opacity=".5"/>${lines}
      <line x1="${X(-9)}" y1="${Y(0)}" x2="${X(28)}" y2="${Y(0)}" stroke="currentColor" stroke-width="2"/><rect x="${X(-9)}" y="${Y(0)}" width="${X(28) - X(-9)}" height="${Y(-7) - Y(0)}" fill="currentColor" opacity=".05"/>${ticks}${trk}
      ${ladder}${cage}
      <line x1="${X(k.fx)}" y1="${Y(k.fh)}" x2="${X(k.fx)}" y2="${Y(-5.2)}" stroke="${reserveOk ? "#2f7d4f" : "#c8161d"}" stroke-width=".8" stroke-dasharray="3 2"/>
      <line x1="${X(0)}" y1="${Y(-4.2)}" x2="${X(k.fx)}" y2="${Y(-4.2)}" stroke="${reserveOk ? "#2f7d4f" : "#c8161d"}" stroke-width="1.5"/>
      <path d="M${X(0)} ${Y(-4.2)} l5 -3 v6 z M${X(k.fx)} ${Y(-4.2)} l-5 -3 v6 z" fill="${reserveOk ? "#2f7d4f" : "#c8161d"}"/>
      <text x="${(X(0) + X(k.fx)) / 2}" y="${Y(-4.2) - 4}" font-size="9" font-weight="700" text-anchor="middle" fill="${reserveOk ? "#2f7d4f" : "#c8161d"}">Ausladung ${k.fx.toFixed(1)} m</text>`;
    const msg = A.p < 0 ? "Ausserhalb der Benutzungsgrenze." : A.nb ? "Nur noch eine Person ohne Korb (Benutzungsgrenze)." : over ? (SIM.tr && SIM.n > 2 ? "Mit Krankentragenhalterung max. 2 Personen im Korb." : A.nb ? "Korb mit Trage/Personen hier nicht zulässig." : "ÜBERLAST: " + (SIM.n * 100 + extra) + " kg im Korb, hier max. " + A.kg + " kg.") : resKg < 100 ? "Fast keine Reserve mehr: Korb voll belastet." : "Alles im grünen Bereich.";
    $("simro").innerHTML = `<div class="simrow"><span>Ausladung</span><b>${k.fx.toFixed(1)} m</b></div><div class="simrow"><span>Rettungshöhe</span><b>${(k.fh + 1.7).toFixed(1)} m</b></div><div class="simrow"><span>Max. Zuladung hier</span><b>${A.p < 0 ? "–" : A.nb ? "100 kg, ohne Korb" : (A.t === "500 kg" ? "500 kg" : A.p + " Pers. · " + A.kg + " kg")}</b></div><div class="simbel" aria-label="Belastungsanzeige">${[0, 1, 2, 3, 4].map(i => PIC(i < SIM.n ? "out" : (A.p > 0 && i < SIM.n + Math.max(0, res) && i < 5) ? "fill" : "dim")).join("")}<div class="simkg"><b>${A.p < 0 || A.nb ? 0 : Math.max(0, resKg)}</b> kg<small>ZULADUNGSRESERVE</small></div></div><div class="simmsg ${over ? "bad" : "ok"}">${k.clamp ? "Ausladungsgrenze der gewählten Zuladungsreserve erreicht: Auszug begrenzt. " : ""}${msg}</div>`;
    SIM.L = k.L;
  };
  $("sia").oninput = e => { SIM.a = +e.target.value; draw(); };
  $("sil").oninput = e => { SIM.L = +e.target.value; draw(); };
  app.querySelectorAll("#simres .chip").forEach(b => b.onclick = () => { SIM.res = +b.dataset.r; draw(); });
  app.querySelectorAll("#simn .chip").forEach(b => b.onclick = () => { SIM.n = +b.dataset.n; draw(); });
  $("simtr").onclick = () => { SIM.tr = !SIM.tr; draw(); };
  app.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { const p = b.dataset.p; if (p === "h") { SIM.a = 76; SIM.L = 28.4; } else if (p === "r") { SIM.a = 5; SIM.L = 28.4; } else { SIM.a = 0; SIM.L = 14; } draw(); });
  draw(); window.scrollTo(0, 0);
}
/* Korbarm als Gitterteil (wie ein Leiterteil), von der Leiterspitze (x1,y1) zum Armende (x2,y2) */
function adlArm(x1, y1, x2, y2, U) {
  const L = Math.hypot(x2 - x1, y2 - y1) / U, ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, h = .46, n = Math.max(3, Math.round(L / (h * 1.05))), w = L / n;
  let d = `M0 ${-h / 2}`; for (let q = 0; q < n; q++) d += ` L${w * (q + .5)} ${h / 2} L${w * (q + 1)} ${-h / 2}`;
  return `<g transform="translate(${x1} ${y1}) rotate(${ang}) scale(${U})"><rect x="0" y="${-h / 2}" width="${L}" height="${h}" fill="none" stroke="#23262b" stroke-width="${2.4 / U}"/><path d="${d}" fill="none" stroke="#23262b" stroke-width="${1.2 / U}"/></g>`;
}
/* Drehleiter Masse L32A-XS: Abstützbreite, minimaler Wandabstand (Gelenkarm) */
const MS = { w: 4.8, H: 15, ko: true, ov: 4.4 }, MS_P = { x: -2.14, h: 3.73 }, MS_KA = 4.2;
function masseMin(H, free) {
  let best = null; const R = Math.PI / 180;
  for (let a = -20; a <= 76; a += .5) for (let L = 12; L <= 28.4; L += .2) for (let b = 0; b <= (free ? 75 : 0); b += 2.5) {
    const d = a - b; if (d < -40) continue;
    const tx = MS_P.x + L * Math.cos(a * R) + MS_KA * Math.cos(d * R), th = MS_P.h + L * Math.sin(a * R) + MS_KA * Math.sin(d * R), fl = th - 1;
    if (Math.abs(fl - H) > .07 || fl < .3) continue;
    const front = tx + .6 + .85; if (!best || front < best.x) best = { x: front, a, L, b, tx, th };
  }
  return best;
}
function masseView() {
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  state.mod = null; state.sub = null; state.view = "masse"; backBtn.hidden = false;
  const $ = id => document.getElementById(id), f1 = n => n.toFixed(1).replace(".", ",");
  app.innerHTML = `<section class="hero"><h1>Drehleiter Masse</h1><p>L32A-XS der Feuerwehr Zuchwil: Länge, Gewicht, Abstützung und Wandabstand.</p></section>
    <div class="adlf">
    <section class="adlc"><h3 class="zh">Länge und Gewicht</h3><div class="simbox"><svg viewBox="0 0 1100 480" role="img" aria-label="Seitenansicht Drehleiter Zuchwil mit Länge"><image href="adl-seite.jpg" x="0" y="0" width="1284" height="430"/><g stroke="#23262b" stroke-width="2"><line x1="18" y1="150" x2="18" y2="455" stroke-dasharray="6 4" opacity=".5"/><line x1="1062" y1="330" x2="1062" y2="455" stroke-dasharray="6 4" opacity=".5"/><line x1="18" y1="448" x2="1062" y2="448" stroke-width="3"/></g><path d="M18 448 l16 -8 v16z M1062 448 l-16 -8 v16z" fill="#23262b"/><text x="540" y="436" font-size="34" font-weight="700" text-anchor="middle" fill="#23262b">ca. 10,5 m inkl. Korb</text></svg></div>
      <div class="simro"><div class="simrow"><span>Länge inkl. Korb (Fahrstellung)</span><b>ca. 10,5 m</b></div><div class="simrow"><span>Breite · Höhe</span><b>2,5 m · 3,4 m</b></div><div class="simrow"><span>Gewicht (laut Typenschild)</span><b><input id="msKg" type="number" inputmode="numeric" placeholder="eintragen" style="width:110px;text-align:right;font:inherit;padding:2px 6px;border:1px solid var(--line);border-radius:6px;background:var(--surface);color:var(--ink)"> kg</b></div></div></section>
    <section class="adlc"><h3 class="zh">Abstützbreite</h3><div class="simbox"><svg id="msA" viewBox="0 0 433 330" role="img" aria-label="Heckansicht der Zuchwil-Drehleiter mit Abstützung"></svg></div>
      <div class="simc"><label>Abstützbreite <b id="msAv"></b><input type="range" id="msAi" min="2.5" max="4.8" step="0.1"></label><div class="simchips"><button type="button" class="chip" data-w="2.5">Minimal 2,5 m</button><button type="button" class="chip" data-w="4.8">Maximal 4,8 m</button></div></div>
      <div class="simro"><div class="simrow"><span>Abstützbreite (Aussenkante Stützteller)</span><b id="msAr"></b></div><div class="simrow"><span>Fahrzeugbreite</span><b>2,5 m</b></div><div class="simrow"><span>Platzbedarf je Seite über das Fahrzeug hinaus</span><b id="msAs"></b></div><div id="msAm" class="simmsg ok"></div><div class="simmsg warn">Maximale Neigung: Standfläche 14°. Fahrzeug nach dem Abstützen max. 9° (7° bei über 18 t Gesamtmasse), ab 7° Schräglage mit der Einzelsteuerung der Stützen möglichst gering halten.</div></div></section>
    <section class="adlc"><h3 class="zh">Minimaler Abstand zur Wand</h3><div class="simbox"><svg id="msC" viewBox="0 0 340 298" role="img" aria-label="Mindestabstand zur Wand"></svg></div>
      <div class="simc"><label>Einsatzhöhe (Korbboden) <b id="msCv"></b><input type="range" id="msCi" min="3" max="29" step="0.5"></label>
      <div class="simg"><span>Gelenkarm (Korbarm)</span><div class="simchips"><button type="button" class="chip" data-ko="1">Abgeneigt (Gelenk genutzt)</button><button type="button" class="chip" data-ko="0">Gestreckt</button></div></div></div>
      <div class="simro" id="msCr"></div></section></div>
    <p class="foot">Bild Abstützbreite: Heckansicht der Zuchwil-Drehleiter aus der Fahrzeugvorlage, Stützen verstellbar nachgezeichnet. Länge/Breite/Höhe aus Betriebsanleitung S. 259 (Länge ca.); das Gewicht steht in der Anleitung nicht, nur «siehe Fahrgestelltypenschild», darum selbst eintragen. Quellen: Betriebsanleitung L32A-XS, Technische Daten (S. 259): Abstützbreite 2 500 bis 4 800 mm, Fahrzeug ca. 10 500 × 2 500 × 3 400 mm; Korbarm-Grenzen (S. 109): max. 75° zum Leitersatz, max. 40° unter der Horizontalen; Leiterlänge ab 12 m (Ausladungsdiagramm S. 260). Nicht als Zahl in der Anleitung: Lage des Leiterdrehpunkts und Länge des Korbarms (ca. 1,5 m, geschätzt). Die Anleitung verlangt mindestens 1 m Abstand zu Gebäuden. Nur zur Ausbildung, massgebend ist die Anzeige am Fahrzeug.</p>`;
  try { $("msKg").value = localStorage.getItem("fwz-adlkg") || ""; } catch (e) { }
  $("msKg").oninput = e => { try { localStorage.setItem("fwz-adlkg", e.target.value); } catch (e2) { } };
  const tick = (x1, x2, y, t, col) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${col || "#23262b"}" stroke-width="1.3"/><path d="M${x1} ${y} l6 -3 v6z M${x2} ${y} l-6 -3 v6z" fill="${col || "#23262b"}"/><text x="${(x1 + x2) / 2}" y="${y - 5}" font-size="11" font-weight="700" text-anchor="middle" fill="${col || "#23262b"}">${t}</text>`;
  const drawA = () => {
    const w = MS.w, C = 216.5, E = w * 40, gy = 277;
    $("msAi").value = w; $("msAv").textContent = f1(w) + " m"; $("msAr").textContent = f1(w) + " m"; $("msAs").textContent = f1((w - 2.5) / 2) + " m";
    document.querySelectorAll("[data-w]").forEach(b => b.classList.toggle("on", Math.abs(+b.dataset.w - w) < .05));
    $("msAm").textContent = w >= 4.75 ? "Volle Abstützbreite: voller Arbeitsbereich." : w <= 2.55 ? "Minimale Breite: Stützen innerhalb der Fahrzeugkontur, Arbeitsbereich stark eingeschränkt." : "Verringerte Breite: Arbeitsbereich eingeschränkt (Anzeige am Fahrzeug beachten).";
    const leg = s => { const xo = C + s * E, xi = xo - s * 24, xc = xo - s * 12; return `<rect x="${Math.min(xo, xi)}" y="205" width="24" height="57" fill="#c0141b" stroke="#222" stroke-width="1.6"/><rect x="${Math.min(xo, xi) + 4}" y="214" width="16" height="38" fill="#fff" stroke="#c0141b" stroke-width="1"/><rect x="${xc - 5}" y="262" width="10" height="9" fill="#b9bdc4" stroke="#222" stroke-width="1.4"/><rect x="${xc - 20}" y="270" width="40" height="7" fill="#111"/>`; };
    const bar = s => `<rect x="${Math.min(C + s * (E - 24), C + s * 100)}" y="238" width="${Math.abs((E - 24) - 100)}" height="14" fill="#9aa0a8" stroke="#222" stroke-width="1.4"/>`;
    $("msA").innerHTML = `<rect width="433" height="330" fill="#fff"/><line x1="10" y1="${gy}" x2="423" y2="${gy}" stroke="#222" stroke-width="2"/>${E - 24 > 100 ? bar(-1) + bar(1) : ""}${leg(-1)}${leg(1)}<image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZwAAAIoCAMAAABqLK31AAABWGlDQ1BJQ0MgUHJvZmlsZQAAeJx9kLFLw1AQxr9WpaB1EB0cHDKJQ5SSCro4tBVEcQhVweqUvqapkMZHkiIFN/+Bgv+BCs5uFoc6OjgIopPo5uSk4KLleS+JpCJ6j+N+fO+74zggOW5wbvcDqDu+W1zKK5ulLSX1jAS9IAzm8Zyur0r+rj/j/T703k7LWb///43Biukxqp+UGcZdH0ioxPqezyXvE4+5tBRxS7IV8onkcsjngWe9WCC+JlZYzagQvxCr5R7d6uG63WDRDnL7tOlsrMk5lBNYxA48cNgw0IQCHdk//LOBv4BdcjfhUp+FGnzqyZEiJ5jEy3DAMAOVWEOGUpN3ju53F91PjbWDJ2ChI4S4iLWVDnA2Rydrx9rUPDAyBFy1ueEagdRHmaxWgddTYLgEjN5Qz7ZXzWrh9uk8MPAoxNskkDoEui0hPo6E6B5T8wNw6XwBA6diE8HYWhMAAAEgUExURWAjH96mpZlXJO3dYaaYmGBgYahlZOvg36g8QaaRMc6oV3FIMX2BgT1BRJAnHdlsaXx9gHuAfKGRYyQhHM48QYt9guPHtb29wNG9wcMuMNN8glQ9Qr7CwztAPsShOr3BvT1fg7g2Mv///8k2MjQ2Ofz8/KSlpScnKSEeIIeIiJWWlpIoJhgYGqgqKHZ3d3EXFWdoaOzo6NfX2FVWWIwcGJQ0MnImJg0FBsjIyCcbHJEiHLe3t0lISVIWFR0eIC4GBop3dzs9QMZGRbBHRm82Nh4gIspBOlELCatCNaeYmFQnJ/LY1p6ionMiG3NJSZJHR2xXV/HIyOA4M69VU9SVlIxXVcdXVs+Jio1paeu3tZ2gnstoaM93daIjHa12dc6oqJBAZfMAAABgdFJOU/////////////////////////////////////////////8A/////////////////////////////////////////////////////////////////////////////////xjdbwsAAL56SURBVHja7f2JY9Jo1z8OgzddRmvdne2Z5/syIGkSCAkQpGy2hbZ0oYtVW6vW//+/eK9zzrVmA2p15v49XjO2QCEk1ydn33J//1z/2pX7uQU/wfm5foLzE5yf6yc4P9dPcP4/AU7Q6PV6lUpPX53Gzx38R8FpwOo0Gr2KzZZnG6vSaXQ67I+N4OdW/gPgdLwmLN/znF4nshhenufjn+3Oz7380eAEju8xTuY4FUYfAa1XcgUNAMhx2Bs8r/KTxf1YcBoV3+shChokkRU0GuxHz/aczk/e9gPB6diMHgAAJnNSweF/C3o/WduPBCewvQ5RTJABTke+x7fn0S0awcrKSmMFf9JSj/AxPvvR+xA06ItXtLPgp7VCZ7iyEjTwpX8FOEHFczjn6vQ6Qdrq9QTLc7xKJmMLbNshJY/9chz89VjX/R7Ty/iOyo9d/KzgJB6bCqk4Z/HACf4N4HSadoNLlQooBCnLcTpcIgV2M/O2avTL/XJkWfBje1t7Ih49hBe31Tu3tSfwge1Flv6V8sPqKftCS3wLPdrmf7G0z9DLzca/Apx+hWQKMz0dzfjsGHZoD5S1HuHj9GeAYxm4WMPdatUST3aH7AnbGfYPXhavV+Vb4E2WvpGLLsvAH479Wn79bnU4HOIbhlX2nyXfUrV2zbP+d4DTK4Oi1gC3QEV5BuiR/oKDz4DIKuVscGB31WIQsDXkzxg01V18hC9zdNiT14iZeBP+HN4CHkDf0k4AsXld5Q/ll9JNYpyV9v3wSr/zbwCnUq6AuAEYOj3N8OzhT+BzDfy/B896oBY45Uo2OEPtKqtD7aoZLPIJvTzEPcOnr+Ve4ZuGuHeLgrOrNnmXH0vAzr8ICbYszmHXMs9HPuv3/gXgNJy+EwQAhmHkNICDgYagmzoMwUonaDjNZi+brW3rt7Kl8SvJcCzOtSzJxdgNTuyHv4nt4u7C2FgEqGRXuwiN/G6rbPJL7dyME2Wr+W+gnIrngXipVEwDlLG5DrzcMQ1RYG2dnt3MIp0OgmPpl7zNRbMlNwZe36bfyPq3EZzXQxDVAhxLk0PzMjXzI5xs6KEldAD2e1vHRugKAh08nWYl+OfBsf1eg0l7pxdEbE5apuETMNFjdxq9ppOhSfceWuo+1O7Hbf0ZgrPNxYCQOyi5+S0e5zRzLcJCsq3Xr8VX7r4WaoGlwBlaJolb6oz7P85PlQVO8KrD1PreqzlWADB2XgUZ4DCLqK8xDJNZWNrdK25owcyY/Cd4dnUR9S2rCsdGmpFqgcnLDA1Noxy4N5qdH2aHZoEDPMyZFxzG6RpZ4ASNAFRpJX81wfFQsLX+dlltoFCU2OZVSe7cVoeOyR8Ex0LFAtVBSYl4g/Q5OA/JtmFPdqXeULb6/xOsNP4N4KA+MA84r0CpDjLACVaYcvHQuB9NcHRZBHtVlejQ7lWF2iuswltYoNtkyBIhSnBAbaxyTdDQBx5uCzLS1YN+JQh+UPgqm601wOCcCxymEQA4vpPG09iqlDlP344oRNtlqc6SAVIlC2OIGi1BJPRc9ZnF1rZBOezIoLHR0Qkli8SapdFQVFt7+JBkDlOAVv5hcLwA4zWdV3MKnUo6OBByaDQ6mofgYXmXX/K2UJyHEpzXVS7zq6+HwgzlOkFk4xZU2aRlW61WyflgcRra5eBY3MYywdEwRpnDdqbxT4LT8BCcSi94NR9fc3rsjvLsRgpPazReme6biJ1DUp6IBMEZ8mfD15KtIYcR/riF6YZre9tC/SOzlP8gu3NI5u7QKpt2juG+6TCZA4zgnwMHXdKMcObTByQ4jldJpJsAaadvSW9jWWch5FIbkooLO0cSAO/vsmWCc3s1AGWOJRWCKlenkV1ylLhgG/Iz0lmc5MdNxkrogv4xcBq+3UBwOvOD02G6N6O3ZJ4Gckl5CB7GwCFjsEpbRNKF3cZDDRzYuCFJLcv0YC5CQOSnYQcbIjjg6GSHqpKgY+Ds6mYNnaJORg8RHLieH8DZUsFpVtAhPTc4HXSvBUyNSKCbBnoZGuUIHmWhoaJOAJs01EUzQ2PIjXnQpKtDTjnb36hJl5FVcrvUIvJEcMrsO4Z4Xzzc5o4kDSg66WGfAr9IPP8kOOAzmx+cCvo+o+AInsaO5mh3I20yd3gN6XZmdDXk+jMan69p38jKeV2tilt42xoubnju6vAA6ZQFOGRAWai18W/UuC28oN9S1W2M3Ac/grNlgwOetQXAYe91mkGMpwls+pJehIgm2xz3ni1rWzy0lE5Fv5G1WeKTu69vsXYVyVnE0qrk4xbgWFX+3UNxPsBa4bQUJ4WXmsRNgFN/Z86WzdYWAqfXi4MDmVTE0wK7T7a25vy1SP5q4LyW4HAz1OKUQxEwi1yhtwVHriGhzaUcE21DcFuL7xaHJw2lakZtrXK/TxHi769RpysEi4LTQ5PIZGuavAG64RxLcjUm63eRsSRQDmpPuwTOaxEVQ7mEn1t8KWm1jeC8fi3AEVYPvo1hISinipRjKT2cKKdfJnQCSFb5rpwtFRzIV8sCJ5JfyCgnDg4A0+hwnsb51JAHzYitcQYWB0cYIPgIXaBofXA/9e0ph/gqqmoUwxPgoJZA4FQlOGUEh/up6eYAcKyyw2mnMZt2vsEkmgGOk2KDNhoY6qHgAa4KgVPxOzLNCQKlFAxCnsZR4TGUMu06PB2mUM5rBc5uWYCj88GFlohtCucaurm5QYrgCJkjoSdwUGnhJw4QlZtldiY2XVfQ6GjXG18Y++pBuuzdg1NxUggHbxlkuiJLl1EOaHY9r9cIALJAS94NnCbbhaa9rYNDOQQWRVQSKAclNblUiBl+KziaBl+V+QMa5fDDlg1wQGUcSlpHr3TBZ0/7IjNJW5jTb+aNdfg+Ne4SnKBnd0CTdlKcNzI6GjRkqBqjoz27EgQ9PEv1ZuBpVr/S6UtweMye7JZdupERnCqnJ/LlG+CowDXiOlxkVVVMepup4txXRykcQ+BxBA7BhCcj5KPIO6miDg/xnEbPh+M4neBVPAzZSN6n4C7B6TgOOAhSwemobw1eCdIBcDpOhbG4TqMjDaSg45URG4jnaODwOxnEMwkTuDdJs+Z0xbQFoa0NhbT49ogOEEAVFEXS1iCVB1Uy9guZJz87ds9QjkmVB/fQPTAEcF792oQT8SvG5gSVHmNj0bhxIBIv7hCcnt0LMsEBTkqpUY1KH1fTASu0UbErDbRtgBkDx3V80AUYNuC+4fFfmUiDT4fEs+DxcEgRA1ISlCot0ses28ULovDsMnCsoaGtkTxhqgJpZVUZFxxyfISDloHzqtdEg8fD8iQlYLHuwpA5lQrPIuvcJTgemli9VHA6PQdSDQGQSh8reDwHk9c6HpdTiAwkHSJPgwM1+noCgXA6YnYH8nUS1bvDKhfU6ALlRmjVqkZzAm8PjjUkV+drSwTbyJuHWVcSnLL0XgBpG+AwvQfOl4HTwYRKgIa4XNBTUoe9zvbIZv/uFpyKhzd/L13mNCoNbncGdFoNyixseI4gZfLoME0NeBog2tei8QTQcJdi1NWqAAc1XB5w4+AQCQHTKesxoEWZGfz/kMAResVuWcSNIIIDLtbhLgdHZJQMuRaxSxYWUwiQX/ea5bLXgdQx5GTAKIJX8WIZSJcFne1OFQIAJ4utoaRBLQRLEHDriXIaPqecju1A/iG7qbwmvhRUtjXK4f5e2nFK5aRQC7l00D5Fx9YuB8e6O7ZG4AwRktfyJkBwdofk8Rzq6T6og4h7im60oOd7FWBmkA0LF9kjCRRQEabaJyShu1UIBDiVZHACTPVkPzCIjfpyEAOngqcJqgJKyWAFsm9UBph24SSBhhwcS6gBgq1RyKC6a90JONuSHDjlSFUav2lY1nzn29o5ivNu0r0Y8MILLJiVF4l3qmaeU1os/LtzcHpp4Lzq8ARqp6JnfULQQLK1IJLZxsisWRZ5exYpTdLsQOqhBMIqM9WRn+gypyo9P7cDZzsWNeBBgjK5LYb4ANDh2lpZzwgu8zPGWJ0fJNb5BQ3tlwKngrUsTHn6DuCkBalFaqHKMAhAAqWDA4KJwFH3IeUFbHNw2N2L4AyrwvE5JOZSHVoitd36VsrRMxrV0eHGIOuG8tlkmon4SbAQ5fhBYhWmBCcwrD9MLQe7758Ap2eAA/q3Z5NZrNtj8PyVAMcSqbgWxmi2LeIlGDhB+UKpHKDpDnnSRXWXmxrfAg5YvUOVD49GMK91ALNmyLPjVAhwqMDRwoI+aswxeIIOuQI6BjiNnihsumttDRhVmswRvqOelpDLwfEcXscTKOcGhambetgKnMtcMXtdlUyGu/Ip03yo0v5FLPv24AgvmkqII4ykb43QqfJkXIsS6zg42iksAS4oTQ3nDd6bUHDReKXJHKYocCPo7sAJKnaQFQcNBGidl4HKjeLg+DZnsw3eQEK4ExAczcy3eKL/kNuaFgUDyNOI0qfKGU9Zkdzt0zzJXyYid1UeDh8qehni38siYM4w2i5zU0wjv6VOgwIGeGk9vE07soYJVbeG5t1q3Ln7hpLQ2M8Uv2fwK//2nu30+HsanHKgArtHqoy8v14Z4Oj3ssXsHBkcJsdnVaQwc/tDVb+VLcu6Nd1wT6eKsVGWDekd0vFJHJa+NRmc5q+/dqTQD4h7A900uG4aRBzEdw4OJKUzkkzNi5KUU2Fk0lHp0pD0yUxipswJ2jfONAIOiWQNHPSrSafNkKctDaNVM7cCR6TFq9IFUYoFbtHXEpxd/i1VcZMMq5Gyw06jYfhKGq94vVKQpCbcOTiB7QBXywJnhYNjVxQ4JKI6to1mEBnGCeBs66SzCyoa3warrBI8hHtHac/b5W/halWBjaz3qA53SZUeglbIHuwqi4erJnRW1WqkJjRarwRqQAo4r+6erQVeBSk2HRyhilU8p9AR3LWCLC6wPQZOADVWQZACzrbMgsF9gCxPdv8SEVkib407h3VquXWutMXDzehKI4vFKPak5NyhJcxRCCNww6pa3VVJa5hUGNVDgaelgNNoCEfjHYMDVey9lFVwaPlN77HT+/VXqNutOOiXfoXgvKKIjlmxqMDZptoC8tnwTRoiOJaSNOQLNnPKJTCLg7NNEgRviG2kVxOc11VJqyCOQE2B3MfqrvxSPONmTwMH2RZDBq44ma2hx+CWXbWywbFhw/FfZDm2B8v3PejnQG+yBTg2JkQGhqkckTnbqiqHECmTU572i4Oza1nWHYEDIQIi1d1dztdEyTal4tJXg/gRiRxcfbQMpwQWT2kXFfDuM9AqI2g0Eh1dYA7eLkknG5we7K5wG2l7Hega/is8M/ZKj+cV2vrJJYFjaenrZUEkypmCkVB6bRgF57YlIAQOVxC3OYNDcIZV+p6q7mXbFQ0QtKoGS3oI9CwXnhYGXTSSCjICiLtUKncPTg9lTsB4l5OZIBX4FBRMAudVOjgymX9Ixf9DkWPOcwgsmZgrpZSlWMzC4BDB6IWmCM7ukN8EQ24AocUDoeld7swDx5t2S+ngEK10KJzWQdVAmt3Q3Sdo9KAjne87d87WKpAPEDS8ft/rNBoprW8gyQPQC6AJC+UVzgSHK1BDCAVTKw9yPm5r4OxKM9GS7VeUb237VuoakaZoQrDLU+e5pOGJhkPy86CSAmxtKPKxxIqB02BU01DuaeGrxuZGHbsJvR2bfuVuwWFKiId7TnpBJRmdBgYz8OQ6ttMhcIJMcB4KGU2ZyA8ptYJpSuj4lGxNbNquFRE5D7dvqUzz0I2qWSBTiseNuEtiyGvpeQkq2Vy6ezsKTtDz0stkOh6mitm+F9w15VDXKGwNxb4kSP52yfICZrpW5gBHKlC7uBcPRQLhkBJxlLY2JG+xUGW/tV7XqqqyH4hNWyIbWBRPDZFiyjycMFQCsZpGOSByGk56JUZQsR0s3bS9zl2B07E5ODJa0/ObyWfQ8ZU8sm0Ep4LZBPrqkIuHx3NE9IoXRG3jQ0BB7sVrqmEjO6eqtwkoG1xuwUAOyTdpQu1aqlSKV7YpI1TEXikAp6uNUcppZKQsg7sEfPsdx+8FdwMOEx4dNH1tCQ4z+5PPoOEpx7XnIQoVv9n0zMZSpDCIeI5s+vOaJ3hUKSbNvSXCQ8AVJtUiB2X57vCbCkLVL4pNWDLzhtNTlcqnKXNY88nJKiodHHLdJFEOvysrno3Ngew7A6cDeVFgWilwRP5CAuEq0BwbwelAN1ZUsUVGZIc6hcpgG12pTAwgbyeTNA8pneC1qGyj3XutZTCR23+I/vxdXMPh7uwlmnZwhyqKfAQHPQEWFzP8hHhcXLhvhJJglWPgkK+gYcdlDiUaWX1ApRGAWnBXbK3jdahswAAnzcumwOHaGnb7NE/Vh5oFIxIqHMOWjLBhOi4pbq+J2Yga913Z/4uq3xke9ArhkoHOEKFjH9mVKZ5VKu3ABmtV0dvNGvIv4ASLoaRd4b55Ld2vBjiBCChiIKcjvdLwu0c5vcNehZnpDtMHesGdgdO4FTg9hzp7dZoR/aXjmZRT1nz3WJAxFM1UMHNsSJEcqm0up1SqlW/dZGVXCwxpbcI4OLzQkRQS4LlDKhTdjYIDPhmKNVL6BI/twG8mYwgcqwdsxPPs3p3ZORycigYOU5TTXKCBCQ7kQ/ablXRwRIMbBY54Jm1DyFCyYr20ZEBSc4NaM0t3jWIt/YlhO0nK5CntQCuv8Rx2RbY0rwAX4ATMhsCwl16hhP4cphV1bA5Oh2KmnbvzEAhwSCFA314wg3LQjYGW8hzgKOVZMAvEBKIHu5LnW1I/I+Xs4bbMf7fK2xpSXBgkEpeCs1zuR5pzbMvSd3FTDGUKLjnHSSFAjb6K6Sea+wbD0tCjXgDTYPdmB3M/Gk5HUk6DXL+3LLFKAqfnE1vrgaQLUD2ewdYaxM54O8kscLj/RrSbQUQEU7F4x7OhCY6iEl5iM7RiHtH0pp7ShydT56uW0UBMJRhYvP2qoGqKhA7JH1rVsm9I3lQY3Yhs1x6jI1Cb4QWI8FQkW+vdMThIOVDSAb61BlPRM7p+Ezg9r7IYOFXqvQqKUB+VZQnONtTrVCNpFbIHZ5npAmWZoDG/Fi16dQ4tXl9g1GNLcAhxzuKQtaLcq4pOsZKtMV7VQZ5GMQPwPFccyDsSiS9lKiepkIV61+BAojQcuOP1KxldvwkcB12jqeA0TLbGbc1dWQKDmYT4eCjqdTCZXSOcIVegqxRHVvm51nzokNzAL9lV/V1lavCQ3xxUAiJ6VQnDi7dFEkmFWOfe4UV/GChoOA6jFk/ZgnwGBBSFIOO5a3AgfIbf63VmUw5aRgocP6Kt+X4UnF1dleYsjiuskCZLHJ83mhSdnrjhKsCZ36PDwSlbMoV0aDgauHdAgD2UbV5Fz0rZhZJnfCLdNKS4oZq2nu0wlibSkkQuLHL8u5Q5BI5j8/z5YCY4lMsuwGGqdCcKTiUBnKGWKz0kDzQ3F3lzBv325ryIfAa7Ms/AZH4xlaCsccVdvZObqcEhQb2mMqmybFLJK4L4hyyhra0gNjLFv4EDUgCEih1UbK69NmSiMmzd9wCn80qC0+tleQgoAxJEZDI4CWxNy68VzTPIpcX4u0iI0jp1DGXihyy3XWChp4jHm61qtap3JuZZ0xZKOjS2dil9esjjOZbqKoKJ7L0g+FUrZG5URGayYwc9QU+NwvcEh+kDHoHTa6jkuATPJ5zlCnp3AjR0pIjJBmdXJaaTJ4XXs2ETryF5jHejjVZlMZpsmjpvb9zX5PXZFaqAdPINVVuvqqWBI7u8qHYVJHOaDSlvON8S4RMGjsrDrUhwencJTgPTPXsMHCIKSjDF0mmK8KHfjEeo0WXBVWkQPQiO4ztzUQ5WwG5zXxZvCMEbbBFvkegIYx4r1qvUB3xRcIa7liA5vX5LdtuVogVypV4rcGSjF8p6aEYqYxAcdCJqsZKACSDK/ATF+g7B4emevR4Hh6kcjCB6BfBSd351oDt+D9sO0L9KpdDhRXc9D8EJek17JjjcXSOyb4aUBjUcmja/hfxld9cQHbu7wwhjmumxqUplTxIjOe92jewRSyQGk+UpSg8pYXebOiI1o4UxkN+KfRlsBU7D7zcfe77XuWttrYKWLkSIeE4wZj3hgBLMu6EBKzivpIBT9pj1ReB07Ap6mxq+PcN9MxRJfpb0qoiKAkvlT21HQ8RxA/Pbwm+WUNq2FSmRYljm+cFcX3hNRigoMX07In4DUgggWSnQvNLgkuh3iKfcHThQ5W6Aw6wr2/NszINij3y4JezHvud5jx0HHvsOgcPUfWymG8wERzNTtqXTIOIt24523777pftyyoaGB6e1y8Ep86gPBVP7jxtJmYOQVKnA6SCTfF1uUEnIXYJDVXWCrTEVkeHi+z7OPFxqskdL8NRvLkFmyRL7owSHeoQH3kxwuNPM0sjHKoub1mBr39Teu5ytaht50NL9ahmnxROBZZOJfiwVqdHh4DgRcKp3D44twekIcDB/0GfYMKJpAlD0AiMaj4Hj+RFwXnkzZY4lHMuScmT6uj5RSI+yqQXJ54s2YR+SpBJBIfFI2KLkA0UfGvkRHpa1EuGH/IyBkP9hcOxXMbbmSbbGQGH/GEq4HAeAkuCIBu4zwdm1VMdaExxL1l/KcjTR4J633Lg9LVV5BzUx9YVCFtQXfFtWuKM/jSIZ4s7ZpgwHprtAS4V/AeX0ej0THCZsYKQZPvIeYz7u40oFgSJw2PnNC44ZYeF8XQMnGsARzQiyudRcbE6zKSPNvWWpIX/jMBoLwmbYD1PA6fxIcLCJALnDUSMACmG/kaXB88cga+hlu/Ir6iQNyI4KFgKnKjMrraoqklX3+uuq3gRlKB3Ui7I1tD6HlqozHKp4n9bqW2/Wx+Wd7Bm/PbfM6QTfTSEQ4GAFHaJjIzgoY0g3QPWNfiFmvYBqpSBlGD7iOXOAw5UhSq8U+QKvq9oMKjkeqqr6c0d9Y/PPz4HuUdyhOZQHrGqN+od8qsEul0uvqcaBonsWb7c8BzjMLKx8Z5nDhDsvfuohFp6UOR4wONIKuMypkPOzh5PEg3nAUa5N3p9rl5KWsUZGi3FKBYDGGwyhSqC68GyjssxTHypKNExS7icYisiC1vhgl58oj4T2nZVscCDa9n3BwY3mlSgVsnOEzEGFwKYakALIHNujsBPwvwqeTZStxb3SanJEzBFjchvML9dScTQv5GKNonglO2eKKqND43zDpIwFlbVN6sFMcKC04rvKnACc0pjIjmQKDgEUNczo9IDJgX8ACKfgPGa6gd3hviXIrk6inBg4skB6SHlOeuRYAsAnF1S1VgDWLcHR+oBUVZiiahkoDC1znJF0iutnbLA1bIyBkzghYfwHKARoQUL9hw0TczEKWwE0gLHZwMZAX3NsYGyewKyDmakITmc2OFxLpRRCsw84twXFHV4VrmiRw6HZJ7cE57WM0kk3hdJATHCGWrKPyL4xwemJLqeYrdZT8d/vBU7H9zCtAyrVepg80iObBsxPphAsGUaoLWQOAwc9cKhU21GZEwOH0mHKlmoJrEbYWaLTiXaz48+h6vJwi1FgvLoAeCS6Undlls+QR3ikI4dMLR0xiysEJjjR2t3vDQ7ka0pwOvj1FR/FPwMHrBu/iTB5SwAOVIX6uPUB5AaBh4DACSIKQSWqrW2rOXrRFDWMI9NgI1AAuFd6qBn2OE5lkWUNDQ8DTiUbqlGtQ0vOHk0DZ1f43/qplWQ/AJxKDJyeTSanDxoB2Tke6QM2GTqgixngOOYFJCQViryN3QRwjOE1auSHdXcr8h1meaEGDrdKRT7h9j8NTsMBgWGA03EeAwqPucyB6esYMGAKAfthk8yBVEeIJSA4kX7UcXB2RU7NsCraNhq2+nZGQcd2+Xsvi9ejCGff9rbyEJSb/yjl8FRCkjkQ5esgFI/Bq0aUgir1Y045mAqMMqcnwWmYLQ7jbG3IB7VifwzKQLJiI9Y1z6P8Yd1Np08rkrEoftL4PYsqufSZjEr0pFNO5weA40hwcNM7YIR6phGKVo+P8RyhEHQ6CE6FMkGwJZgBTmAG20QMZ4jtM5NTZkDNruojrJkBiiUDovBjMQcOhFBxfLjhCaUShIjyoEbnWEPhqhUzeBk4mArF02z0xlE/DBzYaQYOJEkrD8FjAsfHYJuPdg9iVcHbBsHp8BTQRgScRtTO4Q4T9nwjOkDIMqo+ZIiZ2tTQ3xavMOAfgSNsaAk9iX46zdYRt8bQ0sDp8aQ+AqchVengx4DT4+DADdIBDqcbocDObAqEOoKtAYgQyMbU6jnAkd7IeGqg8E0LrZmMRSiWIkfXX98W/KyK3ta8FKtqleMKgQi5WQDlcCg9BAQONDUXSVCBCFP/AK90gF5/cA8xAcI2HLusc0en/9jRvNIesTkNHAZZLwUcpxHxrXHjAylnIzJgUrqfh5Zm0uyKdsLbcoyrXssRmdu6rd5Q1h6YwdWqymEbViNZ81pKmxqVJdhaoPcm+XEhg4DaeUH+IgMHEzp7FMbxfK46g4vAlpTEVWnG1jpOOuXEwOEoyOLYXSsyxRVkzi6lzWxgpr8QPt+aNiD52FBxteEwxtxEWtau8qNzcFYivWV/XLCtYSMHAnA8+9cVSLpyEAuMhDokayQ4lYKPCR4NSBnu6eAYCoGfAo5lCXCEeN+lAVOgBmzITnVkk0Iy6DAqIRa3fjRzFJ0QG2L8lAiVWruKUJWaNlQ5BP8gOLSPFcbW/McFKAjiUQJoie/bHvsBvzHfY8m2ed6HA2PdPexSROD4c1DOX1wnHmqzcy051AbcLBvVIW8bIb05lIfLOOHwtrFqMYCF474BXyPGUFl68JXjQTKOTnz3nwYHtV7IFfQKvd6vgQAHUXgM4PjiOSRJLUH2DQMHPoFdvpLBqcRljjRYdqkTvpFYrgQDYbKJQbhdIzy2SHqazPBhh3m2q3dhtbSOHUMt6QbtYjH2VTSKIHBe/SPgYFk6GvPQgtBD6Q4+aVpcW3usP8fsAhtrvCowfEKC09G6XUbA2ZYqkwBnaMkWUjiLUy+NksWjHKpnIjvzNlOpNWfNMy3yIKKsQ21wuAYOMrmyztaCHw8ONJtwmhwchoMDNUEQs6jQRBZq/0oPK8bDHpanYD4o2jmVpqP1PY6Dszsc8tQWTBzXJYis3JHr2a4upp99q2NN5fZqh+ITjEhnV+BIZ0K1+k/LnA6oZ36HUw4OiXAqae2iIqviYMSpQg3xgHI60s8RkTngIRjuqgS1XSlzyuU56qO/Y/rn0DA/BTjWrgzM/ZPgwAQij4ODg2AaTb+HrTi0DteveJHBK/4q9sbr+E2AsdHjnk9oGl5JB2eXBhtxKUulhAqc8vbDh+wfM08ecmMFx6tsR4yZhdaf9OuhMoXQGtJfMKcXMNmk22S75X8YnEZPAweDfJV+2csc5ydaD3n9chM+0eOtCJido/pHRFTpbTGZhpPIMwkOwLUxL91sCytze9abCAb1vu20meJaLo7MoachlOVdbEUG9TmF4NU/Dg5oA9jMOphjhGuAI0U7VBcSB0d5peVwFuq3xsF5ptfKWJonVPnQdD/nwk7PuWSQLPqwTJmjgSNmGURarDZ+hIfApJxeL8jqJRb1lzvkEOQ1uwBOpZERCdW8Wc+q+oT3alZHlVubnnPap3pjqSqn8o0IOEG0iWfQSKGcpKTChmiw3wkWB6fDwXGghKrXjBStpy+n3+wwPBxHgtNQ4MSyb4Q6i8SjjZP47kUfMzw7hhFKjpuNYTo4gZpGkwDOMAmcHpbA96BBwWLggH9VaGvk/7QzWiSaq4dV+AFQHIDj97QuYB2/j7lwTcp2elgWF78rWmgNhyL3/3X1e9HFXDm7cgLpbvX1UDpnEZxy+SFseQI4jQVkTqfCO53NMXU3wQjtUKyNRw7mHRzeqPAoG8kc0whFcIJKuaoVtFk88RYLdkVbNDnIXduyTd2NvFndxHc9sxawd+A2iCXsmG46/PMzdnbPRCxP9MLh4Ii6ImspebDRvODIWDa0rV/cfSPA6dAB5gQnEGWhFaFK6+4bBMexXvMJ9pbF+wEiW9vQN04r0+HMZlP5CwCWzbL17NlC/mnEUWUmyp4grw0PAX75M0MAqXR2AQ6jrmZjbnBeZ4EzBzrJ4JAxiensc1MOxad7ntTWdK90HxLZOts4qXVbyZwhZQtubsY60egJfgKcnACHfWKRWTrEO9lHcjo4euKotRFLhdvc3JC2qCWTTqBgNz7HbjHK0UquG7cGh7oTNRanHGRrNjpB0Rtq+2XQK4JKX5TxWTwyzXZsY3PzDVubkVWlXxsbm+CT3tyArdqwNsGdjB9gPyKfePZMPooeDN7KPvKM/kIuoU3wRLMv2MR/cFTjkPyUwAVH2bgiTM3AaUR7zVPSsj7yNotyGg01z7tzG3B6FaoZbszP1kRFAgcHJu7iACqYewCtC4OO04dBKJYKeG2yLRmwtb+/P1Brf3B4OGAbxR5u5g5xxw4PD9uw2EtvBoc5/sYce4Cv4Qv4oTdvBm/g3fpfxcrxI8AveAeiccjOAL8NXtHPgn+G4bZJlSg8Y9paovR+NcYIMjuwpxdQTqAlsldfW0zBaohuDbRgQFdHsZvGQuB0CBwH1bTbyRzo/2EzWlFpKdCKrNOBqbRiRjoPdm3CrruwQrHcej0M2+16HeEYtwft6RReX11dPXWn02n73r177F3sE5PQDUejUHz0tF1n28s+GJ6e0pHcYpH9KvK/F0fFYpF9rDiCP4/b7Wl90GbfNB6zz9TH7EvVSeAXuADmG0ZgTMZx5WEI2lqnFxjukZ7tMUMCsi60ll7ECnu9CiW5NzqiU7DnaNyokdlfMg2cAwKn0ViAcjSFIHD6PozILNDIEIihVhrRyVPPGDi5Ntu1yGLb0qobC3aquMr+Ao8n2jtr7Eet5tbg98StT+tTt95y6Rg1+qN57Bq+wP7apSNPxVd04SsiK3QBHKOkAcCB1CQxxBC73kDwpIKeK/kSTbAp0BhKmgtJk9YdWwcnW6FOASd/4P22IDgdAc5vRzi72dMHuti+36MhrtQtn4KLwE3aMWxg77ottdhjhhZteZ223txq8YtB6jLCaxEo4k8J4NRaXTgifUm3C/+3AM3IaTDKHA/egCah/Hho5zQcrwJdZlbw/waqtjidOt2Dj14BajXdM4YjZalss8Dp3BKchm9r91bH8cFlICnnL64kM37fdhOwwcUoQluIThQcpBr1uVZ9Gk7r2htqsR1HcLotN2F1a3HKCQ9BKYhQTrRDPnDs6CCnlIHeWsNjNaxyYbbGW0bNL3NWDJnzqrGETdkrnNPaChwtXcliXI1JnC6slr4YAdRoFYn9s11mdzvII/aL6IIv+Di9uVgjVuXSkxo7KBMwNXO5LXasLrJJOGqtiA8QZSIlfiJwQux/Bo6psSM4wUvOmYixgDyZCxx+E5u96zrp41tysQoQQEX28+r8Ored8z8CnN+gLG+F2JojB1XZOjh/YRQF1OhBvZW0BF5dWgwR2jgGTktDUqHapf0EcOTmam+IgA8vu0Q/3YR7Q60p0+k0cB5uEzjCwuCK8rzgBHwUlbGnPXtucBoV22i2dgtVGsEJGOVUuC7NVoRyHlIQbWOTKbzrrkCA7RlnMF1XvMiIoSsRUusLf/rlS1f/s8S1q2DtfunqqyX+RHLNpW8i9PiX0xvgYcsdbMr40l9/SXBeFqjJGs6nDRZja2pCFZlHvcrc4FDvys6vFW/eWEHU/1nprFBvIl3m2E1fgqOyL62NRH3AkD/1ulv8XotxshnvCNubvLc1RFElW6t4Nk145rONF5M5lZ7q/gmtwueWObyV6reAk0cbzX/cq1DuB4ieFzDrXYIjG5owZW11tVgqqd0oxWRy4v6V5t3/UinjrUxrm/HxVQRnu6yFsgGcHlJOA29DoJzeQuDA+LAASxUw+31+cCrY2LPz263B2SIDeMXXVOlKAWtABDgyx5nAKZXkDpoPi1IXLpl7XCqWMtEpKfRKSejIV77UktAs0e/f2QMOznYEHJA5TInuHHHmthjlcDWpgySXNWwvDs4KB+e324HzgoOz5ItZomCMPfYKMXCYFcrAiSKiLX57qy3jL7FfJXOXI9hFwInCU5JvqMURVODgAw0cdsJ/lq0hhAxWGEfq5TuLsTXq3h5ASTwllaHVU1nAzilgQ7dvYGt2D+chN/rlZrPff9CHBfm6HTUWTOZXPGOqtL65GiziAYmFOBb6BpbSKSsGtXpNsbVSFJwS/y4BDpc5f2JSWxMcIL92XgXUmvaVVAg6MzJhqHM+MEFIzAg6Ys7A/B4C5wWCw7S1l7cGBz551PQdjXLsAs++eaYVwYARyhUCQRPaTvH967ZMZlTSNj+BzmKkBI9K8e1PAKeUwAfD6ebmM9MIxWAb+T75hG4uczq9GYt3eQZ1DcHBAR6NBXxrB1v4kXxlKx+bkDuDavGt+aeVCnzyyC9of1qpHIMO2Gd4kGd/Y2Nj89nmmzeDqRtn+okSRdGCRhnsV0131ig/AP8/hocJZq0YA8fUGNwBRSOebWxa+PvZsyZwp/9p0JQW8uvOB07FEeB0uDMHG+/PnUMQBIUrJuSO8l8Prr6yZ0fnH4/mS/hkbz2Ht37dyhfy7Pf52YFyqwcNAKdh557lcnCx4IynoMmgXp9f89Vu6pJSuFqmG048Wl9fZ79qnNQEIImUFqc75f0Z8BjPQMaKLEiz/B+aB3ZA285lTmfG4v3rGjS2mxLe5oznNOytraurk/HVzc3N8vv3D97fLN8sL7+Hp/Osq+XlZfaLfe49/L5qn1xdbd3cFPJEOeyueennKCojVm4wQF9ZLdEG4W7j9WwzpzZjxRGYVwtnn2UGaR0jQ1N5zofsBjsIAgTnyHEYg1qRCsGsxOVOIMGR05PnjOfk/2S7lcMwSgiRDIxn8KgGLvkQDek2/xdZ4r0QIhkM2uOTAwTnmIHTOxuPQ2Np/k1k8BB0KYbk+qzv70OEdH+/DrEe9P/zza6Rfk2+/+7MHa7J98tPYayBf7lytIb8BLh9BX+s4QXpYZ5wfHhYOCJwViBwsBLMb4QK9aHTETylMafMyZ+M2zm2DZoF9k3WtxvCZZ0eYLevY6YQfD0Zw6Wvrq4mEIlBUgxZggbXPpEQeloE7wIfP7lIk+SS6QTgTjrNBdflUZwcUmYbH+Vy4hymU/pHhzbPdrV4Gh4WVriqZXc6DjezFwEHGWEHx1RBr855wPk6ZoSgC9HUC55t+nGu4Lqt9s3REZN+xxUAh9+XJjirbj23D4HqfbEwbP0G4tG53GD/Db4SQQ/uZ9jibjjrHpmyVa9Pp9pvtvcYDWffg7HrOjwY4PfSSVDknPxG0VtpNWwD5XSQrTUCphSvLEY5HRph3cEJiUGQ4SBQ4BwVxiEEP2pK/4xoSboyKl75/feYZcLfCQwFYs7vv8LdATLn62mYsJXhqotbY0Tw3wzGg8HhuM1kFIT23/DIP7JUxVrZJos4asjjQPiXkFgk/WxP5ac43x1jKkFuPycSCkD4wfeIHIZ9nspQJ34Wc7cxcH5FQ7vSwHqDBR2fvEc4h7Q3Bzgr+ZvTsCjUTw7EZDIpohcj0dTGF2qlkq77coTYZwAc9sL09ICZwysaOGFESoWwU7hASqH8zTFgIGPj8LDN/uUGAE49B7IQxA/uMqQZ8H3nhwnbdU54uigcw5vG7Pd4zIXieAzpHe32PnxHDnFi/8bwGxNDBqQD5FD8Rs6Vnf4IwUG2ttJbuRU4VJQQULCsMZutBfnO19NVAOeLoAz279GjC9MaT/ZQxiADcuLghMuFI2zFJtlatx5ZSDLaU3n/CjbHOByymdjn9gfmU8kXjbcNop8cCELd1z4iCRffwc8r+pUuxK7bQuasvGysdG4ZbGOocnBmegiY1XmUP12tCXBon0f384/2Yj7J0YcPOxIK9mREjy4+sXUxkXQnOOQNI9+VVzDtOi/AidyP08gLTAYMpm3G8jEDpw6bRo8oC4OHfDA7w/gU20vKn0INT/uDSBER3wfCh1FOjn1HvT3FJI999hr73vZYPxHjU3iiXcHWSJWGjA5MIsDGKvOHqTsB6WyNucDp9I5eITiGpX2R/3h/R9MM4MFo+fO7/CcOyGj5Mv8On4yW3339+DH/7uZCkJJQWy9XGFd71bsGcMYETjgyuXhEqjP+NB2HsBGMj0xC2DvMWoKopabhdV0zGaOem5Iy6A723UjYoUuCiBuWLmONYcgkCvt/BF8SsnMKIf0gnBjnFTGxQgHOilClQZf+FWzQRcBBVaDTg3JbTGmbDU7AwBFWgSCRzx9fMhxGnz4oLWC0nD9aOXqHEIxGNx/Zk0v25OLyfCVYYU/YnybSmVyDz1xiMnyPsbX8e6CcWqseRqMqsfhavR3WW4guBwc21A2l5lxjGjHFEiQ43ZyIyoXt/amhuoDiiM4C3HEMeE4BHMgnAGUbHHiQnlDHM1PM+8uX6Im5BjgBdBDGopeF4jkdCt5D/S2ks80LjlAI2NlNPnz4lGe0wNblI0EpxYv7H4/Y8fMX8AJDBGwYQOrzOfp82M+X90cKnBqBwxUCztZafAvk/tVatTRwvghwGEeh/ACMH7P9rfG7SB6nuz+YSgZXN+RhDSFo8SQeylZjXJLxLVRPW7jtbr2N4Giydf2LKWZNcMjUxzKoxYJtnd86DbAvglegSs/W1jp5A5xice/Do0ef8x/PYV3m81ywMGywYPcrA2cC2MCTy4vJ6TuGzdeb5XfnDKIYOI1KpXGtFIIoOMWa8IDxvYSMwrYLLKTWBV4CIohsRpkBWKcv0MGZosawvp6rT5kGUIv6CYqtqHDfb3NwuhwcN0o5rZrpzXOFQnAU/NYJVnhOH4CUXyw16kh7YXZSIXA/ydZANf7waMREzvkRWx8ZOHnkbJNHH1eCoxUAB5lecHQUAOVMRgyc/M3705s8+22Aw2TOq1f/U2nA5EQGTlGytQg4us9ZUk6J9q2uFDVApzttAzh4ojrl5IQa0I7KHEIHLFADnHo71+UeoGRwuung9Hoy8wXUr99ul7eGCsHKTHDY25XMKRaZQgbgoEf6t8vPeVQBSsVR/vzrZR7AmaC6kL88R8oZXa4E+Renpzc65fBjXWIOg2P/FhBbS5I5NT3IieCMia0ROAOx7aivMc2ACRAZvS7Jnduvh6sh+1+Co0VTkXTQmQeaGzxAtgbf3O2CkoJsbWDeNt1a0bC7kZoRnKNKRYCz0un9etukwvm0tSACziOgFCb7Qaac//HoU/4zKQWf/lhe/hoQOJPPnz8t57nMYVT09fKGKQv5T6sxcHrXL52tSiBV6dB0DMUUAkYDpK0xcCbA1nItMJpWQ/DXuCg/lMgpiSMxjWCKegOgZMRwKM8TQqqkH4f0wMXN5uAwhWA6GJi3jQFO0QCnUGk0VnAdgVL82w8AR8icHbRkHhHlfPzMVLT8JzrB1ZEEB9TW5Y8EDsofCOicX45WiTNo4FSeVDzfFuC4M7W13P6AwMH9BJOwRcmfkPDZEqm5sRh0C6164FduPKoG4JA+0BXg1Cm3l4EDSdYMnP0IOC03pq1NJgTOQS9Y6fw/pm1h6vGiMudbwCFsGDi/MaFznv88uvgj/5kz49EFBweeEDioub07wtDau+XVYhwcz/H9QpA/xWtnLCSMZMiae0AuL7bFLbAChQkJ7ntK55TgFLXoJh2ZvECh9A7+rnE29iHwTNPRWkQ5oP0xaiQHNVCOgQ4SqJb3y+yv4oTLnI7IO/ux4JSKO49QbnzgCsHn0egzB6fElLSvwSsCh131Jw4Oo6eVVytMO8iD1RMDx+6BzPl66tL9x/MGRDjMbcmoDv4EnwBTCOpkooMaAE41AJE7CMKuqXxLBJhlOp0C4zNC0goc8uvBAxct0Lr8khzInMG+clXAmUiring9M47dCVcIIGONJyB/CziYvzYfOBMCp7TzaMLBYSx15ZxRjgKnSJTDr/+Cg/PpK+NoX4ENsnfT376gEUrgONDvi2lrJjgihu/yYAvsyfo6gpMb34M9607RjQyFHW6RKGxSjIXYklLTzHwB/Cq09ydUYFJzyUNQR6cM3BDgSFXgiHz6ol5FAuCIkEEQyLqKbwKn0eksBE6tKMH5yCmHwCkKypHgTBCci8nkEqTNxXs4648XmoegqMDpBfkzrkq3+cW7nBb4j6K0WIhyZN0UeghkbZPhxdFyQmKpaxF02KdEkQf7XgKnLRxvoBDUlcxxu3rtiUhqV7414BI6OLdWCILeb/OB837CZU7pw4c9dK3lX3JwLg22xsChHNoJKQSjC2bffF0+PQXmdr48McGBGHXQcZi2dga+tRqjHFGZ4SpXZkulLU/Bg4lqM+ax0+61KGrcdaPRz8TcQTOEURS008KboYbVIZxluu0pfonrCpnDzjpsyfPqgtaAJxsS5RA4jRVQoiU4C4WpDXAqc1LOey5zGAKoSjNwPp4fnX/8fMG0tUeSrQEQF2TMEDgjJnFeATj3QC2IgwNdcWBuM4EDOo+4QeHKkaEz06XeElH7+gDAaaFWhWHmVr3FNwh2t9WtxcPSZkZNPEmN0PnyhR1snZSQXB2lD6YyYC0Os3AZWyPZ16pzXQAcC1zATXS2xnMHbgOOVgLSCYI5wtQrurZW4nYOgnPOtLVPn8nO0WQOtzQ1yjkvvH8PHoLzC+nQ4uA0bLtT8bYavSg4NY0KhO8LuFguZ1YWAIHVuNeymJbJGUnqjeZ36haPqF4IjVwDAgcZGpyLOq+WdKjW2xyclfxL6Kh1W3COVH5uo/LbTMph5ubHU0k5TJn+IMH5+Mcf+fwHHqgprhLlcFcwyZzV00tQBT5+/XhEHgKhrSE4K8ycZnfI0/zBA3T8M63V5bqpVhVohFHYvsnQPXugwCGtW+af/Z6cph6RPnpGYVGUKbr1aG0JOzOhEHRdGTmpET3j+U4H7MzD9uEN8PvgVSdP4ATnnXyeWRJHKzOyLo9Q5rAtFeCcM/32oDILnHzh3bvPE+JFeOkMnRH41laYoXPJmNqoKMF5xxUCeP6Ba2vLeWaErqyAa/pTBJxH7y6Xl999LZxdnbWnxMSnpBhDxpqrbYIgHWZ0tkMjmN3lNy+vpymVItjU3MScNVdP5yzx0+LqBJg5bkjxbV5o7zJtjdCpUy4dxgz59wtwwHV3unx18y6fL9zcf4ercHNzc5l/d3n5LnvR358+fYoP8uwT776+e3+Vz+e/fj1KB6cQGkEYdlIfPn8A9w3Tpc/f5R99kDfh6ujy5cvLC549zrTtl5/BYv1w+REM1pfkvdEjoWwf1tdXRyG4HadsO0ASgxEKv4uuBk6L/Jo5ptFCaD+nBYdD/r5WvaWqBDRWJUsRuyrpE6vTTH6HifFdXpfdAllTb2nOalCl2+vwQs4tSncfT8gCcNpQbwp+HnaXhdAMgcsiRHfEfk+4qp+WCYQpCHAjTDBBg70wgjDVvdPT03w6OJcSnBoHh7GsT/mPLz9+fbp8+WmnqFniowuUOHTN9ARfXV6+Wb64GGkmTE3s+zrkPzG1FUKVEG+kW7cVGuDUcxyP/f39XE73H8NW13igzKhJ4B/t1tJ2Q1iryqta4yo5eAf07wDXwv6bHKnWuW5RRDGoohsT3kOXFAKMqgsrrUTKfVfVk2RkOEo+KaJ5ZDizQ2eC45rgwFfu7Xz49PnT8mj0YWe1aLhJ4pnLlKszmphnIsBZdwEcduO14JYhx+fEpTi0AqfLg2mADgNnP6dhIyrQuq24UEnHBsT/l5p5vjUu6tFNJ+HJ7YNSvc8op4WvmpQTFtHAKYYIDjJE2X+ixImrlgiOmRHDuyXAp+kPX/D04dhZ4BRc8WkZJkmw6QyRW4onskVvE37yNfJfIldQXmm33jLB0RUCRmU5UairW6gSHO374OLSMx+/dGumNufSpXY1CwsURHTgiKSqlpI5qKmEJPMAHKae5HRwRMeRWrwfRUJat2ydIHP7SOyuzqKcUtEsmyimV2pqVWbyfonqTepsoQpmEmKei7sKBh6CE5KLqybvKvnFTEYx+73eNXJ7aTc0hUDHpvj776no1LpGRZVQELutUDs2lQXnRIKHurHIIaGUCFCoc23XrdVMcFIoJ4GtFTW2VpOXdvp1Jlszwfm2pbE1tqUTVAhQBeAKgSvBKen2B8pqBo7RiINuL7AhY5QjhX5qra6gOvoUE0NIS19apiXFxOGqDGYITVPJHMhTJtIP4WdXByfkarmrUuDDhEY6nAjRZWXYD5CengVOgYPjsoutzSyrkNUVvHFG/DVuxRR1ymHXtu7ilQA4RQkOLzJTyTSp4GiUExE4RBNYoxCqUioBR62o2HAaONS8JZQFWZKiidN2ERyI4uEFiKIH2mEMOLhCNe+qvHvXVZ50COBKKcqe8hAIpEuwp/OAg7qou85bXLhCJ6VmI6L5iGjowN6xLrtfuPwvWg2T29LYGroW3RpalMg8cD9cjf3KLA/2tcKPFWHXxSg4Shmo1WS7DzyTLxI0dHdKMSrYmglODcFp4ZlBsmqNyxwEp8tDpkUXs3pQLVCU46I+sb8PdkBXKYA5qWqA8omFRl16mpMaKP0R3uvOAQ44711NjizG4ri8U0Zly9XAaZEmWuRpFAqcogSHb3oGONx9o2I0NZUAKBkjUW5LinTSGCQ4EUcQ0YcAxzCgOTgQXiBwcnWRWghhLzjjWkto//tCJcfsXqZu5vBZnZ6ZWImnOf6xXH22Ks2tZ3RfuNQNaIFFvIx8l3ScLm0EaWsCnG46OByddHA4W5Ok01Xen6g+XeOQcKGTQTmYjk8B6xRwJOXEwGEv5dyQsye9fZtEg5cb1SM2lXw8bePnV7/OMEK5CeCaxZULrHW97xMvGRMF0bcCR7EvAqfVMiin1pJ5MXFbRwVEXVfzJ9S4YWq6UDXK0RSCTHB4riKk8hTdKaULm2V7dazwG7MVYhGgKJFzZVUfOY7unbZzJzPAQWxAiWp1v1ljY9yRUl1dsRFJ4NSi4IikQgWOzM8wwNG0BO7NjOtGDBz+6W5N8ymAbKzpDLIUoZwEcNgXx8DhbDwENyDTXiLOQLMGE2mnncxvoIIubLezwClgQgp4vL5oyeylRZahRLGdqZHeJxNe5wOnmAmO2UhISZwaxa1r3UgtTan0u5EbqDs+dRcqkznrCZRTVOC4ukKggeNSquIA+JnJRvTSFOXqqJtvqwuG+CBbISBx8aWm7dNMOIrRx1rGF2hSNbo0tnUjA5zVFG0tHZyoGC/JrABN5NREVy5hSkgVQKW3yZBBSw/R6QpBHBzB1tr7cba2z7NH6/GGccjp3Sn7Y8tNaimn0NkfjDPB0RopKpOjlFb6KRs1lIp6SxpZ4tb9QpFHjAoDOFyVLk5QW1slHqHAKUXAcSPgCJuu29J7OpBbqqjSN2rR7AI4cFe6yUpFzbfW0nVyV9fWomwNeux1o5QjwMnV21Mgn9SC/DCe8qB7ZsFiadf3M8FpY8xCk77z1+kmOeC41JJ+AMnWJnFVOgYOI4BauM4VgpKo2+AWTM3IC+gqO4criLVoPkHNQKH2pUXt8aTaHAMnUSFw08AR3Mqtpd3MSh6Won6uGlE6pB/PAqdlgnMLdOKOYqzW6LqazBHghBDdTJQ5OjgimROaPda+GLcNfkqjHdIPDYuzaLxD+PBqX758YeCkUI6SOaQqANGGmeCQ9zSh8xi5K91uzWh4pL2pRloTkzon6XZOwMBxY+CUinPrAhHKMcFxZ4BTjPnWGFszwVmvJWUK0DfV1JXqX80dawZP0fYula1JcEoSHGmEDpIUAlfcGrEtQYbgihvQLDbXL9rNtcdfg4QsnBz0yDm6AVPo1uCUom3MtCZz6AVKAseNREIzFIJSUaXf/q6+LhrNIcHkaplTJtkYUbruvODU3HW3yxWCQYxyhA9Q8z5FmGrXdWtmexfVMkyAU8+ND7A7OPXFUeBAhvPKzTQshl39I8bezwWPrk9/0TzubB+i7psJXmMCOMoInRoyp9WKU47gbGpfXM7ZJDpfIilu2mdbPNud3+BzGaGorU1McOoaOEZYryS5qGuwNaMySYHz7ggLeAOjb3gO80BuwN3aqhU191MaJqbWZizZMKK2rvm8EJwRamtdrI2t82IDGQlVMkf51kyvdKyNikas6JAp6bTTdaWm5hbNtlEllW3lakerUaVOPYyGO7idw1M9Uea4PFCq2BqcvtGQ0oAhCk7cK+XWp+M8g2VFtCsS7fMQnOCmDve2AEeTYPNKG/NF7VQRHIyETus5dn+CK3YKfu665r5JYGuu0Vi95UqmW4zFaWuu9lnibMrp6crYoP4xTDPRfLs1qtSJ2jkC8JCyT6f7dQY8XEZXgCPKhGPgSN3dACeCDv8UtP7ZyidMJsgFR43O0XIdL6lkUE4p1tUxqQun+tLflQNLnWpLggM5BJi3hvEcRkExcEqlCFsjJRryCthbu18iTXlUj1aFjhuxd2qum5BYyOwv6IaAZqAWMkgCh7O1VoglIIz88QLEDItaaz8DHJEFrINjnAq/I6Fv2FW+01gJArP5ICgECM6EGQSmV513GioVU3rIFUvRnFj5WjcOjpA5ENIaGe4bSeE6OOLObsnWGd2Iy69kOBBM97QW55H4KyENeQWu8KjUouCUYpQjZE6IjaQoniPAMSinZCZuJ4BTSgOncH4EdXJQFLJyZMgcZGtFwdaK7je32dZVKPKIQZ4YJsCGbtS3lgjOel3mEVI6jLAKEiPzNemsDUlbU343N/qpWnedGyh1mdaD4lALGRQNcGp69o2hEJjgGA2aoq6nDHCm9cHh178DnrX+UnYT7wiFAK9H1eh9awKBTjkADigE4RTBaSPlTJK0NQ0cXea4Xb4DcshBtIO+6UpsaXUbPN/qi95Rv8bFukKtVl+XCoEepjby1rgtqts5cXASENBNIJMHyUD3WHkI+EgoaHnzmwRnUpNl95C/8G2rK4mcgzOB6AZms0ICUkgtaboajWqjVjCHwMhkFrZLF0oz2EZ/of/RMUUFHV0VO++KjCc5qAJ9ujQCQWoCrjmHB7U1XoSfnOAhwXG1MLUBTorKpINTjMkcjEa12wnum6CjKEextZoxNKM7V9wt+iaVk1fj4OSk65w3Y8rlWlqSipauwlOj9M1br2l2/besCbc+zSOtkmatxXNq2nl1ZZvLbwCnGG+eLMFp1Qe5eDp70EsExyy5nJUqZ76JzlplwXJwRm6uPtiHIC7USotILs4qku51bT+iYWqRQTWrpeccy6UcRDeeGlWcCnCQkfG5MMAVeY0XNqcwEzwkONKrUjR0d8ETkkvvpJ2zfxgHp1FpGDJHSMxWovjIhMhQJbXECzgzkjl1yBPHrNdBm7KEqFgWibPeorEsspVWXYxmUWwF78J4JnCqhzb5LxIcnl5K7SX3qbwR0gWpt44L5+QSLKK0DvPWJoa2Vt/XPQSx2pOIQpCSA9pChWBOcMx44/osdEoarQi3SU1jSOx44Qiq+vbbEMSBInbI4cIwezfEoEIXW+B2ca4U1k+7ImRIvYharjD5TTM0qRV+TNE2YXK7nK3RdJ4cb4YH5cFQn0Nf2g3hbFw8QXyEyQIATjhBpZODg8VGZgwsdnPEcrljlVwAzkEcnF6ggdMtJlLOl1pGRnQyfcXBmejgTEOhrvMmDZxdMURqVGSmyq0RO56rrIOTYPYbJ2l6h7X84a4AJ6RUMOg/sE89P/B7IcZS50Ui3MOALBAMaKAghMg1wSklgmP61pLKVxU4g61Y9eGKAU4SW0OlX5q72SGemquKAUxwoJBcY2t1cdUSHMqjkeC0QnXr1Wpful3VZ03dkqViPHchUr1TilmtCpw6jnoDzwy2NqwJcNjPLjersHGU4NItSoGC1ok0Ny6LcmRooNbt6jP9Song1IFygrhCMAMcsypsRngUeRDPvoyAg/fbvpQ5oZAeojEQB6elgaOZ2NjfAW5DGdZMLiwspQ+eUHsGHe5A5vAdLmITUAKHtDVIVY2CQ5TTxuprYMtuMlsrxuqHwVPEcSsZw040cEAcJ8icIw2cSU3T1qLxzdIcXeZrmFLnRsCB7g5k5zDKOQTvFAPH1cER+TlIeuTzF+AYCgbeiK0kF+J8yChwME4jrrFOzV2LEhwIciSBE2LVVHg61hQCt5UUMoi0DnF1cIxwW40c29CF/2uWzGGCTrpvRIhK0wtT8DF3kDvBIFAfBQcyIQaDAVOMwpBRkC5zajo4qH3TyBw9OAGnVpsfnKwshwRwBvuDblGyNVD+FTPT2BpUTa2jh0Ozc5LB0albxJtK8TOnHi4winkmODL5zu0mIJDIJor6n3AwZ1Qh6LrSzskNDnMwZhrap3Fw1ukaeSdJoBwNHO0bWzVdISgmdrhOHO9hHgfjgMTWZDous4n3Bxji1MCRaip9cZd7YGGAHHWHiYHzpaZvUikDnKIuT4EvMmI8TLJzNHAAkpIBTq1mEFDc4inxrgUx8ExwoMwWwGF28OFgGkK1NHZUBXBcna3xQEwqOJpGGSnpKpVmDnETvzhbcBU40FQat5iqDMRYEsXWcAA5tmetubyklYPDrgVb8iaDU0oHhwclsTkcdp3PAGcL1HzNt0bf90XdgGjPrscu+csXqowv0XtUMYByfKJnhzwEh2e5TWwy04bEeoiHttxVmm9LjkV33dDWFELieF+6CSQ9UxqW9DFvHBwpV3lKJrh2uELgcsrB+FtIjm7eYS8Ozn4UnFISODxuHZ0cCIWwOLbhzWYSOCuCcijBQ1cIGDimhfMlZo7W1mUZDH0ZgcWu/IvYWarc4eBs9TcHTK7msE0H1T60qbV2HXO72+1wNBqF7Wl0fkAUnDnTtoQ1pAXmBFuQkVVsS1WfMpoZMWlyOhrl2i5mnIOI4fUBOYxaQLuKKaVCdRU4dQMcgzJMyomPkoMvh0ENb/YHCWxtRYETFmPamjEZKOai4Vk2taJOsDXsucopB1/pom8tXHVhBEphKTcYj3PAtLuYY7w/gHZAdeyQ7uK8BxgNgZ2LIt9j7OziOY9a9oAbYZD4jXhztDErHUcZUN3GVDhpwdcTrkI/cXa21JaAg2PIHDNvKw5OtBcMTrZ6g0MUkhyfK7NV6fQ7VehxsYGDXZGYib4LNEKhzcC48LSfO2wjOC62WZi2w/EUSnn3zeEEOS0bXd/Su3B8ukUtK5cHOvfr0+6UjzCgWRVtvGFwzAgUbUCl5yrk3+TavBYpSSEwk/hKSW7HCOEgOO32IBGcRiyeU0oCZ2YKbsnAD/JtODguum+4dV14epaDQRvSfdN179FkD4z0MCLCvt3r9cTVMqYLqEKYrPOLTLniXtVoj2kQOtNuS7hd6zmAxM2BW80VeIKTrQ3GwBSnDHGvdDeiraVRTrJ3Db4Np2slGaE6OIKtLQZOWnlOVyahQYObdQLnsPB06YwpBTB/khdqQfsIaZKSsKXaBAijtNtmJ486Tk0BlpNrawPKZDFMWs2dHCjFBxxFoJEjLEKRhlV3R6urTP8Z8Wwe8EVPoQyqDVTe4uAUY+CUzHwKUhsiuQ8ls7yaZqAsAE7rTsCR+QjU/Idt7Lhg+0tbvrXJ7sw28Qt3NcQ0d2zxGHb1kROTe4zLh6unq/LOxxokmkYUQW2ONeVDp2h2iKAn6GCzeurq7b267E4KR8XVcD1cBYbGTqId3hsPGFu+ej9metM6u9d4+StnayU9h0APCGBUuBXJzFEg0Y0zPm3nksCJhAxKaTJnbt0olqGMRigoz4ytjwtbzaZ/luufjBlzg8mHg/aYYILGPhNk7kUxNmwStkkMq2KKGDcL519FWQ3YVUhMQnfKtDAjZg2RvnB0esp+MoEIc6oOwUAbnFzZB1fUN1w41Dg4JeWVVmnQX77IcvhapCBNcxXjsKXTcTs3k3Jk6v7tKUf4f1wjh4DAGTBwzvyzZt/f2vL7f56cnZwcHjJWkSOKgAleU16+B13WJtjmExRYQovdwZjzliBnQlf25nLDBLljvLXFyBOnyhR5msloRK05eGMvYHMACUzTGedyDx6c9HMnZ2d9z6kUlkNosCIjbBpbiw6RFZMZv9QUDRmZuqJLEqTezMPWEuM5KcmKmQoClzk8yxlnVk4ZOIeFLd/2GfHYlYrt2ba9dcIQyjGADgfsB5BTDoRCjkpb26A3tfW7HyR3O0G8tEXdPzYYyl5taCwmF7TxWoWwwVhIMjgJdjYwIix3cpI786+2PN8+cDx20pUrbOw7rUtwQl5DZ0ZCFVR6o4RYfQCCw4TO5ps3s9laGjiLUU4J/eQCHK7uhGSEbnmO53vsHqzYjwuFA8d/UTi48gsHW2dbW1dLTM/GAYe0NnEOpRqyBxonmBnthFXHqV5UbZ7TpsSSOlyfgpQSL8ojiW/ZxH/sIY2JY6dwyE6HUbl98NR/enBwYPtOhYNDxTh1Ec+BbJQYOLrurBOUWSDwuwBnyphHUtlhkBymTstxKRVnvk5lEyq7v8adU6itjbc8r7Dmra0hOOxaD+CK7S2gI+fAsT2fFlPpaOFI+D62WT+EO3kQX/gX/gfcWdpgfHg4SF78z7DwC+B72LctLdHXs9N4cXDAzumAQQJziOgRUQ6okd2uzJWura+7emZXSfR2KSVxlBqm25RELQvWNNKMuiRw9Oybmuw6qoMT7WWaSi8lLRtHgOPyDknYj8d1721trRUeM37GrnjNg+FLcMXwyKZNsJ3CAaMnp1AoMLAcxwbWx8iN4cUAO1FQ3W79+SehfQLAAwrs2Owb2PdsPXUODgqFyjVbTsGxCRJBLwqm5barBvMmgWP03YmnNuBfVb1MDUQONKDPJVW2NXocnDYlqCq/k2tWiM3BzbRcE/5h4dygDgfF4vuCbR+vETg2gHPNrv147cmxBAfGZVWO2arIdZC0EDZYT7f0xVC8wqW/yN/psO2Hf8airyjYTxEOOCN67uCdo8BxBDiuzq7gStdzoZ52V0tLVooUswk7A1trst9JvW+CXzk4OUyso+wXFygndL/BPeKCrQB5Rblci1txcE4XBcepPGY3rAAHr/2JopwXBYFOZfYqCKCyFr6jUClkH8qxBTj8aZRyODiFq3YEnC7MT27JXooRlhYdXh6VQhA9weaHyY2JFFtb1Z0aop2N7GtTLJpUa2QUGu/t8ukn0ukCbWWJchg4NtPWfLjOpwngMK3Iw30BcAifeVD69sW/lmjHZrLPTgan8r6OJFKTJSBdclx0JThFzW2jtwVKAgd4GlJcmAyOkeBB4+ZyOdkCqSW8Jjy7b30dBkFoq0XDTmQDK3pAiWB17HfeasEFgL+mGJ4WbK9Z/rPpGZSjZI7f9Pr4xx+9bO+J/FaH6fp9LwWcK9gYtyasFzBCme6/z3OI5HhiumNb5M2eTlvr64bWJkyuLnVlgVhJStcoQ5Umq6i+X/+2BXO+hafKhRukDV6P3PjKX2r2+xFwbB2cZtM+/vHgMP5XmQkOamsDBEd2L8PEIkwBhaBit6Y7ZjT+kVvX86NqIrEcPA3I/fcHD+YAhyBfjxpyXXex1VXT1uGkEBzwMG55CM7jVHB8QO6fXXazPwOcFtfWSOaEIwGOhk2Nh/Da1OmLjGa9yNvFbDzsU4icMalJRHCUZITeQfGUq7FYMMDJzikwiZNBOYxumkwi0WKsH9cT/tvz1uwnTOtaW3vC/ujdZsGnbX7cNf0Qa+rLbK/fZxScoq0RON2uq9hauMrBcZW1IeiGwEHjuF3vulFzBOKg4Ellm5METicvtTUNnG8vnpL1m1TZBmfJWOXYfup7DB3fTgPnLx+kkmWVy33PQ5uk6T9p9sv9/kP2iGnKuIUMwWZ/sdVsLhHsZGc2+z47fHMJHsF3MUjYl1pluCX6PgHhJFFOmzvveDwH28u3CZxQmS9diNyJCZpy/rhenirBQeduOwmclUpHgjOSjRclON1Wq2VWNJQ0+0pEyyUpd7sy4awry9TWXXLdguPz0H7K9oOxjRRwGF3Zjs12a9cq922kIyAzv19+yF5sMk2P8Tz2DgDYWnCVwaUHKrP9BG+APvufocU46VK/7zlr/WdV9ib2Fsf3KnY6OCHU+EhtjYkNl4rwKCmVdgbHveRAdE/1hp/dbq1olry5gwGjnHXoGpWP105Jx2eOwtQSHJq8yDQ3d2bRu2zNWedZ3bwPAb3cQnDY7QG+tYK91GQ7k0Y5jsc2HzFhi0EBtzjbLkLpL3hkc+Wq2beq5QWWVbWayKvoS+3mX4yafGCPTSDEJyBp+pzjMlM4xc4pVG7I4uwKbQ0UURcppyvAoTr6OiUhtOs0QZ4XB7s15fYkyhmcMpE1SAKn0WvoeWst5R2iOq4cH9aYAY+qOK9RMgT2B9RsMdDWIIAChTDjA9h+tulp4NhgBjHG7xzbeFcDV2O/PfS6NcEKEjajX7b6zTlWv08/GcfiH2Zf6oNnHI/KvoP9FbklkJXnL3nX4M5JAadwAyMvoPWuzJWGZrc5AQ6lDHdVfLVNk3zp0VR0F1KNyvYZOEX3dJxLAKcTvBKUw2sFNZkTThGcWiRNLo4MB6cF+RFTpFytpocPphu5OQYOs3MYOEsZ4LCNewJb43gkGtiNvYT6G3lFcX+PHb/cZ+AssJgYkwaUQzDjMZkgYvCALMMvZSTlO+nggIfArcn8AZypvD9oT2U1PtXyocAR4Ey5WtCGIKy800X7iP3B6qQI6ddxcDoKnHpXdY0qquFMZhOS+NgtXfjIt5eMPgSkYlLeGrvjlxgHyQCH/Y3tzDVyNw/2jt3bHlghx+yzfZ9Tjs9Iobq9CDhDyxfg2E1U1/FWgC/xSdFwrtnX2gjTDHA0hQDB4ejIqsnuVE2/nsLQHUSKlHAz6sPACSdFVAji4PRecXAK7VD5ooVCgE02apkRA9UAqYjkLOKQRpMIKondFzJnrZ8ODpNHuG/sESMa8KOAVLDRSAS8bGEz+lb14SLgVMvS0LTZ99vX+B1AQ/AlGunA19npCkEoS/kEODnKopoK66EmWrKjtgbCFtn9gJfPGS5qkjluezCYBU6CKl2rxYMFpXRPdS2WBKhyNREcm4GTRTm4W3BPs53rLznoj/T6IA7QMvLROGRsjYGjZI6fYdn4XPI8tPoKnLL4Dg9pCDQ4v/kEXeLwmmCfSeBshat6XTKnnDZKZ1ns2xVdpcEBQB3boQhoUM91jSK3GsmcsL3/5s184JSS7JxSBJx48WMpOUOTPAQEzmBwuAUmip9KOcC4PIe8wk4Two/syZO+R3wGqMmTlKPAsbOcZkscnbIC58lfvnOM32E3l2w4LvBJhtA1nlEmOFdtNwoOU3TaOlsTfpu2eEn4cWAYrWs2y3YhDM8Y35vBSQY4L9p6Oq5sphFrPmS0Q4oyt5IJDleleUcCkDk5kL79LCOUkYF9rIEDTmt2d19zPtP3icGxG1yBU+j0Ksc8JmD65Xqdik/v6ivKOfb6dANcV0g1cexjBgkD5xhx8JtZ4MhmU6oPAerIRDnKq0a9pF2ZjQ1jtwgclU0NBSD76F1OioRq4OTCosr4rNUihcqx3lFJFVz6n1QWl0AcRrSMmcD/s08hg0Tfmo/COplyrgEckD/H1yblFHqP/SVaPgSal8Ri1mRliSvUinIYEJI6fQLnmsC5Jp0kzX3DwSGVS6XjgulNiaQqF42nLnBVV3pAczFw1qF8ex3yHuLg/JoATrSvdLw6KQOcUgwcUZEFGUfgW2OmedNOA2fJA2udbZpGOXCjO+gZA5bjoHcsAo6n7BrQv9UTAY5OOQAOetLwOzg44JpAlYAd+2F5lldaAwcjKTiRvMv33eW1CVPuIkU3P089qVMNlAIHh1q5ie1VNHA4WzObBkZ3Pqnbd6TljtY1ipvLgq3VXQSnnxkyYFzoCcgCW1EO3OgOd1WyvXRsxCkNHM/20sDh4WrGt8APBOAotobg4Mk4Tn8WOF0tkR29zTQYgIHzO+UFiMAJw3HdjDx2Ncrh0Tiw0sNxPJE9ARxdWytFC7EyHTkGH1S+NdGbWILTROJIA4dBwmSBr4EDMufYpmQP3CAHXGyeAc5SMjgeHFIqBDY+9pfAMwSc8rhic7ZWIbYGR2f0JUIGTho4oksbzXXCfOPaqqQc4GLk8sRROS7O1OTBSMiBLxmp0tDHJYR8rYN0cApZ4GT2jExoViXBKWqPIGI63gJ38FJ6yABE8XElDg5TCK7JBmHQYcTfS6Acb23Ne2w/Zv8ALSZ0NHCAcjyudCPZgIhxTIUAwQGq4jdBorbG8xllj08xA0yJE6GttbVMeQrq1M1OpaJbWDiYjnNfs8Bx4+BEUmuSWVwqOBoNcanYHqNTi+GTAg5sH4Ij2RrX1tDwsdc8sGlAkDsRcHygh6a/hu4fcNAtgd6nFAKSOU/QmnVsDg6wTx0czBxgX+LZldTsmytKQBVjymjWEAyDxZZ7YjYTV6UHRGaYB8nHTdWMho6kdTNw6uNsbc0VbUuTwUnq81NKn96dCE69fcZ2balf9lNyCMChhgmHzSfXSiFoohF6bVMwBiEwFIJKz/MeEzoeY11L9mMglyVGPxFwUJPQwHFspRD0CRwHElKdbHAwyaVLpRE17FzUBY1YzVnimReDAXcNDAb0W6jWmlcaWF8Xs4FjHTw0cOocnNIC4CT0ZkoHJ2SnPD4jvda0c9ZiHgKbEYutVGmIw5DnE/HBwIwJzmObrE0fwgyPicuBhDdVaRHuBCsTHQNrTV8aoR7l3IBXnJtVib61Oqa54MTzGq9sQ3D261ozP+Jpbc7QBuBBwPqgbhI4dRfAObw5T/cQYMCyaPQJn7uOPOGtX9R0PHGsVn06PiMno5m3Zj8xfGt4RzNOE7FzroVP0n4CN3eEchgpwVOmaXuPKf7jOwY4SDnOmk16BYLjOEJbAwuKUw6cXjrlCK+09Exj8y/oRNZtaZF59uoU/NCY150bUBGFzDArabNNwLvAwGnPAAfqzuMtnqO+tDlQUvRS0n1rECo8RXBeFOxUcNZAZDiGQoA2I0V4RIqMqUofM5ljH3NEICbhIVcD9mWCwzcdZRt7dhw1QoF94h1wnc7WRJtqEQmFgkoM5XT1Lv2tFtLMPlEOeXLEBLuiHqYGO6cLJuBhIciknKKpENxiCoiWXqInsvNwD4AD27Z1kGaEOnhXQ8SHwLnmMgdu82Pbk+A4MSMUQnjN/hIEGJYY31pCwlF2DrI1W4BzDIEL7oVAcByhEKDEyQ4ZxMDBZq8uNbSWsQBI8xOl2Ps8gUDUC+rg0NhMYGsH6QrBJTNd1aCJL9+a4KFVpRjgXPUtq+mnum8Y5TioycaMUBDlT6SHE2STpbM1AIc80Ozgj2FhBFoHp8z0igpF7UDqOLZmhBI4T+CbmbZop8gcUqX1bplukU+6AqGgV37WKKdFi4RqXTINcGA2FWgQ8fqcTicCTq12V9k34kA1raure7rF9rTZfJDqlfZ82rslO+q+YRu3ZstU5hg4PtflPJvZOUx5e4wR6Dg4tvcEzRyfHVGBQ+6bJ6SooxXlpGV8tkN+z+EgBpivTe6ByLzFGrXZYyboFD050C60mAxOjZLcvsZ74wpw3oWgEHzRS+W+jXJckVdtUM6WDzH9VDsH4iuoUqHMWdLA8VFPloTz2DYUAvgr0AoGFvylJXwOP/BPkq2hSAH8QKgxOCBksKap0kvemgfWkOc103KlrwZt0eEanS+Qs4EV0yrBQ3YKabVoBDJ2MHVT2hAgu2Ioj+PgNCTlhC5OSOLlv98GTonOnZDuGuC8AKXKT/cQgFdasbVjCQ4FLWVJANt5DZxfPZGsA9BiWsASxtl8XSHADHoyQ8H6XCLn6prm+ITPH+N90HySkVTYUv34QwQHt7fVqsVHjUCH3ZbS46I+4ixwGjo4IZ+zgeC0vrXpd6slexTx8SnQrPp0C5KamktPUrQ1pjz1+wCOH4nnVMj0l+CwJzo4QB6MdHzynKHg8dBJoCsEXBWnaBAJPu5bAzc4mkXeEyZumv1msm/NMb3SNWpSTfdgiInSMZu8JgZPRWySCDi1bHDehVQyVZI0+43guLFmXEg5AM7DqG/tiV5l0PdQpzVlDoGzxrOZwS3t9U22BgaoJ8M6PD6tg9PEmDdqBNwWdTTHJ0ZC0YNAyVJZ4GADP9EBssWT2imLPasjX0J4DHgeVA8UQzebcrQ+St+sENS0kZAa5SA4PruJM8ABgWRTrKUpwPERHJUsAHe93RepUdIrDUyNcbzH4FvzhVdaAweyRdbQzYDsT4vnHBM4QFhIt0vpJSCDuuBkaIOCAo1PWq3InMVo81ctiayopXy6NBfBbc8Ap3iXudKuqbdJcGx7qd8HGkA7EPNr4RHYGLAzTJ9lj554sWAbuTIFOHZBA8fpPV5qCm5Gb1hqJoHjgVdTpn74KoeAwMFwHqlrcFp4TuYjuwDFU7Ua73JfpIkIgnLcjBGR8VFEJW7nuCngdHRwakWlWH35DuCA5n96xYxJr7kEV+yjn8anBFAOzhNUD+C2joLj8yybJ5hR4zmFx5yt9bf7dsX2VSCUe6hxPY5Qjg4NEKbQ1oiteUBYaOFcg0Kng7PEHoEtZb9v47w5pQwLttaC1hPFSAtLldVX0nzRuvsGDdN5KEeOaLlTyuHikEpAzjwGDjhorito7wPXYHfrNTKOY+7SWuMh5CXwEBwjW3OoBJ37pRlaBa9f5om22x6vHUG5Y0M0hz9bckT2DYEjyQv1BaQcIC4wQgkc4YMAO/RYsrVr+ahwwI1QY2a2AMc1+kpH5xAm5TIROKjtjX8UOCXdt0ZhKexaUh9sniHJeGCo+CCBmS7LGJn3hFEDlt1wG9Oj5Asop6F8DFs6pnFv2c3Mtpsop7zkdB5T9oD3mINImQT+rwI1BmETZIrNPdIOpcQxm8iz+esobpxjrg8+oRx3iiB5nIa2vKuTtinbyQGqwImgU1SBsKTMi5oCJ5tyajFwSotNddfkXdTxWYO6RyjR2WxycFAgs73He51kgS2rZqVotjHuQvmxDo8psDczcKTM2S4zJblhE9NjYPNQNcodryPCOU0EB47zBENwqI9DOg9iQ/xMqws9Bo0OcxUAmSWfv+2FdzbWCqB42QvPwuElIPGGNEmt4WWHTwTHLYbtBdla6VaLc9sv0nWKRhZ1Mx/kcj6yNZFR7mieZrNGE3zL5Enhvi+0Ho8dco3Cjdy3yuXt7bJlbfe9HtZh+yJ/AIsS4NAdu6mD4/GGBMeYiitSsAg0zBpJOpVrW3NNXJ2EZgwFrDesluapUWasuJiqWPOoF3awx3SdWHfc7wMO9VcxZkFiI6b9/fqDqy0EpyCdZL7vpTQGAH8ZUhVuHlEXT59ZYszIk1UGIGl6PdQJlpao3gpVu8eVTsGXhSBQjMUrD+mwHskRh77Cb6ZgU/F89Rfn6jSMtIikETKQ+ll3U9uhp0VWUBPHRlX784FT0sCZeza1+iGa3yjKaVEn3MH+/pSp0k6FvCgiTWnJT86mdQicNSzXtB2fOAzfWRAuen2OX+n0/EhhzhJ7zWvq4KgjPBFeCDR4nnBiTL5JfAVOQVCO1gWC6pMJnFA1aZhDbEOTFOjeATkJ03hLr1ngLKgEFJWFpQ1mxHRTCQ7bFUgLa/Jgsai9SOZsmCwAJiWCoxbytr5ePGX3OrbSoBGvx52OrV4BcBzxWX5fADhrHO6U5gcOJzfO4ZyrB24UnJAnFUInKRzO1J1dfN6l5kbUq436jI2/KzhaY+2SNpsaR85gJ639AQMHSjn7WHiBW8LvZidtY5zra9S3QY89rohk50qh4jzmqjQnk7VKp6LTjl/oVDRsmqBKy+Y2x/BPWv2kcsS+/phrJqKfB9UFnYTmztSoSUar5hI4LT5AK2vOnXoD5ifSOKf2bPeNIXMWb7SmSnh1cKgDYHswaDNwXr+u9j3qNSCDJxAYTm5IQ4YPJNXY0b8Z4DSXvEKv1ytgGan/2Kn0epXHOiWBQhDvqAJ91CoGNseGKoBRCNvTFIJTpRDI2YM04hXjoS7EcYBfdd3UOZA04r4Lj3DINXxsWj+c7fiMgDN/5oA5hIs71CkLtx5yytln4DTLTFZADQgFpAWH8ZzjZNp54jip4Jgyxnd6nR46Nhk0nZ7jm5Wh5TRwTLrRTuMYE3GEyshlzumqBg53SvH5u9wVw91utXS/Iw+kFGkqEFYzt+cBx8ghWIR4SpEKHukAcnN1qiXaR5nDNIKmlDncWQamaJrg4ba540XVhgjlIPUwNbD36//82qtE5A+BU4iCg2wNsDlO0xcj4FQEONpWt3CwGznh3XBB/zANt8dOBnMoBN8GTjRMXeKTwlysWWXgvN8CTwkzvG1hpLNF3TOepKJjJ4FTSAAH4JGOs2hRdQLlOGiE2k6qxEPSjoAz0q96FTt4oFwNsdHrZDF0sPc5NieazqKcWutLBJzi7ShHJXhQnjcksWP63AN/y3F8k0UdUxgFHDWJHYPWgKfFKWetbyUU7G5DK8LthD+UU9iaZ6fJOxCIvq87LpIoh9r18iZofN7vfEu03aojOPVBNOMzBo5OOSXT0l2MrSlwqDyiRcndhznG5D0THM7znUSljcf9vTU/ztashZpElJecuLqBmsmTpO9FN4YjohSO5iGIbDC0O3PRWMAx2K0FFhUfQLs0dhSY6r4YW0tLuk0LV0jrudaV9eCY8Q3t8hlne7PZdAqah0DTya7X/IROa2jH28ojaRqpC6wEW5cntid5kBxyCzjkI9XZ2kmsj9aUnqIXp7tQdy1u7fCG/jcHB0epCR4Uz9F0jYhTtTQf4YjuL6q1L+athsBbpeOzYBIOmB0O2aOxDeQF6PG727GN5Sj7Etvj2NG/JxxgTbjWYiyNCxteDqSD005qclZz9Z6EtTgOOCzUrZm9C413jAtfnV4jOTWKe6VFOZ1uhCZVfqTqA+LPXXkYiuyEkq0VqAQn0sDRoR4qySp1Cs+7xTqWv1JMT/RIexCpfWJjANAEx0dwooKDsjhqMXCy5I38OH93+C5/4HRSkgqRcoo6OPHw98xhgqobfNcVTQx48hbUSU5PttiF6m4sR2GDYWo/2dN2TPL5TteTVO3dpzYFUJ7oGGzt2PHHbTe20Ym7v1g+DIFzMAscXkuXHgPPRkf8reuq6bGy+yczQqHqE3MKZQMn3i2Kp+P6aX5Qm/ss18SPtTWTb9EL/MUn+L/2t8h72dHW0lx6/OZxINfE83SFAMCRJW2qK4bshVOsxezNmtkWN6FbLg8Un349P+gEKbnSMDeuZYxIyMAmY2aqHAMizhTmtfOZNeC+KSM416Jl45ojQ5+4NWt+hqfNs+9oeZmeTlGK4DeXhDIhTpeCbd+Q4Z/26dHpu/N88Hc6ONxDEJt0PXt+bckIzxaNgT6QVIzeNQSn2Xek1wadwddUgGubQuiauktf6x4VbMYGHaePaaeOr51rXOzxtWJXkYfwZ3YE+MU+yP6HLga2js2xQTdrSuo5PEKxRH5a9DOduItvfDG72Iment7kj/6eDU4xno5bmvmtpchDOR6pxZt+g7k1HV/1m84LLQmGZ/Pre0Vl09BQUFQJSiojwYRJgb7Z8AZCc1AE3aR+N32eUiC/xRGxTnLHYP0cP7ItGCb/XqP1NyIMdioXPvZVOGOQQ8ow8zSbRN7r4dXXIBscTrPoWUUOyWvr1M/kxTmuUEJ4Ej41ouxSzj341d3wyvcPtvTcQPTd+6akcSir2ffjXYZUWhqS35oMx/j9h9AZtLlmr/EGKSrqyQ/kC++O5xvdjCCxmt6/5BkKtx0JwDF4CsuZ4EQLzUoz3FwaI3Kv8n9ngVMU85dEOi74tCm/cS6Ng97epU+KoQhici6OzAPHZwFb0OKuQboscCu/2ff0LbCX+tLCbEZtzSb9cOi9x7IkpFzul5u2E7FnIO/Al+io4y1J67SpvqFphsw9TXPh9s4BBydWoJzM06JSIPk50kN7FjiCGXGZQ72pu3OnSUGfMfF2nrcGB6SRvdilFAZNVEgrZhIFDHBUoteaD30lWDzIdV8Tmcuw4zaPiELsp4ntbzgfdDhGwOf6feoHGvUNCf+qg4wS3qbsUvA8P8RibZsXOxqE09fRcuCeKrx3Vd9MM29CDuVMktWJ6q720O22b2aB09WnJQjNbQEXuMqoJ3Bk8QOAw3C6OHDs6yee8BBg/SZk0jT7cl+w6JA2kCFXgTwOz+GCiJGB95cFhfI2B0fkUnlrNvYdiFOO7VDDIRoA4zQtIC9yL2AxDxy/Qlk9EWDZfbBk6zADD33vJuhIxWJ8ZHtUeyopKjFMwhJPExlngPOOxvd1W7XbJBVG1WkxbyqnOivicOVTRjnXqAYcONfHUIlByZ2Uf0ngMFzAwEAyOK54VrUMyaDUS5D9GdrcSnDUTe45TGA88eyUCR/I/dCVWWVgQDLn0hKGqJtwfF5j7xkfh06gT5yIt6jw3k0XOVruoNlUIzkhRysU6XbdMJNySKZTcK4WH2yZJNwStGzplcaxp3UdHC5zrqXMsZFxOMfkMeE0sATNUsvg43/YfHJdWbN2++iCxNbcIAd0ylFO0Kbd9K6d5KiDKLsCzcsHyrnmh2OgE+VUoNF4uWmqJc2maaY6MMpnOSze+UJsZoJT4mpWjHKibaEkQcaT52Q/JNQGXDnJNeTamndtqF/s5sRig77oN+hj21vLqlar4OVHtncMzVSsZ1bTppSLGDg+2/El3sct3qzQ7/+FwRxHRCaAmZXLcDh6fm03rV2m6/U1bQ1bTMZcRgfLbk239rWomXQXFDW9VvcD1KLygqu5aBMmgfOrKtjlIRwQO7Wamw5OSbekUs1T1xXt3HneKajSXVClzWR/nkfGxL4nas7Y4yXA5vWujI/ZjJs9q1b/Qo8pHcDQeZuM1UHdj58IDjTE50PHaPORmVnVvioA/qtahabtPseAPtX34y6J98nuZ5iJDEVJ0gkajam55JTG513zHWivZ4MTihBOt2UMrIgriKXkP5l8D5O5ZH0bpJyAA/R0y1+yl9BGoYEPkr81oSs6I6HHzNpgJiQDZ4jCRZIGoxy+mx5wIBOcPoCDlYTXcTe03WyW2Sevr2Xq4LVfZuA8U81B7f7uLuRsPalQ2ZtDamIUm7UnW+/byUNP9ve7Nbc1K5xD9buUHaVexOLScHkWOMJudMNvbBJRpNRhYSNBUhfkAYHjE/yJa0nOLpnGhrMfYK8UAjYOnyDC8LU/HYs209ioLVnmgPpM+ywza21IAipLOju+9h4CV2PK2fExdRsH1S/Jlfc+TJhGA5Qj0wOzwRFVvEawBxnjfOCgq1KfXrWg6lbjjZNwwCFxVmh55VKpe9NP6zWMO4L1nEswVmC77yuWD+05/uKTdbAyxzQPwebvY0lJip8Zs26lJweO8dAY1MMkFmOKoBAcUzmwVianL6CcrlhEBlAj2iVew353tUXYaQ95V3XYCv5OiKB208DpJYHj1nNk56cGiWrYiqdrRAJ5RjfnozjFTDWtQFrk4CwtxYLIHq+q8XB4AZZ/MuVau3PRX8ZfWPP77AjO8XGlwMe6oSrO/tz0+cA3PpAPfkJyqF6lK4+35BmUC8wWFA7RJBk9B7EzPRtPedammQ7AwZmZNiDBEcmf6IJBcG7moByaMALryxcYfQ19I2pfaLUYd4KBSS7PJTXSGWDkD7shaustSHusa73fVG92Bg6ODkj35eO+QxdciRn3rFiWSnyihgO6MBCp16kBAjU5B+4BcU8IrYQ/Z0q1s4YM85o6HzQjR/TOTkLSBOISnzwrMxxcNdHxRtzkwONqyeCoQRPvdHCw4irhi1CQUE+EbmxWWJd6XfITx/xfs20FgrPl2UwnoO7D5NEHl/419/Mf22SV2nHO12waT9disTMvPd4z72Cq5tq1/cTjCQfXjqA1ONFrCj74p2Hy9E23FRkymbi+yF5RWiI8j7YlgNOIg8OrFWtJ5zCjtYcRDhSnIBULqqaO5BBE1V7UlTze/k4GDGxHONcclb8hownide5Fs8W7lUixZZtCFYSQDjZ+PPCtOTw3mpTua4cPORDmj3N1mua3EvkXM8UxOrniCnBc5hx1OjQ/J+BsTfp+3G4yOO5McOQZdtWMMjJZCZwDBs61GmYb1awgfOAJa/I6bVDo9e3SO67lTy2R5Fh8CUbzkKdhAQ9Ty4/FaBg4n2tKKkwKBMwBDnEk8W7p25YfiYMD040YOEEQFNya4QBPbH/jrnOTPy2SBEKntS4MJh0cSTnOQVqagOic4vGW6T9+HqU0bUUMzsFORn3eVsKhjM94E+0FKaemFSF0RS+pe8tJc8FyQbBydHQjBruIHIAkcJiwrxVjrhrNM0Cqgag3bEUA500izkgh4EFJwW3kA8+z/X8IHMpW46dDMTpshOPjCD/fe/r0bBzWiqVYXCYdHN0prYHTQkW69WVdBCWL4ft3ASwdnEYv11hhr11q4JQUW9P93OCF0TsjJbTJR8rpcorVwUG+xturYFNh0Q1A9jrxuREKmpePDSREroBQG3hWwHVyptN1LIPgOOFNlfiLFfHua0qNxtuE19x5GImj1gUYPm1CalQxC5yMps4ATkkDp4X6LccmPC10Gg2mBAh4goA9ywUqnqN1VG/VoqG7ElFOKaF2W/q+Xd53oBQBR6OcLTttY5Ws9vrNSOyz6ceNjnjObVMLny7NztCFd+pv6/OBVBnZbldhy9WvuBSjnJI2Z8AcLgBvKEU0AtFUgFHOVwACRhzSWoGnpp0jdrLVqkWjDhycYqzngSEYQwmONtWUaI/AycwO5LztiWaf047DJhpZBZHaD7MEBDuLsxeXzDJRzd/qiYD30pLKaOA+Azv9DA8YOGDTR8ZxmZQT9dZr4IhdqpngQPbN8lcEovFyJaD16lWCEaqBY3IvYmtF1c0llvBTE53foGZX+gcMcDw/M/tMWPA8t/latHDgmTPHwn9m+La1CboOT7SxY3/30eNzLLaf17uDXSOCqg4PNK0ZlcER31obzXvN0IiDU4q19irp4Bgd2GLgBI1X2lLglPSkwFZ0hI4EhyvGRmGIHHjIGyYiW1P9b3RwhMvyGJTa42PhayGHy7Wjgssia4rXVhH/w2ozrlBFqc4T9qadfO/zTEGfnDTcoYP9QPAbr2lID8Tkjh2MrZEP6BrVaDrJA+jxGYau7priRqhka6Vo65sI5dSyKUcDJ1jRwVEKQSY4ZtmBakGgvhfZmj6gDO2cNrK1eRQx1fWOsLH57jp+WTmTI/kCSBH8ro/EMOU7r2GkMnbdtXkqm8ehx2+YPU/+irpGha7wJtYywCmWDDangaNr11QNN5JsrQE8jfO2OFuLgmN07owPn9Ji1obN1W1FwOm2T684d5kJDt3ZOI+D521w73RfguPEQLjm1dcR5zRJEW7K4FAy4mzXAh3uBbDnMG1xNnUoZ0Rg19uua4BjDhjQYscaOK6QP/AQPyYp5/81xGJ6dRY4kahOrSV1uAR13kjIIgd6LdLm6/Ss2X/45HhOyvF4q9w1nnaJWC3xcOc1d+5EIOW/I68ei79AhbS/Rn2nbG7OkCJ/7Tjz3DVXOXT3rlMrAe7eBa+0KXMS7BzDCI04tovFCQMnILam26EaW9NHrEhwzGbJtWIqOtH8um7LVZn2SDnT8TK7873rOfmazfM2HYqxeDS7w5YIOAoOA5s4OBii1ipBSVl4QvNIqbseo7rjecAZ5OqtWi00V4xyYonMOjhYjgOmDfyj6TvhvdObr0dZ4BhTPDLBmafYvYjkDvHpFk9PaNXbV17zL++4Mi9jg9AbLxht4pBiaqGqZTLr4Bw7aeCoGhucN4Vd9ZtUWUgjkO1jZ77qrKspajwu9r0IKSyKP6VXeiY4RRH7Ep93u/Ups0HznWAGOFKV7tbiGQMaOKXZ+fNdGKjcqquZ161c+wwqkubzpQiFwOHptpQ1C97jY1FnHWVrPDfq2DakB9AdlZoIjVmAgwWPNDBnTmxgCgjMz2mJKzOCbYngFBPYGn5WsETijaeX+TxaoSY4QSzYZoCjKwRplFNKytwGpgxSsys+5dbHV+w+nQ+cyjWNqEae9AQ60nELRvnvnVihJyJ3zKnkWGGm5AmjHJtMTb9JM695R2P7ek5wQsr9phizqrhdT2NrRW28qpI5QC9TmLe3TppF+/TyI4DTMEsNco1Aum/U0aRDLhGctIQoAx124nU3bNWpzT92UT4tHNhzV3eKca044oDxoGv7CXQl0DbacRI18PgXXGt1jtBS1MGpypD2zvWA+bSBSuVgmQ+a6BrZFTxNo1ZLyOosmeCUVG+G+v4+D1S2p+3Td3mmEQRRcAJm9wR6DkHRBKeYBE4xhXhLkeyoEE1Rpo/AvEP3FEJZlLcxB+k4Nln0x9ToxGlCertnfNZxIsVPQmFAm/GaYjW6vo3gICfDjAMbhx7OjU3l4D1RTg0EBoHDfoeuYmulxMHQGjglAgeG6+Ig8RxN3z1997GyEsXm7xzEQ1eEh0A6KbvKeCFzqpSgEJQS7xNOTOChDsPuFHM/KaunfbaEPsmUNlExneCaOBUHB1sce9fKijHCm5n+Ol0qPaHseQmOg81ws85Da+rCS91bdZFBEVelE+Uw/f6iq9IADvUEApQAnE4UGwbO30FwfuNGHJ9d3YDhQNVameCYriToFwvg1HEqE91u6Fs7g3EFMknJnrGrBA5W5HCZI3XeGU5Kw5l6rT7iUV6nT7lR+HnPjnk8pZuO4hfcy3aW4zPb2gO87d11bLPWijo+ze64cQ8BpYnCWMs2Q2awXw9PL79GCnY5OH//TcE2baYub4NjVDBkgJPg58McHgZOS4BTKq5eHLCbbwmKAyFL2l6zs6twn3giHunR8BZo83nNpdYxjfOwVYWoGYQ45qGIa56NQPXAIGzQ9UozyqmwY42fw5Mna1pSiMrJ8ijCA0VAh3XecINtqMvdOK7yEMRqbwQ4egagy8PUpI3jBCT39LTwzk4B5+/LyDwxBY7mgIkWiyrrN8ELKyinJdgae31UYGybug+zrXliGym5iWkzWJmBDQpoPLt3jPzomJTiSmUO7cLhw6WOeYsBmw96x8gaZLzN8JPT/eNhyiNvXQz61bRLWptLupcEp2g4kItaJ/aob41tOU8mAKP25t3BS9PIUeAUI+Cwz3/5UjNZqAlOvPikZNg6XOYgOJxJXhQYOo99cMhgNsVsviRSbiCbmkPlw6CQY+5Xmwsc6hUJo1qhTg5LS30Z9ZzVfUJP4vHPxiGWtgBL6/JtojwxDk52MXPEK63aGXS74XLBaTDdLJiHclwcaVDTQrFgPLVqaSZnrBkL2Dl1tHPgc3SHjJ4e4IQv7OntRxKW0vbGo5bbIj6z1C+XfZlxsLamBELCIrEhIwpLUI2jlXLDONcnM0TWmionYjQ3dqlTVJtmq7TCEQfHnTvBA2suarKVuwhS3hwcrMRVaR0cmeHR0nLOxGQlZesnF9RHtGy3yy4C58636sSp3XtbT23h2aKpHjN4CvETHPEAH6QNKvfFBCmR9+clxqF1FKgXe/Ovct8TrV9xjJ4/s/OEz6dXoMw5GaPXA7sTwjXVeZ1zCjjRQms+Eo/2EnudyQIfZudUEoxQ/PmuWDOyfTRwIPuzy6ePzZ4XVtIaLOJF8IXXwsB5it3xn4jsFn53ywyOY/HoWpfw0N/pWsZ4nti37IODUD+JcizsIiG7TVxjRwl8iIE2aunBO8Lb/onwh2ExGNEMKmzuPBmfNRH9cWmAZVeG7LLBCbk0wzXRweHAQKOCbiucG5wiNBYlpy32jJpOw/A9sDXb1sRJcmFASuwtxf5fKP3J1N3n88BSySJmfL4/nbCrAYTaU3RZkvdlXnCkPyGksVNd0UwjBLbWSZY5oiZUUlm9JR+yGyMM76EPdoqkQP7YMN6vEq1m5VubusqnzsAZtMfvnzo6OB7yuPluej47x/O+tVsU5Sk88eZtQ2UYP1fv7+G1u8x6nIbQchinUDMR1HLVpGc3oZmn8GDTb9opaEInwBmfnF0dVHodU50myjlg716FjqIMAWgCja0rceHg6/EYuw8PBtMpmLM4orwdXVOmxGhBjraYYprL5Zgd/IYZW4dnZ5Aos4S9GZbkPKI5ew3O+7p3p0srRmCPT+hSYVL7lG/JAB9OoVNnyC0XxMxc9ToMd9+nmbv0UTccs5fpM+NDtktQOmzbQQyc/NXyDazlk5P3F6en79mbx7TYIQ/H40P2E1fuzQD+kjtkUL8Xiz86Yx9W68RcuQe5k5OlLLn9bXuX8vyuEJIVOmdnJ2cn0WVcubELYodODtmWMQDERuK25g5zg8P2GPezf3bSxyE+vSAKTuegcMCMkIMtf6tQuLoqnLGtPMOTYAeEX/1c/4QPBfC3trb8Mz9ZuSkUxI8tXE+fwk/+NK7qRmW7lg8bqSgwqwfkT/FAlhLIv6o6A+1t8ktlU5A5lv7Gp2zZ9osXL/C6Xrxgj+Ein27pb0k4xpbP9o2hfJbLMfbR7zM6OTmBhtf9E9res6urs60Dx368pqHDwXGcg8pBwVuy2a+rrQO2+ezr8Fu2nur95ig05TjJSTRgZOKPg4J8BV87qOBrBZED9c+s4xnPZ8dzCvi/uNQDumBoPsZePRDvgIsvFGJp8tgw9IWfcFdv2VtLS1uFqy163/+Lg+PgtDRohbC1dYBDHhhgYsEmg5p7TK2Urp1/JNX837AKt65hsEXfzGORsY1VY2x3KX//gMBhW9uJgXMNM5YgBnywdUUDuZIW1c4sAM4/SSn/piXASVZPbe/p1tXSFu4X46ONGOWIhoEHW2d8zHPcZ+xTxmVhAXB+4mKA04+VxFKdBRNKJ1s8f8urBBFwZP8ZphVgjwznRRwcbwnBOf4Jzi3BedJvvoiBA14LBs7ZFjFNBkUlAo5sY8/Y2tOnT4RKEyE/cHQdH88JjsyE/v/gWvTC+HymtaYf3VQbe5cwfW5pS723p4Nje2K0XYEpBI7w1Du8hylFrg4OGDiPEZzHzne4gH8/Ire/OE45a01fw4UciLTTDJ0trQKyo4HzpGnzry4A5UBTYWdtLd4HZRHKEadfKOiKdeG/mlokIAXevDfGIY4prSSKHQcHkn5imwpsitlOzMbU3t2R4DiqDPPg4OrKttMCLezg3toaYGT/XAv1soZhwphemuLxY4b9lpYJ6YPKRuB4ZUfQLIBzgIX5SSRt97EksJkwWujnylr9cpP6vXopTG9LawB7DNXDFR2cCjfsERzPTmY/HByYWvhzLbb6XgY4jLaWeI9gdKNAkpAAp9KEflYOatMHV0uqT0MKOPNTztn/l8nh7GxByjE77hpl9v5Z3weXkI2amdN0AgFOz8cejf6Sw9gaNtFIKXKyMUfJ8/s/Zc5i6wW2/AU7MQWcrTPwShccu+kzXcJuVqRC8CuWElOurH3mF+zIJIZjRTn+U/QUvCiICmP8oZb+GFdBLv6BQgE+w1/RP+nMTDT83svGs4iePT9r7RrMN9EFRa/7QD9wwUZwnvrNrWRw2J4uoWfnKTp47Gbvb0U5ZdGWaWvL9w5sL5WtPThb8k9yubMtSAp84jHdjcICW1tXV+x/vra2tAcv+LLXnjx58hQePH3qvbAfs99b8o1X8PAM4iUnZ//gOjk5eX91pV0Hnjbc+uw32BYQNHj65Cm/YnGlW+pCtmAbKEKCvazgZn685Vs5OHo/ubkMgsP2XqvlV+AElf6SDKVsYdv0ZBPLPhuPT0/Hh4d2h6//+Z/Oy3z+6/KFWiPt8cX791cH+Y72blwv8Sf73FPtrTc3p/dOT1fZOqUI1p2vs4yD3rsXhqv45fop5fMv/0ectPgN5//yZf7g6v1FfI3w8pfz+bx4I/zqbR3mTk9PxidbyRNoINC6pfW16uGMsBxvUaRpANAbeC2ltLjwfhyGp2H78KteL//qKP9pZweyd/bE2tnhv0cXhfNXaeso//liIt4+yv9xOhpNJpPR6HR1/I3rz0U/EN7DuubV1eKEnQw//Z1P+aPUkz9/dzEawbu0y95ju/D8+c7Oo8jnVg5y49EoHJ8UEp0Ox/r0eIZVT/et/d3wdHCOGTjXSegUoAVpcRTWDXACwOZ54tSjvb0Pn8+DdGw+7cC10dp59GgkM0ze/OC13zYnOYtz+vQ1A537H3b2kqc97X3IH+mXfXSQa0OGBoLDmzDo0vzYGFSTAY6D5cfHGrI20BxF+gCcYoRyjt59gpN8+/Zt/CR3Pn/MxEZ77/NHjxQ2r3/sevNmECbNcnqeRTsrL+9/SANn79G7IwOccbvIwTk+xtEIa0Y9KxRD2vJZNjhrutw62Go2/S0dnJwGTqD2WNC2Rjf307FZ+fiZeGHprQYOdOlp/2hsNHTUBsNZPQd0VlJp5+XlB+169+RP9trE4GwAzoiBs1oQMmbL7M7vNdUsUwbOKx2coy2FG7C1p7amGtpX/f7ZFj68YTKnGIb1QUXD5hHytD1MSpzAEsmJk9Fy/ugoSF5HX29ORxPcDCI5BAcOgtgIfvNae5y+knZ7js8Yz9thnHBWV0dQhZ58BSsrTGZq06onkFyGx2B47e180NA5OjhEyglf0I4yJM6udLUbi7oVWzPBsbc0yqnY9tbZ2RVTtK6W2f9nJ7nD3MkVe778ftyGIeSDnARn5d0juP/3SpNiF5KyBnzhg8Px2RL2Ko4nRS2dQZ5QvV6UpMPZWjhl+wZbRRld7cPDw/aYZzLKwn+jDwAT54exNR6H8SUy+/BD9K4xHLedQ3Tusa//XZc4UO0xOMz1z7DBVCxhjinHf7b164Xf/JJAhip0GDgDtnNum20hpEqNT85ykEIFz66YBXEF9eJ2iszRwbHtgy3/BE+cVrt9SOlVbEHCXH1/X4LDeBrnYEXMlTN3KPcnn9z90Bzk/eef/T9zDPHc4XRa3BMshMAhumnzEelhe5prt4tZ89JXR2HYjmLTnjFjfTKBz7SZjgb3+6q7/wa+9NSgnecMG7yinLwOuR7CFbFX/8zF7op2nR9kT6ED4GBCYZvvaHvcbqsNPsw96DfPnqaCo6bbQpfU3GC/rjUmphRF6miACZ8CHOBpdCJFd8AsoFOyUdBOOUttSMeoSVgX40G3KHj2o0eMK2jbhGW+7E4YTMPsqYJhe7C/aa7YZ2KFki7c62062moxh7cE49ka3ayyt8A1sXWSfjE+Xgy+iX6M2VF3SPJIzsbA2ceGA121pWp3p4P9wwcnKmQQBecpTrLh4NiQdpqetM724pDAWcl/4NiM2vUxu9Z2m93nU6Sh8Rmzrl+sraFzYA2cA8xSfswegzF9OuaJrYN2vTuR4IwYxIiN7B8bTgebA3ha0qcG6fWOdEIck40N+B/Awc/oZfhGAS18aADv4n9aXeUEq4/7AmwO6+xq2E6eXqGLwPZeYE4hPSHHx9bSnyLrFisS26cDztkUOkyVzmW0Fg7Zdj042cpQpUXg0vZP2NZldSlm2hqCc/T1k6QbRv4DBSizVG+UXyC6vv5xAcUHkFHNBE/dJdrZY+CgovYmF6qGy7Dv01Cb6VSMjNsS4FjWBl/DXWtzMwJOnOhcHZziangI6AxcVdAZ1nPjwzYvaR/dfE29nPyL9zyHH6atuMCyWkLufCJ75+gg624ndHJbIpPMyaeCs3Vy2HbdlAY3v2PNTg7ZmtSh99iFwC2zOuKWNVPTLjP9AjtgWk92RkVGaTBCg8D5fNoGwaxMDjjrTdxo1fatqNMOPcA3SXCs3d1ni4DDJVeINFsXjG2PYdMeT0Pu6Rhl+wqW2ZXvkKtjtT0Yj+GG20M7ieQOaGuZ9TMMnUP/gEPg5A1trfFEgnOwdTKou+nNhwQ4UodGBtA+bOeKO9L0vLg8ejWP7fm8yNgg+zoC54/xJtufgdZ/krE1ACe6z5EWgADOs2ebGwwf+LH77JkANAUcPOecBg4eZcC+fL/NOVJxOjgd18OJsirT0QkYOmiyIY7sQO3xwB3tkBWLnI2Bk3P1/sMxrYZR/4nNSSeiSiM43EXj5fZdrQ+HGqWAZ/n778iMC+gXMJizYtc7HzLoZoXRjVZ7zW6ZB4M6lG7t/XGzSdujcS7Yd9jC339PHE2rgwPjo0DqDKvPGDoCnFJa7yQGzkDcB/xGAIWaXTszPUvFevu0PXUnmkH9KN0aDc4vPxA4hGuO3aqu4Gwf3h0BW0NeXRKzuMT8Ktltk4GTe8q7m2SAs5Wrcx4fTqGkE7rntKDyFi/idwIjr93/7ELG7EL2dGyCRq+AQQ4KZ2AkBKMhB4Xl0R63wMH4HLlQ/sPQ2ZtcjF9zZUDtKogTvL9/T20rw8EBrobgMI1AY2vRTsKlRLaGr99jnI0xVbgQZheMT+vtou6dGS0XDhwZ2zEq5DoCHYRxwrQYdkkcnb0So52jQjunsbUWNQBZb7XqubpLwjVklGNT87EEcIRzc+tEiEmXN6qACuL9umhFXAPT7FLoaWCpMYWz7u4opx+jm6DStMrGoqfW5gBOGn0C+OP5KGT8g724NxkANoPQUHnDtlB4tfYLRv+KopA5AA5JHdTW3MRetapBaQQc+jIQedPRhCn0p6fsnHTXX2lyOtjES4hcWNnq28Erho5030xCuF2FMQo620cGjuKqbm4/x3ut7e/vT8UddnYguljNA059n3trQ7euwMEuCReSbnZqdba5ykAAbIJXgeN7vV4vn8+zn71f2erlf/uVPfTZrnEPNnlKd1bDXPtkGo5GAM4gNIuyCZwwutGmyUKq9AbXpjelKp06lr4k7BzXNIBAKXhzOBqBVAVrxfxMODiDq/ntt9/ycD09vDS2nKYPbqzLDyVFO/UH432uhAIr+eOmnZP9WQEcLtXx9tfBOS5AvUdElVbgXGuUwyDhlEPkp0ayhTv8zt/bcQEcyQAIm1cBpGMnsefC2DW3a2fE+Mf76fjic44RzuE9nUrwviDV0WhxXTJ6/vCNNpdbnAFOEezAUFlA0q03vrlggvDNoLi3FwXnKlHiNHwfLvU8rzhbcTrOvXElWKNPN4xzq2uqCxO/hTc9l65nB9x7Ngc4eNFyslS9q25pAGdPgDMCcOoCHKELzA8OQ2c6Pjk8ufztBLjavfhc0qSZ2xFwoGcZM35xtXNMPe/WivHOPAmT1dWNAE61YptR79nHy9N27k19pBzmnByywWGc7ZEUw+74UIFT2vu0LMGhNp1qZFe3aIJj2xngVDRwUtwfDHDyiL0FcEIER9MFZoLz3PDL742m7ZPDrfOVM1AHJqZ4KUW0+GhLUfmy8m4mtE2KNfKJHln8AnD8o/ObcW6zPjGjB7PBQdrhxkXXAKf0YXlaz+itUVTgHCM4r9LiOVsnbuooSi7QWvXanhAaOjgSGwTn1XyUU5pMx2f9g1dBk4EzncgG+0nj6aPKWsLYi8Sp0RnQFmPgrARfrx4Y4Ai2tpUNDrN3hOkH4IR7Bji1YuaEz/DwDJM6bScjElrIAqeowBGxz4kEZ0+zbwJIjutpi6kGX9m/ynI7ia2dnfVevQJwBqfxIRpJzEjvfV5KtZhTwDEllu524+B07P7mYBQVVEzZhUvICzWnpxSCQPoKOGdzJTjIXh4t4yjRpDkQ4gUAhzf5jYLzOJlySgkNCTXKwb1V4Ei6YeA4fav84EGuvL39cDsH6/AQvOu5QW69FAWnPT7zOTi506SO5kknEeV2yX0TE4ROvCOZ+rwAx2lq4LwVUh5iOxQigLYB/Yd/5nIPHjxgyvRWoKxRQicCzoflej3lXMSYFK5KO7ZTyAhTK20tVc/hMgdPm4Ozt7ejYcNOs6dliBQOCu/DtpgoGw3Tj8YPlhLAKaWTRQIESbRRSp/iLPHRL5ODE7wCcHKjHQMbIB1u2Ien2BmAl7VcX/camq8Agih7RQ7OW641ATgJ3Wt1qg4PTyDhk2FTmQlOJA3FwNsEB7W1yV7MZwMKNf5j6zy/PErRbJ9/+Hx64t8SHH3gxe+/p/UgTztINjiXSbk11Jvsw7vzQJtzE/GCPtrZKUrKeVsywUlR7hEc2xEeggy2lgaOkjktZaAhONNJlj8twPycPZkDYTC1ncvzq7Nbg6MxuN+1GZwRcIqLg1M9O7+8SMl82tu5eJfho85/2imGiq0ROLn1WnJjVg2cLep3WYhqa0ngFJPGj3Fwaspbg0boqcHTsnOgDGwuLs+Ptvr+N7C1om6L1utupBnsDLJLBKcB4DD5cbGnczUdnQ/p6MCtOHINbQ3AydXi7n1N5DA4z2RD8wg4tgFOmBUUTgLn8OLdHNjEE9ueA6bBVvOW4ESGoLQHA+VloosuFUu3BMfHnE6NdJQ/EP1lGbRz9G55HFWldXAS170cGaGLgZOiSktwwvrJeFyYL34TgeY5+eG8W4JjDhREcAb73bjUvS044C+LMDYCBzJws9E5WRScCVOlCzPBObgFOCdnGXHPd48SsXlL8gZUhluCE9F6wI04GOiUM+sI2WztVSI6WsZtltzZOmPg7CxCOdzOKUBBSdxD4FDrqqV+rh26NGc0YdWi4DAj9ORsK52nvdPo5rmZUU3Y3AXlcMdu2J66xTsEBz0yaehkyp0D39LA2ftwkcvxRrhJ68uXLhNSOUyPg76jMXBsHyMVlgVpRThilH1GLHEUJmxqJjh7I2Y4L9lBJjZC2BjgKD/cN4Kj+/yTMp6/BZzg/DIDndTIddDzygblXBDl1FotjgZuqra/0/Zg02K7zyDoe1FV+oUnqnAZOG7i5HDsY9mqaXYOgHNxr50KTsB52tsIP8N1IfU775sUgmSHYmmuj2fLHInOXvTc+e9U2kFwVpUa9GG5zcFxU9p/QsCQA1BuVmKUI1rELz1ou+a4Q3mJtdqXGDiP3v+55KeAY/C0kqGx7ezkpX53a3CKKX7RYrZPdBFwwOa/SDUEPqQksgA4m8ufnu9wJD9cUJi61vqiTyYSygwkFbQPRaGt58XBEam6W2ftrusmN1/nlFOXbI0x3sLJkr8WJOtpH2KXxcExbNbFwSll69SJYYZbggO+5g+jFKVg50OyCYHgHKCa+hb+Z+DUCZyajBcqeYl92tuHS0KVtitRbU2OMmHaWjc9pZCZ4KECB4RivpkMDuNpEWyUSQe3XPAt4JRSSCQjzHBbcFBn20lQNjEVim1AkAiOtZlnTP25kDnkla4l9Tfm+QuHws5xzK5RBE5BguO6eo5XFBzo543goJ3yqse2NomtpenQqEUYl/Qt4CSMmE8JM9wanITbzNSogwRwfMvKQyr5cw5OG81jBU5Jm/gaAYdRTtS3psA5a7tuLUWygkRr5eoUz9l5BESdAg44AFOL8kxfz61kjjGjuxTRrO8WHLjRPqTLnXfnyeD0VGEZUwj2ISAtwVFZQAqcpSxwoEcB9GU7UeCUSuY0RaaouziipLizt7fzCOVGr5mkEMDl7CWanqWdqB/uNuBE0p7SQyW3BWfJvJzLFHTeJlqjQcUrM3Cke4SBU5+6JjjadG9MbT08k9XUCWxN9Ip8oFKldXD4+CSaBudO9nY+EUH/v2YzBk7A60RTVJyIEP12cOIjluYDpzQvOElyZ0+zRoMUcACd0d7eo+U252o1PT9Fi4uG9cMzCUEvBo7Du7bqlFOM5fd2cVpRPRyNODZJbA0UnFRsYj7S4DYyJx4tTTZ6Zvh/5gWHLikSfEtPPwZtjcBBdCbLy6it1UzKkeCUSObIRgS8t3RyyCAyV1q/QAHOxSfBauPgBOf5DBYdiy3oXunBAuBEgEhT2dL18EXAeSVzOt/OccNp4CA6AE7R0NY0cGIKQVKw7TgFHB3k2joZoeGyZLQxcNBduFdKjBIkmW06OPV7hhGg5choAcBiMYl3JSsCkbfFWaExL5JyCJLBQc42J6vWwQF0lilvjRnxtRR5OAuciqZK11KK9fDo3Xr9vRKCMXDOL9PpJinuo7O1+kQNpdXJQ8/CKJYUXOYo04y8KQlBbI52Cjj+fEZ1MmczwHl19PWSZE5RglOKkvSi4MQ5eKmER2cKwY26/6PgnKeqnUy/S3JGcXCO+hycuAYfDzmnJm+UTGLRc4iSVTojTQqqHs86QcNOBGd+jdoEh6H6oo1FqrUvacz2duAIpY94GwdnkH+VBg5dQFI7j4hfwATn69FXyJWuj9LBmezs7KSGZ/kLOx8mSXUiKXH7iOcHZM6b17mDo47dTwQnXaOO6GwRcF4dFRAcrhAY2aqy1mURcEr6QHB5EO5by31NA0edfgwfSItIdEQxcJbe5ZcPk8BR8mT0KZ9/NJnhAf1w/yLFn6D7b2NKnvgTgHN49e5rIQWcRF8B9xbqckep0qKamlNOrZYwkVhoawuBkxARmQUOyBulDLw18wXS8gwYOGfLn6AEJAEceW8xcD5/GH349Gk0+lBkRLTz4dGHDzufPn2AFyc7H9jzR/CeR+z5ow8Z4JSikSADHKYwLt9sncQVglcyH9pIKlDqm4ZOCuWYvjVjdxdkawY2E943hbQ1rb0KgbMWRIyBuKqWwtMInLMx1ee8GYwiVqba1NGn+58uLj7n858+PWJwfGCP2MP8o0/3H33Kf/jw6NOjfJ69eHn/0YdHTHuNWgIxWjGlkA7O6P3pSTLlcJfhXgprUKnicXDaQpXWGtDI228xcCJ65mRyD9YkDRyiHCy+20sG53mkyZXB1vpnbXfHBEffSppXCmztM/v37jKfv3jEYIHFYLlgeOQ/faann/MMvuXPj0bZHSJEZXiUOQA4h6ejcDze9NMzn/hFRsHZY+jc58Hdih9ja3zgIe4kx0dPW7sFOLwXyb17HJwiZ2sGOMK3FtWh36aIy5idc3IyiINTNMc8F3c+Pfp08enycnn5kiFwuZzPLy9/+vT54iKfv3+Tv/ycv7+8zABEcD6PZsXmNK4SAac+GoXt8ZuzjHSiDB81T4uIy5y6IBy2j7/wzdTodlFwiho0v/zv/fvskNxDkAhOcJ4qLJ8n69DizJf+BHCwJhQ9BIamJW+SnQ9M2lx8/nzxfvnz8uf7DIHliwuGx+jz5c3F5eeLm5vli9PlP0bLn+HVmZHTiDGqgVMcFd3xm5OjhROKCJ2XM8G5f/9/EZ5732aETohofvnf/7B1H8Dm4CQoBFlqZiY2X0/GJ7kQKed17lT3GBtFDqPRMkPj5t27m2X2o7C8/CJ/yR4uv19msLBHV4V379iL8Oxm+SJj6a0mNCVBypxwUnQP3+TSSR3iNHvJtyFD5z77XAJba7sCnF9gM//3l1+Qvd0GHAOZ+//BpVNOHBwjEWKBJKKjr8ttBo6bBo4y2C7y5y9fnh8dHZ3Tj3P8oa3o85e4Pn5kn4Jn/KWPH4qmA0G62AicKdsxRjmHy+/OMzlbarDq/nkSODwSCuDQfnLymUxuA06IlPfLfX4ohvSDMJmt+f7W0bkqJl4Im3OmWLXbJ1MucwCckqb+6kPrR5/f3WJdXprP8/c/pOUlcrYG4LSZ9HuUic6jdLf75flKBYNtCXZO8d6De79weBg+QpQvAA7mEMDHBNH85ylD+QEkkHQTFYKtj1Ge9nYubJjZ8GgENaECnMNTGaTQMYo4BFbFkmKRPZTPElaGFEoHZ5SdcftoLx2dj/krCFMngRPmHjB8nv7nPzr5LEo5SDX8CL88ePDL06dPc4wbJyoES8s3H3aMrC6hZe5lJuQje9jh4KwqcMwqWonN6gjXKvymPmijEfTJm4wu4NXVUVF0HyZewd5HL4zeHZ1/gvetJvbB0UMGAM6IwNnZWZ5BOykp4Dsfli+vkinHZeDcu//03oMHJHrY5t5fEBxISmRKheBnuBj15HJht5UEzsl4tJOYnQa+zqx2S/kPz0t7k3obOoAQW7sXDQxI2TP6AJbM169Mg15ehg50S+ymuJgUL7iJw35/2AMHziVTuPOMd138wbTt0YRxw5v8q+Dz5MPlHxdGZEFTCzVwcvcQHCh13/vw7uWchS1vzUrKi5MIOIcIjtvqjnOMan6Rm4qK1r0u5K3NC06r1eXIAj8jCnp5PzelKfFRI/TspD1JUy0fZdMNdVSQ4LwmmVOKNkbh7hsm0VeCoxcvCku4Hi9dLY8YDzk///gx/3n540tm3ow+fXx58/Tj0WemYn8MgncXo4v8UYGBczP6fP4RmJt51JLhiUBtjYHTZuDsUH/oOcuO3uoenb1JOLY2E8GpT3NPX8K2so19INHpdtuHh/68lCPA+UXo0YBTbuomgJM/ORu3i6nxm3Tb8xyxgS6HbcZJJ0pbi6dskIuAUcyL31bOl1/YSw+X1pYe/v+WHr+A4quvN6BkL388v2TgfP54fnOTP7q8GF3+FgRfmV3KXvhK4PyWCE5Rr6YGVZooZycpUSjetDyRYxRTwelycBj9PGU61i8EzvoClOO67joHR9LeL/dy9W4o3DeaKv31wdl4OjE6XjNUZIPYDGyIae9o2tprJXMilY9k6TAozgvvrwCcpaWHD5euXiznmS6OTfYRnBDBeV9g+3bx7rfzo4837y8/frzi4EBlatyzVtSrqSU4g9Hz0ry0Awn6e1oMGwp2c5uVODi1bhjWc2CG3qfNvcfBCbNkjl6wC3lrwlZi0LDD3H/KRNi0DnqCGwXn6ObwTOt9oylWibG1oEHrSDYjGYV1AGdPglNM8FCWakQ7+fP8xSkDZ2mpiWztD4bWDYp9Bs7R18uby3fshfc35x8/XzBed/7x8v27j/n3EpzVYkoRMomg9iZXCHKbA9WU5LejIzrpIBGduGaOvW82bxSqUiH4wvTd6TR37ymg87//ecrBuVecFxxUpQU4T5k6cZ8hM10PUQVyTcdncHR52j45xD5de28xJ7srOsAWE3hao+LQ1OvCzYXsczg4HNddaumVO51E0gE019eEEU7+0ykDBxrsPllbW7q6ZHKItOTJcj5gsucjM0VvToGKls/z7z6ef736+PHy4quQOavFeKW55kOBhmt16BoFZVi8M9Ho4gYarcFIzkonIVV/xNgM9efqCmY+CQfj8eBUcUTuvqFI6OTe+pTp02BB3v82cH4BtS+3LlvKmHYOFLWuunVomzgRnRR47+TB4EEC3TjNPpZoneXavEIC2rVF+60VzSC0eDa5/5LJ/FUEB2ZlPlbglBg4H48+5t/lPx6dM3Dy519vmCx6d56/efnx0+irphDI4+tauvLevKmvru7U6u32Pm81MgrHOTrpZtNbiTuf3g8GY37FHHnYkcGgfXohh2wocGq8Qe06NJh4ehvK0dgaQ4ZBo6VG1YqTUICDMYLnRWrbCw0I93bC/fc4r6ni56468R6STtOn4sazAdQW7e1N3PYY2nqzh6cQp96fJvd9ZL8nn/JH7y5WV0+XC4xynjxh1HP1QrI1AOfdp+VP+AIjsZfvjvKMvZ2zX6MoOKWIw1snnH13BDJj2j4c4FntgY96iw9FW2rE5c4B21WYPlU4o65zeyU3Nzgc1ENmKDGdRICT08HBFsMMHrJXbgfO/f+9l5uuC+c2HvOLi+0oKwqb59CsdIy9J5npOh4U6HwqS/ZLavmvmv8HnTXerygoDNojynSEHp94UfeXjWEpZqZAiXxrN++Z/YngwPKvlj99BIVgxBWCi1VUzkajT+dHLxnHBWo6eqfAubkYTWJZVCWR6D+gr6dmSUxqUH0p01euXhJPftzsaJcTrKywZ41K+YBgsnP81Ov1w8E0nLCt4YWVum9N7uWE7W0OzZSFwSnyEE6kQxZAL9rlB+f3P3CxMR1Ag2ggoNybAp1qBSbAR0aVOl7T73FwNhm9tKfQDXMwxSZfe48+j/XOxdEcFdjwr08hMLB8c8YIB9qIX42Y8S9U6TzT1hCc5dHqxcvg6PyP09OvwdHR5aoA5/wde+dokly5KHoXc/bcHpyM96fUmZzzgIZX9mJT5WzfEuBs5PCa6vuDNu+ru8PHBzFw9ustEaYW3zhh3I2iO8XbgKOu43c6IFQZuHzQhObrZIyOzz7InXD1vmMn9pZ3GsI6Go9ROOUYA3jO+0pDk00pdoQWIM5hdHm0cv6SqWCfRhdXwNaeeFvvV1eX373EV5kRev6ZwPnEfuVXVj5+Ar/N0cfPRQEO+/zLfEogDof2vFH9MItq2MDJwRFP22gmNsznTrSe/6ec+BAK9fUDDhDCdvk8ZmAqieG92b61ZHBUuEHqNV3B1vRSVuDLdZqfMD7jp9pgsl8t8bipgUNXz5jHqgBnBN2DqSO7aLODcxSgIxCzYMBL8zHPwAFzFNZ72OeL+/mP8Cr7/WmETp6L1SK8+f6H4oT9urwoFj9/zC9PwP0D2O4U1XwG1UMe++UPVN/k50XGcMd4kie8r19QURfSb8pL8rhszft8hsS4rXoe74wuGTowaMINia2ZFgeFZRYFZ8LBibSlJcfnYSE4/0PzQz9fdXGOQn0weHMgvDrlcnR2Rj9nCbZ2sEnzTOp19/lzDs6j1VW4f9+8kY0Q3H05t8sFf+cEHZ/8kvitg1PeRgaRwWN6jf2NzNcJ/WLCqThRR31TF98ENIuNEjVFG6Zq5NglbW4JtlaNX1K/bHHV1RGXlNOaMT7f2fnjPMC+0qvg+KxFOvvSPt8GnHux3PEad9+8M7Bh58ATfMKxlDm+VzF7/r/sdCq+rxSCe9TzsfRcuOEewXCmfYXOBEW0nD20GhmyMiuHTUwciq22NtKIwFlt7xs9rTk8Nbykdo4rBEdb/Yo2rJHWb075mjdhzLVFF8tIW6yX54Vxzl1VbC2SBHA7cDTGxk+XKKd+EyvPx0b+7LYenJC8bPaduNvjqHByhsNQt04GIU4+KAlsSjt/5OEun/I5IEAQ4/03m4eMUTCz4c1hOIIQAJzQRJ9vxWgEn0xGIoOLHoh3cpKaEDUhlTFwBlN2gzNO9mYMrzBs5PCRSAIxu6awPr6ikz47S/DidspNUg3YJbFjQUZdNIRwP19o50RNqA4O17oWZWuYhwChBnYv0CXyzqIEzr14Xid41HZGq/VDaIq9Xbb6vXjK+vlNex8a1GA75b3ogMB3I9jHKY2yOQ3DkzFkkQHBjMZvckmjpBLX6qy/HzKk4YrYgzd41DbdECKj19zc58VWbp8tds6Dk3z8huv0qfc301dD1V7fSJsaff7MS92/6PZBGFKo+Zd767cxQu/fyzGN/Z5ER8iceihm4b19KxIfedvBi4N8h6adJmBzeaGa2O7tlYw2TMyoxwSCe8bMNkrHWVWcaD99nOQ+/M8f7u/vR/6ov0BsUzuqGtpT/JT/8DzWqY6viyQfdaPz229wvQfLo5Tw286nG045X7imA/kZ4WD6gBuhtwLnPw8eLEN8el3oBpTI3qrLyQVvjTjT81HGYE3AZiTWXqQvwaf8eUDgTPRph5ttkjTumzsdbTi+xxuiy8O+EYMgiuC/29kz42d7E37aF5fp4xsDY4SGsT6JDh5fMEGSIbO+nntw7+m9B98CTm75JeNtDx4gexPJvnoHj7eRW+Rr9qiMneR+hTAAJQjyp8KzIfeMTxsYhZvfAxz1RZpP7/IoMQL9nBn8zyFb/bdgvgEn+vqgwCF+Bp6be/dfPn329FvAWXqJ/oUHD3JT6GQmKtuKO8nkmz3G5HlqvBTjPvmR7E4uh0VSrtTpOD6TMvICf5bwtjdqNqV4kMNpx2RVvZFuCeI4l0FwlE/vIPnhczY6iZ97tMx9a+A3DqfTKaZ43P+PAOd2js9nDyg16v79p/cAnQxw9kpZ45mgqW8qNnx4Vv5UDfqikW5s18YQ+hsfvhkctu9q5ZgOOB67eHx+1FB5VS6DWAO/t4bi8kfGYNqUxn+PeLt8qEVHZJCfPf3Pt1GOyhL5D0MnJCsqBZwZ8iZGN281bMjEPlVeG9TRQibDaW7E/pu28CVN5rNw0t8DesAmHpXpCaFpLHBwXmWN297JROez8TmuzH5S4IT1B0A0AM4vvzyYW+bwgT1X3H1DoPzy4Jen9/+XJ3iE2F4lGZy90XK2vCklF4prAxsZOCXTfK7vC9Vr301sLJDSVa2UUV+g/A770sv6uxpjNXnHdzk1H7q0k8nZdFTfKnBI5nQZL4UcAuRFkHH2Hw0cMhALjh0Dx/aYvv7Xg7/K1qFGOZAnAguY2/3c+kSUutdi5QQ7nz6mY/NRt1nfGmMmJp9knkH+VBXjSt+aGksWRS7eoTkaOk18S3TamTGUgt2U7/SR22+TbqhMzmbm5GjgwG3wpRveA3Dug3Hzyy88tRDBGQxoaBI462LgeE2rWq0+e1aFqU1ubSJzCmXimgHOnpERVHo+SxdIbfenyan8SC9Jn6Orml7PmdIEO3nsVNrYg6IEJ7Ph8t6Hz9lyJ1rcJ8H5UrxHeTd4xwt5wTg2Ts9iAFSH0AwvOqLFa26Xt9GPd4hVBuuYJPIfkcPOjvU0ARxtj4NbYaPnHCpwStG5gKWkBmqlxIEFWeBEquX12bAxcJjdkoYOkzufz+fS2d5KOwfD1AycMHcPc6JENi34B9ZBBcod9vt/obO4eRBpr/LEfmzz4JGoMgi1jFzA54EEpx4FJxOb3/5IvQN3DP3u46iYWIVeUhVu8X5qcXAi1fmJiJrv02viFTiy0uNtvCN2Ju3AsPeYEcqbRBTvTZWORZnsoagysHkcL9pvzUvot1YsYpxOUh+VgNQSwNnJ0qFfZtQfmJ9DyknocFEy+zvNhY0JcVrD41iXIwMcydnISWUgxGgng7N9/GzqplJb+wJOS5HFjiU6QDaRKoMXs8GZyGpDXmuAxVPR7rizsbk/l7zhlJM+jiihzXzaCJfElLSEtmyR/jn08967wJQf1N1XOBF1nW1+T84n1ftmwrHBSkF0/EdLQApbM8GRdaCySgfBcWPg7GTyNIaN5qPVr29v51MkH9QE5/eEtnalWBZ1NjilVG3CpLA0cNguL+8kd/GB/IBMdD5oQufTMu/xCcVTTymBVuxtPGSQQDkez1vwRZj6Fx7RoSKqX9jxJDgtOdxoL5tuPqbqAroOrbG1ZOsl0sGrlL6SO68l92ONaIb09NQAJ1Nny6Kdo49CK4Bd+nQzVeDcgyR2hc0vTFvT7RzHTpI5jm6EQnUcUF5uGt6TS4EjHZ8782LzNkI3ezFsEsCJ3/V64U52u+lSir2TMg5ZkM7qZRDVjEe306g/q/sSwNFL3SmxaZq7hxrx0wg4dqTfGkx1LxQqx9cVx3Df3MsNcvcU8fHeNwqcndHnLB1aOz/g20aPojim+VExveVgPIE6tamxQV6RFMIoL4yhE0bASfWXzZQ7Hz/LwIiYEwoSe32dbyfbWuG+4Y7Pg+vr6+PKceZAPcO3BjnsGM8hlxaP59Sk3Mg6u/l1AekhiPSILiX0xc9ec7wlofWUIrgYOIxDyUqPvVjHm2ydTXxOaGtfviDpYDgn9+DpfagEub3j89nSSygxYAdbXw8nyitdE1w3i6d9XgybGDhKnSomtveaPfPIbHZj1AGbk0NVX4rwXUItweedvVvQzorcgUc3KocA89hR1qTEc44Xi+f8B8t1sSkV1edQsO35zuevWTxtJ9EN/Rb9Akm+HgmOXq8Z2+z5GujP6BMel2PKQxAkeWQ+3IqzCVQ/aeCEuSljZxCfvj9nyOBpGjgPnorC0nuIDm+GV3sO2GT6OhU2US10L0WHUDInc8rk3azE1q0p4DAaUMNM3i6gswWcswnfGgMnnE4ZME9zEDK4/23gCK82HGJ5uo6U43brGDLI9HV+/GOnlNZ3LU2/+zpK7OZNosC9s1ibau0zNzh6BPrtouhwmcMTPMI6w+bl/V/II/bgP98gc/7z9MEvTC2/T/Gcdey3Bsmd4c5OJja/pdLNXvrnBDhm2VRJTpXapDVIXpspi/9loH7X3WKCvpEJjmbzx5swzuZsjK3ht6JvjeI5T5/+8ssD0bdmYXDuSQ8Q929jyICB08rloPgkyy9g8LS3kbhPKqbI1mRxszmosS03f4OtzUWX8aFBOzQniutN91LAYdfE/WwJXtBZtDNilEPggMjhpe73fvlF+pQXBAecnvdlk4hfoEruKaMccHwi5Vx8/ng0i9MmxD73smxWDZySGaHRwNmgtTA0+KFnzywAp54AjiDZyWUw225ZBB2ms10sA+WEHBzwtWiRNnBMQz7YIuCgS1r2JEKoga0xcGBEy+pNfi5dINY+IYveFFvTKIeLnMPNzWf6Pm/cBpwNy7I2BDixNpKcs12uLJ6Xtjf6nKkb3dzI4qkw90D1hyD353pxYXAok1cGdBj1cJkDpLOcD+ajm7lzp4Kj83dGTaDRAAfA2ahqNID/z70EQNbuLsw905NtYuCkh9GCj2kDGvZmWOPvbmjUH+9984sezqHElYXB4X3w7stwqmojeRDcwvaEK0jlaeeX+fuTWJ27MEsAHIOpbSy0nnGp84wtRjm5MHF2PO92kI4OaNTPE3nCXrbcOS+0pzVqXTzRWgppBWqLgKPqShX5QMhA9JX+end+AZmqm/8cB6cUAYevZ88WBOeZ+NwzIXNKyZ33S6XJxeXLIMMjkx65TucmUBMqwbkvWqTdQ45WvB04JRUP/d//5fGcL7GWXgvQTRY2H3YePYpkwkTA4XJmAzfZmn8xZvZMoWOCU0rIs9oZpbdU0fIKknS2lXnAAcVXNVorzu7xCUNcY2zNLI37BQ+2HusrnaELGNeQ5U84//xhh8BJmDJA4BgiZCFwmKDZ1UmNs7W460FGQXay5U7MgONDkdM529HBoQLnntFBco6+0p5nO7EcAi2SS/hIyklha0ES1cszT6f6l9BKbzY4uxqb4rrXvODsAgXFwCkmZxfs7H34/DKYqYtqFtxbobOlXCMDpy3a5UeKbYuxmW3HCUmFdgI4etdvosJuBjh03m+Tu8l/TtfTzi+hsOV5EjhqcjOAwXiStYva8EIKAYfIioOTkj3Ky2xneDOT7Z2VWeCEAhtjEIYBzuwED74xv/9eig03Mlp6JVF8tMfVXgZPC87v08Ua4EREQthGcNgCIgABv5BCwD5pDXeJeKQRGg0dGLpLOmcLJO28jTpBUjVqBk5ODprgZGPmr2ZNO0xOjUqIjaSDk2jfvJ2pQ6uUQwAnef5DCRMiCRyEhxjVBvy3YWX/42wNF/vwhvIQJMxomS8EDTrb81Jy5/kPiVa2AU5sYxcHx3DYS3h4wW6uMJ+8UXpakJHWxj9ngBOxP8B9w+2UBbXoqC0K4EzDyHQwpVNrxHP/Npwt2V6IgVPS1dKotjYXOAm5xKngJMsbqacFGTxNYGqCUzTtnPYg1Y+5gG+NOz6nYaz/TSmW2MM428uVV6/m13wyrhaafmvg6MNNvh0cdZ+lgJNNNxnyRjOLogqBIXTa6TGBRRe0UktNATVDAXPobIm0E8TByRngmIRjgnP8ZA6FIJIxmQVOhk8wK9rB5I32MQFO1H9TUn1W7jLYZrYuLsa6isrGNQuhA/InrpmqWQY1PWVB40saONdJ4DhpRqgOUreWoBBE9bS382PzPBWcuWZ/f0OYuhgJGBSTnM33M9F5Hr/it5yzHcUop5gyOFwUWipw1hLAudZTo9LmoiWBw7BJyX94nilvXn6+0DGV7ptSelHa98slSMypglBAMIf3/W3UqotoBUA5YSo4ESP0+mmsPkdQzlzgGL61DN3leYa/KeaGe/RoMnNmcen7wFNMKfLJJHylUb+NBuOjfsQoOEqMl6Qhl0tla08SKKc4HzgrH2+VERl8vDRLYvfmAaeYVk44TxLhTMBLCbH17NtLXkJCFsvKnOCUBDhORglIjK2VEjLzwbcW6uCY8uatcaYZetrKy8+RBj4LgvMdCKeY6K+dgc5Ouka9EtXWIuCUjJlttwNHRvVLfE6oDk5gdCV/a/gF9jIZdrT0PREcwwKekxLmoDTluivNTPXNCgUwU2BUmiPqGwWnGE0bLobTbHCcdHBUB7JIPCcSG5w36wHS2mIT7E1wkjJjogDNz9Ni9Wwio2OeHOudbK0gdU6dQocboTrlRM5xFjgFA5xSYilfBByOjc5w+ZS251m1RYHgaQan1oNtKdtfTLj9i5n/irGhCIkHzAQ6W2f74+J5spttR1WHJXgIMsB5PAOcWoJeBJdggsOr8pJGLWTqaS8/E6SmFBXgaPzsVgJ+fgUiUuNYyqKdDM628/x5iq4qdDY9ZBBzukTBKdjZ4GBDvWLUfYPgfFGR0JV4FqR48DyjB4kwrt++NQstDTvnm/SveVW7ebQ+OsFMreCPCGd/+zZq7whwvnzJAme2b01STrxlfYkq6QU4RxnxmyyH+8vPIw0c9TnpIUgu/vy+q5gMjDzDOXS2twm8bY9qxKLgFCPgGHYOY2uvDHDWYjInZfHuuJVXQZBPzeKaXGS7DJO5AFFOMblwKqtlyqKmTimlhCGLYmew6Q/p+WyAjlQIvtRS9jWcHs4BDvjW2lngTCbovgm+Juj4e/T/RYZL6jcSoKIBiZpK9/zR5+KdMKtvFFAJvfrwLGdE3/bMq6EnMArh01foKz3m2lrat+ohg7UEcJQq3Q7DtIO44enpeJD7GuRvoCck9IKVP7BB7s5olIUNtpLEd42wy/NksrfHG+uSKv2Pr9IeXztyjdhJZraQhMrk0c4e3xDYCfGLfezmY3B0AG2NJ0VXdhmPXOppeHgotbWozFHgXG+djU9Ow9OUNR6zf4eHB/mb9xdsm/nQ2pG+LpY/HmnjGIx1Xnj/PvJ2uT5//leAUxylrIv3hU7KZa0cfbyJXtWF+NT7m3ynkDtcPT2FTtop+3qSO5zDCL1+4hXeXY3fp6zT0/fvz04e+FvsoXhBPBDr/dbWlp28tq7UeyOfYqBjtGU6bf9zazp15fYZ5wkP3y9vPU27LnZh2pu1C2MPz7a2/P4Jvnhymryt4/cH/TOOzUEmOAdfrw7PrtKX7y8t+UvLy++vlvUvWBZrSRsssWTOZDhbwhkEtM7MEzw5GZ88ePBgPH6AP2E9ePBAvsJ+s38nuMYP+EvzrjH/4MlYvULHx+/5k/3H/ogvn8avST6Fq1nyk9fSknqz+Am/l/ke4M6dLSVvae7q/EyCE2mvsuLYApxjr7m01cz5WynrBfzwtjIXe8+LF1svPG8NJ6l4sNbWHsOvrf/y5T1Ze/z4BVt8Ex7jgucvXmR8am3GlefO8s1+ihH690rPsUlZcJq71c3Nsu3MWonvsLERiJ325znWbT/3X73sBznPKj8mffkgkvH5999Bz/abuKzXr19Xy3blWGS2V475oscV5/oaHkPDD3rxmi3+LvHq8bUjP1TA1iDXx5VrBx3fhWM8zjW8Lhd7cnwMrxwcFCpwOPqrOom7WebxxEXxJxX5jC5Fvi5eLYi/FApyV9iZahtUkKddkBsAI8PYJekfkZ/AZ2xL+1a5Wt0mAKJtJFHslKuYOwS9DKt/Ogtco7yM1DcsuM13DcmdwnusneUxv7HSTlq+uWDcifHVrFYZSdCy/CRwML/Lwjf0nW+5gOvryv+BdWzcmdm3WUFAmLL61Q2265jTmgaOdUfg/FyLrj4nmmfVNHCqlrW5+ROcf4L7cnA2odg7DZyNn+D8k5QDyFip4EBW/k9w/jFwoP7oWTrlMLb3E5x/TuZUN5+lUQ7jeNXXTJ/+Cc6PXk6fEwVDJxGcLQaOxcCpbm78BOcHr4IEp5qsELxg4IAlBBBVy/8nvSj/3CJwYPfTwKE/byA4nv1z/cDVH3JwqungvOY+BKsJ4Kzd1Vev/X9vN+/4kpoWsjVEJ1nm0B+hLLzvwye8x5FDPH58q29+jPEMhNuDwMd/HVXiRngQllHXc0eH5lvq98vMwuGGaAo4oA8wdMp93M5mdIh5s+nfZuGI7Yd98QiOvrQ01yeX/H/Fgute6uP0FHk9tzu1peiF8y1lRy9bGQoBA4f+zCinfLcLDogHxUMP8VH5v2jRuVctegA/re9w/rj7G1aqKr3BZx9p52R+/lvAwUUXSU/n+OB33fK5z16CU5YXYd39SRA4G6mUYyE2dw9O7CLZk+ruPwzOvCc/1M9bsoB/ApzXGleLncGdnBJHBfT1/wpwdqtDjeIlMd05OEAZr9PAYao0WKH8VO54b7SL+W8Dh50vMTLF778nOMkKgc20tQ3SCObY4sXRkbJUgDP8b2Fru4KtyYu4/UZYmeCg6ywNnKE11MC5M5mjKwXlMhc288ic77vrc75tl0NSJWXAsu5SnTXAGaKtkwYOYpOhrX0TQYuPclR2rf8ScLg+YJEJsPstGzCLrTHSSQVniF5puf9JlHMHd81/Hzhc9lh3wDxmyZwMytkAB046ONadkHQWOOqrv3Un5rQsJV1ksTU8Eav6rWeDzSytNMAQnNcZ4AyBcjS2Fm2WOdzN0hcWA2e4m8xCdIP1e1OOsil/ADhs82EHo5tqsrVqFuUwbIi3oq9ArN3dIT5B79s3q6Z0PsNh6pbM70K4E+LJohyB3h2ozxY5lWENxe7CTwCMC7WNLHCqlrKH1aGAZIbi4bdTzq7yEPwrPGzWDInDpfA33ysMEkmnw+owQj0WbX2GKr1J77D4kdQJDgXxw+vfaJMM6VDVRP+n9eMx4ZSR5Y8cSsqxbo+22roI15bgDDHQmcrWSNk2aRA/NotyOKoz7kLkuOhAFNwzcrLfx2M0yyCQJx67BPLbVOmU55CEtFvJb1JbhzsaEzyzwAEjiBOJAY62UsGZvY3ciBta6u26LzHtFrasH0NGVpqqK3iJVZ4DnFRTSG5pTNOi+7SMgGWwNXC7RTCNg5OM2oyP6UdI0lUy+MsdawaJG5zGsuQ4BHHe81xlylZE5Iz+B4HYxkaWnbPBGZtwU8jvgQfI3IbVb12vq+oYVtzGtSzj/rpjd0k5evxsVdoS50qRrm+88qEQEWkQs/3PUAgYOEqnqMqjcJmza90eHFLE4bfwr8Ilz8sbvzdrS/tmS1gfGxv83Oe71qQXhhaaJXJHxdJIaMOaBc5QKHcb2nEEsBvc/RbHnFPXXOS+uZHo//73gcP+sMsIZrjBL3/WJcb5Nm2NCGPG9mMYeb6ZCY6G5OYGTwiJUfQmflvSOAc1bCO6qlSbZW3S4LQNICXr+4qX2+tvMT64IeCxoG9/9kwL2B7jNVn2hPsgH+GWbCrUYOurmTJH05lTF0SEIiiw/cZxddZcs9Q2q1zElv89K5Vmce/EJDIrCxzYgg2s44ggtrFpZfJBS0rbjSxVegNNEbRJ0rHBs+NwyBPZ3EinmtjttXEbcKx/FByCh8hgxrwEvhE6zQlGngKOMEI3rCwPwcZQeCuA6DarVMArW82LZGv+ayOLj2UPtAEKq/4XJEhxsbD4JfJb16IxjVwLMvr2V3HMAjkgiFdtZoHDt30WW5MJ8dk3UfrNRfhoHqJ/L+1wcDZvB85GJsFobA03fIjlURmOT2krbXxHcIjmqlXr30U6VsJjdBbfhnKkeJ0fHLb3m5m+NcMXMAud242xsbi4MlXpfxmL08BBKbMgPnzIlWVtzmucckUvSyGwtGAk8DjgjCYNbRqUcztwLKS54W1kzm2IzVr8nZaIyCPlbNyWRSA4m6jgVjelsFbShySJTFXOBGdTt52kt+WuKYeGeaHWeJs9/468MJJPKcCxoAT9luDMK3M28GcWOFUVpduYTyHYWGxItJwsDWxCo5wFrM8FfW1zvNuIGETOBxV+tOxucQtubs4lHYRvCyKhWeBsCK8PeHk2ucprJfgBpDfnNqctPlNNzVaYvRaCcr4jagfWwNkdkif+Ntx7g/sLyCyNH4NUqk3pVc40QoVGsEGUs8Htkcj8M/q1ya3JWxI8YF61bu+1se6CZhIIVyZ1akdBX/CtwNng5iuK78icOdTkNkmdG4qNz/atbaB3dAPBYZ9MOymNejZvJXQ2jNDQj04NSHagJdIwP8mN6i3EKh/mx+9h9G7FhBKoDEPpWbUyfWvoXuZhH+4mMljZpmbkb3wLOBsSnOGd5lDeSjNP9Z9rVshtdB4FTuK4ZvLssG/YEKRpZVOO2PIqj71tfJcFPM2qWneRclS+tUDKUKKFDNrllHObezB77wiajU1ibpKm/nlwLBoyXa3+kOzB26C9uytjpVWC5q43gsAR4kjOc54FzsYPAKeq0hHwpt1+2O8/nLGw7jf2Sv/h9vZ2eXu7z9dDeL7N/oZvyD4ivI/9fLgdcd2oXDAEBzbwu4GDlKPmBs8EZ0MHZ/N7gAOko9w3/X+8arq5naC+ycAmiILNje8CjmRr/x5wRPyJwOnbncY/vHqP+2kaNlCO9R0YyL8WHHQ67QpwvM7f//QKet5DDZWHS9gYQFS0VTe+Azr/UnBAe6SyegulRCX4+59Hp9Lsq9W0HU/aoyhzrM3/M+BYPEWkib1Ffv03gNOzPWwZD+uxXamsaVUR7Gba2Nz8P8LWRGS96iHD/xdgw9BpdBodtrgQ+pVRThlbn6AqXd34vyJzKAMC7kf773/rajjNpm9Xej1ohWZ9D5Pi3wrOJl1t9V8Mzt+NSqXXYL87zSqkA2xs/h8D599MOYzPBchuG83q9/Fg/XtlDkblN/7V4Ih9AXCsW6ay/ATn+4Nj/R8Ex/oJzk9wfoLzE5yf4PwE5yc4P8H57wFngfqWn+D8BGcRcKxbrf8etrb4+q7gVH/E+u8A51Zrc5E3b3xPcKBkPZdbPM3F+S8Axy/3F7uonOiY8/3A2Zwjjx3TesC7nOvdLnQf/P1fgM4tVqfXxCpQSiVP38CEUpq5wJlTzmDKc7X/37DLPxRRD7Zm8xaRoO8ATuMnHsbqeBZxq02ZfXzH4GxmrQ1RnAO5vj/BiVMO1qYD8WzOWLcAZy518SflpFGOb1VFeHtzIb37rsDBvNqf4KSBs8m7fXwHcOZP1vgJTpICjk6QanXh7IM7AmfzJziZ2toGFSdY3wGczc05BBly1Z8KQSI40FSF17JtLqAT3A3lqNqsn+AkKwS8idRdqdKLOzBprOhPcBLA4XWHi25oEjgrzqKUsyEqUKvV5k8PQYStvShDN9vq4qEGBo6oulDgBL1+pOPUTD5JXQfhgf8THHMFTh/meInakfk3FZyVouoipx3PtxZ13/A+EtW+/ROcyOr5G9V5IzsRyvlTlCvp4MDQtkXjmWCFblabvZ9oJDjXSIte0HasWs1GAjhIiQtCg++vej8JJ7qYCEfOsrGYW5qxobKdAM7fv/mLaWvC1LEs5ycYsVXpq06SC2lrzV6QAE5gW5sLiC7eeYf96ld+YhHna03epZka5s69q1WlXOUMsG/XUqHv/xQ5Ccr0Vv922+n9nQhOx7vVsis/TdAEZbpi3247K8ngQL3QrdZPKBLh+dbNzP3cw3/v+v8DRxgZx7KNx6oAAAAASUVORK5CYII=" x="113.6" y="4" width="205" height="275"/>
      <line x1="${C - E}" y1="${gy + 2}" x2="${C - E}" y2="318" stroke="#c8161d" stroke-dasharray="3 2"/><line x1="${C + E}" y1="${gy + 2}" x2="${C + E}" y2="318" stroke="#c8161d" stroke-dasharray="3 2"/>
      <line x1="${C - E}" y1="310" x2="${C + E}" y2="310" stroke="#c8161d" stroke-width="1.6"/><path d="M${C - E} 310 l8 -4 v8z M${C + E} 310 l-8 -4 v8z" fill="#c8161d"/><text x="${C}" y="304" font-size="15" font-weight="700" text-anchor="middle" fill="#c8161d" stroke="#fff" stroke-width="3" paint-order="stroke">${f1(w)} m</text>`;
  };
  const drawC = () => {
    const U = 8.2, gy = 275, ox = 118, X = x => ox + U * x, Y = h => gy - U * h, kk = U / 81.6, H = MS.H;
    const bg = masseMin(H, true), bs = masseMin(H, false), sel = MS.ko ? bg : bs;
    $("msCi").value = H; $("msCv").textContent = f1(H) + " m"; document.querySelectorAll("[data-ko]").forEach(b => b.classList.toggle("on", (b.dataset.ko === "1") === MS.ko));
    let g = `<line x1="8" y1="${gy}" x2="332" y2="${gy}" stroke="#23262b" stroke-width="2"/>${adlTruck(X(0), gy, kk)}<line x1="${X(0)}" y1="${gy}" x2="${X(0)}" y2="10" stroke="#23262b" stroke-dasharray="6 3 1 3" opacity=".5"/>`;
    if (sel) {
      const wx = X(sel.x), hw = Math.max(6, 336 - wx), FH = 3, NF = 10, rt = Y(FH * NF);
      let wall = `<rect x="${wx}" y="${rt}" width="${hw}" height="${gy - rt}" fill="#e6ddd2" stroke="#23262b" stroke-width="1.2"/><rect x="${wx - 2}" y="${rt - 5}" width="${hw + 2}" height="5" fill="#8d8680" stroke="#23262b" stroke-width="1"/>`;
      for (let f = 0; f < NF; f++) {
        const y0 = Y(f * FH), y1 = Y((f + 1) * FH), nw = Math.min(3, Math.floor((hw - 4) / 15));
        if (f > 0) wall += `<line x1="${wx}" y1="${y0}" x2="336" y2="${y0}" stroke="#23262b" stroke-width="1.4"/>`;
        for (let q = 0; q < nw; q++) {
          const x0 = wx + 6 + q * 15;
          wall += `<rect x="${x0}" y="${y1 + 5}" width="10" height="${(FH - 1.1) * U - 2}" fill="#a9c8de" stroke="#4a5560" stroke-width="1"/><line x1="${x0 + 5}" y1="${y1 + 5}" x2="${x0 + 5}" y2="${y0 - 0.1 * U - 2}" stroke="#4a5560" stroke-width=".8"/>`;
        }
        if (f === 0) wall += `<rect x="${wx}" y="${y0 - 3}" width="${hw}" height="3" fill="#8d8680"/>`;
        if (hw > 60) wall += `<text x="334" y="${y0 - 3}" text-anchor="end" font-size="6.5" fill="#6b645d">${f === 0 ? "Erdgeschoss" : f + ". Stock"}</text>`;
      }
      const px = X(MS_P.x), py = Y(MS_P.h), tx = X(sel.tx), ty = Y(sel.th), d = (sel.a - sel.b) * Math.PI / 180, cx0 = tx, cy0 = ty - .35 * U;
      const lx = X(MS_P.x + sel.L * Math.cos(sel.a * Math.PI / 180)), ly = Y(MS_P.h + sel.L * Math.sin(sel.a * Math.PI / 180));
      g += wall + adlLadder(px, py, sel.a, sel.L, U) + `${adlArm(lx, ly, tx, ty, U)}<circle cx="${lx}" cy="${ly}" r="2.4" fill="#fff" stroke="#23262b" stroke-width="1.2"/><circle cx="${tx}" cy="${ty}" r="2.4" fill="#fff" stroke="#23262b" stroke-width="1.2"/>
        <rect x="${cx0}" y="${cy0}" width="${1.4 * U}" height="${1.35 * U}" rx="2" fill="#fff" fill-opacity=".6" stroke="#23262b" stroke-width="1.3"/><rect x="${cx0 + 1.4 * U - 4}" y="${cy0}" width="4" height="${1.35 * U}" fill="#c8161d"/>
        <line x1="${wx}" y1="${gy}" x2="${wx}" y2="${gy + 22}" stroke="#2f7d4f" stroke-dasharray="3 2"/>` + tick(X(0), wx, gy + 20, f1(sel.x) + " m", "#2f7d4f");
      g += `<line x1="8" y1="${Y(H)}" x2="${cx0}" y2="${Y(H)}" stroke="#c8161d" stroke-dasharray="3 3" opacity=".6"/><text x="10" y="${Y(H) - 3}" font-size="9" fill="#c8161d">${f1(H)} m</text>`;
    }
    $("msC").innerHTML = g;
    $("msCr").innerHTML = sel ? `<div class="simrow"><span>Korb auf Höhe</span><b>${(f => f ? f + ". Stock" : "Erdgeschoss")(Math.floor(MS.H / 3))}</b></div><div class="simrow"><span>Min. Abstand Drehachse – Wand</span><b>${f1(sel.x)} m</b></div><div class="simrow"><span>Mit 1 m Sicherheitsabstand</span><b>${f1(sel.x + 1)} m</b></div><div class="simrow"><span>Aufrichtewinkel · Auszug</span><b>${Math.round(sel.a)}° · ${f1(sel.L)} m</b></div><div class="simrow"><span>Korbarm zum Leitersatz</span><b>${Math.round(sel.b)}°${sel.b ? "" : " (gestreckt)"}</b></div>${bg && bs && bs.x - bg.x > .05 ? `<div class="simmsg ok">Mit Gelenkarm ${f1(bs.x - bg.x)} m näher an die Wand als mit gestrecktem Korbarm (${f1(bs.x)} m).</div>` : `<div class="simmsg ok">Auf dieser Höhe bringt der Gelenkarm keinen Vorteil.</div>`}` : `<div class="simmsg bad">Diese Einsatzhöhe ist mit den Leitergrenzen (Auszug 12–28,4 m, Winkel bis 76°) nicht erreichbar.</div>`;
  };
  $("msCi").oninput = e => { MS.H = +e.target.value; drawC(); };
  $("msAi").oninput = e => { MS.w = +e.target.value; drawA(); };
  app.querySelectorAll("[data-w]").forEach(b => b.onclick = () => { MS.w = +b.dataset.w; drawA(); });
  app.querySelectorAll("[data-ko]").forEach(b => b.onclick = () => { MS.ko = b.dataset.ko === "1"; drawC(); });
  drawA(); drawC(); window.scrollTo(0, 0);
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
  if (state.lc === "v") { app.innerHTML = '<section class="hero"><h1>Vorlagen</h1><p>Vorlagen der Feuerwehr Zuchwil (PDF / Word), für alle angemeldeten Mitglieder.</p></section><div id="vbm" class="sinfo" role="status"></div><div id="body"></div>'; lektionen(VMOD, document.getElementById("body")); return; }
  app.innerHTML = '<section class="hero"><h1>Lektionen</h1></section>' + loginBox + mlHtml + (state.lc ? '<div id="body"></div>' : '<details class="lgrp" id="eig"><summary><span>Eigene Lektionen (PDF / Word)</span><b id="eign">…</b></summary><div class="lgbody" id="body"></div></details>');
  const lgo0 = document.getElementById("lgo"); if (lgo0) lgo0.onclick = loginView;
  document.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { state.lc = b.dataset.m; lesView(); window.scrollTo(0, 0); }));
  lektionen(getMod("basis"), document.getElementById("body"));
}

/* ---------- Anmeldung ---------- */
function loginErr(err) {
  const c = String((err && err.code) || "").replace("auth/", ""), msg = (err && err.message) || "";
  if (/Firebase konnte/.test(msg)) return msg;
  if (c === "too-many-requests") return "Zu viele Fehlversuche: Firebase hat den Zugang kurz gesperrt. Etwa 15 Minuten warten oder in Firebase das Passwort neu setzen. (" + c + ")";
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return "Benutzername oder Passwort stimmt nicht. In Firebase muss die Kennung name@feuerwehr-zuchwil-app.ch heissen. (" + c + ")";
  if (c === "user-disabled") return "Dieses Konto ist in Firebase deaktiviert. (" + c + ")";
  if (c === "network-request-failed") return "Keine Verbindung. Internet prüfen. (" + c + ")";
  if (c === "operation-not-allowed") return "Die Anmeldung mit E-Mail und Passwort ist in Firebase nicht aktiviert. (" + c + ")";
  if (/api-key|app-not-authorized|unauthorized-domain/.test(c)) return "Firebase lehnt diese Seite ab (API-Schlüssel oder Domain). (" + c + ")";
  return "Anmeldung fehlgeschlagen" + (c ? " (" + c + ")" : msg ? " (" + msg.slice(0, 80) + ")" : "") + ".";
}
function pwEye() { const i = document.getElementById("lgp"), b = document.getElementById("lgeye"); if (!i || !b) return; b.onclick = () => { const show = i.type === "password"; i.type = show ? "text" : "password"; b.textContent = show ? "Verbergen" : "Anzeigen"; b.setAttribute("aria-pressed", show); b.setAttribute("aria-label", show ? "Passwort verbergen" : "Passwort anzeigen"); i.focus(); }; }
function loginView() {
  state.mod = null; state.view = "login"; backBtn.hidden = false;
  app.innerHTML = `<section class="hero"><h1>Anmelden</h1><p>Mit der Anmeldung sind die Lektionen für alle Mitglieder gemeinsam abrufbar. Die Zugangsdaten bekommst du vom Kader.</p></section>
    <form id="lgf" class="lgf">
      <input id="lgu" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Benutzername" aria-label="Benutzername">
      <span class="pwrow"><input id="lgp" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Passwort" aria-label="Passwort"><button type="button" class="pweye" id="lgeye" aria-label="Passwort anzeigen" aria-pressed="false">Anzeigen</button></span>
      <button class="btn primary" type="submit">Anmelden</button>
      <div id="lgm" role="alert" class="sinfo"></div>
    </form>`;
  try { document.getElementById("lgu").value = localStorage.getItem("fwz-user") || ""; } catch (e) {}
  pwEye();
  document.getElementById("lgf").addEventListener("submit", async e => {
    e.preventDefault(); const m = document.getElementById("lgm"), u = document.getElementById("lgu").value, p = document.getElementById("lgp").value;
    if (!u.trim() || !p) return; m.textContent = "Anmelden …";
    try { await FWZ.login(u, p); try { localStorage.setItem("fwz-user", u.trim()); } catch (e2) {} if (state.after) { const f = state.after; state.after = null; await aoSync(); f(); } else lesView(); }
    catch (err) { m.textContent = loginErr(err); }
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
  del(id) { return this.tx("readwrite", s => s.delete(id)); },
  async rename(id, name) { const r = await this.tx("readonly", s => s.get(id)); r.name = name; return this.tx("readwrite", s => s.put(r)); }
};
const VMOD = { id: "vorlagen", chs: [{ k: "v", n: "Vorlagen Feuerwehr Zuchwil" }], sections: [] };
function chaptersOf(m) {
  if (m.chs) return m.chs;
  const seen = [];
  m.sections.forEach(s => { if (s.g && /^\d+ /.test(s.g) && !seen.includes(s.g)) seen.push(s.g); });
  return seen.map(g => ({ g, k: g.split(" ")[0], n: g.replace(/^\d+ /, "") }));
}
function fmtSize(b) { return b > 1048576 ? (b / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
/* Lektionen nach Basiswissen-Thema in Ordnern: Kapitelnummer aus dem Dateinamen (z. B. 6.8) -> Abschnitt (z. B. «6.7 und 6.8 Wasserbezug und Leitungsbau») */
const vlLk = (id, t) => `<button class="lgrp vlink" id="${id}"><span>${t}</span></button>`;
function vlLinksBind() {
  const g = id => document.getElementById(id); if (!g("vlt")) return;
  [["vb1", false], ["vb2", true]].forEach(([id, n]) => { g(id).onclick = () => { const keep = VLN; VLN = n; try { aoPdfActs(vlDocx(true), g("vbm")).open(); } catch (e) { g("vbm").textContent = e.message || "Word-Datei konnte nicht erstellt werden."; } VLN = keep; }; });
  if (g("vbil")) g("vbil").onclick = () => aoGo("bil");
  g("vlt").onclick = () => { state.lc = "vl"; lesView(); }; g("vln").onclick = () => { state.lc = "vn"; lesView(); };
}
function lesNum(name) { const x = /(?:^|[^\d.])(\d{1,2}(?:\.\d{1,2}){1,3})(?![\d])/.exec(String(name).replace(/\.(pdf|docx?|PDF|DOCX?)$/, "").replace(/\bL\d+\b/g, " ")); return x ? x[1] : ""; }
function lesCmp(a, b) { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] ?? -1) - (y[i] ?? -1); if (d) return d; } return 0; }
function lesSec(secs, n) {
  let best = null;
  secs.forEach(sc => {
    const t = String(sc.t || sc.title || sc.n || sc.name || ""), m = /^(\d+(?:\.\d+)*)(?: (?:und|bis) (\d+(?:\.\d+)*))?/.exec(t); if (!m) return;
    const lo = m[1], hi = m[2] || m[1];
    if (lesCmp(n, lo) >= 0 && (lesCmp(n, hi) <= 0 || n.startsWith(hi + "."))) { if (!best || lesCmp(lo, best.lo) > 0) best = { lo, t, sc }; }
  });
  return best;
}
function lesGroups(m, c, mine, rowH) {
  if (m.id === "vorlagen") {
    state.lfo = state.lfo || new Set();
    const fz = mine.filter(f => /Zuchwil/i.test(f.name)), ne = mine.filter(f => !/Zuchwil/i.test(f.name));
    const fold = (key, title, fs, links) => `<details class="lfold" data-k="${key}"${state.lfo.has(key) ? " open" : ""}><summary><span>${title}</span><b>${fs.length + links.split("vlink").length - 1}</b></summary><div class="lfbody">${links}${fs.sort((a, b) => a.name.localeCompare(b.name, "de", { numeric: true })).map(rowH).join("") || ""}</div></details>`;
    return fold("v:fwz", "Feuerwehr Zuchwil Vorlagen", fz, vlLk("vlt", "Vorlage Lektion Feuerwehr Zuchwil (Formular)") + vlLk("vb1", "Feuerwehr Zuchwil leer (Word)") + vlLk("vbil", "Erfolgsauswertung / Bilanz 3.17.1 (Formular)")) + fold("v:neu", "Neutrale Vorlagen", ne, vlLk("vln", "Vorlage Lektion Neutral (Formular)") + vlLk("vb2", "Neutral leer (Word)"));
  }
  const secs = c.g ? m.sections.filter(x => x.g === c.g) : [];
  if (!secs.length) return mine.map(rowH).join("");
  const grp = new Map(), other = [];
  mine.forEach(f => { const b = lesSec(secs, lesNum(f.name)); if (b) { if (!grp.has(b.t)) grp.set(b.t, { lo: b.lo, t: b.t, fs: [] }); grp.get(b.t).fs.push(f); } else other.push(f); });
  state.lfo = state.lfo || new Set();
  const fold = (key, title, fs) => `<details class="lfold" data-k="${esc(key)}"${state.lfo.has(key) || fs.length === 0 ? " open" : ""}><summary><span>${esc(title)}</span><b>${fs.length}</b></summary><div class="lfbody">${fs.sort((a, b) => (/Festig/i.test(a.name) ? 1 : 0) - (/Festig/i.test(b.name) ? 1 : 0) || a.name.replace(/\.[^.]+$/, "").localeCompare(b.name.replace(/\.[^.]+$/, ""), "de", { numeric: true }) || (isWord(a.name) ? 1 : 0) - (isWord(b.name) ? 1 : 0)).map(rowH).join("")}</div></details>`;
  return [...grp.values()].sort((a, b) => lesCmp(a.lo, b.lo)).map(g => fold(c.k + ":" + g.t, g.t, g.fs)).join("") + (other.length ? fold(c.k + ":_", "Weitere Dateien", other) : "");
}
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
    const lgx = document.getElementById("lgx"); if (lgx) lgx.onclick = () => FWZ.logout().then(() => start());
    return;
  }
  const c = chs.find(x => x.k === state.lc) || chs[0];
  const mine = files.filter(f => f.ch === c.k).sort((a, b) => b.added - a.added);
  const rowH = f => `<details class="hit les lfile" data-id="${f.id}"${state.lfo && state.lfo.has("f:" + f.id) ? " open" : ""}><summary><h3>${esc(f.name)}${isWord(f.name) ? ' <span class="tag plain">Word</span>' : ""}</h3></summary><p>${fmtSize(f.size)} · ${new Date(f.added).toLocaleDateString("de-CH")}${f.by ? " · von " + esc(f.by) : ""}</p>
      <div class="lesact"><button class="btn" data-a="open">${isWord(f.name) ? "Öffnen / Laden" : "Öffnen"}</button><button class="btn" data-a="share">Teilen</button>${isWord(f.name) ? "" : '<button class="btn" data-a="print">Drucken</button>'}<button class="btn" data-a="ren">Umbenennen</button><button class="btn ghost" data-a="del">Löschen</button></div></details>`;
  el.innerHTML = `${m.id === "vorlagen" ? "" : `<div class="banner"><h2>Kapitel ${c.k} – ${esc(c.n)}</h2><p>Lektionen als PDF oder Word-Datei</p></div>`}
    <div class="lesbar"><span class="dzhint">PDF- oder Word-Dateien hierher ziehen oder</span> <label class="btn primary lesup">Datei hinzufügen (PDF / Word)<input type="file" id="lfile" accept="application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple hidden></label></div>
    <div id="lmsg" class="sinfo" role="status"></div>
    <div class="sres">${mine.length || m.id === "vorlagen" ? lesGroups(m, c, mine, rowH) : '<p class="sinfo">Noch keine Dateien in diesem Kapitel.</p>'}</div>`;
  if (m.id === "vorlagen") vlLinksBind();
  const msg = document.getElementById("lmsg");
  const upload = async list => {
    let ok = 0;
    for (const f of list) {
      if (!/\.(pdf|docx?)$/i.test(f.name) && f.type !== "application/pdf") { msg.textContent = "«" + f.name + "» ist weder PDF noch Word-Datei."; continue; }
      try {
        if (FWZ.user) await FWZ.addLesson(f, m.id, c.k, (i, n) => { msg.textContent = "Lade «" + f.name + "» hoch … " + i + "/" + n; });
        else await LDB.add({ mod: m.id, ch: c.k, name: f.name, size: f.size, added: Date.now(), blob: f });
        ok++;
      } catch (err) { msg.textContent = /permission|insufficient/i.test(err.message || "") ? "Keine Berechtigung (Firestore-Regeln fehlen)." : (err.message || "Speichern nicht möglich: " + f.name); }
    }
    if (ok) lesView();
  };
  document.getElementById("lfile").addEventListener("change", e => { const l = [...e.target.files]; e.target.value = ""; upload(l); });
  const dz = el.querySelector(".lesbar");
  if (dz) {
    const on = v => dz.classList.toggle("drag", v), hasF = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files");
    ["dragenter", "dragover"].forEach(t => el.addEventListener(t, e => { if (hasF(e)) { e.preventDefault(); on(true); } }));
    el.addEventListener("dragleave", e => { if (!el.contains(e.relatedTarget)) on(false); });
    el.addEventListener("drop", e => { if (!hasF(e)) return; e.preventDefault(); on(false); upload([...e.dataTransfer.files]); });
  }
  el.querySelectorAll(".lfold").forEach(d => d.addEventListener("toggle", () => { if (d.open) state.lfo.add(d.dataset.k); else state.lfo.delete(d.dataset.k); }));
  state.lfo = state.lfo || new Set();
  el.querySelectorAll(".lfile").forEach(d => d.addEventListener("toggle", () => { const k = "f:" + d.dataset.id; if (d.open) state.lfo.add(k); else state.lfo.delete(k); }));
  el.querySelectorAll(".les").forEach(row => {
    const f = mine.find(x => String(x.id) === row.dataset.id);
    row.querySelectorAll("button").forEach(b => b.addEventListener("click", async () => {
      const a = b.dataset.a;
      if (a === "ren") {
        const act = row.querySelector(".lesact"), m0 = /(\.[A-Za-z0-9]{1,5})$/.exec(f.name), ext = m0 ? m0[1] : "", base = ext ? f.name.slice(0, -ext.length) : f.name, old = act.innerHTML;
        act.innerHTML = `<input class="lesren" type="text" value="${esc(base)}" aria-label="Neuer Name" maxlength="120"><span class="lesext">${esc(ext)}</span><button class="btn primary" data-r="ok">Speichern</button><button class="btn ghost" data-r="no">Abbrechen</button>`;
        const inp = act.querySelector("input"); inp.focus(); inp.select();
        const go = async () => { const n = inp.value.replace(/[\\/:*?"<>|\n]/g, " ").trim(); if (!n) { msg.textContent = "Bitte einen Namen eingeben."; return; } try { if (f.cloud) await FWZ.renameLesson(f, n + ext); else await LDB.rename(f.id, n + ext); lesView(); } catch (err) { msg.textContent = "Umbenennen nicht möglich."; } };
        act.querySelector('[data-r="ok"]').onclick = go; act.querySelector('[data-r="no"]').onclick = lesView;
        inp.onkeydown = e => { if (e.key === "Enter") go(); else if (e.key === "Escape") lesView(); };
        return;
      }
      if (a !== "del") { msg.textContent = f.cloud ? "Lade Datei …" : ""; }
      let file = null;
      if (a !== "del") { try { file = new File([f.cloud ? await FWZ.getLesson(f) : f.blob], f.name, { type: fileMime(f.name) }); msg.textContent = ""; } catch (err) { msg.textContent = err.message || "Datei konnte nicht geladen werden."; return; } }
      if (a === "open") { if (isWord(f.name)) aoPdfActs(file, msg).open(); else { const u = URL.createObjectURL(file); const w = window.open(u, "_blank"); if (!w) location.href = u; setTimeout(() => URL.revokeObjectURL(u), 60000); } }
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

backBtn.addEventListener("click", () => { if (state.view === "games") { if (state.gm) gamesView(); else { gmStop(); start(); } return; } if (state.view === "les" && state.lc === "v" && state.vorHome) { state.vorHome = false; state.lc = null; start(); return; } if (state.view === "les" && (state.lc === "vl" || state.lc === "vn")) { state.lc = "v"; lesView(); window.scrollTo(0, 0); return; } if (state.view === "sub" && !state.mod) { home(); return; } if (state.view === "sgv-item") { sgvView(); return; } if (state.view === "sim") { adlView(); return; } if (["masse", "joystick"].includes(state.view)) { adlView(); return; } if (state.view === "adl" || state.view === "gq" || state.view === "sgv" || state.view === "spick") { (state.sub ? subView(state.sub) : home()); return; } if (state.view === "pdf") { rgClose(); const pb = state.pdfBack; state.pdfBack = null; if (pb) pb(); else (state.sub ? subView(state.sub) : home()); return; } if (state.view === "les" && state.lc) { state.lc = null; lesView(); window.scrollTo(0, 0); } else if (state.mod && state.from === "ao" && state.direct) { aoGo(state.aoR || ""); } else if (state.mod && state.ch && state.tab === "sum") { state.ch = null; renderMod(); window.scrollTo(0, 0); } else if (state.mod && state.from === "ao") { aoGo(state.aoR || ""); } else if (state.mod) (state.sub ? subView(state.sub) : home()); else if (state.view === "ao" || state.view === "ao-sub") aoBack(); else start(); });
/* ---------- Anmeldepflicht ---------- */
let gateOffline = false;
function gateNeeded() { return !!FWZ.enabled && !FWZ.user && !gateOffline; }
function gateView() {
  state.mod = null; state.from = null; state.view = "gate"; backBtn.hidden = true;
  document.body.classList.add("startpage"); document.querySelector(".top").hidden = true;
  app.innerHTML = '<section class="landing gate"><img class="gatelogo" src="logo.jpg" alt="Feuerwehr Zuchwil"><p class="gatemsg" id="gm">Anmeldung wird geprüft …</p></section>';
  const form = () => {
    app.innerHTML = `<section class="landing gate"><img class="gatelogo" src="logo.jpg" alt="Feuerwehr Zuchwil"><h1>Anmelden</h1><p class="gatemsg">Melde dich mit deinem Benutzernamen an. Die Zugangsdaten bekommst du vom Kader.</p>
      <form id="lgf" class="lgf">
        <input id="lgu" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Benutzername" aria-label="Benutzername">
        <span class="pwrow"><input id="lgp" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Passwort" aria-label="Passwort"><button type="button" class="pweye" id="lgeye" aria-label="Passwort anzeigen" aria-pressed="false">Anzeigen</button></span>
        <button class="btn primary" type="submit">Anmelden</button>
        <div id="lgm" role="alert" class="sinfo"></div>
      </form></section>`;
    try { document.getElementById("lgu").value = localStorage.getItem("fwz-user") || ""; } catch (e) {}
  pwEye();
    document.getElementById("lgf").addEventListener("submit", async e => {
      e.preventDefault(); const m = document.getElementById("lgm"), u = document.getElementById("lgu").value, p = document.getElementById("lgp").value;
      if (!u.trim() || !p) return; m.textContent = "Anmelden …";
      try { await FWZ.login(u, p); try { localStorage.setItem("fwz-user", u.trim()); } catch (e2) {} try { await aoSync(); } catch (e3) {} try { await cfgPull(); } catch (e4) {} state.view = "start"; start(); }
      catch (err) { m.textContent = loginErr(err); }
    });
  };
  FWZ.init().then(() => { if (FWZ.user) start(); else form(); }).catch(() => {
    let was = false; try { was = localStorage.getItem("fwz-sync") === "1"; } catch (e) {}
    if (was) { gateOffline = true; start(); return; }
    app.innerHTML = '<section class="landing gate"><img class="gatelogo" src="logo.jpg" alt="Feuerwehr Zuchwil"><p class="gatemsg">Keine Verbindung. Für die erste Anmeldung brauchst du Internet.</p><button class="btn primary" id="gre">Erneut versuchen</button></section>';
    document.getElementById("gre").onclick = gateView;
  });
}

/* ---------- Einstellungen: Sichtbarkeit und Benutzerverwaltung ---------- */
const CFG_ITEMS = [
  ["Startseite", [["home:reg", "Reglemente"], ["home:les", "Lektionen"], ["home:ao", "Ausbildungsoffizier"], ["home:vor", "Vorlagen"], ["home:games", "Feuerwehr Spiele"]]],
  ["Reglemente", [["reg:basis", "Basiswissen"], ["reg:einsatz", "Einsatzführung"], ["reg:sgv", "Kantonale Ergänzungen (SGV)"], ["reg:abc", "ABC-Handbuch"], ["reg:veg", "Vegetationsbrände"], ["reg:adl", "Autodrehleiter"]]],
  ["Ausbildungsoffizier", [["ao:check", "Checkliste"], ["ao:keil", "KEIL"], ["ao:lek", "Lektionen"], ["ao:kq", "Kurs-Quiz"], ["ao:fach", "Fachlektionen"], ["ao:meth", "Lektion halten"], ["ao:zahl", "Zahlen-Trainer"], ["ao:bil", "Erfolgsauswertung / Bilanz"], ["ao:prog", "Kursprogramm"], ["ao:regl", "Reglement Basiswissen"]]]
];
const CFG_DEF = () => ({ v: 1, t: 0, admins: ["tristan"], def: { hide: ["ao:check", "ao:keil", "ao:lek", "ao:kq", "ao:prog"] }, users: {} });
let CFG = (() => { let c = null; try { const o = JSON.parse(localStorage.getItem("fwz-cfg") || "null"); if (o && o.def && o.users) c = o; } catch (e) {} return cfgSeed(c || CFG_DEF()); })();
function cfgSeed(c) { if (!c.seed) { ["admin", "feuerwehr", "daniele", "marin", "tristan"].forEach(n => { if (!c.users[n]) c.users[n] = { hide: c.def.hide.slice() }; }); c.seed = 1; } return c; }
const cfgMe = () => (typeof FWZ !== "undefined" && FWZ.user) ? FWZ.label() : (gateOffline ? ((() => { try { return (localStorage.getItem("fwz-user") || "").trim().toLowerCase(); } catch (e) { return ""; } })()) : "");
const cfgIsAdmin = () => !!cfgMe() && (CFG.admins || []).includes(cfgMe());
function fwzHidden(id) { const me = cfgMe(), u = me && CFG.users[me]; return ((u ? u.hide : CFG.def.hide) || []).includes(id); }
async function cfgPull() {
  if (typeof FWZ === "undefined" || !FWZ.user) return;
  try {
    const c = await FWZ.getCfg();
    if (c && c.def && c.users && (c.t || 0) >= (CFG.t || 0)) { CFG = cfgSeed(c); try { localStorage.setItem("fwz-cfg", JSON.stringify(CFG)); } catch (e) {} }
  } catch (e) {}
  if (state.view === "start") start(); else if (state.view === "ao") aoGo("");
}
if (typeof FWZ !== "undefined") { FWZ.onChange(cfgPull); if (FWZ.user) cfgPull(); }
async function cfgSave(msg) {
  CFG.t = Date.now(); try { localStorage.setItem("fwz-cfg", JSON.stringify(CFG)); } catch (e) {}
  try { await FWZ.setCfg(CFG); if (msg) msg.textContent = "Gespeichert."; }
  catch (e) { if (msg) msg.textContent = /permission|insufficient/i.test((e && e.message) || "") ? "Im Konto speichern nicht möglich (Firestore-Regeln für fwz_config fehlen). Nur auf diesem Gerät gespeichert." : "Im Konto speichern nicht möglich (offline?). Nur auf diesem Gerät gespeichert."; }
}
async function cfgLog(filter) {
  const box = document.getElementById("cfglog"); if (!box) return;
  if (!FWZ.user) { box.innerHTML = '<p class="sinfo">Nur mit Anmeldung sichtbar.</p>'; return; }
  try {
    const all = await FWZ.log(200), names = [...new Set(all.map(l => l.name))].sort(), rows = filter ? all.filter(l => l.name === filter) : all;
    const dfmt = t => new Date(t).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "numeric" }), tfmt = t => new Date(t).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
    const dur = l => { const m = Math.max(1, Math.round((l.last - l.start) / 60000)); return m < 60 ? m + " Min." : Math.floor(m / 60) + " Std. " + (m % 60) + " Min."; };
    let day = "";
    box.innerHTML = `<label class="vlf"><span>Benutzer</span><select id="lgfil"><option value="">Alle Benutzer</option>${names.map(n => `<option${n === filter ? " selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
      <div class="loglist">${rows.map(l => { const h = dfmt(l.start), head = h !== day ? (day = h, `<div class="logday">${esc(h)}</div>`) : ""; return head + `<div class="logrow"><b>${esc(l.name)}</b><span>${esc(l.kind || "")}${l.v ? " · V" + esc(l.v) : ""}</span><span class="lt">${tfmt(l.start)}–${tfmt(l.last)} · ${dur(l)}</span></div>`; }).join("") || '<p class="sinfo">Noch keine Einträge.</p>'}</div>
      <p class="foot">Eine Zeile ist ein Besuch der App: von Start bis zum letzten Lebenszeichen (alle 2 Minuten). Es zählen nur angemeldete Geräte.</p>
      <button class="btn ghost" id="lgclr">Einträge älter als 30 Tage löschen</button>`;
    document.getElementById("lgfil").onchange = e => cfgLog(e.target.value);
    document.getElementById("lgclr").onclick = async e => { const b = e.currentTarget; if (!b.dataset.c) { b.dataset.c = 1; b.textContent = "Wirklich löschen?"; return; } try { const n = await FWZ.clearLog(30); b.textContent = n + " Einträge gelöscht"; } catch (er) { b.textContent = "Löschen nicht möglich"; } };
  } catch (e) { box.innerHTML = '<p class="sinfo">' + (/permission|insufficient/i.test(e.message || "") ? "Keine Berechtigung: In den Firestore-Regeln fehlt <code>fwz_log</code>." : "Protokoll konnte nicht geladen werden (offline?).") + "</p>"; }
}
async function cfgDevices() {
  const box = document.getElementById("cfgdev"); if (!box) return;
  if (!FWZ.user) { box.innerHTML = '<p class="sinfo">Nur mit Anmeldung sichtbar.</p>'; return; }
  try {
    try { await FWZ.ping(); } catch (e) {}
    const now = Date.now(), ds = (await FWZ.devices()).sort((a, b) => (b.seen || 0) - (a.seen || 0)), ago = t => { const m = Math.round((now - t) / 60000); return m < 2 ? "gerade eben" : m < 60 ? "vor " + m + " Min." : m < 1440 ? "vor " + Math.round(m / 60) + " Std." : "vor " + Math.round(m / 1440) + " Tagen"; };
    const on = ds.filter(d => now - d.seen < 5 * 60000).length, wk = ds.filter(d => now - d.seen < 7 * 864e5).length;
    box.innerHTML = `<div class="devsum"><div><b>${on}</b><span>jetzt aktiv</span></div><div><b>${wk}</b><span>letzte 7 Tage</span></div><div><b>${ds.length}</b><span>insgesamt</span></div></div>
      <div class="devlist">${ds.map(d => `<div class="devrow${now - d.seen < 5 * 60000 ? " on" : ""}"><span class="dot"></span><span class="dn"><span><b>${esc(d.kind || "Gerät")}</b> · ${esc(d.name || "?")}${d.me ? " · dieses Gerät" : ""}</span><small>${d.v ? "V" + esc(d.v) + " · " : ""}${ago(d.seen)}</small></span>${d.me ? "" : `<button class="cfgx" data-dd="${esc(d.id)}" aria-label="Gerät entfernen" title="Gerät aus der Liste entfernen">×</button>`}</div>`).join("") || '<p class="sinfo">Noch keine Geräte erfasst.</p>'}</div>
      <p class="foot">Ein Gerät zählt als aktiv, wenn die App in den letzten 5 Minuten geöffnet war. Gezählt werden nur angemeldete Geräte.</p>`;
    box.querySelectorAll("[data-dd]").forEach(b => b.onclick = async () => { if (!b.dataset.c) { b.dataset.c = 1; b.textContent = "Entfernen?"; b.classList.add("sure"); return; } try { await FWZ.delDevice(b.dataset.dd); } catch (e) {} cfgDevices(); });
  } catch (e) { box.innerHTML = '<p class="sinfo">' + (/permission|insufficient/i.test(e.message || "") ? "Keine Berechtigung: In den Firestore-Regeln fehlt <code>fwz_presence</code>." : "Geräte konnten nicht geladen werden (offline?).") + "</p>"; }
}
function settingsView() {
  state.mod = null; state.view = "set"; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  const me = cfgMe(), adm = cfgIsAdmin(), users = Object.keys(CFG.users).sort();
  const who = !me ? '<div class="note">Nicht angemeldet. Melde dich als Administrator an, um die Einstellungen zu ändern. Angezeigt wird die Standard-Ansicht.</div>' : adm ? '<div class="note"><b>Administrator:</b> ' + esc(me) + '. Haken = sichtbar. Änderungen werden sofort im Konto gespeichert.</div>' : '<div class="note">Angemeldet als <b>' + esc(me) + '</b>. Nur Administratoren können die Sichtbarkeit ändern.</div>';
  const dis = adm ? "" : " disabled";
  const cols = [{ k: "", n: "Alle", hide: CFG.def.hide }].concat(users.map(u => ({ k: u, n: u, hide: CFG.users[u].hide })));
  const head = cols.map(c => `<th>${esc(c.n)}${adm && c.k ? `<button class="cfgx" data-du="${esc(c.k)}" aria-label="Benutzer ${esc(c.n)} entfernen" title="Benutzer entfernen">×</button>` : ""}</th>`).join("");
  const rows = CFG_ITEMS.map(g => `<tr class="cfgg"><th colspan="${cols.length + 1}">${g[0]}</th></tr>` + g[1].map(i => `<tr><td class="cfgl">${esc(i[1])}</td>${cols.map(c => `<td><input type="checkbox" data-id="${i[0]}" data-u="${esc(c.k)}" aria-label="${esc(i[1])} für ${esc(c.n)}"${c.hide.includes(i[0]) ? "" : " checked"}${dis}></td>`).join("")}</tr>`).join("")).join("");
  const outHtml = FWZ.user ? `<h3 class="zh">Konto</h3><div class="cfgadd"><button class="btn" id="outb">Abmelden (${esc(FWZ.label())})</button></div>` : "";
  const zwOn = document.documentElement.classList.contains("zw");
  const thmHtml = `<h3 class="zh">Darstellung</h3><div class="cfgadd"><button class="btn thm" id="thm">Design: ${zwOn ? "Zuchwil hell · auf Dunkel wechseln" : "Dunkel · auf Zuchwil hell wechseln"}</button></div><div class="cfgadd" id="vwm">${[["auto", "Ansicht: Automatisch"], ["desktop", "Desktop"], ["mobile", "Handy"]].map(v => `<button class="btn ${fwzViewMode() === v[0] ? "" : "ghost"}" data-vw="${v[0]}">${fwzViewMode() === v[0] ? "✓ " : ""}${v[1]}</button>`).join("")}</div>`;
  const thmBind = () => { document.querySelectorAll("[data-vw]").forEach(b => b.onclick = () => { try { localStorage.setItem("fwz-view", b.dataset.vw); } catch (e) { } fwzViewApply(); settingsView(); }); const tb = document.getElementById("thm"); if (tb) tb.onclick = () => { const h = document.documentElement.classList, z = h.toggle("zw"); try { localStorage.setItem("fwz-theme", z ? "zw" : "dark"); } catch (e) {} const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = z ? "#c8161d" : "#121419"; tb.textContent = z ? "Design: Zuchwil hell · auf Dunkel wechseln" : "Design: Dunkel · auf Zuchwil hell wechseln"; }; };
  const outBind = () => { thmBind(); const ob = document.getElementById("outb"); if (ob) ob.onclick = () => FWZ.logout().then(() => start()); };
  if (!adm) { app.innerHTML = `<section class="hero"><h1>Einstellungen</h1><p>${me ? "Angemeldet als " + esc(me) + "." : "Nicht angemeldet."}</p></section>${thmHtml}${outHtml}`; outBind(); window.scrollTo(0, 0); return; }
  app.innerHTML = `<section class="hero"><h1>Einstellungen</h1><p>Benutzerverwaltung: Wer kann was sehen.</p></section>${who}
    <div class="cfgtw"><table class="cfgt"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table></div>
    <p class="foot">Spalte «Alle» gilt für jeden Benutzer ohne eigene Spalte.</p>
    ${adm ? `<h3 class="zh">Benutzer hinzufügen</h3><div class="cfgadd"><input id="cfgnu" placeholder="Anmeldename, z. B. max" autocomplete="off" autocapitalize="none"><input id="cfgnp" type="text" placeholder="Passwort (mind. 6 Zeichen)" autocomplete="off" autocapitalize="none"><button class="btn primary" id="cfgau">Benutzer erstellen</button></div>
      <h3 class="zh">Administratoren</h3><div class="cfglist">${(CFG.admins || []).map(a => `<div class="cfgrow"><span>${esc(a)}</span>${(CFG.admins.length > 1 && a !== me) ? `<button class="btn ghost" data-da="${esc(a)}">Entfernen</button>` : ""}</div>`).join("")}</div>
      <div class="cfgadd"><input id="cfgna" placeholder="Anmeldename" autocomplete="off" autocapitalize="none"><button class="btn" id="cfgaa">Administrator hinzufügen</button></div>` : ""}
    <h3 class="zh">Geräte</h3><div id="cfgdev" class="cfgdev"><p class="sinfo">Lade …</p></div>
    <h3 class="zh">Protokoll: wer war wann online</h3><div id="cfglog" class="cfgdev"><p class="sinfo">Lade …</p></div>
    ${thmHtml}${outHtml}
    <div id="cfgmsg" class="sinfo" role="status"></div>
    <p class="foot">Bestehende Passwörter lassen sich in der App nicht ändern; bei Vergessen: Zugang in Firebase löschen und hier mit neuem Passwort neu erstellen. Neue Benutzer legst du oben direkt an (Name und Passwort). Hier legst du fest, was ein Name in der App sieht. Ausgeblendete Kacheln sind weg, aber keine Zugriffssperre: Dateien und Lektionen schützt die Datenbank.</p>`;
  const msg = document.getElementById("cfgmsg"), nm = s => (s || "").trim().toLowerCase().replace(/@.*$/, "").replace(/[^a-z0-9._-]/g, "");
  outBind(); cfgDevices(); cfgLog();
  app.querySelectorAll("input[data-id]").forEach(c => c.onchange = () => { const l = c.dataset.u ? CFG.users[c.dataset.u] : CFG.def; l.hide = l.hide.filter(x => x !== c.dataset.id); if (!c.checked) l.hide.push(c.dataset.id); cfgSave(msg); });
  app.querySelectorAll("[data-du]").forEach(b => b.onclick = () => { if (!b.dataset.c) { b.dataset.c = 1; b.textContent = "Entfernen?"; b.classList.add("sure"); return; } delete CFG.users[b.dataset.du]; cfgSave(msg).then(settingsView); });
  document.getElementById("cfgau").onclick = async () => {
    const n = nm(document.getElementById("cfgnu").value), pw = document.getElementById("cfgnp").value, bt = document.getElementById("cfgau");
    if (!n) { msg.textContent = "Bitte einen Anmeldenamen eingeben."; return; }
    if (pw.length < 6) { msg.textContent = "Das Passwort braucht mindestens 6 Zeichen."; return; }
    bt.disabled = true; msg.textContent = "Erstelle Benutzer …";
    let note = "";
    try { await FWZ.createUser(n, pw); note = "Benutzer «" + n + "» erstellt. Passwort: " + pw; }
    catch (e) { const c = (e && e.code) || ""; if (/email-already-in-use/.test(c)) note = "Den Zugang «" + n + "» gab es schon, er wurde zur Liste hinzugefügt (Passwort unverändert)."; else { bt.disabled = false; msg.textContent = /weak-password/.test(c) ? "Passwort zu schwach." : /operation-not-allowed/.test(c) ? "In Firebase ist die Anmeldung per E-Mail/Passwort nicht aktiviert." : "Fehler beim Erstellen" + (c ? " (" + c + ")" : "") + "."; return; } }
    if (!CFG.users[n]) CFG.users[n] = { hide: CFG.def.hide.slice() };
    await cfgSave(msg); settingsView(); document.getElementById("cfgmsg").textContent = note;
  };
  document.getElementById("cfgaa").onclick = () => { const n = nm(document.getElementById("cfgna").value); if (!n) { msg.textContent = "Bitte einen Anmeldenamen eingeben."; return; } if (!CFG.admins.includes(n)) CFG.admins.push(n); cfgSave(msg).then(settingsView); };
  app.querySelectorAll("[data-da]").forEach(b => b.onclick = () => { CFG.admins = CFG.admins.filter(x => x !== b.dataset.da); cfgSave(msg).then(settingsView); });
  window.scrollTo(0, 0);
}

/* Zahnrad oben rechts: für alle Angemeldeten (Nicht-Admins sehen nur Abmelden) */
(() => {
  const b = document.createElement("button"); b.id = "gear"; b.type = "button"; b.hidden = true; b.setAttribute("aria-label", "Einstellungen"); b.title = "Einstellungen";
  b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
  b.onclick = () => { try { rgClose(); } catch (e) {} settingsView(); };
  document.body.appendChild(b);
  const upd = () => { b.hidden = !(typeof cfgMe === "function" && cfgMe()) || state.view === "gate" || state.view === "set"; b.classList.toggle("onhome", state.view === "start"); document.body.classList.toggle("hasgear", !b.hidden); };
  new MutationObserver(upd).observe(app, { childList: true });
  FWZ.onChange(upd); upd();
})();

/* Gerätezähler: Lebenszeichen alle 2 Minuten, solange die App sichtbar ist */
(() => { const p = () => { if (typeof FWZ !== "undefined" && FWZ.user && !document.hidden) FWZ.ping().catch(() => {}); };
  FWZ.onChange(p); setInterval(p, 120000); document.addEventListener("visibilitychange", p); p(); })();
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
function vlThemaTxt() { if (lesNum(VL.nr || "")) return ""; const x = vlFind(VL.thema); return x ? " " + (x[0] + " " + x[1]).replace(/[\\/:*?"<>|]/g, "-").slice(0, 60).trim() : ""; }
function vlQuelle() { const x = vlFind(VL.thema); return x ? "Basiswissen, Kap. " + x[0] + " " + x[1] + " (S. " + x[2] + ")" : ""; }
function vlImg(file) { return new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { const k = Math.min(1, 700 / Math.max(im.width, im.height)), w = Math.round(im.width * k), h = Math.round(im.height * k), c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h); URL.revokeObjectURL(u); res({ w, h, d: c.toDataURL("image/jpeg", 0.72) }); }; im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("Bild konnte nicht gelesen werden.")); }; im.src = u; }); }
function vlModel() {
  return { nr: VL.nr || "", kopf1: "Ausbildung", kopf2: VL.kopf2 || "", version: VL.ver || "", thema: VL.thema || "", ziele: vlLines(VL.ziele), krit: vlLines(VL.krit), material: vlLines(VL.mat), fahrzeuge: vlLines(VL.fz),
    stufeTxt: VL.stufe + "   |   Dauer: " + vlDauer() + " Min.", logo: VLN ? null : (window.LOGOJ || null),
    quelle: vlQuelle(), c2: 135,
    ablauf: VL.ab.map(r => ({ min: r.min || "", titel: r.t || "", zeilen: vlLines(r.z), hinweis: (r.h || "").trim(), imgs: (r.im || []).map(u => ({ w: u.w, h: u.h, b64: u.d.split(",")[1] })) })), fname: "Lektion " + (VLN ? "Neutral " : "") + (VL.nr || "").replace(/[\\/:*?"<>|]/g, "-") + vlThemaTxt() + " " + VL.stufe + ".pdf" };
}
const CRC_T = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u) { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC_T[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
const VL_BLANK = () => { const d = new Date(); return { kopf2: "Feuerwehrdienst", nr: "", ver: String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear(), thema: "", stufe: "", dauer: "", ziele: "", krit: "", mat: "", fz: "", ab: Array.from({ length: 8 }, () => ({ min: "", t: "", z: "", h: "" })) }; };
function vlDocx(blank) { const keep = VL; try { if (blank) VL = VL_BLANK(); else if (!VL) vlLoad(); return vlDocxIn(blank); } finally { VL = keep; } }
function vlDocxIn(blank) {
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
  b += para(r("Ausbildungsstufe:", { b: 1 }) + tb() + r(VL.stufe) + tb() + r("Dauer:", { b: 1 }) + tb() + r((blank ? "" : vlDauer()) + " Min."), '<w:tabs><w:tab w:val="left" w:pos="2552"/><w:tab w:val="left" w:pos="7797"/><w:tab w:val="right" w:pos="9639"/></w:tabs>') + empty();
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
  return new File([...parts, ...cd, end], blank ? (VLN ? "Lektion Neutral leer.docx" : "Lektion Feuerwehr Zuchwil leer.docx") : m.fname.replace(/\.pdf$/, ".docx"), { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
function vorlageView(neutral) {
  VLN = !!neutral; vlLoad(); state.mod = null; state.view = "les"; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  const inp = (k, l, ph, ls) => `<label class="vlf"><span>${l}</span><input data-k="${k}" value="${esc(VL[k])}" placeholder="${esc(ph || "")}"${ls ? ` list="${ls}" autocomplete="off"` : ""}></label>`;
  const ta = (k, l, n, ph) => `<label class="vlf"><span>${l}</span><textarea data-k="${k}" rows="${n}" placeholder="${esc(ph || "")}">${esc(VL[k])}</textarea></label>`;
  const rows = () => VL.ab.map((r, i) => `<div class="vlrow" data-i="${i}"><div class="vlr1"><span class="vlh" aria-label="Verschieben" title="Zum Verschieben ziehen">⋮⋮</span><input data-r="min" inputmode="numeric" value="${esc(r.min)}" aria-label="Minuten" placeholder="Min."><input data-r="t" value="${esc(r.t)}" aria-label="Titel" placeholder="Titel des Abschnitts"><button class="btn vldel" aria-label="Zeile löschen">×</button></div><div class="vlmv"><button class="btn vlup" aria-label="Nach oben">▲</button><button class="btn vldn" aria-label="Nach unten">▼</button></div><textarea data-r="z" rows="2" placeholder="Ablauf / Inhalt (eine Zeile pro Absatz)">${esc(r.z)}</textarea><textarea data-r="h" rows="2" placeholder="Hinweise | Hilfen">${esc(r.h)}</textarea><input data-bw list="vlbw2" autocomplete="off" placeholder="+ Verweis auf Basiswissen (Thema suchen)"><div class="vlimgs">${(r.im || []).map((u, j) => `<span class="vlth"><img src="${u.d}" alt="Bild ${j + 1}"><button class="vlx" data-j="${j}" aria-label="Bild entfernen">×</button></span>`).join("")}<label class="btn vladdimg">+ Bild<input type="file" accept="image/*" multiple hidden></label></div></div>`).join("");
  app.innerHTML = `<section class="hero"><h1>${VLN ? "Vorlage Lektion Neutral (Formular)" : "Vorlage Lektion Feuerwehr Zuchwil (Formular)"}</h1><p>${VLN ? "Ohne Kopfzeile (Logo). " : ""}Felder ausfüllen, dann als PDF oder Word exportieren. Deine Eingaben bleiben auf diesem Gerät gespeichert.</p></section>
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
