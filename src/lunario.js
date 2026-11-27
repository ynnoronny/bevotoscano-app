// Il lunario di casa, sul modello del Sesto Caio Baccelli (il lunario toscano, il riferimento
// principale per Ronny), poi Frate Indovino e Barbanera: la data col santo del giorno, la luna,
// i lavori del mese in vigna e in cantina, e un proverbio toscano/contadino.
// Proverbi e santi sono di tradizione popolare; i lavori del mese sono scritti da noi:
// nessun testo è copiato da un almanacco.
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

// I santi e le feste a data fissa che contano nel calendario di campagna (non tutti i giorni ne hanno uno).
const SANTI = {
  "1-1": "Maria Madre di Dio", "1-6": "Epifania", "1-17": "Sant'Antonio abate", "1-20": "San Sebastiano",
  "1-22": "San Vincenzo, patrono dei vignaioli", "2-2": "Candelora", "2-3": "San Biagio", "2-14": "San Valentino",
  "3-19": "San Giuseppe", "4-23": "San Giorgio", "4-25": "San Marco", "5-1": "San Giuseppe lavoratore",
  "6-11": "San Barnaba", "6-13": "Sant'Antonio di Padova", "6-24": "San Giovanni Battista, patrono di Firenze",
  "6-29": "Santi Pietro e Paolo", "7-22": "Santa Maria Maddalena", "7-25": "San Giacomo", "7-26": "Sant'Anna",
  "8-10": "San Lorenzo", "8-15": "Assunta", "9-8": "Natività di Maria", "9-29": "San Michele",
  "10-4": "San Francesco", "10-18": "San Luca", "11-1": "Ognissanti", "11-2": "Commemorazione dei defunti",
  "11-11": "San Martino", "11-25": "Santa Caterina", "11-30": "Sant'Andrea", "12-6": "San Nicola",
  "12-8": "Immacolata", "12-13": "Santa Lucia", "12-25": "Natale", "12-26": "Santo Stefano", "12-31": "San Silvestro",
};

// I lavori del mese, in vigna e in cantina.
const LAVORI = [
  "si pota la vigna a secco; in cantina si colmano le botti",
  "si finisce di potare e si legano i tralci",
  "la vite \"piange\": si lavora la terra tra i filari",
  "germogliano le viti: occhio alle gelate",
  "si tolgono i germogli doppi",
  "fiorisce la vite e si allegano i grappoli",
  "si cimano i tralci e si diradano i grappoli",
  "l'uva invaia e cambia colore",
  "si vendemmia",
  "si finisce di vendemmiare e si svina",
  "si colmano le botti e si assaggia il vino nuovo",
  "la vigna riposa; in cantina si colmano le botti",
];

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
  "Pane d'un giorno e vino d'un anno.",
  "Al contadino non far sapere quanto è buono il formaggio con le pere.",
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
    santo: SANTI[`${m + 1}-${g}`] || null,
    lavori: LAVORI[m],
    luna: luna(d),
    proverbio: DEL_GIORNO[`${m + 1}-${g}`] || scelta[n % scelta.length],
  };
}
