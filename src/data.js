// Contenuti dell'app. Modifica qui testi, cantine ed esperienze senza toccare il resto del codice.

export const INSTAGRAM_URL = "https://www.instagram.com/bevotoscano/"; // verifica che sia il profilo giusto
export const CONTACT_EMAIL = "info@bevotoscano.com"; // cambia con la mail che usi su Aruba

// Le cantine: per ora solo nome, zona e sito. Aggiungi `vinoPiuToscano` quando hai la loro risposta
// alla domanda del format, e `reel` col link al video su Instagram.
export const CANTINE = [
  { id: "la-regola", nome: "Podere La Regola", comune: "Riparbella", zona: "Costa pisana" },
  { id: "agona", nome: "L'Agona", comune: "Terricciola", zona: "Colline pisane", sito: "https://www.lagonavini.com/" },
  { id: "fibbiano", nome: "Fattoria Fibbiano", comune: "Terricciola", zona: "Colline pisane", sito: "https://www.fattoria-fibbiano.it/" },
  { id: "gimonda", nome: "La Gimonda", comune: "Terricciola", zona: "Colline pisane", sito: "https://www.lagimonda.it/" },
  { id: "castelvecchio", nome: "Tenuta Castelvecchio", comune: "Terricciola", zona: "Colline pisane", sito: "https://agricastelvecchio.com/" },
  { id: "pellicciano", nome: "Podere Pellicciano", comune: "San Miniato", zona: "Valdarno inferiore", sito: "https://www.poderepellicciano.it/" },
  { id: "montefoscoli", nome: "Tenuta di Montefoscoli", comune: "Montefoscoli", zona: "Colline pisane", sito: "https://tenutadimontefoscoli.com" },
  { id: "ghizzano", nome: "Tenuta di Ghizzano", comune: "Ghizzano", zona: "Colline pisane", sito: "https://www.tenutadighizzano.com/" },
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
  { id: "quiz", titolo: "Quanto ne sai di vino toscano?", sottotitolo: "Quiz a tempo · classifica mondiale", emoji: "⏱️", pronto: true },
  { id: "oroscopo", titolo: "L'oroscopo del vino", sottotitolo: "12 segni, 12 vitigni toscani", emoji: "♌", pronto: true },
];
