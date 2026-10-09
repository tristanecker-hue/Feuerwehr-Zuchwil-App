/* Ausbildungsoffizier: Kurs 70 (Di 20.10. bis Fr 23.10.2026, Feuerwehr Grenchen).
   Kursdaten aus Kursaufgebot 70/26/1 und Tagesbefehl (Version 02.10.2026).
   Fachinhalte (Zahlen, Zusammenfassung, Lernkarten, Quiz) stammen aus dem Reglement Basiswissen in dieser App. */
const AO_REGL = "https://docs.feukos.ch/Basiswissen/ReglementBasiswissenDE/";
const AO_T0 = new Date(2026, 9, 20, 7, 30);
/* Persönlicher Stand (Notizen, Checklisten, Klasse): pro Benutzer getrennt, angemeldet zusätzlich in der Cloud (nur eigenes Dokument) */
const AO_DEF = () => ({ k: 1, chk: {}, notes: {}, known: {} });
const AOS = {};
let aoUid = null, aoTm = null;
const aoKey = u => "fwz-ao" + (u ? ":" + u : "");
function aoRead(key) { try { return JSON.parse(localStorage.getItem(key) || "null") || {}; } catch (e) { return {}; } }
function aoApply(o) { Object.keys(AOS).forEach(k => delete AOS[k]); Object.assign(AOS, AO_DEF(), o || {}); }
const aoEmpty = o => !o || !Object.keys(o).length || (!Object.keys(o.notes || {}).some(k => (o.notes[k] || "").trim()) && !Object.keys(o.chk || {}).length && !Object.keys(o.known || {}).length);
function aoSave() {
  AOS._t = Date.now();
  try { localStorage.setItem(aoKey(aoUid), JSON.stringify(AOS)); } catch (e) {}
  if (aoUid) { clearTimeout(aoTm); aoTm = setTimeout(() => { try { FWZ.pushProgress(AOS).catch(() => {}); } catch (e) {} }, 1200); }
}
async function aoSync() {
  const u = typeof FWZ !== "undefined" && FWZ.user ? FWZ.user.uid : null;
  if (u === aoUid) return;
  clearTimeout(aoTm); aoUid = u;
  if (!u) { aoApply(aoRead(aoKey(null))); return; }
  let local = aoRead(aoKey(u)), cloud = null, ok = true;
  try { cloud = await FWZ.pullProgress(); } catch (e) { ok = false; }
  if (aoEmpty(local) && aoEmpty(cloud)) { const anon = aoRead(aoKey(null)); if (!aoEmpty(anon)) { local = anon; try { localStorage.removeItem(aoKey(null)); } catch (e) {} } }
  let use = local;
  if (cloud && !aoEmpty(cloud) && (aoEmpty(local) || (cloud._t || 0) >= (local._t || 0))) use = cloud;
  aoApply(use);
  try { localStorage.setItem(aoKey(u), JSON.stringify(AOS)); } catch (e) {}
  if (ok && !aoEmpty(AOS) && use !== cloud) { try { FWZ.pushProgress(AOS).catch(() => {}); } catch (e) {} }
}
aoApply(aoRead(aoKey(null)));
if (typeof FWZ !== "undefined") {
  const aoRefresh = () => aoSync().then(() => { if (typeof state !== "undefined" && /^ao/.test(state.view || "")) aoGo(state.aoR || ""); });
  FWZ.onChange(aoRefresh); if (FWZ.user) aoRefresh();
}

/* ---------- Daten ---------- */
const AO_L = { "1": "KEIL (Kennenlernen / Einsteigen / Informieren / Loslegen)", "2": "Lektionszuteilung und Vorbereitung (1. Staffel)", "3": "Lektionszuteilung / Vorbereitung (2. Staffel)", "101": "Pers. Ausrüstung / Sicherheit / Bindungen / Knoten", "102": "Rettungsmittel Leitern (Anlernstufe)", "103": "Rettungsmittel Leitern (Festigungsstufe)", "104": "Personenrettung und Transport", "105": "Leitungsbau", "106": "Verbraucher", "107": "Kleinlöschgeräte", "108": "TLF (Anlernstufe)", "109": "TLF (Festigungsstufe)", "201": "SL / SLS (Schiebeleiter, Schiebeleiter mit Stützen)", "202": "Leitungsbau", "203": "MS ab Gewässer", "204": "MS ab Hydrant", "205": "Personenrettung über Leitern", "206": "TLF", "207": "Lüften", "208": "Einsatzort sichern", "209": "Kleinlöschgeräte" };
const AO_AP = { A1: "FW Magazin, Theorieraum A", A2: "FW Magazin, Theorieraum B", B1: "FW Magazin, Halle West", B2: "FW Magazin, Annex-Bau", B3: "FW Magazin, Haupteingang Ost", B4: "FW Magazin, Eingang Schlauchturm", C1: "Simplonstrasse 6 / Nord", C2: "Simplonstrasse 6 / Süd", D: "Witihof, Neumattstrasse", E: "PP Schwimmbad West", F: "Werkhof, Baudirektion Grenchen", G: "FW Magazin, Hauptplatz", H: "Stadtgebiet Nord ab FW Magazin", I: "Frohheim", K: "Aarebrücke", L: "Magazin Lz Staad", N: "Brühlstrasse, SWG Grenchen" };
/* Zeile: [von, bis, Text für alle, Klasse 1, Klasse 2]; "101/B1" = Lektion/Arbeitsplatz, "=Text" = freier Text */
const AO_DAYS = [
  { d: "Di 20.10.", rows: [
    ["07.30", "07.45", "Rapport Kursstab · Kursbüro"], ["07.45", "08.00", "Eintreffen Kursteilnehmer, Deponieren Material"],
    ["08.00", "08.15", "Begrüssung, Appell, Einführung in die Ausbildung · Theorieraum"],
    ["08.15", "08.45", "", "1/A1", "1/A2"], ["08.45", "10.15", "", "2/A1", "2/A2"],
    ["10.15", "10.45", "Pause · FW Magazin"], ["10.45", "12.00", "", "101/B1", "101/B2"],
    ["12.15", "13.15", "Mittagessen · Restaurant Airport"], ["13.15", "13.30", "Verschiebung auf die Arbeitsplätze"],
    ["13.30", "14.45", "", "102/C1", "102/C2"], ["14.45", "16.00", "", "103/C2", "103/C1"],
    ["16.00", "16.30", "Pause · FW Magazin"], ["16.30", "17.45", "", "104/B3", "104/B4"],
    ["17.45", "18.00", "Verschiebung ins Magazin / Retablieren"], ["18.00", "18.15", "Tageszusammenfassung · Theorieraum"],
    ["18.30", "", "Zimmerbezug · Hotel Airport"], ["19.00", "", "Nachtessen · Restaurant Airport"]] },
  { d: "Mi 21.10.", rows: [
    ["07.15", "07.30", "Rapport Kursstab · Kursbüro"], ["07.30", "08.15", "Theorie: Wie lernt der Mensch? · Theorieraum"],
    ["08.15", "08.30", "Ausrüsten und Verschieben auf Arbeitsplätze"],
    ["08.30", "09.45", "", "107/F", "105/D"], ["09.45", "10.15", "Pause · FW Magazin"],
    ["10.15", "11.30", "", "105/D", "108/G"], ["11.45", "12.45", "Mittagessen · Restaurant Airport"],
    ["12.45", "13.00", "Verschiebung auf die Arbeitsplätze"],
    ["13.00", "14.15", "", "106/E", "109/H"], ["14.15", "15.30", "", "108/G", "106/E"],
    ["15.30", "16.00", "Pause · FW Magazin"], ["16.00", "17.15", "", "109/H", "107/F"],
    ["17.15", "17.30", "Verschiebung ins Magazin / Retablieren"], ["17.30", "18.45", "", "3/A1", "3/A2"],
    ["18.45", "19.00", "Verschiebung"], ["19.00", "", "Verhaltensübung «Grenchen LSZG / ICAO 1.0» · Kursleitung"],
    ["20.30", "", "Nachtessen · Restaurant Airport"]] },
  { d: "Do 22.10.", rows: [
    ["07.15", "07.30", "Rapport Kursstab · Kursbüro"], ["07.30", "08.15", "Theorie: FBEHK für Ausbildungsoffiziere · Theorieraum"],
    ["08.15", "08.30", "Ausrüsten und Verschieben auf Arbeitsplätze"],
    ["08.30", "09.45", "", "201/I", "203/K"], ["09.45", "10.15", "Pause · FW Magazin"],
    ["10.15", "11.30", "", "202/D", "204/L"], ["11.45", "12.45", "Mittagessen · Restaurant Airport"],
    ["12.45", "13.00", "Verschiebung auf die Arbeitsplätze"],
    ["13.00", "14.15", "", "203/K", "201/I"], ["14.15", "15.30", "", "204/L", "205/C1"],
    ["15.30", "16.00", "Pause · FW Magazin"], ["16.00", "17.15", "", "205/C1", "202/D"],
    ["17.15", "17.30", "Verschiebung ins Magazin / Retablieren"],
    ["17.30", "18.30", "", "=Verhaltensübung «Stunde der Wahrheit» (Theorieraum)", "=Kleideranprobe / Lektionsvorbereitung (Garderobe / Fahrzeughalle)"],
    ["18.30", "19.30", "", "=Kleideranprobe / Lektionsvorbereitung (Garderobe / Fahrzeughalle)", "=Verhaltensübung «Stunde der Wahrheit» (Theorieraum)"],
    ["19.30", "19.45", "Tageszusammenfassung · Theorieraum"], ["20.00", "", "Nachtessen · Restaurant Airport"]] },
  { d: "Fr 23.10.", rows: [
    ["07.15", "07.30", "Rapport Kursstab · Kursbüro"], ["07.30", "07.45", "Ausrüsten und Verschieben auf Arbeitsplätze"],
    ["07.45", "09.00", "", "207/B4", "209/F"], ["09.00", "10.15", "", "209/F", "207/B4"],
    ["10.15", "10.45", "Pause · FW Magazin"], ["10.45", "12.00", "", "206/N", "208/H"],
    ["12.15", "13.15", "Mittagessen · Restaurant Airport"], ["13.15", "13.30", "Verschieben auf die Arbeitsplätze"],
    ["13.30", "14.45", "", "208/H", "206/N"], ["14.45", "15.15", "Retablieren / Materialversorgen"],
    ["15.15", "15.45", "Theorie: Kursorganisation / Ausbilderplanung · Theorieraum"],
    ["15.45", "16.45", "Qualifikation · Klassenzimmer"], ["16.45", "17.00", "Schlussbesprechung · Theorieraum"],
    ["17.00", "", "Entlassung"]] }
];

