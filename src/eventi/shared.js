export const ACCESSI = {
  bus: { label: "Bus o navetta con pickup", icon: "🚌" },
  treno: { label: "Treno o mezzi pubblici", icon: "🚆" },
  piedi: { label: "A piedi dal centro", icon: "🚶" },
  auto: { label: "In auto", icon: "🚗" },
};
export const TIPI_ORG = {
  cantina: "Cantina / azienda agricola",
  enoteca: "Enoteca / wine bar",
  bus: "Azienda bus / tour operator",
  ente: "Ente, consorzio, associazione",
  altro: "Altro",
};
export const senzaAuto = (e) => (e.accesso || []).some((a) => a !== "auto");

export const fmtData = (iso, conOra = true) => {
  const d = new Date(iso);
  const g = d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
  return conOra ? `${g} · ${d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}` : g;
};
