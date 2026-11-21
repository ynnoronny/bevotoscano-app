// Calcola il "cielo del mese" per l'oroscopo del vino, con posizioni astronomiche reali
// (libreria astronomy-engine, effemeridi VSOP87). Non inventa nulla: dice in che segno
// sono Sole, Luna e pianeti, quando cambiano segno e quando ci sono Luna nuova e piena.
//
// Uso:  node scripts/cielo-del-mese.mjs [data ISO]
// Stampa un JSON. Lo usa l'aggiornamento mensile automatico per scrivere i testi.

import * as A from "astronomy-engine";

const SEGNI = ["Ariete", "Toro", "Gemelli", "Cancro", "Leone", "Vergine", "Bilancia", "Scorpione", "Sagittario", "Capricorno", "Acquario", "Pesci"];
const PIANETI = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
const NOMI = { Sun: "Sole", Moon: "Luna", Mercury: "Mercurio", Venus: "Venere", Mars: "Marte", Jupiter: "Giove", Saturn: "Saturno" };

// Longitudine eclittica geocentrica (eclittica vera della data, come in astrologia tropicale).
function longitudine(body, date) {
  if (body === "Sun") return A.SunPosition(date).elon;
  if (body === "Moon") return A.EclipticGeoMoon(date).lon;
  const v = A.GeoVector(body, date, true);
  return A.Ecliptic(v).elon;
}
const segnoDi = (lon) => SEGNI[Math.floor((((lon % 360) + 360) % 360) / 30)];
const giorno = (d) => d.toISOString().slice(0, 10);

// Momento in cui il Sole entra nel prossimo segno (cerca il prossimo multiplo di 30°).
function prossimoIngresso(date) {
  const lon = longitudine("Sun", date);
  const target = (Math.floor(lon / 30) + 1) * 30 % 360;
  return A.SearchSunLongitude(target, date, 40).date;
}

const oggi = process.argv[2] ? new Date(process.argv[2]) : new Date();
const lonSole = longitudine("Sun", oggi);
// Inizio del periodo: quando il Sole è entrato nel segno attuale.
const inizio = A.SearchSunLongitude(Math.floor(lonSole / 30) * 30, new Date(oggi.getTime() - 35 * 864e5), 40).date;
const fine = prossimoIngresso(oggi);

// Pianeti: segno a inizio e fine periodo, e se sono retrogradi a metà.
const meta = new Date((inizio.getTime() + fine.getTime()) / 2);
const pianeti = PIANETI.map((p) => {
  const a = longitudine(p, inizio), b = longitudine(p, fine);
  const m1 = longitudine(p, meta), m2 = longitudine(p, new Date(meta.getTime() + 864e5));
  const retro = ((m2 - m1 + 540) % 360) - 180 < 0;
  return { pianeta: NOMI[p], segno_inizio: segnoDi(a), segno_fine: segnoDi(b), retrogrado_a_meta_periodo: retro };
});

// Lune nuove e piene nel periodo.
const lune = [];
let t = inizio;
while (true) {
  const q = A.SearchMoonQuarter(t);
  t = q.time.date;
  if (t > fine) break;
  if (q.quarter === 0 || q.quarter === 2) {
    lune.push({ fase: q.quarter === 0 ? "Luna nuova" : "Luna piena", data: giorno(t), segno: segnoDi(longitudine("Moon", t)) });
  }
  t = new Date(t.getTime() + 864e5);
}

console.log(JSON.stringify({
  calcolato_il: oggi.toISOString(),
  sole: { segno: segnoDi(lonSole), dal: inizio.toISOString(), al: fine.toISOString() },
  pianeti,
  lune,
}, null, 2));
