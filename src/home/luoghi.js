import { centroComune } from "../comuni.js";

// Posizione indicativa per comune o frazione (la cantina è nei dintorni).
// Per una cantina nuova: aggiungi qui il suo comune, oppure metti lat/lng direttamente in data.js.
export const COMUNI = {
  Terricciola: [43.5254, 10.6789],
  Riparbella: [43.3666, 10.5985],
  "San Miniato": [43.6797, 10.8505],
  Montefoscoli: [43.5603, 10.7322],
  Ghizzano: [43.5533, 10.7650],
};
// Senza coordinate né frazione nota, il centro del comune (tutti i 273 comuni toscani, comuni.js):
// così ogni cantina ed enoteca ha il suo pallino sulla mappa.
export const pos = (c) => (c.lat != null ? [c.lat, c.lng] : COMUNI[c.comune] || centroComune(c.comune));
