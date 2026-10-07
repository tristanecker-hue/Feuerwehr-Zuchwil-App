(function () {
  const app = document.getElementById("app"), top = document.querySelector(".top");
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function decrypt(code) {
    const raw = b64((await (await fetch("data.enc", { cache: "no-cache" })).text()).trim());
    const salt = raw.slice(0, 16), iv = raw.slice(16, 28), ct = raw.slice(28);
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct));
  }
  function run(code) {
    const s = document.createElement("script"); s.text = code; document.head.appendChild(s);
    const y = document.createElement("script"); y.src = "sync.js"; y.onload = () => { const a = document.createElement("script"); a.src = "app.js"; document.body.appendChild(a); }; document.body.appendChild(y);
  }
  async function tryCode(code, remember) {
    const plain = await decrypt(code);
    if (remember) { try { localStorage.setItem("fwz-code", code); } catch (e) {} }
    run(plain);
  }
  function form(msg) {
    top.hidden = true;
    app.innerHTML = `<section class="landing"><h1>PIN</h1>
      <form id="lf" style="width:100%;max-width:360px;display:flex;flex-direction:column;gap:12px;margin-top:18px">
        <input id="lc" type="password" autocomplete="off" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="PIN" aria-label="PIN" style="background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:14px 16px;font:inherit;font-size:1.05rem;text-align:center;letter-spacing:.4em">
        <label style="color:var(--muted);font-size:.9rem"><input type="checkbox" id="lr" checked> Auf diesem Gerät merken</label>
        <button class="mbtn main" type="submit">Öffnen</button>
        <div id="lm" role="alert" style="color:var(--bad);min-height:1.4em">${msg || ""}</div>
      </form></section>`;
    document.body.classList.add("startpage");
    const f = document.getElementById("lf"), m = document.getElementById("lm");
    const li = document.getElementById("lc"); li.focus();
    li.addEventListener("input", () => { if (li.value.length === 4) f.requestSubmit(); });
    f.addEventListener("submit", async e => {
      e.preventDefault(); m.textContent = "Prüfe …";
      try { await tryCode(document.getElementById("lc").value.trim(), document.getElementById("lr").checked); }
      catch (err) { m.textContent = "PIN falsch."; }
    });
  }
  let saved = null; try { saved = localStorage.getItem("fwz-code"); } catch (e) {}
  if (saved) tryCode(saved, false).catch(() => { try { localStorage.removeItem("fwz-code"); } catch (e) {} form("PIN ungültig. Bitte neu eingeben."); });
  else form("");
})();
