// Legge gli eventi pubblicati dal database (stessa chiave pubblica dell'app).
// Usato dallo script di pubblicazione e dalle funzioni Vercel. Se il database non risponde
// restituisce una lista vuota: il sito funziona comunque.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../src/config.js";

export async function leggiEventi(filtro = "") {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const r = await fetch(`${SUPABASE_URL}/rest/v1/eventi_pubblici?select=*&order=inizio.asc${filtro}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}
