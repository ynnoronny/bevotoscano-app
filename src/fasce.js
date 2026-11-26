// La dimensione delle cantine: piccola, media, grande, in base agli ettari vitati (molti piccoli
// vendono sfuso o imbottigliano poco, quindi le bottiglie contano solo se gli ettari non si trovano).
// Niente nomi "di categoria": solo la dimensione. I confini li decide il database
// (scanner_regole: "fasce_ettari" = "10, 30", "fasce_bottiglie" = "65000, 200000") e la vista
// attori_pubblici dà già la fascia; qui c'è solo il testo, da tenere allineato se cambiano.
// Le cantine di cui non sappiamo gli ettari stanno con le piccole: i piccoli raramente pubblicano i numeri.
export const DIMENSIONI = [
  ["piccola", "Piccole", "fino a 10 ettari di vigna"],
  ["media", "Medie", "da 10 a 30 ettari di vigna"],
  ["grande", "Grandi", "oltre 30 ettari di vigna"],
];
export const DIMENSIONE_DEFAULT = "piccola";
const CONFINI_ETTARI = [10, 30];
// le cantine del database hanno già la fascia; quelle scritte a mano in data.js solo gli ettari
export const dimensioneDi = (c) => c.fascia
  || (c.ettari != null ? (c.ettari <= CONFINI_ETTARI[0] ? "piccola" : c.ettari <= CONFINI_ETTARI[1] ? "media" : "grande") : "piccola");

// "40.000 bottiglie l'anno" / "circa 65.000 bottiglie l'anno (stima dagli ettari)"
export function volumi(c) {
  const parti = [];
  if (c.ettari) parti.push(`${String(c.ettari).replace(".", ",")} ettari di vigna`);
  if (c.bottiglie) parti.push(`${c.bottiglie_stima ? "circa " : ""}${c.bottiglie.toLocaleString("it-IT")} bottiglie l'anno${c.bottiglie_stima ? " (stima)" : ""}`);
  return parti.join(" · ");
}

// Per riconoscere una cantina citata in una notizia: "Fattoria San Giusto a Rentennano" = "San Giusto a Rentennano".
const VIA = /\b(azienda|agricola|vitivinicola|societa|soc|semplice|agr|srl|s\.r\.l\.|ss|s\.s\.|spa|winery|cantina|cantine|fattoria|tenuta|podere|la|il|le|di|del|della|dei|e)\b/g;
export const chiaveNome = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[''`´.,\-–()]/g, " ").replace(VIA, " ").replace(/\s+/g, " ").trim();
export function trovaCantina(nome, cantine) {
  const k = chiaveNome(nome);
  if (k.length < 3) return null;
  // prima il nome uguale, poi uno che contiene l'altro (solo se abbastanza lunghi da non sbagliare)
  return cantine.find((c) => chiaveNome(c.nome) === k)
    || (k.length >= 5 && cantine.find((c) => { const j = chiaveNome(c.nome); return j.length >= 5 && (` ${j} `.includes(` ${k} `) || ` ${k} `.includes(` ${j} `)); }))
    || null;
}
