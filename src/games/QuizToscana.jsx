import { useEffect, useRef, useState } from "react";
import { DOMANDE, DOMANDE_PER_PARTITA, SECONDI_PER_DOMANDA } from "./quizData.js";
import { inviaPunteggio, leggiClassifica, isOnline, PAESI, bandiera } from "../leaderboard.js";
import { shareStory } from "./storyImage.js";

const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// 10 domande a difficoltà crescente: 3 facili, 4 medie, 3 difficili.
function nuovaPartita() {
  const per = (l, n) => shuffle(DOMANDE.filter((q) => q.livello === l)).slice(0, n);
  const scelte = [...per(1, 3), ...per(2, 4), ...per(3, 3)].slice(0, DOMANDE_PER_PARTITA);
  return scelte.map((q) => ({ ...q, giusta: q.r[0], opzioni: shuffle(q.r) }));
}

const titolo = (corrette) =>
  corrette >= 9 ? ["Gran Sommelier di Toscana", "🏆"] :
  corrette >= 7 ? ["Enologo di bottega", "🍷"] :
  corrette >= 4 ? ["Bevitore curioso", "🍇"] :
  ["Turista del vino", "🧳"];

export default function QuizToscana({ onExit }) {
  const [fase, setFase] = useState("start"); // start | gioco | fine | classifica
  const [domande, setDomande] = useState([]);
  const [i, setI] = useState(0);
  const [tempo, setTempo] = useState(SECONDI_PER_DOMANDA);
  const [scelta, setScelta] = useState(null); // risposta data, o "__tempo" / "__uscito"
  const [punti, setPunti] = useState(0);
  const [corrette, setCorrette] = useState(0);
  const [ultimiPunti, setUltimiPunti] = useState(0);
  const inizio = useRef(0);

  const parti = () => {
    setDomande(nuovaPartita()); setI(0); setPunti(0); setCorrette(0); setScelta(null);
    setFase("gioco");
  };

  // Timer della domanda corrente.
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
    const rest = Math.max(0, SECONDI_PER_DOMANDA - (performance.now() - inizio.current) / 1000);
    let guadagno = 0;
    if (r === q.giusta) {
      guadagno = 50 * q.livello + Math.round((100 * rest) / SECONDI_PER_DOMANDA);
      setCorrette((c) => c + 1);
    }
    setUltimiPunti(guadagno);
    setPunti((p) => p + guadagno);
    setScelta(r);
    setTimeout(() => {
      if (i + 1 < domande.length) { setI(i + 1); setScelta(null); }
      else setFase("fine");
    }, 1300);
  }

  const q = domande[i];

  return (
    <div className={`game ${fase === "fine" ? "game--result" : ""}`} style={fase === "fine" ? { background: "linear-gradient(170deg, #2A1530 0%, #432543 45%, #722F37 80%, #C9A96E 100%)" } : undefined}>
      <div className="game-top">
        <button className="game-back" onClick={fase === "classifica" ? () => setFase("start") : onExit}>← {fase === "classifica" ? "Indietro" : "Giochi"}</button>
        <span className="game-brand">Bevotoscano</span>
      </div>

      {fase === "start" && (
        <div className="game-center fade">
          <div className="big-emoji">⏱️</div>
          <h1 className="game-title">Quanto ne sai di <em>vino toscano</em>?</h1>
          <p className="muted">{DOMANDE_PER_PARTITA} domande, {SECONDI_PER_DOMANDA} secondi l'una, sempre più difficili. Più sei veloce, più punti fai.</p>
          <p className="rule">🚫 Niente aiutini: se esci dall'app per cercare la risposta, la domanda è persa.</p>
          <button className="btn btn--primary" onClick={parti}>Inizia</button>
          <button className="link" onClick={() => setFase("classifica")}>Vedi la classifica {isOnline() ? "mondiale" : ""}</button>
        </div>
      )}

      {fase === "gioco" && q && (
        <div className="fade" key={i}>
          <div className="hud">
            <span>Domanda {i + 1}/{domande.length}</span>
            <span className="score">{punti} pt</span>
          </div>
          <div className={`timer ${tempo < 5 ? "timer--low" : ""}`}><div style={{ width: `${(tempo / SECONDI_PER_DOMANDA) * 100}%` }} /></div>
          <div className="tiny right">{Math.ceil(tempo)}s · {"★".repeat(q.livello)}{"☆".repeat(3 - q.livello)}</div>
          <h2 className="q-text">{q.d}</h2>
          <div className="options">
            {q.opzioni.map((o) => {
              const stato = !scelta ? "" : o === q.giusta ? "option--right" : o === scelta ? "option--wrong" : "option--dim";
              return <button key={o} className={`option ${stato}`} onClick={() => rispondi(o)} disabled={!!scelta}>{o}</button>;
            })}
          </div>
          {scelta && (
            <p className={`feedback ${scelta === q.giusta ? "ok" : "error"}`}>
              {scelta === q.giusta ? `Giusto! +${ultimiPunti}` : scelta === "__tempo" ? "Tempo scaduto!" : scelta === "__uscito" ? "Sei uscito dall'app: domanda persa!" : "Sbagliato!"}
            </p>
          )}
        </div>
      )}

      {fase === "fine" && <Fine punti={punti} corrette={corrette} totale={domande.length} onRigioca={parti} onExit={onExit} />}

      {fase === "classifica" && (
        <div className="fade">
          <h1 className="page-title">Classifica {isOnline() ? "mondiale" : ""}</h1>
          <Classifica />
          <button className="btn btn--primary wide" style={{ marginTop: 20 }} onClick={parti}>Gioca</button>
        </div>
      )}
    </div>
  );
}

