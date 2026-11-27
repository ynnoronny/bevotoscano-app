import { useEffect, useMemo, useRef, useState } from "react";
import { INSTAGRAM_URL, RYB_URL } from "../data.js";
import { eventiPubblici, notiziePubbliche } from "../eventi/api.js";
import { Dettagli } from "../eventi/AdminScanner.jsx";
import { senzaAuto, prezzoEv, conNavetta } from "../eventi/shared.js";
import Eventi from "../eventi/Eventi.jsx";
import Mappa from "../eventi/Mappa.jsx";
import { km, fmtKm, posizioneAttuale, CITTA } from "../eventi/geo.js";
import Cantine, { dove, fotoDi, useLuoghi, Foto } from "./Cantine.jsx";
import { trovaCantina } from "../fasce.js";
import SegnalaScelta from "./SegnalaScelta.jsx";
import { ARTICOLI, articolo, dataArticolo } from "../blog.js";
import { DOMANDE } from "../games/quizData.js";
import { SEGNI, segnoDa } from "../games/oroscopoData.js";
import MESE from "../games/oroscopoMese.json";
import { Classifica } from "../games/Classifiche.jsx";
import { DAL_GIORNO } from "../games/QuizToscana.jsx";
import { CANTINE } from "../data.js";
import { TEMI_BLOG, temaDi } from "../blog.js";
import Link from "../Link.jsx";
import Benvenuto, { segnoMio } from "./Benvenuto.jsx";
import AggiungiCalendario, { Indicazioni } from "../eventi/Calendario.jsx";
import CondividiEvento from "../eventi/Condividi.jsx";
import { conProvincia, provinciaDi } from "../province.js";
import { Filtri, Riga, Scelta, Interruttore, SceltaProvincia } from "./Filtri.jsx";
import { contaZone } from "../mappaFerma.js";
import { fotoDiRiserva } from "../repertorio.js";
import { zonaDi } from "../zone.js";
import { go, ritorno, paginaPrima, useStatoPagina } from "../nav.js";
import Cuore from "../Cuore.jsx";
import { usePreferiti, copiaEvento, copiaArticolo, perTipo, TIPI_PREFERITI } from "../preferiti.js";
import { eventoPercorso, FILTRI_EVENTI, cantinaPercorso } from "../seo.js";

// La schermata unica di Bevotoscano: una cornice fissa, uguale su telefono e computer.
// In alto il marchio e le pills (scorrono col dito), sotto scorre solo il contenuto
// della pill scelta: eventi, cantine, articoli del blog, classifica del gioco.

export const PILLS = [
  { id: "home", label: "Home", to: "home" },
  { id: "eventi", label: "Eventi", to: "eventi" },
  { id: "cantine", label: "Vino", to: "cantine" }, // si chiama "Vino"; l'indirizzo resta /cantine per Google
  { id: "blog", label: "Blog", to: "blog" },
  { id: "gioca", label: "Giochi", to: "gioca" },
];

// La Home ha la sua pill (prima ci si tornava solo toccando il logo, e non si capiva).
// Da una pagina interna (un evento, una cantina, un articolo…) la freccia riporta all'elenco.
function indietroDa(section, sub) {
  if (section === "eventi" && sub && !FILTRI_EVENTI.includes(sub)) return ["eventi", "Eventi"];
  if (section === "cantine" && sub) return ["cantine", "Vino"];
  if (section === "blog" && sub) return ["blog", "Blog"];
  if (["segnala", "esperienze", "cassa", "preferiti"].includes(section)) return ["home", "Home"];
  return null;
}

const POSIZIONI = new Map(); // percorso → quanto era scorsa la pagina

export default function Shell({ section, sub, children }) {
  // le enoteche stanno sotto la stessa pill delle cantine (con la scelta in cima alla pagina)
  const pill = section === "enoteche" ? "cantine" : section;
  const area = useRef(null);
  const indietro = indietroDa(section, sub);
  // A ogni pagina nuova si parte dall'alto; tornando indietro (freccia o tasto del telefono)
  // si ritrova il punto dove eri, anche se l'elenco ci mette un attimo ad arrivare.
  const percorso = [section, sub].filter(Boolean).join("/");
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const dove = ritorno ? POSIZIONI.get(percorso) || 0 : 0;
    let prove = 0, t;
    const metti = () => {
      el.scrollTo({ top: dove, behavior: "instant" });
      if (Math.abs(el.scrollTop - dove) > 4 && prove++ < 20) t = setTimeout(metti, 100);
    };
    metti();
    const salva = () => POSIZIONI.set(percorso, el.scrollTop);
    el.addEventListener("scroll", salva, { passive: true });
    return () => { clearTimeout(t); el.removeEventListener("scroll", salva); };
  }, [percorso]);

  return (
    <Benvenuto>
      <div className="shell">
        <header className="shell-testa">
          <div className="shell-riga">
            {indietro && (
              <Link to={indietro[0]} className="shell-indietro" aria-label={`Torna a ${indietro[1]}`}
                onClick={(x) => {
                  // se si arriva proprio da lì, è un vero "indietro": filtri e punto della pagina restano
                  const prima = paginaPrima();
                  if (prima && prima.split("/")[0] === indietro[0]) { x.preventDefault(); window.history.back(); }
                }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
              </Link>
            )}
            <Link to="home" className="shell-marchio" aria-label="Bevotoscano, torna all'inizio"><span className="shell-logo">Bevotoscano</span><em>Il vino da vivere</em></Link>
            <Link to="segnala" className="shell-segnala">+ Segnala</Link>
          </div>
          <nav className="shell-pills" aria-label="Sezioni">
            {PILLS.map((p) => (
              <Link key={p.id} to={p.to} className={`shell-pill ${pill === p.id ? "on" : ""}`} aria-current={pill === p.id ? "page" : undefined}>{p.label}</Link>
            ))}
          </nav>
        </header>
        <main className="shell-area" ref={area}>
          <div className="shell-dentro fade" key={`${section}/${sub || ""}`}>{children || <Contenuto section={section} sub={sub} />}</div>
        </main>
      </div>
    </Benvenuto>
  );
}

