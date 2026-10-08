const APP_VERSION = "1.25";
/* ---------- Zustand und Speicher ---------- */
const app = document.getElementById("app");
const backBtn = document.getElementById("back");
FWZ.onChange(() => { if (state.view === "les") lesView(); });
let state = { mod: null, tab: "sum", ch: null, cf: null, lc: null };
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
function start() {
  state.mod = null; state.from = null; state.view = "start"; backBtn.hidden = true;
  document.body.classList.add("startpage"); document.querySelector(".top").hidden = true;
  app.innerHTML = `
    <section class="landing">
      <button class="logobtn" id="logoup" aria-label="Nach Update suchen"><img src="logo.jpg" alt="Feuerwehr Zuchwil"></button>
      <div class="menu">
        <button class="mbtn main" id="t-reg">Reglemente</button>
        <button class="mbtn main" id="t-les">Lektionen</button>
        <button class="mbtn main" id="t-ao">Lernen für den Ausbildungsoffizier</button>
      </div>
      <div class="bottom">
        <div class="clock" id="clock"></div>
        <div class="date" id="date"></div>
        <div class="ver-foot" id="verf">V${APP_VERSION} · Logo antippen zum Aktualisieren</div>
      </div>
    </section>`;
  const tick = () => { const c = document.getElementById("clock"); if (!c) return clearInterval(clk); c.textContent = new Date().toLocaleTimeString("de-CH", { hour12: false }); const dt = document.getElementById("date"); if (dt) dt.textContent = new Date().toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); };
  clearInterval(window.clk); tick(); window.clk = setInterval(tick, 1000); var clk = window.clk;
  document.getElementById("logoup").onclick = appUpdate;
  document.getElementById("t-reg").onclick = home;
  document.getElementById("t-les").onclick = () => { state.lc = null; lesView(); };
  document.getElementById("t-ao").onclick = aoView;
  window.scrollTo(0, 0);
}

