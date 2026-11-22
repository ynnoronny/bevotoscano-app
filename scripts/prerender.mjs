// Dopo "vite build": prepara una pagina HTML per ogni sezione pubblica, ognuna con il suo
// titolo, la sua descrizione, l'anteprima per i social e un riassunto del contenuto.
// Così Google (e WhatsApp, Facebook…) leggono subito la pagina giusta, senza aspettare l'app.
// Le schede dei singoli eventi le prepara al volo api/evento.js, così sono sempre aggiornate.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { PAGINE, metaPercorso, headHtml, inserisci, esc, eventoPercorso, SITO_JSON_LD, cantinaPercorso, cantinaMeta, cantinaJsonLd, cantinaCorpo, briciole, articoloLd, articoloCorpo, articoloPercorso } from "../src/seo.js";
import { ARTICOLI } from "../src/blog.js";
import { pos } from "../src/home/luoghi.js";
import { CANTINE, ESPERIENZE, CASSA, GIOCHI } from "../src/data.js";
import { leggiEventi } from "./eventi-db.mjs";

const DIST = new URL("../dist/", import.meta.url);
let base = readFileSync(new URL("index.html", DIST), "utf8");
base = base.replace("<!--sito-->", `<script type="application/ld+json">${JSON.stringify(SITO_JSON_LD)}</script>`);

let eventi = [];
try {
  eventi = await leggiEventi();
} catch (e) {
  console.warn(`prerender: eventi non letti (${e.message}), continuo senza`);
}
const dataBreve = (iso) => new Date(iso).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long", timeZone: "Europe/Rome" });

// Stesse classi dell'app, così il passaggio alla pagina vera non si nota.
const TAB = [["eventi", "📅", "Eventi"], ["cantine", "🍷", "Cantine"], ["blog", "📖", "Blog"], ["gioca", "🎲", "Giochi"]];
const guscio = (corpo) => `<div class="app"><header class="topbar"><a class="logo" href="/">Bevotoscano</a><span class="logo-claim">Il vino da vivere</span></header>
<main class="page">${corpo}</main>
<nav class="tabbar">${TAB.map(([p, i, l]) => `<a class="tab" href="/${p}"><span class="tab-icon">${i}</span><span>${l}</span></a>`).join("")}</nav></div>`;
const pagina = (titolo, testo, resto = "") => guscio(`<h1 class="page-title">${esc(titolo)}</h1><p class="muted">${esc(testo)}</p>${resto}`);

const listaEventi = eventi.length
  ? `<ul>${eventi.map((e) => `<li><a href="/${eventoPercorso(e)}">${esc(e.titolo)}</a>, ${esc(dataBreve(e.inizio))}, ${esc(e.comune)}</li>`).join("")}</ul>`
  : "";
const listaGiochi = `<ul>${GIOCHI.filter((g) => g.pronto).map((g) => `<li><a href="/gioca/${g.id}">${esc(g.titolo)}</a>: ${esc(g.sottotitolo)}</li>`).join("")}</ul>`;