/* Fachthemen: Lektionen, Reglement-Kapitel (Basiswissen), Suchbegriffe, Selbsttest-Fragen */
const AO_T = [
  { id: "ausr", t: "Persönliche Ausrüstung, Sicherheit, Bindungen, Knoten", l: ["101"], kap: ["1", "10"], q: ["Knoten", "Bindung", "Seil", "Ausrüstung"], fr: [
    "Welche persönliche Ausrüstung trägst du im Einsatz, und was kontrollierst du vor dem Einsatz?",
    "Welche Knoten und Bindungen musst du sicher beherrschen, und wofür setzt du welchen ein?",
    "Wie sicherst du dich und andere bei dieser Tätigkeit? Welche Gefahren und Regeln gibt es?",
    "Wie zeigst du einem Anfänger einen Knoten: in welchen Schritten, mit welchen Merkhilfen?",
    "Welche Fehler machen Anfänger hier am häufigsten, und woran erkennst du sie?"] },
  { id: "leiter", t: "Rettungsmittel Leitern", l: ["102", "103"], kap: ["5"], q: ["Leiter", "Steckleiter", "Hakenleiter", "Anstellwinkel"], fr: [
    "Welche Leitern gibt es, und wofür setzt du sie als Rettungsmittel ein?",
    "Wie viele Personen braucht es zum Aufstellen, und welche Kommandos gibst du?",
    "Worauf achtest du beim Standort (Untergrund, Hindernisse, Gefahren aus der Umgebung)?",
    "Welchen Anstellwinkel brauchst du, und wie kontrollierst du ihn?",
    "Was unterscheidet Anlern- und Festigungsstufe? Was machst du in der jeweiligen Stufe anders?"] },
  { id: "pers", t: "Personenrettung und Transport", l: ["104"], kap: ["5"], q: ["Personenrettung", "Transport", "Rettungsmittel"], fr: [
    "In welcher Reihenfolge gehst du bei der Personenrettung vor?",
    "Welche Rettungs- und Transportgriffe gibt es, und wann wendest du welchen an?",
    "Wie schützt du dich selbst und die gerettete Person?",
    "Wann und mit welchen Angaben übergibst du an den Rettungsdienst?",
    "Wie baust du die Lektion auf, damit alle jeden Griff selber üben?"] },
  { id: "lbau", t: "Leitungsbau", l: ["105", "202"], kap: ["6"], q: ["Leitungsbau", "Schlauch", "Druckverlust"], fr: [
    "Welche Arbeitsschritte hat der Leitungsbau von der Wasserentnahme bis zum Verbraucher?",
    "Welche Rollen gibt es in der Mannschaft, und wer macht was?",
    "Wie kontrollierst du die Leitung (Kupplungen, Knickstellen, Druck)?",
    "Was führt zu Druckverlust, und wie vermeidest du ihn?",
    "Wie erklärst du Kommandos so, dass sie in der Übung sofort sitzen?"] },
  { id: "verbr", t: "Verbraucher", l: ["106"], kap: ["6"], q: ["Verbraucher", "Strahlrohr", "Zumischer"], fr: [
    "Welche Verbraucher gibt es, und wofür eignet sich jeder?",
    "Wie bedienst du die Verbraucher sicher (Einstellungen, Wassermenge, Druck)?",
    "Welche Kräfte und Gefahren entstehen, und wie begegnest du ihnen?",
    "Wie ordnest du einen Verbraucher dem Einsatzziel zu?",
    "Woran erkennst du, dass die Teilnehmer den Verbraucher richtig bedienen?"] },
  { id: "kl", t: "Kleinlöschgeräte", l: ["107", "209"], kap: ["6"], q: ["Kleinlöschgerät", "Feuerlöscher", "Löschdecke"], fr: [
    "Welche Kleinlöschgeräte gibt es, und für welche Brände eignen sie sich?",
    "Wie setzt du ein Kleinlöschgerät richtig ein (Standort, Windrichtung, Technik)?",
    "Was darfst du damit nicht löschen, und welche Gefahren gibt es?",
    "Wie kontrollierst und versorgst du die Geräte nach dem Einsatz?",
    "Wie lässt du üben, ohne Gefahr und ohne unnötigen Verbrauch?"] },
  { id: "tlf", t: "TLF", l: ["108", "109", "206"], kap: ["6"], q: ["TLF", "Schnellangriff", "Pumpe", "Schaumrohr"], fr: [
    "Welche Ausrüstung hat das TLF, und wo ist was verlastet?",
    "Wie bringst du das TLF in Stellung, und welche Schritte folgen bis zur Wasserabgabe?",
    "Wie bedienst du die Pumpe, und worauf achtest du dabei?",
    "Welche Sicherheitsregeln gelten am Fahrzeug?",
    "Was unterscheidet Anlern- und Festigungsstufe, und wie änderst du dein Vorgehen?"] },
  { id: "sl", t: "SL / SLS: Schiebeleiter", l: ["201"], kap: ["5"], q: ["Schiebeleiter", "Stütze", "Anstellwinkel"], fr: [
    "Was unterscheidet die SL (Schiebeleiter) von der SLS (Schiebeleiter mit Stützen)?",
    "Wie viele Personen braucht es zum Aufstellen, und welche Kommandos gibst du?",
    "Wann setzt du die Stützen ein, und wie stellst du sie ein?",
    "Welchen Anstellwinkel brauchst du, und wie kontrollierst du ihn?",
    "Welche Sicherheitsregeln gelten beim Aufstellen, Besteigen und Abbauen?"] },
  { id: "gew", t: "MS ab Gewässer", l: ["203"], kap: ["6"], q: ["Gewässer", "Seiher", "Saugleitung", "Motorspritze"], fr: [
    "Wie stellst du die Motorspritze am Gewässer auf (Standort, Zugang, Saughöhe)?",
    "Wie baust du die Saugleitung auf und prüfst sie auf Dichtheit?",
    "Wie überdeckst du den Seiher richtig?",
    "Wie nimmst du die Pumpe in Betrieb, und was tust du, wenn kein Wasser kommt?",
    "Wie sicherst du den Arbeitsplatz am Ufer?"] },
  { id: "hyd", t: "MS ab Hydrant", l: ["204"], kap: ["6"], q: ["Hydrant", "Eingangsdruck", "Motorspritze"], fr: [
    "Wie öffnest und schliesst du einen Hydranten richtig?",
    "Welchen Eingangsdruck braucht die Motorspritze, und wie überwachst du ihn?",
    "Wie baust du die Zuleitung auf, und was verhinderst du dabei?",
    "Wie gehst du bei Störungen vor?"] },
  { id: "pl", t: "Personenrettung über Leitern", l: ["205"], kap: ["5"], q: ["Leiter", "Personenrettung", "Anstellwinkel"], fr: [
    "Welche Schritte hat die Rettung über Leitern, und wer übernimmt welche Aufgabe?",
    "Wie sicherst du Retter und gerettete Person auf der Leiter?",
    "Wie stellst du die Leiter für diesen Zweck auf (Anstellwinkel, Standort)?",
    "Wann ist die Leiter das falsche Mittel, und welche Alternativen gibt es?"] },
  { id: "lueft", t: "Lüften", l: ["207"], kap: ["8"], q: ["Lüfter", "Überdruck", "Lüften", "Zuluft"], fr: [
    "Welche Lüfter gibt es, und wofür setzt du sie ein?",
    "Wie funktioniert das Überdrucklüften: Wo steht der Lüfter, wo sind Zuluft und Abluft?",
    "Welche Voraussetzungen und Gefahren gibt es (Brandausbreitung, Rauchgase)?",
    "Wann lüftest du, und wann lüftest du nicht?"] },
  { id: "ort", t: "Einsatzort sichern", l: ["208"], kap: ["1"], q: ["Notsignal", "Vorsignal", "Absperr"], fr: [
    "In welcher Reihenfolge sicherst du einen Einsatzort an der Strasse?",
    "Welche Distanzen gelten für die Notsignalisation innerorts und ausserorts?",
    "Wie signalisierst du auf richtungsgetrennten Strassen?",
    "Wie schützt du dich selbst (Warnweste, Fahrzeugposition)?",
    "Wie erklärst du die Lektion anschaulich im Gelände?"] }
];
const AO_CHK = [
  { g: "Mitnehmen", items: [
    ["a1", "Persönliche Brandschutzausrüstung"], ["a2", "Arbeitsanzug (Theorie und Restaurant)"], ["a3", "Ersatzwäsche"],
    ["a4", "Reglement Basiswissen (alternativ FKS E-Paper auf Laptop oder Tablet)"], ["a5", "Feuerwehrdienstbüchlein"],
    ["a6", "Notiz- und Schreibmaterial"], ["a7", "Material für die KEIL-Vorstellung (frei wählbar, schnell auf- und abgebaut)"]] },
  { g: "Vorbereiten", items: [
    ["v1", "Reglement Basiswissen intensiv durchgearbeitet"], ["v2", "Kantonale Ergänzungen zum Basiswissen gelesen (LODUR → Info SGV)"],
    ["v3", "KEIL-Vorstellung vorbereitet und mit Stoppuhr geübt (2–3 Min.)"], ["v4", "Alle Fachthemen durchgegangen (Seite «Lektionen»)"]] }
];
const AO_ZK = [["basis", "1"], ["basis", "2"], ["basis", "3"], ["basis", "5"], ["basis", "6"], ["basis", "8"], ["einsatz", "3"], ["einsatz", "5"]];
const AO_KEIL = [["Persönliches", "Wer bin ich, was gehört zu mir?"], ["Feuerwehrerfahrungen", "Wie lange dabei, welche Funktionen und Einsätze?"], ["Motivation für den Kurs", "Warum Ausbildungsoffizier?"], ["Mein Beitrag am Kurs", "Was bringe ich für die Gruppe mit?"], ["Erwartungen", "Was möchte ich aus dem Kurs mitnehmen?"]];

