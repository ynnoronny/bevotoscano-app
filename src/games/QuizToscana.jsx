import { useEffect, useRef, useState } from "react";
import { DOMANDE, SECONDI_PER_DOMANDA } from "./quizData.js";
import { inviaPunteggio, PAESI } from "../leaderboard.js";
import { Classifica } from "./Classifiche.jsx";
import ShareButton from "./ShareButton.jsx";

// Il quiz. Si può partire anche dalla domanda del giorno in home: quella risposta conta già.
// Il quiz infinito. Si parte con 0 vite, ogni 3 risposte giuste se ne guadagna una.
// Una risposta sbagliata toglie una vita; sbagliare con 0 vite chiude la partita.
// La classifica conta quante risposte giuste fai prima di cadere.
const OGNI_QUANTE_UNA_VITA = 3;

const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const prepara = (q) => ({ ...q, giusta: q.r[0], opzioni: shuffle(q.r) });
const perLivello = (l) => shuffle(DOMANDE.filter((q) => q.livello === l));
// Primo giro dalle facili alle difficili; quando il mazzo finisce si rimescola tutto.
const primoGiro = () => [...perLivello(1), ...perLivello(2), ...perLivello(3)].map(prepara);
const altroGiro = () => shuffle(DOMANDE).map(prepara);

const GRADIENTE = "linear-gradient(170deg, #432543 0%, #6B2440 45%, #B3243B 80%, #F2B33D 100%)";

const titolo = (c) =>
  c >= 80 ? ["Leggenda del vino toscano", "👑"] : c >= 50 ? ["Gran Sommelier di Toscana", "🏆"] : c >= 25 ? ["Enologo di bottega", "🍷"] : c >= 10 ? ["Bevitore curioso", "🍇"] : ["Turista del vino", "🧳"];

// La domanda del giorno (home) lascia qui la sua risposta, così il quiz riparte da lì.
export const DAL_GIORNO = "bevotoscano-dal-giorno";
function leggiDalGiorno() {
  try { return JSON.parse(sessionStorage.getItem(DAL_GIORNO)); } catch { return null; }
}

