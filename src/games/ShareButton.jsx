import { useState } from "react";
import { shareStory, INSTAGRAM_STORIES } from "./storyImage.js";

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Bottone "Condividi nelle stories". Sul telefono apre il menu di condivisione con l'immagine
// (da lì: Instagram → Storia). Se il browser non lo permette, salva l'immagine e spiega cosa fare.
export default function ShareButton({ card, filename, label = "Condividi nelle stories ✨" }) {
  const [stato, setStato] = useState(""); // "" | lavoro | scaricata | errore

  const share = async () => {
    setStato("lavoro");
    try {
      const esito = await shareStory(card, filename);
      setStato(esito === "scaricata" ? "scaricata" : "");
    } catch {
      setStato("errore");
    }
  };

  return (
    <div className="share">
      <button className="btn btn--gold" onClick={share} disabled={stato === "lavoro"}>
        {stato === "lavoro" ? "Preparo l'immagine…" : label}
      </button>
      {stato === "" && isMobile() && <span className="share-tip">Nel menu che si apre scegli Instagram → Storia</span>}
      {stato === "scaricata" && (
        <div className="share-help">
          <b>Immagine salvata 📸</b>
          <span>Aprila su Instagram dalla tua galleria come nuova storia.</span>
          {isMobile() && <a className="btn btn--outline-light" href={INSTAGRAM_STORIES}>Apri le storie di Instagram</a>}
        </div>
      )}
      {stato === "errore" && <span className="share-tip">Non sono riuscito a creare l'immagine: fai uno screenshot 🍷</span>}
    </div>
  );
}
