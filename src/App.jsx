import { useEffect, useState } from "react";
import { ESPERIENZE, CASSA, GIOCHI, INSTAGRAM_URL, CONTACT_EMAIL } from "./data.js";
import { saveLead, isEmail } from "./leads.js";
import Oroscopo from "./games/Oroscopo.jsx";
import QuizToscana from "./games/QuizToscana.jsx";
import Eventi from "./eventi/Eventi.jsx";
import Segnala from "./eventi/Segnala.jsx";
import Admin from "./eventi/Admin.jsx";
import Home from "./home/Home.jsx";
import Cantine from "./home/Cantine.jsx";

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
        <span className="logo-claim">Il vino da vivere</span>
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


function Tile({ icon, title, text, onClick }) {
  return (
    <button className="tile" onClick={onClick}>
      <span className="tile-icon">{icon}</span>
      <strong>{title}</strong>
      <small>{text}</small>
    </button>
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
