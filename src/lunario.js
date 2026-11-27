// Il lunario di casa: la data di oggi, la luna e un proverbio contadino, come negli almanacchi
// di una volta (Frate Indovino, Barbanera, Sesto Caio Baccelli). I proverbi sono quelli
// popolari, di tradizione orale: non sono presi da nessun almanacco.
// Per aggiungerne uno: mettilo nel suo mese, o in DEL_GIORNO se è legato a un santo.

// I proverbi legati a un giorno preciso: "m-g" → proverbio. Quel giorno vince su tutti.
const DEL_GIORNO = {
  "11-1": "Per i Santi, manicotto e guanti.",
  "2-2": "Per la Candelora dall'inverno semo fora; ma se piove o tira vento, nell'inverno semo drento.",
  "6-11": "Se piove per San Barnaba, l'uva bianca se ne va; se piove mattina e sera, se ne va la bianca e la nera.",
  "9-29": "Per San Michele l'uva è come il miele.",
  "11-11": "Per San Martino ogni mosto diventa vino.",
  "11-25": "Per Santa Caterina o neve o brina.",
  "12-13": "Santa Lucia, il giorno più corto che ci sia.",
};

const DEL_MESE = [
  ["Gennaio secco, massaio ricco.", "Gennaio polveraio, empie il granaio.", "Gennaio fa i ponti, febbraio li rompe.", "Sotto la neve pane, sotto l'acqua fame.", "Anno nevoso, anno fruttuoso."],
  ["Febbraio, febbraietto, corto e maledetto.", "Febbraio corto e amaro.", "Acqua di febbraio empie il granaio."],
  ["Marzo pazzerello, guarda il sole e prendi l'ombrello.", "Marzo asciutto, aprile bagnato, beato il contadino che ha seminato."],
  ["Aprile, ogni goccia un barile.", "Aprile, dolce dormire.", "Terzo aprilante, quaranta dì durante.", "Aprile fa il fiore e maggio si ha l'onore."],
  ["Maggio ortolano, molta paglia e poco grano.", "Maggio asciutto, gran per tutto."],
  ["Giugno, la falce in pugno."],
  ["Luglio dal gran caldo, bevi bene e batti saldo."],
  ["Agosto, moglie mia non ti conosco.", "La prima acqua d'agosto rinfresca il bosco.", "Agosto matura, settembre vendemmia."],
  ["Settembre, l'uva è fatta e il fico pende.", "Di settembre e d'agosto, bevi il vino vecchio e lascia stare il mosto."],
  ["Ottobre piovoso, campo prosperoso.", "D'ottobre il vino è nelle doghe."],
  ["Per San Martino ogni mosto diventa vino.", "A San Martino si spilla il vino."],
  ["Dicembre imbacuccato, grano assicurato.", "Natale con i tuoi, Pasqua con chi vuoi."],
];

// Quelli buoni tutto l'anno, per non ripetere sempre gli stessi nei mesi con pochi proverbi.
const SEMPRE = [
  "Nella botte piccola c'è il vino buono.",
  "Buon vino fa buon sangue.",
  "Il vino è il latte dei vecchi.",
  "Rosso di sera, bel tempo si spera.",
  "Cielo a pecorelle, acqua a catinelle.",
  "Acqua e chiacchiere non fan farina.",
  "Chi va piano va sano e va lontano.",
];

const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

// La luna: età in giorni dall'ultima luna nuova (luna nuova di riferimento: 6 gennaio 2000, 18:14 UTC).
// Precisa a meno di un giorno, che per un lunario basta.
const SINODICO = 29.530588853;
const RIF = Date.UTC(2000, 0, 6, 18, 14);
export function luna(d = new Date()) {
  const eta = ((((d.getTime() - RIF) / 86400000) % SINODICO) + SINODICO) % SINODICO;
  // la tradizione contadina: in luna calante si travasa e si imbottiglia, in crescente si semina
  if (eta < 1.5 || eta > SINODICO - 1.5) return { simbolo: "🌑", nome: "Luna nuova", consiglio: "si riposa la cantina" };
  if (Math.abs(eta - SINODICO / 2) < 1.5) return { simbolo: "🌕", nome: "Luna piena", consiglio: "il vino non si tocca" };
  if (eta < SINODICO / 2) return { simbolo: eta < 7.4 ? "🌒" : "🌔", nome: "Luna crescente", consiglio: "tempo di semine" };
  return { simbolo: eta > 22.1 ? "🌘" : "🌖", nome: "Luna calante", consiglio: "tempo di travasi" };
}

export function lunario(d = new Date()) {
  const m = d.getMonth(), g = d.getDate();
  const n = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); // un numero per giorno
  const scelta = [...DEL_MESE[m], ...SEMPRE];
  return {
    data: `${GIORNI[d.getDay()]} ${g} ${MESI[m]}`,
    luna: luna(d),
    proverbio: DEL_GIORNO[`${m + 1}-${g}`] || scelta[n % scelta.length],
  };
}
