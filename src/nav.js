import { useEffect, useState } from "react";

// Navigazione con indirizzi veri: go("eventi") porta a bevotoscano.com/eventi
// (prima era bevotoscano.com/#/eventi: Google vedeva una sola pagina).

const EVENTO = "percorso";

export const percorsoAttuale = () => window.location.pathname.replace(/^\/+|\/+$/g, "") || "home";

// Per tornare indietro "come eri": la freccia in alto e il tasto indietro del telefono
// ritrovano la pagina allo stesso punto (vedi Shell.jsx). profondita = quante pagine dell'app
// ci sono dietro; ritorno = l'ultimo cambio di pagina era un "indietro".
const storia = []; // i percorsi da cui si è arrivati, il più recente in fondo
export let ritorno = false;
// la pagina appena prima, se era dentro l'app (per la freccia "indietro" in alto)
export const paginaPrima = () => storia[storia.length - 1] || null;
if (typeof window !== "undefined") window.addEventListener("popstate", () => { ritorno = true; storia.pop(); });

export function go(path) {
  ritorno = false;
  const p = String(path).replace(/^\/+/, "");
  const url = p === "home" || p === "" ? "/" : `/${p}`;
  if (window.location.pathname !== url || window.location.search) { storia.push(percorsoAttuale()); window.history.pushState(null, "", url); }
  window.dispatchEvent(new Event(EVENTO));
  window.scrollTo(0, 0);
}

export function suCambioPercorso(fn) {
  window.addEventListener(EVENTO, fn);
  window.addEventListener("popstate", fn);
  return () => {
    window.removeEventListener(EVENTO, fn);
    window.removeEventListener("popstate", fn);
  };
}

// I vecchi link con il cancelletto (bevotoscano.com/#/gioca/vitigno, già finiti su QR,
// stories e messaggi) continuano a funzionare: li trasformiamo nell'indirizzo nuovo.
// Il server non vede mai la parte dopo #, per questo lo facciamo qui.
export function sistemaVecchiLink() {
  const { hash, search } = window.location;
  if (hash.startsWith("#/")) {
    window.history.replaceState(null, "", `/${hash.slice(2).replace(/^\/+/, "")}`);
    return;
  }
  // ?percorso=/eventi/12: lo usa la funzione degli eventi se non riesce a preparare la pagina
  const p = new URLSearchParams(search).get("percorso");
  if (p && p.startsWith("/")) window.history.replaceState(null, "", p);
}

// Uno stato che resta finché la scheda del browser è aperta: i filtri di eventi e cantine
// ritrovati tornando da una scheda (prima si ripartiva sempre da zero).
export function useStatoPagina(chiave, iniziale) {
  const k = `bevotoscano-stato-${chiave}`;
  const [v, setV] = useState(() => { try { const x = sessionStorage.getItem(k); return x != null ? JSON.parse(x) : iniziale; } catch { return iniziale; } });
  useEffect(() => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* niente */ } }, [k, v]);
  return [v, setV];
}
