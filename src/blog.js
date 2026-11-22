// Gli articoli del blog. Per aggiungerne uno: copia un blocco, cambia id (diventa l'indirizzo
// bevotoscano.com/blog/<id>), titolo, data, immagine (in public/img/) e paragrafi. Il primo articolo dell'elenco è il più recente.
import { SEGNI } from "./games/oroscopoData.js";

export const ARTICOLI = [
  {
    id: "dodici-vitigni-toscani",
    titolo: "Dodici vitigni toscani che (forse) non conosci",
    sottotitolo: "Non c'è solo il Sangiovese: dal Ciliegiolo alla Barsaglina, la Toscana nel bicchiere è molto più larga.",
    data: "2026-11-22",
    tag: "Vitigni",
    immagine: "/img/colline.jpg",
    alt: "Colline toscane coltivate a vigna",
    paragrafi: [
      "Quando si dice vino toscano si pensa al Sangiovese, e ha ragione chi lo fa. Ma intorno al re ci sono vitigni antichi, rari, a volte quasi spariti, che le piccole cantine stanno riportando nel bicchiere. Sono gli stessi dodici del nostro oroscopo del vino.",
      ...SEGNI.map((s) => `${s.vitigno}. ${s.curiosita}`),
      "Il modo migliore per conoscerli è andare a trovarli dove nascono. Sulla mappa degli eventi trovi le serate in cantina, anche raggiungibili senza auto.",
    ],
  },
  {
    id: "il-vino-piu-toscano",
    titolo: "Qual è il vino più toscano che hai?",
    sottotitolo: "Una domanda sola, fatta a cantine, baristi ed enoteche. Le risposte dicono molto più di una scheda tecnica.",
    data: "2026-11-15",
    tag: "Il format",
    immagine: "/og.jpg",
    alt: "Bevotoscano",
    paragrafi: [
      "È la domanda che facciamo a chiunque abbia una bottiglia in mano per lavoro: qual è il vino più toscano che hai? Non il migliore, non il più caro: il più toscano.",
      "Le risposte cambiano a ogni porta. C'è chi tira fuori un Sangiovese in purezza, chi un vitigno che conosce solo il paese, chi un vino che racconta la nonna. Ogni risposta è un pezzo di territorio.",
      "Le interviste sono su Instagram, e ogni cantina che incontriamo finisce sulla mappa di Bevotoscano con la sua risposta.",
    ],
  },
  {
    id: "perche-terricciola",
    titolo: "Perché partiamo da Terricciola",
    sottotitolo: "Una Città del Vino con più di venti aziende agricole e poco più di 4.500 abitanti. Attraversata spesso, vissuta poco.",
    data: "2026-11-08",
    tag: "Chi siamo",
    immagine: "/img/strada-bianca.jpg",
    alt: "Strada bianca tra le vigne",
    paragrafi: [
      "Terricciola sta sulle colline pisane, a metà strada tra il mare e Volterra. È una Città del Vino: più di venti aziende agricole per poco più di 4.500 abitanti.",
      "Eppure è uno di quei posti che si attraversano, o dove si sceglie di dormire, ma che raramente si vivono davvero. Bevotoscano nasce da qui, con una domanda: può il vino diventare la chiave per scoprire una Toscana meno battuta?",
      "Per questo raccogliamo gli eventi delle piccole cantine, li mettiamo su una mappa e cerchiamo il modo di arrivarci anche senza auto. Il valore sta nella rete di persone e aziende, prima che nella piattaforma.",
    ],
  },
];

export const articolo = (id) => ARTICOLI.find((a) => a.id === id);
export const dataArticolo = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
