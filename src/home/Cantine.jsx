import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TILE, TILE_ATTR } from "../tema.js";
import { CANTINE } from "../data.js";
import { eventiPubblici, attoriPubblici } from "../eventi/api.js";
import { siglaProvincia } from "../province.js";
import { go } from "../nav.js";
import Link from "../Link.jsx";
import { pos } from "./luoghi.js";
import { ZONE, zonaDi } from "../zone.js";
import { Filtri, Riga, Scelta, Interruttore } from "./Filtri.jsx";
import { cantinaPercorso, cantinaMeta, cantinaJsonLd, briciole, applicaMeta, eventoPercorso } from "../seo.js";

const SIGLA = { Pisa: "PI", Firenze: "FI", Siena: "SI", Livorno: "LI", Lucca: "LU", Arezzo: "AR", Grosseto: "GR", Pistoia: "PT", Prato: "PO", "Massa-Carrara": "MS" };
const dove = (c) => [`${c.comune || ""}${c.provincia ? ` (${SIGLA[c.provincia] || c.provincia})` : ""}`, c.zona].filter(Boolean).join(" · ");
const PROVINCIA = Object.fromEntries(Object.entries(SIGLA).map(([n, s]) => [s, n]));

// Le realtà approvate dal gestionale (le trova lo scanner o le segnalano gli utenti) si aggiungono
// alle cantine scritte a mano in data.js. Non hanno ancora una scheda: portano al sito o a Google Maps.
const TIPI_DB = { cantina: "Cantina", azienda_agricola: "Azienda agricola", fattoria: "Fattoria", enoteca: "Enoteca", wine_bar: "Wine bar", ristorante: "Ristorante" };
const daAttore = (a) => ({
  id: `r${a.id}`, db: true, nome: a.nome, comune: a.comune, tipo: TIPI_DB[a.tipo],
  provincia: PROVINCIA[siglaProvincia(a.comune)] || null,
  zona: zonaDi(a.lat != null ? [a.lat, a.lng] : null), lat: a.lat, lng: a.lng,
  sito: a.sito ? (/^https?:\/\//.test(a.sito) ? a.sito : `https://${a.sito}`) : null, maps: a.google_maps,
});
function useCantine() {
  const [extra, setExtra] = useState([]);
  useEffect(() => {
    const note = new Set(CANTINE.map((c) => c.nome.toLowerCase()));
    attoriPubblici().then((l) => setExtra((l || []).filter((a) => TIPI_DB[a.tipo] && !note.has(a.nome.toLowerCase())).map(daAttore))).catch(() => {});
  }, []);
  return useMemo(() => [...CANTINE, ...extra], [extra]);
}

function MappaCantine({ cantine, attiva, onScegli, zona, onZona, tutte = CANTINE }) {
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const zone = useRef(null);
  useEffect(() => {
    map.current = L.map(box.current, { scrollWheelZoom: false }).setView([43.55, 10.7], 9);
    L.tileLayer(TILE, { className: "tile-calde", maxZoom: 16, attribution: TILE_ATTR }).addTo(map.current);
    zone.current = L.layerGroup().addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);
  useEffect(() => {
    if (!onZona) return;
    zone.current.clearLayers();
    // tutte le zone del vino toscano, anche quelle dove non abbiamo ancora cantine
    ZONE.forEach((a) => {
      const on = a.zona === zona;
      const n = tutte.filter((c) => c.zona === a.zona).length;
      const cerchio = L.circle(a.centro, { radius: a.km * 1000, color: "#432543", weight: on ? 2.5 : 1.5, dashArray: on ? null : "5 6", fillColor: on ? "#F2B33D" : "#432543", fillOpacity: on ? 0.22 : n ? 0.09 : 0.03, opacity: n || on ? 1 : 0.45 })
        // il nome resta scritto solo dove ci sono cantine (o sulla zona scelta): le altre lo mostrano al tocco
        .bindTooltip(n ? `${a.zona} · ${n}` : a.zona, { permanent: !!n || on, direction: "center", className: `zona-tip ${n ? "" : "zona-tip--vuota"}` })
        .on("click", () => onZona(on ? "Tutte" : a.zona))
        .addTo(zone.current);
      if (on) map.current.fitBounds(cerchio.getBounds(), { padding: [10, 10] });
    });
    if (zona === "Tutte") {
      const b = L.featureGroup(zone.current.getLayers()).getBounds();
      if (b.isValid()) map.current.fitBounds(b, { padding: [12, 12] });
    }
  }, [zona, tutte]);
  useEffect(() => {
    layer.current.clearLayers();
    const punti = [];
    cantine.forEach((c, i) => {
      const p = pos(c);
      if (!p) return;
      // piccolo scostamento per le cantine dello stesso comune, così non si sovrappongono
      const q = [p[0] + (i % 3) * 0.004, p[1] + (i % 2) * 0.006];
      const on = c.id === attiva;
      L.circleMarker(q, { radius: on ? 11 : 8, color: "#FFFDF8", weight: 2, fillColor: on ? "#B3243B" : c.intervistata ? "#B3243B" : "#432543", fillOpacity: 1 })
        .bindTooltip(c.nome).on("click", () => onScegli(c.id)).addTo(layer.current);
      punti.push(q);
    });
    if (!onZona && punti.length) map.current.fitBounds(punti, { padding: [36, 36], maxZoom: 12 });
  }, [cantine, attiva]);
  return <div ref={box} className="mappa mappa--bassa" />;
}

const Grappolo = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="9" cy="9" r="2.4" /><circle cx="14" cy="9" r="2.4" /><circle cx="11.5" cy="13" r="2.4" /><circle cx="6.8" cy="13" r="2.2" /><circle cx="16.2" cy="13" r="2.2" /><circle cx="9.2" cy="17" r="2.2" /><circle cx="13.8" cy="17" r="2.2" /><circle cx="11.5" cy="20.6" r="2" />
    <path d="M11.5 6.5V3.2M11.5 4.5c1.5-1.6 3.6-2 5.5-1.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </svg>
);

function Foto({ c, grande }) {
  if (c.foto) return <img className={`cant-foto ${grande ? "cant-foto--grande" : ""}`} src={c.foto} alt={c.nome} loading="lazy" />;
  return <span className={`cant-foto cant-foto--vuota ${grande ? "cant-foto--grande" : ""}`}><Grappolo /></span>;
}

function Segni({ c }) {
  const [info, setInfo] = useState(false);
  const premi = c.premi || [];
  if (!c.intervistata && !premi.length) return null;
  return (
    <div className="cant-segni">
      {c.intervistata && (
        c.reel
          ? <a className="cant-segno cant-segno--ok" href={c.reel} target="_blank" rel="noopener" onClick={(x) => x.stopPropagation()}>✓ Intervistata</a>
          : <span className="cant-segno cant-segno--ok">✓ Intervistata</span>
      )}
      {premi.length > 0 && (
        <span className="cant-premi">
          <button className="cant-segno cant-segno--premi" aria-expanded={info} onClick={(x) => { x.stopPropagation(); setInfo((v) => !v); }}
            onMouseEnter={() => setInfo(true)} onMouseLeave={() => setInfo(false)}>
            🏅 {premi.length === 1 ? "1 premio" : `${premi.length} premi`} <i aria-hidden="true">i</i>
          </button>
          {info && (
            <span className="cant-premi-box" role="tooltip">
              {premi.slice(0, 3).map((p) => <span key={p}>{p}</span>)}
              {premi.length > 3 && <em>e altri {premi.length - 3}</em>}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

export default function Cantine({ apri }) {
  const scheda = apri && CANTINE.find((c) => c.id === apri);
  if (scheda) return <Scheda c={scheda} />;
  return <Elenco />;
}

// La pagina di una cantina: bevotoscano.com/cantine/fibbiano
function Scheda({ c }) {
  const [eventi, setEventi] = useState([]);
  useEffect(() => { eventiPubblici().then(setEventi).catch(() => {}); }, []);
  useEffect(() => {
    applicaMeta(cantinaMeta(c), [cantinaJsonLd(c, pos(c)), briciole([["Cantine", "cantine"], [c.nome, cantinaPercorso(c)]])]);
  }, [c.id]);
  const ev = eventi.filter((e) => [e.org_nome, e.luogo_nome].some((n) => (n || "").toLowerCase() === c.nome.toLowerCase()));
  const vicine = CANTINE.filter((x) => x.id !== c.id && (x.comune === c.comune || x.zona === c.zona)).slice(0, 4);
  return (
    <div className="cant-scheda">
      {c.foto && <Foto c={c} grande />}
      <div className="cant-scheda-testa">
        <p className="cant-dove">{dove(c)}</p>
        <h1 className="page-title">{c.nome}</h1>
        <Segni c={c} />
      </div>
      <section className="cant-blocco cant-blocco--vino">
        {c.vinoPiuToscano
          ? <p>Il suo vino più toscano: <b>{c.vinoPiuToscano}</b></p>
          : <p>Una piccola cantina di {c.comune}, in provincia di {c.provincia}, zona {c.zona}. Presto andiamo a trovarla e le chiediamo qual è il suo vino più toscano.</p>}
        <div className="cant-azioni">
          {c.sito && <a className="cant-btn" href={c.sito} target="_blank" rel="noopener">Sito della cantina ↗</a>}
          {c.reel && <a className="cant-btn cant-btn--chiaro" href={c.reel} target="_blank" rel="noopener">Guarda l'intervista ↗</a>}
        </div>
      </section>
      {(c.premi || []).length > 0 && (
        <section className="cant-blocco">
          <strong>Premi</strong>
          <ul className="cant-lista-premi">{c.premi.map((p) => <li key={p}>🏅 {p}</li>)}</ul>
        </section>
      )}
      <MappaCantine cantine={[c]} attiva={c.id} onScegli={() => {}} />
      {ev.length > 0 && (
        <section className="cant-blocco">
          <strong>Eventi in arrivo</strong>
          {ev.map((e) => <Link key={e.id} className="link" to={eventoPercorso(e)}>{e.titolo}</Link>)}
        </section>
      )}
      {vicine.length > 0 && (
        <section className="cant-blocco">
          <strong>Altre cantine qui vicino</strong>
          {vicine.map((x) => <Link key={x.id} className="cant-vicina" to={cantinaPercorso(x)}><Foto c={x} /><span><b>{x.nome}</b><small>{dove(x)}</small></span></Link>)}
        </section>
      )}
    </div>
  );
}

function Elenco() {
  const [zona, setZona] = useState("Tutte");
  const [provincia, setProvincia] = useState("");
  const [soloIntervistate, setSoloIntervistate] = useState(false);
  const [soloPremiate, setSoloPremiate] = useState(false);
  const [attiva, setAttiva] = useState(null);
  const [eventi, setEventi] = useState([]);
  useEffect(() => { eventiPubblici().then(setEventi).catch(() => {}); }, []);
  const tutte = useCantine();

  const zone = useMemo(() => {
    const piene = [...new Set(tutte.map((c) => c.zona).filter(Boolean))];
    const elenco = [["Tutte", `Tutte · ${tutte.length}`], ...piene.map((z) => [z, `${z} · ${tutte.filter((c) => c.zona === z).length}`])];
    // una zona ancora vuota scelta dalla mappa compare tra le scelte, così si vede dove sei
    if (zona !== "Tutte" && !piene.includes(zona)) elenco.push([zona, `${zona} · 0`]);
    return elenco;
  }, [zona, tutte]);
  const province = useMemo(() => [...new Set(tutte.map((c) => c.provincia).filter(Boolean))], [tutte]);
  const lista = tutte.filter((c) => (zona === "Tutte" || c.zona === zona) && (!provincia || c.provincia === provincia)
    && (!soloIntervistate || c.intervistata) && (!soloPremiate || (c.premi || []).length))
    // prima le cantine dove siamo già stati
    .sort((a, b) => (b.intervistata ? 1 : 0) - (a.intervistata ? 1 : 0));
  const eventiDi = (c) => eventi.filter((e) => (e.org_nome || "").toLowerCase() === c.nome.toLowerCase() || (e.luogo_nome || "").toLowerCase() === c.nome.toLowerCase());

  const scegli = (id) => {
    setAttiva(id);
    document.getElementById(`cantina-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="feed">
      <Filtri>
        <Riga etichetta="Zona"><Scelta opzioni={zone} valore={zona} onCambia={(z) => { setZona(z); setAttiva(null); }} /></Riga>
        <Riga etichetta="Mostra">
          <label className={`filtri-sel ${provincia ? "on" : ""}`}>
            <select value={provincia} onChange={(x) => setProvincia(x.target.value)} aria-label="Provincia">
              <option value="">Tutte le province</option>
              {province.map((p) => <option key={p} value={p}>Provincia di {p}</option>)}
            </select>
          </label>
          <Interruttore on={soloIntervistate} onCambia={setSoloIntervistate}>✓ Intervistate</Interruttore>
          <Interruttore on={soloPremiate} onCambia={setSoloPremiate}>🏅 Premiate</Interruttore>
        </Riga>
      </Filtri>

      <MappaCantine cantine={lista} tutte={tutte} attiva={attiva} onScegli={scegli} zona={zona} onZona={(z) => { setZona(z); setAttiva(null); }} />
      <p className="tiny">Tocca una zona sulla mappa per vederla da vicino.</p>

      {lista.length === 0 && (zona !== "Tutte" && !tutte.some((c) => c.zona === zona)
        ? <p className="feed-vuoto">In zona {zona} non abbiamo ancora cantine. Ne conosci una? <Link className="link" to="segnala/cantina">Proponila</Link>.</p>
        : <p className="feed-vuoto">Nessuna cantina con questi filtri, per ora.</p>)}
      <div className="feed-griglia">
        {lista.map((c) => {
          const ev = eventiDi(c);
          return (
            <article key={c.id} id={`cantina-${c.id}`} className={`cant ${attiva === c.id ? "cant--on" : ""}`} onClick={() => setAttiva(c.id)}>
              {c.db ? (
                <div className="cant-testa">
                  <Foto c={c} />
                  <span className="cant-nome">
                    <strong>{c.nome}</strong>
                    <small>{[c.tipo !== "Cantina" && c.tipo, dove(c)].filter(Boolean).join(" · ")}</small>
                  </span>
                </div>
              ) : (
                <Link to={cantinaPercorso(c)} className="cant-testa" onClick={(x) => x.stopPropagation()}>
                  <Foto c={c} />
                  <span className="cant-nome">
                    <strong>{c.nome}</strong>
                    <small>{dove(c)}</small>
                  </span>
                </Link>
              )}
              <Segni c={c} />
              {c.vinoPiuToscano
                ? <p className="cant-vino">Il suo vino più toscano: <b>{c.vinoPiuToscano}</b></p>
                : <p className="cant-vino cant-vino--presto">Il suo vino più toscano? Glielo chiediamo presto.</p>}
              {ev.length > 0 && (
                <button className="cant-ev" onClick={(x) => { x.stopPropagation(); go(eventoPercorso(ev[0])); }}>
                  📅 {ev.length === 1 ? "1 evento in arrivo" : `${ev.length} eventi in arrivo`}
                </button>
              )}
              <div className="cant-azioni">
                {c.db
                  ? c.maps && <a className="cant-btn" href={c.maps} target="_blank" rel="noopener" onClick={(x) => x.stopPropagation()}>Mappa ↗</a>
                  : <Link className="cant-btn" to={cantinaPercorso(c)} onClick={(x) => x.stopPropagation()}>Scheda →</Link>}
                {c.sito && <a className="cant-btn cant-btn--chiaro" href={c.sito} target="_blank" rel="noopener" onClick={(x) => x.stopPropagation()}>Sito ↗</a>}
              </div>
            </article>
          );
        })}
      </div>

      <section className="cant-invito">
        <strong>Conosci una cantina che merita?</strong>
        <p>Proponila: la valutiamo e andiamo a conoscerla di persona.</p>
        <div className="cant-azioni">
          <Link className="cant-btn cant-btn--sole" to="segnala/cantina">Proponi una cantina</Link>
        </div>
      </section>
    </div>
  );
}