function Contenuto({ section, sub }) {
  if (section === "cantine") return <div className="shell-pagina shell-pagina--larga"><Cantine apri={sub} /></div>;
  if (section === "enoteche") return <div className="shell-pagina shell-pagina--larga"><Cantine enoteche /></div>;
  if (section === "blog") return sub ? <Articolo id={sub} /> : <Blog />;
  if (section === "gioca") return <Gioca />;
  if (section === "preferiti") return <PaginaPreferiti tipo={sub} />;
  if (section === "segnala") return <div className="page shell-pagina"><SegnalaScelta iniziale={sub} /></div>;
  if (section === "eventi" && sub && !FILTRI_EVENTI.includes(sub)) {
    return <div className="page shell-pagina"><Eventi apri={sub} /></div>;
  }
  if (section === "eventi") return <FeedEventi filtro={sub} />;
  return <Home />;
}

// ---------- Eventi ----------

const POS_KEY = "bevotoscano-posizione";
const leggi = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const scrivi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* niente */ } };
const g = (iso) => new Date(iso);
const stessoGiorno = (a, b) => a.toDateString() === b.toDateString();
const MESI_L = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const GIORNI_L = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const hm = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
// Date scritte per intero: "sabato 5 dicembre · 9:30–18:30", "19–23 novembre · dalle 10:00"
function quandoEv(e) {
  const a = g(e.inizio), b = e.fine ? g(e.fine) : null;
  if (inCorso(e) && b && !stessoGiorno(a, b)) return `In corso · fino al ${b.getDate()} ${MESI_L[b.getMonth()]}`;
  const ora = e.orario_trovato !== false;
  if (!b || stessoGiorno(a, b)) return `${GIORNI_L[a.getDay()]} ${a.getDate()} ${MESI_L[a.getMonth()]}${ora ? ` · ${hm(a)}${b ? `–${hm(b)}` : ""}` : ""}`;
  const giorni = a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MESI_L[b.getMonth()]}`
    : `${a.getDate()} ${MESI_L[a.getMonth()]} – ${b.getDate()} ${MESI_L[b.getMonth()]}`;
  return ora ? `${giorni} · dalle ${hm(a)}` : giorni;
}
// Il giorno grande su una riga, l'orario sotto più piccolo: si legge al volo.
function QuandoEv({ e }) {
  const [giorno, ...ora] = quandoEv(e).split(" · ");
  return <>{giorno.charAt(0).toUpperCase() + giorno.slice(1)}{ora.length > 0 && <small className="ev-ora">{ora.join(" · ")}</small>}</>;
}
const inCorso = (e) => g(e.inizio) <= new Date() && (!e.fine || g(e.fine) >= new Date());
function comeArrivi(e, centro) {
  const pk = [...(e.pickup || [])].map((p) => ({ ...p, d: km(centro, p) })).sort((a, b) => (a.d ?? 0) - (b.d ?? 0))[0];
  if (pk) return `${pk.nome.split(",")[0]}${pk.orario ? ` ${pk.orario}` : ""}`;
  if ((e.accesso || []).includes("treno")) return "Coi mezzi";
  if ((e.accesso || []).includes("piedi")) return "A piedi";
  return "";
}
const QUANDO = [["tutte", "Tutte le date"], ["oggi", "Oggi"], ["weekend", "Questo weekend"], ["7", "Prossimi 7 giorni"], ["30", "Prossimi 30 giorni"]];
// Un evento è "nel periodo" se si svolge anche solo in parte in quei giorni (vale anche per quelli in corso).
function nelQuando(e, q) {
  if (q === "tutte") return true;
  const ini = g(e.inizio), fin = e.fine ? g(e.fine) : new Date(ini.getTime() + 3 * 3600000);
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
  let da = new Date(oggi), a = new Date(oggi);
  if (q === "oggi") a.setDate(a.getDate() + 1);
  else if (q === "weekend") {
    const dow = oggi.getDay(); // 0 dom … 6 sab
    if (dow === 0) { da.setDate(da.getDate() - 2); a.setDate(a.getDate() + 1); }
    else if (dow === 6) { da.setDate(da.getDate() - 1); a.setDate(a.getDate() + 2); }
    else { da.setDate(da.getDate() + (5 - dow)); a = new Date(da); a.setDate(a.getDate() + 3); }
  } else a.setDate(a.getDate() + +q);
  return ini < a && fin >= da;
}

function FeedEventi({ filtro }) {
  const [eventi, setEventi] = useState(null);
  const [centro, setCentro] = useState(() => leggi(POS_KEY, null));
  // i filtri restano tornando da un evento (finché la scheda del browser è aperta)
  const [quando, setQuando] = useStatoPagina("eventi-quando", "tutte");
  const [noAuto, setNoAuto] = useStatoPagina("eventi-navetta", false);
  const [mappa, setMappa] = useStatoPagina("eventi-mappa", false);
  const [attivo, setAttivo] = useState(null);
  // con la mappa aperta, la zona toccata fa da filtro per la lista qui sotto
  const [zona, setZona] = useStatoPagina("eventi-zona", null);
  const [provincia, setProvincia] = useStatoPagina("eventi-provincia", "");
  useEffect(() => { setAttivo(null); }, [quando, noAuto, centro, zona, provincia]);
  const quantiSenzaAuto = (eventi || []).filter((e) => conNavetta(e) && nelQuando(e, quando)).length;
  useEffect(() => { eventiPubblici().then(setEventi).catch(() => setEventi([])); }, []);
  useEffect(() => { scrivi(POS_KEY, centro); }, [centro]);
  useEffect(() => {
    if (filtro === "weekend") setQuando("weekend");
    if (filtro === "senza-auto") setNoAuto(true);
    if (filtro === "vicino" && !centro) posizioneAttuale().then(setCentro).catch(() => {});
  }, [filtro]);

  // gli eventi del periodo, prima della provincia: servono a contare quanti ce ne sono in ognuna
  const delPeriodo = useMemo(() => (eventi || []).filter((e) => (!noAuto || conNavetta(e)) && nelQuando(e, quando)), [eventi, quando, noAuto]);
  const perProvincia = useMemo(() => delPeriodo.reduce((o, e) => { const p = provinciaDi(e.comune); if (p) o[p] = (o[p] || 0) + 1; return o; }, {}), [delPeriodo]);
  const lista = useMemo(() => delPeriodo
    .filter((e) => !provincia || provinciaDi(e.comune) === provincia)
    .map((e) => ({ ...e, d: km(centro, e), zona: e.lat != null ? zonaDi([e.lat, e.lng]) : null }))
    .sort((a, b) => (centro && a.d != null && b.d != null ? a.d - b.d : a.inizio.localeCompare(b.inizio))),
  [delPeriodo, provincia, centro]);
  const conta = useMemo(() => contaZone(lista), [lista]);
  const mostrati = mappa && zona ? lista.filter((e) => e.zona === zona) : lista;

  return (
    <div className="feed">
      <Filtri>
        <Riga etichetta="Quando"><Scelta opzioni={QUANDO} valore={quando} onCambia={setQuando} /></Riga>
        <Riga etichetta="Dove">
          <Partenza centro={centro} setCentro={setCentro} />
          <SceltaProvincia valore={provincia} conta={perProvincia} onCambia={(v) => { setProvincia(v); setZona(null); }} />
          <Interruttore on={noAuto} onCambia={setNoAuto}>🚐 Con navetta ({quantiSenzaAuto})</Interruttore>
        </Riga>
      </Filtri>
      <div className="feed-vista">
        <span>{eventi ? (lista.length === 1 ? "1 evento" : `${lista.length} eventi`) : ""}</span>
        <Scelta opzioni={[["lista", "Lista"], ["mappa", "Mappa"]]} valore={mappa ? "mappa" : "lista"} onCambia={(v) => { setMappa(v === "mappa"); setZona(null); setAttivo(null); }} />
      </div>
      {/* la mappa è ferma (il dito fa scorrere la pagina) e fa da filtro: tocchi una zona e sotto restano i suoi eventi */}
      {mappa && eventi && (
        <>
          <div className="feed-mappa"><Mappa eventi={mostrati} conta={conta} centro={centro} attivo={attivo} zona={zona} provincia={provincia} onZona={setZona} onApri={(e) => {
            setAttivo(e.id);
            document.getElementById(`evento-${e.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }} /></div>
          <div className="cant-conta">
            <strong>{mostrati.length === 1 ? "1 evento" : `${mostrati.length} eventi`}{zona ? ` · ${zona}` : provincia ? ` · provincia di ${provincia}` : " in Toscana"}</strong>
            {zona || provincia ? <button className="link" onClick={() => { setZona(null); setProvincia(""); }}>Tutta la Toscana</button> : <small>Tocca la mappa per spostarla, una zona per filtrare</small>}
          </div>
          {zona && !mostrati.length && lista.length > 0 && <p className="feed-vuoto">Nessun evento in zona {zona} in questo periodo. Tocca un'altra zona, o torna a tutta la Toscana.</p>}
        </>
      )}
      {!eventi && <p className="feed-vuoto">Carico gli eventi…</p>}
      {eventi && lista.length === 0 && <p className="feed-vuoto">{provincia && delPeriodo.length ? `Nessun evento in provincia di ${provincia} in questo periodo, per ora. Prova "Tutte le province".` : noAuto ? "Per ora nessun evento di questo periodo ha una navetta che ti passa a prendere. Togli \"Con navetta\" per vederli tutti." : "Nessun evento in questo periodo, per ora. Prova un'altra data, o segnalaci un evento con il pulsante + Segnala."}</p>}
      <div className="feed-griglia">
        {mostrati.map((e, i) => <SchedaEvento key={e.id} e={e} i={i} centro={centro} attivo={attivo === e.id} />)}
      </div>
      <FineFeed />
    </div>
  );
}

