import { useEffect, useState } from "react";
import { leggiClassifica, bandiera, MODALITA } from "../leaderboard.js";

// Classifica di una modalità. `evidenzia` = nome del giocatore appena salvato.
export function Classifica({ modalita = "classica", evidenzia, limite = 20 }) {
  const [righe, setRighe] = useState(null);
  const [errore, setErrore] = useState(false);
  useEffect(() => {
    setRighe(null);
    setErrore(false);
    leggiClassifica(modalita, limite).then(setRighe).catch(() => setErrore(true));
  }, [modalita, limite]);
  if (errore) return <p className="muted">Classifica non raggiungibile in questo momento.</p>;
  if (!righe) return <p className="muted">Carico…</p>;
  if (!righe.length) return <p className="muted">Ancora nessuno in classifica. Il primo posto è tuo!</p>;
  const unita = MODALITA[modalita].unita;
  return (
    <ol className="board">
      {righe.map((r, k) => (
        <li key={k} className={r.nome === evidenzia ? "board--me" : ""}>
          <span className="board-pos">{k < 3 ? ["🥇", "🥈", "🥉"][k] : k + 1}</span>
          <span className="board-name">{bandiera(r.paese)} {r.nome}</span>
          <span className="board-pts">{r.punti}<small> {unita}</small></span>
        </li>
      ))}
    </ol>
  );
}

// Le due classifiche, con le schede per passare dall'una all'altra.
export default function Classifiche({ iniziale = "alltime", evidenzia }) {
  const [mod, setMod] = useState(iniziale);
  return (
    <div className="classifiche">
      <div className="chips" role="tablist">
        {Object.entries(MODALITA).map(([id, m]) => (
          <button key={id} role="tab" aria-selected={mod === id} className={`chip ${mod === id ? "chip--on" : ""}`} onClick={() => setMod(id)}>
            {id === "alltime" ? "🏆 " : "⏱️ "}{m.nome}
          </button>
        ))}
      </div>
      <p className="tiny">
        {mod === "alltime"
          ? "Domande a oltranza: conta quante risposte giuste fai prima di cadere. Il record di sempre."
          : "10 domande a tempo: più sei veloce, più punti fai."}
      </p>
      <Classifica modalita={mod} evidenzia={evidenzia} />
    </div>
  );
}
