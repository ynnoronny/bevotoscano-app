import { useEffect, useRef, useState } from "react";
import { DOMANDE, DOMANDE_PER_PARTITA, SECONDI_PER_DOMANDA } from "./quizData.js";
import { inviaPunteggio, PAESI, MODALITA } from "../leaderboard.js";
import Classifiche from "./Classifiche.jsx";
import ShareButton from "./ShareButton.jsx";

const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const prepara = (q) => ({ ...q, giusta: q.r[0], opzioni: shuffle(q.r) });
const perLivello = (l) => shuffle(DOMANDE.filter((q) => q.livello === l));

// Sfida da 10: 3 facili, 4 medie, 3 difficili.
const partitaClassica = () => [...perLivello(1).slice(0, 3), ...perLivello(2).slice(0, 4), ...perLivello(3).slice(0, 3)].slice(0, DOMANDE_PER_PARTITA).map(prepara);
// All Time: tutte le domande, dalle facili alle difficili, finché non cadi.
const partitaAllTime = () => [...perLivello(1), ...perLivello(2), ...perLivello(3)].map(prepara);

const GRADIENTE = "linear-gradient(170deg, #2A1530 0%, #432543 45%, #722F37 80%, #C9A96E 100%)";

const titoloClassica = (c) =>
  c >= 9 ? ["Gran Sommelier di Toscana", "🏆"] : c >= 7 ? ["Enologo di bottega", "🍷"] : c >= 4 ? ["Bevitore curioso", "🍇"] : ["Turista del vino", "🧳"];
const titoloAllTime = (c, finite) =>
  finite ? ["Leggenda del vino toscano", "👑"] :
  c >= 80 ? ["Leggenda del vino toscano", "👑"] : c >= 50 ? ["Gran Sommelier di Toscana", "🏆"] : c >= 25 ? ["Enologo di bottega", "🍷"] : c >= 10 ? ["Bevitore curioso", "🍇"] : ["Turista del vino", "🧳"];