// Il badge del prezzo: cifra, oppure solo il simbolo (€ a pagamento, € sbarrato gratis).
export function Prezzo({ e }) {
  const p = prezzoEv(e);
  if (p.vuoto) return null;
  if (!p.simbolo) return <span className="ev-prezzo">{p.testo}</span>;
  return (
    <span className={`ev-prezzo ev-prezzo--simbolo ${p.gratis ? "ev-prezzo--gratis" : ""}`} title={p.testo} aria-label={p.testo}>
      <span aria-hidden="true">€</span>
    </span>
  );
}


// La scheda evento ha sempre lo stesso ordine: data e prezzo in alto, poi la foto, poi il titolo.
function SchedaEvento({ e, i, centro, attivo }) {
  const arrivo = comeArrivi(e, centro);
  // senza foto sua, un paesaggio diverso da tutti gli altri della pagina
  const riserva = fotoDiRiserva(`evento-${e.id ?? i}`);
  const foto = e.immagine || riserva;
  return (
    <article id={`evento-${e.id}`} className={`ev ev--${["viola", "vino", "sole"][i % 3]} ${attivo ? "ev--attivo" : ""}`}>
      <div className="ev-su">
        <span className="ev-quando"><QuandoEv e={e} /></span>
        <span className="ev-su-destra">
          <Prezzo e={e} />
          <Cuore tipo="eventi" id={e.id} nome={e.titolo} copia={() => copiaEvento(e, eventoPercorso(e))} />
        </span>
      </div>
      <Link to={eventoPercorso(e)} className="ev-foto" tabIndex={-1} aria-hidden="true">
        <img src={foto} alt="" loading="lazy" onError={(x) => { if (!x.currentTarget.dataset.rip) { x.currentTarget.dataset.rip = 1; x.currentTarget.src = riserva; } }} />
      </Link>
      <Link to={eventoPercorso(e)} className="ev-titolo">{e.titolo}</Link>
      <small className="ev-meta">
        <span>{conProvincia(e.comune)}{e.d != null ? ` · ${fmtKm(e.d)}` : ""}</span>
        {arrivo && <span className="ev-bus">🚌 {arrivo}</span>}
      </small>
      <div className="ev-giu">
        <AggiungiCalendario e={e} percorso={eventoPercorso(e)} compatto />
        <span className="ev-azioni">
          <Indicazioni e={e} />
          <CondividiEvento e={e} />
        </span>
      </div>
    </article>
  );
}