async function appUpdate() {
  const v = document.getElementById("verf"); if (!v) return;
  v.textContent = "Suche nach Update …";
  try {
    const t = await (await fetch("app.js?u=" + Date.now(), { cache: "no-store" })).text();
    const nv = (t.match(/APP_VERSION = "([^"]+)"/) || [])[1];
    if (nv && nv === APP_VERSION) { v.textContent = "Die App ist aktuell (V" + APP_VERSION + ")"; setTimeout(() => { const e = document.getElementById("verf"); if (e) e.textContent = "V" + APP_VERSION + " · Logo antippen zum Aktualisieren"; }, 3500); return; }
    v.textContent = "Neue Version" + (nv ? " V" + nv : "") + " wird geladen …";
    if ("caches" in window) for (const k of await caches.keys()) await caches.delete(k);
    if ("serviceWorker" in navigator) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    location.reload();
  } catch (e) { v.textContent = "Keine Verbindung, Update nicht möglich."; }
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
      if (paras.length || titleHit) res.push({ t: "s", m, s, i, paras: paras.length ? paras.slice(0, 2) : [s.p[0]], score: titleHit ? 2 : 1 });
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
      return `<button class="hit" data-n="${n}"><div class="where">${esc(r.m.title)} · ${esc(k)}Zusammenfassung</div><h3>${hl(r.s.t, words)}</h3>${r.paras.map(p => `<p>${hl(snip(p, words), words)}</p>`).join("")}</button>`;
    }
    return `<div class="hit card"><div class="where">${esc(r.m.title)} · Lernkarte${r.c[2] ? " · Kap. " + esc(r.c[2]) : ""}</div><p>${hl(r.c[0], words)}</p><p class="ans">${hl(r.c[1], words)}</p></div>`;
  }).join("") + "</div>";
  box.querySelectorAll(".hit[data-n]").forEach(b => b.addEventListener("click", () => {
    const r = shown[+b.dataset.n];
    state.mod = r.m.id; state.tab = "sum"; state.cf = null; state.ch = r.s.g || null;
    renderMod(); window.scrollTo(0, 0);
    const d = document.getElementById("sec-" + r.i); if (d) { d.open = true; d.scrollIntoView({ block: "start" }); }
  }));
}
function home() {
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  state.mod = null; state.from = null; state.view = "list"; backBtn.hidden = false;
  app.innerHTML = `
    <section class="hero">
      <h1>Reglemente</h1>
      <p>Wähle ein Reglement. Lies die Zusammenfassung, übe mit Lernkarten und teste dich im Quiz.</p>
    </section>
    <div class="srch"><input type="search" id="q" placeholder="Reglemente durchsuchen (z. B. Atemschutz, OAABS, 118)" aria-label="Suche" autocomplete="off"></div>
    <div id="sbox" hidden></div>
    <div class="grid" id="mgrid">${MODS.map(m => {
      const k = mp(m.id).known.length, n = m.cards.length, best = mp(m.id).best;
      return `<button class="tile" data-id="${m.id}">
        ${m.id === "basis" ? '<span class="tag">Neu 2026</span>' : '<span class="tag plain">FKS</span>'}
        <h2>${esc(m.id === "basis" ? "Basiswissen Zusammengefassung" : m.title + " Zusammenfassung")}</h2>
        <div class="sub">${esc(m.sub)}</div>
        <div class="meter" aria-hidden="true"><i style="width:${Math.round(100 * k / n)}%"></i></div>
        <div class="facts"><span>${k} von ${n} Karten gewusst</span><span>${best === null ? "Quiz offen" : "Quiz-Bestwert " + best + "/" + m.quiz.length}</span></div>
      </button>
      <button class="tile" data-id="pdf:${m.id}"><span class="tag">PDF</span><h2>${esc(RGDEF[m.id].short)} komplett</h2><div class="sub">${RGDEF[m.id].tile}</div></button>`;
    }).join("")}</div>
    <p class="foot">Lernhilfe aus den FKS-Reglementen von feukos.ch. Massgebend ist immer das jeweilige Reglement in der gültigen Fassung.</p>`;
  app.querySelectorAll(".tile").forEach(b => b.addEventListener("click", () => b.dataset.id.startsWith("pdf:") ? rgView(b.dataset.id.slice(4)) : openMod(b.dataset.id)));
  const qi = document.getElementById("q"), sb = document.getElementById("sbox"), mg = document.getElementById("mgrid");
  qi.addEventListener("input", () => {
    const v = qi.value.trim();
    if (v.length < 2) { sb.hidden = true; mg.hidden = false; return; }
    mg.hidden = true; sb.hidden = false; renderSearch(v, sb);
  });
  window.scrollTo(0, 0);
}
const RGDEF = {
  basis: { short: "Basiswissen", enc: "reglement-basiswissen.enc", file: "Reglement Basiswissen FKS.pdf", tile: "Das ganze Reglement mit allen 296 Seiten (FKS 07/2026), direkt in der App zum Blättern.", hero: "Das ganze Reglement Basiswissen, FKS 07/2026.", online: "https://docs.feukos.ch/Basiswissen/ReglementBasiswissenDE/" },
  einsatz: { short: "Einsatzführung", enc: "reglement-einsatzfuehrung.enc", file: "Reglement Einsatzführung FKS.pdf", tile: "Das ganze Reglement mit allen 84 Seiten, direkt in der App zum Blättern.", hero: "Das ganze Reglement Einsatzführung, FKS.", online: "" }
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
async function rgView(id) {
  rgClose(); const D = RGDEF[id]; let RGDOC = RGDOCS[id];
  state.mod = null; state.view = "pdf"; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  app.innerHTML = `<section class="hero"><h1>${esc(D.short)} komplett</h1><p>${D.hero} © FKS, nur zur internen Ausbildung.${D.online ? ' <a class="lnk" href="' + D.online + '" target="_blank" rel="noopener">Online-Version</a>' : ""}</p></section>
    <div id="rgm" role="status" class="note">Lade Reglement …</div><div id="rgv"></div>`;
  window.scrollTo(0, 0);
  const msg = document.getElementById("rgm");
  let file;
  try { file = await rgLoad(msg, id); msg.textContent = "Öffne …"; if (!RGDOC) { const lib = await import("./pdfjs/pdf.min.mjs"); lib.GlobalWorkerOptions.workerSrc = new URL("./pdfjs/pdf.worker.min.mjs", location.href).href; RGDOC = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; RGDOCS[id] = RGDOC; } }
  catch (e) { msg.textContent = (e && e.message) || "Fehler beim Laden."; return; }
  if (state.view !== "pdf") return;
  const N = RGDOC.numPages, host = document.getElementById("rgv"), p1 = await RGDOC.getPage(1), vp1 = p1.getViewport({ scale: 1 }), ratio = vp1.height / vp1.width;
  let zoom = 1, saved = 1; try { saved = Math.min(N, Math.max(1, +localStorage.getItem("fwz-rgp-" + id) || 1)); } catch (e) {}
  msg.className = "rgbar"; msg.innerHTML = `<button class="btn" id="rgz-">−</button><button class="btn" id="rgz+">+</button><span class="rgpg"><input id="rgn" type="number" min="1" max="${N}" value="${saved}" inputmode="numeric" aria-label="Seite"> / ${N}</span><button class="btn" id="rgs">Teilen</button><button class="btn" id="rgp">Drucken</button>`;
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
  const setZ = z => { const keep = cur; zoom = Math.min(3, Math.max(1, z)); host.style.overflowX = zoom > 1 ? "auto" : ""; RGOBS.disconnect(); size(); pages.forEach(d => RGOBS.observe(d)); goto(keep); };
  document.getElementById("rgz+").onclick = () => setZ(zoom + .5); document.getElementById("rgz-").onclick = () => setZ(zoom - .5);
  document.getElementById("rgs").onclick = () => acts.share(); document.getElementById("rgp").onclick = () => acts.print();
  if (saved > 1) setTimeout(() => goto(saved), 50);
}

/* ---------- Reglement ---------- */
function openMod(id, tab) { state.ch = null; state.cf = null; state.lc = null; state.mod = id; state.tab = tab || "sum"; renderMod(); window.scrollTo(0, 0); }
function renderMod() {
  const m = getMod(state.mod); backBtn.hidden = false;
  app.innerHTML = `
    <section class="head"><h1>${esc(m.title)}</h1><div class="ver">${esc(m.ver)}</div></section>
    <div class="tabs" role="tablist">
      ${[["sum", "Zusammenfassung"], ["cards", "Lernkarten"], ["quiz", "Quiz"]].map(([k, l]) => `<button role="tab" data-tab="${k}" aria-selected="${state.tab === k}">${l}</button>`).join("")}
    </div>
    <div id="body"></div>`;
  app.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => { state.tab = b.dataset.tab; state.lc = null; renderMod(); }));
  const body = document.getElementById("body");
  if (state.tab === "sum") summary(m, body);
  else if (state.tab === "cards") cards(m, body);
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
  return (s.bx || []).map(([k, p, l]) => `<div class="bx ${k}"><div class="bxh">${k === "r" ? "⚠ Achtung" : "☞ Hinweis"}<span>S. ${p}</span></div><ul>${l.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("");
}
function secHtml(s, i, open) {
  const imgs = (s.img || []).map(([k, c]) => IMG[k] ? `<figure class="fig"><button class="zoom" data-k="${k}" aria-label="Bild vergrössern"><img src="${IMG[k]}" alt="${esc(c)}" loading="lazy"></button><figcaption>${esc(c)}</figcaption></figure>` : "").join("");
  return `<details class="sec" id="sec-${i}"${open ? " open" : ""}><summary>${esc(s.t)}</summary><ul>${s.p.map(x => `<li>${esc(x)}</li>`).join("")}</ul>${bxHtml(s)}${imgs}</details>`;
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
    el.innerHTML = (m.note ? `<div class="note">${esc(m.note)}</div>` : "") + m.sections.map((s, i) => secHtml(s, i, i === 0)).join("");
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
    ${z}${g.items.map(([s, i]) => secHtml(s, i, true)).join("")}
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
  app.innerHTML = '<section class="hero"><h1>Lektionen</h1></section>' + loginBox + mlHtml + (state.lc ? '<div id="body"></div>' : '<details class="lgrp" id="eig"><summary><span>Eigene Lektionen (PDF / Word)</span><b id="eign">…</b></summary><div class="lgbody" id="body"></div></details>');
  const lgo0 = document.getElementById("lgo"); if (lgo0) lgo0.onclick = loginView;
  document.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { state.lc = b.dataset.m; lesView(); window.scrollTo(0, 0); }));
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
function chaptersOf(m) {
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

backBtn.addEventListener("click", () => { if (state.view === "pdf") { rgClose(); home(); return; } if (state.view === "les" && state.lc) { state.lc = null; lesView(); window.scrollTo(0, 0); } else if (state.mod && state.from === "ao" && state.direct) { aoGo(state.aoR || ""); } else if (state.mod && state.ch && state.tab === "sum") { state.ch = null; renderMod(); window.scrollTo(0, 0); } else if (state.mod && state.from === "ao") { aoGo(state.aoR || ""); } else if (state.mod) home(); else if (state.view === "ao" || state.view === "ao-sub") aoBack(); else start(); });
start();

if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
