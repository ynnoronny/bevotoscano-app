import { useEffect, useState } from "react";
import { online, accedi, esci, sessione, tuttiGliEventi, salvaEvento, eliminaEvento, pickupPoints, salvaPickup, tutteLeProposte, decidiProposta } from "./api.js";
import { cercaLuogo } from "./geo.js";
import { TIPI_ORG, fmtData, senzaAuto } from "./shared.js";
import { CampiEvento, Campo } from "./Segnala.jsx";
import Posta from "./Posta.jsx";

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
  const fuori = () => { esci(); setS(null); };
  return (
    <>
      <div className="chips">
        <button className={`chip ${area === "eventi" ? "chip--on" : ""}`} onClick={() => setArea("eventi")}>Eventi</button>
        <button className={`chip ${area === "proposte" ? "chip--on" : ""}`} onClick={() => setArea("proposte")}>Cantine ed enoteche</button>
        <button className={`chip ${area === "posta" ? "chip--on" : ""}`} onClick={() => setArea("posta")}>Posta info@</button>
      </div>
      {area === "eventi" && <Moderazione email={s?.email} onEsci={fuori} />}
      {area === "proposte" && <Proposte onEsci={fuori} />}
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
      <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
      {err && <p className="error">{err}</p>}
      <button className="btn btn--primary" type="submit">Entra</button>
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
  const lista = (eventi || []).filter((e) => e.stato === tab);

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
              <small className="evento-data">{fmtData(e.inizio)} · {e.comune}</small>
              {e.fonte_url && <a className="link" href={e.fonte_url} target="_blank" rel="noopener"><small>dove l'ha trovato ↗</small></a>}
            </div>
            <strong className="evento-titolo">{e.titolo}</strong>
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

function Trova({ testo, onTrovato, label = "Trova coordinate" }) {
  const [ris, setRis] = useState(null);
  const [msg, setMsg] = useState("");
  return (
    <div className="stack">
      <button type="button" className="btn btn--outline" onClick={async () => {
        setMsg("Cerco…");
        try { const r = await cercaLuogo(testo); setRis(r); setMsg(r.length ? "" : "Nessun risultato: prova a scrivere meglio indirizzo o comune"); } catch (e) { setMsg(e.message); }
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
    if (!out.org_email) out.org_email = "admin@bevotoscano.com";
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
        <Campo label="Coordinate del luogo" hint={v.lat != null ? `✓ ${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}` : "Servono per la mappa e le distanze"}>
          <Trova testo={[v.luogo_nome, v.indirizzo, v.comune].filter(Boolean).join(", ")} onTrovato={(r) => setV((x) => ({ ...x, lat: r.lat, lng: r.lng }))} />
        </Campo>
        <Campo label="Foto (link a un'immagine)" hint="Va in cima alla scheda dell'evento. Usa la foto ufficiale dal sito dell'evento.">
          <input className="input" type="url" maxLength={300} value={v.immagine || ""} onChange={(e) => set("immagine", e.target.value.trim() || null)} placeholder="https://…jpg" />
        </Campo>
        {v.immagine && <img src={v.immagine} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 12 }} />}
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

// Le cantine e le enoteche proposte dal pulsante "Segnala": si approvano o si scartano.
// Approvare non le pubblica da sola: segna che vanno inserite nell'app.
function Proposte({ onEsci }) {
  const [lista, setLista] = useState(null);
  const [tab, setTab] = useState("in_attesa");
  const [err, setErr] = useState("");
  const carica = () => tutteLeProposte().then(setLista).catch((e) => {
    if (e.message === "sessione") return onEsci();
    setLista([]);
    setErr(/proposte/.test(e.message) ? "La coda delle proposte non è ancora attiva nel database." : e.message);
  });
  useEffect(() => { carica(); }, []);
  const decidi = async (id, stato) => {
    setErr("");
    try { await decidiProposta(id, stato); carica(); } catch (e) { e.message === "sessione" ? onEsci() : setErr(e.message); }
  };
  const conta = (st) => (lista || []).filter((p) => p.stato === st).length;
  const vista = (lista || []).filter((p) => p.stato === tab);
  return (
    <>
      <h1 className="page-title">Cantine ed enoteche proposte</h1>
      <div className="chips">
        {[["in_attesa", "Da valutare"], ["approvata", "Approvate"], ["scartata", "Scartate"]].map(([k, l]) => (
          <button key={k} className={`chip ${tab === k ? "chip--on" : ""}`} onClick={() => setTab(k)}>{l} ({conta(k)})</button>
        ))}
      </div>
      {err && <p className="error">{err}</p>}
      {!lista && <p className="muted">Carico…</p>}
      {lista && vista.length === 0 && !err && <p className="muted">Niente qui.</p>}
      <div className="list">
        {vista.map((p) => (
          <article key={p.id} className="card">
            <small className="evento-data">{p.tipo === "cantina" ? "🍇 Cantina" : "🍷 Enoteca"} · {p.comune} · {fmtData(p.creato)}</small>
            <strong className="evento-titolo">{p.nome}</strong>
            {p.sito && <a className="link" href={p.sito.startsWith("http") ? p.sito : `https://${p.sito}`} target="_blank" rel="noopener">{p.sito}</a>}
            <small>{p.ruolo === "titolare" ? "La propone chi ci lavora" : "La consiglia un cliente"}{p.referente ? `: ${p.referente}` : ""} · <a className="link" href={`mailto:${p.email}`}>{p.email}</a></small>
            {p.note && <p className="muted">{p.note}</p>}
            <div className="row">
              {p.stato !== "approvata" && <button className="btn btn--primary" onClick={() => decidi(p.id, "approvata")}>Approva</button>}
              {p.stato !== "scartata" && <button className="btn btn--outline" onClick={() => decidi(p.id, "scartata")}>Scarta</button>}
              {p.stato !== "in_attesa" && <button className="link" onClick={() => decidi(p.id, "in_attesa")}>Rimetti da valutare</button>}
            </div>
          </article>
        ))}
      </div>
    </>
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