/* ---------- Hilfsfunktionen ---------- */
const aoDay0 = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const aoDiff = d => Math.round((aoDay0(d) - aoDay0(new Date())) / 864e5);
const aoIn = n => n > 1 ? "in " + n + " Tagen" : n === 1 ? "morgen" : n === 0 ? "heute" : "abgelaufen";
const aoPct = (a, b) => b ? Math.round(100 * a / b) : 0;
const aoMeter = (a, b) => `<div class="meter" aria-hidden="true"><i style="width:${aoPct(a, b)}%"></i></div>`;
const aoDate = d => d.toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "numeric" });
function aoSlots(nr, k) {
  const out = [];
  AO_DAYS.forEach(day => day.rows.forEach(r => { const c = r[2 + k]; if (c && c[0] !== "=") { const p = c.split("/"); if (p[0] === nr) out.push({ day: day.d, von: r[0], bis: r[1], ap: p[1] }); } }));
  return out;
}
function aoChkHtml(key, label) { return `<label class="chk"><input type="checkbox" data-c="${esc(key)}"${AOS.chk[key] ? " checked" : ""}><span>${label}</span></label>`; }
function aoBind(el) {
  el.querySelectorAll("input[data-c]").forEach(i => i.addEventListener("change", () => { if (i.checked) AOS.chk[i.dataset.c] = 1; else delete AOS.chk[i.dataset.c]; aoSave(); }));
  el.querySelectorAll("textarea[data-n]").forEach(t => t.addEventListener("input", () => { AOS.notes[t.dataset.n] = t.value; aoSave(); }));
  el.querySelectorAll("[data-r]").forEach(b => b.addEventListener("click", () => aoGo(b.dataset.r)));
  el.querySelectorAll("[data-k]").forEach(b => b.addEventListener("click", () => { AOS.k = +b.dataset.k; aoSave(); aoGo(state.aoR); }));
}
function aoKlasse() { return `<div class="chips" role="group" aria-label="Klasse">${[1, 2].map(k => `<button class="chip" data-k="${k}" aria-pressed="${AOS.k === k}">Klasse ${k}</button>`).join("")}</div>`; }
function aoKap(k) { return "Kap. " + k + ((CHNS.basis || {})[k] ? " " + (CHNS.basis || {})[k] : ""); }
function aoOpen(tab, kap, mod) {
  mod = mod || "basis"; const m = getMod(mod); if (!m) return;
  state.from = "ao"; state.direct = true; state.lc = null; state.mod = mod; state.tab = tab; state.cf = null; state.ch = null;
  if (kap) {
    if (tab === "sum") { const s = m.sections.find(x => x.g && chKey(x.g) === kap); state.ch = s ? s.g : null; }
    else { const h = (tab === "cards" ? m.cards : m.quiz).find(x => String(tab === "cards" ? x[2] : x.c) === kap); if (h) state.cf = tab === "cards" ? h[2] : h.c; }
  }
  renderMod(); window.scrollTo(0, 0);
}
function aoRows(src) {
  const out = [];
  AO_ZK.forEach(([mod, k]) => {
    const info = (CHS[mod] || {})[k]; if (!info) return;
    const nm = (CHNS[mod] || {})[k] || "", tag = (mod === "basis" ? "Basiswissen" : "Einsatzführung") + " · Kap. " + k + (nm ? " " + nm : "");
    info.z.forEach((r, i) => out.push({ id: mod + k + "." + i, q: r[1], a: r[0], tag, src: mod + k }));
  });
  return out;
}

/* ---------- Navigation ---------- */
function aoView() { aoGo(""); }
function aoBack() { const r = state.aoR || ""; if (!r) return start(); aoGo(r.indexOf("lek:") === 0 ? "lek" : ""); }
function aoGo(r) {
  state.aoR = r; state.from = null; state.direct = false; state.mod = null; state.view = r ? "ao-sub" : "ao"; backBtn.hidden = false;
  document.body.classList.remove("startpage"); document.querySelector(".top").hidden = false;
  const f = { "": aoHub, check: aoCheck, keil: aoKeil, lek: aoTopics, meth: aoMeth, zahl: aoZahl, prog: aoProg, kq: aoKq }[r];
  if (f) f(); else if (r.indexOf("lek:") === 0) aoTopic(r.slice(4)); else aoHub();
  window.scrollTo(0, 0);
}

