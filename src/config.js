// Configurazione del database (Supabase). Lascia vuoto per lavorare solo in locale.
// Le trovi in Supabase → Project Settings → API. La chiave "anon public" è fatta per stare
// nel sito: i permessi veri li decidono le regole in supabase.sql.
export const SUPABASE_URL = "https://davnmxhgoxvtoypdrjkz.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdm5teGhnb3h2dG95cGRyamt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyODI0OTEsImV4cCI6MjExMDg1ODQ5MX0.hkMKgk-GtsWAljeXIrnTsmOUaH3xw3B-s5kNulFDI6s";

export const supabaseAttivo = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function supabase(path, { method = "GET", body, prefer } = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return method === "GET" ? r.json() : null;
}
