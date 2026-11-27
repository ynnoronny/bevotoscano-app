import { useEffect, useState } from "react";

// I preferiti (il cuore) su eventi, cantine, enoteche e articoli del blog. Restano salvati su questo telefono,
// come la data di nascita: niente account, niente dati inviati. In cima alla Home c'è il riassunto per tipo;
// ogni tipo ha la sua pagina: bevotoscano.com/preferiti/eventi, /cantine, /enoteche, /articoli.
// Per ogni preferito teniamo una piccola copia (nome, dove, link), così la Home li mostra subito
// anche prima che arrivino i dati dal database.
const CHIAVE = "bevotoscano-preferiti";
const EVENTO = "bevotoscano-preferiti";

const vuoto = () => ({ eventi: {}, luoghi: {}, articoli: {} });
export function leggiPreferiti() {
  try {
    const p = JSON.parse(localStorage.getItem(CHIAVE));
    return p && typeof p === "object" ? { ...vuoto(), ...p } : vuoto();
  } catch { return vuoto(); }
}
function scrivi(p) {
  try { localStorage.setItem(CHIAVE, JSON.stringify(p)); } catch { /* niente */ }
  window.dispatchEvent(new Event(EVENTO));
}

// tipo: "eventi" | "luoghi"; copia: quello che serve per mostrarlo in Home
export function cambiaPreferito(tipo, id, copia) {
  const p = leggiPreferiti();
  const k = String(id);
  if (p[tipo][k]) delete p[tipo][k];
  else p[tipo][k] = { ...copia, salvato: new Date().toISOString() };
  scrivi(p);
}

export function usePreferiti() {
  const [p, setP] = useState(leggiPreferiti);
  useEffect(() => {
    const agg = () => setP(leggiPreferiti());
    window.addEventListener(EVENTO, agg);
    window.addEventListener("storage", agg); // un'altra scheda del browser
    return () => { window.removeEventListener(EVENTO, agg); window.removeEventListener("storage", agg); };
  }, []);
  return p;
}

export const copiaEvento = (e, percorso) => ({ titolo: e.titolo, comune: e.comune || "", inizio: e.inizio, fine: e.fine || null, percorso });
// una cantina curata ha la sua scheda (percorso); una trovata dalle ricerche porta al sito o a Google Maps (link)
export const copiaLuogo = (c, { dove, percorso }) => ({ nome: c.nome, dove, enoteca: !!c.enoteca, percorso: percorso || null, link: percorso ? null : c.sito || c.maps || null });
export const copiaArticolo = (a) => ({ titolo: a.titolo, tag: a.tag || "", data: a.data || "", percorso: `blog/${a.id}` });

// I quattro tipi come li vede chi usa l'app (le cantine e le enoteche stanno insieme in "luoghi").
export const TIPI_PREFERITI = [
  { id: "eventi", nome: "Eventi", icona: "📅", vuoto: "Tocca il cuore su un evento per ritrovarlo qui." },
  { id: "cantine", nome: "Cantine", icona: "🍇", vuoto: "Tocca il cuore su una cantina per ritrovarla qui." },
  { id: "enoteche", nome: "Enoteche", icona: "🍷", vuoto: "Tocca il cuore su un'enoteca per ritrovarla qui." },
  { id: "articoli", nome: "Articoli", icona: "📰", vuoto: "Tocca il cuore su un articolo del blog per ritrovarlo qui." },
];
export function perTipo(p) {
  const luoghi = Object.entries(p.luoghi).map(([id, c]) => ({ id, ...c }));
  return {
    eventi: Object.entries(p.eventi).map(([id, c]) => ({ id, ...c })),
    cantine: luoghi.filter((x) => !x.enoteca),
    enoteche: luoghi.filter((x) => x.enoteca),
    articoli: Object.entries(p.articoli || {}).map(([id, c]) => ({ id, ...c })),
  };
}