/* ---------- Startseite des Kurses ---------- */
function aoHub() {
  const days = aoDiff(AO_T0);
  const cnt = days > 0 ? `Noch ${days} ${days === 1 ? "Tag" : "Tage"} bis zum Kursbeginn.` : days === 0 ? "Heute ist Kursbeginn: Rapport Kursstab 07.30, Appell 08.00." : "Der Kurs läuft oder ist vorbei.";
  const nC = AO_CHK.reduce((n, g) => n + g.items.length, 0), dC = AO_CHK.reduce((n, g) => n + g.items.filter(i => AOS.chk[i[0]]).length, 0);
  const dT = AO_T.filter(t => AOS.chk["d:" + t.id]).length;
  const dK = AO_KEIL.filter((p, i) => (AOS.notes["keil" + i] || "").trim()).length;
  const pool = aoRows(), dZ = pool.filter(p => AOS.known[p.id]).length;
  const tiles = [
    ["check", "Vorbereitung", "Checkliste", "Material und Vorbereitung laut Kursaufgebot", dC, nC, dC + " von " + nC + " erledigt"],
    ["keil", "Vorstellung", "KEIL", "Persönliche Vorstellung, 2–3 Minuten: Notizen und Stoppuhr", dK, AO_KEIL.length, dK + " von " + AO_KEIL.length + " Punkten notiert"],
    ["lek", "Fachthemen", "Lektionen", "Alle Kurs-Lektionen mit Selbsttest, Reglement-Suche und eigener Planung", dT, AO_T.length, dT + " von " + AO_T.length + " Themen sitzen"],
    ["kq", "Quiz", "Kurs-Quiz", "Fachfragen aus dem Basiswissen zu den Lektionen jedes Kurstags", 0, 0, ""],
    ["meth", "Methodik", "Lektion halten", "Aufbau, Beurteilung, Theorieblöcke und Probelektion", 0, 0, ""],
    ["zahl", "Training", "Zahlen-Trainer", "Wichtige Zahlen aus den Kurs-Kapiteln üben", dZ, pool.length, dZ + " von " + pool.length + " gewusst"],
    ["prog", "Tagesbefehl", "Kursprogramm", "Dienstag bis Freitag, nach Klasse 1 oder 2", 0, 0, ""],
    ["regl", "Nachschlagen", "Reglement Basiswissen", "Zusammenfassung, Lernkarten und Quiz öffnen", 0, 0, ""]
  ];
  app.innerHTML = `<section class="hero"><h1>Ausbildungsoffizier</h1><p>Ku 70 · Di 20. bis Fr 23.10.2026 · Feuerwehr Grenchen. ${cnt}</p></section>
    <div class="grid">${tiles.map(t => `<button class="tile chtile" data-r="${t[0]}"><span class="num">${t[1]}</span><h2>${t[2]}</h2><div class="sub">${t[3]}</div>${t[5] ? aoMeter(t[4], t[5]) : ""}${t[6] ? `<div class="facts"><span>${t[6]}</span></div>` : ""}</button>`).join("")}</div>
    <p class="foot">Quellen: Kursaufgebot 70/26/1 und Tagesbefehl (Version 02.10.2026). Massgebend sind die Unterlagen des SGV und die Anweisungen im Kurs. Fachinhalte stehen im Reglement Basiswissen (FKS).</p>`;
  app.querySelectorAll(".tile").forEach(b => b.addEventListener("click", () => { if (b.dataset.r === "regl") { state.from = "ao"; openMod("basis"); } else aoGo(b.dataset.r); }));
}

/* ---------- Checkliste ---------- */
function aoCheck() {
  app.innerHTML = `<section class="hero"><h1>Vorbereitung</h1><p>Alles aus dem Kursaufgebot an einem Ort. Abhaken wird auf diesem Gerät gespeichert.</p></section>
    ${AO_CHK.map(g => `<h3 class="zh">${g.g}</h3><div class="chklist">${g.items.map(i => aoChkHtml(i[0], esc(i[1]))).join("")}</div>`).join("")}
    <h3 class="zh">Lernunterlagen</h3>
    <div class="note">Reglement Basiswissen online: <a class="lnk" href="${AO_REGL}" target="_blank" rel="noopener">docs.feukos.ch</a><br>Kantonale Ergänzungen zum Basiswissen: LODUR → Info SGV<br>Kursort: Feuerwehr Grenchen, Schmelzistrasse 5, 2540 Grenchen (Magazin-Telefon nur während Kursbetrieb: 032 652 59 59). Kursantritt Dienstag laut Tagesbefehl: Eintreffen 07.45, Appell 08.00.</div>`;
  aoBind(app);
}

