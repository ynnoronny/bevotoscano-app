// Controllo "niente esce dallo schermo" (26/11, dopo il bug dell'oroscopo in home).
// Apre le pagine principali a larghezza telefono, apre anche gli altri segni dell'oroscopo,
// e segnala ogni pagina dove qualcosa è più largo dello schermo.
// Uso: npm run dev (in un'altra finestra), poi: node scripts/controlla-schermo.mjs [http://127.0.0.1:5173]
// Serve Playwright (npx playwright install chromium la prima volta).
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.argv[2] || "http://127.0.0.1:5173";
const PAGINE = ["/", "/eventi", "/cantine", "/enoteche", "/blog", "/gioca", "/preferiti"];
const LARGHEZZE = [360, 390, 768];

const b = await chromium.launch();
let errori = 0;
for (const w of LARGHEZZE) {
  const c = await b.newContext({ viewport: { width: w, height: 800 }, hasTouch: true, isMobile: w < 700 });
  await c.addInitScript(() => localStorage.setItem("bevotoscano-nascita", JSON.stringify({ g: 10, m: 5, a: 1985 })));
  const p = await c.newPage();
  for (const pagina of PAGINE) {
    await p.goto(BASE + pagina);
    await p.waitForTimeout(800);
    // apri tutto quello che si apre nell'oroscopo
    for (const t of ["Il tuo segno affine", "Guarda anche gli altri segni"]) {
      const l = p.getByText(t).first();
      if (await l.count()) await l.click().catch(() => {});
    }
    await p.waitForTimeout(300);
    const fuori = await p.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const larghi = [...document.querySelectorAll(".shell-dentro *")]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > w + 1 && !el.closest("[class*=scorri], .gioco-segni, .leaflet-container, .filtri-scelta"); })
        .slice(0, 3).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`);
      return { doc: document.documentElement.scrollWidth, area: document.querySelector(".shell-area")?.scrollWidth || 0, w, larghi };
    });
    const ok = fuori.doc <= fuori.w && fuori.area <= fuori.w && !fuori.larghi.length;
    if (!ok) errori++;
    console.log(`${ok ? "ok " : "NO "} ${w}px ${pagina}${ok ? "" : ` → largo ${Math.max(fuori.doc, fuori.area)}px ${fuori.larghi.join(", ")}`}`);
  }
  await c.close();
}
await b.close();
process.exit(errori ? 1 : 0);
