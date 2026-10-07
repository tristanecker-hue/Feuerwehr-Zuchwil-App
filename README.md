# Feuerwehr Zuchwil – Ausbildung

Webbasierte Lern-App für die FKS-Reglemente (Basiswissen, Einsatzführung): Zusammenfassung nach Kapiteln, Lernkarten, Quiz und Suche. Der Lernfortschritt wird im Browser gespeichert. Die App ist installierbar (Zum Home-Bildschirm hinzufügen) und läuft nach dem ersten Laden auch offline.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite der App |
| `style.css` | Design |
| `app.js` | Programmlogik (Ansichten, Suche, Lernkarten, Quiz) |
| `ao.js` | Lernseite Ausbildungsoffizier (Kursprogramm, Lektionen, Selbsttest, KEIL, Zahlen-Trainer) |
| `lock.js` | PIN-Abfrage, entschlüsselt die Inhalte im Browser |
| `data.enc` | Alle Inhalte und Bilder, verschlüsselt (AES-256, nur mit Code lesbar) |
| `logo.jpg`, `icon-512.png` | Logo und App-Symbol |
| `manifest.webmanifest`, `sw.js` | Installierbar und offlinefähig |

## Online stellen (GitHub Pages)

1. Dateien ins Repository hochladen (Branch `main`).
2. Settings → Pages → Source: **GitHub Actions** (mit `.github/workflows/pages.yml`) oder **Deploy from a branch** → `main` / `/ (root)`.
3. Die App ist danach unter `https://<benutzer>.github.io/<repository>/` erreichbar.

Lokal testen: im Ordner `python3 -m http.server` starten und `http://localhost:8000` öffnen.

## Hinweis zum Urheberrecht

Die Reglemente und Abbildungen sind © Feuerwehr Koordination Schweiz FKS (www.feukos.ch). Die Inhalte liegen nur verschlüsselt (`data.enc`) im Repository. Den PIN nicht weitergeben und nicht ins Repository schreiben. Massgebend ist immer das Reglement in der gültigen Fassung.
