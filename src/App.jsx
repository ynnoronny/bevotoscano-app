import { useEffect, useState } from "react";
import { CANTINE, ESPERIENZE, CASSA, GIOCHI, INSTAGRAM_URL, CONTACT_EMAIL } from "./data.js";
import { saveLead, isEmail } from "./leads.js";
import Oroscopo from "./games/Oroscopo.jsx";
import QuizToscana from "./games/QuizToscana.jsx";
import Eventi from "./eventi/Eventi.jsx";
import Segnala from "./eventi/Segnala.jsx";
import Admin from "./eventi/Admin.jsx";

// Navigazione con l'hash, così ogni sezione ha il suo link condivisibile:
// bevotoscano.com/#/gioca/quiz porta dritto al quiz.
function useRoute() {
  const read = () => (window.location.hash.replace(/^#\/?/, "") || "home").split("/");
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
const go = (path) => { window.location.hash = `/${path}`; };

const TABS = [
  { id: "home", label: "Scopri", icon: "🏡" },
  { id: "eventi", label: "Eventi", icon: "📅" },
  { id: "cantine", label: "Cantine", icon: "🍷" },
  { id: "gioca", label: "Gioca", icon: "🎲" },
];

export default function App() {
  const [section, sub] = useRoute();

  // Un minigioco aperto prende tutto lo schermo.
  if (section === "gioca" && (sub === "oroscopo" || sub === "vitigno")) {
    return <Oroscopo onExit={() => go("gioca")} />;
  }
  if (section === "gioca" && sub === "quiz") {
    return <QuizToscana onExit={() => go("gioca")} />;
  }
  if (section === "gioca" && sub === "classifica") {
    return <QuizToscana iniziale="classifica" onExit={() => go("gioca")} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="logo" onClick={() => go("home")}>Bevotoscano</button>
      </header>
      <main className="page fade" key={section}>
        {section === "home" && <Home />}
        {section === "cantine" && <Cantine />}
        {section === "esperienze" && <Esperienze />}
        {section === "cassa" && <Cassa />}
        {section === "gioca" && <Giochi />}
        {section === "eventi" && <Eventi apri={sub} />}
        {section === "segnala" && <Segnala />}
        {section === "admin" && <Admin />}
        {!TABS.some((t) => t.id === section) && !["esperienze", "cassa", "segnala", "admin"].includes(section) && <Home />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${section === t.id ? "tab--on" : ""}`} onClick={() => go(t.id)}>
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function Home() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Vino, territori, persone vere</p>
        <h1>La Toscana del vino, <em>da vicino</em>.</h1>
        <p>Raccontiamo le piccole cantine toscane che non trovi su Google, e ti portiamo a conoscerle.</p>
      </section>

      <button className="card card--game card--eventi" onClick={() => go("eventi")}>
        <span className="card-emoji">🚌</span>
        <span>
          <strong>Eventi del vino vicino a te</strong>
          <small>Degustazioni, cene in cantina, tour. Anche senza auto.</small>
        </span>
        <span className="chev">→</span>
      </button>
      <button className="card card--game" onClick={() => go("gioca/quiz")}>
        <span className="card-emoji">⏱️</span>
        <span>
          <strong>Quanto ne sai di vino toscano?</strong>
          <small>Quiz a tempo, punteggio e classifica mondiale.</small>
        </span>
        <span className="chev">→</span>
      </button>
      <button className="card card--game card--game-alt" onClick={() => go("gioca/oroscopo")}>
        <span className="card-emoji">♌</span>
        <span>
          <strong>L'oroscopo del vino</strong>
          <small>Il tuo segno, il tuo vitigno toscano.</small>
        </span>
        <span className="chev">→</span>
      </button>

      <h2 className="section-title">Cosa trovi qui</h2>
      <div className="grid">
        <Tile icon="🍷" title="Cantine" text="Piccoli produttori, scelti uno a uno" onClick={() => go("cantine")} />
        <Tile icon="📅" title="Eventi" text="Gli eventi del vino, con i pickup vicini" onClick={() => go("eventi")} />
        <Tile icon="✍️" title="Segnala" text="Organizzi un evento? Segnalalo gratis" onClick={() => go("segnala")} />
        <Tile icon="🎲" title="Gioca" text="Quiz a tempo e oroscopo del vino" onClick={() => go("gioca")} />
      </div>

      <a className="card card--quote" href={INSTAGRAM_URL} target="_blank" rel="noopener">
        <span className="quote">“Qual è il vino più toscano che hai?”</span>
        <small>Lo chiediamo a cantine, baristi ed enoteche. Guarda le risposte su Instagram →</small>
      </a>

      <section className="card">
        <strong>Organizzi un evento del vino?</strong>
        <p className="muted">Cantine, enoteche, aziende bus: segnalarlo su Bevotoscano è gratis.</p>
        <div className="row">
          <button className="btn btn--outline" onClick={() => go("segnala")}>Segnala un evento</button>
          <a className="link" href={`mailto:${CONTACT_EMAIL}?subject=Bevotoscano`}>Scrivici</a>
        </div>
      </section>
    </>
  );
}

function Tile({ icon, title, text, onClick }) {
  return (
    <button className="tile" onClick={onClick}>
      <span className="tile-icon">{icon}</span>
      <strong>{title}</strong>
      <small>{text}</small>
    </button>
  );
}

function Cantine() {
  const [zona, setZona] = useState("Tutte");
  const zone = ["Tutte", ...new Set(CANTINE.map((c) => c.zona))];
  const list = zona === "Tutte" ? CANTINE : CANTINE.filter((c) => c.zona === zona);
  return (
    <>
      <h1 className="page-title">Cantine</h1>
      <p className="muted">Le piccole realtà che stiamo conoscendo. La mappa cresce a ogni evento.</p>
      <div className="chips">
        {zone.map((z) => (
          <button key={z} className={`chip ${z === zona ? "chip--on" : ""}`} onClick={() => setZona(z)}>{z}</button>
        ))}
      </div>
      <div className="list">
        {list.map((c) => (
          <article key={c.id} className="card cantina">
            <div className="cantina-head">
              <span className="avatar">{c.nome.replace(/^(Podere|Fattoria|Tenuta( di)?|La|L')\s*/i, "").charAt(0)}</span>
              <div>
                <strong>{c.nome}</strong>
                <small>{c.comune} · {c.zona}</small>
              </div>
            </div>
            {c.vinoPiuToscano && <p className="cantina-wine">Il suo vino più toscano: <b>{c.vinoPiuToscano}</b></p>}
            <div className="row">
              {c.reel && <a className="link" href={c.reel} target="_blank" rel="noopener">Guarda il reel</a>}
              {c.sito && <a className="link" href={c.sito} target="_blank" rel="noopener">Sito della cantina</a>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function Esperienze() {
  return (
    <>
      <h1 className="page-title">Esperienze</h1>
      <p className="muted">Il vino si capisce meglio con chi lo fa. Ecco cosa stiamo preparando.</p>
      <div className="list">
        {ESPERIENZE.map((e) => (
          <article key={e.id} className="card">
            <div className="cantina-head">
              <span className="avatar avatar--emoji">{e.emoji}</span>
              <div>
                <strong>{e.titolo}</strong>
                <small>{e.sottotitolo}</small>
              </div>
            </div>
            <p className="muted">{e.testo}</p>
            {e.stato === "social" ? (
              <a className="btn btn--outline" href={INSTAGRAM_URL} target="_blank" rel="noopener">Guarda su Instagram</a>
            ) : (
              <InterestForm tipo={`esperienza-${e.id}`} cta="Avvisami quando apre" done="Fatto! Ti scriviamo appena ci sono le date 🍷" />
            )}
          </article>
        ))}
      </div>
    </>
  );
}

function Cassa() {
  return (
    <>
      <h1 className="page-title">{CASSA.titolo}</h1>
      <div className="card card--cassa">
        <div className="big-emoji">📦</div>
        <p>{CASSA.testo}</p>
        <ul className="checks">
          {CASSA.punti.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </div>
      <section className="card">
        <strong>Mettiti in lista</strong>
        <p className="muted">La prima cassa esce presto. Chi è in lista la vede per primo.</p>
        <InterestForm tipo="cassa" cta="Voglio la cassa" done="Sei in lista! Ti avvisiamo per primo 📦" />
      </section>
    </>
  );
}

function Giochi() {
  return (
    <>
      <h1 className="page-title">Gioca</h1>
      <p className="muted">La parte gaming di Bevotoscano: impari il vino toscano giocando, e sfidi il mondo.</p>
      <div className="list">
        {GIOCHI.map((g) => (
          <button key={g.id} className={`card card--game ${g.pronto ? "" : "card--soon"}`} onClick={() => g.pronto && go(`gioca/${g.id}`)} disabled={!g.pronto}>
            <span className="card-emoji">{g.emoji}</span>
            <span>
              <strong>{g.titolo}</strong>
              <small>{g.pronto ? g.sottotitolo : "Prossimamente"}</small>
            </span>
            <span className="chev">{g.pronto ? "→" : "🔒"}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function InterestForm({ tipo, cta, done }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  if (sent) return <p className="ok">{done}</p>;
  return (
    <form className="inline-form" onSubmit={(e) => {
      e.preventDefault();
      if (!isEmail(email)) return setErr("Email non valida");
      saveLead(tipo, { email });
      setSent(true);
    }}>
      <input className="input" type="email" placeholder="La tua email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} />
      <button className="btn btn--primary" type="submit">{cta}</button>
      {err && <span className="error">{err}</span>}
    </form>
  );
}
