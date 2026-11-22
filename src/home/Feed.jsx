import { useEffect, useMemo, useRef, useState } from "react";
import { CANTINE, INSTAGRAM_URL } from "../data.js";
import { eventiPubblici } from "../eventi/api.js";
import { senzaAuto } from "../eventi/shared.js";
import Eventi, { nelPeriodo } from "../eventi/Eventi.jsx";
import Cantine from "./Cantine.jsx";
import { DOMANDE } from "../games/quizData.js";
import { SEGNI, segnoDa } from "../games/oroscopoData.js";
import MESE from "../games/oroscopoMese.json";
import Link from "../Link.jsx";
import { eventoPercorso, cantinaPercorso, metaPercorso, applicaMeta } from "../seo.js";

// La schermata unica: tutta l'app in una pagina che scorre, come un feed.
// Ogni blocco ha il suo indirizzo (/eventi, /gioca, /cantine): scorrendo l'indirizzo
// cambia da solo, e chi arriva da Google su /cantine atterra direttamente lì.

export const SEZIONI = [
  { id: "home", label: "Scopri", path: "home" },
  { id: "eventi", label: "Eventi", path: "eventi" },
  { id: "gioca", label: "Gioca", path: "gioca" },
  { id: "oroscopo", label: "Oroscopo", path: "gioca" },
  { id: "cantine", label: "Cantine", path: "cantine" },
];
const URL_DI = (path) => (path === "home" ? "/" : `/${path}`);
const ALTEZZA_TESTATA = 104; // barra viola + chip delle sezioni

export function scorriA(id, morbido = true) {
  if (id === "home") return window.scrollTo({ top: 0, behavior: morbido ? "smooth" : "auto" });
  const el = document.getElementById(`sez-${id}`);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - ALTEZZA_TESTATA + 2, behavior: morbido ? "smooth" : "auto" });
}

