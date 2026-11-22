import { useState } from "react";

// "Aggiungi al calendario": Google Calendar con un link, iPhone/Outlook con un file .ics
// (il telefono lo apre e propone di salvarlo nel calendario).

const z = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const fineDi = (e) => e.fine || new Date(new Date(e.inizio).getTime() + 3 * 3600000).toISOString();
const dove = (e) => [e.luogo_nome, e.indirizzo, e.comune].filter(Boolean).join(", ");
const nota = (e, url) => [e.descrizione, e.link && `Info: ${e.link}`, `Su Bevotoscano: ${url}`].filter(Boolean).join("\n\n");

export const googleUrl = (e, url) =>
  `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: "TEMPLATE", text: e.titolo, dates: `${z(e.inizio)}/${z(fineDi(e))}`, location: dove(e), details: nota(e, url),
  })}`;

const esc = (s) => String(s || "").replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
export function scaricaIcs(e, url) {
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bevotoscano//IT", "BEGIN:VEVENT",
    `UID:${e.id}@bevotoscano.com`, `DTSTAMP:${z(Date.now())}`, `DTSTART:${z(e.inizio)}`, `DTEND:${z(fineDi(e))}`,
    `SUMMARY:${esc(e.titolo)}`, `LOCATION:${esc(dove(e))}`, `DESCRIPTION:${esc(nota(e, url))}`, `URL:${url}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  a.download = `${e.titolo.slice(0, 40).replace(/[^\w\s-]/g, "").trim() || "evento"}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const Icona = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
  </svg>
);

export default function AggiungiCalendario({ e, percorso, className = "" }) {
  const [aperto, setAperto] = useState(false);
  const url = `${window.location.origin}/${percorso}`;
  return (
    <div className={`cal ${className}`}>
      <button className="cal-btn" aria-expanded={aperto} onClick={() => setAperto((x) => !x)}><Icona /> Aggiungi al calendario</button>
      {aperto && (
        <div className="cal-menu" role="menu">
          <a role="menuitem" href={googleUrl(e, url)} target="_blank" rel="noopener" onClick={() => setAperto(false)}>Google Calendar</a>
          <button role="menuitem" onClick={() => { scaricaIcs(e, url); setAperto(false); }}>iPhone, Mac, Outlook</button>
        </div>
      )}
    </div>
  );
}
