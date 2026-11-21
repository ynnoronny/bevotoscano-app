// Raccolta contatti (giochi, lista d'attesa cassa, esperienze).
// Con Supabase configurato (src/config.js) finiscono nella tabella "contatti",
// che vedi solo tu dal pannello di Supabase. Senza, restano nel browser.
import { supabase, supabaseAttivo } from "./config.js";

const KEY = "bevotoscano-leads";

export function saveLead(tipo, dati) {
  const { email = null, nome = null, ...resto } = dati;
  // Solo i contatti con email vanno nel database: il resto (es. segno scelto) è statistica locale.
  if (supabaseAttivo() && email) {
    supabase("contatti", { method: "POST", prefer: "return=minimal", body: { tipo, email, nome: nome || null, dati: resto } }).catch(() => {});
  }
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "[]");
    all.push({ tipo, ...dati, data: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage non disponibile */
  }
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