// Quale sezione è sotto la testata adesso.
function useSezioneVisibile(onCambio) {
  const [attiva, setAttiva] = useState("home");
  const ultima = useRef("home");
  useEffect(() => {
    let raf = 0;
    const leggi = () => {
      raf = 0;
      let cur = "home";
      for (const s of SEZIONI.slice(1)) {
        const el = document.getElementById(`sez-${s.id}`);
        if (el && el.getBoundingClientRect().top <= ALTEZZA_TESTATA + 40) cur = s.id;
      }
      if (cur !== ultima.current) {
        ultima.current = cur;
        setAttiva(cur);
        onCambio(cur);
      }
    };
    const su = () => { if (!raf) raf = requestAnimationFrame(leggi); };
    window.addEventListener("scroll", su, { passive: true });
    return () => { window.removeEventListener("scroll", su); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return attiva;
}

// Testata fissa: logo e chip delle sezioni. Fuori dal feed i chip portano al feed.
export function Testata({ attiva, onSezione }) {
  return (
    <header className="testa">
      <div className="testa-riga">
        <Link className="logo" to="home" onClick={(e) => { if (onSezione) { e.preventDefault(); onSezione("home"); } }}>Bevotoscano</Link>
        <span className="logo-claim">Il vino da vivere</span>
      </div>
      <nav className="testa-chips" aria-label="Sezioni">
        {SEZIONI.map((s) => (
          <Link
            key={s.id}
            to={s.id === "oroscopo" ? "gioca" : s.path}
            className={`testa-chip ${attiva === s.id ? "testa-chip--on" : ""}`}
            aria-current={attiva === s.id ? "true" : undefined}
            onClick={(e) => {
              if (onSezione) { e.preventDefault(); onSezione(s.id); }
              else if (s.id === "oroscopo") sessionStorage.setItem("bevotoscano-vai", "oroscopo");
            }}
          >{s.label}</Link>
        ))}
      </nav>
    </header>
  );
}

const giorno = (iso) => new Date(iso).getDate();
const quando = (iso) => {
  const d = new Date(iso);
  const g = d.toLocaleDateString("it-IT", { weekday: "short" }).replace(".", "");
  const m = d.toLocaleDateString("it-IT", { month: "short" }).replace(".", "");
  return `${g} · ${m} · ${d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
};
const TONI = ["plum", "wine", "dark"];
const SALVATI = "bevotoscano-ci-vado";
const leggiSalvati = () => { try { return JSON.parse(localStorage.getItem(SALVATI)) || {}; } catch { return {}; } };

function comeArrivi(e) {
  const p = (e.pickup || [])[0];
  if (p) return `Bus da ${p.nome}${p.orario ? `, ${p.orario}` : ""}`;
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

const FILTRI = [["tutti", "Tutti"], ["weekend", "Questo weekend"], ["senza-auto", "Senza auto"]];

function BloccoEventi({ filtroIniziale, apriElenco }) {
  const [eventi, setEventi] = useState(null);
  const [filtro, setFiltro] = useState(filtroIniziale || "tutti");
  const [salvati, setSalvati] = useState(leggiSalvati);
  const [tutti, setTutti] = useState(apriElenco);
  useEffect(() => { eventiPubblici().then(setEventi).catch(() => setEventi([])); }, []);
  useEffect(() => { if (filtroIniziale) setFiltro(filtroIniziale); }, [filtroIniziale]);
  useEffect(() => { if (apriElenco) setTutti(true); }, [apriElenco]);

  const lista = useMemo(() => (eventi || []).filter((e) =>
    filtro === "weekend" ? nelPeriodo(e, "weekend") : filtro === "senza-auto" ? senzaAuto(e) : true
  ).slice(0, 12), [eventi, filtro]);

  const ciVado = (id) => {
    const n = { ...salvati, [id]: !salvati[id] };
    setSalvati(n);
    try { localStorage.setItem(SALVATI, JSON.stringify(n)); } catch { /* niente */ }
  };

  return (
    <section id="sez-eventi" className="feed-sez">
      <div className="feed-head">
        <h2 className="feed-h2">Prossimi eventi</h2>
        <button className="link" onClick={() => setTutti((x) => !x)}>{tutti ? "Chiudi" : "Lista e mappa"}</button>
      </div>
      <div className="feed-filtri">
        {FILTRI.map(([id, label]) => (
          <button key={id} className={filtro === id ? "on" : ""} onClick={() => setFiltro(id)}>{label}</button>
        ))}
      </div>
      {!eventi && <p className="muted feed-pad">Carico…</p>}
      {eventi && lista.length === 0 && (
        <p className="muted feed-pad">{filtro === "tutti" ? "Ancora nessun evento in calendario. Torna presto, o segnalacene uno." : "Nessun evento con questo filtro, per ora."}</p>
      )}
      {lista.length > 0 && (
        <div className="feed-rail">
          {lista.map((e, i) => {
            const arrivo = senzaAuto(e) ? comeArrivi(e) : "";
            return (
              <article key={e.id} className="ev-card">
                <Link className={`ev-card-top ev-card-top--${TONI[i % 3]}`} to={eventoPercorso(e)}>
                  <span>
                    <b className="ev-card-giorno">{giorno(e.inizio)}</b>
                    <small className="ev-card-quando">{quando(e.inizio)}</small>
                  </span>
                  {e.prezzo && <span className="ev-card-prezzo">{e.prezzo}</span>}
                </Link>
                <div className="ev-card-body">
                  <Link className="ev-card-tit" to={eventoPercorso(e)}>{e.titolo}</Link>
                  <small className="ev-card-meta">📍 {e.comune}{e.esempio ? " · esempio" : ""}</small>
                  {arrivo && <span className="badge badge--gold ev-card-bus">🚌 {arrivo}</span>}
                  <div className="ev-card-act">
                    <button className={`btn ${salvati[e.id] ? "btn--gold" : "btn--primary"}`} onClick={() => ciVado(e.id)}>
                      {salvati[e.id] ? "Ci vado ✓" : "Ci vado?"}
                    </button>
                    <button className="ev-card-share" aria-label="Condividi" onClick={() => condividi(e.titolo, eventoPercorso(e))}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {eventi.length > 0 && (
            <button className="ev-card ev-card--tutti" onClick={() => setTutti(true)}>
              <strong>Vedi tutti</strong>
              <small>{eventi.length} eventi, lista e mappa</small>
            </button>
          )}
        </div>
      )}
      {tutti && <div className="feed-pad feed-dentro"><Eventi inFeed apri={apriElenco ? "vicino" : undefined} /></div>}
    </section>
  );
}

// Una domanda al giorno, uguale per tutti: cambia a mezzanotte.
function domandaDelGiorno() {
  const oggi = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const q = DOMANDE[oggi % DOMANDE.length];
  const giusta = q.r[0];
  const opzioni = [...q.r].sort((a, b) => ((a.length * 7 + oggi) % 5) - ((b.length * 7 + oggi) % 5) || a.localeCompare(b));
  return { testo: q.d, giusta, opzioni };
}

function BloccoGioca() {
  const q = useMemo(domandaDelGiorno, []);
  const [scelta, setScelta] = useState(null);
  return (
    <section id="sez-gioca" className="feed-sez">
      <div className="gioca-card">
        <span className="gioca-eyebrow">La domanda del giorno</span>
        <h2 className="gioca-q">{q.testo}</h2>
        <div className="gioca-opz">
          {q.opzioni.map((o) => {
            let cls = "gioca-o";
            if (scelta) cls += o === q.giusta ? " gioca-o--ok" : o === scelta ? " gioca-o--no" : " gioca-o--dim";
            return (
              <button key={o} className={cls} onClick={() => !scelta && setScelta(o)} disabled={!!scelta && o !== q.giusta && o !== scelta}>
                <span>{o}</span>
                {scelta && o === q.giusta && <span>✓</span>}
              </button>
            );
          })}
        </div>
        {scelta && (
          <p className="gioca-esito">{scelta === q.giusta ? "Esatto! Domani ne arriva un'altra." : `Era: ${q.giusta}. Domani ne arriva un'altra.`} Te la senti di farne dieci a tempo?</p>
        )}
        <div className="gioca-act">
          <Link className="btn btn--light" to="gioca/quiz">Gioca il quiz</Link>
          <Link className="btn btn--outline-light" to="gioca/classifica">Classifica</Link>
        </div>
      </div>
    </section>
  );
}

