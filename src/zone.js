// Le zone del vino toscano, come cerchi sulla mappa (centro e raggio in km, a occhio).
// Servono alle mappe di eventi e cantine: si tocca una zona e la mappa si avvicina.
// prov: le sigle delle province che tocca (per avvicinare la mappa quando si sceglie una provincia).
// Il nome deve coincidere con il campo `zona` delle cantine in data.js.
export const ZONE = [
  { zona: "Colli di Luni", centro: [44.07, 10.03], km: 9, prov: "MS" },
  { zona: "Colline lucchesi", centro: [43.86, 10.62], km: 10, prov: "LU" },
  { zona: "Carmignano", centro: [43.81, 11.01], km: 7, prov: "PO" },
  { zona: "Rufina", centro: [43.83, 11.49], km: 8, prov: "FI" },
  { zona: "Valdarno inferiore", centro: [43.68, 10.85], km: 10, prov: "PI" },
  { zona: "Colline pisane", centro: [43.54, 10.73], km: 11, prov: "PI" },
  { zona: "Costa pisana", centro: [43.37, 10.59], km: 9, prov: "PI" },
  { zona: "San Gimignano", centro: [43.47, 11.04], km: 8, prov: "SI" },
  { zona: "Chianti Classico", centro: [43.5, 11.3], km: 20, prov: "FI SI" },
  { zona: "Bolgheri", centro: [43.22, 10.62], km: 9, prov: "LI" },
  { zona: "Val di Cornia", centro: [43.07, 10.7], km: 9, prov: "LI" },
  { zona: "Elba", centro: [42.78, 10.27], km: 14, prov: "LI" },
  { zona: "Montalcino", centro: [43.06, 11.49], km: 10, prov: "SI" },
  { zona: "Montepulciano", centro: [43.1, 11.79], km: 9, prov: "SI" },
  { zona: "Cortona", centro: [43.28, 11.99], km: 9, prov: "AR" },
  { zona: "Montecucco", centro: [42.89, 11.42], km: 10, prov: "GR" },
  { zona: "Maremma", centro: [42.68, 11.25], km: 24, prov: "GR" },
];

const R = 6371;
export function distanzaKm([a1, b1], [a2, b2]) {
  const r = Math.PI / 180, da = (a2 - a1) * r, db = (b2 - b1) * r;
  const h = Math.sin(da / 2) ** 2 + Math.cos(a1 * r) * Math.cos(a2 * r) * Math.sin(db / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// La zona di un punto: la più vicina che lo contiene (con un po' di margine).
export function zonaDi(p) {
  if (!p) return null;
  let migliore = null;
  for (const z of ZONE) {
    const d = distanzaKm(p, z.centro);
    if (d <= z.km * 1.3 && (!migliore || d / z.km < migliore.d)) migliore = { z, d: d / z.km };
  }
  return migliore?.z.zona || null;
}

// La Toscana: la mappa delle cantine resta dentro questo riquadro.
export const TOSCANA = [[42.2, 9.6], [44.55, 12.45]];
// La Toscana vera e propria (da Giglio alla Lunigiana): è quello che la mappa inquadra all'inizio.
export const TOSCANA_STRETTA = [[42.36, 9.85], [44.45, 12.35]];

// Un colore per ogni zona, così sulla mappa si distinguono a colpo d'occhio
// (toni caldi della palette: vino, oro, oliva, viola, terracotta, blu).
const COLORI = ["#B3243B", "#C98A1B", "#5A6B3C", "#6B3F6B", "#C0603A", "#2F5D7C"];
ZONE.forEach((z, i) => { z.colore = COLORI[i % COLORI.length]; });

// Le dieci province, come riquadro [[sud, ovest], [nord, est]]: scegliendone una
// la mappa delle cantine inquadra tutta la provincia (non solo le sue zone del vino).
export const PROVINCE_BOX = {
  "Massa-Carrara": [[44.0, 9.69], [44.52, 10.25]],
  Lucca: [[43.78, 10.13], [44.33, 10.75]],
  Pistoia: [[43.73, 10.62], [44.13, 11.06]],
  Prato: [[43.76, 10.98], [44.11, 11.21]],
  Firenze: [[43.45, 10.71], [44.24, 11.76]],
  Arezzo: [[43.17, 11.42], [43.83, 12.37]],
  Siena: [[42.83, 10.93], [43.52, 12.03]],
  Grosseto: [[42.23, 10.73], [43.18, 11.95]],
  Livorno: [[42.72, 9.8], [43.6, 10.68]],
  Pisa: [[43.12, 10.26], [43.85, 11.0]],
};
