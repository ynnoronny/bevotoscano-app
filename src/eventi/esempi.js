// Eventi DI ESEMPIO, inventati, per provare l'app finché non c'è il database.
// Le date si spostano da sole in avanti, così non scadono mai. Spariscono appena colleghi Supabase.
const tra = (giorni, ora) => {
  const d = new Date();
  d.setDate(d.getDate() + giorni);
  const [h, m] = ora.split(":");
  d.setHours(+h, +m, 0, 0);
  return d.toISOString();
};

export const PICKUP_ESEMPIO = [
  { id: 1, nome: "Firenze, piazzale Montelungo (Fortezza)", comune: "Firenze", lat: 43.7798, lng: 11.2486 },
  { id: 2, nome: "Firenze, stazione Rifredi", comune: "Firenze", lat: 43.7969, lng: 11.2378 },
  { id: 3, nome: "Siena, stazione FS", comune: "Siena", lat: 43.3311, lng: 11.3196 },
  { id: 4, nome: "Pisa, stazione Centrale", comune: "Pisa", lat: 43.7085, lng: 10.3986 },
  { id: 5, nome: "Lucca, piazzale Verdi", comune: "Lucca", lat: 43.8434, lng: 10.4964 },
];
const P = Object.fromEntries(PICKUP_ESEMPIO.map((p) => [p.id, p]));
const pk = (id, orario) => ({ nome: P[id].nome, lat: P[id].lat, lng: P[id].lng, orario });

const base = { stato: "pubblicato", criteri_ok: true, fonte: "admin", esempio: true };

export const EVENTI_ESEMPIO = [
  {
    ...base, id: 101, titolo: "Bus del Chianti: tre cantine in un giorno",
    descrizione: "Giornata in bus tra tre piccole cantine del Chianti Classico. In ogni tappa è il produttore a raccontare il suo Sangiovese, con pranzo in fattoria.",
    inizio: tra(6, "09:00"), fine: tra(6, "18:30"), luogo_nome: "Fattoria Esempio", comune: "Greve in Chianti",
    lat: 43.5843, lng: 11.3157, vini: "Chianti Classico, Vin Santo", guidato: true, accesso: ["bus"],
    pickup: [pk(1, "09:00"), pk(2, "09:20")], prezzo: "da 85 €", link: "", org_tipo: "bus", org_nome: "Bus Tour Esempio",
  },
  {
    ...base, id: 102, titolo: "Novello e castagne in cantina",
    descrizione: "Serata in cantina con il vignaiolo: assaggio del vino nuovo dalla botte, caldarroste e racconto della vendemmia appena finita.",
    inizio: tra(3, "19:00"), luogo_nome: "Podere Esempio", comune: "Terricciola",
    lat: 43.5254, lng: 10.6789, vini: "Toscana IGT rosso novello", guidato: false, accesso: ["auto", "bus"],
    pickup: [pk(4, "18:15")], prezzo: "25 €", org_tipo: "cantina", org_nome: "Podere Esempio",
  },
  {
    ...base, id: 103, titolo: "Brunello verticale con il produttore",
    descrizione: "Degustazione guidata di cinque annate in enoteca, con il produttore presente. Posti limitati.",
    inizio: tra(10, "18:30"), luogo_nome: "Enoteca Esempio", comune: "Siena",
    lat: 43.3186, lng: 11.3318, vini: "Brunello di Montalcino", guidato: true, accesso: ["treno", "piedi"],
    pickup: [], prezzo: "40 €", org_tipo: "enoteca", org_nome: "Enoteca Esempio",
  },
  {
    ...base, id: 104, titolo: "Camminata tra i filari e merenda del vignaiolo",
    descrizione: "Passeggiata di 5 km tra le vigne delle colline lucchesi, con soste di assaggio e merenda finale in cantina.",
    inizio: tra(13, "10:00"), fine: tra(13, "14:00"), luogo_nome: "Tenuta Esempio", comune: "Capannori",
    lat: 43.8411, lng: 10.5718, vini: "Colline Lucchesi DOC", guidato: true, accesso: ["auto", "bus"],
    pickup: [pk(5, "09:30")], prezzo: "30 €", org_tipo: "cantina", org_nome: "Tenuta Esempio",
  },
  {
    ...base, id: 105, titolo: "Cena tra le botti in Maremma",
    descrizione: "Cena a quattro mani tra la cucina della cantina e un'osteria del paese, con i vini raccontati da chi li fa.",
    inizio: tra(17, "20:00"), luogo_nome: "Cantina Esempio", comune: "Scansano",
    lat: 42.6875, lng: 11.3317, vini: "Morellino di Scansano", guidato: false, accesso: ["auto"],
    pickup: [], prezzo: "55 €", org_tipo: "cantina", org_nome: "Cantina Esempio",
  },
];
