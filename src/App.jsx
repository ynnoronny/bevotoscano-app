import { useEffect, useState } from "react";
import { ESPERIENZE, CASSA, INSTAGRAM_URL } from "./data.js";
import { saveLead, isEmail } from "./leads.js";
import Oroscopo from "./games/Oroscopo.jsx";
import QuizToscana from "./games/QuizToscana.jsx";
import Admin from "./eventi/Admin.jsx";
import Shell from "./home/Shell.jsx";
import { go, percorsoAttuale, suCambioPercorso } from "./nav.js";
import { metaPercorso, applicaMeta, articoloLd } from "./seo.js";
import { articolo } from "./blog.js";

// Indirizzi veri per ogni sezione: bevotoscano.com/gioca/quiz porta dritto al quiz.
function useRoute() {
  const read = () => percorsoAttuale().split("/");
  const [route, setRoute] = useState(read);
  useEffect(() => suCambioPercorso(() => setRoute(read())), []);
  return route;
}

export default function App() {
  const [section, sub] = useRoute();

  // Titolo e descrizione della pagina (la scheda di un evento imposta i suoi).
  useEffect(() => {
    const m = metaPercorso([section, sub].filter(Boolean).join("/"));
    const a = section === "blog" && sub && articolo(sub);
    if (m) applicaMeta(m, a ? articoloLd(a) : undefined);
  }, [section, sub]);

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

  if (section === "admin") return <div className="app"><main className="page"><Admin /></main></div>;

  // Tutto il resto vive nella schermata fissa: pills in alto, sotto scorre solo il contenuto.
  const aParte = section === "esperienze" ? <Esperienze /> : section === "cassa" ? <Cassa /> : null;
  return (
    <Shell section={section || "home"} sub={sub}>
      {aParte && <div className="page shell-pagina">{aParte}</div>}
    </Shell>
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
