import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CANTINE, INSTAGRAM_URL } from "../data.js";
import { eventiPubblici } from "../eventi/api.js";
import { senzaAuto } from "../eventi/shared.js";
import { nelPeriodo } from "../eventi/Eventi.jsx";
import { km, fmtKm, posizioneAttuale, CITTA } from "../eventi/geo.js";
import { pos } from "./luoghi.js";
import { DOMANDE } from "../games/quizData.js";
import { SEGNI, segnoDa } from "../games/oroscopoData.js";
import MESE from "../games/oroscopoMese.json";
import Link from "../Link.jsx";
import { go } from "../nav.js";
import { eventoPercorso, cantinaPercorso } from "../seo.js";

// "Mappa del vino": tutta Bevotoscano in una sola schermata. La Toscana è lo sfondo,
// gli eventi sono i punti accesi, e sopra galleggiano l'elenco, il quiz e l'oroscopo.
// Su computer il pannello sta a sinistra; sul telefono è un foglio che sale dal basso.

import { TILE, TILE_ATTR, VINO, VIOLA, SOLE, BIANCO } from "../tema.js";

const POS_KEY = "bevotoscano-posizione";
const SALVATI = "bevotoscano-ci-vado";
const leggi = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const scrivi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* niente */ } };

const giorno = (iso) => new Date(iso).getDate();
const mese = (iso) => new Date(iso).toLocaleDateString("it-IT", { month: "short" }).replace(".", "").toUpperCase();
const quando = (iso) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("it-IT", { weekday: "short" }).replace(".", "")} ${d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
};

function comeArrivi(e, centro) {
  const pk = [...(e.pickup || [])].map((p) => ({ ...p, d: km(centro, p) })).sort((a, b) => (a.d ?? 0) - (b.d ?? 0))[0];
  if (pk) return `bus da ${pk.nome.split(",")[0]}${pk.orario ? ` ${pk.orario}` : ""}`;
  if ((e.accesso || []).includes("treno")) return "in treno o coi mezzi";
  if ((e.accesso || []).includes("piedi")) return "a piedi dal centro";
  return "in auto";
}

// Una domanda al giorno, uguale per tutti: cambia a mezzanotte.
function domandaDelGiorno() {
  const oggi = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const q = DOMANDE[oggi % DOMANDE.length];
  const opzioni = [...q.r].sort((a, b) => ((a.length * 7 + oggi) % 5) - ((b.length * 7 + oggi) % 5) || a.localeCompare(b));
  return { testo: q.d, giusta: q.r[0], opzioni };
}

function useMappa(box) {
  const ref = useRef(null);
  useEffect(() => {
    const m = L.map(box.current, { zoomControl: false, attributionControl: true }).setView([43.45, 11.0], 8);
    L.tileLayer(TILE, { maxZoom: 18, attribution: TILE_ATTR, className: "tile-calde" }).addTo(m);
    L.control.zoom({ position: "topright" }).addTo(m);
    ref.current = { m, eventi: L.layerGroup().addTo(m), cantine: L.layerGroup().addTo(m), centro: L.layerGroup().addTo(m) };
    return () => m.remove();
  }, []);
  return ref;
}

// ---------- la schermata ----------

