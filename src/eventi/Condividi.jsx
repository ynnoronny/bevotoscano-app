import { useState } from "react";
import { condividiStoriaEvento } from "./storia.js";
import { INSTAGRAM_STORIES } from "../games/storyImage.js";
import { eventoPercorso } from "../seo.js";

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const IconaShare = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>
);
const IconaIg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
);

async function mandaLink(e) {
  const url = `${window.location.origin}/${eventoPercorso(e)}`;
  try {
    if (navigator.share) await navigator.share({ title: e.titolo, url });
    else { await navigator.clipboard.writeText(url); return "copiato"; }
  } catch { /* annullato */ }
  return "";
}

// Condividi un evento: come storia Instagram (immagine 9:16 creata al volo) o come link.
// "grande" è il pulsante della pagina evento; senza, è l'icona tonda delle schede.
export default function CondividiEvento({ e, grande = false }) {
  const [aperto, setAperto] = useState(false);
  const [stato, setStato] = useState(""); // "" | lavoro | scaricata | copiato | errore

  const storia = async () => {
    setAperto(false);
    setStato("lavoro");
    try {
      const esito = await condividiStoriaEvento(e);
      setStato(esito === "scaricata" ? "scaricata" : "");
    } catch {
      setStato("errore");
    }
  };
  const link = async () => { setAperto(false); setStato(await mandaLink(e)); };

  return (
    <div className={`condividi ${grande ? "condividi--grande" : ""}`}>
      {grande ? (
        <div className="row">
          <button className="btn btn--outline condividi-ig" onClick={storia} disabled={stato === "lavoro"}>
            <IconaIg /> {stato === "lavoro" ? "Preparo l'immagine…" : "Condividi nelle storie"}
          </button>
          <button className="link" onClick={link}>Manda il link</button>
        </div>
      ) : (
        <button className="ev-share" aria-label="Condividi" aria-expanded={aperto} disabled={stato === "lavoro"} onClick={() => setAperto((x) => !x)}>
          {stato === "lavoro" ? <span className="condividi-gira" aria-hidden="true" /> : <IconaShare />}
        </button>
      )}
      {aperto && (
        <div className="cal-menu condividi-menu" role="menu">
          <button role="menuitem" onClick={storia}><IconaIg /> Storia Instagram</button>
          <button role="menuitem" onClick={link}><IconaShare /> Manda il link</button>
        </div>
      )}
      {grande && stato === "" && isMobile() && <small className="muted">Nel menu che si apre scegli Instagram → Storia. Poi aggiungi lo sticker Link con l'indirizzo dell'evento.</small>}
      {stato === "scaricata" && (
        <div className="condividi-aiuto" role="status">
          <b>Immagine salvata 📸</b>
          <span>Aprila su Instagram dalla galleria come nuova storia.</span>
          {isMobile() && <a className="link" href={INSTAGRAM_STORIES}>Apri le storie di Instagram</a>}
          <button className="link" onClick={() => setStato("")}>Ok</button>
        </div>
      )}
      {stato === "copiato" && <div className="condividi-aiuto" role="status"><span>Link copiato 🔗</span><button className="link" onClick={() => setStato("")}>Ok</button></div>}
      {stato === "errore" && <div className="condividi-aiuto" role="status"><span>Non sono riuscito a creare l'immagine: fai uno screenshot 🍷</span><button className="link" onClick={() => setStato("")}>Ok</button></div>}
    </div>
  );
}
