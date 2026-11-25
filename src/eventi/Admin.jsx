import { useEffect, useState } from "react";
import { online, accedi, esci, sessione, livello, fattoreAttivo, nuovoFattore, verificaCodice, tuttiGliEventi, salvaEvento, eliminaEvento, pickupPoints, salvaPickup } from "./api.js";
import { cercaLuogo } from "./geo.js";
import { TIPI_ORG, fmtData, oraNota, senzaAuto } from "./shared.js";
import { CampiEvento, Campo } from "./Segnala.jsx";
import Posta from "./Posta.jsx";
import { ARTICOLI } from "../blog.js";
import { Attori, Notizie, Registro, CATEGORIE } from "./AdminScanner.jsx";

// Backend di moderazione: bevotoscano.com/admin (non è nel menu).
const toInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromInput = (v) => (v ? new Date(v).toISOString() : null);

const NUOVO = {
  stato: "in_attesa", titolo: "", descrizione: "", inizio: "", fine: "", altre_date: "", luogo_nome: "", indirizzo: "",
  comune: "", lat: null, lng: null, vini: "", guidato: false, accesso: ["auto"], pickup: [], prezzo: "", link: "",
  criteri_ok: true, org_tipo: "cantina", org_nome: "", org_referente: "", org_email: "", org_telefono: "", org_social: "", note_admin: "",
};

export default function Admin() {
  const [s, setS] = useState(sessione);
  const [area, setArea] = useState("eventi");
  if (online() && !s) return <Login onOk={setS} />;
  if (online() && livello(s) !== "aal2") return <Codice email={s.email} onOk={setS} onEsci={() => { esci(); setS(null); }} />;
  const fuori = () => { esci(); setS(null); };
  return (
    <>
      <div className="chips">
        <button className={`chip ${area === "eventi" ? "chip--on" : ""}`} onClick={() => setArea("eventi")}>Eventi</button>
        {[["attori", "Cantine ed enoteche"], ["notizie", "Notizie"], ["scanner", "Scanner"], ["posta", "Posta info@"]].map(([k, l]) => (
          <button key={k} className={`chip ${area === k ? "chip--on" : ""}`} onClick={() => setArea(k)}>{l}</button>
        ))}
      </div>
      {area === "eventi" && <Moderazione email={s?.email} onEsci={fuori} />}
      {area === "attori" && <Attori onEsci={fuori} />}
      {area === "notizie" && <Notizie onEsci={fuori} />}
      {area === "scanner" && <Registro onEsci={fuori} />}
      {area === "posta" && <Posta onSessione={fuori} />}
    </>
  );
}

function Login({ onOk }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  return (
    <form className="card" onSubmit={async (e) => { e.preventDefault(); try { onOk(await accedi(email, pw)); } catch (x) { setErr(x.message); } }}>
      <h1 className="page-title">Area admin</h1>
      <input className="input" type="email" autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" type="password" autoComplete="current-password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
      {err && <p className="error">{err}</p>}
      <button className="btn btn--primary" type="submit">Entra</button>
    </form>
  );
}