function Partenza({ centro, setCentro }) {
  const scegli = async (v) => {
    if (v === "") return setCentro(null);
    if (v === "qui") { try { setCentro(await posizioneAttuale()); } catch { /* niente */ } return; }
    setCentro(CITTA.find((c) => c.nome === v) || null);
  };
  const valore = !centro ? "" : CITTA.some((c) => c.nome === centro.nome) ? centro.nome : "qui";
  return (
    <label className={`filtri-sel ${centro ? "on" : ""}`}>
      <span>📍</span>
      <select value={valore} onChange={(e) => scegli(e.target.value)} aria-label="Da dove parti">
        <option value="">Tutta la Toscana</option>
        <option value="qui">Vicino a me</option>
        {CITTA.map((c) => <option key={c.nome} value={c.nome}>Vicino a {c.nome}</option>)}
      </select>
    </label>
  );
}

function FineFeed() {
  return (
    <div className="feed-fine">
      <a className="feed-ig" href={INSTAGRAM_URL} target="_blank" rel="noopener">
        <svg className="feed-ig-icona" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
        <strong>“Qual è il vino più toscano che hai?”</strong>
        <small>Lo chiediamo a ogni cantina. Le risposte sono su Instagram.</small>
      </a>
      <footer className="piede">
        <p>Bevi responsabilmente: se bevi, non guidare.</p>
        <div className="piede-riga">
          {RYB_URL ? <a href={RYB_URL} target="_blank" rel="noopener">made with <span className="piede-cuore" aria-label="amore">♡</span> by <b>RYB</b></a> : <span>made with ♡ by <b>RYB</b></span>}
          <span className="piede-beta" title="L'app è in prova: qualcosa può ancora cambiare">beta</span>
        </div>
      </footer>
    </div>
  );
}

// ---------- Blog ----------

// Le notizie approvate dal gestionale (le trova lo scanner) si mettono accanto agli articoli
// scritti a mano, in ordine di data. Il loro indirizzo è bevotoscano.com/blog/n-<id>.
const daNotizia = (n) => ({
  id: `n-${n.id}`, notizia: n, titolo: n.titolo, tag: temaDi(n.categoria),
  data: (n.data_fonte || n.approvato || "").slice(0, 10),
  sottotitolo: (n.sintesi || "").split(/(?<=\.)\s/)[0],
});
function useNotizie() {
  const [notizie, setNotizie] = useState([]);
  useEffect(() => { notiziePubbliche().then((l) => setNotizie((l || []).map(daNotizia))).catch(() => {}); }, []);
  return notizie;
}

