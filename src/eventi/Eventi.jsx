import { useEffect, useMemo, useState } from "react";
import { eventiPubblici } from "./api.js";
import { km, fmtKm, cercaLuogo, posizioneAttuale, CITTA } from "./geo.js";
import { ACCESSI, senzaAuto, fmtData } from "./shared.js";
import Mappa from "./Mappa.jsx";

const go = (path) => { window.location.hash = `/${path}`; };
const POS_KEY = "bevotoscano-posizione";

const QUANDO = [
  ["tutte", "Tutte le date"],
  ["weekend", "Questo weekend"],
  ["7", "Prossimi 7 giorni"],
  ["30", "Prossimi 30 giorni"],
];
const RAGGIO = [["0", "Ovunque"], ["15", "Entro 15 km"], ["30", "Entro 30 km"], ["60", "Entro 60 km"]];

function nelPeriodo(e, quando) {
  if (quando === "tutte") return true;
  const t = new Date(e.inizio), ora = new Date();
  if (quando === "weekend") {
    const ven = new Date(ora); ven.setDate(ora.getDate() + ((5 - ora.getDay() + 7) % 7)); ven.setHours(0, 0, 0, 0);
    if (ora.getDay() === 6 || ora.getDay() === 0) ven.setDate(ven.getDate() - 7);
    const fine = new Date(ven); fine.setDate(ven.getDate() + 3);
    return t >= ven && t < fine;
  }
  return t - ora < +quando * 86400000;
}

// Per ogni evento: il pickup più vicino a te e la distanza dalla destinazione.
function conDistanze(e, centro) {
  const dDest = km(centro, e);
  let best = null;
  (e.pickup || []).forEach((p) => {
    const d = km(centro, p);
    if (d != null && (!best || d < best.d)) best = { ...p, d };
  });
  const vicino = Math.min(...[dDest, best?.d].filter((x) => x != null));
  return { ...e, dDest, pickupVicino: best, vicino: Number.isFinite(vicino) ? vicino : null };
}

