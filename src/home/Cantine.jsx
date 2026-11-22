import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CANTINE, CONTACT_EMAIL } from "../data.js";
import { eventiPubblici } from "../eventi/api.js";
import { go } from "../nav.js";
import Link from "../Link.jsx";
import { pos } from "./luoghi.js";
import { cantinaPercorso, cantinaMeta, cantinaJsonLd, briciole, applicaMeta, eventoPercorso } from "../seo.js";

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

export default function Cantine({ apri, inFeed = false }) {
  const scheda = apri && CANTINE.find((c) => c.id === apri);
  if (scheda) return <Scheda c={scheda} />;
  return <Elenco inFeed={inFeed} />;
}

// La pagina di una cantina: bevotoscano.com/cantine/fibbiano
function Scheda({ c }) {
  const [eventi, setEventi] = useState([]);
  useEffect(() => { eventiPubblici().then(setEventi).catch(() => {}); }, []);
  useEffect(() => {
    applicaMeta(cantinaMeta(c), [cantinaJsonLd(c, pos(c)), briciole([["Cantine", "cantine"], [c.nome, cantinaPercorso(c)]])]);
    window.scrollTo(0, 0);
  }, [c.id]);
  const ev = eventi.filter((e) => [e.org_nome, e.luogo_nome].some((n) => (n || "").toLowerCase() === c.nome.toLowerCase()));
  const vicine = CANTINE.filter((x) => x.id !== c.id && (x.comune === c.comune || x.zona === c.zona)).slice(0, 4);
  return (
    <>
      <Link className="link" to="cantine">← Tutte le cantine</Link>
      <p className="eyebrow">{c.comune} · {c.zona}</p>
      <h1 className="page-title">{c.nome}</h1>
      <MappaCantine cantine={[c]} attiva={c.id} onScegli={() => {}} />
      <section className="card">
        {c.vinoPiuToscano
          ? <p className="cantina-wine">Il suo vino più toscano: <b>{c.vinoPiuToscano}</b></p>
          : <p className="muted">Una piccola cantina di {c.comune}, nella zona {c.zona}. Presto andiamo a trovarla e le chiediamo qual è il suo vino più toscano.</p>}
        <div className="row">
          {c.reel && <a className="link" href={c.reel} target="_blank" rel="noopener">Guarda il reel</a>}
          {c.sito && <a className="link" href={c.sito} target="_blank" rel="noopener">Sito della cantina</a>}
        </div>
      </section>
      {ev.length > 0 && (
        <section className="card">
          <strong>Eventi in arrivo</strong>
          {ev.map((e) => <Link key={e.id} className="link" to={eventoPercorso(e)}>{e.titolo}</Link>)}
        </section>
      )}
      {vicine.length > 0 && (
        <section className="card">
          <strong>Altre cantine qui vicino</strong>
          {vicine.map((x) => <Link key={x.id} className="link" to={cantinaPercorso(x)}>{x.nome}, {x.comune}</Link>)}
        </section>
      )}
    </>
  );
}

function Elenco({ inFeed }) {
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
      {!inFeed && (
        <>
          <section className="testata">
            <img src="/img/strada-bianca.jpg" alt="Strada bianca tra le vigne" />
            <div>
              <p className="eyebrow">Le cantine</p>
              <h1>Piccoli produttori, scelti uno a uno</h1>
            </div>
          </section>
          <p className="muted">Andiamo a conoscerle di persona, a ognuna chiediamo qual è il suo vino più toscano. Si parte dalle colline pisane, intorno a Terricciola, e la mappa cresce a ogni visita.</p>
        </>
      )}

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
                <button className="badge badge--gold" onClick={(x) => { x.stopPropagation(); go(eventoPercorso(ev[0])); }}>
                  📅 {ev.length === 1 ? "1 evento in arrivo" : `${ev.length} eventi in arrivo`} →
                </button>
              )}
              <div className="row">
                {c.reel && <a className="link" href={c.reel} target="_blank" rel="noopener">Guarda il reel</a>}
                {c.sito && <a className="link" href={c.sito} target="_blank" rel="noopener">Sito della cantina</a>}
                <Link className="link" to={cantinaPercorso(c)} onClick={(x) => x.stopPropagation()}>Scheda della cantina →</Link>
              </div>
            </article>
          );
        })}
      </div>

      {!inFeed && (
      <section className="card card--plum">
        <strong>Sei una cantina, o ne conosci una che merita?</strong>
        <p>Scrivici: veniamo a conoscervi. Se avete un evento in programma, segnalatelo, è gratis.</p>
        <div className="row">
          <button className="btn btn--light" onClick={() => go("segnala")}>Segnala un evento</button>
          <a className="link light" href={`mailto:${CONTACT_EMAIL}?subject=Una%20cantina%20per%20Bevotoscano`}>{CONTACT_EMAIL}</a>
        </div>
      </section>
      )}
    </>
  );
}