function Blog() {
  const notizie = useNotizie();
  const tutti = [...ARTICOLI, ...notizie].sort((a, b) => String(b.data).localeCompare(String(a.data)));
  // filtro per tema: Eventi, Premi e guide, Vino toscano
  const [tema, setTema] = useState("tutti");
  const temi = [["tutti", "Tutti"], ...TEMI_BLOG.map((t) => [t, t])];
  const lista = tutti.filter((a) => tema === "tutti" || a.tag === tema);
  return (
    <div className="feed">
      <Filtri><Riga etichetta="Temi"><Scelta opzioni={temi} valore={tema} onCambia={setTema} /></Riga></Filtri>
      {lista.length === 0 && <p className="feed-vuoto">Nessun articolo su questo tema, per ora. Arrivano presto.</p>}
      <div className="feed-griglia feed-griglia--blog">
        {lista.map((a) => (
          <SchedaArticolo key={a.id} a={a} />
        ))}
      </div>
      <FineFeed />
    </div>
  );
}

// La scheda di un articolo nell'elenco, col cuore in alto a destra.
function SchedaArticolo({ a }) {
  return (
    <div className="art-box">
      <Link to={`blog/${a.id}`} className={`art ${a.notizia ? "art--notizia" : ""}`}>
        {a.immagine && <img className="art-img" src={a.immagine} alt="" loading="lazy" />}
        <span className="art-tag">{a.tag}{a.data ? ` · ${dataArticolo(a.data)}` : ""}</span>
        <strong>{a.titolo}</strong>
        <span className="art-sotto">{a.sottotitolo}</span>
        <span className="art-leggi">Leggi</span>
      </Link>
      <Cuore tipo="articoli" id={a.id} nome={a.titolo} copia={() => copiaArticolo(a)} className="cuore--angolo" />
    </div>
  );
}

function TitoloArticolo({ a }) {
  return (
    <div className="evento-testa">
      <h1 className="page-title">{a.titolo}</h1>
      <Cuore tipo="articoli" id={a.id} nome={a.titolo} copia={() => copiaArticolo(a)} className="cuore--grande" />
    </div>
  );
}

function Articolo({ id }) {
  const notizie = useNotizie();
  const n = id.startsWith("n-") ? notizie.find((x) => x.id === id) : null;
  if (n) return <Notizia a={n} />;
  const a = articolo(id);
  if (!a && id.startsWith("n-")) return <div className="page shell-pagina"><p className="muted">Carico…</p></div>;
  if (!a) return <div className="page shell-pagina"><p className="muted">Articolo non trovato.</p><Link className="link" to="blog">← Tutti gli articoli</Link></div>;
  return (
    <article className="page shell-pagina articolo">
      <span className="art-tag">{a.tag} · {dataArticolo(a.data)}</span>
      <TitoloArticolo a={a} />
      {a.immagine && <img className="articolo-img" src={a.immagine} alt={a.alt || ""} />}
      <p className="articolo-sotto">{a.sottotitolo}</p>
      {a.paragrafi.map((p, i) => <p key={i} className="articolo-p">{p}</p>)}
      <EventiDellArticolo id={a.id} />
      <Link className="btn btn--primary" to="eventi">Guarda gli eventi</Link>
    </article>
  );
}

// gli eventi che nel gestionale hai collegato a questo articolo
function EventiDellArticolo({ id }) {
  const [eventi, setEventi] = useState([]);
  useEffect(() => { eventiPubblici().then((l) => setEventi((l || []).filter((e) => e.articolo === id))).catch(() => {}); }, [id]);
  if (!eventi.length) return null;
  return (
    <section className="articolo-eventi">
      <div className="home-titolo"><h2>{eventi.length === 1 ? "L'evento di cui parliamo" : "Gli eventi di cui parliamo"}</h2></div>
      {eventi.map((e, i) => <SchedaEvento key={e.id} e={e} i={i} />)}
    </section>
  );
}

function Notizia({ a }) {
  const n = a.notizia;
  // le cantine citate che hanno una scheda da noi: dai nomi della notizia e dai suoi dettagli
  const luoghi = useLuoghi();
  const nomi = [...(n.aziende || []), ...(Array.isArray(n.dettagli) ? n.dettagli.map((r) => r && r.azienda) : [])].filter(Boolean);
  const citate = [...new Map(nomi.map((x) => trovaCantina(x, luoghi.cantine)).filter(Boolean).map((c) => [c.id, c])).values()];
  useEffect(() => { document.title = `${a.titolo} · Bevotoscano`; }, [a.id]);
  return (
    <article className="page shell-pagina articolo">
      <span className="art-tag">{a.tag}{a.data ? ` · ${dataArticolo(a.data)}` : ""}</span>
      <TitoloArticolo a={a} />
      {(n.sintesi || "").split(/\n+/).filter(Boolean).map((p, i) => <p key={i} className="articolo-p">{p}</p>)}
      <Dettagli d={n.dettagli} cantine={luoghi.cantine} />
      {citate.length > 0 && (
        <section className="cant-blocco">
          <strong>{citate.length === 1 ? "La cantina di cui parliamo" : "Le cantine di cui parliamo"}</strong>
          {citate.map((x) => <Link key={x.id} className="cant-vicina" to={cantinaPercorso(x)}><Foto c={x} /><span><b>{x.nome}</b><small>{dove(x)}</small></span></Link>)}
        </section>
      )}
      <p className="articolo-fonte">
        Fonte: <a className="link" href={n.fonte_url} target="_blank" rel="noopener">{n.fonte_nome || "leggi l'originale"} ↗</a>
        {n.fonte_url_2 && <> · <a className="link" href={n.fonte_url_2} target="_blank" rel="noopener">altra fonte ↗</a></>}
      </p>
      <Link className="btn btn--primary" to="blog">← Tutto il blog</Link>
    </article>
  );
}

