// Crea un'immagine 1080x1920 (formato stories) e la condivide o la scarica.
// Restituisce "condivisa", "annullata" o "scaricata".
// Nota: si condivide SOLO il file. Se insieme all'immagine passi anche del testo,
// su iPhone Instagram sparisce dal menu o apre il post invece della storia.
export async function shareStory(card, filename) {
  const blob = await renderStory(card);
  const file = new File([blob], `${filename}.png`, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "condivisa";
    } catch (e) {
      if (e?.name === "AbortError") return "annullata";
      // alcuni browser rifiutano la condivisione: si passa al download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: file.name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "scaricata";
}

// Apre la fotocamera delle storie di Instagram (solo da telefono con l'app installata).
export const INSTAGRAM_STORIES = "instagram://story-camera";

// card: { gradient, eyebrow, emoji, title, tagline, body, footer }
export async function renderStory(card) {
  await document.fonts?.ready;
  const W = 1080, H = 1920;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  const g = ctx.createLinearGradient(W * 0.4, 0, W * 0.6, H);
  const stops = [...(card.gradient || "").matchAll(/(#[0-9a-fA-F]{6})\s+(\d+)%/g)];
  if (stops.length) stops.forEach((m) => g.addColorStop(Number(m[2]) / 100, m[1]));
  else { g.addColorStop(0, "#432543"); g.addColorStop(1, "#722F37"); }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#F5F0E8";
  ctx.font = "800 54px 'Playfair Display', Georgia, serif";
  ctx.fillText("Bevotoscano", W / 2, 170);

  ctx.fillStyle = "#F1DFA8";
  ctx.font = "600 36px 'DM Sans', sans-serif";
  ctx.fillText(card.eyebrow.toUpperCase(), W / 2, 500);

  ctx.font = "220px serif";
  ctx.fillText(card.emoji, W / 2, 790);

  ctx.fillStyle = "#F5F0E8";
  ctx.font = "800 116px 'Playfair Display', Georgia, serif";
  const titleLines = wrap(ctx, card.title, W - 160);
  titleLines.forEach((l, i) => ctx.fillText(l, W / 2, 990 + i * 126));
  let y = 990 + (titleLines.length - 1) * 126 + 100;

  if (card.tagline) {
    ctx.fillStyle = "#F1DFA8";
    ctx.font = "italic 600 52px 'Playfair Display', Georgia, serif";
    wrap(ctx, card.tagline, W - 200).forEach((l) => { ctx.fillText(l, W / 2, y); y += 66; });
  }

  if (card.body) {
    ctx.fillStyle = "rgba(245,240,232,0.88)";
    ctx.font = "400 38px 'DM Sans', sans-serif";
    y += 40;
    wrap(ctx, card.body, W - 220).slice(0, 5).forEach((l) => { ctx.fillText(l, W / 2, y); y += 54; });
  }

  ctx.fillStyle = "rgba(245,240,232,0.16)";
  roundRect(ctx, 150, 1690, W - 300, 110, 55);
  ctx.fill();
  ctx.fillStyle = "#F5F0E8";
  ctx.font = "600 40px 'DM Sans', sans-serif";
  ctx.fillText(card.footer || "E tu? Gioca su bevotoscano.com", W / 2, 1758);

  return new Promise((res) => c.toBlob(res, "image/png"));
}

function wrap(ctx, text, max) {
  const lines = [];
  let line = "";
  for (const w of text.split(" ")) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