const dataBreve = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long" });

function BloccoOroscopo() {
  const oggi = new Date();
  const corrente = segnoDa(oggi.getMonth() + 1, oggi.getDate()) || SEGNI[0];
  const [id, setId] = useState(corrente.id);
  const s = SEGNI.find((x) => x.id === id);
  // i segni partono da quello del momento, così il primo chip è già quello giusto
  const i0 = SEGNI.indexOf(corrente);
  const ordine = [...SEGNI.slice(i0), ...SEGNI.slice(0, i0)];
  const t = MESE.testi?.[id];
  return (
    <section id="sez-oroscopo" className="feed-sez">
      <div className="feed-pad">
        <p className="eyebrow">{MESE.edizione}, fino al {dataBreve(MESE.al)}</p>
        <h2 className="feed-h2">L'oroscopo del vino</h2>
      </div>
      <div className="feed-rail feed-rail--chips">
        {ordine.map((x) => (
          <button key={x.id} className={`segno ${x.id === id ? "segno--on" : ""}`} onClick={() => setId(x.id)}>{x.simbolo} {x.segno}</button>
        ))}
      </div>
      {t && (
        <article className="oro-card">
          <div className="oro-card-head">
            <b>{s.segno}</b>
            <small>il tuo vitigno: <b>{s.vitigno}</b></small>
          </div>
          <h3>{t.titolo}</h3>
          <p>{t.testo}</p>
          <p className="oro-card-vino">{t.vino}</p>
          <Link className="btn btn--outline" to="gioca/oroscopo">Il tuo vitigno, da condividere</Link>
        </article>
      )}
    </section>
  );
}