// ---------- Classifica e gioco ----------

function domandaDelGiorno() {
  const oggi = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const q = DOMANDE[oggi % DOMANDE.length];
  const opzioni = [...q.r].sort((a, b) => ((a.length * 7 + oggi) % 5) - ((b.length * 7 + oggi) % 5) || a.localeCompare(b));
  return { testo: q.d, giusta: q.r[0], opzioni, perche: q.p };
}

function Gioca() {
  return (
    <div className="feed">
      <div className="feed-griglia feed-griglia--gioca">
        <section className="gioco-card">
          <small>IL QUIZ</small>
          <strong>Quanto ne sai di vino toscano?</strong>
          <p>Si parte facile e si fa sempre più difficile, con una vita di scorta. Ogni 3 giuste di fila guadagni una vita, se sbagli ne perdi una. Sbagli senza vite? Fine della partita.</p>
          <Link to="gioca/quiz" className="gioco-via">Gioca ora</Link>
        </section>
        <section className="gioco-vit">
          <small>IL TUO VITIGNO</small>
          <strong>Che vitigno sei?</strong>
          <p>Dalla tua data di nascita, il vitigno toscano che ti somiglia. Da condividere nelle storie.</p>
          <Link to="gioca/oroscopo" className="gioco-via gioco-via--chiaro">Scoprilo</Link>
        </section>
        <section className="gioco-classifica">
          <div className="gioco-classifica-testa"><strong>Classifica</strong><small>Quante giuste prima di cadere</small></div>
          <Classifica limite={50} />
        </section>
      </div>
      {/* l'oroscopo del mese anche qui, in fondo, prima dello spazio sul vino più toscano */}
      <Oroscopo />
      <FineFeed />
    </div>
  );
}

// ---------- Home ----------
// Si apre qui: il tuo oroscopo del vino, la domanda del giorno (che fa partire il quiz),
// i prossimi eventi e una scorciatoia per cantine e blog.

function Home() {
  const [eventi, setEventi] = useState(null);
  useEffect(() => { eventiPubblici().then(setEventi).catch(() => setEventi([])); }, []);
  const prossimi = (eventi || []).slice(0, 3);
  const tutti = (eventi || []).length;
  return (
    <div className="feed home">
      <Preferiti eventi={eventi} />
      <div className="home-titolo">
        <h2>Prossimi eventi</h2>
        <Link to="eventi" className="home-tutti">Tutti →</Link>
      </div>
      {!eventi && <p className="feed-vuoto">Carico gli eventi…</p>}
      {eventi && !prossimi.length && <p className="feed-vuoto">Nuovi eventi in arrivo. Ne conosci uno? Segnalacelo con + Segnala.</p>}
      <div className="feed-griglia home-eventi">{prossimi.map((e, i) => <SchedaEvento key={e.id} e={e} i={i} />)}</div>
      {tutti > prossimi.length && <Link to="eventi" className="home-scopri">Vedi tutti i {tutti} eventi in calendario →</Link>}

      <div className="home-titolo"><h2>La cantina del giorno</h2><Link to="cantine" className="home-tutti">Tutte →</Link></div>
      <CantinaDelGiorno />
      <Link to="cantine" className="home-scopri">Tutte le cantine sulla mappa →</Link>

      <div className="home-titolo"><h2>Gioca</h2><Link to="gioca" className="home-tutti">Giochi →</Link></div>
      <div className="home-griglia">
        <DomandaDelGiorno />
        <Oroscopo compatto />
      </div>
      <FineFeed />
    </div>
  );
}

// Gli eventi preferiti ancora da venire: se l'elenco è arrivato, solo quelli che ci sono ancora
// (un evento passato o tolto sparisce da solo); se no, dalla copia salvata.
function eventiPreferiti(lista, eventi) {
  const adesso = new Date();
  return lista
    .map((x) => { const e = eventi?.find((v) => String(v.id) === x.id); return e ? { ...x, e } : x; })
    .filter((x) => (eventi ? x.e : new Date(x.fine || x.inizio) >= adesso))
    .sort((a, b) => String(a.e?.inizio || a.inizio).localeCompare(String(b.e?.inizio || b.inizio)));
}
const recenti = (l) => [...l].sort((a, b) => String(b.salvato).localeCompare(String(a.salvato)));

// In Home, i preferiti sono un riassunto: una tessera per tipo (eventi, cantine, enoteche, articoli)
// con quanti sono e il primo da guardare. Toccandola si apre la pagina di quel tipo.
// (27/11: l'elenco unico di tutto, in Home, diventava illeggibile.)
function Preferiti({ eventi }) {
  const t = perTipo(usePreferiti());
  const liste = { ...t, eventi: eventiPreferiti(t.eventi, eventi), cantine: recenti(t.cantine), enoteche: recenti(t.enoteche), articoli: recenti(t.articoli) };
  if (!TIPI_PREFERITI.some((x) => liste[x.id].length)) return null;
  const primo = (id) => {
    const x = liste[id][0];
    if (!x) return "Nessuno, per ora";
    if (id === "eventi") return `Prossimo: ${x.titolo}`;
    return x.titolo || x.nome;
  };
  return (
    <>
      <div className="home-titolo"><h2>I tuoi preferiti</h2><Link to="preferiti" className="home-tutti">Tutti →</Link></div>
      <div className="pref-tessere">
        {TIPI_PREFERITI.map((x) => (
          <Link key={x.id} to={`preferiti/${x.id}`} className={`pref-tessera ${liste[x.id].length ? "" : "pref-tessera--vuota"}`}>
            <span className="pref-tessera-su"><span aria-hidden="true">{x.icona}</span><b>{liste[x.id].length}</b></span>
            <strong>{x.nome}</strong>
            <small>{primo(x.id)}</small>
          </Link>
        ))}
      </div>
    </>
  );
}

