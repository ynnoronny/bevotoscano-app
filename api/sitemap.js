// bevotoscano.com/sitemap.xml: l'elenco delle pagine da dare a Google, eventi compresi.
// Si aggiorna da sola: ogni evento pubblicato nell'admin compare qui entro un'ora.
import { leggiEventi } from "../scripts/eventi-db.mjs";
import { SITO, PERCORSI_PUBBLICI, eventoPercorso, esc } from "../src/seo.js";

export default async function handler(req, res) {
  let eventi = [];
  try { eventi = await leggiEventi(); } catch { /* senza eventi, solo le pagine fisse */ }
  const righe = [
    ...PERCORSI_PUBBLICI.map((p) => ({ loc: `${SITO}/${p}` })),
    ...eventi.map((e) => ({ loc: `${SITO}/${eventoPercorso(e)}`, lastmod: e.aggiornato || e.creato })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${righe.map((r) => `  <url><loc>${esc(r.loc)}</loc>${r.lastmod ? `<lastmod>${new Date(r.lastmod).toISOString()}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
}
