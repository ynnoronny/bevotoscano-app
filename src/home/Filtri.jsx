import { useEffect, useRef } from "react";
import { ZONE } from "../zone.js";

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

// Le zone del vino come scelte, ognuna col suo pallino colorato (lo stesso colore della mappa):
// qui i nomi si leggono sempre, anche quando sulla mappa non c'è spazio per scriverli tutti.
// Prima le zone dove c'è qualcosa, poi le altre.
export function SceltaZona({ conta, zona, onZona, totale }) {
  const riga = useRef(null);
  // la zona scelta (anche dalla mappa) scorre al centro della riga; "Tutta la Toscana" torna all'inizio
  const prima = useRef(true);
  useEffect(() => {
    if (prima.current) { prima.current = false; return; }
    const s = riga.current?.closest(".filtri-scorri");
    const b = riga.current?.querySelector(".on");
    if (!s) return;
    const dx = zona && b ? b.getBoundingClientRect().left - s.getBoundingClientRect().left - (s.clientWidth - b.offsetWidth) / 2 : -s.scrollLeft;
    s.scrollBy({ left: dx, behavior: "smooth" });
  }, [zona]);
  const ordine = [...ZONE].sort((a, b) => (conta[b.zona] || 0) - (conta[a.zona] || 0));
  return (
    <div className="filtri-scelta" role="radiogroup" ref={riga}>
      <button role="radio" aria-checked={!zona} className={!zona ? "on" : ""} onClick={() => onZona(null)}>Tutta la Toscana · {totale}</button>
      {ordine.map((z) => (
        <button key={z.zona} role="radio" aria-checked={zona === z.zona} className={`${zona === z.zona ? "on" : ""} ${conta[z.zona] ? "" : "vuota"}`} onClick={() => onZona(zona === z.zona ? null : z.zona)}>
          <i className="zona-pallino" style={{ background: z.colore }} aria-hidden="true" />{z.zona}{conta[z.zona] ? ` · ${conta[z.zona]}` : ""}
        </button>
      ))}
    </div>
  );
}
