import { NOMI_PROVINCIA } from "../province.js";

// I filtri, uguali per eventi e cantine: un pannello con due righe.
// Ogni riga ha un'etichetta ("Quando", "Zona"…) e scorre col dito se non ci sta.

export function Filtri({ children }) {
  return <div className="filtri">{children}</div>;
}

export function Riga({ etichetta, children }) {
  return (
    <div className="filtri-riga">
      <span className="filtri-etichetta">{etichetta}</span>
      <div className="filtri-scorri">{children}</div>
    </div>
  );
}

// Una sola scelta tra più opzioni: [[valore, testo], …]
export function Scelta({ opzioni, valore, onCambia }) {
  return (
    <div className="filtri-scelta" role="radiogroup">
      {opzioni.map(([v, t]) => (
        <button key={v} role="radio" aria-checked={v === valore} className={v === valore ? "on" : ""} onClick={() => onCambia(v)}>{t}</button>
      ))}
    </div>
  );
}

export function Interruttore({ on, onCambia, children }) {
  return <button className={`filtri-btn ${on ? "on" : ""}`} aria-pressed={on} onClick={() => onCambia(!on)}>{children}</button>;
}

// La provincia, per eventi e cantine: un menu a tendina (prima c'era la fila delle zone,
// lunghissima e scomoda da scorrere). conta: { Pisa: 3, … } per scrivere quanti ce ne sono.
export function SceltaProvincia({ valore, onCambia, conta = {} }) {
  return (
    <label className={`filtri-sel ${valore ? "on" : ""}`}>
      <span aria-hidden="true">🗺️</span>
      <select value={valore} onChange={(x) => onCambia(x.target.value)} aria-label="Provincia">
        <option value="">Tutte le province</option>
        {Object.values(NOMI_PROVINCIA).map((p) => <option key={p} value={p}>{p}{conta[p] ? ` · ${conta[p]}` : ""}</option>)}
      </select>
    </label>
  );
}
