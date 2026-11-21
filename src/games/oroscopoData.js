// L'oroscopo del vino: 12 segni, 12 vitigni autoctoni toscani.
// Per cambiare un abbinamento basta scambiare i campi `vitigno` (e relativi testi) tra due segni.
// `dal` / `al` sono [mese, giorno].

export const SEGNI = [
  {
    id: "ariete", segno: "Ariete", simbolo: "♈", dal: [3, 21], al: [4, 19],
    vitigno: "Ciliegiolo", emoji: "🍒",
    tagline: "Fresco, diretto, irresistibile",
    descrizione: "Ariete e Ciliegiolo partono a razzo: frutta, energia, voglia di fare. Non ti prendi troppo sul serio e per questo piaci a tutti. Ti apri subito, senza bisogno di decantare.",
    curiosita: "Il Ciliegiolo è uno dei vitigni più antichi della Toscana. Il nome viene dal profumo di ciliegia che sprigiona nel bicchiere.",
    gradient: "linear-gradient(170deg, #6B1D1F 0%, #B5363A 45%, #E8A87C 100%)",
  },
  {
    id: "toro", segno: "Toro", simbolo: "♉", dal: [4, 20], al: [5, 20],
    vitigno: "Canaiolo", emoji: "🤝",
    tagline: "Morbido, accogliente, indispensabile",
    descrizione: "Come il Toro, il Canaiolo ama le cose buone e le persone vicine. Non cerca i riflettori, ma senza di lui il blend non funziona: ammorbidisce gli spigoli e tiene insieme la tavola.",
    curiosita: "Per secoli il Canaiolo è stato inseparabile dal Sangiovese nel Chianti: Bettino Ricasoli lo voleva nella sua formula originale.",
    gradient: "linear-gradient(170deg, #3D2418 0%, #7A4B3A 45%, #C9A96E 100%)",
  },
  {
    id: "gemelli", segno: "Gemelli", simbolo: "♊", dal: [5, 21], al: [6, 20],
    vitigno: "Malvasia Bianca", emoji: "🎭",
    tagline: "Due anime, sempre profumate",
    descrizione: "Gemelli e Malvasia hanno due facce: secca e fresca a tavola, dolce e avvolgente nel Vin Santo. Chiacchieri, profumi, cambi registro, e riesci sempre a essere al centro del discorso.",
    curiosita: "La Malvasia Bianca Lunga, insieme al Trebbiano, è una delle uve storiche del Vin Santo toscano.",
    gradient: "linear-gradient(170deg, #5C4A1E 0%, #A8893F 45%, #F1DFA8 100%)",
  },
  {
    id: "cancro", segno: "Cancro", simbolo: "♋", dal: [6, 21], al: [7, 22],
    vitigno: "Trebbiano Toscano", emoji: "🏡",
    tagline: "Il vino di casa",
    descrizione: "Cancro e Trebbiano sanno di casa, di nonni, di Vin Santo tirato fuori per gli ospiti. Sembri semplice, ma chi ti conosce sa quanta memoria e quanta cura porti con te.",
    curiosita: "Il Trebbiano Toscano è una delle uve bianche più diffuse d'Italia. In Francia lo chiamano Ugni Blanc ed è la base del Cognac.",
    gradient: "linear-gradient(170deg, #3E4A2A 0%, #7D8A4E 45%, #E4D9A6 100%)",
  },
  {
    id: "leone", segno: "Leone", simbolo: "♌", dal: [7, 23], al: [8, 22],
    vitigno: "Sangiovese", emoji: "👑",
    tagline: "Il re della Toscana",
    descrizione: "Leone e Sangiovese: il nome viene da \"sangue di Giove\", e si vede. Sei il punto di riferimento, riconoscibile ovunque: che sia Chianti, Brunello o Morellino, sei sempre tu, e si sente.",
    curiosita: "Il Sangiovese è di gran lunga il vitigno più coltivato in Toscana. Senza di lui la Toscana del vino non esisterebbe.",
    gradient: "linear-gradient(170deg, #4A1028 0%, #8B1A2B 45%, #C9A96E 100%)",
  },
  {
    id: "vergine", segno: "Vergine", simbolo: "♍", dal: [8, 23], al: [9, 22],
    vitigno: "Vernaccia di San Gimignano", emoji: "🏰",
    tagline: "Precisione tra le torri",
    descrizione: "Vergine e Vernaccia: ordinata, minerale, precisa. Non alzi la voce, ma tutto quello che fai ha un senso. E hai una storia che pochi possono vantare.",
    curiosita: "La Vernaccia di San Gimignano è stata la prima DOC d'Italia, nel 1966. Dante la cita nella Divina Commedia.",
    gradient: "linear-gradient(170deg, #4A3A22 0%, #8C7448 45%, #E9D9B0 100%)",
  },
  {
    id: "bilancia", segno: "Bilancia", simbolo: "♎", dal: [9, 23], al: [10, 22],
    vitigno: "Mammolo", emoji: "🌸",
    tagline: "Eleganza che profuma di viola",
    descrizione: "Bilancia e Mammolo cercano armonia e bellezza. Non dominano il blend: lo rendono elegante. Sei quello che porta equilibrio e un tocco di gentilezza dove serve.",
    curiosita: "Il Mammolo prende il nome dalla \"mammola\", la viola: è il profumo che regala ai vini. Lo trovi nei blend tradizionali di Montepulciano.",
    gradient: "linear-gradient(170deg, #2E1E3F 0%, #6B4B8A 45%, #D8B8E0 100%)",
  },
  {
    id: "scorpione", segno: "Scorpione", simbolo: "♏", dal: [10, 23], al: [11, 21],
    vitigno: "Colorino", emoji: "🌑",
    tagline: "Profondità e mistero",
    descrizione: "Scorpione e Colorino: scuri, intensi, impossibili da ignorare. Non parli tanto ma quando lo fai tutti ascoltano. La tua impronta si sente anche quando non ti si vede.",
    curiosita: "Il Colorino deve il nome al colore quasi nero dei suoi acini: veniva usato per dare colore e struttura ai vini toscani.",
    gradient: "linear-gradient(170deg, #1A0F2E 0%, #2A1B3D 35%, #722F37 70%, #C9A96E 100%)",
  },
  {
    id: "sagittario", segno: "Sagittario", simbolo: "♐", dal: [11, 22], al: [12, 21],
    vitigno: "Vermentino Nero", emoji: "🌊",
    tagline: "Spirito libero tra terra e mare",
    descrizione: "Sagittario e Vermentino Nero guardano sempre oltre: mentre tutti fissano le colline, tu guardi il mare. Non segui le regole della Toscana classica, ne scrivi di nuove.",
    curiosita: "Il Vermentino Nero è rarissimo: lo trovi quasi solo sulla costa toscana. Non ha niente a che fare col Vermentino bianco.",
    gradient: "linear-gradient(170deg, #1A2E3A 0%, #2C4A5A 35%, #5A6B3C 70%, #C9A96E 100%)",
  },
  {
    id: "capricorno", segno: "Capricorno", simbolo: "♑", dal: [12, 22], al: [1, 19],
    vitigno: "Foglia Tonda", emoji: "🌿",
    tagline: "Testardo, e per fortuna",
    descrizione: "Capricorno e Foglia Tonda non mollano mai. Dati per spariti, tornano più forti di prima. Vai dove gli altri non vanno, e alla fine arrivi in cima.",
    curiosita: "La Foglia Tonda era considerata quasi estinta. Alcuni produttori coraggiosi l'hanno riportata in vita, vinificandola anche in purezza.",
    gradient: "linear-gradient(170deg, #2D3A1E 0%, #5A6B3C 45%, #C9A96E 100%)",
  },
  {
    id: "acquario", segno: "Acquario", simbolo: "♒", dal: [1, 20], al: [2, 18],
    vitigno: "Barsaglina", emoji: "🔭",
    tagline: "Raro, originale, avanti",
    descrizione: "Acquario e Barsaglina: pochi vi conoscono, chi vi incontra non vi dimentica. Sei fuori dagli schemi per natura, e quello che oggi sembra strano domani diventa tendenza.",
    curiosita: "La Barsaglina è un vitigno rarissimo della zona di Massa-Carrara, dove la chiamano anche Massaretta.",
    gradient: "linear-gradient(170deg, #12263A 0%, #2F5D7C 45%, #A9C9D6 100%)",
  },
  {
    id: "pesci", segno: "Pesci", simbolo: "♓", dal: [2, 19], al: [3, 20],
    vitigno: "Ansonica", emoji: "🐚",
    tagline: "Sognatore d'isola",
    descrizione: "Pesci e Ansonica vivono vicino al mare, tra rocce e vento. Sensibile, salino, un po' sognatore: sei il vino che ti riporta a un'estate che non vuoi finisca.",
    curiosita: "L'Ansonica si coltiva sull'Isola del Giglio e sull'Argentario, spesso su terrazze a picco sul mare.",
    gradient: "linear-gradient(170deg, #173B45 0%, #2F7A7E 45%, #E3D3A4 100%)",
  },
];

// Restituisce il segno per una data (mese 1-12, giorno 1-31).
export function segnoDa(mese, giorno) {
  const v = mese * 100 + giorno;
  return SEGNI.find((s) => {
    const a = s.dal[0] * 100 + s.dal[1];
    const b = s.al[0] * 100 + s.al[1];
    return a <= b ? v >= a && v <= b : v >= a || v <= b;
  });
}
