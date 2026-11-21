import { useState } from "react";
import { SEGNI, segnoDa } from "./oroscopoData.js";
import { shareStory } from "./storyImage.js";
import { saveLead, isEmail } from "../leads.js";

const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const GIORNI_MESE = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// "L'oroscopo del vino": scegli il giorno di nascita, scopri il tuo vitigno.
export default function Oroscopo({ onExit }) {
  const [giorno, setGiorno] = useState("");
  const [mese, setMese] = useState("");
  const [segno, setSegno] = useState(null);
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState("");
  const [sharing, setSharing] = useState(false);

  const scopri = () => {
    const s = segnoDa(Number(mese), Number(giorno));
    if (!s) return;
    saveLead("oroscopo", { segno: s.segno, vitigno: s.vitigno });
    setSegno(s);
  };

  const share = async () => {
    setSharing(true);
    try {
      await shareStory(
        { gradient: segno.gradient, eyebrow: `${segno.simbolo} ${segno.segno} · il mio vitigno`, emoji: segno.emoji, title: segno.vitigno, tagline: segno.tagline, body: segno.curiosita },
        `bevotoscano-${segno.id}`,
        `Sono ${segno.segno}, quindi sono ${segno.vitigno} 🍷 Scopri il tuo su bevotoscano.com`,
      );
    } catch {
      alert("Non sono riuscito a creare l'immagine. Fai uno screenshot 🍷");
    }
    setSharing(false);
  };

  const iscrivi = (e) => {
    e.preventDefault();
    if (!isEmail(email)) return setEmailState("err");
    saveLead("oroscopo-email", { email, segno: segno.segno, vitigno: segno.vitigno });
    setEmailState("ok");
  };

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
          <p className="muted">12 segni, 12 vitigni autoctoni toscani. Dimmi quando sei nato e ti dico che vino sei.</p>
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
          <button className="btn btn--gold" onClick={share} disabled={sharing}>{sharing ? "Preparo l'immagine…" : "Condividi nelle stories ✨"}</button>

          {emailState === "ok" ? (
            <p className="result-fact">Fatto! Ti mandiamo le storie dei vini del tuo segno 🍷</p>
          ) : (
            <form className="glass-form" onSubmit={iscrivi}>
              <span>Vuoi le storie dei vini del tuo segno?</span>
              <input className="input" type="email" placeholder="La tua email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailState(""); }} />
              {emailState === "err" && <span className="error">Email non valida</span>}
              <button className="btn btn--outline-light" type="submit">Iscrivimi</button>
            </form>
          )}

          <div className="row">
            <button className="link light" onClick={() => setSegno(null)}>Prova un'altra data</button>
            <button className="link light" onClick={onExit}>Altri giochi</button>
          </div>
        </div>
      )}
    </div>
  );
}
