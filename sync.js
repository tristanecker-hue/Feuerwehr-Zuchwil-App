/* Synchronisation über Firebase (eigenes Projekt, eigene Benutzer). Ohne Konfiguration bleibt alles lokal. */
const FWZ = (function () {
  const CFG = {
    apiKey: "AIzaSyB2NFTwBtS4oVw0UtyC-LkY0HRB53W6PXw",
    authDomain: "feuerwehr-zuchwil-app.firebaseapp.com",
    projectId: "feuerwehr-zuchwil-app",
    storageBucket: "feuerwehr-zuchwil-app.firebasestorage.app",
    messagingSenderId: "864668105341",
    appId: "1:864668105341:web:bfb06877af522c79110f14"
  };
  const DOMAIN = "feuerwehr-zuchwil-app.ch", FLAG = "fwz-sync", PART = 512 * 1024, MAXSIZE = 8 * 1024 * 1024;
  let ready = null, listeners = [];
  const api = { user: null, MAXSIZE, enabled: !!CFG.apiKey };
  const emit = () => listeners.forEach(f => { try { f(api.user); } catch (e) {} });
  const load = src => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("Firebase konnte nicht geladen werden (offline?)")); document.head.appendChild(s); });
  function init() {
    if (ready) return ready;
    ready = (async () => {
      const b = "https://www.gstatic.com/firebasejs/10.12.2/";
      await load(b + "firebase-app-compat.js");
      await Promise.all([load(b + "firebase-auth-compat.js"), load(b + "firebase-firestore-compat.js")]);
      firebase.initializeApp(CFG);
      await new Promise(res => { let first = true; firebase.auth().onAuthStateChanged(u => { api.user = u; if (first) { first = false; res(); } else emit(); }); });
      emit();
    })();
    ready.catch(() => { ready = null; });
    return ready;
  }
  const db = () => firebase.firestore();
  api.onChange = f => listeners.push(f);
  api.init = init;
  api.label = () => api.user ? (api.user.email || "").split("@")[0] : "";
  api.login = async (name, pw) => {
    await init();
    name = name.trim().toLowerCase();
    await firebase.auth().signInWithEmailAndPassword(name.includes("@") ? name : name + "@" + DOMAIN, pw);
    try { localStorage.setItem(FLAG, "1"); } catch (e) {}
  };
  api.logout = async () => { try { await firebase.auth().signOut(); } catch (e) {} try { localStorage.removeItem(FLAG); } catch (e) {} api.user = null; emit(); };
  api.pullProgress = async () => { const s = await db().collection("fwz_progress").doc(api.user.uid).get(); return s.exists ? JSON.parse(s.data().data) : null; };
  api.pushProgress = o => db().collection("fwz_progress").doc(api.user.uid).set({ data: JSON.stringify(o), updatedAt: Date.now() });
  api.lessons = async () => { const s = await db().collection("fwz_lessons").get(); return s.docs.map(d => Object.assign({ id: d.id, cloud: true }, d.data())); };
  const readB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
  api.addLesson = async (file, mod, ch, progress) => {
    if (file.size > MAXSIZE) throw new Error("«" + file.name + "» ist grösser als 8 MB.");
    const n = Math.max(1, Math.ceil(file.size / PART));
    const ref = db().collection("fwz_lessons").doc();
    for (let i = 0; i < n; i++) {
      await db().collection("fwz_parts").doc(ref.id + "_" + i).set({ lesson: ref.id, i, d: await readB64(file.slice(i * PART, (i + 1) * PART)) });
      if (progress) progress(i + 1, n);
    }
    await ref.set({ mod, ch, name: file.name, size: file.size, added: Date.now(), parts: n, by: api.label() });
  };
  api.getLesson = async f => {
    const bytes = [];
    for (let i = 0; i < f.parts; i++) {
      const s = await db().collection("fwz_parts").doc(f.id + "_" + i).get();
      if (!s.exists) throw new Error("PDF unvollständig.");
      const bin = atob(s.data().d), a = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k);
      bytes.push(a);
    }
    return new Blob(bytes, { type: "application/pdf" });
  };
  api.delLesson = async f => {
    await db().collection("fwz_lessons").doc(f.id).delete();
    for (let i = 0; i < f.parts; i++) await db().collection("fwz_parts").doc(f.id + "_" + i).delete();
  };
  if (!api.enabled) { api.init = () => Promise.reject(new Error("Synchronisation nicht eingerichtet.")); return api; }
  try { if (localStorage.getItem(FLAG) === "1" && navigator.onLine) init().catch(() => {}); } catch (e) {}
  return api;
})();
