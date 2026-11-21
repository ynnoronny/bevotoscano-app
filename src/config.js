// Configurazione del database (Supabase). Lascia vuoto per lavorare solo in locale.
// Le trovi in Supabase → Project Settings → API. La chiave "anon public" è fatta per stare
// nel sito: i permessi veri li decidono le regole in supabase.sql.
export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";

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