export default function QuizToscana({ onExit, iniziale = "start" }) {
  const [fase, setFase] = useState(iniziale); // start | gioco | fine | classifica
  const [modalita, setModalita] = useState("classica");
  const [domande, setDomande] = useState([]);
  const [i, setI] = useState(0);
  const [tempo, setTempo] = useState(SECONDI_PER_DOMANDA);
  const [scelta, setScelta] = useState(null); // risposta data, o "__tempo" / "__uscito"
  const [punti, setPunti] = useState(0);
  const [corrette, setCorrette] = useState(0);
  const [ultimiPunti, setUltimiPunti] = useState(0);
  const [erroriDiFila, setErroriDiFila] = useState(0);
  const [ultimaChance, setUltimaChance] = useState(false);
  const [finite, setFinite] = useState(false); // All Time: risposto a tutto il mazzo
  const inizio = useRef(0);

  const parti = (mod) => {
    setModalita(mod);
    setDomande(mod === "alltime" ? partitaAllTime() : partitaClassica());
    setI(0); setPunti(0); setCorrette(0); setScelta(null);
    setErroriDiFila(0); setUltimaChance(false); setFinite(false);
    setFase("gioco");
  };

  useEffect(() => {
    if (fase !== "gioco" || scelta) return;
    inizio.current = performance.now();
    setTempo(SECONDI_PER_DOMANDA);
    const t = setInterval(() => {
      const rest = SECONDI_PER_DOMANDA - (performance.now() - inizio.current) / 1000;
      if (rest <= 0) { clearInterval(t); setTempo(0); rispondi("__tempo"); }
      else setTempo(rest);
    }, 100);
    return () => clearInterval(t);
  }, [fase, i, scelta]); // eslint-disable-line react-hooks/exhaustive-deps

  // Niente aiutini: se esci dall'app durante una domanda, la domanda è persa.
  useEffect(() => {
    if (fase !== "gioco") return;
    const on = () => { if (document.hidden) rispondi("__uscito"); };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [fase, i, scelta]); // eslint-disable-line react-hooks/exhaustive-deps

  function rispondi(r) {
    if (scelta) return;
    const q = domande[i];
    const giusta = r === q.giusta;
    let guadagno = 0;
    let finita = false;

    if (modalita === "classica") {
      if (giusta) {
        const rest = Math.max(0, SECONDI_PER_DOMANDA - (performance.now() - inizio.current) / 1000);
        guadagno = 50 * q.livello + Math.round((100 * rest) / SECONDI_PER_DOMANDA);
      }
      finita = i + 1 >= domande.length;
    } else {
      if (giusta) {
        guadagno = 1;
        setErroriDiFila(0);
        setUltimaChance(false);
      } else if (ultimaChance) {
        finita = true; // sbagliata anche l'ultima chance
      } else {
        const e = erroriDiFila + 1;
        setErroriDiFila(e);
        if (e >= 2) setUltimaChance(true);
      }
      if (!finita && i + 1 >= domande.length) { finita = true; setFinite(true); }
    }

    if (giusta) setCorrette((c) => c + 1);
    setUltimiPunti(guadagno);
    setPunti((p) => p + guadagno);
    setScelta(r);
    setTimeout(() => {
      if (finita) setFase("fine");
      else { setI(i + 1); setScelta(null); }
    }, 1300);
  }

  const q = domande[i];

  return (
    <div className={`game ${fase === "fine" ? "game--result" : ""}`} style={fase === "fine" ? { background: GRADIENTE } : undefined}>
      <div className="game-top">
        <button className="game-back" onClick={fase === "classifica" && iniziale !== "classifica" ? () => setFase("start") : onExit}>
          ← {fase === "classifica" && iniziale !== "classifica" ? "Indietro" : "Giochi"}
        </button>
        <span className="game-brand">Bevotoscano</span>
      </div>

      {fase === "start" && (
        <div className="game-center fade">
          <div className="big-emoji">🍷</div>
          <h1 className="game-title">Quanto ne sai di <em>vino toscano</em>?</h1>
          <p className="rule">🚫 Niente aiutini: {SECONDI_PER_DOMANDA} secondi a domanda, e se esci dall'app per cercare la risposta la domanda è persa.</p>
          <div className="modes">
            <button className="mode" onClick={() => parti("alltime")}>
              <span className="mode-emoji">🏆</span>
              <span>
                <strong>All Time</strong>
                <small>Domande a oltranza, sempre più difficili. Se ne sbagli due di fila hai un'ultima chance: sbagli anche quella e sei fuori. Quante ne fai?</small>
              </span>
            </button>
            <button className="mode" onClick={() => parti("classica")}>
              <span className="mode-emoji">⏱️</span>
              <span>
                <strong>Sfida da 10</strong>
                <small>{DOMANDE_PER_PARTITA} domande: più sei veloce, più punti fai. Una partita in 3 minuti.</small>
              </span>
            </button>
          </div>
          <button className="link" onClick={() => setFase("classifica")}>Vedi le classifiche</button>
        </div>
      )}

      {fase === "gioco" && q && (
        <div className="fade" key={i}>
          <div className="hud">
            {modalita === "classica" ? (
              <>
                <span>Domanda {i + 1}/{domande.length}</span>
                <span className="score">{punti} pt</span>
              </>
            ) : (
              <>
                <span className="lives" aria-label={`Errori di fila: ${erroriDiFila}`}>
                  {ultimaChance ? <b className="last-chance">⚠️ Ultima chance</b> : <>{erroriDiFila >= 1 ? "🍂" : "🍇"}{erroriDiFila >= 2 ? "🍂" : "🍇"}</>}
                </span>
                <span className="score">{corrette} ✓</span>
              </>
            )}
          </div>
          <div className={`timer ${tempo < 5 ? "timer--low" : ""}`}><div style={{ width: `${(tempo / SECONDI_PER_DOMANDA) * 100}%` }} /></div>
          <div className="tiny right">
            {modalita === "alltime" && `Domanda ${i + 1} · `}{Math.ceil(tempo)}s · {"★".repeat(q.livello)}{"☆".repeat(3 - q.livello)}
          </div>
          <h2 className="q-text">{q.d}</h2>
          <div className="options">
            {q.opzioni.map((o) => {
              const stato = !scelta ? "" : o === q.giusta ? "option--right" : o === scelta ? "option--wrong" : "option--dim";
              return <button key={o} className={`option ${stato}`} onClick={() => rispondi(o)} disabled={!!scelta}>{o}</button>;
            })}
          </div>
          {scelta && (
            <p className={`feedback ${scelta === q.giusta ? "ok" : "error"}`}>
              {scelta === q.giusta
                ? modalita === "classica" ? `Giusto! +${ultimiPunti}` : "Giusto!"
                : scelta === "__tempo" ? "Tempo scaduto!" : scelta === "__uscito" ? "Sei uscito dall'app: domanda persa!" : "Sbagliato!"}
            </p>
          )}
        </div>
      )}

      {fase === "fine" && (
        <Fine modalita={modalita} punti={punti} corrette={corrette} totale={modalita === "classica" ? domande.length : null} finite={finite} onRigioca={() => parti(modalita)} onExit={onExit} />
      )}

      {fase === "classifica" && (
        <div className="fade">
          <h1 className="page-title">Classifiche</h1>
          <Classifiche iniziale="alltime" />
          <button className="btn btn--primary wide" style={{ marginTop: 20 }} onClick={() => setFase("start")}>Gioca</button>
        </div>
      )}
    </div>
  );
}

function Fine({ modalita, punti, corrette, totale, finite, onRigioca, onExit }) {
  const [nome, setNome] = useState(() => localStorage.getItem("bevotoscano-nome") || "");
  const [paese, setPaese] = useState(() => localStorage.getItem("bevotoscano-paese") || "IT");
  const [stato, setStato] = useState("");
  const alltime = modalita === "alltime";
  const [t, emoji] = alltime ? titoloAllTime(corrette, finite) : titoloClassica(corrette);
  const titoloRisultato = alltime ? `${corrette} di fila` : `${punti} punti`;
  const sopra = alltime ? (finite ? "Hai risposto a tutte le domande!" : "All Time · risposte giuste") : `${corrette} giuste su ${totale}`;

  const invia = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setStato("invio");
    try {
      localStorage.setItem("bevotoscano-nome", nome.trim());
      localStorage.setItem("bevotoscano-paese", paese);
      await inviaPunteggio({ nome, paese, punti, corrette, modalita });
      setStato("inviato");
    } catch {
      setStato("errore");
    }
  };

  return (
    <div className="game-center fade light">
      <span className="eyebrow">{sopra}</span>
      <div className="big-emoji">{emoji}</div>
      <h2 className="result-name">{alltime ? <>{corrette} <small className="result-unit">risposte</small></> : `${punti} punti`}</h2>
      <p className="result-tagline">{t}</p>

      {stato !== "inviato" ? (
        <form className="glass-form" onSubmit={invia}>
          <span>Entra nella classifica {MODALITA[modalita].nome}</span>
          <input className="input" placeholder="Il tuo nome" maxLength={20} value={nome} onChange={(e) => setNome(e.target.value)} />
          <select className="input" value={paese} onChange={(e) => setPaese(e.target.value)} aria-label="Paese">
            {PAESI.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
          </select>
          {stato === "errore" && <span className="error">Non sono riuscito a salvare, riprova.</span>}
          <button className="btn btn--outline-light" type="submit" disabled={stato === "invio" || !nome.trim()}>{stato === "invio" ? "Salvo…" : "Salva il punteggio"}</button>
        </form>
      ) : (
        <div className="glass-form"><Classifiche iniziale={modalita} evidenzia={nome.trim().slice(0, 20)} /></div>
      )}

      <ShareButton
        label="Sfida gli amici nelle stories ✨"
        filename={`bevotoscano-quiz-${modalita}-${alltime ? corrette : punti}`}
        card={{ gradient: GRADIENTE, eyebrow: alltime ? "Quiz All Time sul vino toscano" : "Quiz sul vino toscano", emoji, title: titoloRisultato, tagline: t, body: alltime ? "Risposte giuste di fila, senza aiutini. Riesci a fare meglio?" : `${corrette} risposte giuste su ${totale}. Riesci a battermi?` }}
      />
      <div className="row">
        <button className="link light" onClick={onRigioca}>Rigioca</button>
        <button className="link light" onClick={onExit}>Altri giochi</button>
      </div>
    </div>
  );
}
