import { useEffect, useState } from "react";
import { CANTINE, INSTAGRAM_URL } from "../data.js";
import { eventiPubblici } from "../eventi/api.js";
import { senzaAuto } from "../eventi/shared.js";
import { go } from "../nav.js";

const giorno = (iso) => new Date(iso).toLocaleDateString("it-IT", { day: "numeric" });
const mese = (iso) => new Date(iso).toLocaleDateString("it-IT", { month: "short" }).replace(".", "");
const giornoSett = (iso) => new Date(iso).toLocaleDateString("it-IT", { weekday: "short" }).replace(".", "");
const ora = (iso) => new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

export default function Home() {
  const [eventi, setEventi] = useState(null);
  useEffect(() => { eventiPubblici().then(setEventi).catch(() => setEventi([])); }, []);
  const prossimi = (eventi || []).slice(0, 8);

  return (
    <>
      <section className="hero-foto">
        <img src="/img/colline.jpg" alt="Colline toscane" />
        <div className="hero-testo">
          <p className="eyebrow">Scopriamo le radici vitivinicole toscane</p>
          <h1>Il vino da vivere.</h1>
          <p>Eventi di vino, territori, persone. Le piccole cantine toscane e il modo per andarle a trovare, anche senza auto.</p>
        </div>
      </section>

      <div className="scorciatoie">
        <button onClick={() => go("eventi/vicino")}><span>📍</span>Vicino a me</button>
        <button onClick={() => go("eventi/weekend")}><span>🗓️</span>Questo weekend</button>
        <button onClick={() => go("eventi/senza-auto")}><span>🚌</span>Senza auto</button>
      </div>

      <section className="blocco">
        <div className="blocco-head">
          <h2 className="section-title">Prossimi eventi</h2>
          <button className="link" onClick={() => go("eventi")}>Tutti gli eventi →</button>
        </div>
        {!eventi && <p className="muted">Carico…</p>}
        {eventi && prossimi.length === 0 && <p className="muted">Ancora nessun evento in calendario. Torna presto, o segnalacene uno.</p>}
        <div className="carosello">
          {prossimi.map((e) => (
            <button key={e.id} className="ev-mini" onClick={() => go(`eventi/${e.id}`)}>
              <span className="ev-data">
                <small>{giornoSett(e.inizio)}</small>
                <b>{giorno(e.inizio)}</b>
                <small>{mese(e.inizio)}</small>
              </span>
              <span className="ev-corpo">
                <strong>{e.titolo}</strong>
                <small>{e.comune} · {ora(e.inizio)}</small>
                <span className="badges">
                  {senzaAuto(e) && <span className="badge badge--gold">🚌 Senza auto</span>}
                  {e.esempio && <span className="badge badge--demo">Esempio</span>}
                </span>
              </span>
            </button>
          ))}
          {eventi && eventi.length > 0 && (
            <button className="ev-mini ev-mini--tutti" onClick={() => go("eventi")}>
              <strong>Vedi tutti</strong>
              <small>{eventi.length} eventi in Toscana</small>
            </button>
          )}
        </div>
      </section>

      <section className="blocco">
        <h2 className="section-title">Gioca con il vino toscano</h2>
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
      </section>

      <button className="cantine-teaser" onClick={() => go("cantine")}>
        <img src="/img/strada-bianca.jpg" alt="" />
        <span>
          <small className="eyebrow">Le cantine</small>
          <strong>{CANTINE.length} piccoli produttori, scelti uno a uno</strong>
          <small>Si parte dalle colline pisane →</small>
        </span>
      </button>

      <a className="card card--quote" href={INSTAGRAM_URL} target="_blank" rel="noopener">
        <span className="quote">“Qual è il vino più toscano che hai?”</span>
        <small>Lo chiediamo a cantine, baristi ed enoteche. Guarda le risposte su Instagram →</small>
      </a>

      <section className="card chi-siamo" id="chi-siamo">
        <p className="eyebrow">Chi siamo</p>
        <strong className="chi-title">Partiamo da Terricciola</strong>
        <p className="muted">Una Città del Vino sulle colline pisane: più di venti aziende agricole per poco più di 4.500 abitanti. Un posto spesso attraversato, a volte scelto per dormire, raramente vissuto davvero.</p>
        <p className="muted">Bevotoscano nasce da una domanda: può il vino diventare la chiave per scoprire una Toscana meno battuta? Siamo un ponte tra il mondo del turismo e quello del vino, dalla parte dei piccoli produttori.</p>
        <p className="muted"><b>Ronny Bellagotti</b>, digital e territorio · <b>Marianna Dimeo</b>, sommelier FISAR</p>
        <small>Progetto nato nella pre-incubazione della Call for Tourism di Murate Idea Park.</small>
      </section>

      <section className="card card--plum">
        <strong>Organizzi un evento del vino?</strong>
        <p>Cantine, enoteche, aziende bus: segnalarlo su Bevotoscano è gratis.</p>
        <button className="btn btn--light" onClick={() => go("segnala")}>Segnala un evento</button>
      </section>
      <p className="tiny center">🍷 Bevi responsabilmente: se bevi, non guidare.</p>
    </>
  );
}