function Fine({ punti, corrette, totale, onRigioca, onExit }) {
  const [nome, setNome] = useState(() => localStorage.getItem("bevotoscano-nome") || "");
  const [paese, setPaese] = useState(() => localStorage.getItem("bevotoscano-paese") || "IT");
  const [stato, setStato] = useState(""); // "" | invio | inviato | errore
  const [refresh, setRefresh] = useState(0);
  const [t, emoji] = titolo(corrette);

  const invia = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setStato("invio");
    try {
      localStorage.setItem("bevotoscano-nome", nome.trim());
      localStorage.setItem("bevotoscano-paese", paese);
      await inviaPunteggio({ nome, paese, punti, corrette });
      setStato("inviato");
      setRefresh((r) => r + 1);
    } catch {
      setStato("errore");
    }
  };

  const share = () =>
    shareStory(
      { gradient: "linear-gradient(170deg, #2A1530 0%, #432543 45%, #722F37 80%, #C9A96E 100%)", eyebrow: "Quiz sul vino toscano", emoji, title: `${punti} punti`, tagline: t, body: `${corrette} risposte giuste su ${totale}. Riesci a battermi?` },
      `bevotoscano-quiz-${punti}`,
      `Ho fatto ${punti} punti al quiz sul vino toscano di Bevotoscano 🍷 Riesci a battermi?`,
    ).catch(() => alert("Non sono riuscito a creare l'immagine. Fai uno screenshot 🍷"));

  return (
    <div className="game-center fade light">
      <span className="eyebrow">{corrette} giuste su {totale}</span>
      <div className="big-emoji">{emoji}</div>
      <h2 className="result-name">{punti} punti</h2>
      <p className="result-tagline">{t}</p>

      {stato !== "inviato" ? (
        <form className="glass-form" onSubmit={invia}>
          <span>Entra in classifica</span>
          <input className="input" placeholder="Il tuo nome" maxLength={20} value={nome} onChange={(e) => setNome(e.target.value)} />
          <select className="input" value={paese} onChange={(e) => setPaese(e.target.value)} aria-label="Paese">
            {PAESI.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
          </select>
          {stato === "errore" && <span className="error">Non sono riuscito a salvare, riprova.</span>}
          <button className="btn btn--outline-light" type="submit" disabled={stato === "invio" || !nome.trim()}>{stato === "invio" ? "Salvo…" : "Salva il punteggio"}</button>
        </form>
      ) : (
        <div className="glass-form"><Classifica key={refresh} evidenzia={nome.trim().slice(0, 20)} /></div>
      )}

      <button className="btn btn--gold" onClick={share}>Sfida gli amici nelle stories ✨</button>
      <div className="row">
        <button className="link light" onClick={onRigioca}>Rigioca</button>
        <button className="link light" onClick={onExit}>Altri giochi</button>
      </div>
    </div>
  );
}

function Classifica({ evidenzia }) {
  const [righe, setRighe] = useState(null);
  const [errore, setErrore] = useState(false);
  useEffect(() => { leggiClassifica().then(setRighe).catch(() => setErrore(true)); }, []);
  if (errore) return <p className="muted">Classifica non raggiungibile in questo momento.</p>;
  if (!righe) return <p className="muted">Carico…</p>;
  if (!righe.length) return <p className="muted">Ancora nessuno in classifica. Il primo posto è tuo!</p>;
  return (
    <ol className="board">
      {righe.map((r, k) => (
        <li key={k} className={r.nome === evidenzia ? "board--me" : ""}>
          <span className="board-pos">{k < 3 ? ["🥇", "🥈", "🥉"][k] : k + 1}</span>
          <span className="board-name">{bandiera(r.paese)} {r.nome}</span>
          <span className="board-pts">{r.punti}</span>
        </li>
      ))}
    </ol>
  );
}
