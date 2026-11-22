import { useEffect, useState } from "react";
import { ESPERIENZE, CASSA, INSTAGRAM_URL } from "./data.js";
import { saveLead, isEmail } from "./leads.js";
import Oroscopo from "./games/Oroscopo.jsx";
import QuizToscana from "./games/QuizToscana.jsx";
import Eventi from "./eventi/Eventi.jsx";
import Segnala from "./eventi/Segnala.jsx";
import Admin from "./eventi/Admin.jsx";
import Notte, { TestataNotte } from "./home/Notte.jsx";
import Cantine from "./home/Cantine.jsx";
import { go, percorsoAttuale, suCambioPercorso } from "./nav.js";
import { metaPercorso, applicaMeta, FILTRI_EVENTI } from "./seo.js";

// Indirizzi veri per ogni sezione: bevotoscano.com/gioca/quiz porta dritto al quiz.
function useRoute() {
  const read = () => percorsoAttuale().split("/");
  const [route, setRoute] = useState(read);
  useEffect(() => suCambioPercorso(() => setRoute(read())), []);
  return route;
}

// Le sezioni che vivono nella schermata unica (la mappa): /, /eventi, /gioca, /cantine
// e le scorciatoie /eventi/weekend, /eventi/senza-auto, /eventi/vicino.
const PAGINE_A_PARTE = ["esperienze", "cassa", "segnala", "admin"];
const nelFeed = (section, sub) =>
  !PAGINE_A_PARTE.includes(section) &&
  !(section === "eventi" && sub && !FILTRI_EVENTI.includes(sub)) &&
  !(section === "cantine" && sub) &&
  !(section === "gioca" && sub);

export default function App() {
  const [section, sub] = useRoute();

  // Titolo e descrizione della pagina (la scheda di un evento imposta i suoi).
  useEffect(() => {
    const m = metaPercorso([section, sub].filter(Boolean).join("/"));
    if (m) applicaMeta(m);
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

  if (nelFeed(section, sub)) {
    const tab = section === "cantine" || section === "gioca" ? section : "eventi";
    return <Notte tab={tab} filtro={section === "eventi" ? sub : undefined} />;
  }

  // Le pagine a sé (un evento, una cantina, segnala…) tengono la stessa testata.
  const attiva = ["eventi", "cantine"].includes(section) ? section : null;
  return (
    <div className="app">
      <TestataNotte attiva={attiva} />
      <main className="page fade" key={`${section}/${sub || ""}`}>
        {section === "cantine" && <Cantine apri={sub} />}
        {section === "esperienze" && <Esperienze />}
        {section === "cassa" && <Cassa />}
        {section === "eventi" && <Eventi apri={sub} />}
        {section === "segnala" && <Segnala />}
        {section === "admin" && <Admin />}
      </main>
    </div>
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