// Supabase manda il QR come SVG dentro un indirizzo "data:" non codificato: i "#" dei colori
// lo spezzano e il browser non disegna niente. Qui lo ricodifichiamo per bene.
const qrSicuro = (q) => {
  if (!q) return "";
  const i = q.indexOf("<svg");
  return i < 0 ? q : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(q.slice(i))}`;
};

// Secondo passo dopo la password: le 6 cifre dell'app (Google Authenticator o simili).
// La prima volta mostra il QR da inquadrare; dalle volte dopo chiede solo il codice.
function Codice({ email, onOk, onEsci }) {
  const [fattore, setFattore] = useState(undefined); // undefined = carico, null = da attivare
  const [nuovo, setNuovo] = useState(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [invio, setInvio] = useState(false);
  const guasto = (x) => (x.message === "sessione" ? onEsci() : setErr(x.message));
  useEffect(() => {
    fattoreAttivo().then(async (f) => {
      setFattore(f);
      if (!f) setNuovo(await nuovoFattore());
    }).catch(guasto);
  }, []);
  const id = fattore?.id || nuovo?.id;
  const invia = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) return setErr("Scrivi le 6 cifre che vedi nell'app.");
    setErr(""); setInvio(true);
    try { onOk(await verificaCodice(id, code.trim())); } catch (x) { setInvio(false); setCode(""); x.message === "sessione" ? onEsci() : setErr("Codice non giusto o scaduto: riprova con quello nuovo."); }
  };
  return (
    <form className="card stack" onSubmit={invia}>
      <h1 className="page-title">Codice di accesso</h1>
      <small className="muted">{email}</small>
      {fattore === undefined && !err && <p className="muted">Un attimo…</p>}
      {fattore === null && nuovo && (
        <>
          <p>Prima volta: apri <b>Google Authenticator</b> (o un'app simile), tocca <b>+</b> e inquadra questo codice.</p>
          <img src={qrSicuro(nuovo.totp.qr_code)} alt="Codice QR da inquadrare" style={{ width: 200, height: 200, background: "#fff", borderRadius: 12, alignSelf: "center" }} />
          <small className="muted">Non riesci a inquadrarlo? Inserisci a mano questa chiave: <code style={{ wordBreak: "break-all" }}>{nuovo.totp.secret}</code></small>
          <p>Poi scrivi qui sotto le 6 cifre che compaiono nell'app.</p>
        </>
      )}
      {fattore && <p>Scrivi le 6 cifre che vedi ora nell'app di autenticazione.</p>}
      {id && <input className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />}
      {err && <p className="error">{err}</p>}
      <div className="row">
        {id && <button className="btn btn--primary" type="submit" disabled={invio}>{invio ? "Controllo…" : "Entra"}</button>}
        <button type="button" className="link" onClick={onEsci}>Esci</button>
      </div>
    </form>
  );
}

function Moderazione({ email, onEsci }) {
  const [eventi, setEventi] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [tab, setTab] = useState("in_attesa");
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState("");

  const carica = () => {
    tuttiGliEventi().then(setEventi).catch((e) => (e.message === "sessione" ? onEsci() : setErr(e.message)));
    pickupPoints().then(setPickups).catch(() => {});
  };
  useEffect(carica, []);

  const azione = async (fn) => { setErr(""); try { await fn(); carica(); } catch (e) { e.message === "sessione" ? onEsci() : setErr(e.message); } };

  if (edit) {
    return <Editor ev={edit} pickups={pickups} onPickupSalvato={carica} onAnnulla={() => setEdit(null)}
      onSalva={(ev) => azione(async () => { await salvaEvento(ev); setEdit(null); })} err={err} />;
  }

  const conta = (st) => (eventi || []).filter((e) => e.stato === st).length;
  // da approvare: prima quelli che il verificatore dà per pronti, poi da completare, poi da scartare
  const lista = (eventi || []).filter((e) => e.stato === tab)
    .sort((a, b) => (tab === "in_attesa" ? (ORDINE_VERIFICA[a.verifica] ?? 1.5) - (ORDINE_VERIFICA[b.verifica] ?? 1.5) : 0));

  return (
    <>
      <div className="row between">
        <h1 className="page-title">Admin eventi</h1>
        {email && <button className="link" onClick={onEsci}>Esci</button>}
      </div>
      {!online() && <p className="rule">Modalità prova: il database non è collegato, quindi tutto resta in questo browser. Gli eventi segnalati dal form compaiono qui.</p>}
      <div className="chips">
        {[["in_attesa", "Da approvare"], ["pubblicato", "Pubblicati"], ["rifiutato", "Rifiutati"]].map(([k, l]) => (
          <button key={k} className={`chip ${tab === k ? "chip--on" : ""}`} onClick={() => setTab(k)}>{l} ({conta(k)})</button>
        ))}
        <button className="chip" onClick={() => setEdit({ ...NUOVO })}>+ Nuovo evento</button>
      </div>
      {err && <p className="error">{err}</p>}
      {!eventi && <p className="muted">Carico…</p>}
      {eventi && lista.length === 0 && <p className="muted">Niente qui.</p>}
      <div className="list">
        {lista.map((e) => (
          <article key={e.id} className="card">
            <div className="admin-testa">
              <Origine fonte={e.fonte} />
              <small className="evento-data">{fmtData(e.inizio, oraNota(e))}{oraNota(e) ? "" : " · ora non trovata"} · {e.comune}</small>
              {e.verifica && <Verifica v={e.verifica} />}
              {e.categoria && <small className="admin-cat">{CATEGORIE[e.categoria] || e.categoria}</small>}
              {e.fonte_url && <a className="link" href={e.fonte_url} target="_blank" rel="noopener"><small>dove l'ha trovato ↗</small></a>}
            </div>
            <strong className="evento-titolo">{e.titolo}</strong>
            {e.verifica_note && <p className="admin-nota"><b>Il verificatore:</b> {e.verifica_note}</p>}
            {e.note_scanner && <p className="admin-nota admin-nota--chiara"><b>Note dello scanner:</b> {e.note_scanner}</p>}
            {(e.orari || e.prenotazione || e.prezzo) && (
              <small>{[e.orari && `🕒 ${e.orari}${e.orario_trovato === false ? " (orario non trovato)" : ""}`, e.prezzo && `💶 ${e.prezzo}`, e.prenotazione && `Prenotazione ${e.prenotazione}`].filter(Boolean).join(" · ")}</small>
            )}
            <small>{TIPI_ORG[e.org_tipo] || e.org_tipo}: <b>{e.org_nome}</b>{e.org_referente ? ` (${e.org_referente})` : ""}</small>
            <small>
              {e.org_email && <a className="link" href={`mailto:${e.org_email}`}>{e.org_email}</a>} {e.org_telefono} {e.org_social}
            </small>
            {e.descrizione && <p className="muted clamp">{e.descrizione}</p>}
            <small>
              {senzaAuto(e) ? "🚌 Senza auto" : "🚗 Solo auto"} · {e.guidato ? "guidato" : "non guidato"} · pickup: {(e.pickup || []).length}
              {e.lat == null && " · ⚠️ mancano le coordinate"}
              {(e.pickup || []).some((p) => p.lat == null) && " · ⚠️ pickup senza coordinate"}
            </small>
            {e.note_admin && <small>📝 {e.note_admin}</small>}
            <div className="row">
              {e.stato !== "pubblicato" && <button className="btn btn--primary" onClick={() => (e.lat == null ? setEdit(e) : azione(() => salvaEvento({ id: e.id, stato: "pubblicato", approvato: new Date().toISOString() })))}>{e.lat == null ? "Completa e approva" : "Approva"}</button>}
              <button className="btn btn--outline" onClick={() => setEdit(e)}>Modifica</button>
              {e.stato !== "rifiutato" && <button className="link" onClick={() => {
                const motivo = prompt("Motivo del rifiuto (resta nelle note, puoi mandarlo all'organizzatore):", "");
                if (motivo === null) return;
                azione(() => salvaEvento({ id: e.id, stato: "rifiutato", note_admin: motivo }));
                if (motivo && e.org_email) window.open(`mailto:${e.org_email}?subject=${encodeURIComponent(`Il vostro evento su Bevotoscano: ${e.titolo}`)}&body=${encodeURIComponent(`Ciao,\n\ngrazie per averci segnalato "${e.titolo}". Per ora non possiamo pubblicarlo: ${motivo}\n\nUn saluto,\nBevotoscano`)}`);
              }}>Rifiuta</button>}
              <button className="link" onClick={() => confirm("Eliminare definitivamente questo evento?") && azione(() => eliminaEvento(e.id))}>Elimina</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

// Le ricerche da provare in ordine: nome del posto + comune, indirizzo (che spesso contiene già il comune), solo il comune.
function tentativiLuogo(v) {
  const pulisci = (t) => (t || "").replace(/centro storico,?/gi, "").replace(/\s{2,}/g, " ").replace(/\s+,/g, ",").replace(/^[\s,]+|[\s,]+$/g, "");
  const conComune = (t) => { t = pulisci(t); return !t ? "" : v.comune && !t.toLowerCase().includes(v.comune.toLowerCase()) ? `${t}, ${v.comune}` : t; };
  // per primo l'indirizzo completo scritto dall'admin (solo admin, non si vede nell'app)
  return [...new Set([pulisci(v.indirizzo_mappa), conComune(v.luogo_nome), conComune(v.indirizzo), v.comune].filter(Boolean))];
}

// Coordinate incollate a mano: "43.8433, 10.5027" oppure un link di Google Maps con "@43.84,10.50" o "?q=43.84,10.50".
function coordinateIncollate(t) {
  const m = (t || "").match(/(?:@|q=|ll=|^\s*)(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
  if (!m) return null;
  const lat = +m[1], lng = +m[2];
  return lat > 42 && lat < 44.6 && lng > 9.5 && lng < 12.6 ? { lat, lng, nome: `Coordinate incollate: ${lat}, ${lng}` } : null;
}

function Trova({ testo, onTrovato, label = "Trova coordinate" }) {
  const [ris, setRis] = useState(null);
  const [msg, setMsg] = useState("");
  return (
    <div className="stack">
      <button type="button" className="btn btn--outline" onClick={async () => {
        setMsg("Cerco…");
        // prova dal testo più preciso al più generico: "luogo, indirizzo, comune" spesso non dà risultati
        try {
          const diretta = coordinateIncollate([].concat(testo)[0]);
          if (diretta) { onTrovato(diretta); setRis(null); setMsg("✓ Coordinate prese da quello che hai incollato"); return; }
          let r = [];
          for (const t of [].concat(testo).filter(Boolean)) { r = await cercaLuogo(t); if (r.length) break; }
          setRis(r); setMsg(r.length ? "" : "Nessun risultato: prova a scrivere meglio indirizzo o comune");
        } catch (e) { setMsg(e.message); }
      }}>{label}</button>
      {ris && ris.map((r) => <button type="button" key={`${r.lat},${r.lng}`} className="link" onClick={() => { onTrovato(r); setRis(null); }}>{r.nome}</button>)}
      {msg && <small>{msg}</small>}
    </div>
  );
}

function Editor({ ev, pickups, onAnnulla, onSalva, onPickupSalvato, err }) {
  const [v, setV] = useState({ ...NUOVO, ...ev, inizio: toInput(ev.inizio), fine: toInput(ev.fine), pickup: ev.pickup || [], accesso: ev.accesso || ["auto"] });
  const set = (k, val) => setV((x) => ({ ...x, [k]: val }));

  const pickupExtra = (p, onSet) => (
    <div className="pk-extra">
      <select className="input" value="" onChange={(e) => { const x = pickups.find((q) => String(q.id) === e.target.value); if (x) onSet({ nome: x.nome, lat: x.lat, lng: x.lng }); }}>
        <option value="">{p.lat != null ? `✓ ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` : "Scegli tra i pickup salvati…"}</option>
        {pickups.map((q) => <option key={q.id} value={q.id}>{q.nome}</option>)}
      </select>
      {p.nome && <Trova testo={p.nome} label="Cerca sulla mappa" onTrovato={(r) => onSet({ lat: r.lat, lng: r.lng })} />}
      {p.lat != null && !pickups.some((q) => q.nome === p.nome) && (
        <button type="button" className="link" onClick={() => salvaPickup({ nome: p.nome, comune: v.comune || null, lat: p.lat, lng: p.lng }).then(onPickupSalvato)}>Salva tra i pickup riutilizzabili</button>
      )}
    </div>
  );

  const salva = (pubblica) => {
    const out = { ...v, inizio: fromInput(v.inizio), fine: fromInput(v.fine) };
    if (!out.titolo || !out.inizio || !out.comune || !out.org_nome) return alert("Mancano titolo, data, comune o organizzatore.");
    if (pubblica) {
      if (out.lat == null) return alert("Per pubblicare servono le coordinate del luogo: usa «Trova coordinate».");
      out.stato = "pubblicato";
      out.approvato = out.approvato || new Date().toISOString();
    }
    // gli eventi dello scanner possono restare senza email (la chiede solo il modulo Segnala)
    if (!out.org_email && out.fonte !== "scanner") out.org_email = "admin@bevotoscano.com";
    if (!out.accesso.includes("bus")) out.pickup = [];
    out.pickup = out.pickup.filter((p) => p.nome);
    delete out.esempio;
    onSalva(out);
  };

  return (
    <div className="stack form">
      <button className="link" onClick={onAnnulla}>← Torna alla lista</button>
      <h1 className="page-title">{ev.id ? "Modifica evento" : "Nuovo evento"}</h1>
      <section className="card">
        <strong>Organizzatore</strong>
        <select className="input" value={v.org_tipo} onChange={(e) => set("org_tipo", e.target.value)}>
          {Object.entries(TIPI_ORG).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input className="input" placeholder="Nome organizzazione *" value={v.org_nome} onChange={(e) => set("org_nome", e.target.value)} />
        <div className="due">
          <input className="input" placeholder="Email (non pubblica)" value={v.org_email} onChange={(e) => set("org_email", e.target.value)} />
          <input className="input" placeholder="Instagram o sito" value={v.org_social || ""} onChange={(e) => set("org_social", e.target.value)} />
        </div>
      </section>
      <section className="card">
        <strong>Evento</strong>
        <CampiEvento v={v} set={set} pickupExtra={pickupExtra} />
        <Campo label="Indirizzo per la mappa (solo admin)" hint="Indirizzo completo, es. «Piazza San Michele 1, 55100 Lucca». Non compare nell'app: serve solo a trovare le coordinate giuste. Puoi anche incollare le coordinate o un link di Google Maps.">
          <input className="input" maxLength={300} value={v.indirizzo_mappa || ""} onChange={(e) => set("indirizzo_mappa", e.target.value || null)} placeholder="Via, numero civico, CAP, comune" />
        </Campo>
        <Campo label="Coordinate del luogo" hint={v.lat != null ? `✓ ${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}` : "Servono per la mappa e le distanze"}>
          <Trova testo={tentativiLuogo(v)} onTrovato={(r) => setV((x) => ({ ...x, lat: r.lat, lng: r.lng }))} />
        </Campo>
        <Campo label="Foto (link a un'immagine)" hint="Va in cima alla scheda dell'evento. Usa la foto ufficiale dal sito dell'evento.">
          <input className="input" type="url" maxLength={300} value={v.immagine || ""} onChange={(e) => set("immagine", e.target.value.trim() || null)} placeholder="https://…jpg" />
        </Campo>
        {v.immagine && <img src={v.immagine} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 12 }} />}
        <Campo label="Articolo del blog collegato" hint="Sulla pagina dell'evento compare «Leggi l'articolo», e nell'articolo compare l'evento.">
          <select className="input" value={v.articolo || ""} onChange={(e) => set("articolo", e.target.value || null)}>
            <option value="">Nessuno</option>
            {ARTICOLI.map((a) => <option key={a.id} value={a.id}>{a.titolo}</option>)}
          </select>
        </Campo>
        <div className="due">
          <Campo label="Categoria">
            <select className="input" value={v.categoria || ""} onChange={(e) => set("categoria", e.target.value || null)}>
              <option value="">—</option>
              {Object.entries(CATEGORIE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Campo>
          <Campo label="Prenotazione">
            <select className="input" value={v.prenotazione || ""} onChange={(e) => set("prenotazione", e.target.value || null)}>
              <option value="">—</option>
              {["obbligatoria", "consigliata", "no"].map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Campo>
        </div>
        <div className="due">
          <Campo label="Orari (testo)"><input className="input" maxLength={200} value={v.orari || ""} onChange={(e) => set("orari", e.target.value || null)} placeholder="Es. 17-23, sabato e domenica" /></Campo>
          <Campo label="Provincia">
            <select className="input" value={v.provincia || ""} onChange={(e) => set("provincia", e.target.value || null)}>
              <option value="">—</option>
              {["FI", "SI", "PI", "LI", "LU", "AR", "GR", "PT", "PO", "MS"].map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Campo>
        </div>
        <Campo label="Note interne"><textarea className="input" rows={2} value={v.note_admin || ""} onChange={(e) => set("note_admin", e.target.value)} /></Campo>
      </section>
      {err && <p className="error">{err}</p>}
      <div className="row">
        <button className="btn btn--primary" onClick={() => salva(true)}>Salva e pubblica</button>
        <button className="btn btn--outline" onClick={() => salva(false)}>Salva senza pubblicare</button>
      </div>
    </div>
  );
}

// Da dove arriva l'evento: trovato dall'agente di ricerca, proposto col modulo Segnala, o inserito a mano.
const ORIGINI = {
  scanner: ["🤖 Trovato dall'IA", "admin-origine--ia"],
  form: ["✍️ Dal modulo Segnala", "admin-origine--form"],
  admin: ["Inserito da te", "admin-origine--admin"],
};
function Origine({ fonte }) {
  const [testo, cls] = ORIGINI[fonte] || [fonte || "Origine sconosciuta", ""];
  return <span className={`admin-origine ${cls}`}>{testo}</span>;
}

// L'esito del verificatore (routine 6 dello scanner).
const ORDINE_VERIFICA = { pronto: 0, da_completare: 1, da_scartare: 2 };
const VERIFICHE = {
  pronto: ["✓ Pronto", "admin-verifica--ok"],
  da_completare: ["Da completare", "admin-verifica--mezzo"],
  da_scartare: ["Da scartare", "admin-verifica--no"],
};
function Verifica({ v }) {
  const [testo, cls] = VERIFICHE[v] || [v, ""];
  return <span className={`admin-origine ${cls}`}>{testo}</span>;
}
