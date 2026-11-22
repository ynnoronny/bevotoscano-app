// Classifica del quiz.
// Senza Supabase (src/config.js) la classifica è locale, solo su questo telefono.
import { supabase, supabaseAttivo } from "./config.js";

const LOCAL_KEY = "bevotoscano-classifica";
const online = supabaseAttivo;

export const isOnline = online;

// Il quiz ha una sola modalità: domande infinite a vite. Nel database si chiama "alltime"
// e i punti sono le risposte giuste. Le partite vecchie restano salvate ma non contano:
// la classifica mostra solo quelle dal giorno in cui l'abbiamo azzerata.
export const MODALITA = {
  alltime: { nome: "Quiz infinito", unita: "giuste" },
};
export const AZZERATA_IL = "2026-11-22";

export async function inviaPunteggio({ nome, paese, punti, corrette, modalita = "alltime" }) {
  const riga = { nome: nome.trim().slice(0, 20), paese, punti, corrette, modalita, creato: new Date().toISOString() };
  if (online()) {
    const { creato, ...body } = riga;
    await supabase("punteggi", { method: "POST", prefer: "return=minimal", body });
    return;
  }
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    all.push(riga);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  } catch { /* niente storage */ }
}

export async function leggiClassifica(modalita = "alltime", limite = 20) {
  if (online()) {
    return supabase(`punteggi?select=nome,paese,punti,corrette&modalita=eq.${modalita}&creato=gte.${AZZERATA_IL}&order=punti.desc,creato.asc&limit=${limite}`);
  }
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]")
      .filter((r) => (r.modalita || "classica") === modalita && (r.creato || "") >= AZZERATA_IL)
      .sort((a, b) => b.punti - a.punti)
      .slice(0, limite);
  } catch {
    return [];
  }
}

export const PAESI = [
  ["IT", "🇮🇹 Italia"], ["US", "🇺🇸 USA"], ["DE", "🇩🇪 Germania"], ["GB", "🇬🇧 Regno Unito"], ["FR", "🇫🇷 Francia"],
  ["CH", "🇨🇭 Svizzera"], ["NL", "🇳🇱 Paesi Bassi"], ["ES", "🇪🇸 Spagna"], ["AT", "🇦🇹 Austria"], ["BE", "🇧🇪 Belgio"],
  ["CA", "🇨🇦 Canada"], ["BR", "🇧🇷 Brasile"], ["AU", "🇦🇺 Australia"], ["JP", "🇯🇵 Giappone"], ["CN", "🇨🇳 Cina"],
  ["XX", "🌍 Altro"],
];
export const bandiera = (code) => (PAESI.find((p) => p[0] === code)?.[1] || "🌍").split(" ")[0];
