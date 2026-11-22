import { useEffect, useMemo, useRef, useState } from "react";
import { INSTAGRAM_URL, RYB_URL } from "../data.js";
import { eventiPubblici } from "../eventi/api.js";
import { senzaAuto } from "../eventi/shared.js";
import Eventi, { nelPeriodo } from "../eventi/Eventi.jsx";
import Mappa from "../eventi/Mappa.jsx";
import { km, fmtKm, posizioneAttuale, CITTA } from "../eventi/geo.js";
import Cantine from "./Cantine.jsx";
import Segnala from "../eventi/Segnala.jsx";
import { ARTICOLI, articolo, dataArticolo } from "../blog.js";
import { DOMANDE } from "../games/quizData.js";
import { SEGNI, segnoDa } from "../games/oroscopoData.js";
import MESE from "../games/oroscopoMese.json";
import { Classifica } from "../games/Classifiche.jsx";
import Link from "../Link.jsx";
import Benvenuto, { segnoMio } from "./Benvenuto.jsx";
import AggiungiCalendario from "../eventi/Calendario.jsx";
import { Filtri, Riga, Scelta, Interruttore } from "./Filtri.jsx";
import { go } from "../nav.js";
import { eventoPercorso, FILTRI_EVENTI } from "../seo.js";

// La schermata unica di Bevotoscano: una cornice fissa, uguale su telefono e computer.
// In alto il marchio e le pills (scorrono col dito), sotto scorre solo il contenuto
// della pill scelta: eventi, cantine, articoli del blog, classifica del gioco.

export const PILLS = [
  { id: "eventi", label: "Eventi", to: "eventi" },
  { id: "cantine", label: "Cantine", to: "cantine" },
  { id: "blog", label: "Blog", to: "blog" },
  { id: "gioca", label: "Giochi", to: "gioca" },
];

// Da una pagina interna (un evento, una cantina, un articolo…) la freccia riporta all'elenco.
function indietroDa(section, sub) {
  if (section === "eventi" && sub && !FILTRI_EVENTI.includes(sub)) return ["eventi", "Eventi"];
  if (section === "cantine" && sub) return ["cantine", "Cantine"];
  if (section === "blog" && sub) return ["blog", "Blog"];
  if (["segnala", "esperienze", "cassa"].includes(section)) return ["home", "Home"];
  return null;
}