export default function QuizToscana({ onExit, iniziale = "start" }) {
  const [dalGiorno] = useState(() => (iniziale === "start" ? leggiDalGiorno() : null));
  const [fase, setFase] = useState(dalGiorno ? "gioco" : iniziale); // start | gioco | fine | classifica
  const [domande, setDomande] = useState([]);
  const [i, setI] = useState(0);
  const [tempo, setTempo] = useState(SECONDI_PER_DOMANDA);
  const [scelta, setScelta] = useState(null); // risposta data, o "__tempo" / "__uscito"
  const [corrette, setCorrette] = useState(0);
  const [vite, setVite] = useState(0);
  const [nota, setNota] = useState(""); // "+1 vita", "-1 vita"
  const [finita, setFinita] = useState(false);
  const inizio = useRef(0);

  // da: la domanda del giorno già risposta in home ({ d, ok }): non si ripete e, se giusta, conta.
  const parti = (da) => {
    setDomande(primoGiro().filter((q) => !da || q.d !== da.d));
    setI(0); setCorrette(da?.ok ? 1 : 0); setVite(0); setScelta(null); setFinita(false);
    setNota(da ? (da.ok ? "Hai già 1 giusta dalla domanda del giorno" : "La domanda del giorno non conta: si parte da qui") : "");
    setFase("gioco");
  };
  useEffect(() => {
    if (!dalGiorno) return;
    try { sessionStorage.removeItem(DAL_GIORNO); } catch { /* niente */ }
    parti(dalGiorno);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    let fine = false;
    if (giusta) {
      const c = corrette + 1;
      setCorrette(c);
      if (c % OGNI_QUANTE_UNA_VITA === 0) { setVite((v) => v + 1); setNota("+1 vita"); } else setNota("");
    } else if (vite > 0) {
      setVite(vite - 1);
      setNota("-1 vita");
    } else {
      fine = true;
      setNota("");
    }
    setFinita(fine);
    setScelta(r);
  }

  // Dopo la risposta resta la spiegazione: si va avanti quando si vuole.
  function avanti() {
    if (finita) return setFase("fine");
    if (i + 1 >= domande.length) setDomande((d) => [...d, ...altroGiro()]);
    setI(i + 1);
    setScelta(null);
    setNota("");
  }

  const q = domande[i];
  const versoVita = OGNI_QUANTE_UNA_VITA - (corrette % OGNI_QUANTE_UNA_VITA);

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
          <div className="regole">
            <p><b>Le domande non finiscono mai.</b> Vai avanti finché resisti.</p>
            <p><b>Parti con 0 vite.</b> Ogni 3 risposte giuste ne guadagni una.</p>
            <p><b>Sbagli?</b> Perdi una vita. Se sbagli quando non ne hai, la partita finisce.</p>
            <p><b>Niente aiutini:</b> {SECONDI_PER_DOMANDA} secondi a domanda, e se esci dall'app per cercare la risposta la domanda è persa.</p>
          </div>
          <button className="btn btn--primary wide" onClick={() => parti()}>Inizia</button>
          <button className="link" onClick={() => setFase("classifica")}>Vedi la classifica</button>
        </div>
      )}

      {fase === "gioco" && q && (
        <div className="fade" key={i}>
          <div className="hud">
            <span className="lives" aria-label={`Vite: ${vite}`}>
              {vite > 0 ? <>{"❤️".repeat(Math.min(vite, 5))}{vite > 5 && <b> ×{vite}</b>}</> : <b className="last-chance">0 vite</b>}
            </span>
            <span className="score">{corrette} ✓</span>
          </div>
          <div className={`timer ${tempo < 5 ? "timer--low" : ""}`}><div style={{ width: `${(tempo / SECONDI_PER_DOMANDA) * 100}%` }} /></div>
          <div className="tiny right">
            Domanda {i + 1} · {Math.ceil(tempo)}s · {versoVita === 1 ? "la prossima giusta vale una vita" : `${versoVita} giuste alla prossima vita`}
          </div>
          <h2 className="q-text">{q.d}</h2>
          <div className="options">
            {q.opzioni.map((o) => {
              const stato = !scelta ? "" : o === q.giusta ? "option--right" : o === scelta ? "option--wrong" : "option--dim";
              return <button key={o} className={`option ${stato}`} onClick={() => rispondi(o)} disabled={!!scelta}>{o}</button>;
            })}
          </div>
          {!scelta && nota && <p className="tiny avviso">{nota}</p>}
          {scelta && (
            <p className={`feedback ${scelta === q.giusta ? "ok" : "error"}`}>
              {scelta === q.giusta ? "Giusto!" : scelta === "__tempo" ? "Tempo scaduto!" : scelta === "__uscito" ? "Sei uscito dall'app: domanda persa!" : "Sbagliato!"}
              {nota && ` ${nota}`}
            </p>
          )}
          {scelta && q.p && <p className="spiega fade">{q.p}</p>}
          {scelta && <button className="btn btn--primary wide avanti" onClick={avanti} autoFocus>{finita ? "Vedi il risultato" : "Avanti"}</button>}
        </div>
      )}

      {fase === "fine" && <Fine corrette={corrette} onRigioca={() => parti()} onExit={onExit} />}

      {fase === "classifica" && (
        <div className="fade">
          <h1 className="page-title">Classifica</h1>
          <p className="tiny">Conta quante risposte giuste fai prima di cadere.</p>
          <Classifica limite={50} />
          <button className="btn btn--primary wide" style={{ marginTop: 20 }} onClick={() => parti()}>Gioca</button>
        </div>
      )}
    </div>
  );
}

function Fine({ corrette, onRigioca, onExit }) {
  const [nome, setNome] = useState(() => localStorage.getItem("bevotoscano-nome") || "");
  const [paese, setPaese] = useState(() => localStorage.getItem("bevotoscano-paese") || "IT");
  const [stato, setStato] = useState("");
  const [t, emoji] = titolo(corrette);

  const invia = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setStato("invio");
    try {
      localStorage.setItem("bevotoscano-nome", nome.trim());
      localStorage.setItem("bevotoscano-paese", paese);
      await inviaPunteggio({ nome, paese, punti: corrette, corrette, modalita: "alltime" });
      setStato("inviato");
    } catch {
      setStato("errore");
    }
  };

  return (
    <div className="game-center fade light">
      <span className="eyebrow">Partita finita</span>
      <div className="big-emoji">{emoji}</div>
      <h2 className="result-name">{corrette} <small className="result-unit">{corrette === 1 ? "giusta" : "giuste"}</small></h2>
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
        <div className="glass-form"><Classifica evidenzia={nome.trim().slice(0, 20)} /></div>
      )}

      <ShareButton
        label="Sfida gli amici nelle stories ✨"
        filename={`bevotoscano-quiz-${corrette}`}
        card={{ gradient: GRADIENTE, eyebrow: "Quiz infinito sul vino toscano", emoji, title: `${corrette} giuste`, tagline: t, body: "Domande senza fine, senza aiutini. Riesci a fare meglio?" }}
      />
      <div className="row">
        <button className="link light" onClick={onRigioca}>Rigioca</button>
        <button className="link light" onClick={onExit}>Torna ai giochi</button>
      </div>
    </div>
  );
}
