// Domande del quiz a tempo. La PRIMA risposta di ogni domanda è quella giusta:
// l'ordine viene mescolato in automatico durante il gioco.
// livello: 1 facile, 2 medio, 3 difficile. Aggiungine quante vuoi.

export const DOMANDE = [
  { d: "Qual è il vitigno principale del Chianti Classico?", r: ["Sangiovese", "Merlot", "Montepulciano", "Nebbiolo"], livello: 1 },
  { d: "Qual è il simbolo del Chianti Classico?", r: ["Il Gallo Nero", "Il Leone d'oro", "La Torre", "Il Giglio"], livello: 1 },
  { d: "In quale comune si produce il Brunello?", r: ["Montalcino", "Montepulciano", "Greve in Chianti", "Scansano"], livello: 1 },
  { d: "Il Vino Nobile prende il nome da quale città?", r: ["Montepulciano", "Montalcino", "Siena", "Cortona"], livello: 1 },
  { d: "Con cosa si accompagna tradizionalmente il Vin Santo?", r: ["Cantucci", "Castagnaccio", "Pici", "Panforte salato"], livello: 1 },
  { d: "Di cosa era rivestito il classico fiasco toscano?", r: ["Paglia", "Sughero", "Cuoio", "Rame"], livello: 1 },
  { d: "Bolgheri si trova in provincia di…", r: ["Livorno", "Pisa", "Grosseto", "Lucca"], livello: 1 },
  { d: "Il Morellino di Scansano è un vino della provincia di…", r: ["Grosseto", "Siena", "Arezzo", "Livorno"], livello: 1 },
  { d: "Il Brunello di Montalcino è fatto con…", r: ["100% Sangiovese", "Sangiovese e Merlot", "Cabernet e Sangiovese", "Canaiolo e Colorino"], livello: 2 },
  { d: "Qual è il \"fratello minore\" del Brunello?", r: ["Rosso di Montalcino", "Rosso di Montepulciano", "Chianti Colli Senesi", "Morellino"], livello: 2 },
  { d: "Come si chiama il Sangiovese a Montepulciano?", r: ["Prugnolo Gentile", "Morellino", "Brunello", "Sangioveto Grosso"], livello: 2 },
  { d: "Qual è l'uva principale del Sassicaia?", r: ["Cabernet Sauvignon", "Sangiovese", "Merlot", "Syrah"], livello: 2 },
  { d: "Su quale isola si coltiva l'Ansonica?", r: ["Isola del Giglio", "Capraia", "Gorgona", "Pianosa"], livello: 2 },
  { d: "Qual è il bianco più tipico della costa toscana?", r: ["Vermentino", "Pinot Grigio", "Verdicchio", "Falanghina"], livello: 2 },
  { d: "Il Tignanello, uno dei primi Supertuscan, è della famiglia…", r: ["Antinori", "Frescobaldi", "Ricasoli", "Mazzei"], livello: 2 },
  { d: "Il Vin Santo \"Occhio di Pernice\" è fatto soprattutto con…", r: ["Sangiovese", "Trebbiano", "Malvasia", "Vermentino"], livello: 2 },
  { d: "\"Colline Pisane\" è una sottozona di quale denominazione?", r: ["Chianti", "Bolgheri", "Montecucco", "Carmignano"], livello: 2 },
  { d: "Su quale isola nasce l'Aleatico Passito DOCG?", r: ["Elba", "Giglio", "Capraia", "Montecristo"], livello: 2 },
  { d: "Il Colorino deve il suo nome…", r: ["Al colore scurissimo degli acini", "A un paese del Chianti", "Al nome di un frate", "Al colore delle foglie in autunno"], livello: 2 },
  { d: "La Vernaccia di San Gimignano fu la prima DOC italiana. In che anno?", r: ["1966", "1924", "1980", "1716"], livello: 3 },
  { d: "Chi delimitò per primo per legge la zona del Chianti, nel 1716?", r: ["Cosimo III de' Medici", "Lorenzo il Magnifico", "Bettino Ricasoli", "Leopoldo II"], livello: 3 },
  { d: "Cos'è il \"governo all'uso toscano\"?", r: ["Rifermentare il vino con uve appassite", "Una legge medicea sul vino", "La potatura a cordone", "L'invecchiamento in botte grande"], livello: 3 },
  { d: "Quale vitigno internazionale è tradizionalmente ammesso nel Carmignano?", r: ["Cabernet", "Pinot Nero", "Syrah", "Chardonnay"], livello: 3 },
  { d: "Quante sono le DOCG della Toscana?", r: ["11", "5", "8", "15"], livello: 3 },
  { d: "Il Mammolo prende il nome dal profumo di…", r: ["Viola", "Rosa", "Ciliegia", "Mandorla"], livello: 3 },
  { d: "Chi mise a punto la \"formula\" storica del Chianti nell'Ottocento?", r: ["Bettino Ricasoli", "Cosimo III", "Giuseppe Garibaldi", "Pellegrino Artusi"], livello: 3 },
  { d: "In Francia il Trebbiano Toscano si chiama Ugni Blanc ed è la base di…", r: ["Cognac", "Champagne", "Calvados", "Chablis"], livello: 3 },
  { d: "Dove si trova la DOCG Montecucco Sangiovese?", r: ["Provincia di Grosseto", "Provincia di Pisa", "Provincia di Arezzo", "Provincia di Prato"], livello: 3 },
];

export const DOMANDE_PER_PARTITA = 10;
export const SECONDI_PER_DOMANDA = 15;
