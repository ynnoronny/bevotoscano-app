import { useEffect, useState } from "react";
import { posta } from "./api.js";

// La casella info@bevotoscano.com dentro #/admin. Legge e invia passando dalla funzione
// Supabase "posta": la password di Aruba non arriva mai nel browser.

const quando = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const oggi = new Date().toDateString() === d.toDateString();
  return oggi ? d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
};
const chi = (p) => (p ? p.nome || p.email : "");
const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

const NOMI = { "\\Inbox": "In arrivo", "\\Sent": "Inviate", "\\Junk": "Spam", "\\Trash": "Cestino", "\\Drafts": "Bozze" };

export default function Posta({ onSessione }) {
  const [cartelle, setCartelle] = useState([{ path: "INBOX", speciale: "\\Inbox" }]);
  const [cartella, setCartella] = useState("INBOX");
  const [lista, setLista] = useState(null);
  const [altre, setAltre] = useState(null);
  const [aperta, setAperta] = useState(null);
  const [scrivi, setScrivi] = useState(null);
  const [err, setErr] = useState("");
  const [carico, setCarico] = useState(false);

  const gestisci = (e) => (e.message === "sessione" ? onSessione() : setErr(e.message));

  const carica = (prima) => {
    setErr(""); setCarico(true);
    posta("lista", { cartella, prima })
      .then((r) => { setLista((l) => (prima ? [...(l || []), ...r.mail] : r.mail)); setAltre(r.altre); })
      .catch(gestisci)
      .finally(() => setCarico(false));
  };
  useEffect(() => { setLista(null); carica(); }, [cartella]);
  useEffect(() => { posta("cartelle").then((c) => c.length && setCartelle(c)).catch(() => {}); }, []);

  const apri = (m) => {
    setErr(""); setAperta({ ...m, caricando: true });
    posta("leggi", { cartella, uid: m.uid })
      .then((d) => { setAperta(d); setLista((l) => l.map((x) => (x.uid === m.uid ? { ...x, letta: true } : x))); })
      .catch((e) => { setAperta(null); gestisci(e); });
  };

  if (scrivi) {
    return <Scrivi bozza={scrivi} onAnnulla={() => setScrivi(null)} onInviata={(uid) => {
      setScrivi(null);
      if (uid) setLista((l) => l.map((x) => (x.uid === uid ? { ...x, risposta: true } : x)));
    }} onSessione={onSessione} />;
  }

  if (aperta) return <Mail m={aperta} cartella={cartella} onIndietro={() => setAperta(null)} onScrivi={setScrivi} onErrore={gestisci} err={err} />;

  const visibili = cartelle.filter((c) => c.speciale !== "\\Drafts");
  return (
    <>
      <div className="chips">
        {visibili.map((c) => (
          <button key={c.path} className={`chip ${cartella === c.path ? "chip--on" : ""}`} onClick={() => setCartella(c.path)}>
            {NOMI[c.speciale] || c.nome || c.path}
          </button>
        ))}
        <button className="chip" onClick={() => setScrivi({ a: "", oggetto: "", testo: "" })}>+ Scrivi</button>
        <button className="chip" onClick={() => carica()} disabled={carico}>↻ Aggiorna</button>
      </div>
      {err && <p className="error">{err}</p>}
      {!lista && !err && <p className="muted">Apro la casella…</p>}
      {lista && lista.length === 0 && <p className="muted">Nessuna mail qui.</p>}
      <div className="posta-lista">
        {(lista || []).map((m) => (
          <button key={m.uid} className={`posta-riga ${m.letta ? "" : "posta-riga--nuova"}`} onClick={() => apri(m)}>
            <span className="posta-chi">{cartella === "INBOX" ? chi(m.da) : `A: ${m.a.map(chi).join(", ")}`}</span>
            <span className="posta-quando">{m.risposta && "↩ "}{quando(m.data)}</span>
            <span className="posta-oggetto">{m.oggetto}</span>
          </button>
        ))}
      </div>
      {altre && <button className="btn btn--outline" disabled={carico} onClick={() => carica(altre)}>{carico ? "Carico…" : "Mostra mail più vecchie"}</button>}
    </>
  );
}