// La pagina dei preferiti: bevotoscano.com/preferiti/eventi (o cantine, enoteche, articoli).
function PaginaPreferiti({ tipo }) {
  const t = perTipo(usePreferiti());
  const [eventi, setEventi] = useState(null);
  useEffect(() => { eventiPubblici().then(setEventi).catch(() => setEventi([])); }, []);
  const luoghi = useLuoghi();
  const notizie = useNotizie();
  const liste = { ...t, eventi: eventiPreferiti(t.eventi, eventi), cantine: recenti(t.cantine), enoteche: recenti(t.enoteche), articoli: recenti(t.articoli) };
  // senza tipo nell'indirizzo, il primo che ha qualcosa
  const scelto = TIPI_PREFERITI.find((x) => x.id === tipo) || TIPI_PREFERITI.find((x) => liste[x.id].length) || TIPI_PREFERITI[0];
  const lista = liste[scelto.id];
  const tutti = [...luoghi.cantine, ...luoghi.enoteche];
  return (
    <div className="feed">
      <div className="home-titolo home-titolo--pagina"><h1>I tuoi preferiti</h1></div>
      <Filtri>
        <Riga etichetta="Mostra">
          <Scelta valore={scelto.id} onCambia={(v) => go(`preferiti/${v}`)}
            opzioni={TIPI_PREFERITI.map((x) => [x.id, `${x.icona} ${x.nome}${liste[x.id].length ? ` · ${liste[x.id].length}` : ""}`])} />
        </Riga>
      </Filtri>
      {!lista.length && <p className="feed-vuoto">{scelto.vuoto}</p>}
      {scelto.id === "eventi" && (
        <div className="feed-griglia">
          {lista.map((x, i) => (x.e
            ? <SchedaEvento key={x.id} e={x.e} i={i} />
            : <RigaPreferito key={x.id} x={x} tipo="eventi" icona="📅" titolo={x.titolo} sotto={x.comune ? conProvincia(x.comune) : ""} />))}
        </div>
      )}
      {(scelto.id === "cantine" || scelto.id === "enoteche") && (
        <div className="feed-griglia">
          {lista.map((x) => {
            const c = tutti.find((y) => String(y.id) === x.id);
            return c ? (
              <div key={x.id} className="pref-luogo">
                <Link className="cant-vicina" to={cantinaPercorso(c)}><Foto c={c} /><span><b>{c.nome}</b><small>{dove(c)}</small></span></Link>
                <Cuore tipo="luoghi" id={x.id} nome={x.nome} copia={() => x} />
              </div>
            ) : <RigaPreferito key={x.id} x={x} tipo="luoghi" icona={x.enoteca ? "🍷" : "🍇"} titolo={x.nome} sotto={x.dove} />;
          })}
        </div>
      )}
      {scelto.id === "articoli" && (
        <div className="feed-griglia feed-griglia--blog">
          {lista.map((x) => {
            const a = articolo(x.id) || notizie.find((n) => n.id === x.id);
            return a ? <SchedaArticolo key={x.id} a={a} /> : <RigaPreferito key={x.id} x={x} tipo="articoli" icona="📰" titolo={x.titolo} sotto={x.tag} />;
          })}
        </div>
      )}
      <p className="pref-nota">I preferiti restano salvati su questo telefono: niente account, niente dati inviati.</p>
    </div>
  );
}

// Un preferito di cui abbiamo solo la copia salvata (dati non ancora arrivati, o tolto dall'app)
function RigaPreferito({ x, tipo, icona, titolo, sotto }) {
  return (
    <div className="pref-riga pref-riga--sola">
      <span className="pref-icona" aria-hidden="true">{icona}</span>
      <PrefLink x={x}><strong>{titolo}</strong>{sotto && <small>{sotto}</small>}</PrefLink>
      <Cuore tipo={tipo} id={x.id} nome={titolo} copia={() => x} />
    </div>
  );
}

function PrefLink({ x, children }) {
  if (x.percorso) return <Link to={x.percorso} className="pref-testo">{children}</Link>;
  if (x.link) return <a href={x.link} target="_blank" rel="noopener" className="pref-testo">{children}</a>;
  return <span className="pref-testo">{children}</span>;
}

// Una cantina diversa ogni giorno, tra quelle scelte da noi.
function CantinaDelGiorno() {
  const oggi = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const c = CANTINE[(oggi * 7) % CANTINE.length];
  // la foto dal sito della cantina; se non si trova, il paesaggio di repertorio
  const [rotta, setRotta] = useState(false);
  if (!c) return null;
  const foto = rotta ? null : fotoDi(c);
  return (
    <Link to={cantinaPercorso(c)} className="home-cantina">
      {/* se la cantina non ha ancora una sua foto, un paesaggio come negli eventi */}
      <span className="home-cantina-foto">
        <img src={foto || fotoDiRiserva(`cantina-${c.id}`)} alt="" loading="lazy" onError={() => setRotta(true)} />
      </span>
      <span className="home-cantina-testo">
        <strong>{c.nome}</strong>
        <small>{dove(c)}</small>
        {c.descrizione && <span>{c.descrizione}</span>}
      </span>
      <span className="home-cantina-via" aria-hidden="true">→</span>
    </Link>
  );
}