export default function Eventi({ apri }) {
  const [eventi, setEventi] = useState(null);
  const [errore, setErrore] = useState("");
  const [centro, setCentro] = useState(() => { try { return JSON.parse(localStorage.getItem(POS_KEY)); } catch { return null; } });
  const [f, setF] = useState({ senzaAuto: false, guidato: false, quando: "tutte", raggio: "0" });
  const [vista, setVista] = useState("lista");

  useEffect(() => { eventiPubblici().then(setEventi).catch(() => setErrore("Non riesco a caricare gli eventi.")); }, []);
  useEffect(() => { try { localStorage.setItem(POS_KEY, JSON.stringify(centro)); } catch { /* niente */ } }, [centro]);

  const lista = useMemo(() => {
    if (!eventi) return [];
    return eventi
      .map((e) => conDistanze(e, centro))
      .filter((e) => (!f.senzaAuto || senzaAuto(e)) && (!f.guidato || e.guidato) && nelPeriodo(e, f.quando))
      .filter((e) => f.raggio === "0" || !centro || (e.vicino != null && e.vicino <= +f.raggio))
      .sort((a, b) => (centro && a.vicino != null && b.vicino != null ? a.vicino - b.vicino : a.inizio.localeCompare(b.inizio)));
  }, [eventi, centro, f]);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  if (apri) {
    const e = eventi && eventi.find((x) => String(x.id) === apri);
    if (!eventi) return <p className="muted">Carico…</p>;
    if (!e) return <><p className="muted">Evento non trovato o già passato.</p><button className="link" onClick={() => go("eventi")}>← Tutti gli eventi</button></>;
    return <Dettaglio e={conDistanze(e, centro)} centro={centro} />;
  }

  return (
    <>
      <h1 className="page-title">Eventi del vino</h1>
      <p className="muted">Gli eventi del vino toscano, con chi il vino lo fa. Scegli da dove parti: ti mostriamo i punti di raccolta più vicini.</p>

      <Partenza centro={centro} setCentro={setCentro} />

      <div className="chips">
        <button className={`chip ${f.senzaAuto ? "chip--on" : ""}`} onClick={() => set("senzaAuto", !f.senzaAuto)}>🚌 Senza auto</button>
        <button className={`chip ${f.guidato ? "chip--on" : ""}`} onClick={() => set("guidato", !f.guidato)}>🧭 Con guida</button>
        <select className="chip chip--select" value={f.quando} onChange={(e) => set("quando", e.target.value)}>
          {QUANDO.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {centro && (
          <select className="chip chip--select" value={f.raggio} onChange={(e) => set("raggio", e.target.value)}>
            {RAGGIO.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
      </div>

      <div className="seg">
        <button className={vista === "lista" ? "seg--on" : ""} onClick={() => setVista("lista")}>Lista</button>
        <button className={vista === "mappa" ? "seg--on" : ""} onClick={() => setVista("mappa")}>Mappa</button>
      </div>

      {errore && <p className="error">{errore}</p>}
      {!eventi && !errore && <p className="muted">Carico gli eventi…</p>}

      {eventi && vista === "mappa" && <Mappa eventi={lista} centro={centro} onApri={(e) => go(`eventi/${e.id}`)} />}

      {eventi && (
        <div className="list">
          {lista.length === 0 && <p className="muted">Nessun evento con questi filtri. Prova ad allargare la distanza o le date.</p>}
          {lista.map((e) => <Scheda key={e.id} e={e} centro={centro} />)}
        </div>
      )}

      <section className="card">
        <strong>Organizzi un evento del vino in Toscana?</strong>
        <p className="muted">Cantine, enoteche, aziende bus: segnalarlo è gratis e richiede due minuti.</p>
        <button className="btn btn--outline" onClick={() => go("segnala")}>Segnala un evento</button>
      </section>
    </>
  );
}

function Partenza({ centro, setCentro }) {
  const [q, setQ] = useState("");
  const [ris, setRis] = useState([]);
  const [msg, setMsg] = useState("");
  const vicinoAMe = async () => {
    setMsg("Cerco la tua posizione…");
    try { setCentro(await posizioneAttuale()); setMsg(""); } catch (e) { setMsg(e.message); }
  };
  const cerca = async (ev) => {
    ev.preventDefault();
    if (q.trim().length < 3) return;
    setMsg("Cerco…");
    try { const r = await cercaLuogo(q); setRis(r); setMsg(r.length ? "" : "Nessun risultato"); } catch (e) { setMsg(e.message); }
  };
  return (
    <section className="card partenza">
      <div className="row between">
        <strong>📍 {centro ? `Parti da: ${centro.nome}` : "Da dove parti?"}</strong>
        {centro && <button className="link" onClick={() => setCentro(null)}>Cambia</button>}
      </div>
      {!centro && (
        <>
          <button className="btn btn--primary" onClick={vicinoAMe}>Usa la mia posizione</button>
          <div className="chips">
            {CITTA.map((c) => <button key={c.nome} className="chip" onClick={() => setCentro(c)}>{c.nome}</button>)}
          </div>
          <form className="row nowrap" onSubmit={cerca}>
            <input className="input" placeholder="Oppure scrivi un comune o un indirizzo" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn--outline" type="submit">Cerca</button>
          </form>
          {ris.map((r) => <button key={`${r.lat},${r.lng}`} className="link" onClick={() => { setCentro(r); setRis([]); setQ(""); }}>{r.nome}</button>)}
        </>
      )}
      {msg && <small>{msg}</small>}
    </section>
  );
}

function Badges({ e }) {
  return (
    <div className="badges">
      {senzaAuto(e) && <span className="badge badge--gold">🚌 Senza auto</span>}
      {e.guidato && <span className="badge">🧭 Con guida</span>}
      {e.prezzo && <span className="badge">{e.prezzo}</span>}
      {e.esempio && <span className="badge badge--demo">Esempio</span>}
    </div>
  );
}

function Viaggio({ e, centro }) {
  const p = e.pickupVicino;
  return (
    <div className="viaggio">
      {p && (
        <div><span>🚌</span> <b>Pickup{centro ? ` a ${fmtKm(p.d)}` : ""}</b>: {p.nome}{p.orario ? `, ore ${p.orario}` : ""}</div>
      )}
      <div><span>🍷</span> <b>{e.luogo_nome}</b>, {e.comune}{centro && e.dDest != null ? ` · ${fmtKm(e.dDest)} da te` : ""}</div>
    </div>
  );
}

function Scheda({ e, centro }) {
  return (
    <button className="card evento" onClick={() => go(`eventi/${e.id}`)}>
      <small className="evento-data">{fmtData(e.inizio)}</small>
      <strong className="evento-titolo">{e.titolo}</strong>
      <Viaggio e={e} centro={centro} />
      <Badges e={e} />
    </button>
  );
}

function Dettaglio({ e, centro }) {
  const maps = e.lat != null ? `https://www.openstreetmap.org/?mlat=${e.lat}&mlon=${e.lng}#map=14/${e.lat}/${e.lng}` : null;
  return (
    <>
      <button className="link" onClick={() => go("eventi")}>← Tutti gli eventi</button>
      <p className="eyebrow">{fmtData(e.inizio)}{e.fine ? ` → ${new Date(e.fine).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}` : ""}</p>
      <h1 className="page-title">{e.titolo}</h1>
      <Badges e={e} />
      {e.altre_date && <p className="muted">Altre date: {e.altre_date}</p>}
      {e.descrizione && <p>{e.descrizione}</p>}
      {e.vini && <p className="cantina-wine">Nel bicchiere: <b>{e.vini}</b></p>}

      <section className="card">
        <strong>Come ci arrivi</strong>
        <ul className="checks">
          {(e.accesso || []).map((a) => <li key={a}>{ACCESSI[a]?.icon} {ACCESSI[a]?.label || a}</li>)}
        </ul>
        {(e.pickup || []).length > 0 && (
          <div className="stack">
            <small>Punti di raccolta</small>
            {[...e.pickup].map((p) => ({ ...p, d: km(centro, p) })).sort((a, b) => (a.d ?? 0) - (b.d ?? 0)).map((p) => (
              <div key={p.nome} className="pickup">
                <span>🚌 {p.nome}</span>
                <span className="tiny">{p.orario ? `ore ${p.orario}` : ""}{p.d != null ? ` · ${fmtKm(p.d)}` : ""}</span>
              </div>
            ))}
          </div>
        )}
        <div className="pickup"><span>🍷 {e.luogo_nome}, {e.indirizzo ? `${e.indirizzo}, ` : ""}{e.comune}</span>{maps && <a className="link" href={maps} target="_blank" rel="noopener">Mappa</a>}</div>
      </section>

      <section className="card">
        <strong>Organizza {e.org_nome}</strong>
        <small>Le informazioni sono fornite dall'organizzatore: verifica sempre date e prezzi con lui prima di andare.</small>
        <div className="row">
          {e.link && <a className="btn btn--primary" href={e.link} target="_blank" rel="noopener">Info e prenotazioni</a>}
          {e.org_social && <a className="link" href={e.org_social.startsWith("http") ? e.org_social : `https://instagram.com/${e.org_social.replace("@", "")}`} target="_blank" rel="noopener">Profilo</a>}
        </div>
      </section>
      <p className="tiny">🍷 Bevi responsabilmente: se bevi, non guidare.</p>
    </>
  );
}
