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

// ---------- secondo passo: codice a due fattori (TOTP, es. Google Authenticator) ----------
// Il database dà i permessi da admin solo a una sessione che ha passato anche il codice ("aal2").
export function livello(s = sessione()) {
  try { return JSON.parse(atob(s.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).aal || "aal1"; } catch { return null; }
}
async function authApi(path, { method = "GET", body } = {}) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method,
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.msg || j.message || j.error_description || `Errore ${r.status}`);
  return j;
}
// Il codice a due fattori già attivo su questo account (se c'è).
export async function fattoreAttivo() {
  const u = await authApi("user");
  return (u.factors || []).find((f) => f.factor_type === "totp" && f.status === "verified") || null;
}
// Prima volta: crea il codice e restituisce il QR da inquadrare con l'app.
export async function nuovoFattore() {
  const u = await authApi("user");
  // toglie i tentativi lasciati a metà, altrimenti Supabase non ne accetta uno nuovo
  for (const f of (u.factors || []).filter((f) => f.status !== "verified")) await authApi(`factors/${f.id}`, { method: "DELETE" }).catch(() => {});
  return authApi("factors", { method: "POST", body: { factor_type: "totp", friendly_name: `Bevotoscano ${new Date().toISOString().slice(0, 16)}` } });
}
// Controlla le 6 cifre: se sono giuste, la sessione passa ad "aal2" e si salva.
export async function verificaCodice(factorId, code) {
  const c = await authApi(`factors/${factorId}/challenge`, { method: "POST" });
  const j = await authApi(`factors/${factorId}/verify`, { method: "POST", body: { challenge_id: c.id, code } });
  const s = { token: j.access_token, refresh: j.refresh_token, email: j.user?.email, scade: Date.now() + j.expires_in * 1000 };
  localStorage.setItem(SESSION, JSON.stringify(s));
  return s;
}

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

// ---------- casella info@ (Supabase Edge Function "posta") ----------
export async function posta(azione, dati = {}) {
  if (!online()) throw new Error("La posta funziona solo con il database collegato.");
  const r = await fetch(`${SUPABASE_URL}/functions/v1/posta`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ azione, ...dati }),
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) throw new Error("sessione");
  if (!r.ok) throw new Error(j.errore || `Errore ${r.status}`);
  return j;
}

// ---------- cantine ed enoteche (tabella scanner_attori) ----------
// Lo scanner le trova da solo; il pulsante "Segnala" le aggiunge con origine "segnalazione".
// Tutte restano "in_attesa" finché non le approvi dal gestionale.
const LOCAL_ATTORI = "bevotoscano-attori";
const attoriLocali = () => { try { return JSON.parse(localStorage.getItem(LOCAL_ATTORI) || "[]"); } catch { return []; } };
const salvaAttoriLocali = (l) => { try { localStorage.setItem(LOCAL_ATTORI, JSON.stringify(l)); } catch { /* niente */ } };

// Ritorna "doppione" se la conosciamo già (stesso nome e comune).
export async function proponi({ tipo, nome, comune, sito, ruolo, referente, email, note, foto }) {
  const chi = ruolo === "titolare" ? "La propone chi ci lavora" : "La consiglia un cliente";
  const riga = {
    tipo, nome, comune, sito, stato: "in_attesa", origine: "segnalazione", segnalato_da_email: email,
    ...(foto ? { foto } : {}),
    note: [`${chi}${referente ? `: ${referente}` : ""}.`, note].filter(Boolean).join(" ").slice(0, 900),
  };
  if (online()) {
    const manda = (r) => rest("scanner_attori", { method: "POST", body: r, prefer: "return=minimal" });
    try { return await manda(riga); }
    catch (e) {
      if (/duplicate|unique/i.test(e.message)) return "doppione";
      // se nel database manca ancora la colonna della foto, la proposta parte senza
      if (riga.foto && /foto/i.test(e.message)) { const { foto: _, ...senza } = riga; return manda(senza); }
      throw e;
    }
  }
  salvaAttoriLocali([...attoriLocali(), { ...riga, id: Date.now(), creato: new Date().toISOString(), attivo: true }]);
}
export async function tuttiGliAttori() {
  if (online()) return rest("scanner_attori?select=*&order=creato.desc&limit=5000", { token: await token() });
  return attoriLocali().reverse();
}
// Aggiorna una o più righe insieme (per approvare in blocco).
export async function aggiornaAttori(ids, campi) {
  if (!ids.length) return;
  if (online()) {
    const t = await token();
    for (let i = 0; i < ids.length; i += 150) {
      await rest(`scanner_attori?id=in.(${ids.slice(i, i + 150).join(",")})`, { method: "PATCH", body: campi, token: t, prefer: "return=minimal" });
    }
    return;
  }
  salvaAttoriLocali(attoriLocali().map((a) => (ids.includes(a.id) ? { ...a, ...campi } : a)));
}
// Le realtà approvate, per la sezione Cantine dell'app.
export async function attoriPubblici() {
  if (online()) return rest("attori_pubblici?select=*&order=nome.asc");
  return attoriLocali().filter((a) => a.stato === "approvato");
}

// ---------- notizie per il blog (le scrive lo scanner come bozze) ----------
export async function tutteLeNotizie() {
  if (!online()) return [];
  return rest("notizie?select=*&order=creato.desc", { token: await token() });
}
export async function aggiornaNotizia(id, campi) {
  return rest(`notizie?id=eq.${id}`, { method: "PATCH", body: campi, token: await token(), prefer: "return=minimal" });
}
export async function notiziePubbliche() {
  if (!online()) return [];
  return rest("notizie?select=id,categoria,titolo,sintesi,dettagli,aziende,fonte_nome,fonte_url,fonte_url_2,data_fonte,approvato&stato=eq.pubblicata&order=approvato.desc");
}

// ---------- registro dello scanner (solo lettura, tranne le regole) ----------
export async function registroScanner(tabella, query) {
  if (!online()) return [];
  return rest(`${tabella}?${query}`, { token: await token() });
}
export async function salvaRegola(nome, testo) {
  return rest(`scanner_regole?nome=eq.${encodeURIComponent(nome)}`, { method: "PATCH", body: { testo, aggiornato: new Date().toISOString() }, token: await token(), prefer: "return=minimal" });
}

// ---------- foto e locandine dal modulo Segnala (Supabase Storage, cartella "segnalazioni") ----------
// La foto viene rimpicciolita nel browser (lato lungo 1600 px, JPEG) prima di partire:
// pesa poco, si carica in fretta e va bene sia come anteprima sia aperta in grande.
async function rimpicciolisci(file, lato = 1600) {
  const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = URL.createObjectURL(file); });
  const k = Math.min(1, lato / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(img.src);
  return new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.82));
}
export async function caricaFoto(file) {
  if (!file || !online()) return null;
  if (!/^image\//.test(file.type)) throw new Error("Serve un'immagine (JPG, PNG…).");
  const blob = await rimpicciolisci(file);
  const nome = `${new Date().toISOString().slice(0, 10)}/${Math.random().toString(36).slice(2, 10)}.jpg`;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/segnalazioni/${nome}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "image/jpeg" },
    body: blob,
  });
  if (!r.ok) throw new Error("Caricamento della foto non riuscito.");
  return `${SUPABASE_URL}/storage/v1/object/public/segnalazioni/${nome}`;
}
