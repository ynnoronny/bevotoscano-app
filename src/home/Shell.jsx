import { useEffect, useMemo, useRef, useState } from "react";
import { INSTAGRAM_URL } from "../data.js";
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
import { go } from "../nav.js";
import { eventoPercorso, FILTRI_EVENTI } from "../seo.js";

// La schermata unica di Bevotoscano: una cornice fissa, uguale su telefono e computer.
// In alto il marchio e le pills (scorrono col dito), sotto scorre solo il contenuto
// della pill scelta: eventi, cantine, articoli del blog, classifica del gioco.

export const PILLS = [
  { id: "eventi", label: "Eventi", to: "eventi" },
  { id: "cantine", label: "Cantine", to: "cantine" },
  { id: "blog", label: "Blog", to: "blog" },
  { id: "gioca", label: "Classifica", to: "gioca" },
];

export default function Shell({ section, sub, children }) {
  const pill = section === "home" ? "eventi" : section;
  const area = useRef(null);
  // a ogni cambio di pagina si riparte dall'alto del contenuto
  useEffect(() => { area.current?.scrollTo(0, 0); }, [section, sub]);

  return (
    <div className="shell">
      <header className="shell-testa">
        <div className="shell-riga">
          <Link to="home" className="shell-marchio"><span className="shell-logo">Bevotoscano</span><em>Il vino da vivere</em></Link>
          <Link to="segnala" className="shell-segnala">Segnala un evento</Link>
        </div>
        <nav className="shell-pills" aria-label="Sezioni">
          {PILLS.map((p) => (
            <Link key={p.id} to={p.to} className={`shell-pill ${pill === p.id ? "on" : ""}`} aria-current={pill === p.id ? "page" : undefined}>{p.label}</Link>
          ))}
          <Link to="gioca/quiz" className="shell-pill shell-pill--gioca">Gioca ora</Link>
        </nav>
      </header>
      <main className="shell-area" ref={area}>
        <div className="shell-dentro">{children || <Contenuto section={section} sub={sub} />}</div>
      </main>
    </div>
  );
}

function Contenuto({ section, sub }) {
  if (section === "cantine") return <div className="page shell-pagina"><Cantine apri={sub} /></div>;
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
const SALVATI = "bevotoscano-ci-vado";
const leggi = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const scrivi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* niente */ } };
const giorno = (iso) => new Date(iso).getDate();
const mese = (iso) => new Date(iso).toLocaleDateString("it-IT", { month: "short" }).replace(".", "").toUpperCase();
const quando = (iso) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("it-IT", { weekday: "long" })} ${d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
};
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

