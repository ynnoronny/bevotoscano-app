// Contenuti dell'app. Modifica qui testi, cantine ed esperienze senza toccare il resto del codice.

export const INSTAGRAM_URL = "https://www.instagram.com/bevotoscano/"; // verifica che sia il profilo giusto
// Il sito di chi ha fatto l'app (il "made by ryb" in fondo alle pagine). Vuoto = scritta senza link.
export const RYB_URL = "https://ry-b.it";
export const CONTACT_EMAIL = "info@bevotoscano.com"; // cambia con la mail che usi su Aruba

// Le cantine: per ora solo nome, zona e sito. Aggiungi `vinoPiuToscano` quando hai la loro risposta
// alla domanda del format, e `reel` col link al video su Instagram.
// Le cantine. Campi facoltativi:
//   foto: "/img/cantine/<id>.jpg" (metti il file in public/img/cantine/)
//   intervistata: true quando l'intervista è uscita (reel: link al post Instagram)
//   premi: ["Miglior rosso 2026 (Guida X)", …] dal più importante; in elenco si vedono i primi 3
//   fonte: dove abbiamo letto i fatti della descrizione (resta interna, non si mostra).
//   descrizione: una o due frasi su cosa la rende speciale (es. "Cantina di famiglia sulle colline di Terricciola, vigne a pochi passi dalla casa").
//                Va sulla scheda in elenco, nella cantina del giorno e nella pagina della cantina.
//   vinoPiuToscano: la risposta alla nostra domanda (solo nella pagina della cantina)
export const CANTINE = [
  { id: "la-regola", nome: "Podere La Regola", comune: "Riparbella", provincia: "Pisa", zona: "Costa pisana", descrizione: "Famiglia Nuti da cinque generazioni: 26 ettari tutti biologici dal 2015, Cabernet Franc in purezza e una barricaia affrescata.", fonte: "https://www.gazzettadelgusto.it/vino/vini-podere-la-regola-leccellenza-del-terroir-di-riparbella/" },
  { id: "agona", nome: "L'Agona", comune: "Terricciola", provincia: "Pisa", zona: "Colline pisane", sito: "https://www.lagonavini.com/", descrizione: "Piccola cantina di famiglia: 3 ettari di vigna e circa 25.000 bottiglie l'anno, con visite e degustazioni in cantina.", fonte: "https://www.lagonavini.com/ · https://www.winetourism.com/it/azienda-vinicola/l-agona-vini/" },
  { id: "fibbiano", nome: "Fattoria Fibbiano", comune: "Terricciola", provincia: "Pisa", zona: "Colline pisane", sito: "https://www.fattoria-fibbiano.it/", descrizione: "Tenuta che risale al 1707, della famiglia Cantoni dal 1997: agriturismo, visite in vigna e in cantina.", fonte: "https://www.winedering.com/it/winery-fattoria-fibbiano_d4438 · https://www.fattoria-fibbiano.it/" },
  { id: "gimonda", nome: "La Gimonda", comune: "Terricciola", provincia: "Pisa", zona: "Colline pisane", sito: "https://www.lagimonda.it/", descrizione: "Piccolo vigneto di circa 4 ettari con i vitigni di casa: Sangiovese, Canaiolo, Colorino, Trebbiano e Colombana.", fonte: "https://www.enprimeurclub.com/wineries/vigneto-la-gimonda-terricciola" },
  { id: "castelvecchio", nome: "Tenuta Castelvecchio", comune: "Terricciola", provincia: "Pisa", zona: "Colline pisane", sito: "https://agricastelvecchio.com/", descrizione: "Biologica certificata, con agriturismo e cene tra i filari. Il suo Vin Santo Armida è tra i 300 vini scelti da Vini Buoni d'Italia.", fonte: "https://agricastelvecchio.com/" },
  { id: "pellicciano", nome: "Podere Pellicciano", comune: "San Miniato", provincia: "Pisa", zona: "Valdarno inferiore", sito: "https://www.poderepellicciano.it/", foto: "https://poderepellicciano.it/wp-content/uploads/2023/07/Podere-Pellicciano-winery-scaled.jpg", descrizione: "Podere storico, citato già nel 1830, rinato nel 2003 con la famiglia Caputo: 10 ettari biologici e Malvasia Nera e Colorino in purezza.", fonte: "https://www.poderepellicciano.it/" },
  { id: "montefoscoli", nome: "Tenuta di Montefoscoli", comune: "Montefoscoli", provincia: "Pisa", zona: "Colline pisane", sito: "https://tenutadimontefoscoli.com", foto: "https://www.tenutadimontefoscoli.com/wp-content/uploads/2026/02/Tenuta-di-Montefoscoli_Home.jpg", descrizione: "Biologica certificata: Sangiovese e Vermentino su 8 parcelle, alcune vigne dal 1400 con lo stesso nome da oltre 600 anni.", fonte: "https://www.tenutadimontefoscoli.com/" },
  { id: "ghizzano", nome: "Tenuta di Ghizzano", comune: "Ghizzano", provincia: "Pisa", zona: "Colline pisane", sito: "https://www.tenutadighizzano.com/", descrizione: "Biologica e biodinamica, nel borgo della famiglia Venerosi Pesciolini: 20 ettari di vigna intorno alla villa con la torre del 1370.", fonte: "https://www.tenutadighizzano.com/it/chi-siamo/la-nostra-storia/" },
];

