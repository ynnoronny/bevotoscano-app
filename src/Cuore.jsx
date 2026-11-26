import { cambiaPreferito, usePreferiti } from "./preferiti.js";

// Il cuore dei preferiti: tocchi e l'evento (o la cantina) si ritrova in cima alla Home.
// tipo: "eventi" | "luoghi"; copia: funzione che prepara la copia da salvare.
export default function Cuore({ tipo, id, copia, nome, className = "" }) {
  const p = usePreferiti();
  const on = !!p[tipo]?.[String(id)];
  return (
    <button
      type="button"
      className={`cuore ${on ? "cuore--on" : ""} ${className}`}
      aria-pressed={on}
      aria-label={on ? `Togli ${nome} dai preferiti` : `Salva ${nome} nei preferiti`}
      title={on ? "Nei tuoi preferiti" : "Salva nei preferiti"}
      onClick={(x) => { x.preventDefault(); x.stopPropagation(); cambiaPreferito(tipo, id, copia()); }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" />
      </svg>
    </button>
  );
}