/* ---------- Einfacher PDF-Export (Text, A4) ---------- */
function aoPdf(title, sub, blocks, fname) {
  const W = 595, H = 842, M = 56, TW = W - 2 * M, cv = document.createElement("canvas").getContext("2d");
  const fix = s => String(s).replace(/[\u201c\u201d\u201e]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/[\u2013\u2014]/g, "-").replace(/\u2026/g, "...").replace(/\u20ac/g, "EUR").replace(/\t/g, " ").replace(/[^\n\x20-\x7e\xa0-\xff]/g, "?");
  const pages = [[]]; let y = H - M;
  const wrap = (txt, size, bold) => {
    cv.font = (bold ? "bold " : "") + size + "px Helvetica, Arial, sans-serif"; const out = [];
    fix(txt).split("\n").forEach(par => {
      if (!par.trim()) { out.push(""); return; }
      let line = ""; par.split(" ").forEach(w => { const t = line ? line + " " + w : w; if (cv.measureText(t).width > TW && line) { out.push(line); line = w; } else line = t; }); out.push(line);
    }); return out;
  };
  const put = (txt, size, bold, gray, gap) => {
    wrap(txt, size, bold).forEach(l => {
      const lh = size * 1.35; if (y - lh < M) { pages.push([]); y = H - M; }
      y -= lh; pages[pages.length - 1].push({ x: M, y, l, size, bold, gray });
    }); y -= gap || 0;
  };
  put(title, 18, true, 0, 4); put(sub, 10, false, .4, 14);
  blocks.forEach(b => { if (y - 80 < M) { pages.push([]); y = H - M; } put(b.h, 13, true, 0, 2); if (b.s) put(b.s, 9.5, false, .4, 3); put(b.t || "(leer)", 11, false, b.t ? 0 : .5, 14); });
  const esc2 = s => s.replace(/[\\()]/g, "\\$&");
  const objs = [null, "<< /Type /Catalog /Pages 2 0 R >>", null, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"];
  const kids = [];
  pages.forEach(p => {
    const st = p.map(t => `BT /${t.bold ? "F2" : "F1"} ${t.size} Tf ${t.gray} g ${t.x} ${t.y.toFixed(1)} Td (${esc2(t.l)}) Tj ET`).join("\n");
    const ci = objs.length + 1, pi = objs.length;
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${ci} 0 R >>`, `<< /Length ${st.length} >>\nstream\n${st}\nendstream`);
    kids.push(pi);
  });
  objs[2] = `<< /Type /Pages /Kids [${kids.map(k => k + " 0 R").join(" ")}] /Count ${kids.length} >>`;
  let s = "%PDF-1.4\n", off = [];
  objs.slice(1).forEach((o, i) => { off.push(s.length); s += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xr = s.length; s += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
  const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255;
  return new File([u], fname || "KEIL-Vorstellung.pdf", { type: "application/pdf" });
}
function aoPdfActs(file, msg) {
  return {
    open() { const u = URL.createObjectURL(file); const w = window.open(u, "_blank"); if (!w) location.href = u; setTimeout(() => URL.revokeObjectURL(u), 60000); },
    async share() { try { if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: file.name }); else msg.textContent = "Teilen wird von diesem Gerät nicht unterstützt. Nutze «PDF öffnen» und dort das Teilen-Symbol."; } catch (e) { if (e && e.name !== "AbortError") msg.textContent = "Teilen nicht möglich."; } },
    print() { const u = URL.createObjectURL(file), fr = document.createElement("iframe"); fr.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0"; fr.src = u; document.body.appendChild(fr); fr.onload = () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { window.open(u, "_blank"); } setTimeout(() => { fr.remove(); URL.revokeObjectURL(u); }, 60000); }; msg.textContent = "Falls kein Druckfenster erscheint: «PDF öffnen» wählen und dort drucken."; }
  };
}

/* ---------- KEIL ---------- */
function aoWho() {
  if (typeof FWZ === "undefined" || !FWZ.enabled) return '<div class="note">Deine Notizen bleiben auf diesem Gerät gespeichert.</div>';
  if (FWZ.user) return '<div class="note"><b>Persönlich:</b> Diese Notizen gehören <b>' + esc(FWZ.label()) + '</b>. Sie sind nur für dich sichtbar und auf allen deinen Geräten verfügbar, wenn du angemeldet bist.</div>';
  return '<div class="loginbox"><div><b>Nicht angemeldet</b><span>Melde dich an, damit deine Notizen dir gehören, nur du sie siehst und sie auf allen deinen Geräten da sind. Ohne Anmeldung bleiben sie nur auf diesem Gerät.</span></div><button class="btn primary" id="klg">Anmelden</button></div>';
}

function aoKeil() {
  app.innerHTML = `<section class="hero"><h1>KEIL</h1><p>Persönliche Vorstellung am Kurs: 2–3 Minuten, kreativ und ansprechend. Hilfsmittel frei wählbar, aber keine PowerPoint-Präsentation und ohne Flipchart. Auf- und Abbau müssen schnell gehen.</p></section>
    ${aoWho()}
    <div class="note">Im Tagesbefehl steht am Dienstag, 08.15–08.45: L 1 «KEIL (Kennenlernen / Einsteigen / Informieren / Loslegen)» im Theorieraum.</div>
    <div class="keilt"><div class="ktime" id="kt">00:00</div><div class="row"><button class="btn primary" id="kgo">Start</button><button class="btn ghost" id="krs">Zurücksetzen</button><button class="btn" id="kpo">PDF öffnen</button><button class="btn" id="ksh">Teilen</button><button class="btn" id="kpr">Drucken</button></div><div class="sinfo" id="kmsg" role="status"></div><div class="sinfo">Ziel: zwischen 2:00 und 3:00. Die Anzeige wird grün, ab 3:00 rot.</div></div>
    ${AO_KEIL.map((k, i) => `<label class="fld"><span class="fl">${i + 1}. ${k[0]}</span><span class="fh">${k[1]}</span><textarea class="ta" rows="3" data-n="keil${i}" placeholder="Stichworte …">${esc(AOS.notes["keil" + i] || "")}</textarea></label>`).join("")}
    <h3 class="zh">Checkliste</h3><div class="chklist">${[["Alle 5 Punkte haben ein Bild, einen Gegenstand oder eine Geste", "k1"], ["Hilfsmittel passen in die Tasche und stehen in unter einer Minute", "k2"], ["Laut geübt und gestoppt, mindestens dreimal", "k3"], ["Anfang und Schluss auswendig", "k4"]].map(c => aoChkHtml(c[1], esc(c[0]))).join("")}</div>`;
  aoBind(app);
  const klg = document.getElementById("klg"); if (klg) klg.onclick = () => { state.after = () => aoGo("keil"); loginView(); };
  const kmsg = document.getElementById("kmsg");
  const kact = f => () => { try { const acts = aoPdfActs(aoPdf("KEIL-Vorstellung · Ausbildungsoffizier Ku 70", "Feuerwehr Zuchwil" + (typeof FWZ !== "undefined" && FWZ.user ? " · " + FWZ.label() : "") + " · Ziel: 2–3 Minuten", AO_KEIL.map((k, i) => ({ h: (i + 1) + ". " + k[0], s: k[1], t: (AOS.notes["keil" + i] || "").trim() }))), kmsg); kmsg.textContent = ""; acts[f](); } catch (e) { kmsg.textContent = "PDF konnte nicht erstellt werden."; } };
  document.getElementById("kpo").onclick = kact("open"); document.getElementById("ksh").onclick = kact("share"); document.getElementById("kpr").onclick = kact("print");
  let sec = 0, iv = null; const out = document.getElementById("kt"), b = document.getElementById("kgo"), r = document.getElementById("krs");
  const show = () => { out.textContent = String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0"); out.className = "ktime" + (sec > 180 ? " bad" : sec >= 120 ? " ok" : ""); };
  b.onclick = () => { if (iv) { clearInterval(iv); iv = null; b.textContent = "Weiter"; } else { iv = setInterval(() => { if (!document.body.contains(out)) return clearInterval(iv); sec++; show(); }, 1000); b.textContent = "Stopp"; } };
  r.onclick = () => { clearInterval(iv); iv = null; sec = 0; b.textContent = "Start"; show(); };
}

/* ---------- Lektionen ---------- */
function aoTopics() {
  app.innerHTML = `<section class="hero"><h1>Lektionen</h1><p>Alle Fachthemen des Kurses in der Reihenfolge des Tagesbefehls. Pro Thema: Selbsttest, Reglement, eigene Planung.</p></section>
    <div class="grid">${AO_T.map(t => {
      const d = t.fr.filter((f, i) => AOS.chk["s:" + t.id + ":" + i]).length, ok = AOS.chk["d:" + t.id];
      return `<button class="tile chtile" data-r="lek:${t.id}"><span class="num">${t.l.map(n => "L " + n).join(" · ")}</span><h2>${esc(t.t)}</h2>${aoMeter(ok ? t.fr.length : d, t.fr.length)}<div class="facts"><span>${ok ? "sitzt" : d + " von " + t.fr.length + " Fragen sicher"}</span></div></button>`;
    }).join("")}</div>`;
  aoBind(app);
}
function aoLekHtml(t, fest) {
  const src = fest ? (typeof AO_LEKF !== "undefined" ? AO_LEKF : null) : (typeof AO_LEK !== "undefined" ? AO_LEK : null);
  const m = src ? src[t.id] : null; if (!m) return "";
  const stufe = fest ? "Festigungsstufe" : "Anlernstufe";
  const ul = a => a.map(x => `<li>${esc(x)}</li>`).join("");
  return `<h3 class="zh">Musterlektion</h3>
    <div class="note">Muster im Layout der Lektionsvorlage: 50 Min., ${stufe}. Als Ausgangspunkt für deine eigene Lektion gedacht.</div>
    <article class="lek" id="lekdoc">
      <div class="lh"><b>Ausbildung<br>Feuerwehrdienst</b><b class="ln">Lektion Nr. ${esc(m.nr)}</b></div>
      <dl class="lm"><dt>Thema:</dt><dd>${esc(m.thema)}</dd><dt>Ausbildungsstufe:</dt><dd>${stufe} · Dauer: 50 Min.</dd>
        <dt>Ziele:</dt><dd><ul class="lkz">${ul(m.ziele)}</ul></dd>
        <dt>Beurteilungskriterien:</dt><dd><ul class="lkc">${ul(m.krit)}</ul></dd>
        <dt>Material:</dt><dd><ul class="lkb">${ul(m.material)}</ul></dd>
        <dt>Fahrzeuge:</dt><dd><ul class="lkb">${ul(m.fahrzeuge)}</ul></dd></dl>
      <div class="ztw"><table class="zt la"><thead><tr><th>Zeit</th><th>Ablauf der Lektion</th><th>Hinweise / Hilfen</th></tr></thead><tbody>${m.ablauf.map(b => `<tr><td><b>${b.min}’</b></td><td><u><b>${esc(b.titel)}</b></u>${b.zeilen.map(z => `<p>${esc(z)}</p>`).join("")}</td><td>${esc(b.hinweis)}</td></tr>`).join("")}</tbody></table></div>
    </article>
    <div class="row" id="lekpr" data-t="${esc(t.id)}" data-f="${fest ? 1 : 0}"><button class="btn" data-a="open">PDF öffnen</button><button class="btn" data-a="share">Teilen</button><button class="btn" data-a="print">Drucken</button></div><div class="sinfo" id="lekmsg" role="status"></div>`;
}
function aoLekPdf(t, fest) {
  const m = (fest ? AO_LEKF : AO_LEK)[t.id], stufe = fest ? "Festigungsstufe" : "Anlernstufe";
  const W = 595, H = 842, M = 40, TW = W - 2 * M, cv = document.createElement("canvas").getContext("2d");
  const fix = s => String(s).replace(/[“”„]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/…/g, "...").replace(/€/g, "EUR").replace(/→/g, "->").replace(/\t/g, " ").replace(/[^\n\x20-\x7e\xa0-\xff]/g, "?");
  const e2 = s => fix(s).replace(/[\\()]/g, "\\$&");
  const mw = (s, sz, b) => { cv.font = (b ? "bold " : "") + sz + "px Helvetica, Arial, sans-serif"; return cv.measureText(fix(s)).width; };
  const wrap = (txt, w, sz, b) => { const out = []; fix(txt).split("\n").forEach(par => { let line = ""; par.split(" ").forEach(wd => { const x = line ? line + " " + wd : wd; if (mw(x, sz, b) > w && line) { out.push(line); line = wd; } else line = x; }); out.push(line); }); return out; };
  const pages = [[]]; let y = H - M; const P = () => pages[pages.length - 1];
  const T = (x, yy, s, sz, b) => P().push(`BT /${b ? "F2" : "F1"} ${sz} Tf 0 g ${x.toFixed(1)} ${yy.toFixed(1)} Td (${e2(s)}) Tj ET`);
  const L = (x1, y1, x2, y2, w, rgb) => P().push(`${rgb || "0.27 0.27 0.27"} RG ${w} w ${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S`);
  const R = (x, yy, w, h, fill) => P().push(fill ? `${fill} rg ${x.toFixed(1)} ${yy.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f 0 g` : `0.27 0.27 0.27 RG 0.7 w ${x.toFixed(1)} ${yy.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re S`);
  const newPage = () => { pages.push([]); y = H - M; };
  // Kopf
  T(M, y - 12, "Ausbildung", 13, true); T(M, y - 27, "Feuerwehrdienst", 13, true);
  const ln = "Lektion Nr. " + m.nr; T(W - M - mw(ln, 13, true), y - 12, ln, 13, true);
  y -= 36; L(M, y, W - M, y, 1.6, "0.82 0.13 0.13"); y -= 14;
  // Metadaten
  const LW = 118, VX = M + LW, VW = TW - LW, SZ = 10, LH = 13;
  const meta = (label, items, kind) => {
    const blocks = items.map(it => wrap(it, VW - (kind ? 14 : 0), SZ, false));
    const h = blocks.reduce((n, b) => n + b.length * LH, 0);
    if (y - h < M) newPage();
    T(M, y - 10, label, SZ, true);
    blocks.forEach(b => {
      b.forEach((l, i) => { const yy = y - 10; if (kind && i === 0) { const bx = VX, by = yy - 1;
          if (kind === "box") R(bx, by, 7, 7);
          else if (kind === "chk") { L(bx, by + 3, bx + 2.5, by, 1.1, "0 0 0"); L(bx + 2.5, by, bx + 7, by + 8, 1.1, "0 0 0"); }
          else T(bx, yy, "-", SZ, false); }
        T(VX + (kind ? 14 : 0), yy, l, SZ, false); y -= LH; });
    });
    y -= 4;
  };
  meta("Thema:", [m.thema]); meta("Ausbildungsstufe:", [stufe + " · Dauer: 50 Min."]);
  meta("Ziele:", m.ziele, "dash"); meta("Beurteilungskriterien:", m.krit, "chk"); meta("Material:", m.material, "box"); meta("Fahrzeuge:", m.fahrzeuge, "box");
  // Tabelle
  y -= 6;
  const C0 = 34, C2 = 100, C1 = TW - C0 - C2, PD = 5, X1 = M + C0, X2 = M + C0 + C1, S2 = 9.5, L2 = 12;
  const head = () => { if (y - 22 < M) newPage(); R(M, y - 20, TW, 20, "0.75 0.75 0.75"); [[M, "Zeit", C0], [X1, "Ablauf der Lektion", C1], [X2, "Hinweise / Hilfen", C2]].forEach(c => { R(c[0], y - 20, c[2], 20); T(c[0] + PD, y - 14, c[1], S2 + .5, true); }); y -= 20; };
  head();
  m.ablauf.forEach(b => {
    const tl = wrap(b.titel, C1 - 2 * PD, S2, true), paras = b.zeilen.map(z => wrap(z, C1 - 2 * PD, S2, false)), hl = wrap(b.hinweis || "", C2 - 2 * PD, S2, false);
    const hm = PD * 2 + (tl.length + paras.reduce((n, p) => n + p.length, 0)) * L2 + paras.length * 3, hh = PD * 2 + hl.length * L2, h = Math.max(hm, hh, 24);
    if (y - h < M) { newPage(); head(); }
    [[M, C0], [X1, C1], [X2, C2]].forEach(c => R(c[0], y - h, c[1], h));
    T(M + PD - 1, y - PD - 9, b.min + "'", S2 + .5, true);
    let yy = y - PD - 9; tl.forEach(l => { T(X1 + PD, yy, l, S2, true); L(X1 + PD, yy - 1.6, X1 + PD + mw(l, S2, true), yy - 1.6, .6, "0 0 0"); yy -= L2; });
    paras.forEach(p => { yy -= 3; p.forEach(l => { T(X1 + PD, yy, l, S2, false); yy -= L2; }); });
    yy = y - PD - 9; hl.forEach(l => { T(X2 + PD, yy, l, S2, false); yy -= L2; });
    y -= h;
  });
  // PDF zusammenbauen
  const objs = [null, "<< /Type /Catalog /Pages 2 0 R >>", null, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"], kids = [];
  pages.forEach(p => { const st = p.join("\n"), ci = objs.length + 1, pi = objs.length;
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${ci} 0 R >>`, `<< /Length ${st.length} >>\nstream\n${st}\nendstream`); kids.push(pi); });
  objs[2] = `<< /Type /Pages /Kids [${kids.map(k => k + " 0 R").join(" ")}] /Count ${kids.length} >>`;
  let s = "%PDF-1.4\n", off = [];
  objs.slice(1).forEach((o, i) => { off.push(s.length); s += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xr = s.length; s += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
  const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255;
  return new File([u], "Lektion " + m.nr + " " + stufe + ".pdf", { type: "application/pdf" });
}
function aoLekBind(el) {
  const row = el.querySelector("#lekpr"); if (!row) return; const msg = el.querySelector("#lekmsg");
  row.querySelectorAll("button").forEach(b => b.onclick = () => {
    try { const t = AO_T.find(x => x.id === row.dataset.t), acts = aoPdfActs(aoLekPdf(t, row.dataset.f === "1"), msg); msg.textContent = ""; acts[b.dataset.a](); }
    catch (e) { msg.textContent = "PDF konnte nicht erstellt werden."; }
  });
}
function aoTopic(id) {
  const t = AO_T.find(x => x.id === id); if (!t) return aoTopics();
  const sl = t.l.flatMap(n => aoSlots(n, AOS.k).map(s => Object.assign({ n }, s)));
  const mt = aoMatch(t);
  const fields = [["ziel", "Lernziele (höchstens 3)"], ["einst", "Einstieg"], ["kern", "Ablauf und Kernpunkte"], ["sich", "Sicherheit"], ["kon", "Kontrolle und Abschluss"]];
  app.innerHTML = `<div class="banner"><h2>${esc(t.t)}</h2><p>${t.l.map(n => "L " + n + " · " + AO_L[n]).join("<br>")}</p></div>
    ${aoKlasse()}
    <h3 class="zh">Wann und wo</h3>
    <div class="ztw"><table class="zt sch">${sl.map(s => `<tr><td>${s.day}<br>${s.von}–${s.bis}</td><td>L ${s.n}<br><span class="mu">Arbeitsplatz ${s.ap}: ${esc(AO_AP[s.ap] || "")}</span></td></tr>`).join("")}</table></div>
    <h3 class="zh">Selbsttest</h3><div class="note">Beantworte jede Frage laut und in eigenen Worten, als würdest du sie einer Gruppe erklären. Hake ab, was sicher sitzt.</div>
    <div class="chklist">${t.fr.map((f, i) => aoChkHtml("s:" + t.id + ":" + i, esc(f))).join("")}</div>
    <h3 class="zh">Karten und Fragen zum Thema</h3>
    <div class="note">Direkt aus dem Reglement: alle Lernkarten und Quizfragen, in denen ${t.q.map(q => "«" + esc(q) + "»").join(", ")} vorkommt.</div>
    <div class="row"><button class="btn primary" id="mc"${mt.cards.length ? "" : " disabled"}>Lernkarten (${mt.cards.length})</button><button class="btn primary" id="mq"${mt.quiz.length ? "" : " disabled"}>Quiz (${mt.quiz.length})</button></div>
    <div id="dr" style="margin-top:14px"></div>
    <h3 class="zh">Im Reglement nachschlagen</h3>
    ${t.kap.length ? `<div class="row3">${t.kap.map(k => `<button class="btn" data-o="sum:${k}">Zusammenfassung ${aoKap(k)}</button><button class="btn" data-o="cards:${k}">Lernkarten ${aoKap(k)}</button><button class="btn" data-o="quiz:${k}">Quiz ${aoKap(k)}</button>`).join("")}</div>` : `<div class="note">Für dieses Thema ist kein Kapitel fest zugeordnet. Nutze die Suche.</div>`}
    <div class="chips" role="group" aria-label="Suchbegriffe">${t.q.map(q => `<button class="chip" data-q="${esc(q)}" aria-pressed="false">${esc(q)}</button>`).join("")}</div>
    <div id="sx"></div>
    <h3 class="zh">Meine Lektionsplanung</h3>
    ${fields.map(f => `<label class="fld"><span class="fl">${f[1]}</span><textarea class="ta" rows="3" data-n="${t.id}.${f[0]}" placeholder="Notizen …">${esc(AOS.notes[t.id + "." + f[0]] || "")}</textarea></label>`).join("")}
    <div class="chklist">${aoChkHtml("d:" + t.id, "<b>Dieses Thema sitzt</b>")}</div>`;
  aoBind(app);
  app.querySelectorAll("[data-o]").forEach(b => b.addEventListener("click", () => { const [tab, k] = b.dataset.o.split(":"); aoOpen(tab, k); }));
  document.getElementById("mc").onclick = () => aoDrill(document.getElementById("dr"), mt.cards);
  document.getElementById("mq").onclick = () => aoQuizRun(document.getElementById("dr"), mt.quiz);
  const box = document.getElementById("sx");
  box.addEventListener("click", () => { state.from = "ao"; state.direct = true; }, true);
  app.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => {
    app.querySelectorAll("[data-q]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    renderSearch(b.dataset.q, box);
  }));
}

/* ---------- Methodik ---------- */
function aoMeth() {
  const tab = (mod, k) => { const z = ((CHS[mod] || {})[k] || { z: [] }).z; return z.length ? `<div class="ztw"><table class="zt">${z.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</table></div>` : ""; };
  const sec = (t, items, open) => `<details class="sec"${open ? " open" : ""}><summary>${t}</summary><ul>${items.map(i => `<li>${i}</li>`).join("")}</ul></details>`;
  const lc = ["Thema und Lernziele festlegen (höchstens 3 Ziele je Stufe)", "Stufe klären: Anlern- oder Festigungsstufe", "Einstieg planen: Bezug zum Einsatz, Motivation", "Ablauf mit Zeit pro Schritt: vormachen, erklären, üben lassen", "Material und Arbeitsplatz bereitstellen, Sicherheit klären", "Kontrolle: Woran merke ich, dass es sitzt?", "Rückmeldung geben (höchstens 3 Beurteilungskriterien)", "Abschluss: zusammenfassen, Fragen klären, retablieren"];
  app.innerHTML = `<section class="hero"><h1>Lektion halten</h1><p>Was im Kurs beurteilt wird und wie du dich auf die Theorieblöcke und die Qualifikation vorbereitest.</p></section>
    ${sec("Was im Kurs zählt", ["Laut Kursaufgebot wird anhand von Fachlektionen im Rettungsdienst und in der Brandbekämpfung beurteilt, ob du genügend Kenntnisse hast, um die Lektion sicher zu halten.", "Dazu gehört, dass du die methodischen Hilfsmittel zweckmässig einsetzt.", "Vorbereitung laut Aufgebot: Reglement Basiswissen intensiv durcharbeiten, dazu die kantonalen Ergänzungen (LODUR → Info SGV)."], true)}
    ${sec("Die Woche im Überblick", ["<b>Di:</b> KEIL, Lektionszuteilung (L 2), Fachlektionen 101–104", "<b>Mi:</b> Theorie «Wie lernt der Mensch?», Fachlektionen 105–109, Zuteilung 2. Staffel (L 3), Verhaltensübung «Grenchen LSZG / ICAO 1.0» um 19.00", "<b>Do:</b> Theorie «FBEHK für Ausbildungsoffiziere», Fachlektionen 201–205, «Stunde der Wahrheit», Kleideranprobe und Lektionsvorbereitung", "<b>Fr:</b> Fachlektionen 206–209, Theorie «Kursorganisation / Ausbilderplanung», Qualifikation 15.45, Schlussbesprechung, Entlassung 17.00"])}
    ${sec("Theorieblöcke vorbereiten", ["<b>Wie lernt der Mensch?</b> Basiswissen Kap. 3 (Lernen und Kompetenzen, Planung und Durchführung, Feedback und Medien).", "<b>FBEHK für Ausbildungsoffiziere:</b> Feststellen, Beurteilen, Entscheiden, Handeln, Kontrollieren, der Führungsablauf (Basiswissen Kap. 2, Einsatzführung Kap. 3). Überlege dir, wie du die fünf Schritte als Ausbilder auf eine Lektion anwendest.", "<b>Kursorganisation / Ausbilderplanung:</b> Dazu passt Einsatzführung Kap. 5 (Ausbildung, Übungsvorbereitung, Besprechung).", "<b>Stunde der Wahrheit, Qualifikation:</b> Rückmeldung geben und annehmen, höchstens 3 Beurteilungskriterien (Kap. 3)."])}
    <h3 class="zh">Lektion vorbereiten</h3><div class="chklist">${lc.map((c, i) => aoChkHtml("m" + i, esc(c))).join("")}</div>
    <h3 class="zh">FBEHK: Führungsablauf</h3>${tab("basis", "2")}${tab("einsatz", "3")}
    <div class="row3"><button class="btn" data-o="sum:2">Zusammenfassung Kap. 2 Führung</button><button class="btn" data-o="cards:2">Lernkarten Kap. 2</button><button class="btn" data-o="quiz:2">Quiz Kap. 2</button></div>
    <div class="row3"><button class="btn" data-o="sum:3:einsatz">Einsatzführung Kap. 3</button><button class="btn" data-o="cards:3:einsatz">Lernkarten Kap. 3</button><button class="btn" data-o="quiz:3:einsatz">Quiz Kap. 3</button></div>
    <h3 class="zh">Zahlen: Ausbildung (Basiswissen Kap. 3)</h3>${tab("basis", "3")}
    <h3 class="zh">Zahlen: Ausbildung (Einsatzführung Kap. 5)</h3>${tab("einsatz", "5")}
    <div class="row3"><button class="btn" data-o="sum:3">Zusammenfassung Kap. 3</button><button class="btn" data-o="cards:3">Lernkarten Kap. 3</button><button class="btn" data-o="quiz:3">Quiz Kap. 3</button></div>
    <div class="row3"><button class="btn" data-o="sum:5:einsatz">Einsatzführung Kap. 5</button><button class="btn" data-o="cards:5:einsatz">Lernkarten Kap. 5</button><button class="btn" data-o="quiz:5:einsatz">Quiz Kap. 5</button></div>
    <label class="fld"><span class="fl">Probelektion</span><span class="fh">Thema, Zeit, Ergebnis, was ich ändere</span><textarea class="ta" rows="4" data-n="probe" placeholder="Notizen …">${esc(AOS.notes.probe || "")}</textarea></label>`;
  aoBind(app);
  app.querySelectorAll("[data-o]").forEach(b => b.addEventListener("click", () => { const [tb, k, mod] = b.dataset.o.split(":"); aoOpen(tb, k, mod); }));
}

/* ---------- Zahlen-Trainer ---------- */
let aoZsrc = "", aoZview = "drill";
function aoZahl() {
  const all = aoRows(), srcs = [];
  all.forEach(r => { if (!srcs.some(s => s.src === r.src)) srcs.push(r); });
  const pool = all.filter(r => !aoZsrc || r.src === aoZsrc);
  app.innerHTML = `<section class="hero"><h1>Zahlen-Trainer</h1><p>Die wichtigsten Zahlen aus den Kapiteln, die für den Kurs gebraucht werden.</p></section>
    <div class="tabs t2" role="tablist">${[["drill", "Üben"], ["table", "Tabelle"]].map(([k, l]) => `<button role="tab" data-v="${k}" aria-selected="${aoZview === k}">${l}</button>`).join("")}</div>
    <div class="chips fbar" role="group" aria-label="Kapitel"><button class="chip" data-s="" aria-pressed="${!aoZsrc}">Alle (${all.length})</button>${srcs.map(s => `<button class="chip" data-s="${s.src}" aria-pressed="${aoZsrc === s.src}">${esc(s.tag)} (${all.filter(r => r.src === s.src).length})</button>`).join("")}</div>
    <div id="zb"></div>`;
  app.querySelectorAll("[data-v]").forEach(b => b.addEventListener("click", () => { aoZview = b.dataset.v; aoZahl(); }));
  app.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => { aoZsrc = b.dataset.s; aoZahl(); }));
  const el = document.getElementById("zb");
  if (aoZview === "table") {
    const groups = []; pool.forEach(r => { let g = groups.find(x => x.src === r.src); if (!g) groups.push(g = { src: r.src, tag: r.tag, rows: [] }); g.rows.push(r); });
    el.innerHTML = groups.map(g => `<h3 class="zh">${esc(g.tag)}</h3><div class="ztw"><table class="zt">${g.rows.map(r => `<tr><td>${esc(r.a)}</td><td>${esc(r.q)}</td></tr>`).join("")}</table></div>`).join("");
    return;
  }
  aoDrill(el, pool);
}
function aoDrill(el, pool) {
  let queue = [], pos = 0, flipped = false;
  const build = open => { queue = shuffle(open ? pool.filter(r => !AOS.known[r.id]) : pool); pos = 0; flipped = false; };
  const known = () => pool.filter(r => AOS.known[r.id]).length;
  function draw() {
    if (pos >= queue.length) {
      const k = known(), done = k === pool.length;
      el.innerHTML = `<div class="card-area"><div class="flash"><span class="lab">Fertig</span><div class="txt">${done ? "Alle " + pool.length + " Zahlen sitzen." : "Runde beendet. " + k + " von " + pool.length + " gewusst."}</div></div>
        <div class="row"><button class="btn primary" id="again">${done ? "Alle nochmal" : "Offene üben"}</button><button class="btn ghost" id="reset">Fortschritt löschen</button></div></div>`;
      document.getElementById("again").onclick = () => { build(!done); draw(); };
      document.getElementById("reset").onclick = () => { pool.forEach(r => delete AOS.known[r.id]); aoSave(); build(true); draw(); };
      return;
    }
    const c = queue[pos];
    el.innerHTML = `<div class="card-area"><div class="count"><span>Karte ${pos + 1} von ${queue.length}</span><span>${known()} gewusst</span></div>
      <button class="flash${flipped ? " back" : ""}" id="flip" aria-label="Karte umdrehen"><span class="lab">${flipped ? (c.bl || "Zahl") : (c.fl || "Welche Zahl oder Angabe gehört dazu?")} · ${esc(c.tag)}</span><span class="txt">${esc(flipped ? c.a : c.q)}</span>${flipped ? "" : '<span class="lab">Tippen zum Umdrehen</span>'}</button>
      ${flipped ? `<div class="row"><button class="btn" id="no">Nochmal</button><button class="btn primary" id="yes">Gewusst</button></div>` : ""}</div>`;
    document.getElementById("flip").onclick = () => { flipped = !flipped; draw(); };
    if (flipped) {
      document.getElementById("yes").onclick = () => { AOS.known[c.id] = 1; aoSave(); pos++; flipped = false; draw(); };
      document.getElementById("no").onclick = () => { delete AOS.known[c.id]; aoSave(); queue.push(c); pos++; flipped = false; draw(); };
    }
  }
  build(true); draw();
}

/* ---------- Karten und Fragen zu einem Thema (direkt aus dem Reglement) ---------- */
function aoMatch(t) {
  const ws = t.q.map(q => fold(q)), hit = txt => { const f = fold(txt); return ws.some(w => f.includes(w)); };
  const cards = [], quiz = [];
  MODS.forEach(m => {
    m.cards.forEach((c, i) => { if (hit(c[0] + " " + c[1])) cards.push({ id: "k:" + m.id + ":" + i, q: c[0], a: c[1], fl: "Frage", bl: "Antwort", tag: m.title + (c[2] ? " · Kap. " + c[2] : "") }); });
    m.quiz.forEach(q => { if (hit(q.q + " " + q.o.join(" ") + " " + q.e)) quiz.push(q); });
  });
  return { cards, quiz };
}
function aoQuizRun(el, qs) {
  const all = () => qs.map((q, i) => i);
  let list = shuffle(all()), pos = 0, score = 0, wrong = [], done = false;
  function draw() {
    if (pos >= list.length) {
      el.innerHTML = `<div class="card-area"><div class="count"><span>Ergebnis</span></div><div class="score">${score}<span style="color:var(--muted);font-size:2rem"> / ${list.length}</span></div><div>${wrong.length ? wrong.length + (wrong.length === 1 ? " Frage" : " Fragen") + " zum Wiederholen." : "Alles richtig."}</div><div class="row">${wrong.length ? '<button class="btn primary" id="qrep">Falsche wiederholen</button>' : ""}<button class="btn" id="qnew">Neues Quiz</button></div></div>`;
      if (wrong.length) el.querySelector("#qrep").onclick = () => { list = shuffle(wrong); pos = 0; score = 0; wrong = []; draw(); };
      el.querySelector("#qnew").onclick = () => { list = shuffle(all()); pos = 0; score = 0; wrong = []; draw(); };
      return;
    }
    const q = qs[list[pos]], order = shuffle(q.o.map((_, i) => i)); done = false;
    el.innerHTML = `<div class="card-area"><div class="count"><span>Frage ${pos + 1} von ${list.length}</span><span>${score} richtig</span></div><div class="q">${esc(q.q)}</div><div class="opts">${order.map(i => `<button class="opt" data-i="${i}">${esc(q.o[i])}</button>`).join("")}</div><div id="qfb"></div></div>`;
    el.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
      if (done) return; done = true; const ok = +b.dataset.i === q.a; if (ok) score++; else wrong.push(list[pos]);
      el.querySelectorAll(".opt").forEach(o => { o.disabled = true; if (+o.dataset.i === q.a) o.classList.add("right"); else if (o === b) o.classList.add("wrong"); });
      el.querySelector("#qfb").innerHTML = `<div class="expl"><b>${ok ? "Richtig." : "Nicht ganz."}</b> ${esc(q.e)}</div><div style="margin-top:12px"><button class="btn primary" id="qnx" style="width:100%">${pos + 1 >= list.length ? "Ergebnis" : "Weiter"}</button></div>`;
      el.querySelector("#qnx").onclick = () => { pos++; draw(); };
    }));
  }
  draw();
}

