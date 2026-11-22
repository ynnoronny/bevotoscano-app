// Come appare Bevotoscano su Google e quando si condivide un link (WhatsApp, Facebook…).
// Questo file lo usano tre parti: l'app nel browser, lo script che prepara le pagine al
// momento della pubblicazione (scripts/prerender.mjs) e le funzioni Vercel in api/.
// Per cambiare titolo o descrizione di una pagina, modifica PAGINE qui sotto.

export const SITO = "https://bevotoscano.com";
export const IMMAGINE = `${SITO}/og.jpg`; // anteprima quando si condivide un link
const NOME = "Bevotoscano";

// Una voce per ogni pagina pubblica. La chiave è il percorso dopo bevotoscano.com/
export const PAGINE = {
  "": {
    title: "Bevotoscano · Eventi del vino in Toscana e piccole cantine",
    description: "Eventi del vino in Toscana, anche senza auto: degustazioni, sagre, cantine aperte e bus con punti di raccolta. Le piccole cantine toscane, scelte una a una.",
  },
  eventi: {
    title: "Eventi del vino in Toscana: calendario | Bevotoscano",
    description: "Il calendario degli eventi del vino in Toscana: degustazioni, cene in cantina, sagre. Cerca vicino a te, nel weekend o senza auto con i bus e i punti di raccolta.",
  },
  cantine: {
    title: "Piccole cantine toscane da visitare | Bevotoscano",
    description: "Piccoli produttori di vino toscani, scelti uno a uno: colline pisane, Terricciola, Valdarno. La mappa delle cantine e il loro vino più toscano.",
  },
  gioca: {
    title: "Giochi sul vino toscano: quiz e oroscopo | Bevotoscano",
    description: "Impara il vino toscano giocando: il quiz a tempo con la classifica All Time e l'oroscopo del vino con il tuo vitigno toscano.",
  },
  "gioca/quiz": {
    title: "Quiz: quanto ne sai di vino toscano? | Bevotoscano",
    description: "Il quiz a tempo sul vino toscano: vitigni, denominazioni, territori. Gioca la Sfida da 10 o l'All Time a oltranza e scala la classifica.",
  },
  "gioca/oroscopo": {
    title: "L'oroscopo del vino: quale vitigno toscano sei? | Bevotoscano",
    description: "Inserisci la tua data di nascita e scopri il tuo vitigno toscano: Sangiovese, Vermentino, Canaiolo… Con l'oroscopo del mese da condividere nelle stories.",
  },
  "gioca/classifica": {
    title: "Classifica del quiz sul vino toscano | Bevotoscano",
    description: "Chi ne sa di più di vino toscano? La classifica All Time e quella della Sfida da 10 del quiz Bevotoscano.",
  },
  esperienze: {
    title: "Esperienze del vino in Toscana | Bevotoscano",
    description: "Cantina Diffusa, visite e degustazioni con chi il vino lo fa: le esperienze Bevotoscano con le piccole cantine toscane.",
  },
  cassa: {
    title: "La Cassa Bevotoscano: vini di piccole cantine toscane",
    description: "Una cassa di vini scelti da piccole cantine toscane, spedizione inclusa, con la storia di ogni bottiglia. Mettiti in lista.",
  },
  segnala: {
    title: "Segnala un evento del vino in Toscana | Bevotoscano",
    description: "Organizzi un evento del vino in Toscana? Cantine, enoteche, aziende bus: segnalalo su Bevotoscano, è gratis e richiede due minuti.",
  },
  admin: { title: "Admin | Bevotoscano", description: "", noindex: true },
};

// Vecchi nomi di pagina che puntano a quelli nuovi.
const ALIAS = { "gioca/vitigno": "gioca/oroscopo", home: "" };

// Filtri della pagina eventi: hanno un link loro ma su Google contano come /eventi.
export const FILTRI_EVENTI = ["weekend", "senza-auto", "vicino"];

// I percorsi da mettere nella sitemap e da preparare come pagine.
export const PERCORSI_PUBBLICI = Object.keys(PAGINE).filter((p) => !PAGINE[p].noindex);

// Meta di un percorso ("gioca/quiz"). Restituisce null per la scheda di un evento,
// che ha i suoi meta (vedi eventoMeta).
export function metaPercorso(percorso) {
  let p = String(percorso || "").replace(/^\/+|\/+$/g, "");
  p = ALIAS[p] ?? p;
  const [a, b] = p.split("/");
  if (a === "cantine" && b) return null;
  if (a === "eventi" && b) {
    if (!FILTRI_EVENTI.includes(b)) return null;
    p = "eventi";
  }
  const pagina = PAGINE[p] || PAGINE[""];
  const canonico = PAGINE[p] ? p : "";
  return { ...pagina, url: `${SITO}/${canonico}` };
}

