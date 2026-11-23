import { useRef, useState } from "react";
import { segnalaEvento, caricaFoto } from "./api.js";
import CampoFoto from "./CampoFoto.jsx";
import { ACCESSI, TIPI_ORG } from "./shared.js";
import { isEmail } from "../leads.js";
import { CONTACT_EMAIL } from "../data.js";

const VUOTO = {
  org_tipo: "cantina", org_nome: "", org_referente: "", org_email: "", org_telefono: "", org_social: "",
  titolo: "", descrizione: "", inizio: "", fine: "", altre_date: "",
  luogo_nome: "", indirizzo: "", comune: "", vini: "", guidato: false, accesso: ["auto"],
  pickup: [], prezzo: "", link: "",
};

export function Campo({ label, children, hint }) {
  return (
    <label className="campo">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

// Campi dell'evento, condivisi tra il form pubblico e il backend.
export function CampiEvento({ v, set, pickupExtra }) {
  const toggleAccesso = (a) => set("accesso", v.accesso.includes(a) ? v.accesso.filter((x) => x !== a) : [...v.accesso, a]);
  const setPk = (i, k, val) => set("pickup", v.pickup.map((p, j) => (j === i ? { ...p, [k]: val } : p)));
  return (
    <>
      <Campo label="Titolo dell'evento *"><input className="input" value={v.titolo} maxLength={120} onChange={(e) => set("titolo", e.target.value)} placeholder="Es. Novello e castagne in cantina" /></Campo>
      <Campo label="Descrizione"><textarea className="input" rows={4} maxLength={1500} value={v.descrizione} onChange={(e) => set("descrizione", e.target.value)} placeholder="Cosa si fa, chi racconta il vino, quante persone…" /></Campo>
      <div className="due">
        <Campo label="Inizio *"><input className="input" type="datetime-local" value={v.inizio} onChange={(e) => set("inizio", e.target.value)} /></Campo>
        <Campo label="Fine"><input className="input" type="datetime-local" value={v.fine} onChange={(e) => set("fine", e.target.value)} /></Campo>
      </div>
      <Campo label="Altre date" hint="Se l'evento si ripete, es. «anche 13 e 20 dicembre»"><input className="input" maxLength={300} value={v.altre_date} onChange={(e) => set("altre_date", e.target.value)} /></Campo>
      <Campo label="Dove si tiene (cantina, enoteca, borgo) *"><input className="input" maxLength={120} value={v.luogo_nome} onChange={(e) => set("luogo_nome", e.target.value)} /></Campo>
      <div className="due">
        <Campo label="Indirizzo"><input className="input" maxLength={200} value={v.indirizzo} onChange={(e) => set("indirizzo", e.target.value)} /></Campo>
        <Campo label="Comune *"><input className="input" maxLength={80} value={v.comune} onChange={(e) => set("comune", e.target.value)} /></Campo>
      </div>
      <Campo label="Vini o cantine protagoniste"><input className="input" maxLength={300} value={v.vini} onChange={(e) => set("vini", e.target.value)} placeholder="Es. Chianti Classico, Vermentino…" /></Campo>

      <div className="campo">
        <span>Come ci si arriva</span>
        <div className="chips wrap">
          {Object.entries(ACCESSI).map(([k, a]) => (
            <button type="button" key={k} className={`chip ${v.accesso.includes(k) ? "chip--on" : ""}`} onClick={() => toggleAccesso(k)}>{a.icon} {a.label}</button>
          ))}
        </div>
      </div>

      {v.accesso.includes("bus") && (
        <div className="campo">
          <span>Punti di raccolta del bus</span>
          {v.pickup.map((p, i) => (
            <div key={i} className="pk-row">
              <input className="input" placeholder="Es. Firenze, piazzale Montelungo" value={p.nome} maxLength={120} onChange={(e) => setPk(i, "nome", e.target.value)} />
              <input className="input" type="time" value={p.orario || ""} onChange={(e) => setPk(i, "orario", e.target.value)} />
              {pickupExtra && pickupExtra(p, (c) => set("pickup", v.pickup.map((x, j) => (j === i ? { ...x, ...c } : x))))}
              <button type="button" className="link" onClick={() => set("pickup", v.pickup.filter((_, j) => j !== i))}>Togli</button>
            </div>
          ))}
          {v.pickup.length < 8 && <button type="button" className="btn btn--outline" onClick={() => set("pickup", [...v.pickup, { nome: "", orario: "" }])}>+ Aggiungi un punto di raccolta</button>}
        </div>
      )}

      <label className="check"><input type="checkbox" checked={v.guidato} onChange={(e) => set("guidato", e.target.checked)} /> È un evento guidato (c'è qualcuno che accompagna e racconta)</label>

      <div className="due">
        <Campo label="Prezzo indicativo"><input className="input" maxLength={80} value={v.prezzo} onChange={(e) => set("prezzo", e.target.value)} placeholder="Es. 25 €, gratuito" /></Campo>
        <Campo label="Link per info o prenotazioni"><input className="input" type="url" maxLength={300} value={v.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" /></Campo>
      </div>
    </>
  );
}

export default function Segnala({ dentro = false }) {
  const [v, setV] = useState(VUOTO);
  const [criteri, setCriteri] = useState([false, false, false]);
  const [privacy, setPrivacy] = useState(false);
  const [trappola, setTrappola] = useState("");
  const [foto, setFoto] = useState(null);
  const [stato, setStato] = useState("form");
  const [err, setErr] = useState("");
  const aperto = useRef(Date.now());
  const set = (k, val) => { setV((x) => ({ ...x, [k]: val })); setErr(""); };

  const invia = async (ev) => {
    ev.preventDefault();
    // Anti-spam: campo nascosto compilato o form inviato troppo in fretta = bot.
    if (trappola || Date.now() - aperto.current < 6000) { setStato("ok"); return; }
    if (!v.org_nome.trim() || !isEmail(v.org_email)) return setErr("Inserisci il nome dell'organizzazione e un'email valida.");
    if (!v.titolo.trim() || !v.inizio || !v.luogo_nome.trim() || !v.comune.trim()) return setErr("Mancano titolo, data, luogo o comune.");
    if (new Date(v.inizio) < new Date()) return setErr("La data di inizio è già passata.");
    if (!criteri.every(Boolean)) return setErr("Per essere pubblicato l'evento deve rispettare i tre criteri.");
    if (!privacy) return setErr("Serve il consenso al trattamento dei dati.");
    setStato("invio");
    try {
      // la locandina è facoltativa: se il caricamento non va, l'evento parte lo stesso
      const immagine = foto ? await caricaFoto(foto).catch(() => null) : null;
      await segnalaEvento({
        ...v,
        ...(immagine ? { immagine } : {}),
        inizio: new Date(v.inizio).toISOString(),
        fine: v.fine ? new Date(v.fine).toISOString() : null,
        pickup: v.accesso.includes("bus") ? v.pickup.filter((p) => p.nome.trim()) : [],
        accesso: v.accesso.length ? v.accesso : ["auto"],
        criteri_ok: true,
      });
      setStato("ok");
    } catch (e) {
      setErr(/troppe/.test(e.message) ? "Hai già inviato molte segnalazioni oggi. Riprova domani o scrivici." : "Invio non riuscito, riprova tra poco.");
      setStato("form");
    }
  };

  if (stato === "ok") {
    return (
      <section className="card card--cassa">
        <div className="big-emoji">🍷</div>
        <strong>Grazie, abbiamo ricevuto l'evento!</strong>
        <p className="muted">Lo controlliamo a mano e, se rispetta i criteri Bevotoscano, lo pubblichiamo entro pochi giorni. Se ci serve qualcosa ti scriviamo.</p>
        <button className="btn btn--outline" onClick={() => { setV(VUOTO); setCriteri([false, false, false]); setPrivacy(false); aperto.current = Date.now(); setStato("form"); }}>Segnala un altro evento</button>
      </section>
    );
  }

  return (
    <form className="stack form" onSubmit={invia} noValidate>
      {!dentro && <h1 className="page-title">Segnala un evento</h1>}
      <p className="muted">È gratis. Raccogliamo in un unico posto gli eventi del vino toscano, con un occhio a chi vuole arrivarci senza guidare. Ogni evento viene controllato da noi prima di essere pubblicato.</p>

      <section className="card">
        <strong>I tre criteri Bevotoscano</strong>
        {[
          "È un evento: si tiene in una data precisa, non è un'offerta sempre disponibile.",
          "Il vino protagonista è toscano.",
          "C'è chi il vino lo fa: il produttore o la cantina è presente e lo racconta.",
        ].map((t, i) => (
          <label key={i} className="check"><input type="checkbox" checked={criteri[i]} onChange={(e) => setCriteri(criteri.map((c, j) => (j === i ? e.target.checked : c)))} /> {t}</label>
        ))}
      </section>

      <section className="card">
        <strong>Chi organizza</strong>
        <Campo label="Sei *">
          <select className="input" value={v.org_tipo} onChange={(e) => set("org_tipo", e.target.value)}>
            {Object.entries(TIPI_ORG).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Campo>
        <Campo label="Nome dell'organizzazione *"><input className="input" maxLength={120} value={v.org_nome} onChange={(e) => set("org_nome", e.target.value)} /></Campo>
        <div className="due">
          <Campo label="Referente"><input className="input" maxLength={80} value={v.org_referente} onChange={(e) => set("org_referente", e.target.value)} /></Campo>
          <Campo label="Email *" hint="Non viene pubblicata"><input className="input" type="email" maxLength={200} value={v.org_email} onChange={(e) => set("org_email", e.target.value)} /></Campo>
        </div>
        <div className="due">
          <Campo label="Telefono" hint="Non viene pubblicato"><input className="input" maxLength={40} value={v.org_telefono} onChange={(e) => set("org_telefono", e.target.value)} /></Campo>
          <Campo label="Instagram o sito"><input className="input" maxLength={200} value={v.org_social} onChange={(e) => set("org_social", e.target.value)} placeholder="@nomecantina" /></Campo>
        </div>
      </section>

      <section className="card">
        <strong>L'evento</strong>
        <CampiEvento v={v} set={set} />
        <CampoFoto file={foto} onFile={setFoto} etichetta="Foto o locandina (se ce l'hai)"
          aiuto="Sulla scheda dell'evento si vede piccola come anteprima e si apre in grande. Va bene anche una foto della locandina." />
      </section>

      <input className="trappola" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trappola} onChange={(e) => setTrappola(e.target.value)} name="sito_web" />

      <label className="check">
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
        <span>Acconsento al trattamento dei dati per la pubblicazione dell'evento. Email e telefono servono solo per contattarti e non vengono pubblicati. Per cancellarli scrivi a {CONTACT_EMAIL}.</span>
      </label>

      {err && <p className="error">{err}</p>}
      <button className="btn btn--primary wide" type="submit" disabled={stato === "invio"}>{stato === "invio" ? "Invio…" : "Invia l'evento"}</button>
    </form>
  );
}