function Mail({ m, cartella, onIndietro, onScrivi, onErrore, err }) {
  const rispondi = (tutti) => {
    const a = (m.rispondiA || m.da)?.email || "";
    const cc = tutti ? [...m.a, ...m.cc].map((p) => p.email).filter((e) => e && !/info@bevotoscano\.com/i.test(e) && e !== a).join(", ") : "";
    const citata = (m.testo || "").split("\n").map((r) => `> ${r}`).join("\n");
    onScrivi({
      a, cc,
      oggetto: /^re:/i.test(m.oggetto) ? m.oggetto : `Re: ${m.oggetto}`,
      testo: `\n\n${new Date(m.data).toLocaleString("it-IT")}, ${chi(m.da)} ha scritto:\n${citata}`,
      inReplyTo: m.messageId,
      references: [m.references, m.messageId].filter(Boolean).join(" "),
      rispostaUid: cartella === "INBOX" ? m.uid : null,
      cartella,
    });
  };
  const inoltra = () => onScrivi({ a: "", oggetto: `I: ${m.oggetto}`, testo: `\n\n---------- Messaggio inoltrato ----------\nDa: ${chi(m.da)} <${m.da?.email}>\nOggetto: ${m.oggetto}\n\n${m.testo}` });
  const scarica = async (x) => {
    try {
      const f = await posta("allegato", { cartella, uid: m.uid, indice: x.indice });
      const bytes = Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: f.tipo }));
      Object.assign(document.createElement("a"), { href: url, download: f.nome }).click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) { onErrore(e); }
  };

  return (
    <div className="stack">
      <button className="link" onClick={onIndietro}>← Torna alla posta</button>
      <h1 className="section-title">{m.oggetto}</h1>
      <small className="muted">
        Da <b>{chi(m.da)}</b> {m.da?.nome && `<${m.da.email}>`}<br />
        {m.a?.length > 0 && <>A {m.a.map(chi).join(", ")}<br /></>}
        {m.cc?.length > 0 && <>Cc {m.cc.map(chi).join(", ")}<br /></>}
        {m.data && new Date(m.data).toLocaleString("it-IT")}
      </small>
      {m.caricando ? <p className="muted">Apro la mail…</p> : (
        <>
          <div className="row">
            <button className="btn btn--primary" onClick={() => rispondi(false)}>Rispondi</button>
            {(m.a?.length > 1 || m.cc?.length > 0) && <button className="btn btn--outline" onClick={() => rispondi(true)}>Rispondi a tutti</button>}
            <button className="link" onClick={inoltra}>Inoltra</button>
          </div>
          {m.allegati?.length > 0 && (
            <div className="chips">
              {m.allegati.map((x) => <button key={x.indice} className="chip" onClick={() => scarica(x)}>📎 {x.nome} · {kb(x.dimensione)}</button>)}
            </div>
          )}
          {err && <p className="error">{err}</p>}
          {m.html
            ? <iframe className="posta-corpo" title="Mail" sandbox="allow-popups allow-popups-to-escape-sandbox"
                srcDoc={`<base target="_blank"><style>body{font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;margin:12px;word-wrap:break-word}img{max-width:100%;height:auto}</style>${m.html}`} />
            : <pre className="posta-testo card">{m.testo}</pre>}
        </>
      )}
    </div>
  );
}

function Scrivi({ bozza, onAnnulla, onInviata, onSessione }) {
  const [v, setV] = useState(bozza);
  const [stato, setStato] = useState("");
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));

  const invia = async () => {
    if (!v.a.trim()) return setStato("Manca il destinatario.");
    setStato("Invio…");
    try {
      const r = await posta("invia", v);
      alert(r.salvataInInviata ? "Mail inviata." : "Mail inviata (non sono riuscito a salvarne la copia in Inviate).");
      onInviata(v.rispostaUid);
    } catch (e) {
      if (e.message === "sessione") return onSessione();
      setStato(e.message);
    }
  };

  return (
    <div className="stack form">
      <button className="link" onClick={() => (v.testo === bozza.testo || confirm("Lasciare questa mail senza inviarla?")) && onAnnulla()}>← Annulla</button>
      <h1 className="section-title">{bozza.inReplyTo ? "Rispondi" : "Nuova mail"}</h1>
      <small className="muted">Da: Bevotoscano &lt;info@bevotoscano.com&gt;</small>
      <input className="input" type="email" multiple placeholder="A" value={v.a} onChange={set("a")} />
      {(v.cc || !bozza.inReplyTo) && <input className="input" placeholder="Cc (facoltativo)" value={v.cc || ""} onChange={set("cc")} />}
      <input className="input" placeholder="Oggetto" value={v.oggetto} onChange={set("oggetto")} />
      <textarea className="input" rows={12} value={v.testo} onChange={set("testo")} autoFocus
        onFocus={(e) => bozza.inReplyTo && e.target.setSelectionRange(0, 0)} />
      {stato && <p className={stato === "Invio…" ? "muted" : "error"}>{stato}</p>}
      <button className="btn btn--primary" onClick={invia} disabled={stato === "Invio…"}>Invia</button>
    </div>
  );
}
