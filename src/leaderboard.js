// Classifica del quiz.
// Senza Supabase (src/config.js) la classifica è locale, solo su questo telefono.
import { supabase, supabaseAttivo } from "./config.js";

const LOCAL_KEY = "bevotoscano-classifica";
const online = supabaseAttivo;

export const isOnline = online;

export async function inviaPunteggio({ nome, paese, punti, corrette }) {
  const riga = { nome: nome.trim().slice(0, 20), paese, punti, corrette, creato: new Date().toISOString() };
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

export async function leggiClassifica(limite = 20) {
  if (online()) {
    return supabase(`punteggi?select=nome,paese,punti,corrette&order=punti.desc&limit=${limite}`);
  }
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]").sort((a, b) => b.punti - a.punti).slice(0, limite);
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
