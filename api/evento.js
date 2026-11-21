// La scheda di un evento (bevotoscano.com/eventi/12-titolo), preparata al volo:
// titolo, descrizione, anteprima per WhatsApp/Facebook e dati strutturati schema.org/Event
// sono già nell'HTML, quindi Google li legge subito. Poi parte l'app come sempre.
import { leggiEventi } from "../scripts/eventi-db.mjs";
import { eventoMeta, eventoJsonLd, eventoCorpo, headHtml, inserisci, idDaPercorso, eventoPercorso, metaPercorso } from "../src/seo.js";

async function modello(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  // il cookie serve solo nelle anteprime protette di Vercel
  const r = await fetch(`https://${host}/_evento`, { headers: req.headers.cookie ? { cookie: req.headers.cookie } : {} });
  if (!r.ok) throw new Error(`modello ${r.status}`);
  return r.text();
}

export default async function handler(req, res) {
  const pezzo = String(req.query.id || "");
  const id = idDaPercorso(pezzo);
  let html;
  try {
    html = await modello(req);
  } catch {
    // ultima spiaggia: l'app si apre dalla home e va da sola alla pagina giusta
    res.setHeader("Cache-Control", "no-store");
    return res.redirect(307, `/?percorso=${encodeURIComponent(`/eventi/${pezzo}`)}`);
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  // /eventi/weekend, /eventi/senza-auto…: è la pagina eventi con un filtro
  if (!id) {
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(inserisci(html, headHtml(metaPercorso(`eventi/${pezzo}`)), null));
  }

  let e = null;
  try {
    [e] = await leggiEventi(`&id=eq.${id}`);
  } catch {
    // database lento: l'app caricherà l'evento da sola
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(html);
  }

  if (!e) {
    // evento passato o tolto: diciamo a Google di toglierlo dai risultati
    res.setHeader("Cache-Control", "public, s-maxage=300");
    const m = { ...metaPercorso("eventi"), title: "Evento non trovato | Bevotoscano", noindex: true };
    return res.status(404).send(inserisci(html, headHtml(m), null));
  }

  if (pezzo !== eventoPercorso(e).slice("eventi/".length)) {
    // indirizzo vecchio o titolo cambiato: porta a quello giusto
    res.setHeader("Cache-Control", "public, s-maxage=300");
    return res.redirect(301, `/${eventoPercorso(e)}`);
  }

  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  return res.status(200).send(inserisci(html, headHtml(eventoMeta(e), [eventoJsonLd(e)]), eventoCorpo(e)));
}
