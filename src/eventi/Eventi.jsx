import { useEffect, useMemo, useState } from "react";
import { eventiPubblici } from "./api.js";
import { km, fmtKm, cercaLuogo, posizioneAttuale, CITTA } from "./geo.js";
import { ACCESSI, senzaAuto, fmtData, oraNota, conNavetta } from "./shared.js";
import Mappa from "./Mappa.jsx";
import CondividiEvento from "./Condividi.jsx";
import Cuore from "../Cuore.jsx";
import { copiaEvento } from "../preferiti.js";

import { go } from "../nav.js";
import Link from "../Link.jsx";
import AggiungiCalendario, { indicazioniUrl } from "./Calendario.jsx";
import { conProvincia } from "../province.js";
import { articolo } from "../blog.js";
import { eventoPercorso, idDaPercorso, eventoMeta, eventoJsonLd, briciole, applicaMeta } from "../seo.js";
const POS_KEY = "bevotoscano-posizione";

const QUANDO = [
  ["tutte", "Tutte le date"],
  ["weekend", "Questo weekend"],
  ["7", "Prossimi 7 giorni"],
  ["30", "Prossimi 30 giorni"],
];
const RAGGIO = [["0", "Ovunque"], ["15", "Entro 15 km"], ["30", "Entro 30 km"], ["60", "Entro 60 km"]];

