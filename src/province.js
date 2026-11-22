// Comuni toscani per provincia (fonte: elenco ISTAT dei comuni). Serve a mostrare "Montalcino (SI)".
// Per un evento fuori Toscana o in una frazione la provincia semplicemente non compare.
const PROVINCE = {
  AR: "Anghiari|Arezzo|Badia Tedalda|Bibbiena|Bucine|Capolona|Caprese Michelangelo|Castel Focognano|Castel San Niccolò|Castelfranco Piandiscò|Castiglion Fibocchi|Castiglion Fiorentino|Cavriglia|Chitignano|Chiusi della Verna|Civitella in Val di Chiana|Cortona|Foiano della Chiana|Laterina Pergine Valdarno|Loro Ciuffenna|Lucignano|Marciano della Chiana|Monte San Savino|Montemignaio|Monterchi|Montevarchi|Ortignano Raggiolo|Pieve Santo Stefano|Poppi|Pratovecchio Stia|San Giovanni Valdarno|Sansepolcro|Sestino|Subbiano|Talla|Terranuova Bracciolini",
  FI: "Bagno a Ripoli|Barberino Tavarnelle|Barberino di Mugello|Borgo San Lorenzo|Calenzano|Campi Bisenzio|Capraia e Limite|Castelfiorentino|Cerreto Guidi|Certaldo|Dicomano|Empoli|Fiesole|Figline e Incisa Valdarno|Firenze|Firenzuola|Fucecchio|Gambassi Terme|Greve in Chianti|Impruneta|Lastra a Signa|Londa|Marradi|Montaione|Montelupo Fiorentino|Montespertoli|Palazzuolo sul Senio|Pelago|Pontassieve|Reggello|Rignano sull'Arno|Rufina|San Casciano in Val di Pesa|San Godenzo|Scandicci|Scarperia e San Piero|Sesto Fiorentino|Signa|Vaglia|Vicchio|Vinci",
  GR: "Arcidosso|Campagnatico|Capalbio|Castel del Piano|Castell'Azzara|Castiglione della Pescaia|Cinigiano|Civitella Paganico|Follonica|Gavorrano|Grosseto|Isola del Giglio|Magliano in Toscana|Manciano|Massa Marittima|Monte Argentario|Monterotondo Marittimo|Montieri|Orbetello|Pitigliano|Roccalbegna|Roccastrada|Santa Fiora|Scansano|Scarlino|Seggiano|Semproniano|Sorano",
  LI: "Bibbona|Campiglia Marittima|Campo nell'Elba|Capoliveri|Capraia Isola|Castagneto Carducci|Cecina|Collesalvetti|Livorno|Marciana|Marciana Marina|Piombino|Porto Azzurro|Portoferraio|Rio|Rosignano Marittimo|San Vincenzo|Sassetta|Suvereto",
  LU: "Altopascio|Bagni di Lucca|Barga|Borgo a Mozzano|Camaiore|Camporgiano|Capannori|Careggine|Castelnuovo di Garfagnana|Castiglione di Garfagnana|Coreglia Antelminelli|Fabbriche di Vergemoli|Forte dei Marmi|Fosciandora|Gallicano|Lucca|Massarosa|Minucciano|Molazzana|Montecarlo|Pescaglia|Piazza al Serchio|Pietrasanta|Pieve Fosciana|Porcari|San Romano in Garfagnana|Seravezza|Sillano Giuncugnano|Stazzema|Vagli Sotto|Viareggio|Villa Basilica|Villa Collemandina",
  MS: "Aulla|Bagnone|Carrara|Casola in Lunigiana|Comano|Filattiera|Fivizzano|Fosdinovo|Licciana Nardi|Massa|Montignoso|Mulazzo|Podenzana|Pontremoli|Tresana|Villafranca in Lunigiana|Zeri",
  PI: "Bientina|Buti|Calci|Calcinaia|Capannoli|Casale Marittimo|Casciana Terme Lari|Cascina|Castelfranco di Sotto|Castellina Marittima|Castelnuovo di Val di Cecina|Chianni|Crespina Lorenzana|Fauglia|Guardistallo|Lajatico|Montecatini Val di Cecina|Montescudaio|Monteverdi Marittimo|Montopoli in Val d'Arno|Orciano Pisano|Palaia|Peccioli|Pisa|Pomarance|Ponsacco|Pontedera|Riparbella|San Giuliano Terme|San Miniato|Santa Croce sull'Arno|Santa Luce|Santa Maria a Monte|Terricciola|Vecchiano|Vicopisano|Volterra",
  PO: "Cantagallo|Carmignano|Montemurlo|Poggio a Caiano|Prato|Vaiano|Vernio",
  PT: "Abetone Cutigliano|Agliana|Buggiano|Chiesina Uzzanese|Lamporecchio|Larciano|Marliana|Massa e Cozzile|Monsummano Terme|Montale|Montecatini-Terme|Pescia|Pieve a Nievole|Pistoia|Ponte Buggianese|Quarrata|Sambuca Pistoiese|San Marcello Piteglio|Serravalle Pistoiese|Uzzano",
  SI: "Abbadia San Salvatore|Asciano|Buonconvento|Casole d'Elsa|Castellina in Chianti|Castelnuovo Berardenga|Castiglione d'Orcia|Cetona|Chianciano Terme|Chiusdino|Chiusi|Colle di Val d'Elsa|Gaiole in Chianti|Montalcino|Montepulciano|Monteriggioni|Monteroni d'Arbia|Monticiano|Murlo|Piancastagnaio|Pienza|Poggibonsi|Radda in Chianti|Radicofani|Radicondoli|Rapolano Terme|San Casciano dei Bagni|San Gimignano|San Quirico d'Orcia|Sarteano|Siena|Sinalunga|Sovicille|Torrita di Siena|Trequanda",
};

const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const MAPPA = {};
for (const [sigla, nomi] of Object.entries(PROVINCE)) for (const n of nomi.split("|")) MAPPA[norm(n)] = sigla;
// Qualche frazione dove capitano spesso eventi e cantine.
Object.assign(MAPPA, { montefoscoli: "PI", ghizzano: "PI", bolgheri: "LI", "sangimignano": "SI", "castelnuovoberardenga": "SI" });

export const siglaProvincia = (comune) => MAPPA[norm(comune)] || null;
export const conProvincia = (comune) => { const s = siglaProvincia(comune); return s ? `${comune} (${s})` : comune || ""; };
