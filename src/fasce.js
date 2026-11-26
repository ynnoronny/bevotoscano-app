// Le due categorie di cantine, in base agli ettari vitati: molti piccoli vendono sfuso o
// imbottigliano poco, quindi le bottiglie contano solo quando gli ettari non si trovano.
// Le soglie stanno nel database (scanner_regole: "soglia_vignaioli_ettari", ora 15, e
// "soglia_vignaioli" per le bottiglie, ora 100.000); qui ci sono solo i nomi che si leggono nell'app.
// Di default l'app mostra le cantine sotto la soglia e quelle di cui non sappiamo i volumi
// (i piccoli raramente li pubblicano); le grandi si aggiungono con un interruttore.
export const FASCE = {
  vignaioli: { nome: "Vignaioli", spiega: "Chi segue vigna e cantina in prima persona, con piccoli volumi" },
  grandi: { nome: "Grandi cantine", spiega: "Cantine con volumi importanti" },
};
export const INCLUDI_GRANDI = "Includi anche le grandi cantine";

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