const CORPI = {
  "": pagina("Il vino da vivere.", "Eventi di vino, territori, persone. Le piccole cantine toscane e il modo per andarle a trovare, anche senza auto.",
    `<h2>Prossimi eventi del vino in Toscana</h2>${listaEventi || '<p><a href="/eventi">Il calendario degli eventi</a></p>'}
<h2>Le cantine</h2><p><a href="/cantine">${CANTINE.length} piccoli produttori, scelti uno a uno</a>, a partire dalle colline pisane intorno a Terricciola.</p>
<h2>Gioca con il vino toscano</h2>${listaGiochi}
<h2>Chi siamo</h2><p>Bevotoscano nasce a Terricciola, Città del Vino sulle colline pisane: un ponte tra il mondo del turismo e quello del vino, dalla parte dei piccoli produttori.</p>`),
  eventi: pagina("Eventi del vino in Toscana", "Gli eventi del vino toscano, con chi il vino lo fa: degustazioni, cene in cantina, sagre. Cerca vicino a te, nel weekend o senza auto, con i punti di raccolta dei bus.",
    listaEventi + '<p><a href="/segnala">Organizzi un evento? Segnalalo, è gratis</a></p>'),
  cantine: pagina("Piccoli produttori, scelti uno a uno", "Andiamo a conoscerle di persona e a ognuna chiediamo qual è il suo vino più toscano. Si parte dalle colline pisane, intorno a Terricciola.",
    `<ul>${CANTINE.map((c) => `<li><a href="/${cantinaPercorso(c)}">${esc(c.nome)}</a>, ${esc(c.comune)} (${esc(c.zona)})</li>`).join("")}</ul>`),
  gioca: pagina("Gioca", "La parte gaming di Bevotoscano: impari il vino toscano giocando, e sfidi il mondo.", listaGiochi),
  "gioca/quiz": pagina("Quanto ne sai di vino toscano?", "Il quiz infinito sul vino toscano: vitigni, denominazioni, territori. Parti con 0 vite, ogni 3 risposte giuste ne guadagni una; sbagli senza vite e la partita finisce."),
  "gioca/oroscopo": pagina("L'oroscopo del vino", "Inserisci giorno e mese di nascita e scopri il tuo vitigno toscano, con l'oroscopo del mese da condividere nelle stories."),
  "gioca/classifica": pagina("Classifica", "Chi ne sa di più di vino toscano: la classifica del quiz infinito, conta quante risposte giuste fai prima di cadere."),
  blog: pagina("Blog", "Storie di vino toscano: vitigni rari, piccole cantine, Terricciola.",
    `<ul>${ARTICOLI.map((a) => `<li><a href="/${articoloPercorso(a)}">${esc(a.titolo)}</a>: ${esc(a.sottotitolo)}</li>`).join("")}</ul>`),
  ...Object.fromEntries(ARTICOLI.map((a) => [articoloPercorso(a), articoloCorpo(a)])),
  esperienze: pagina("Esperienze", "Il vino si capisce meglio con chi lo fa.", `<ul>${ESPERIENZE.map((e) => `<li><b>${esc(e.titolo)}</b>: ${esc(e.testo)}</li>`).join("")}</ul>`),
  cassa: pagina(CASSA.titolo, CASSA.testo),
  segnala: pagina("Segnala un evento", "Cantine, enoteche, aziende bus: segnalare un evento del vino in Toscana su Bevotoscano è gratis e richiede due minuti."),
  admin: "",
};

for (const p of Object.keys(PAGINE)) {
  const m = metaPercorso(p);
  const art = ARTICOLI.find((a) => articoloPercorso(a) === p);
  const html = inserisci(base, headHtml(m, art ? articoloLd(art) : []), CORPI[p] ?? "");
  // Con "cleanUrls" di Vercel, dist/eventi.html risponde a bevotoscano.com/eventi
  const file = new URL(p === "" ? "index.html" : `${p}.html`, DIST);
  mkdirSync(dirname(file.pathname), { recursive: true });
  writeFileSync(file, html);
}
// Una pagina per ogni cantina: dist/cantine/fibbiano.html → bevotoscano.com/cantine/fibbiano
mkdirSync(new URL("cantine/", DIST), { recursive: true });
for (const c of CANTINE) {
  const ld = [cantinaJsonLd(c, pos(c)), briciole([["Cantine", "cantine"], [c.nome, cantinaPercorso(c)]])];
  writeFileSync(new URL(`${cantinaPercorso(c)}.html`, DIST), inserisci(base, headHtml(cantinaMeta(c), ld), cantinaCorpo(c)));
}
// Modello per le schede evento (api/evento.js): l'app senza contenuto, con i meta di /eventi.
writeFileSync(new URL("_evento.html", DIST), inserisci(base, headHtml(metaPercorso("eventi")), ""));
console.log(`prerender: ${Object.keys(PAGINE).length} pagine, ${CANTINE.length} cantine, ${eventi.length} eventi in elenco`);
