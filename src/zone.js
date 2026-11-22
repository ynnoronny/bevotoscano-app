// Le zone del vino toscano, come cerchi sulla mappa (centro e raggio in km, a occhio).
// Servono alle mappe di eventi e cantine: si tocca una zona e la mappa si avvicina.
// Il nome deve coincidere con il campo `zona` delle cantine in data.js.
export const ZONE = [
  { zona: "Colli di Luni", centro: [44.07, 10.03], km: 9 },
  { zona: "Colline lucchesi", centro: [43.86, 10.62], km: 10 },
  { zona: "Carmignano", centro: [43.81, 11.01], km: 7 },
  { zona: "Rufina", centro: [43.83, 11.49], km: 8 },
  { zona: "Valdarno inferiore", centro: [43.68, 10.85], km: 10 },
  { zona: "Colline pisane", centro: [43.54, 10.73], km: 11 },
  { zona: "Costa pisana", centro: [43.37, 10.59], km: 9 },
  { zona: "San Gimignano", centro: [43.47, 11.04], km: 8 },
  { zona: "Chianti Classico", centro: [43.5, 11.3], km: 20 },
  { zona: "Bolgheri", centro: [43.22, 10.62], km: 9 },
  { zona: "Val di Cornia", centro: [43.07, 10.7], km: 9 },
  { zona: "Elba", centro: [42.78, 10.27], km: 14 },
  { zona: "Montalcino", centro: [43.06, 11.49], km: 10 },
  { zona: "Montepulciano", centro: [43.1, 11.79], km: 9 },
  { zona: "Cortona", centro: [43.28, 11.99], km: 9 },
  { zona: "Montecucco", centro: [42.89, 11.42], km: 10 },
  { zona: "Maremma", centro: [42.68, 11.25], km: 24 },
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