function DomandaDelGiorno() {
  const q = useMemo(domandaDelGiorno, []);
  const [scelta, setScelta] = useState(null);
  const ok = scelta === q.giusta;
  const continua = () => {
    try { sessionStorage.setItem(DAL_GIORNO, JSON.stringify({ d: q.testo, ok })); } catch { /* niente */ }
    go("gioca/quiz");
  };
  return (
    <section className="gioco-giorno">
      <small>DOMANDA DEL GIORNO</small>
      <strong>{q.testo}</strong>
      <div className="gioco-opz">
        {q.opzioni.map((o) => {
          const cls = !scelta ? "" : o === q.giusta ? "ok" : o === scelta ? "no" : "spento";
          return <button key={o} className={cls} disabled={!!scelta} onClick={() => setScelta(o)}>{o}</button>;
        })}
      </div>
      {scelta && <p className="giorno-esito fade"><b>{ok ? "Esatto!" : `Era: ${q.giusta}.`}</b> {q.perche}</p>}
      {scelta
        ? <button className="gioco-via" onClick={continua}>{ok ? "Continua col quiz: 1 giusta già fatta" : "Rifatti col quiz"}</button>
        : <small className="giorno-nota">Rispondi e parti col quiz da qui.</small>}
    </section>
  );
}

const dataBreve = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long" });

function Oroscopo({ compatto }) {
  const d = new Date();
  const mio = segnoMio();
  const corrente = mio || segnoDa(d.getMonth() + 1, d.getDate()) || SEGNI[0];
  const [id, setId] = useState(corrente.id);
  const [altri, setAltri] = useState(false);
  const [tutto, setTutto] = useState(!compatto);
  const box = useRef(null);
  // cambiando segno si torna all'inizio della scheda, così si legge dal titolo (27/11)
  const vai = (nuovo) => {
    setId(nuovo);
    requestAnimationFrame(() => {
      const el = box.current, area = el?.closest(".shell-area");
      if (!el || !area) return;
      const su = el.getBoundingClientRect().top - area.getBoundingClientRect().top;
      if (su < 0 || su > area.clientHeight * 0.4) area.scrollBy({ top: su - 12, behavior: "smooth" });
    });
  };
  const s = SEGNI.find((x) => x.id === id);
  const t = MESE.testi?.[id];
  const suo = id === mio?.id;
  const i0 = SEGNI.indexOf(corrente);
  const ordine = [...SEGNI.slice(i0), ...SEGNI.slice(0, i0)];
  const rapporto = (r, tipo) => {
    const x = r && SEGNI.find((y) => y.id === r.segno);
    if (!x) return null;
    return (
      <button className={`oro-rap oro-rap--${tipo}`} onClick={() => vai(x.id)}>
        <small>{tipo === "affine" ? "Segno affine del mese" : "Antagonista del mese"}</small>
        <b><span aria-hidden="true">{x.simbolo}︎</span> {x.segno} · {r.nome}</b>
        <span>{r.testo}</span>
      </button>
    );
  };
  return (
    <section className="gioco-oro" ref={box}>
      <small>{suo ? "IL TUO OROSCOPO DEL VINO" : "OROSCOPO DEL VINO"} · fino al {dataBreve(MESE.al)}</small>
      <div className="oro-segno" key={id}>
        <span className="oro-simbolo" aria-hidden="true">{s.simbolo}︎</span>
        <span><b>{s.segno}</b><em>{s.vitigno}</em></span>
        {mio && !suo && <button className="oro-torna" onClick={() => vai(mio.id)}>Torna al tuo</button>}
      </div>
      {t && (
        <div className="oro-corpo fade" key={`t-${id}`}>
          <strong>{t.titolo}</strong>
          <p>{t.testo}</p>
          <p className="gioco-oro-vino">{t.vino}</p>
          {tutto && (t.affine || t.antagonista) && (
            <div className="oro-rapporti">
              {rapporto(t.affine, "affine")}
              {rapporto(t.antagonista, "anti")}
            </div>
          )}
        </div>
      )}
      {!tutto && <button className="oro-altri" onClick={() => setTutto(true)}>Il tuo segno affine e l'antagonista del mese</button>}
      {tutto && <button className="oro-altri" aria-expanded={altri} onClick={() => setAltri((v) => !v)}>{altri ? "Chiudi gli altri segni" : "Guarda anche gli altri segni"}</button>}
      {altri && (
        <div className="gioco-segni fade">
          {ordine.map((x) => <button key={x.id} className={x.id === id ? "on" : ""} onClick={() => vai(x.id)}>{x.simbolo}︎ {x.segno}{x.id === mio?.id ? " ★" : ""}</button>)}
        </div>
      )}
      {!compatto && <Link to="gioca/oroscopo" className="gioco-via gioco-via--chiaro">Il tuo vitigno, da condividere</Link>}
    </section>
  );
}
