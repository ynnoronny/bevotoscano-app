import { useState } from "react";
import { SEGNI, segnoDa } from "./oroscopoData.js";
import ShareButton from "./ShareButton.jsx";
import MESE from "./oroscopoMese.json";
import { saveLead } from "../leads.js";

const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const GIORNI_MESE = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const dataBreve = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long" });

// "L'oroscopo del vino": scegli il giorno di nascita, scopri il tuo vitigno.
export default function Oroscopo({ onExit }) {
  const [giorno, setGiorno] = useState("");
  const [mese, setMese] = useState("");
  const [segno, setSegno] = useState(null);

  const scopri = () => {
    const s = segnoDa(Number(mese), Number(giorno));
    if (!s) return;
    saveLead("oroscopo", { segno: s.segno, vitigno: s.vitigno });
    setSegno(s);
  };

  const delMese = segno && MESE.testi?.[segno.id];

  const maxGiorno = mese ? GIORNI_MESE[Number(mese) - 1] : 31;

  return (
    <div className={`game ${segno ? "game--result" : ""}`} style={segno ? { background: segno.gradient } : undefined}>
      <div className="game-top">
        <button className="game-back" onClick={onExit}>← Giochi</button>
        <span className="game-brand">Bevotoscano</span>
      </div>

      {!segno && (
        <div className="game-center fade">
          <div className="zodiac-ring" aria-hidden="true">
            {SEGNI.map((s, i) => (
              <span key={s.id} style={{ transform: `rotate(${i * 30}deg) translateY(-92px) rotate(${-i * 30}deg)` }}>{s.simbolo}</span>
            ))}
            <b>🍇</b>
          </div>
          <h1 className="game-title">L'oroscopo <em>del vino</em></h1>
          <p className="muted">12 segni, 12 vitigni autoctoni toscani. Dimmi quando sei nato: ti dico che vino sei e com'è il tuo mese.</p>
          <div className="date-row">
            <select className="input" value={giorno} onChange={(e) => setGiorno(e.target.value)} aria-label="Giorno">
              <option value="">Giorno</option>
              {Array.from({ length: maxGiorno }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
            </select>
            <select className="input" value={mese} onChange={(e) => { setMese(e.target.value); if (Number(giorno) > GIORNI_MESE[Number(e.target.value) - 1]) setGiorno(""); }} aria-label="Mese">
              <option value="">Mese</option>
              {MESI.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <button className="btn btn--primary" onClick={scopri} disabled={!giorno || !mese}>Scopri il tuo vitigno</button>
        </div>
      )}

      {segno && (
        <div className="game-center fade light">
          <span className="eyebrow">{segno.simbolo} {segno.segno} · il tuo vitigno</span>
          <div className="big-emoji">{segno.emoji}</div>
          <h2 className="result-name">{segno.vitigno}</h2>
          <p className="result-tagline">{segno.tagline}</p>
          <p className="result-desc">{segno.descrizione}</p>
          <p className="result-fact">💡 {segno.curiosita}</p>

          {delMese && (
            <section className="oro-mese">
              <span className="eyebrow">Il tuo mese · {MESE.edizione}</span>
              <strong className="oro-mese-titolo">{delMese.titolo}</strong>
              <p>{delMese.testo}</p>
              <p className="oro-mese-vino">🍷 {delMese.vino}</p>
              <small>Dal {dataBreve(MESE.dal)} al {dataBreve(MESE.al)} · Calcolato sulle posizioni reali dei pianeti.</small>
            </section>
          )}

          <ShareButton
            filename={`bevotoscano-${segno.id}`}
            card={{ gradient: segno.gradient, eyebrow: `${segno.simbolo} ${segno.segno} · il mio vitigno`, emoji: segno.emoji, title: segno.vitigno, tagline: delMese ? delMese.titolo : segno.tagline, body: delMese ? delMese.vino : segno.curiosita }}
          />

          <div className="row">
            <button className="link light" onClick={() => setSegno(null)}>Prova un'altra data</button>
            <button className="link light" onClick={onExit}>Altri giochi</button>
          </div>
        </div>
      )}
    </div>
  );
}
