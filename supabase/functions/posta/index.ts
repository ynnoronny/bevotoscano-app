// Supabase Edge Function "posta": la casella info@bevotoscano.com dentro #/admin.
// La password di Aruba sta SOLO nei secret di Supabase (ARUBA_PASSWORD), mai nel sito.
// Risponde solo a chi ha fatto login nell'admin ed è nella tabella "admin".
import { ImapFlow } from "npm:imapflow@2.11.0";
import nodemailer from "npm:nodemailer@10.4.1";
import PostalMime from "npm:postal-mime@4.2.0";
import { creaPosta } from "./posta.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function eAdmin(authHeader: string) {
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY")!, Authorization: authHeader, "Content-Type": "application/json" },
    body: "{}",
  });
  return r.ok && (await r.json()) === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ errore: "Usa POST" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ") || !(await eAdmin(authHeader))) return json({ errore: "sessione" }, 401);

  const password = Deno.env.get("ARUBA_PASSWORD");
  if (!password) return json({ errore: "Manca la password della casella: va inserita in Supabase come secret ARUBA_PASSWORD." }, 503);

  const posta = creaPosta({
    ImapFlow, nodemailer, PostalMime,
    cfg: {
      utente: Deno.env.get("ARUBA_USER") || "info@bevotoscano.com",
      password,
      nomeMittente: Deno.env.get("ARUBA_NOME") || "Bevotoscano",
      imapHost: "imaps.aruba.it", imapPorta: 993,
      // 465 (SSL): Supabase blocca le porte 25 e 587.
      smtpHost: "smtps.aruba.it", smtpPorta: 465,
    },
  });

  let azione = "", dati: Record<string, unknown> = {};
  try { ({ azione, ...dati } = await req.json()); } catch { return json({ errore: "Richiesta non valida" }, 400); }
  const fn = { cartelle: posta.cartelle, lista: posta.lista, leggi: posta.leggi, allegato: posta.allegato, invia: posta.invia }[azione];
  if (!fn) return json({ errore: "Azione sconosciuta" }, 400);

  try {
    return json(await fn(dati as never));
  } catch (e) {
    const msg = String((e as Error)?.message || e);
    console.error(azione, msg, (e as { responseText?: string })?.responseText || "");
    if (/auth|login|credenz|535|NO \[AUTHENTICATIONFAILED\]/i.test(msg + ((e as { responseText?: string })?.responseText || "")))
      return json({ errore: "Aruba non accetta la password della casella. Controlla il secret ARUBA_PASSWORD." }, 502);
    return json({ errore: `Problema con la posta: ${msg}` }, 502);
  }
});
