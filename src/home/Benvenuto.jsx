import { useState } from "react";
import { segnoDa } from "../games/oroscopoData.js";

// La prima schermata: la data di nascita. Serve due volte: siamo un sito di vino, quindi
// bisogna essere maggiorenni; e così l'oroscopo del vino mostra sempre il tuo segno.
// Resta salvata solo su questo telefono (nessun account, nessun dato inviato).
const CHIAVE = "bevotoscano-nascita";
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

export function leggiNascita() {
  try { const n = JSON.parse(localStorage.getItem(CHIAVE)); return n && n.a ? n : null; } catch { return null; }
}
export function salvaNascita(n) { try { localStorage.setItem(CHIAVE, JSON.stringify(n)); } catch { /* niente */ } }
export const segnoMio = () => { const n = leggiNascita(); return n ? segnoDa(n.m, n.g) : null; };

const eta = ({ g, m, a }) => {
  const o = new Date();
  return o.getFullYear() - a - (o.getMonth() + 1 < m || (o.getMonth() + 1 === m && o.getDate() < g) ? 1 : 0);
};

// I motori di ricerca e le anteprime dei link non devono fermarsi qui.
const robot = () => typeof navigator !== "undefined" && /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|lighthouse/i.test(navigator.userAgent);

export default function Benvenuto({ children }) {
  const [ok, setOk] = useState(() => robot() || (leggiNascita() && eta(leggiNascita()) >= 18));
  const [v, setV] = useState({ g: "", m: "", a: "" });
  const [minore, setMinore] = useState(false);
  if (ok) return children;
  const anni = Array.from({ length: 90 }, (_, i) => new Date().getFullYear() - 10 - i);
  const pronto = v.g && v.m && v.a;
  const entra = (x) => {
    x.preventDefault();
    const n = { g: +v.g, m: +v.m, a: +v.a };
    if (eta(n) < 18) return setMinore(true);
    salvaNascita(n);
    setOk(true);
  };
  return (
    <>
      {children}
      <div className="benvenuto" role="dialog" aria-modal="true" aria-labelledby="benvenuto-t">
        <form className="benvenuto-box" onSubmit={entra}>
          <span className="shell-logo">Bevotoscano</span>
          <em className="benvenuto-motto">Il vino da vivere</em>
          {minore ? (
            <p className="benvenuto-testo">Ci dispiace: per entrare devi avere almeno 18 anni. Ti aspettiamo!</p>
          ) : (
            <>
              <h1 id="benvenuto-t">La tua data di nascita</h1>
              <p className="benvenuto-testo">Parliamo di vino, quindi devi essere maggiorenne. E con la tua data ti mostriamo sempre il tuo oroscopo del vino.</p>
              <div className="benvenuto-data">
                <select aria-label="Giorno" value={v.g} onChange={(x) => setV({ ...v, g: x.target.value })}>
                  <option value="">Giorno</option>
                  {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                </select>
                <select aria-label="Mese" value={v.m} onChange={(x) => setV({ ...v, m: x.target.value })}>
                  <option value="">Mese</option>
                  {MESI.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
                </select>
                <select aria-label="Anno" value={v.a} onChange={(x) => setV({ ...v, a: x.target.value })}>
                  <option value="">Anno</option>
                  {anni.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <button className="benvenuto-via" type="submit" disabled={!pronto}>Entra</button>
              <small>La data resta solo sul tuo telefono. Bevi responsabilmente.</small>
            </>
          )}
        </form>
      </div>
    </>
  );
}
