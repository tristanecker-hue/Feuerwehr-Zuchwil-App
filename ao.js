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
  { id: "ausr", t: "Persönliche Ausrüstung, Sicherheit, Bindungen, Knoten", l: ["101"], kap: ["1", "10"], q: ["Knoten", "Bindung", "Seil", "Ausrüstung"], kw: ["Knoten", "Bindung", "Absturz", "Fallhöhe", "Fixpunkt", "Anschlagpunkt", "Schutzausrüstung"], ex: ["seilwinde", "zugseil"], fr: [
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
  { id: "pers", t: "Personenrettung und Transport", l: ["104"], kap: ["5"], only: "5", q: ["Personenrettung", "Transport", "Rettungskette", "Rautek"], kw: ["Personenrettung", "Transport", "Rettungskette", "Rautek", "Reanimation", "BLS", "Lagerung", "Blutstillung", "Verbrennung", "Schaufeltrage", "Spineboard", "Rettungstuch", "Verletzte", "Schock", "Defibrillator", "Fachspezialist", "Rettungsdienst", "Patient", "bewusstlos", "Herzdruckmassage", "Beatmung", "Retten", "Bergen", "Räumen", "Evakuieren", "Eigenschutz", "Infektion", "Seitenlage", "Hochlagerung"], fr: [
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
  { id: "tlf", t: "TLF", l: ["108", "109", "206"], kap: ["6"], q: ["TLF", "Schnellangriff", "Pumpe", "Schaumrohr"], ex: ["eingangsdruck"], fr: [
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
  { id: "gew", t: "MS ab Gewässer", l: ["203"], kap: ["6"], q: ["Gewässer", "Seiher", "Saugleitung", "Motorspritze"], ex: ["ab hydrant"], fr: [
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
  { id: "pl", t: "Personenrettung über Leitern", l: ["205"], kap: ["5"], q: ["Leiter", "Personenrettung", "Anstellwinkel"], ex: ["grundsatze", "ersten massnahmen", "tragarten", "raumen"], fr: [
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
  const f = { "": aoHub, check: aoCheck, keil: aoKeil, lek: aoTopics, meth: aoMeth, zahl: aoZahl, prog: aoProg, kq: aoKq, bil: aoBil }[r];
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
    ["lek", "Fachthemen", "Lektionen", "Alle Kurs-Lektionen mit Lernkarten, Quiz und Reglement-Suche", dT, AO_T.length, dT + " von " + AO_T.length + " Themen sitzen"],
    ["kq", "Quiz", "Kurs-Quiz", "Fachfragen aus dem Basiswissen zu den Lektionen jedes Kurstags", 0, 0, ""],
    ["meth", "Methodik", "Lektion halten", "Aufbau, Beurteilung, Theorieblöcke und Probelektion", 0, 0, ""],
    ["zahl", "Training", "Zahlen-Trainer", "Wichtige Zahlen aus den Kurs-Kapiteln nachschlagen", 0, 0, ""],
    ["bil", "Methodik", "Erfolgsauswertung / Bilanz", "Formular 3.17.1 zum Ausfüllen, mit PDF-Export", 0, 0, ""],
    ["prog", "Tagesbefehl", "Kursprogramm", "Dienstag bis Freitag, nach Klasse 1 oder 2", 0, 0, ""],
    ["regl", "Nachschlagen", "Reglement Basiswissen", "Das ganze Reglement im PDF öffnen", 0, 0, ""]
  ];
  app.innerHTML = `<section class="hero"><h1>Ausbildungsoffizier</h1><p>Ku 70 · Di 20. bis Fr 23.10.2026 · Feuerwehr Grenchen. ${cnt}</p></section>
    <div class="menu rgmenu aomenu">${tiles.map(t => `<button class="mbtn main pdfbtn aotile" data-r="${t[0]}"><span>${t[2]}</span><small>${t[6] || t[3]}</small></button>`).join("")}</div>
    <p class="foot">Quellen: Kursaufgebot 70/26/1 und Tagesbefehl (Version 02.10.2026). Massgebend sind die Unterlagen des SGV und die Anweisungen im Kurs. Fachinhalte stehen im Reglement Basiswissen (FKS).</p>`;
  app.querySelectorAll(".aotile").forEach(b => b.addEventListener("click", () => { if (b.dataset.r === "regl") rgJump("basis", 0, () => aoGo("")); else aoGo(b.dataset.r); }));
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
  app.insertAdjacentHTML("beforeend", '<div id="dfab"></div>'); aoFiles(document.getElementById("dfab"));
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
  app.innerHTML = `<section class="hero"><h1>Lektionen</h1><p>Alle Fachthemen des Kurses in der Reihenfolge des Tagesbefehls. Pro Thema: Wann und wo, Lernkarten, Quiz und Reglement.</p></section>
    <div class="grid">${AO_T.map(t => {
      const ok = AOS.chk["d:" + t.id];
      return `<button class="tile chtile" data-r="lek:${t.id}"><span class="num">${t.l.map(n => "L " + n).join(" · ")}</span><h2>${esc(t.t)}</h2><div class="facts"><span>${ok ? "sitzt" : "noch offen"}</span></div></button>`;
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
  return aoLekPdfBuild(Object.assign({}, m, { stufeTxt: stufe + " · Dauer: 50 Min.", fname: "Lektion " + m.nr + " " + stufe + ".pdf" }));
}
function aoLekPdfBuild(m) {
  const W = 595, H = 842, M = 40, TW = W - 2 * M, cv = document.createElement("canvas").getContext("2d");
  const fix = s => String(s).replace(/[“”„]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/…/g, "...").replace(/€/g, "EUR").replace(/→/g, "->").replace(/\t/g, " ").replace(/[^\n\x20-\x7e\xa0-\xff]/g, "?");
  const e2 = s => fix(s).replace(/[\\()]/g, "\\$&");
  const mw = (s, sz, b) => { cv.font = (b ? "bold " : "") + sz + "px Helvetica, Arial, sans-serif"; return cv.measureText(fix(s)).width; };
  const wrap = (txt, w, sz, b) => { const out = []; fix(txt).split("\n").forEach(par => { let line = ""; par.split(" ").forEach(wd => { const x = line ? line + " " + wd : wd; if (mw(x, sz, b) > w && line) { out.push(line); line = wd; } else line = x; }); out.push(line); }); return out; };
  const imgs = m.logo ? [m.logo] : []; const pages = [[]]; let y = H - M; const P = () => pages[pages.length - 1];
  const T = (x, yy, s, sz, b) => P().push(`BT /${b ? "F2" : "F1"} ${sz} Tf 0 g ${x.toFixed(1)} ${yy.toFixed(1)} Td (${e2(s)}) Tj ET`);
  const L = (x1, y1, x2, y2, w, rgb) => P().push(`${rgb || "0.27 0.27 0.27"} RG ${w} w ${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S`);
  const R = (x, yy, w, h, fill) => P().push(fill ? `${fill} rg ${x.toFixed(1)} ${yy.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f 0 g` : `0.27 0.27 0.27 RG 0.7 w ${x.toFixed(1)} ${yy.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re S`);
  const newPage = () => { pages.push([]); y = H - M; };
  // Kopf
  let logoH = 0;
  if (m.logo) { const lw = 130; logoH = lw * m.logo.h / m.logo.w; P().push(`q ${lw} 0 0 ${logoH.toFixed(1)} ${M} ${(y - logoH).toFixed(1)} cm /Im1 Do Q`);
    const bt = "BEREICH AUSBILDUNG"; T(W - M - mw(bt, 8.5, true), y - 14, bt, 8.5, true); T(W - M - mw(bt, 8.5, true) - 7, y - 14, "I", 8.5, true);
    L(M + lw + 8, y - logoH + 4, W - M, y - logoH + 4, .5, "0.5 0.5 0.5"); y -= logoH + 16; }
  T(M, y - 12, m.kopf1 || "Ausbildung", 13, true); T(M, y - 27, m.kopf2 || "Feuerwehrdienst", 13, true);
  const ln = "Lektion Nr. " + m.nr; T(W - M - mw(ln, 13, true), y - 12, ln, 13, true);
  if (m.version) { const vt = "Version: " + m.version; T(W - M - mw(vt, 8, false), y - 26, vt, 8, false); }
  y -= 36; L(M, y, W - M, y, 1.6, "0.82 0.13 0.13"); y -= 14;
  // Metadaten
  const LW = 118, VX = M + LW, VW = TW - LW, SZ = 10, LH = 13;
  const meta = (label, items, kind) => {
    if (!items.length) items = [" "];
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
  meta("Thema:", [m.thema]); if (m.quelle) meta("Quelle:", [m.quelle]); meta("Ausbildungsstufe:", [m.stufeTxt]);
  meta("Ziele:", m.ziele, "dash"); meta("Beurteilungskriterien:", m.krit, "chk"); meta("Material:", m.material, "box"); meta("Fahrzeuge:", m.fahrzeuge, "box");
  // Tabelle
  y -= 6;
  const C0 = 34, C2 = m.c2 || 100, C1 = TW - C0 - C2, PD = 5, X1 = M + C0, X2 = M + C0 + C1, S2 = 9.5, L2 = 12;
  const head = () => { if (y - 22 < M) newPage(); R(M, y - 20, TW, 20, "0.75 0.75 0.75"); [[M, "Zeit", C0], [X1, "Ablauf der Lektion", C1], [X2, "Hinweise / Hilfen", C2]].forEach(c => { R(c[0], y - 20, c[2], 20); T(c[0] + PD, y - 14, c[1], S2 + .5, true); }); y -= 20; };
  head();
  m.ablauf.forEach(b => {
    const tl = wrap(b.titel, C1 - 2 * PD, S2, true), paras = b.zeilen.map(z => wrap(z, C1 - 2 * PD, S2, false)), hl = wrap(b.hinweis || "", C2 - 2 * PD, S2, false), ims = (b.imgs || []).map(im => { imgs.push(im); const w = C2 - 2 * PD, hh0 = Math.min(w * im.h / im.w, 170); return { k: imgs.length, w: hh0 * im.w / im.h > w ? w : hh0 * im.w / im.h, h: hh0 > w * im.h / im.w ? w * im.h / im.w : hh0 }; });
    const hm = PD * 2 + (tl.length + paras.reduce((n, p) => n + p.length, 0)) * L2 + paras.length * 3, hh = PD * 2 + hl.length * L2 + ims.reduce((n, im) => n + im.h + 4, hl.length ? 2 : 0), h = Math.max(hm, hh, 24);
    if (y - h < M) { newPage(); head(); }
    [[M, C0], [X1, C1], [X2, C2]].forEach(c => R(c[0], y - h, c[1], h));
    T(M + PD - 1, y - PD - 9, b.min + "'", S2 + .5, true);
    let yy = y - PD - 9; tl.forEach(l => { T(X1 + PD, yy, l, S2, true); L(X1 + PD, yy - 1.6, X1 + PD + mw(l, S2, true), yy - 1.6, .6, "0 0 0"); yy -= L2; });
    paras.forEach(p => { yy -= 3; p.forEach(l => { T(X1 + PD, yy, l, S2, false); yy -= L2; }); });
    yy = y - PD - 9; hl.forEach(l => { T(X2 + PD, yy, l, S2, false); yy -= L2; });
    yy += 6; ims.forEach(im => { P().push(`q ${im.w.toFixed(1)} 0 0 ${im.h.toFixed(1)} ${(X2 + PD).toFixed(1)} ${(yy - im.h).toFixed(1)} cm /Im${im.k} Do Q`); yy -= im.h + 4; });
    y -= h;
  });
  // PDF zusammenbauen
  const objs = [null, "<< /Type /Catalog /Pages 2 0 R >>", null, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"], kids = [];
  imgs.forEach(im => { const bin = atob(im.b64); objs.push(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bin.length} >>\nstream\n${bin}\nendstream`); });
  pages.forEach(p => { const st = p.join("\n"), ci = objs.length + 1, pi = objs.length;
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${imgs.length ? " /XObject << " + imgs.map((_, k) => "/Im" + (k + 1) + " " + (5 + k) + " 0 R").join(" ") + " >>" : ""} >> /Contents ${ci} 0 R >>`, `<< /Length ${st.length} >>\nstream\n${st}\nendstream`); kids.push(pi); });
  objs[2] = `<< /Type /Pages /Kids [${kids.map(k => k + " 0 R").join(" ")}] /Count ${kids.length} >>`;
  let s = "%PDF-1.4\n", off = [];
  objs.slice(1).forEach((o, i) => { off.push(s.length); s += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xr = s.length; s += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
  const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255;
  return new File([u], m.fname || "Lektion.pdf", { type: "application/pdf" });
}
function aoLekBind(el) {
  const row = el.querySelector("#lekpr"); if (!row) return; const msg = el.querySelector("#lekmsg");
  row.querySelectorAll("button").forEach(b => b.onclick = () => {
    try { const t = AO_T.find(x => x.id === row.dataset.t), acts = aoPdfActs(aoLekPdf(t, row.dataset.f === "1"), msg); msg.textContent = ""; acts[b.dataset.a](); }
    catch (e) { msg.textContent = "PDF konnte nicht erstellt werden."; }
  });
}
const AO_REF = { ausr: ["1.2", "1.3", "10.2.1", "10.2.2", "10.2.3", "10.2.4", "10.2.5"], leiter: ["5.11.1", "5.11.2", "5.11.3", "5.11.4", "5.11.5"], pers: ["5.1", "5.6", "5.9", "5.10"], lbau: ["6.8", "6.8.1", "6.8.2", "6.8.3", "6.8.4", "6.8.5"], verbr: ["6.6", "6.6.1", "6.6.2", "6.6.3"], kl: ["6.5", "6.5.1", "6.5.2", "6.5.3"], tlf: ["6.12", "6.12.1", "6.12.2"], sl: ["5.11.6", "5.11.7"], gew: ["6.7.2", "6.13", "6.13.3"], hyd: ["6.7.1", "6.13", "6.13.2"], pl: ["5.11.8"], lueft: ["8.1", "8.2", "8.3"], ort: ["1.5", "1.5.1", "1.5.2"] };
function aoPdfRefs(t) {
  const rs = (AO_REF[t.id] || []).map(n => rgNum("basis", n)).filter(Boolean); if (!rs.length) return "";
  return `<div class="note">Direkt im Reglement Basiswissen (PDF) an die passende Stelle springen:</div><div class="rgjl">${rs.map(r => `<button class="btn rgjump" data-id="basis" data-p="${r.page}">${esc(r.t)} · S. ${r.page}</button>`).join("")}</div>`;
}
function aoTopic(id) {
  const t = AO_T.find(x => x.id === id); if (!t) return aoTopics();
  const sl = t.l.flatMap(n => aoSlots(n, AOS.k).map(s => Object.assign({ n }, s)));
  const mt = aoMatch(t);
  app.innerHTML = `<div class="banner"><h2>${esc(t.t)}</h2><p>${t.l.map(n => "L " + n + " · " + AO_L[n]).join("<br>")}</p></div>
    ${aoKlasse()}
    <h3 class="zh">Wann und wo</h3>
    <div class="ztw"><table class="zt sch">${sl.map(s => `<tr><td>${s.day}<br>${s.von}–${s.bis}</td><td>L ${s.n}<br><span class="mu">Arbeitsplatz ${s.ap}: ${esc(AO_AP[s.ap] || "")}</span></td></tr>`).join("")}</table></div>
    <h3 class="zh">Karten und Fragen zum Thema</h3>
    <div class="note">Direkt aus dem Reglement: alle Lernkarten und Quizfragen, in denen ${t.q.map(q => "«" + esc(q) + "»").join(", ")} vorkommt.</div>
    <div class="row"><button class="btn primary" id="mc"${mt.cards.length ? "" : " disabled"}>Lernkarten (${mt.cards.length})</button><button class="btn primary" id="mq"${mt.quiz.length ? "" : " disabled"}>Quiz (${mt.quiz.length})</button></div>
    <div id="dr" style="margin-top:14px"></div>
    <h3 class="zh">Im Reglement nachschlagen</h3>
    ${aoPdfRefs(t)}
    ${t.kap.length ? `<div class="row3">${t.kap.map(k => `<button class="btn" data-o="cards:${k}">Lernkarten ${aoKap(k)}</button><button class="btn" data-o="quiz:${k}">Quiz ${aoKap(k)}</button>`).join("")}</div>` : `<div class="note">Für dieses Thema ist kein Kapitel fest zugeordnet. Nutze die Suche.</div>`}
    <div class="chips" role="group" aria-label="Suchbegriffe">${t.q.map(q => `<button class="chip" data-q="${esc(q)}" aria-pressed="false">${esc(q)}</button>`).join("")}</div>
    <div id="sx"></div>
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
    <div class="row3"><button class="btn" data-o="cards:2">Lernkarten Kap. 2</button><button class="btn" data-o="quiz:2">Quiz Kap. 2</button></div>
    <div class="row3"><button class="btn" data-o="cards:3:einsatz">Lernkarten Kap. 3</button><button class="btn" data-o="quiz:3:einsatz">Quiz Kap. 3</button></div>
    <h3 class="zh">Zahlen: Ausbildung (Basiswissen Kap. 3)</h3>${tab("basis", "3")}
    <h3 class="zh">Zahlen: Ausbildung (Einsatzführung Kap. 5)</h3>${tab("einsatz", "5")}
    <div class="row3"><button class="btn" data-o="cards:3">Lernkarten Kap. 3</button><button class="btn" data-o="quiz:3">Quiz Kap. 3</button></div>
    <div class="row3"><button class="btn" data-o="cards:5:einsatz">Lernkarten Kap. 5</button><button class="btn" data-o="quiz:5:einsatz">Quiz Kap. 5</button></div>
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
    <div class="chips fbar" role="group" aria-label="Kapitel"><button class="chip" data-s="" aria-pressed="${!aoZsrc}">Alle (${all.length})</button>${srcs.map(s => `<button class="chip" data-s="${s.src}" aria-pressed="${aoZsrc === s.src}">${esc(s.tag)} (${all.filter(r => r.src === s.src).length})</button>`).join("")}</div>
    <div id="zb"></div>`;
  app.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => { aoZsrc = b.dataset.s; aoZahl(); }));
  const el = document.getElementById("zb");
  {
    const groups = []; pool.forEach(r => { let g = groups.find(x => x.src === r.src); if (!g) groups.push(g = { src: r.src, tag: r.tag, rows: [] }); g.rows.push(r); });
    el.innerHTML = groups.map(g => `<h3 class="zh">${esc(g.tag)}</h3><div class="ztw"><table class="zt">${g.rows.map(r => `<tr><td>${esc(r.a)}</td><td>${esc(r.q)}</td></tr>`).join("")}</table></div>`).join("");
  }
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
  const ws = (t.kw || t.q).map(q => fold(q)), hit = txt => { const f = fold(txt).replace(/[a-z]*(einsatz|gruppen|trupp|abschnitts|zug|kurs|stab|lektions|ausbildungs|angriffs|schadenplatz|fuhrungs|atemschutz|kommando)leiter[a-z]*/g, " "); return ws.some(w => f.includes(w)); };
  const cards = [], quiz = [], exw = (t.ex || []).map(fold), okx = txt => { const f = fold(txt); return !exw.some(w => f.includes(w)); };
  MODS.forEach(m => {
    if (m.id !== "basis") return;
    const okc = ch => !t.kap || !m.quiz.length || t.kap.includes(String(ch));
    m.cards.forEach((c, i) => { if (t.only && String(c[2]) !== t.only) return; if (m.id === "basis" && !okc(c[2])) return; if (okx(c[0]) && hit(c[0] + " " + c[1])) cards.push({ id: "k:" + m.id + ":" + i, q: c[0], a: c[1], fl: "Frage", bl: "Antwort", tag: m.title + (c[2] ? " · Kap. " + c[2] : "") }); });
    m.quiz.forEach(q => { if (t.only && String(q.c) !== t.only) return; if (m.id === "basis" && !okc(q.c)) return; if (okx(q.q) && hit(q.q + " " + q.e)) quiz.push(q); });
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
  ts.forEach(t => { aoMatch(t).quiz.forEach(q => set.add(q)); if (!t.only) bm.quiz.forEach(q => { if (t.kap.includes(String(q.c))) set.add(q); }); });
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

/* ---------- Erfolgsauswertung / Bilanz (Formular 3.17.1, Handmethode) ---------- */
const AO_BIL = [
  ["ich", "Ich (positiv und in der Ich-Form)", 3, "Wie habe ich mich gefühlt? Was ist mir gelungen?"],
  ["krit", "Max. 3 Beurteilungskriterien/Soll (z.B. Methodik, Ausbildungshilfen, Verhalten als Instruktor usw.)", 3, "1.\n2.\n3."],
  ["pos", "Fakten (das habe ich festgestellt) / Ist: positiv", 5, "Das war gut …"],
  ["neg", "Fakten (das habe ich festgestellt) / Ist: negativ", 5, "Das war weniger gut …"],
  ["verb", "Verbinden (Tipps) / Konsequenz", 4, "Tipp: … Konsequenz: …"],
  ["kurz", "Kurz (aufbauender Schluss)", 3, "Aufbauender Schlusssatz"]
];
const aoBilGet = k => (AOS.notes["bil_" + k] || "");
const AO_BIL_IMG = {
  logo: ["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", 342, 92],
  hand: ["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", 270, 368],
  up: ["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", 100, 92],
  down: ["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", 100, 96],
  point: ["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", 124, 64]
};
function aoBilPdf(blank, zw) {
  const LG = zw && window.LOGOJ ? window.LOGOJ : null;
  const W = 595, H = 842, S = 0.654, X = x => x * S, Y = y => H - y * S, cv = document.createElement("canvas").getContext("2d");
  const fix = s => String(s).replace(/[“”„]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/…/g, "...").replace(/\t/g, " ").replace(/[^\n\x20-\x7e\xa0-\xff]/g, "?");
  const e2 = s => fix(s).replace(/[\\()]/g, "\\$&");
  const mw = (s, sz) => { cv.font = sz + "px Helvetica, Arial, sans-serif"; return cv.measureText(fix(s)).width; };
  const c = [], f1 = n => n.toFixed(1);
  const T = (x, y, s, sz, b, col) => c.push(`BT /${b ? "F2" : "F1"} ${sz} Tf ${col || "0 g"} ${f1(x)} ${f1(y)} Td (${e2(s)}) Tj ET`);
  const LN = (x1, y, x2) => c.push(`0.45 0.45 0.45 RG 0.6 w ${f1(X(x1))} ${f1(Y(y))} m ${f1(X(x2))} ${f1(Y(y))} l S`);
  const RC = (x, y, w, h, fill, stroke) => c.push(`${fill} rg ${stroke ? (zw ? "0.6 0.25 0.25 RG 0.6 w " : "0.45 0.5 0.58 RG 0.6 w ") : ""}${f1(X(x))} ${f1(Y(y + h))} ${f1(w * S)} ${f1(h * S)} re ${stroke ? "B" : "f"} 0 g`);
  const IM = (n, x, y, w, h) => c.push(`q ${f1(w * S)} 0 0 ${f1(h * S)} ${f1(X(x))} ${f1(Y(y + h))} cm /${n} Do Q`);
  // Kopf
  for (let i = 0; i < 14; i++) { const g = (0.86 - i * 0.012).toFixed(3), col = zw ? `${(0.93 - i * 0.012).toFixed(3)} ${(0.45 - i * 0.02).toFixed(3)} ${(0.45 - i * 0.02).toFixed(3)}` : `${g} ${g} ${g}`; c.push(`${col} rg ${f1(X(340 + i * 40.7))} ${f1(Y(52))} ${f1(40.7 * S + .5)} ${f1(52 * S)} re f`); }
  if (LG) { const lh = 46, lw = Math.min(200, lh * LG.w / LG.h); IM("Im0", 84, 18, lw, lh); } else IM("Im0", 84, 18, 171, 46);
  T(X(715), Y(34), "3", 11, false, "1 g"); T(X(729), Y(34), "|", 11, false, "1 g"); T(X(739), Y(34), "Ausbildung", 11, false, "1 g");
  T(X(87), Y(138), "3.17.1", 21, true);
  const tw = mw("3.17.1", 21) * 1.08 + X(87) + 6; c.push(`0.2 G 0.8 w ${f1(tw)} ${f1(Y(142))} m ${f1(tw)} ${f1(Y(108))} l S`);
  T(tw + 8, Y(138), "Erfolgsauswertung/Bilanz", 21, true);
  IM("Im1", 600, 78, 135, 184);
  // Tabelle
  const g = k => blank ? "" : aoBilGet(k), BL = zw ? "0.98 0.93 0.93" : "0.91 0.94 0.97";
  [[87, 126], [213, 239], [452, 87], [539, 283]].forEach(a => { RC(a[0], 269, a[1], 36, BL, true); RC(a[0], 305, a[1], 36, BL, true); });
  [[93, 287, "Lektion/Übung"], [459, 287, "Ausbildner"], [93, 323, "Dauer"], [459, 323, "Datum"]].forEach(a => T(X(a[0]), Y(a[1] + 6), a[2], 9.5, false));
  [[219, 287, "f_l", 225], [545, 287, "f_a", 270], [219, 323, "f_d", 225], [545, 323, "f_t", 270]].forEach(a => {
    let s = g(a[2]).replace(/\s+/g, " "); if (!s) return;
    if (a[2] === "f_t") s = s.replace(/^(\d{4})-(\d\d)-(\d\d)$/, "$3.$2.$1");
    while (s.length > 1 && mw(s, 9.5) > a[3] * S) s = s.slice(0, -1);
    T(X(a[0]), Y(a[1] + 6), s, 9.5, false);
  });
  const bar = (y, t) => { RC(87, y, 735, 22, BL, false); T(X(98), Y(y + 16), t, 9.5, false); };
  // feste Linien; Text sitzt auf der Linie, bei Überlänge zwei Textzeilen pro Linie
  const put = (key, ys, x0s, x1) => {
    const txt = g(key); if (!txt) return; const n = ys.length;
    const fit = (sz, cap) => {
      const out = []; let line = "";
      const w = i => (x1 - x0s[Math.min(Math.floor(i / cap), n - 1)]) * S - 6;
      fix(txt).split("\n").forEach(par => { line = ""; par.split(" ").forEach(wd => { const t = line ? line + " " + wd : wd; if (mw(t, sz) > w(out.length) && line) { out.push(line); line = wd; } else line = t; }); out.push(line); });
      return out;
    };
    let sz = 10, cap = 1, L = fit(sz, cap);
    if (L.length > n) { sz = 8; cap = 2; L = fit(sz, cap); }
    L.slice(0, n * cap).forEach((l, i) => { const li = Math.floor(i / cap); T(X(x0s[li]) + 2, Y(ys[li]) + 4.5 + (cap === 2 && i % 2 === 0 ? 9 : 0), l, sz, false); });
  };
  bar(380, "Ich (positiv und in der Ich-Form)");
  [432, 462, 492].forEach(y => LN(87, y, 822)); put("ich", [432, 462, 492], [87, 87, 87], 822);
  bar(523, "Max. 3 Beurteilungskriterien/Soll (z.B. Methodik, Ausbildungshilfen, Verhalten als Instruktor usw.)");
  [575, 606, 636].forEach(y => LN(87, y, 822)); put("krit", [575, 606, 636], [87, 87, 87], 822);
  bar(667, "Fakten (das habe ich festgestellt)/Ist");
  IM("Im2", 86, 696, 50, 46); IM("Im3", 466, 698, 50, 48);
  const fy = [719, 750, 780, 811, 841, 872];
  fy.forEach((y, i) => { LN(i ? 87 : 142, y, 442); LN(i ? 468 : 523, y, 822); });
  put("pos", fy, [142, 142, 87, 87, 87, 87], 442); put("neg", fy, [523, 523, 468, 468, 468, 468], 822);
  bar(903, "Verbinden (Tipps)/Konsequenz"); IM("Im4", 84, 944, 62, 32);
  const vy = [955, 985, 1016, 1046, 1077];
  vy.forEach((y, i) => LN(i ? 87 : 154, y, 822)); put("verb", vy, [154, 87, 87, 87, 87], 822);
  bar(1108, "Kurz (aufbauender Schluss)");
  [1160, 1190, 1220].forEach(y => LN(87, y, 822)); put("kurz", [1160, 1190, 1220], [87, 87, 87], 822);
  T(X(87), Y(1270), zw ? "Feuerwehr Zuchwil · Formular nach FKS 3.17.1" : "© by FKS: 07/2026", 6.5, false); RC(722, 1252, 100, 35, zw ? "0.78 0.16 0.16" : "0.55 0.55 0.55", false); T(X(776), Y(1274), zw ? "FWZ" : "63", 9, false, "1 g");
  const st = c.join("\n");
  const objs = [null, "<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [4 0 R] /Count 1 >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 5 0 R >> /XObject << /Im0 6 0 R /Im1 7 0 R /Im2 8 0 R /Im3 9 0 R /Im4 10 0 R >> >> /Contents 11 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"];
  ["logo", "hand", "up", "down", "point"].forEach(k => { const I = k === "logo" && LG ? [LG.b64, LG.w, LG.h] : AO_BIL_IMG[k], d = atob(I[0]); objs.push(`<< /Type /XObject /Subtype /Image /Width ${I[1]} /Height ${I[2]} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${d.length} >>\nstream\n${d}\nendstream`); });
  objs.push(`<< /Length ${st.length} >>\nstream\n${st}\nendstream`);
  let s = "%PDF-1.4\n"; const off = [];
  objs.slice(1).forEach((o, i) => { off.push(s.length); s += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xr = s.length; s += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
  const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255;
  return new File([u], "Erfolgsauswertung Bilanz" + (zw ? " Zuchwil" : "") + (blank ? " leer" : "") + ".pdf", { type: "application/pdf" });
}
function aoBil() {
  const fld = (k, l, ph) => `<label class="vlf"><span>${l}</span><input data-b="f_${k}" value="${esc(aoBilGet("f_" + k))}" placeholder="${esc(ph || "")}"></label>`;
  const ta = a => `<label class="vlf"><span>${esc(a[1])}</span><textarea data-b="${a[0]}" rows="${a[2] + 1}" placeholder="${esc(a[3])}">${esc(aoBilGet(a[0]))}</textarea></label>`;
  app.innerHTML = `<section class="hero"><h1>Erfolgsauswertung / Bilanz</h1><p>Formular 3.17.1 zum Ausfüllen nach der Handmethode (Ich, Beurteilungskriterien, Fakten, Verbinden, Kurz). Deine Eingaben bleiben gespeichert.</p></section>
    <div class="vlform">
      <div class="vl2">${fld("l", "Lektion / Übung")}${fld("a", "Ausbilder")}</div><div class="vl2">${fld("d", "Dauer", "z. B. 50 Min.")}<label class="vlf"><span>Datum</span><input type="date" data-b="f_t" value="${esc(/^\d{4}-\d\d-\d\d$/.test(aoBilGet("f_t")) ? aoBilGet("f_t") : "")}"></label></div>
      ${ta(AO_BIL[0])}${ta(AO_BIL[1])}<div class="vl2">${ta(AO_BIL[2])}${ta(AO_BIL[3])}</div>${ta(AO_BIL[4])}${ta(AO_BIL[5])}
      <label class="vlf"><span>Design</span><select id="bdz"><option value="0">FKS-Original</option><option value="1"${AOS.notes.bil_zw === "1" ? " selected" : ""}>Feuerwehr Zuchwil</option></select></label>
      <div class="vlact"><button class="btn primary" id="bpdf">PDF öffnen</button><button class="btn" id="bsh">PDF teilen</button><button class="btn" id="bpr">Drucken</button><button class="btn" id="bbl">Leeres Formular</button></div>
      <div id="bmsg" class="sinfo" role="status"></div><button class="linkbtn" id="brs">Alles leeren</button></div>`;
  app.querySelectorAll("[data-b]").forEach(e => e.addEventListener("input", () => { AOS.notes["bil_" + e.dataset.b] = e.value; aoSave(); }));
  const zwv = () => AOS.notes.bil_zw === "1"; document.getElementById("bdz").onchange = e => { AOS.notes.bil_zw = e.target.value; aoSave(); };
  const msg = document.getElementById("bmsg"), run = f => () => { msg.textContent = ""; try { f(); } catch (e) { msg.textContent = (e && e.message) || "Export nicht möglich."; } };
  document.getElementById("bpdf").onclick = run(() => aoPdfActs(aoBilPdf(false, zwv()), msg).open()); document.getElementById("bsh").onclick = run(() => aoPdfActs(aoBilPdf(false, zwv()), msg).share());
  document.getElementById("bpr").onclick = run(() => aoPdfActs(aoBilPdf(false, zwv()), msg).print()); document.getElementById("bbl").onclick = run(() => aoPdfActs(aoBilPdf(true, zwv()), msg).open());
  const rs = document.getElementById("brs"); rs.onclick = () => { if (rs.dataset.c) { Object.keys(AOS.notes).filter(k => k.indexOf("bil_") === 0).forEach(k => delete AOS.notes[k]); aoSave(); aoBil(); } else { rs.dataset.c = 1; rs.textContent = "Wirklich leeren? Nochmals tippen."; } };
}

/* ---------- Persönliche Dateiablage (bei KEIL) ---------- */
const aoFOwner = () => (typeof FWZ !== "undefined" && FWZ.user) ? FWZ.user.uid : "gast";
const aoIdb = () => new Promise((res, rej) => { const r = indexedDB.open("fwz-dateien", 1); r.onupgradeneeded = () => r.result.createObjectStore("f", { keyPath: "id" }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const aoIdbRun = (mode, fn) => aoIdb().then(db => new Promise((res, rej) => { const t = db.transaction("f", mode); const q = fn(t.objectStore("f")); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }));
const aoFSize = n => n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
async function aoFiles(host) {
  if (!host) return;
  const cloud = typeof FWZ !== "undefined" && FWZ.enabled && FWZ.user;
  host.innerHTML = `<h3 class="zh">Meine Dateiablage</h3>
    <div class="note">${cloud ? "<b>Persönlich:</b> Diese Dateien gehören <b>" + esc(FWZ.label()) + "</b> und sind nur für dich sichtbar, auf allen deinen Geräten, wenn du angemeldet bist." : "<b>Nicht angemeldet:</b> Dateien bleiben nur auf diesem Gerät und sind nur hier sichtbar. Melde dich an, damit sie dir gehören und auf allen Geräten da sind."} Pro Datei bis 8 MB.</div>
    <div class="dfact"><button class="btn primary" id="dfadd">Datei hinzufügen</button><input type="file" id="dfin" multiple hidden></div>
    <div class="dfmsg sinfo" id="dfmsg" role="status"></div><div id="dflist" class="dflist"><div class="note">Lade …</div></div>`;
  const msg = host.querySelector("#dfmsg"), list = host.querySelector("#dflist"), say = t => { msg.textContent = t || ""; };
  const load = async () => {
    let items = [];
    try { const all = await aoIdbRun("readonly", s => s.getAll()); items = all.filter(f => f.owner === aoFOwner()).map(f => Object.assign(f, { local: true })); } catch (e) {}
    if (cloud) { try { items = items.concat(await FWZ.myFiles()); } catch (e) { say("Konto-Dateien konnten nicht geladen werden (" + ((e && e.code) || (e && e.message) || "Fehler") + ")."); } }
    items.sort((a, b) => b.added - a.added);
    list.innerHTML = items.length ? items.map((f, i) => `<div class="dfrow"><div class="dfn"><b>${esc(f.name)}</b><small>${aoFSize(f.size)} · ${new Date(f.added).toLocaleDateString("de-CH")} · ${f.local ? "nur dieses Gerät" : "Konto"}</small></div><div class="dfb"><button class="btn" data-o="${i}">Öffnen</button><button class="btn" data-s="${i}">Teilen</button><button class="btn ghost" data-d="${i}">Löschen</button></div></div>`).join("") : '<div class="note">Noch keine Dateien. Füge Notizen, Fotos oder Unterlagen für deine Vorstellung hinzu.</div>';
    const blobOf = async f => f.local ? new File([f.blob], f.name, { type: f.type }) : new File([await FWZ.getFile(f)], f.name, { type: f.type });
    const act = (attr, fn) => list.querySelectorAll("[" + attr + "]").forEach(b => b.onclick = async () => { say(""); try { await fn(items[+b.getAttribute(attr)], b); } catch (e) { say((e && e.message) || "Das hat nicht geklappt."); } });
    act("data-o", async f => { const file = await blobOf(f); aoPdfActs(file, msg).open(); });
    act("data-s", async f => { const file = await blobOf(f); if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: file.name }); else say("Teilen wird von diesem Gerät nicht unterstützt. Nutze «Öffnen»."); });
    act("data-d", async (f, b) => { if (!b.dataset.c) { b.dataset.c = 1; b.textContent = "Wirklich?"; return; } if (f.local) await aoIdbRun("readwrite", s => s.delete(f.id)); else await FWZ.delFile(f); load(); });
  };
  host.querySelector("#dfadd").onclick = () => host.querySelector("#dfin").click();
  host.querySelector("#dfin").onchange = async e => {
    const files = [...e.target.files]; e.target.value = "";
    for (const file of files) {
      say("Speichere «" + file.name + "» …");
      try {
        if (file.size > 8 * 1024 * 1024) throw new Error("«" + file.name + "» ist grösser als 8 MB.");
        let done = false;
        if (cloud) { try { await FWZ.addFile(file); done = true; } catch (er) { say("Im Konto speichern ging nicht (" + ((er && er.code) || (er && er.message) || "Fehler") + "). Gespeichert auf diesem Gerät."); } }
        if (!done) await aoIdbRun("readwrite", s => s.put({ id: "f" + Date.now() + Math.random().toString(36).slice(2, 7), owner: aoFOwner(), name: file.name, size: file.size, type: file.type || "", added: Date.now(), blob: file }));
        if (done || !cloud) say("");
      } catch (er) { say((er && er.message) || "Das hat nicht geklappt."); }
    }
    load();
  };
  load();
}
