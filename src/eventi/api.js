// Dati degli eventi. Con Supabase configurato (src/config.js) legge e scrive nel database;
// senza, usa gli eventi di esempio e salva le segnalazioni nel browser, così puoi provare
// tutto il giro (segnala → approva → pubblicato) anche in locale.
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseAttivo } from "../config.js";
import { EVENTI_ESEMPIO, PICKUP_ESEMPIO } from "./esempi.js";

const LOCAL = "bevotoscano-eventi";
const LOCAL_PICKUP = "bevotoscano-pickup";
const SESSION = "bevotoscano-admin";

export const online = supabaseAttivo;

// ---------- archivio locale (solo senza Supabase) ----------
function localAll() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL) || "null");
    if (saved) return saved;
  } catch { /* niente */ }
  return EVENTI_ESEMPIO;
}
function localSave(list) {
  try { localStorage.setItem(LOCAL, JSON.stringify(list)); } catch { /* niente */ }
}
const nonPassato = (e) => new Date(e.fine || e.inizio).getTime() > Date.now() - 86400000;

// ---------- chiamate al database ----------
async function rest(path, { method = "GET", body, token, prefer } = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401 && token) throw new Error("sessione");
  if (!r.ok) {
    let msg = `Errore ${r.status}`;
    try { msg = (await r.json()).message || msg; } catch { /* niente */ }
    throw new Error(msg);
  }
  return r.status === 204 ? null : r.json().catch(() => null);
}

// ---------- pubblico ----------
export async function eventiPubblici() {
  if (online()) return rest("eventi_pubblici?select=*&order=inizio.asc");
  return localAll().filter((e) => e.stato === "pubblicato" && nonPassato(e)).sort((a, b) => a.inizio.localeCompare(b.inizio));
}

export async function segnalaEvento(evento) {
  const riga = { ...evento, stato: "in_attesa", fonte: "form" };
  if (online()) return rest("eventi", { method: "POST", body: riga, prefer: "return=minimal" });
  const list = localAll();
  localSave([...list, { ...riga, id: Date.now(), creato: new Date().toISOString() }]);
}

// ---------- admin ----------
export function sessione() {
  try { return JSON.parse(localStorage.getItem(SESSION) || "null"); } catch { return null; }
}
export function esci() { localStorage.removeItem(SESSION); }

async function auth(grant, body) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grant}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error_description || j.msg || "Accesso non riuscito");
  const s = { token: j.access_token, refresh: j.refresh_token, email: j.user?.email, scade: Date.now() + j.expires_in * 1000 };
  localStorage.setItem(SESSION, JSON.stringify(s));
  return s;
}
export const accedi = (email, password) => auth("password", { email, password });

async function token() {
  let s = sessione();
  if (!s) throw new Error("sessione");
  if (Date.now() > s.scade - 60000) s = await auth("refresh_token", { refresh_token: s.refresh }).catch(() => { esci(); throw new Error("sessione"); });
  return s.token;
}

export async function tuttiGliEventi() {
  if (online()) return rest("eventi?select=*&order=creato.desc", { token: await token() });
  return [...localAll()].sort((a, b) => String(b.creato || "").localeCompare(String(a.creato || "")));
}

export async function salvaEvento(evento) {
  if (online()) {
    const t = await token();
    if (evento.id) {
      const { id, creato, ...campi } = evento;
      return rest(`eventi?id=eq.${id}`, { method: "PATCH", body: campi, token: t, prefer: "return=minimal" });
    }
    return rest("eventi", { method: "POST", body: { ...evento, fonte: "admin" }, token: t, prefer: "return=minimal" });
  }
  const list = localAll();
  if (evento.id) localSave(list.map((e) => (e.id === evento.id ? { ...e, ...evento } : e)));
  else localSave([...list, { ...evento, fonte: "admin", id: Date.now(), creato: new Date().toISOString() }]);
}

export async function eliminaEvento(id) {
  if (online()) return rest(`eventi?id=eq.${id}`, { method: "DELETE", token: await token() });
  localSave(localAll().filter((e) => e.id !== id));
}

export async function pickupPoints() {
  if (online()) return rest("pickup_point?select=*&order=nome.asc");
  try { return JSON.parse(localStorage.getItem(LOCAL_PICKUP) || "null") || PICKUP_ESEMPIO; } catch { return PICKUP_ESEMPIO; }
}
export async function salvaPickup(p) {
  if (online()) return rest("pickup_point", { method: "POST", body: p, token: await token(), prefer: "return=minimal" });
  const list = await pickupPoints();
  localStorage.setItem(LOCAL_PICKUP, JSON.stringify([...list, { ...p, id: Date.now() }]));
}
