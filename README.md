# Ketum Empire

Idle tycoon z malajské džungle: sad, dílna, ulice a expanze přes šest států.
Statická PWA bez buildu: `index.html`, `app.js`, `sw.js`, `manifest.webmanifest`.

- Profily a postup se ukládají do `localStorage` v prohlížeči (PIN je hashovaný SHA-256, chrání jen před sdílením zařízení).
- Offline běh zajišťuje `sw.js`; při změně kódu zvyš `VERSION` ve `sw.js`.
- Nasazení: Vercel, každý push na `main` jde do produkce.
