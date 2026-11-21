import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CANTINE, CONTACT_EMAIL } from "../data.js";
import { eventiPubblici } from "../eventi/api.js";
import { go } from "../nav.js";

// Posizione indicativa per comune o frazione (la cantina è nei dintorni).
// Per una cantina nuova: aggiungi qui il suo comune, oppure metti lat/lng direttamente in data.js.
const COMUNI = {
  Terricciola: [43.5254, 10.6789],
  Riparbella: [43.3666, 10.5985],
  "San Miniato": [43.6797, 10.8505],
  Montefoscoli: [43.5603, 10.7322],
  Ghizzano: [43.5533, 10.7650],
};
const pos = (c) => (c.lat != null ? [c.lat, c.lng] : COMUNI[c.comune]);
const iniziale = (nome) => nome.replace(/^(Podere|Fattoria|Tenuta( di)?|La|L')\s*/i, "").charAt(0);

function MappaCantine({ cantine, attiva, onScegli }) {
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  useEffect(() => {
    map.current = L.map(box.current, { scrollWheelZoom: false }).setView([43.55, 10.7], 10);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 16, attribution: "© OpenStreetMap" }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);
  useEffect(() => {
    layer.current.clearLayers();
    const punti = [];
    cantine.forEach((c, i) => {
      const p = pos(c);
      if (!p) return;
      // piccolo scostamento per le cantine dello stesso comune, così non si sovrappongono
      const q = [p[0] + (i % 3) * 0.004, p[1] + (i % 2) * 0.006];
      const on = c.id === attiva;
      L.circleMarker(q, { radius: on ? 11 : 8, color: "#fff", weight: 2, fillColor: on ? "#722F37" : "#432543", fillOpacity: 1 })
        .bindTooltip(c.nome).on("click", () => onScegli(c.id)).addTo(layer.current);
      punti.push(q);
    });
    if (punti.length) map.current.fitBounds(punti, { padding: [36, 36], maxZoom: 12 });
  }, [cantine, attiva]);
  return <div ref={box} className="mappa mappa--bassa" />;
}

export default function Cantine() {
  const [zona, setZona] = useState("Tutte");
  const [attiva, setAttiva] = useState(null);
  const [eventi, setEventi] = useState([]);
  useEffect(() => { eventiPubblici().then(setEventi).catch(() => {}); }, []);

  const zone = useMemo(() => {
    const conta = {};
    CANTINE.forEach((c) => { conta[c.zona] = (conta[c.zona] || 0) + 1; });
    return [["Tutte", CANTINE.length], ...Object.entries(conta)];
  }, []);
  const lista = zona === "Tutte" ? CANTINE : CANTINE.filter((c) => c.zona === zona);
  const eventiDi = (c) => eventi.filter((e) => (e.org_nome || "").toLowerCase() === c.nome.toLowerCase() || (e.luogo_nome || "").toLowerCase() === c.nome.toLowerCase());

  const scegli = (id) => {
    setAttiva(id);
    document.getElementById(`cantina-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <section className="testata">
        <img src="/img/strada-bianca.jpg" alt="Strada bianca tra le vigne" />
        <div>
          <p className="eyebrow">Le cantine</p>
          <h1>Piccoli produttori, scelti uno a uno</h1>
        </div>
      </section>
      <p className="muted">Andiamo a conoscerle di persona, a ognuna chiediamo qual è il suo vino più toscano. Si parte dalle colline pisane, intorno a Terricciola, e la mappa cresce a ogni visita.</p>

      <MappaCantine cantine={lista} attiva={attiva} onScegli={scegli} />

      <div className="chips">
        {zone.map(([z, n]) => (
          <button key={z} className={`chip ${z === zona ? "chip--on" : ""}`} onClick={() => { setZona(z); setAttiva(null); }}>{z} · {n}</button>
        ))}
      </div>

      <div className="list">
        {lista.map((c) => {
          const ev = eventiDi(c);
          return (
            <article key={c.id} id={`cantina-${c.id}`} className={`card cantina ${attiva === c.id ? "cantina--on" : ""}`} onClick={() => setAttiva(c.id)}>
              <div className="cantina-head">
                <span className="avatar">{iniziale(c.nome)}</span>
                <div>
                  <strong className="cantina-nome">{c.nome}</strong>
                  <small>{c.comune} · {c.zona}</small>
                </div>
              </div>
              {c.vinoPiuToscano
                ? <p className="cantina-wine">Il suo vino più toscano: <b>{c.vinoPiuToscano}</b></p>
                : <p className="tiny">Il suo vino più toscano? Glielo chiediamo presto.</p>}
              {ev.length > 0 && (
                <button className="badge badge--gold" onClick={(x) => { x.stopPropagation(); go(`eventi/${ev[0].id}`); }}>
                  📅 {ev.length === 1 ? "1 evento in arrivo" : `${ev.length} eventi in arrivo`} →
                </button>
              )}
              <div className="row">
                {c.reel && <a className="link" href={c.reel} target="_blank" rel="noopener">Guarda il reel</a>}
                {c.sito && <a className="link" href={c.sito} target="_blank" rel="noopener">Sito della cantina</a>}
              </div>
            </article>
          );
        })}
      </div>

      <section className="card card--plum">
        <strong>Sei una cantina, o ne conosci una che merita?</strong>
        <p>Scrivici: veniamo a conoscervi. Se avete un evento in programma, segnalatelo, è gratis.</p>
        <div className="row">
          <button className="btn btn--light" onClick={() => go("segnala")}>Segnala un evento</button>
          <a className="link light" href={`mailto:${CONTACT_EMAIL}?subject=Una%20cantina%20per%20Bevotoscano`}>{CONTACT_EMAIL}</a>
        </div>
      </section>
    </>
  );
}