export default function Shell({ section, sub, children }) {
  const pill = section === "home" ? "eventi" : section;
  const area = useRef(null);
  const indietro = indietroDa(section, sub);
  // a ogni cambio di pagina si riparte dall'alto del contenuto
  useEffect(() => { area.current?.scrollTo(0, 0); }, [section, sub]);

  return (
    <Benvenuto>
      <div className="shell">
        <header className="shell-testa">
          <div className="shell-riga">
            {indietro && (
              <Link to={indietro[0]} className="shell-indietro" aria-label={`Torna a ${indietro[1]}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
              </Link>
            )}
            <Link to="home" className="shell-marchio" aria-label="Bevotoscano, torna all'inizio"><span className="shell-logo">Bevotoscano</span><em>Il vino da vivere</em></Link>
            <Link to="segnala" className="shell-segnala">+ Segnala evento</Link>
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
  if (section === "blog") return sub ? <Articolo id={sub} /> : <Blog />;
  if (section === "gioca") return <Gioca />;
  if (section === "segnala") return <div className="page shell-pagina"><Segnala /></div>;
  if (section === "eventi" && sub && !FILTRI_EVENTI.includes(sub)) {
    return <div className="page shell-pagina"><Eventi apri={sub} /></div>;
  }
  return <FeedEventi filtro={section === "eventi" ? sub : undefined} />;
}

// ---------- Eventi ----------

const POS_KEY = "bevotoscano-posizione";
const leggi = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const scrivi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* niente */ } };
const g = (iso) => new Date(iso);
const stessoGiorno = (a, b) => a.toDateString() === b.toDateString();
const giornoMese = (d, conGiorno) => d.toLocaleDateString("it-IT", { ...(conGiorno ? { weekday: "short" } : {}), day: "numeric", month: "short" }).replace(/\./g, "").toUpperCase();
const ora = (d) => d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
// "SAB 5 DIC · 09:30" oppure "19 NOV → 23 NOV" per gli eventi di più giorni
function quandoEv(e) {
  const a = g(e.inizio), b = e.fine ? g(e.fine) : null;
  if (!b || stessoGiorno(a, b)) return `${giornoMese(a, true)} · ${ora(a)}`;
  return `${giornoMese(a)} → ${giornoMese(b)}`;
}
const inCorso = (e) => g(e.inizio) <= new Date() && (!e.fine || g(e.fine) >= new Date());
function comeArrivi(e, centro) {
  const pk = [...(e.pickup || [])].map((p) => ({ ...p, d: km(centro, p) })).sort((a, b) => (a.d ?? 0) - (b.d ?? 0))[0];
  if (pk) return `Bus da ${pk.nome.split(",")[0]}${pk.orario ? ` alle ${pk.orario}` : ""}`;
  if ((e.accesso || []).includes("treno")) return "In treno o coi mezzi";
  if ((e.accesso || []).includes("piedi")) return "A piedi dal centro";
  return "";
}
async function condividi(titolo, percorso) {
  const url = `${window.location.origin}/${percorso}`;
  try {
    if (navigator.share) await navigator.share({ title: titolo, url });
    else { await navigator.clipboard.writeText(url); alert("Link copiato"); }
  } catch { /* annullato */ }
}

const QUANDO = [["tutte", "Sempre"], ["weekend", "Weekend"], ["7", "7 giorni"], ["30", "Un mese"]];

function FeedEventi({ filtro }) {
  const [eventi, setEventi] = useState(null);
  const [centro, setCentro] = useState(() => leggi(POS_KEY, null));
  const [quando, setQuando] = useState(filtro === "weekend" ? "weekend" : "tutte");
  const [noAuto, setNoAuto] = useState(filtro === "senza-auto");
  const [mappa, setMappa] = useState(false);
  useEffect(() => { eventiPubblici().then(setEventi).catch(() => setEventi([])); }, []);
  useEffect(() => { scrivi(POS_KEY, centro); }, [centro]);
  useEffect(() => {
    if (filtro === "weekend") setQuando("weekend");
    if (filtro === "senza-auto") setNoAuto(true);
    if (filtro === "vicino" && !centro) posizioneAttuale().then(setCentro).catch(() => {});
  }, [filtro]);

  const lista = useMemo(() => (eventi || [])
    .filter((e) => (!noAuto || senzaAuto(e)) && nelPeriodo(e, quando))
    .map((e) => ({ ...e, d: km(centro, e) }))
    .sort((a, b) => (centro && a.d != null && b.d != null ? a.d - b.d : a.inizio.localeCompare(b.inizio))),
  [eventi, quando, noAuto, centro]);

  return (
    <div className="feed">
      <Filtri>
        <Riga etichetta="Quando"><Scelta opzioni={QUANDO} valore={quando} onCambia={setQuando} /></Riga>
        <Riga etichetta="Come">
          <Partenza centro={centro} setCentro={setCentro} />
          <Interruttore on={noAuto} onCambia={setNoAuto}>🚌 Senza auto</Interruttore>
          <Interruttore on={mappa} onCambia={setMappa}>🗺️ Mappa</Interruttore>
        </Riga>
      </Filtri>
      {mappa && eventi && <div className="feed-mappa"><Mappa eventi={lista} centro={centro} onApri={(e) => go(eventoPercorso(e))} /></div>}
      {!eventi && <p className="feed-vuoto">Carico gli eventi…</p>}
      {eventi && lista.length === 0 && <p className="feed-vuoto">Nessun evento con questi filtri, per ora. Prova a toglierne uno, o segnalacene uno tu.</p>}
      <div className="feed-griglia">
        {lista.map((e, i) => {
          const arrivo = comeArrivi(e, centro);
          return (
            <article key={e.id} className={`ev ev--${["viola", "vino", "sole"][i % 3]}`}>
              <div className="ev-su">
                <span className="ev-quando">{quandoEv(e)}</span>
                {inCorso(e) ? <span className="ev-tag">In corso</span> : e.prezzo ? <span className="ev-tag">{e.prezzo}</span> : null}
              </div>
              <Link to={eventoPercorso(e)} className="ev-titolo">{e.titolo}</Link>
              <small className="ev-meta">{e.luogo_nome && e.luogo_nome !== e.comune ? `${e.luogo_nome}, ` : ""}{e.comune}{e.d != null ? ` · ${fmtKm(e.d)}` : ""}{e.esempio ? " · esempio" : ""}</small>
              {arrivo && <span className="ev-bus">{arrivo}</span>}
              <div className="ev-azioni">
                <AggiungiCalendario e={e} percorso={eventoPercorso(e)} />
                <button className="ev-share" aria-label="Condividi" onClick={() => condividi(e.titolo, eventoPercorso(e))}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <FineFeed />
    </div>
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
      <select value={valore} onChange={(e) => scegli(e.target.value)} aria-label="Parto da">
        <option value="">Parto da: ovunque</option>
        <option value="qui">Parto da: dove sono</option>
        {CITTA.map((c) => <option key={c.nome} value={c.nome}>Parto da: {c.nome}</option>)}
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

function Blog() {
  return (
    <div className="feed">
      <div className="feed-griglia feed-griglia--blog">
        {ARTICOLI.map((a, i) => (
          <Link key={a.id} to={`blog/${a.id}`} className={`art ${i === 0 ? "art--primo" : ""}`}>
            {a.immagine && <img className="art-img" src={a.immagine} alt="" loading="lazy" />}
            <span className="art-tag">{a.tag} · {dataArticolo(a.data)}</span>
            <strong>{a.titolo}</strong>
            <span className="art-sotto">{a.sottotitolo}</span>
            <span className="art-leggi">Leggi</span>
          </Link>
        ))}
      </div>
      <FineFeed />
    </div>
  );
}

function Articolo({ id }) {
  const a = articolo(id);
  if (!a) return <div className="page shell-pagina"><p className="muted">Articolo non trovato.</p><Link className="link" to="blog">← Tutti gli articoli</Link></div>;
  return (
    <article className="page shell-pagina articolo">
      <span className="art-tag">{a.tag} · {dataArticolo(a.data)}</span>
      <h1 className="page-title">{a.titolo}</h1>
      {a.immagine && <img className="articolo-img" src={a.immagine} alt={a.alt || ""} />}
      <p className="articolo-sotto">{a.sottotitolo}</p>
      {a.paragrafi.map((p, i) => <p key={i} className="articolo-p">{p}</p>)}
      <Link className="btn btn--primary" to="eventi">Guarda gli eventi</Link>
    </article>
  );
}

// ---------- Classifica e gioco ----------

function domandaDelGiorno() {
  const oggi = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const q = DOMANDE[oggi % DOMANDE.length];
  const opzioni = [...q.r].sort((a, b) => ((a.length * 7 + oggi) % 5) - ((b.length * 7 + oggi) % 5) || a.localeCompare(b));
  return { testo: q.d, giusta: q.r[0], opzioni };
}

function Gioca() {
  const q = useMemo(domandaDelGiorno, []);
  const [scelta, setScelta] = useState(null);
  return (
    <div className="feed">
      <div className="feed-griglia feed-griglia--gioca">
        <section className="gioco-card">
          <small>IL QUIZ</small>
          <strong>Quanto ne sai di vino toscano?</strong>
          <p>Le domande non finiscono mai. Ogni 3 risposte giuste guadagni una vita, se sbagli ne perdi una. Sbagli senza vite? Fine della partita.</p>
          <Link to="gioca/quiz" className="gioco-via">Gioca ora</Link>
        </section>
        <Oroscopo />
        <section className="gioco-classifica">
          <div className="gioco-classifica-testa"><strong>Classifica</strong><small>Quante giuste prima di cadere</small></div>
          <Classifica limite={50} />
        </section>
        <section className="gioco-giorno">
          <small>DOMANDA DEL GIORNO · dal quiz, una nuova ogni giorno</small>
          <strong>{q.testo}</strong>
          <div className="gioco-opz">
            {q.opzioni.map((o) => {
              const cls = !scelta ? "" : o === q.giusta ? "ok" : o === scelta ? "no" : "spento";
              return <button key={o} className={cls} disabled={!!scelta} onClick={() => setScelta(o)}>{o}</button>;
            })}
          </div>
          {scelta && <p>{scelta === q.giusta ? "Esatto!" : `Era: ${q.giusta}.`} Domani ne arriva un'altra.</p>}
          {scelta && <Link to="gioca/quiz" className="gioco-via gioco-via--chiaro">Ne vuoi altre? Gioca al quiz</Link>}
        </section>
      </div>
      <FineFeed />
    </div>
  );
}

const dataBreve = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long" });

function Oroscopo() {
  const d = new Date();
  const mio = segnoMio();
  const corrente = mio || segnoDa(d.getMonth() + 1, d.getDate()) || SEGNI[0];
  const [id, setId] = useState(corrente.id);
  const [altri, setAltri] = useState(false);
  const s = SEGNI.find((x) => x.id === id);
  const t = MESE.testi?.[id];
  const suo = id === mio?.id;
  const i0 = SEGNI.indexOf(corrente);
  const ordine = [...SEGNI.slice(i0), ...SEGNI.slice(0, i0)];
  const rapporto = (r, tipo) => {
    const x = r && SEGNI.find((y) => y.id === r.segno);
    if (!x) return null;
    return (
      <button className={`oro-rap oro-rap--${tipo}`} onClick={() => setId(x.id)}>
        <small>{tipo === "affine" ? "Segno affine del mese" : "Antagonista del mese"}</small>
        <b><span aria-hidden="true">{x.simbolo}︎</span> {x.segno} · {r.nome}</b>
        <span>{r.testo}</span>
      </button>
    );
  };
  return (
    <section className="gioco-oro">
      <small>{suo ? "IL TUO OROSCOPO DEL VINO" : "OROSCOPO DEL VINO"} · fino al {dataBreve(MESE.al)}</small>
      <div className="oro-segno" key={id}>
        <span className="oro-simbolo" aria-hidden="true">{s.simbolo}︎</span>
        <span><b>{s.segno}</b><em>{s.vitigno}</em></span>
        {mio && !suo && <button className="oro-torna" onClick={() => setId(mio.id)}>Torna al tuo</button>}
      </div>
      {t && (
        <div className="oro-corpo fade" key={`t-${id}`}>
          <strong>{t.titolo}</strong>
          <p>{t.testo}</p>
          <p className="gioco-oro-vino">{t.vino}</p>
          {(t.affine || t.antagonista) && (
            <div className="oro-rapporti">
              {rapporto(t.affine, "affine")}
              {rapporto(t.antagonista, "anti")}
            </div>
          )}
        </div>
      )}
      <button className="oro-altri" aria-expanded={altri} onClick={() => setAltri((v) => !v)}>{altri ? "Chiudi gli altri segni" : "Guarda anche gli altri segni"}</button>
      {altri && (
        <div className="gioco-segni fade">
          {ordine.map((x) => <button key={x.id} className={x.id === id ? "on" : ""} onClick={() => setId(x.id)}>{x.simbolo}︎ {x.segno}{x.id === mio?.id ? " ★" : ""}</button>)}
        </div>
      )}
      <Link to="gioca/oroscopo" className="gioco-via gioco-via--chiaro">Il tuo vitigno, da condividere</Link>
    </section>
  );
}
