// Le foto di riserva, per eventi e cantine che non hanno ancora una foto loro.
// Paesaggi toscani: due nostri e gli altri da Wikimedia Commons, tutti liberi da diritti
// (pubblico dominio o CC0: non serve citare l'autore). Niente scritta "foto di repertorio".
const C = "https://thumb.wikimedia.org/wikipedia/commons/thumb/";
export const REPERTORIO = [
  "/img/colline.jpg",
  "/img/strada-bianca.jpg",
  `${C}c/cf/Vineyard_in_Tuscany1.jpg/1280px-Vineyard_in_Tuscany1.jpg`,
  `${C}1/1a/Castello_la_Leccia%2C_Tuscany.jpg/1280px-Castello_la_Leccia%2C_Tuscany.jpg`,
  `${C}5/5b/Landscape_in_Tuscany_%2818729682089%29.jpg/1280px-Landscape_in_Tuscany_%2818729682089%29.jpg`,
  `${C}9/93/Castellina_In_Chianti_%28Unsplash%29.jpg/1280px-Castellina_In_Chianti_%28Unsplash%29.jpg`,
  `${C}2/26/Fornacelle_Hill_View.jpg/1280px-Fornacelle_Hill_View.jpg`,
  `${C}8/89/Capella_di_Santa_Maria_della_Neve_hill_view.jpg/1280px-Capella_di_Santa_Maria_della_Neve_hill_view.jpg`,
  `${C}3/34/PAESAGGIO_DEL_CHIANTI_2.JPG/1280px-PAESAGGIO_DEL_CHIANTI_2.JPG`,
  `${C}b/b5/Pontassieve_acone_veduta.jpg/1280px-Pontassieve_acone_veduta.jpg`,
];

// Nella stessa pagina la stessa foto non compare mai due volte: ogni scheda (evento o cantina)
// prende una foto libera, e la tiene finché resti su quella pagina.
let pagina = "";
let usate = new Map();
const numero = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export function fotoDiRiserva(chiave) {
  const p = typeof window !== "undefined" ? window.location.pathname : "";
  if (p !== pagina) { pagina = p; usate = new Map(); }
  if (usate.has(chiave)) return usate.get(chiave);
  const prese = new Set(usate.values());
  const libere = REPERTORIO.filter((f) => !prese.has(f));
  const scelta = libere.length ? libere[numero(chiave) % libere.length] : REPERTORIO[usate.size % REPERTORIO.length];
  usate.set(chiave, scelta);
  return scelta;
}