// Le esperienze: format Bevotoscano. Stato "presto" = raccogli interesse, "aperto" = prenotabile.
export const ESPERIENZE = [
  {
    id: "cantina-diffusa",
    titolo: "Cantina Diffusa",
    sottotitolo: "Serate con 1-2 produttori in agriturismi, piazze e ristoranti",
    emoji: "🌙",
    stato: "presto",
    testo: "Il produttore esce dalla cantina e viene a raccontarti il suo vino in un posto che non ti aspetti. Poche persone, un racconto vero, il bicchiere in mano.",
  },
  {
    id: "visita",
    titolo: "In cantina, da vicino",
    sottotitolo: "Visita e degustazione con chi il vino lo fa",
    emoji: "🍇",
    stato: "presto",
    testo: "Niente tour standard: vigna, cantina e assaggio con il produttore. Ti mettiamo in contatto noi con le piccole realtà che non trovi prenotabili online.",
  },
  {
    id: "vino-piu-toscano",
    titolo: "Il vino più toscano",
    sottotitolo: "Il nostro format: una domanda, tante risposte",
    emoji: "🎤",
    stato: "social",
    testo: "Lo chiediamo a cantine, baristi ed enoteche: qual è il vino più toscano che hai? Le risposte sono sul nostro Instagram.",
  },
];

export const CASSA = {
  titolo: "La Cassa Bevotoscano",
  testo: "Una cassa di vini scelti da piccole cantine toscane, spedizione inclusa. Ogni bottiglia con la sua storia, direttamente da chi l'ha fatta.",
  punti: ["Solo piccole cantine selezionate", "Prezzo unico, spedizione inclusa", "La storia di ogni vino dentro la cassa"],
};

// I minigiochi. Per aggiungerne uno: crea il componente in src/games e aggiungilo qui.
export const GIOCHI = [
  { id: "quiz", titolo: "Quanto ne sai di vino toscano?", sottotitolo: "Domande infinite e una riga di spiegazione dopo ogni risposta", emoji: "🍷", pronto: true },
  { id: "oroscopo", titolo: "L'oroscopo del vino", sottotitolo: "Il tuo segno del mese, con l'affine e l'antagonista", emoji: "♌", pronto: true },
  { id: "classifica", titolo: "Classifica", sottotitolo: "Quante risposte giuste prima di cadere", emoji: "🏆", pronto: true },
];