// ---------- eventi ----------
const slug = (s) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70).replace(/-$/, "");

// /eventi/12-vendemmia-a-terricciola: il numero è quello che conta, il resto aiuta Google.
export const eventoPercorso = (e) => `eventi/${e.id}${slug(e.titolo) ? `-${slug(e.titolo)}` : ""}`;
export const idDaPercorso = (pezzo) => {
  const m = /^(\d+)/.exec(String(pezzo || ""));
  return m ? m[1] : null;
};

const dataLunga = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" });

const taglia = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…`);

export function eventoMeta(e) {
  const quando = dataLunga(e.inizio);
  const base = `${quando} a ${e.comune}, ${e.luogo_nome}.`;
  const extra = e.descrizione ? ` ${e.descrizione}` : e.vini ? ` Nel bicchiere: ${e.vini}.` : "";
  return {
    title: `${e.titolo} · ${e.comune}, ${quando} | ${NOME}`,
    description: taglia(`${base}${extra}`.replace(/\s+/g, " ").trim(), 160),
    url: `${SITO}/${eventoPercorso(e)}`,
    image: e.immagine && /^https?:\/\//.test(e.immagine) ? e.immagine : IMMAGINE,
    type: "event",
  };
}

function prezzo(e) {
  if (!e.prezzo && !e.link) return undefined;
  const testo = String(e.prezzo || "");
  const gratis = /gratis|gratuit|libero|free/i.test(testo);
  const num = /(\d+(?:[.,]\d{1,2})?)/.exec(testo);
  const offerta = { "@type": "Offer", url: e.link || `${SITO}/${eventoPercorso(e)}`, priceCurrency: "EUR", availability: "https://schema.org/InStock" };
  if (gratis) offerta.price = 0;
  else if (num) offerta.price = Number(num[1].replace(",", "."));
  return offerta;
}

// Dati strutturati schema.org/Event: è così che un evento può comparire su Google
// nei risultati "Eventi" con data e luogo.
export function eventoJsonLd(e) {
  const social = e.org_social ? (e.org_social.startsWith("http") ? e.org_social : `https://instagram.com/${e.org_social.replace("@", "")}`) : undefined;
  const dati = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.titolo,
    startDate: e.inizio,
    endDate: e.fine || undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    description: e.descrizione || eventoMeta(e).description,
    image: [eventoMeta(e).image],
    url: `${SITO}/${eventoPercorso(e)}`,
    location: {
      "@type": "Place",
      name: e.luogo_nome,
      address: {
        "@type": "PostalAddress",
        streetAddress: e.indirizzo || undefined,
        addressLocality: e.comune,
        addressRegion: "Toscana",
        addressCountry: "IT",
      },
      geo: e.lat != null ? { "@type": "GeoCoordinates", latitude: e.lat, longitude: e.lng } : undefined,
    },
    organizer: e.org_nome ? { "@type": "Organization", name: e.org_nome, url: social } : undefined,
    offers: prezzo(e),
  };
  return JSON.parse(JSON.stringify(dati)); // toglie i campi vuoti
}

export const SITO_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITO}/#org`,
      name: NOME,
      url: SITO,
      logo: `${SITO}/icone/icona-512.png`,
      slogan: "Il vino da vivere",
      email: "info@bevotoscano.com",
      sameAs: ["https://www.instagram.com/bevotoscano/"],
      address: { "@type": "PostalAddress", addressLocality: "Terricciola", addressRegion: "Toscana", addressCountry: "IT" },
    },
    { "@type": "WebSite", "@id": `${SITO}/#sito`, name: NOME, url: SITO, inLanguage: "it-IT", publisher: { "@id": `${SITO}/#org` } },
  ],
};

// ---------- HTML del blocco <head> (usato da prerender e funzioni) ----------
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonScript = (d) => JSON.stringify(d).replace(/</g, "\\u003c");