function FeedEventi({ filtro }) {
  const [eventi, setEventi] = useState(null);
  const [centro, setCentro] = useState(() => leggi(POS_KEY, null));
  const [f, setF] = useState({ senzaAuto: filtro === "senza-auto", weekend: filtro === "weekend" });
  const [mappa, setMappa] = useState(false);
  const [salvati, setSalvati] = useState(() => leggi(SALVATI, {}));
  useEffect(() => { eventiPubblici().then(setEventi).catch(() => setEventi([])); }, []);
  useEffect(() => { scrivi(POS_KEY, centro); }, [centro]);
  useEffect(() => {
    if (filtro === "senza-auto" || filtro === "weekend") setF({ senzaAuto: filtro === "senza-auto", weekend: filtro === "weekend" });
    if (filtro === "vicino" && !centro) posizioneAttuale().then(setCentro).catch(() => {});
  }, [filtro]);

  const lista = useMemo(() => (eventi || [])
    .filter((e) => (!f.senzaAuto || senzaAuto(e)) && (!f.weekend || nelPeriodo(e, "weekend")))
    .map((e) => ({ ...e, d: km(centro, e) }))
    .sort((a, b) => (centro && a.d != null && b.d != null ? a.d - b.d : a.inizio.localeCompare(b.inizio))),
  [eventi, f, centro]);
  const ciVado = (id) => { const n = { ...salvati, [id]: !salvati[id] }; setSalvati(n); scrivi(SALVATI, n); };

  return (
    <div className="feed">
      <div className="feed-filtri">
        <Partenza centro={centro} setCentro={setCentro} />
        <button className={f.senzaAuto ? "on" : ""} aria-pressed={f.senzaAuto} onClick={() => setF((x) => ({ ...x, senzaAuto: !x.senzaAuto }))}>Senza auto</button>
        <button className={f.weekend ? "on" : ""} aria-pressed={f.weekend} onClick={() => setF((x) => ({ ...x, weekend: !x.weekend }))}>Questo weekend</button>
        <button className={mappa ? "on" : ""} aria-pressed={mappa} onClick={() => setMappa((x) => !x)}>Mappa</button>
      </div>
      {mappa && eventi && <div className="feed-mappa"><Mappa eventi={lista} centro={centro} onApri={(e) => go(eventoPercorso(e))} /></div>}
      {!eventi && <p className="feed-vuoto">Carico gli eventi…</p>}
      {eventi && lista.length === 0 && <p className="feed-vuoto">Nessun evento con questi filtri, per ora. Prova a toglierne uno, o segnalacene uno tu.</p>}
      <div className="feed-griglia">
        {lista.map((e, i) => {
          const arrivo = comeArrivi(e, centro);
          return (
            <article key={e.id} className={`ev ev--${["viola", "vino", "sole"][i % 3]}`}>
              <Link to={eventoPercorso(e)} className="ev-testa">
                <span className="ev-data"><b>{giorno(e.inizio)}</b><small>{mese(e.inizio)}</small></span>
                {e.prezzo && <span className="ev-prezzo">{e.prezzo}</span>}
              </Link>
              <div className="ev-corpo">
                <Link to={eventoPercorso(e)} className="ev-titolo">{e.titolo}</Link>
                <small className="ev-meta">{quando(e.inizio)} · {e.comune}{e.d != null ? ` · ${fmtKm(e.d)}` : ""}{e.esempio ? " · esempio" : ""}</small>
                {arrivo && <span className="ev-bus">{arrivo}</span>}
                <div className="ev-azioni">
                  <button className={`ev-vado ${salvati[e.id] ? "on" : ""}`} aria-pressed={!!salvati[e.id]} onClick={() => ciVado(e.id)}>{salvati[e.id] ? "Ci vado!" : "Ci vado?"}</button>
                  <button className="ev-share" aria-label="Condividi" onClick={() => condividi(e.titolo, eventoPercorso(e))}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>
                  </button>
                </div>
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
    <label className={`feed-parto ${centro ? "on" : ""}`}>
      <span>Parto da</span>
      <select value={valore} onChange={(e) => scegli(e.target.value)}>
        <option value="">tutta la Toscana</option>
        <option value="qui">dove sono adesso</option>
        {CITTA.map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
      </select>
    </label>
  );
}

function FineFeed() {
  return (
    <div className="feed-fine">
      <a className="feed-ig" href={INSTAGRAM_URL} target="_blank" rel="noopener">
        <strong>“Qual è il vino più toscano che hai?”</strong>
        <small>Lo chiediamo a ogni cantina. Le risposte sono su Instagram.</small>
      </a>
      <p className="tiny center">Bevi responsabilmente: se bevi, non guidare.</p>
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
      <Link className="link" to="blog">← Tutti gli articoli</Link>
      <span className="art-tag">{a.tag} · {dataArticolo(a.data)}</span>
      <h1 className="page-title">{a.titolo}</h1>
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
          <small>IL QUIZ INFINITO</small>
          <strong>Quanto ne sai di vino toscano?</strong>
          <p>Domande senza fine. Ogni 3 risposte giuste guadagni una vita; se sbagli ne perdi una. Sbagli senza vite? Fine della partita.</p>
          <Link to="gioca/quiz" className="gioco-via">Gioca ora</Link>
        </section>
        <section className="gioco-classifica">
          <div className="gioco-classifica-testa"><strong>Classifica</strong><small>Da oggi si riparte tutti da zero</small></div>
          <Classifica limite={50} />
        </section>
        <section className="gioco-giorno">
          <small>DOMANDA DEL GIORNO</small>
          <strong>{q.testo}</strong>
          <div className="gioco-opz">
            {q.opzioni.map((o) => {
              const cls = !scelta ? "" : o === q.giusta ? "ok" : o === scelta ? "no" : "spento";
              return <button key={o} className={cls} disabled={!!scelta} onClick={() => setScelta(o)}>{o}</button>;
            })}
          </div>
          {scelta && <p>{scelta === q.giusta ? "Esatto!" : `Era: ${q.giusta}.`} Domani ne arriva un'altra.</p>}
        </section>
        <Oroscopo />
      </div>
      <FineFeed />
    </div>
  );
}

const dataBreve = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long" });

function Oroscopo() {
  const d = new Date();
  const corrente = segnoDa(d.getMonth() + 1, d.getDate()) || SEGNI[0];
  const [id, setId] = useState(corrente.id);
  const s = SEGNI.find((x) => x.id === id);
  const t = MESE.testi?.[id];
  const i0 = SEGNI.indexOf(corrente);
  const ordine = [...SEGNI.slice(i0), ...SEGNI.slice(0, i0)];
  return (
    <section className="gioco-oro">
      <small>OROSCOPO DEL VINO · fino al {dataBreve(MESE.al)}</small>
      <div className="gioco-segni">
        {ordine.map((x) => <button key={x.id} className={x.id === id ? "on" : ""} onClick={() => setId(x.id)}>{x.segno}</button>)}
      </div>
      {t && (
        <>
          <strong>{t.titolo}</strong>
          <span className="gioco-oro-vit">Il tuo vitigno: {s.vitigno}</span>
          <p>{t.testo}</p>
          <p className="gioco-oro-vino">{t.vino}</p>
        </>
      )}
      <Link to="gioca/oroscopo" className="gioco-via gioco-via--chiaro">Il tuo vitigno, da condividere</Link>
    </section>
  );
}