export function nelPeriodo(e, quando) {
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

const PRESET = {
  weekend: { quando: "weekend" },
  "senza-auto": { senzaAuto: true },
};

export default function Eventi({ apri: sub }) {
  // /eventi/weekend, /eventi/senza-auto, /eventi/vicino sono scorciatoie dalla Home; il resto è l'id di un evento.
  const preset = PRESET[sub] || {};
  const apri = sub && !PRESET[sub] && sub !== "vicino" ? sub : null;
  const [eventi, setEventi] = useState(null);
  const [errore, setErrore] = useState("");
  const [centro, setCentro] = useState(() => { try { return JSON.parse(localStorage.getItem(POS_KEY)); } catch { return null; } });
  const [f, setF] = useState({ senzaAuto: false, guidato: false, quando: "tutte", raggio: "0", ...preset });
  useEffect(() => { if (PRESET[sub]) setF((x) => ({ ...x, ...PRESET[sub] })); }, [sub]);
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
    const e = eventi && eventi.find((x) => String(x.id) === idDaPercorso(apri));
    if (!eventi) return <p className="muted">Carico…</p>;
    if (!e) return <><p className="muted">Evento non trovato o già passato.</p><button className="link" onClick={() => go("eventi")}>← Tutti gli eventi</button></>;
    return <Dettaglio e={conDistanze(e, centro)} centro={centro} />;
  }

  return (
    <>
      <h1 className="page-title">Eventi del vino</h1>
      <p className="muted">Gli eventi del vino toscano, con chi il vino lo fa. Curiosa tra tutti, oppure cerca vicino a te: ti mostriamo anche i punti di raccolta dei bus.</p>

      <Partenza centro={centro} setCentro={setCentro} subito={sub === "vicino"} />

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

      {eventi && vista === "mappa" && <Mappa eventi={lista} centro={centro} onApri={(e) => go(eventoPercorso(e))} />}

      {eventi && (
        <div className="list">
          {lista.length === 0 && <p className="muted">Nessun evento con questi filtri. Prova ad allargare la distanza o le date.</p>}
          {lista.map((e, i) => {
            const m = meseAnno(e.inizio);
            const nuovoMese = !centro && (i === 0 || meseAnno(lista[i - 1].inizio) !== m);
            return (
              <div key={e.id} className="stack">
                {nuovoMese && <h3 className="mese">{m}</h3>}
                <Scheda e={e} centro={centro} />
              </div>
            );
          })}
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

const meseAnno = (iso) => new Date(iso).toLocaleDateString("it-IT", { month: "long", year: "numeric" });

function Partenza({ centro, setCentro, subito }) {
  const [aperto, setAperto] = useState(false);
  const [q, setQ] = useState("");
  const [ris, setRis] = useState([]);
  const [msg, setMsg] = useState("");
  const vicinoAMe = async () => {
    setMsg("Cerco la tua posizione…");
    try { setCentro(await posizioneAttuale()); setMsg(""); setAperto(false); } catch (e) { setMsg(e.message); setAperto(true); }
  };
  useEffect(() => { if (subito && !centro) vicinoAMe(); }, [subito]);
  const cerca = async (ev) => {
    ev.preventDefault();
    if (q.trim().length < 3) return;
    setMsg("Cerco…");
    try { const r = await cercaLuogo(q); setRis(r); setMsg(r.length ? "" : "Nessun risultato"); } catch (e) { setMsg(e.message); }
  };
  const scegli = (c) => { setCentro(c); setAperto(false); };
  return (
    <section className="card partenza">
      <div className="row between">
        <strong>📍 {centro ? `Vicino a: ${centro.nome}` : "Tutta la Toscana"}</strong>
        {centro
          ? <button className="link" onClick={() => setCentro(null)}>Mostra tutti</button>
          : !aperto && <button className="link" onClick={() => setAperto(true)}>Cerca vicino a te</button>}
      </div>
      {!centro && aperto && (
        <>
          <button className="btn btn--primary" onClick={vicinoAMe}>Usa la mia posizione</button>
          <div className="chips">
            {CITTA.map((c) => <button key={c.nome} className="chip" onClick={() => scegli(c)}>{c.nome}</button>)}
          </div>
          <form className="row nowrap" onSubmit={cerca}>
            <input className="input" placeholder="Oppure scrivi un comune o un indirizzo" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn--outline" type="submit">Cerca</button>
          </form>
          {ris.map((r) => <button key={`${r.lat},${r.lng}`} className="link" onClick={() => { scegli(r); setRis([]); setQ(""); }}>{r.nome}</button>)}
        </>
      )}
      {msg && <small>{msg}</small>}
    </section>
  );
}

function Badges({ e }) {
  return (
    <div className="badges">
      {conNavetta(e) && <span className="badge badge--gold">🚐 Con navetta</span>}
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
    <Link className="card evento" to={eventoPercorso(e)}>
      <small className="evento-data">{fmtData(e.inizio, oraNota(e))}</small>
      <strong className="evento-titolo">{e.titolo}</strong>
      <Viaggio e={e} centro={centro} />
      <Badges e={e} />
    </Link>
  );
}

function Dettaglio({ e, centro }) {
  // Titolo, anteprima e dati strutturati (schema.org/Event) per Google.
  useEffect(() => {
    applicaMeta(eventoMeta(e), [eventoJsonLd(e), briciole([["Eventi", "eventi"], [e.titolo, eventoPercorso(e)]])]);
    if (idDaPercorso(window.location.pathname.split("/")[2]) && !window.location.pathname.endsWith(eventoPercorso(e))) {
      window.history.replaceState(null, "", `/${eventoPercorso(e)}`);
    }
    return () => applicaMeta(null);
  }, [e.id]);
  const maps = e.lat != null ? `https://www.openstreetmap.org/?mlat=${e.lat}&mlon=${e.lng}#map=14/${e.lat}/${e.lng}` : null;
  return (
    <>
      <p className="eyebrow">{e.fine && new Date(e.fine).toDateString() !== new Date(e.inizio).toDateString()
        ? `Dal ${fmtData(e.inizio, false)} al ${fmtData(e.fine, false)}`
        : oraNota(e) ? `${fmtData(e.inizio)}${e.fine ? ` → ${new Date(e.fine).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}` : ""}` : fmtData(e.inizio, false)}{e.orari ? ` · ${e.orari}` : ""}</p>
      <div className="evento-testa">
        <h1 className="page-title">{e.titolo}</h1>
        <Cuore tipo="eventi" id={e.id} nome={e.titolo} copia={() => copiaEvento(e, eventoPercorso(e))} className="cuore--grande" />
      </div>
      {/* la foto o la locandina, in grande: un tocco la apre intera */}
      {e.immagine && <a href={e.immagine} target="_blank" rel="noopener"><img className="evento-img" src={e.immagine} alt={`Foto di ${e.titolo}`} /></a>}
      <Badges e={e} />
      <AggiungiCalendario e={e} percorso={eventoPercorso(e)} className="cal--pagina" />
      <CondividiEvento e={e} grande />
      {e.altre_date && <p className="muted">Altre date: {e.altre_date}</p>}
      {e.descrizione && <p>{e.descrizione}</p>}
      {articolo(e.articolo) && (
        <Link className="evento-articolo" to={`blog/${e.articolo}`}>
          <span className="art-tag">Dal blog</span>
          <strong>{articolo(e.articolo).titolo}</strong>
          <span className="art-leggi">Leggi l'articolo →</span>
        </Link>
      )}
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
        <div className="pickup"><span>🍷 {e.luogo_nome}, {e.indirizzo ? `${e.indirizzo}, ` : ""}{conProvincia(e.comune)}</span>{indicazioniUrl(e) && <a className="link" href={indicazioniUrl(e)} target="_blank" rel="noopener">Indicazioni</a>}</div>
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
