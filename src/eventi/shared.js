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

// Il prezzo è l'informazione che conta di più: la cifra se c'è ("20 €", "da 15 €"),
// un € se è a pagamento senza cifra, un € sbarrato se è gratis. Se non lo sappiamo, niente.
export function prezzoEv(e) {
  const p = (e.prezzo || "").trim();
  if (!p) return { testo: "", vuoto: true };
  if (/grat|libero|free|offerta/i.test(p)) return { testo: "Gratis", gratis: true, simbolo: true };
  const cifre = [...p.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => parseFloat(m[0].replace(",", ".")));
  if (!cifre.length) return { testo: "A pagamento", simbolo: true };
  const min = Math.min(...cifre);
  return { testo: `${cifre.length > 1 || /\bda\b/i.test(p) ? "da " : ""}${String(min).replace(".", ",")} €` };
}
// Eventi con un passaggio organizzato: bus o navetta con punti di raccolta.
export const conNavetta = (e) => (e.pickup || []).length > 0 || (e.accesso || []).includes("bus");