export function headHtml(m, jsonLd = []) {
  const img = m.image || IMMAGINE;
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    m.noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${esc(m.url)}" />`,
    `<meta property="og:site_name" content="${NOME}" />`,
    `<meta property="og:locale" content="it_IT" />`,
    `<meta property="og:type" content="${m.type === "event" ? "article" : "website"}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${esc(m.url)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...jsonLd.map((d) => `<script type="application/ld+json" data-pagina="1">${jsonScript(d)}</script>`),
  ].join("\n    ");
}

// Sostituisce il blocco tra <!--seo--> e <!--/seo--> e il contenuto di #root.
export function inserisci(template, head, corpo) {
  let html = template.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, `<!--seo-->\n    ${head}\n    <!--/seo-->`);
  if (corpo != null) html = html.replace(/<div id="root">[\s\S]*?<\/div><!--\/root-->/, `<div id="root">${corpo}</div><!--/root-->`);
  return html;
}

// Contenuto essenziale della scheda evento, già nell'HTML: lo leggono Google e chi non ha
// JavaScript. Appena l'app parte, React lo sostituisce con la pagina vera.
export function eventoCorpo(e) {
  const m = eventoMeta(e);
  return `<div class="app"><main class="page"><a class="link" href="/eventi">← Tutti gli eventi</a>
<p class="eyebrow">${esc(dataLunga(e.inizio))}</p>
<h1 class="page-title">${esc(e.titolo)}</h1>
<p>${esc(e.luogo_nome)}${e.indirizzo ? `, ${esc(e.indirizzo)}` : ""}, ${esc(e.comune)}</p>
${e.descrizione ? `<p>${esc(e.descrizione)}</p>` : `<p>${esc(m.description)}</p>`}
${e.vini ? `<p>Nel bicchiere: <b>${esc(e.vini)}</b></p>` : ""}
${e.prezzo ? `<p>${esc(e.prezzo)}</p>` : ""}
${e.org_nome ? `<p>Organizza ${esc(e.org_nome)}</p>` : ""}
${e.link ? `<p><a class="btn btn--primary" href="${esc(e.link)}" rel="noopener">Info e prenotazioni</a></p>` : ""}</main></div>`;
}

// ---------- nel browser ----------
function tag(sel, crea) {
  let el = document.head.querySelector(sel);
  if (!el) { el = crea(); document.head.appendChild(el); }
  return el;
}
const metaTag = (attr, nome) => tag(`meta[${attr}="${nome}"]`, () => {
  const m = document.createElement("meta");
  m.setAttribute(attr, nome);
  return m;
});

export function applicaMeta(m, jsonLd) {
  if (typeof document === "undefined" || !m) return;
  document.title = m.title;
  metaTag("name", "description").setAttribute("content", m.description || "");
  metaTag("property", "og:title").setAttribute("content", m.title);
  metaTag("property", "og:description").setAttribute("content", m.description || "");
  metaTag("property", "og:url").setAttribute("content", m.url || SITO);
  metaTag("property", "og:image").setAttribute("content", m.image || IMMAGINE);
  const robots = document.head.querySelector('meta[name="robots"]');
  const canon = document.head.querySelector('link[rel="canonical"]');
  if (m.noindex) {
    if (!robots) metaTag("name", "robots").setAttribute("content", "noindex");
    canon?.remove();
  } else {
    robots?.remove();
    tag('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" })).setAttribute("href", m.url);
  }
  // dati strutturati della pagina (quelli del sito restano)
  document.head.querySelectorAll("script[data-pagina]").forEach((s) => s.remove());
  if (jsonLd) {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.dataset.pagina = "1";
    s.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(s);
  }
}

// ---------- cantine ----------
// Ogni cantina ha la sua pagina: bevotoscano.com/cantine/fibbiano
export const cantinaPercorso = (c) => `cantine/${c.id}`;

export function cantinaMeta(c) {
  const vino = c.vinoPiuToscano ? ` Il suo vino più toscano: ${c.vinoPiuToscano}.` : "";
  return {
    title: `${c.nome}, cantina a ${c.comune} (${c.zona}) | ${NOME}`,
    description: taglia(`${c.nome} è una piccola cantina toscana a ${c.comune}, ${c.zona}. Visite, degustazioni ed eventi del vino con chi il vino lo fa.${vino}`, 160),
    url: `${SITO}/${cantinaPercorso(c)}`,
  };
}

// schema.org/Winery: nome, luogo, sito della cantina. Aiuta Google a capire di chi parliamo.
export function cantinaJsonLd(c, pos) {
  return JSON.parse(JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Winery",
    name: c.nome,
    url: `${SITO}/${cantinaPercorso(c)}`,
    sameAs: c.sito ? [c.sito] : undefined,
    address: { "@type": "PostalAddress", addressLocality: c.comune, addressRegion: "Toscana", addressCountry: "IT" },
    geo: pos ? { "@type": "GeoCoordinates", latitude: pos[0], longitude: pos[1] } : undefined,
    description: cantinaMeta(c).description,
  }));
}

// Briciole di pane: su Google il risultato mostra "Bevotoscano › Cantine › Fattoria Fibbiano".
export function briciole(voci) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Bevotoscano", ""], ...voci].map(([name, p], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITO}/${p}` })),
  };
}

export function cantinaCorpo(c) {
  return `<div class="app"><main class="page"><a class="link" href="/cantine">← Tutte le cantine</a>
<p class="eyebrow">${esc(c.comune)} · ${esc(c.zona)}</p>
<h1 class="page-title">${esc(c.nome)}</h1>
<p>${esc(cantinaMeta(c).description)}</p>
${c.sito ? `<p><a href="${esc(c.sito)}" rel="noopener">Sito della cantina</a></p>` : ""}</main></div>`;
}
