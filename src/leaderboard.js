// Classifica del quiz.
// Senza Supabase (src/config.js) la classifica è locale, solo su questo telefono.
import { supabase, supabaseAttivo } from "./config.js";

const LOCAL_KEY = "bevotoscano-classifica";
const online = supabaseAttivo;

export const isOnline = online;

// Modalità: "classica" (10 domande, punti per velocità) e "alltime" (a oltranza, punti = risposte giuste).
export const MODALITA = {
  classica: { nome: "Sfida da 10", unita: "pt" },
  alltime: { nome: "All Time", unita: "risposte" },
};

export async function inviaPunteggio({ nome, paese, punti, corrette, modalita = "classica" }) {
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

export async function leggiClassifica(modalita = "classica", limite = 20) {
  if (online()) {
    return supabase(`punteggi?select=nome,paese,punti,corrette&modalita=eq.${modalita}&order=punti.desc,creato.asc&limit=${limite}`);
  }
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]")
      .filter((r) => (r.modalita || "classica") === modalita)
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