const iniziale = (nome) => nome.replace(/^(Podere|Fattoria|Tenuta( di)?|La|L')\s*/i, "").charAt(0);

function BloccoCantine() {
  const [mappa, setMappa] = useState(false);
  return (
    <section id="sez-cantine" className="feed-sez">
      <div className="feed-head">
        <h2 className="feed-h2">Le cantine</h2>
        <button className="link" onClick={() => setMappa((x) => !x)}>{mappa ? "Chiudi" : "Mappa"}</button>
      </div>
      <button className="cantine-teaser feed-card" onClick={() => setMappa(true)}>
        <img src="/img/strada-bianca.jpg" alt="Strada bianca tra le vigne" loading="lazy" />
        <span>
          <strong>{CANTINE.length} piccoli produttori, scelti uno a uno</strong>
          <small>Si parte dalle colline pisane</small>
        </span>
      </button>
      <div className="feed-rail">
        {CANTINE.map((c) => (
          <Link key={c.id} className="cant" to={cantinaPercorso(c)}>
            <span className="cant-av">{iniziale(c.nome)}</span>
            <b>{c.nome}</b>
            <small>{c.comune}</small>
          </Link>
        ))}
      </div>
      {mappa && <div className="feed-pad feed-dentro"><Cantine inFeed /></div>}
      <a className="card card--quote feed-card" href={INSTAGRAM_URL} target="_blank" rel="noopener">
        <span className="quote">“Qual è il vino più toscano che hai?”</span>
        <small>Lo chiediamo a cantine, baristi ed enoteche. Le risposte sono su Instagram →</small>
      </a>
    </section>
  );
}

export default function Feed({ sezione = "home", filtro }) {
  const attiva = useSezioneVisibile((id) => {
    const s = SEZIONI.find((x) => x.id === id);
    const url = URL_DI(s.path);
    if (window.location.pathname !== url) window.history.replaceState(null, "", url);
    const m = metaPercorso(s.path === "home" ? "" : s.path);
    if (m) applicaMeta(m);
  });

  // Arrivo da un link (/cantine, /eventi/weekend…): scorro fino alla sezione.
  useEffect(() => {
    let id = sezione;
    try {
      const v = sessionStorage.getItem("bevotoscano-vai");
      if (v) { id = v; sessionStorage.removeItem("bevotoscano-vai"); }
    } catch { /* niente */ }
    if (id === "home") return;
    // aspetto un attimo che immagini ed eventi prendano il loro posto
    const t = setTimeout(() => scorriA(id, false), 60);
    const t2 = setTimeout(() => scorriA(id, false), 600);
    const annulla = () => { clearTimeout(t2); };
    window.addEventListener("touchstart", annulla, { once: true, passive: true });
    window.addEventListener("wheel", annulla, { once: true, passive: true });
    return () => { clearTimeout(t); clearTimeout(t2); window.removeEventListener("touchstart", annulla); window.removeEventListener("wheel", annulla); };
  }, [sezione, filtro]);

  const [filtroStoria, setFiltroStoria] = useState(null);
  const oggi = new Date();
  const segnoOggi = segnoDa(oggi.getMonth() + 1, oggi.getDate()) || SEGNI[0];
  const storia = (id, f) => () => { if (f) setFiltroStoria(f); scorriA(id); };

  return (
    <div className="feed">
      <Testata attiva={attiva} onSezione={(id) => scorriA(id)} />

      <section id="sez-home" className="hero-foto feed-hero">
        <img src="/img/colline.jpg" alt="Colline toscane" />
        <div className="hero-testo">
          <p className="eyebrow">Scopriamo le radici vitivinicole toscane</p>
          <h1>Il vino da vivere.</h1>
          <p>Eventi di vino, piccole cantine e giochi. Anche senza auto. Tutto qui, basta scorrere.</p>
        </div>
      </section>

      <div className="feed-rail storie">
        <button className="storia" onClick={storia("eventi", "weekend")}><span className="storia-ring"><span className="storia-in">🗓️</span></span>Weekend</button>
        <button className="storia" onClick={storia("eventi", "senza-auto")}><span className="storia-ring"><span className="storia-in storia-in--wine">🚌</span></span>Senza auto</button>
        <Link className="storia" to="gioca/quiz"><span className="storia-ring"><span className="storia-in storia-in--dark">⏱️</span></span>Quiz</Link>
        <button className="storia" onClick={storia("oroscopo")}><span className="storia-ring"><span className="storia-in storia-in--gold">{segnoOggi.simbolo}</span></span>Oroscopo</button>
        <button className="storia" onClick={storia("cantine")}><span className="storia-ring"><span className="storia-in"><img src="/img/strada-bianca.jpg" alt="" /></span></span>Cantine</button>
        <a className="storia" href={INSTAGRAM_URL} target="_blank" rel="noopener"><span className="storia-ring storia-ring--grigio"><span className="storia-in storia-in--bianco">🎤</span></span>Reel</a>
      </div>

      <BloccoEventi filtroIniziale={filtroStoria || (filtro === "weekend" || filtro === "senza-auto" ? filtro : null)} apriElenco={filtro === "vicino"} />
      <BloccoGioca />
      <BloccoOroscopo />
      <BloccoCantine />

      <section className="feed-sez feed-pad feed-fine">
        <div className="card chi-siamo" id="chi-siamo">
          <p className="eyebrow">Chi siamo</p>
          <strong className="chi-title">Partiamo da Terricciola</strong>
          <p className="muted">Una Città del Vino sulle colline pisane: più di venti aziende agricole per poco più di 4.500 abitanti. Un posto spesso attraversato, a volte scelto per dormire, raramente vissuto davvero.</p>
          <p className="muted">Bevotoscano nasce da una domanda: può il vino diventare la chiave per scoprire una Toscana meno battuta? Siamo un ponte tra il mondo del turismo e quello del vino, dalla parte dei piccoli produttori.</p>
          <p className="muted"><b>Ronny Bellagotti</b>, digital e territorio · <b>Marianna Dimeo</b>, sommelier FISAR</p>
          <small>Progetto nato nella pre-incubazione della Call for Tourism di Murate Idea Park.</small>
        </div>
        <div className="card card--plum">
          <strong>Organizzi un evento del vino?</strong>
          <p>Cantine, enoteche, aziende bus: segnalarlo su Bevotoscano è gratis.</p>
          <Link className="btn btn--light" to="segnala">Segnala un evento</Link>
        </div>
        <p className="tiny center">🍷 Bevi responsabilmente: se bevi, non guidare.</p>
      </section>
    </div>
  );
}
