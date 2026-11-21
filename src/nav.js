// Navigazione con indirizzi veri: go("eventi") porta a bevotoscano.com/eventi
// (prima era bevotoscano.com/#/eventi: Google vedeva una sola pagina).

const EVENTO = "percorso";

export const percorsoAttuale = () => window.location.pathname.replace(/^\/+|\/+$/g, "") || "home";

export function go(path) {
  const p = String(path).replace(/^\/+/, "");
  const url = p === "home" || p === "" ? "/" : `/${p}`;
  if (window.location.pathname !== url || window.location.search) window.history.pushState(null, "", url);
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