export default function Notte({ tab = "eventi", filtro }) {
  const [eventi, setEventi] = useState(null);
  const [centro, setCentro] = useState(() => leggi(POS_KEY, null));
  const [f, setF] = useState({ senzaAuto: filtro === "senza-auto", weekend: filtro === "weekend" });
  const [attivo, setAttivo] = useState(null);
  const [foglio, setFoglio] = useState(false); // telefono: foglio alzato o abbassato
  const [salvati, setSalvati] = useState(() => leggi(SALVATI, {}));
  const box = useRef(null);
  const mappa = useMappa(box);
  const lista = useRef(null);

  useEffect(() => { eventiPubblici().then(setEventi).catch(() => setEventi([])); }, []);
  useEffect(() => { scrivi(POS_KEY, centro); }, [centro]);
  useEffect(() => {
    if (filtro === "senza-auto" || filtro === "weekend") setF((x) => ({ ...x, senzaAuto: filtro === "senza-auto" || x.senzaAuto, weekend: filtro === "weekend" || x.weekend }));
    if (filtro === "vicino" && !centro) posizioneAttuale().then(setCentro).catch(() => {});
  }, [filtro]);

  const visibili = useMemo(() => (eventi || [])
    .filter((e) => (!f.senzaAuto || senzaAuto(e)) && (!f.weekend || nelPeriodo(e, "weekend")))
    .map((e) => ({ ...e, d: km(centro, e) }))
    .sort((a, b) => (centro && a.d != null && b.d != null ? a.d - b.d : a.inizio.localeCompare(b.inizio))),
  [eventi, f, centro]);

  // punti sulla mappa
  useEffect(() => {
    const g = mappa.current;
    if (!g) return;
    g.eventi.clearLayers();
    const punti = [];
    visibili.forEach((e) => {
      if (e.lat == null) return;
      const on = e.id === attivo;
      if (f.senzaAuto) {
        (e.pickup || []).forEach((p) => {
          if (p.lat == null) return;
          L.polyline([[p.lat, p.lng], [e.lat, e.lng]], { color: VIOLA, weight: 2.5, opacity: 0.8, dashArray: "2 7", lineCap: "round" }).addTo(g.eventi);
          L.circleMarker([p.lat, p.lng], { radius: 6, color: VIOLA, weight: 2.5, fillColor: SOLE, fillOpacity: 1 })
            .bindTooltip(`Bus da ${p.nome}${p.orario ? `, ${p.orario}` : ""}`).addTo(g.eventi);
        });
      }
      L.circleMarker([e.lat, e.lng], { radius: on ? 22 : 16, stroke: false, fillColor: VINO, fillOpacity: on ? 0.3 : 0.18, interactive: false }).addTo(g.eventi);
      L.circleMarker([e.lat, e.lng], { radius: on ? 11 : 8, color: BIANCO, weight: 3, fillColor: VINO, fillOpacity: 1 })
        .bindTooltip(e.titolo, { direction: "top", offset: [0, -8], permanent: on, className: "notte-tip" })
        .on("click", () => scegli(e.id))
        .addTo(g.eventi);
      punti.push([e.lat, e.lng]);
    });
    if (tab !== "cantine" && punti.length && !attivo) {
      if (centro) punti.push([centro.lat, centro.lng]);
      g.m.fitBounds(punti, { paddingTopLeft: grande() ? [460, 110] : [30, 120], paddingBottomRight: grande() ? [380, 40] : [30, Math.round(window.innerHeight * 0.48)], maxZoom: 10 });
    }
  }, [visibili, attivo, f.senzaAuto, tab]);

  useEffect(() => {
    const g = mappa.current;
    if (!g) return;
    g.cantine.clearLayers();
    const punti = [];
    CANTINE.forEach((c, i) => {
      const p = pos(c);
      if (!p) return;
      const q = [p[0] + (i % 3) * 0.004, p[1] + (i % 2) * 0.006];
      L.circleMarker(q, { radius: tab === "cantine" ? 8 : 5, color: BIANCO, weight: 2, fillColor: VIOLA, fillOpacity: tab === "cantine" ? 1 : 0.75 })
        .bindTooltip(c.nome, { direction: "top", className: "notte-tip" })
        .on("click", () => go(cantinaPercorso(c)))
        .addTo(g.cantine);
      punti.push(q);
    });
    if (tab === "cantine" && punti.length) g.m.fitBounds(punti, { paddingTopLeft: grande() ? [460, 110] : [40, 140], paddingBottomRight: grande() ? [60, 60] : [40, Math.round(window.innerHeight * 0.5)], maxZoom: 11 });
  }, [tab]);

  useEffect(() => {
    const g = mappa.current;
    if (!g) return;
    g.centro.clearLayers();
    if (centro) L.circleMarker([centro.lat, centro.lng], { radius: 8, color: VIOLA, weight: 3, fillColor: SOLE, fillOpacity: 1 }).bindTooltip(centro.nome, { className: "notte-tip" }).addTo(g.centro);
  }, [centro]);

  function scegli(id) {
    setAttivo(id);
    if (tab !== "eventi") go("eventi");
    const e = (eventi || []).find((x) => x.id === id);
    if (e?.lat != null && mappa.current) mappa.current.m.panTo([e.lat, e.lng]);
    setTimeout(() => document.getElementById(`ev-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  }
  const ciVado = (id) => { const n = { ...salvati, [id]: !salvati[id] }; setSalvati(n); scrivi(SALVATI, n); };

  const conAuto = visibili.filter((e) => senzaAuto(e)).length;

  return (
    <div className="notte">
      <div ref={box} className="notte-mappa" aria-label="Mappa degli eventi e delle cantine in Toscana" />

      <header className="notte-top">
        <Link to="home" className="notte-marchio"><span className="notte-logo">Bevotoscano</span><em>Il vino da vivere</em></Link>
        <Partenza centro={centro} setCentro={setCentro} />
        <div className="notte-filtri">
          <button className={f.senzaAuto ? "on" : ""} aria-pressed={f.senzaAuto} onClick={() => setF((x) => ({ ...x, senzaAuto: !x.senzaAuto }))}>Senza auto</button>
          <button className={f.weekend ? "on" : ""} aria-pressed={f.weekend} onClick={() => setF((x) => ({ ...x, weekend: !x.weekend }))}>Questo weekend</button>
        </div>
        <Link to="segnala" className="notte-segnala">Segnala un evento</Link>
      </header>

      <aside className={`notte-pannello ${foglio ? "notte-pannello--su" : ""}`}>
        <button className="notte-maniglia" aria-label={foglio ? "Abbassa il pannello" : "Alza il pannello"} onClick={() => setFoglio((x) => !x)}><span /></button>
        <nav className="notte-tab" aria-label="Sezioni">
          <Link to="eventi" className={tab === "eventi" ? "on" : ""} onClick={() => setFoglio(true)}>Eventi</Link>
          <Link to="cantine" className={tab === "cantine" ? "on" : ""} onClick={() => setFoglio(true)}>Cantine</Link>
          <Link to="gioca" className={tab === "gioca" ? "on" : ""} onClick={() => setFoglio(true)}>Gioca</Link>
        </nav>

        <div className="notte-corpo" ref={lista}>
          {tab === "eventi" && (
            <>
              <h1 className="notte-h1">Dove si beve, <span>{centro ? "vicino a te?" : "in Toscana?"}</span></h1>
              <p className="notte-sotto">
                {!eventi ? "Carico gli eventi…" : visibili.length === 0 ? "Nessun evento con questi filtri, per ora." :
                  `${visibili.length} ${visibili.length === 1 ? "evento" : "eventi"}${centro ? ` da ${centro.nome}` : ""}, ${conAuto} ci arrivi anche senza auto`}
              </p>
              <div className="notte-lista">
                {visibili.map((e) => (
                  <article key={e.id} id={`ev-${e.id}`} className={`notte-ev ${attivo === e.id ? "notte-ev--on" : ""}`} onMouseEnter={() => setAttivo(e.id)}>
                    <Link to={eventoPercorso(e)} className="notte-ev-data">
                      <b>{giorno(e.inizio)}</b><small>{mese(e.inizio)}</small>
                    </Link>
                    <Link to={eventoPercorso(e)} className="notte-ev-testo">
                      <strong>{e.titolo}</strong>
                      <small>{e.comune} · {quando(e.inizio)}{e.d != null ? ` · ${fmtKm(e.d)}` : ""}</small>
                      <small className={senzaAuto(e) ? "notte-ev-bus" : ""}>{comeArrivi(e, centro)}{e.prezzo ? ` · ${e.prezzo}` : ""}{e.esempio ? " · esempio" : ""}</small>
                    </Link>
                    <button className={`notte-ci ${salvati[e.id] ? "on" : ""}`} aria-pressed={!!salvati[e.id]} aria-label={salvati[e.id] ? "Ci vado, tolto" : "Ci vado"} onClick={() => ciVado(e.id)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={salvati[e.id] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
                    </button>
                  </article>
                ))}
              </div>
              <div className="notte-solo-tel">
                <Gioco compatto />
              </div>
            </>
          )}

          {tab === "cantine" && (
            <>
              <h1 className="notte-h1">Le cantine, <span>scelte una a una.</span></h1>
              <p className="notte-sotto">{CANTINE.length} piccoli produttori: si parte dalle colline pisane e la mappa cresce a ogni visita.</p>
              <div className="notte-lista">
                {CANTINE.map((c) => (
                  <Link key={c.id} to={cantinaPercorso(c)} className="notte-ev notte-cant">
                    <span className="notte-ev-data notte-cant-ini">{c.nome.replace(/^(Podere|Fattoria|Tenuta( di)?|La|L')\s*/i, "").charAt(0)}</span>
                    <span className="notte-ev-testo"><strong>{c.nome}</strong><small>{c.comune} · {c.zona}</small></span>
                  </Link>
                ))}
              </div>
              <a className="notte-ig" href={INSTAGRAM_URL} target="_blank" rel="noopener">
                <strong>“Qual è il vino più toscano che hai?”</strong>
                <small>Lo chiediamo a ogni cantina. Le risposte sono su Instagram.</small>
              </a>
            </>
          )}

          {tab === "gioca" && (
            <>
              <h1 className="notte-h1">Gioca col <span>vino toscano!</span></h1>
              <Gioco />
              <Oroscopo />
              <ChiSiamo />
            </>
          )}
        </div>
      </aside>

      <div className="notte-carte">
        <Gioco compatto />
        <Link to="gioca/oroscopo" className="notte-carta notte-carta--oro">
          <span><small>OROSCOPO DEL VINO</small><b>{segnoOggi().segno} · {segnoOggi().vitigno}</b></span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
      </div>
      <p className="notte-bevi">Bevi responsabilmente: se bevi, non guidare.</p>
    </div>
  );
}

const grande = () => window.matchMedia("(min-width: 900px)").matches;
const segnoOggi = () => { const d = new Date(); return segnoDa(d.getMonth() + 1, d.getDate()) || SEGNI[0]; };

function Partenza({ centro, setCentro }) {
  const [msg, setMsg] = useState("");
  const scegli = async (v) => {
    if (v === "") return setCentro(null);
    if (v === "qui") {
      setMsg("…");
      try { setCentro(await posizioneAttuale()); setMsg(""); } catch (e) { setMsg(e.message); }
      return;
    }
    setCentro(CITTA.find((c) => c.nome === v) || null);
  };
  const valore = !centro ? "" : CITTA.some((c) => c.nome === centro.nome) ? centro.nome : "qui";
  return (
    <label className="notte-parto">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
      <span>Parto da</span>
      <select value={valore} onChange={(e) => scegli(e.target.value)}>
        <option value="">tutta la Toscana</option>
        <option value="qui">dove sono adesso</option>
        {CITTA.map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
      </select>
      {msg && <small>{msg}</small>}
    </label>
  );
}

function Gioco({ compatto = false }) {
  const q = useMemo(domandaDelGiorno, []);
  const [scelta, setScelta] = useState(null);
  return (
    <section className={`notte-carta notte-carta--quiz ${compatto ? "notte-carta--compatta" : ""}`}>
      <small>DOMANDA DEL GIORNO</small>
      <b>{q.testo}</b>
      <div className="notte-opz">
        {q.opzioni.map((o) => {
          let cls = "";
          if (scelta) cls = o === q.giusta ? "ok" : o === scelta ? "no" : "spento";
          return <button key={o} className={cls} disabled={!!scelta} onClick={() => setScelta(o)}>{o}</button>;
        })}
      </div>
      {scelta && <p>{scelta === q.giusta ? "Esatto!" : `Era: ${q.giusta}.`} Domani ne arriva un'altra.</p>}
      <div className="notte-carta-link">
        <Link to="gioca/quiz">Quiz a tempo</Link>
        <Link to="gioca/classifica">Classifica</Link>
      </div>
    </section>
  );
}

const dataBreve = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long" });

function Oroscopo() {
  const corrente = segnoOggi();
  const [id, setId] = useState(corrente.id);
  const s = SEGNI.find((x) => x.id === id);
  const t = MESE.testi?.[id];
  const i0 = SEGNI.indexOf(corrente);
  const ordine = [...SEGNI.slice(i0), ...SEGNI.slice(0, i0)];
  return (
    <section className="notte-oro">
      <small>OROSCOPO DEL VINO · {MESE.edizione}, fino al {dataBreve(MESE.al)}</small>
      <div className="notte-segni">
        {ordine.map((x) => <button key={x.id} className={x.id === id ? "on" : ""} onClick={() => setId(x.id)}>{x.segno}</button>)}
      </div>
      {t && (
        <>
          <b>{t.titolo}</b>
          <span className="notte-oro-vit">Il tuo vitigno: {s.vitigno}</span>
          <p>{t.testo}</p>
          <p className="notte-oro-vino">{t.vino}</p>
        </>
      )}
      <Link to="gioca/oroscopo" className="notte-bottone">Scopri il tuo vitigno e condividilo</Link>
    </section>
  );
}

function ChiSiamo() {
  return (
    <section className="notte-chi" id="chi-siamo">
      <small>CHI SIAMO</small>
      <b>Partiamo da Terricciola</b>
      <p>Una Città del Vino sulle colline pisane, spesso attraversata e raramente vissuta. Bevotoscano è un ponte tra il turismo e il vino, dalla parte dei piccoli produttori.</p>
      <p><b>Ronny Bellagotti</b>, digital e territorio · <b>Marianna Dimeo</b>, sommelier FISAR</p>
    </section>
  );
}

// Testata delle pagine a sé (un evento, una cantina, segnala…), nello stesso stile.
export function TestataNotte({ attiva }) {
  return (
    <header className="notte-testa">
      <Link to="home" className="notte-logo">Bevotoscano</Link>
      <nav aria-label="Sezioni">
        <Link to="eventi" className={attiva === "eventi" ? "on" : ""}>Eventi</Link>
        <Link to="cantine" className={attiva === "cantine" ? "on" : ""}>Cantine</Link>
        <Link to="gioca" className={attiva === "gioca" ? "on" : ""}>Gioca</Link>
      </nav>
    </header>
  );
}
