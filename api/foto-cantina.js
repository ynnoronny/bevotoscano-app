// La foto di una cantina presa dal suo sito: bevotoscano.com/api/foto-cantina?sito=https://…
// Legge la pagina iniziale del sito e cerca la foto che la cantina stessa ha scelto per presentarsi
// (og:image, cioè l'anteprima che esce quando condividi il sito su WhatsApp o Facebook;
// se manca, twitter:image o la prima foto grande della pagina). Poi rimanda lì il browser.
// Vercel tiene in memoria la risposta per un mese, così il sito della cantina viene letto di rado.
// Funziona da sola per ogni cantina con un sito, anche quelle nuove trovate dalle ricerche notturne.
// Se il sito non ha foto leggibili (o la cantina non ha un sito) e in Vercel c'è la chiave
// GOOGLE_PLACES_KEY, prende la prima foto della scheda Google Maps della cantina (nome + comune).
// Niente foto trovata: risponde 404 e l'app mette la foto di repertorio.

const UN_MESE = 60 * 60 * 24 * 30;
// niente indirizzi interni o numerici: solo siti veri con un nome
const SITO_OK = /^https?:\/\/(?!localhost|127\.|10\.|192\.168\.|169\.254\.|\[)[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(\/|$)/i;
// loghi, icone e simili non sono foto della cantina
const NON_FOTO = /(logo|icon|favicon|sprite|placeholder|avatar|banner-cookie|\.svg)(\b|_|-|\.|$)/i;

function trova(html, base) {
  html = html.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
  const meta = (nome) => {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${nome}["'][^>]*>`, "i");
    const tag = html.match(re)?.[0];
    return tag?.match(/content=["']([^"']+)["']/i)?.[1];
  };
  const candidati = [meta("og:image"), meta("og:image:url"), meta("og:image:secure_url"), meta("twitter:image"), meta("twitter:image:src")];
  // <link rel="image_src">, l'immagine dei dati strutturati, il fermo immagine del video di apertura
  candidati.push(html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1]);
  candidati.push(html.match(/"image"\s*:\s*(?:\{[^}]*?"url"\s*:\s*)?\[?\s*"([^"]+\.(?:jpe?g|webp|png)[^"]*)"/i)?.[1]);
  candidati.push(html.match(/<video[^>]+poster=["']([^"']+)["']/i)?.[1]);
  // poi le foto della pagina: sfondi (background-image) e <img>, nell'ordine in cui compaiono
  const FOTO = String.raw`[^"')\s]+\.(?:jpe?g|webp)(?:\?[^"')\s]*)?`;
  const re = new RegExp(String.raw`(?:background(?:-image)?\s*:\s*url\(\s*["']?(${FOTO})|<img[^>]+?(?:data-src|data-lazy-src|src)=["'](${FOTO})["'])`, "gi");
  for (const m of html.matchAll(re)) candidati.push(m[1] || m[2]);
  for (const c of candidati) {
    if (!c || NON_FOTO.test(c)) continue;
    try {
      const u = new URL(c.replace(/&amp;/g, "&"), base);
      if (u.protocol === "https:" || u.protocol === "http:") return u.href;
    } catch { /* indirizzo storto: si passa al prossimo */ }
  }
  return null;
}

async function dalSito(sito) {
  const r = await fetch(sito, {
    redirect: "follow",
    signal: AbortSignal.timeout(7000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BevotoscanoFoto/1.0)", Accept: "text/html" },
  });
  if (!r.ok) return null;
  return trova((await r.text()).slice(0, 600000), r.url || sito);
}

// La scheda Google Maps della cantina (Places API): solo se la chiave è configurata in Vercel.
async function daGoogle(nome, comune) {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key || !nome) return null;
  const cerca = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    signal: AbortSignal.timeout(6000),
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.photos" },
    body: JSON.stringify({ textQuery: `${nome} ${comune || ""} Toscana`.trim(), languageCode: "it", regionCode: "IT", maxResultCount: 1 }),
  });
  if (!cerca.ok) return null;
  const foto = (await cerca.json()).places?.[0]?.photos?.[0]?.name;
  if (!foto) return null;
  const m = await fetch(`https://places.googleapis.com/v1/${foto}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${key}`, { signal: AbortSignal.timeout(6000) });
  return m.ok ? (await m.json()).photoUri || null : null;
}

export default async function handler(req, res) {
  let sito = String(req.query.sito || "").trim();
  if (sito && !/^https?:\/\//i.test(sito)) sito = `https://${sito}`;
  const nome = String(req.query.nome || "").slice(0, 120);
  const comune = String(req.query.comune || "").slice(0, 80);
  if (sito && !SITO_OK.test(sito)) return res.status(400).send("sito non valido");
  if (!sito && !nome) return res.status(400).send("manca il sito o il nome");

  // ?prova=1: dice cosa ha visto sul sito (per capire perché una foto non arriva)
  if (req.query.prova && sito) {
    try {
      const r = await fetch(sito, { redirect: "follow", signal: AbortSignal.timeout(7000), headers: { "User-Agent": "Mozilla/5.0 (compatible; BevotoscanoFoto/1.0)", Accept: "text/html" } });
      const t = await r.text();
      return res.json({ status: r.status, url: r.url, lunghezza: t.length, foto: trova(t, r.url), img: [...t.matchAll(/<img[^>]{0,400}>/gi)].slice(0, 12).map((m) => m[0]), sfondi: [...t.matchAll(/url\([^)]{0,200}\)/gi)].slice(0, 12).map((m) => m[0]) });
    } catch (e) { return res.json({ errore: String(e) }); }
  }
  let foto = null, google = false;
  if (sito) foto = await dalSito(sito).catch(() => null);
  if (!foto) { foto = await daGoogle(nome, comune).catch(() => null); google = !!foto; }
  if (!foto) {
    // riprova tra un giorno: magari il sito era solo lento
    res.setHeader("Cache-Control", "public, s-maxage=86400");
    return res.status(404).send("nessuna foto");
  }
  // le foto di Google hanno un indirizzo che dopo un po' scade: le ricontrolliamo ogni settimana
  const durata = google ? UN_MESE / 4 : UN_MESE;
  res.setHeader("Cache-Control", `public, s-maxage=${durata}, stale-while-revalidate=${durata}`);
  return res.redirect(302, foto);
}

export { trova };