/* ---------- Kurs-Quiz (Fachfragen aus dem Basiswissen zu den Lektionen je Kurstag) ---------- */
function aoKqPool(di, k) {
  const days = di < 0 ? AO_DAYS : [AO_DAYS[di]], lessons = new Set();
  days.forEach(day => day.rows.forEach(r => { const c = r[2 + k]; if (c && c[0] !== "=") lessons.add(c.split("/")[0]); }));
  const ts = AO_T.filter(t => t.l.some(n => lessons.has(n))), set = new Set(), bm = getMod("basis");
  ts.forEach(t => { aoMatch(t).quiz.forEach(q => set.add(q)); bm.quiz.forEach(q => { if (t.kap.includes(String(q.c))) set.add(q); }); });
  return { fach: [...set], topics: ts };
}
function aoKq() {
  if (state.kd == null) state.kd = -1;
  const dn = ["Alle Tage"].concat(AO_DAYS.map(d => d.d));
  const pool = aoKqPool(state.kd, AOS.k), nF = pool.fach.length;
  app.innerHTML = `<section class="hero"><h1>Kurs-Quiz</h1><p>Multiple Choice zu den Fachthemen der Lektionen, aus dem Reglement Basiswissen. Wähle Klasse und Kurstag.</p></section>
    ${aoKlasse()}
    <div class="chips" role="group" aria-label="Tag">${dn.map((d, i) => `<button class="chip" data-d="${i - 1}" aria-pressed="${state.kd === i - 1}">${d}</button>`).join("")}</div>
    <div class="note">${nF} Fragen zu: ${pool.topics.map(t => esc(t.t)).join(", ")}.</div>
    <div class="menu rgmenu" id="kqs">
      <button class="mbtn main pdfbtn" data-n="20"><span>Kurz · 20 Fragen</span><small>zufällig</small></button>
      <button class="mbtn main pdfbtn" data-n="0"><span>Alle Fragen</span><small>${nF} Fragen</small></button></div>
    <div id="dr" style="margin-top:14px"></div>`;
  aoBind(app);
  app.querySelectorAll("[data-d]").forEach(b => b.addEventListener("click", () => { state.kd = +b.dataset.d; aoKq(); }));
  app.querySelectorAll("#kqs button").forEach(b => b.addEventListener("click", () => {
    const n = +b.dataset.n, qs = n ? shuffle(pool.fach).slice(0, n) : pool.fach;
    if (!qs.length) return;
    document.getElementById("kqs").hidden = true; aoQuizRun(document.getElementById("dr"), qs);
  }));
}

/* ---------- Kursprogramm ---------- */
function aoProg() {
  app.innerHTML = `<section class="hero"><h1>Kursprogramm</h1><p>Tagesbefehl, Version 02.10.2026. Wähle deine Klasse; sie wird dir am Kursbeginn mitgeteilt.</p></section>${aoKlasse()}
    ${AO_DAYS.map(day => `<h3 class="zh">${day.d}</h3><div class="ztw"><table class="zt sch">${day.rows.map(r => {
      const c = r[2 + AOS.k];
      if (!c) return `<tr class="mute"><td>${r[0]}${r[1] ? "–" + r[1] : ""}</td><td>${esc(r[2])}</td></tr>`;
      if (c[0] === "=") return `<tr><td>${r[0]}–${r[1]}</td><td>${esc(c.slice(1))}</td></tr>`;
      const [n, ap] = c.split("/");
      return `<tr><td>${r[0]}–${r[1]}</td><td><b>L ${n}</b> ${esc(AO_L[n] || "")}<br><span class="mu">Arbeitsplatz ${ap}: ${esc(AO_AP[ap] || "")}</span></td></tr>`;
    }).join("")}</table></div>`).join("")}`;
  aoBind(app);
}
