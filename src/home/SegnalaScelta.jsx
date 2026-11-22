import { useState } from "react";
import Segnala, { Campo } from "../eventi/Segnala.jsx";
import { saveLead, isEmail } from "../leads.js";
import { proponi } from "../eventi/api.js";
import { Scelta } from "./Filtri.jsx";

// "Segnala": un solo pulsante in alto, poi scegli cosa proponi.
// Le cantine e le enoteche proposte arrivano a Bevotoscano da valutare: non compaiono
// nell'app finché non le inseriamo noi.
const TIPI = [["evento", "Un evento"], ["cantina", "Una cantina"], ["enoteca", "Un'enoteca"]];

export default function SegnalaScelta({ iniziale }) {
  const [tipo, setTipo] = useState(TIPI.some(([t]) => t === iniziale) ? iniziale : "evento");
  return (
    <div className="segnala-scelta">
      <h1 className="page-title">Segnala</h1>
      <p className="muted">Cosa vuoi proporre a Bevotoscano? Lo guardiamo noi prima di metterlo nell'app.</p>
      <Scelta opzioni={TIPI} valore={tipo} onCambia={setTipo} />
      {tipo === "evento" ? <Segnala dentro /> : <ProponiLuogo key={tipo} tipo={tipo} />}
    </div>
  );
}

const VUOTO = { nome: "", comune: "", sito: "", ruolo: "titolare", referente: "", email: "", note: "" };

function ProponiLuogo({ tipo }) {
  const [v, setV] = useState(VUOTO);
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(false);
  const set = (k, x) => { setV((o) => ({ ...o, [k]: x })); setErrore(""); };
  const cosa = tipo === "cantina" ? "cantina" : "enoteca";

  if (fatto) {
    return (
      <div className="card segnala-ok fade">
        <strong>Grazie! 🍷</strong>
        <p>Abbiamo ricevuto la {cosa}. La guardiamo e, se fa per Bevotoscano, ti scriviamo per andarla a trovare.</p>
        <button className="link" onClick={() => { setV(VUOTO); setFatto(false); }}>Proponine un'altra</button>
      </div>
    );
  }

  const [invio, setInvio] = useState(false);
  const invia = async (e) => {
    e.preventDefault();
    if (!v.nome.trim() || !v.comune.trim()) return setErrore(`Scrivi almeno il nome della ${cosa} e il comune.`);
    if (!isEmail(v.email)) return setErrore("Serve una email valida per risponderti.");
    const p = { tipo, nome: v.nome.trim(), comune: v.comune.trim(), sito: v.sito.trim() || null, ruolo: v.ruolo,
      referente: v.referente.trim() || null, email: v.email.trim(), note: v.note.trim() || null };
    setInvio(true);
    try {
      await proponi(p);
    } catch (x) {
      if (/troppe/.test(x.message)) { setInvio(false); return setErrore("Hai già mandato molte proposte oggi: riprova domani."); }
      // se la coda nel database non risponde, la proposta finisce comunque tra i contatti
      saveLead(`proposta-${tipo}`, { email: p.email, nome: p.referente, ...p });
    }
    setInvio(false);
    setFatto(true);
  };

  return (
    <form className="stack form fade" onSubmit={invia}>
      <Campo label={`Nome della ${cosa} *`}><input className="input" value={v.nome} maxLength={100} onChange={(e) => set("nome", e.target.value)} /></Campo>
      <Campo label="Comune *"><input className="input" value={v.comune} maxLength={80} onChange={(e) => set("comune", e.target.value)} placeholder="Es. Terricciola" /></Campo>
      <Campo label="Sito o Instagram"><input className="input" value={v.sito} maxLength={200} onChange={(e) => set("sito", e.target.value)} placeholder="Es. instagram.com/…" /></Campo>
      <Campo label="Tu chi sei?">
        <select className="input" value={v.ruolo} onChange={(e) => set("ruolo", e.target.value)}>
          <option value="titolare">Ci lavoro o è mia</option>
          <option value="cliente">La conosco e la consiglio</option>
        </select>
      </Campo>
      <Campo label="Il tuo nome"><input className="input" value={v.referente} maxLength={80} onChange={(e) => set("referente", e.target.value)} /></Campo>
      <Campo label="La tua email *" hint="Solo per risponderti, non la pubblichiamo."><input className="input" type="email" value={v.email} maxLength={200} onChange={(e) => set("email", e.target.value)} /></Campo>
      <Campo label="Perché merita?"><textarea className="input" rows={3} value={v.note} maxLength={600} onChange={(e) => set("note", e.target.value)} placeholder={tipo === "cantina" ? "Il vino più toscano che fanno, la storia, le visite…" : "Cosa si beve, l'atmosfera, le serate…"} /></Campo>
      {errore && <p className="error">{errore}</p>}
      <button className="btn btn--primary" type="submit" disabled={invio}>{invio ? "Invio…" : "Invia la proposta"}</button>
    </form>
  );
}
