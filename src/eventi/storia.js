// La storia Instagram di un evento: un'immagine 1080x1920 (9:16) con data, titolo, luogo,
// prezzo e come arrivarci. La usa il pulsante "Storia Instagram" sulle schede e sulla pagina evento.
import { conProvincia } from "../province.js";
import { prezzoEv, conNavetta } from "./shared.js";
import { condividiFile } from "../games/storyImage.js";

const W = 1080, H = 1920;
const SERIF = "'EB Garamond', Garamond, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

// Tre fondi, come i tre colori delle schede: viola, vinaccia, notte.
const TEMI = [
  { fondo: ["#2E1830", "#432543", "#722F37"], accento: "#E9C98F" },
  { fondo: ["#3A1520", "#722F37", "#B8935A"], accento: "#FFE3B0" },
  { fondo: ["#1C2230", "#432543", "#8A4A52"], accento: "#E9C98F" },
];

const hm = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
const stesso = (a, b) => a.toDateString() === b.toDateString();

// { sopra: "SABATO", numero: "5", sotto: "dicembre", ora: "ore 18:30" }
export function dataStoria(e) {
  const a = new Date(e.inizio), b = e.fine ? new Date(e.fine) : null;
  if (!b || stesso(a, b)) {
    return { sopra: GIORNI[a.getDay()], numero: String(a.getDate()), sotto: MESI[a.getMonth()], ora: `ore ${hm(a)}${b ? ` – ${hm(b)}` : ""}` };
  }
  const numero = a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()}` : `${a.getDate()} ${MESI[a.getMonth()].slice(0, 3)} – ${b.getDate()}`;
  return { sopra: `da ${GIORNI[a.getDay()]}`, numero, sotto: MESI[b.getMonth()], ora: `dalle ${hm(a)}` };
}

function comeArrivi(e) {
  const pk = (e.pickup || [])[0];
  if (pk) return `🚌 Navetta da ${pk.nome.split(",")[0]}${(e.pickup || []).length > 1 ? " e altre fermate" : ""}`;
  if (conNavetta(e)) return "🚌 Con navetta";
  if ((e.accesso || []).includes("treno")) return "🚆 Ci arrivi coi mezzi";
  if ((e.accesso || []).includes("piedi")) return "🚶 A piedi dal centro";
  return "";
}

export async function renderStoriaEvento(e) {
  if (document.fonts?.load) {
    await Promise.all([`800 120px ${SERIF}`, `italic 500 50px ${SERIF}`, `400 40px ${SANS}`, `700 40px ${SANS}`, `800 40px ${SANS}`]
      .map((f) => document.fonts.load(f).catch(() => null)));
  }
  const tema = TEMI[Math.abs(Number(e.id) || 0) % TEMI.length];
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  // fondo sfumato + un alone chiaro in alto
  const g = ctx.createLinearGradient(W * 0.3, 0, W * 0.7, H);
  tema.fondo.forEach((col, i) => g.addColorStop(i / (tema.fondo.length - 1), col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const alone = ctx.createRadialGradient(W * 0.8, 260, 0, W * 0.8, 260, 900);
  alone.addColorStop(0, "rgba(255,255,255,0.10)");
  alone.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = alone;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  const crema = "#F5F0E8";

  // marchio
  ctx.fillStyle = crema;
  ctx.font = `800 66px ${SERIF}`;
  ctx.fillText("Bevotoscano", W / 2, 190);
  ctx.fillStyle = tema.accento;
  ctx.font = `italic 500 38px ${SERIF}`;
  ctx.fillText("Il vino da vivere", W / 2, 245);

  // la data, come un foglio di calendario
  const d = dataStoria(e);
  const cx = W / 2, top = 360, bw = 440, bh = 400;
  ctx.fillStyle = "rgba(245,240,232,0.95)";
  roundRect(ctx, cx - bw / 2, top, bw, bh, 36);
  ctx.fill();
  ctx.fillStyle = tema.fondo[1];
  roundRect(ctx, cx - bw / 2, top, bw, 92, { tl: 36, tr: 36, br: 0, bl: 0 });
  ctx.fill();
  ctx.fillStyle = crema;
  ctx.font = `800 40px ${SANS}`;
  ctx.fillText(spaziato(d.sopra.toUpperCase()), cx, top + 62);
  ctx.fillStyle = "#2E1830";
  ctx.font = `800 ${d.numero.length > 5 ? 120 : 190}px ${SERIF}`;
  ctx.fillText(d.numero, cx, top + (d.numero.length > 5 ? 250 : 270));
  ctx.fillStyle = "#722F37";
  ctx.font = `italic 500 56px ${SERIF}`;
  ctx.fillText(d.sotto, cx, top + 350);

  ctx.fillStyle = tema.accento;
  ctx.font = `700 40px ${SANS}`;
  ctx.fillText(d.ora, cx, top + bh + 80);

  // titolo: si rimpicciolisce finché sta in 4 righe
  let size = 112, righe;
  for (;;) {
    ctx.font = `800 ${size}px ${SERIF}`;
    righe = wrap(ctx, e.titolo, W - 160);
    if (righe.length <= 3 || size <= 76) break;
    size -= 8;
  }
  righe = righe.slice(0, 4);
  ctx.fillStyle = crema;
  let y = top + bh + 120 + size;
  righe.forEach((r) => { ctx.fillText(r, W / 2, y); y += size * 1.06; });

  // luogo
  y += 30;
  ctx.fillStyle = "rgba(245,240,232,0.9)";
  ctx.font = `400 40px ${SANS}`;
  const luogo = [e.luogo_nome, conProvincia(e.comune)].filter(Boolean).join(", ");
  wrap(ctx, `📍 ${luogo}`, W - 200).slice(0, 2).forEach((r) => { ctx.fillText(r, W / 2, y); y += 54; });

  // vini
  if (e.vini) {
    y += 14;
    ctx.fillStyle = tema.accento;
    ctx.font = `italic 500 46px ${SERIF}`;
    wrap(ctx, `Nel bicchiere: ${e.vini}`, W - 220).slice(0, 2).forEach((r) => { ctx.fillText(r, W / 2, y); y += 58; });
  }

  // pillole: prezzo e come ci arrivi
  const pillole = [prezzoEv(e), { testo: comeArrivi(e) }].filter((p) => p.testo && !p.vuoto);
  if (pillole.length) {
    y = Math.max(y + 40, 1480);
    ctx.font = `800 38px ${SANS}`;
    const misure = pillole.map((p) => ctx.measureText(p.testo).width + 64);
    const tot = misure.reduce((s, m) => s + m, 0) + (pillole.length - 1) * 20;
    const inColonna = tot > W - 120;
    let x = W / 2 - tot / 2;
    pillole.forEach((p, i) => {
      const w = misure[i];
      const px = inColonna ? W / 2 - w / 2 : x;
      ctx.fillStyle = p.gratis ? "#2F7A4A" : i === 0 ? crema : "rgba(245,240,232,0.16)";
      roundRect(ctx, px, y - 52, w, 76, 38);
      ctx.fill();
      ctx.fillStyle = p.gratis ? "#fff" : i === 0 ? "#2E1830" : crema;
      ctx.fillText(p.testo, px + w / 2, y);
      if (inColonna) y += 96; else x += w + 20;
    });
  }

  // in fondo: dove trovare tutto
  ctx.fillStyle = "rgba(245,240,232,0.16)";
  roundRect(ctx, 150, 1690, W - 300, 110, 55);
  ctx.fill();
  ctx.fillStyle = crema;
  ctx.font = `700 40px ${SANS}`;
  ctx.fillText("Info e altri eventi su bevotoscano.com", W / 2, 1758);

  return new Promise((res) => c.toBlob(res, "image/png"));
}

export async function condividiStoriaEvento(e) {
  const blob = await renderStoriaEvento(e);
  const nome = `bevotoscano-${String(e.titolo).toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "evento"}`;
  return condividiFile(blob, nome);
}

const spaziato = (s) => s.split("").join(" ");

function wrap(ctx, text, max) {
  const lines = [];
  let line = "";
  for (const w of String(text || "").split(/\s+/)) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  const { tl, tr, br, bl } = typeof r === "number" ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.arcTo(x + w, y, x + w, y + h, tr);
  ctx.arcTo(x + w, y + h, x, y + h, br);
  ctx.arcTo(x, y + h, x, y, bl);
  ctx.arcTo(x, y, x + w, y, tl);
  ctx.closePath();
}
