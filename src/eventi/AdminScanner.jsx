import { useEffect, useMemo, useState } from "react";
import { online, tuttiGliAttori, aggiornaAttori, tutteLeNotizie, aggiornaNotizia, registroScanner, salvaRegola } from "./api.js";
import { fmtData } from "./shared.js";
import { siglaProvincia } from "../province.js";
import Link from "../Link.jsx";
import { cantinaPercorso } from "../seo.js";
import { trovaCantina, FASCE } from "../fasce.js";

// Le parti del gestionale che lavorano con lo scanner automatico (vedi docs/SCANNER.md):
// cantine ed enoteche da approvare, notizie per il blog, registro e regole dello scanner.
// Qui si cambiano solo stato, note e comune: le funzioni dello scanner non si toccano.

export const CATEGORIE = {
  degustazione: "Degustazione", fiera: "Fiera", cantine_aperte: "Cantine aperte", anteprima: "Anteprima",
  masterclass: "Masterclass", festa_del_vino: "Festa del vino", arte_e_vino: "Arte e vino", vigna_e_natura: "Vigna e natura", altro: "Altro",
};
export const TIPI_ATTORE = {
  cantina: "Cantina", azienda_agricola: "Azienda agricola", fattoria: "Fattoria", enoteca: "Enoteca", wine_bar: "Wine bar",
  ristorante: "Ristorante", consorzio: "Consorzio", strada_del_vino: "Strada del vino", associazione: "Associazione", altro: "Altro",
};
const ORIGINI_ATTORE = { consorzio: "Elenco del consorzio", osm: "OpenStreetMap", ia: "Trovata dall'IA", segnalazione: "Segnalata da un utente", admin: "Inserita da te" };
export const CATEGORIE_NOTIZIE = { guida: "Guide", concorso: "Concorsi", classifica: "Classifiche", consorzio: "Dai consorzi", curiosita: "Curiosità", arte_e_vino: "Arte e vino", altro: "Notizie" };

const url = (u) => (!u ? null : /^https?:\/\//.test(u) ? u : `https://${u}`);
const errore = (e, onEsci, setErr) => (e.message === "sessione" ? onEsci() : setErr(e.message));

function Schede({ voci, valore, onCambia, conta }) {
  return (
    <div className="chips">
      {voci.map(([k, l]) => (
        <button key={k} className={`chip ${valore === k ? "chip--on" : ""}`} onClick={() => onCambia(k)}>{l}{conta ? ` (${conta(k)})` : ""}</button>
      ))}
    </div>
  );
}

// ---------- Cantine ed enoteche (scanner_attori) ----------

export function Attori({ onEsci }) {
  const [lista, setLista] = useState(null);
  const [err, setErr] = useState("");
  const [stato, setStato] = useState("in_attesa");
  const [origine, setOrigine] = useState("");
  const [tipo, setTipo] = useState("");
  const [cerca, setCerca] = useState("");
  const [soloSito, setSoloSito] = useState(false);
  const [quante, setQuante] = useState(40);
  const [lavoro, setLavoro] = useState(false);

  const carica = () => tuttiGliAttori().then(setLista).catch((e) => { setLista([]); errore(e, onEsci, setErr); });
  useEffect(() => { carica(); }, []);

  const q = cerca.trim().toLowerCase();
  const filtrate = useMemo(() => (lista || []).filter((a) => a.stato === stato
    && (!origine || a.origine === origine) && (!tipo || a.tipo === tipo) && (!soloSito || a.sito)
    && (!q || `${a.nome} ${a.comune || ""}`.toLowerCase().includes(q))), [lista, stato, origine, tipo, soloSito, q]);
  const conta = (st) => (lista || []).filter((a) => a.stato === st).length;

  const cambia = async (ids, campi) => {
    setErr(""); setLavoro(true);
    try { await aggiornaAttori(ids, campi); await carica(); } catch (e) { errore(e, onEsci, setErr); }
    setLavoro(false);
  };
  const approva = (ids) => cambia(ids, { stato: "approvato", approvato: new Date().toISOString() });
  const rifiuta = (id) => {
    const nota = prompt("Perché la scarti? (resta nelle note)", "");
    if (nota !== null) cambia([id], { stato: "rifiutato", note_admin: nota || null });
  };

  return (
    <>
      <h1 className="page-title">Archivio cantine ed enoteche</h1>
      <p className="muted">Tutto quello che trovano le ricerche (elenchi dei consorzi, OpenStreetMap, ricerca web) o segnalano gli utenti, rivenditori compresi. Non serve guardarlo riga per riga: le cantine passano da qui alla ricerca singola e le confermi in «Cantine qualificate». Le enoteche le approvi da qui.</p>
      <Schede voci={[["in_attesa", "Da approvare"], ["approvato", "Approvate"], ["rifiutato", "Scartate"]]} valore={stato} onCambia={(s) => { setStato(s); setQuante(40); }} conta={conta} />
      <div className="admin-filtri">
        <input className="input" placeholder="Cerca nome o comune" value={cerca} onChange={(e) => setCerca(e.target.value)} />
        <select className="input" value={origine} onChange={(e) => setOrigine(e.target.value)}>
          <option value="">Tutte le origini</option>
          {Object.entries(ORIGINI_ATTORE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Tutti i tipi</option>
          {Object.entries(TIPI_ATTORE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <label className="admin-check"><input type="checkbox" checked={soloSito} onChange={(e) => setSoloSito(e.target.checked)} /> Solo con sito</label>
      </div>
      {err && <p className="error">{err}</p>}
      {!lista && <p className="muted">Carico…</p>}
      {lista && (
        <div className="row between">
          <small className="muted">{filtrate.length} con questi filtri</small>
          {stato === "in_attesa" && filtrate.length > 1 && (
            <button className="btn btn--outline" disabled={lavoro} onClick={() => confirm(`Approvare tutte le ${filtrate.length} realtà filtrate? Compariranno nell'app.`) && approva(filtrate.map((a) => a.id))}>
              {lavoro ? "Approvo…" : `Approva tutte le ${filtrate.length} filtrate`}
            </button>
          )}
        </div>
      )}
      {lista && filtrate.length === 0 && <p className="muted">Niente qui.</p>}
      <div className="list">
        {filtrate.slice(0, quante).map((a) => <Attore key={a.id} a={a} lavoro={lavoro} onApprova={() => approva([a.id])} onRifiuta={() => rifiuta(a.id)}
          onAttesa={() => cambia([a.id], { stato: "in_attesa", approvato: null })} onComune={(comune) => cambia([a.id], { comune })} onDescrizione={(descrizione) => cambia([a.id], { descrizione })} />)}
      </div>
      {filtrate.length > quante && <button className="btn btn--outline" onClick={() => setQuante((n) => n + 40)}>Mostra altre {Math.min(40, filtrate.length - quante)}</button>}
    </>
  );
}

function Attore({ a, lavoro, onApprova, onRifiuta, onAttesa, onComune, onDescrizione }) {
  const [comune, setComune] = useState(a.comune || "");
  const [descr, setDescr] = useState(a.descrizione || "");
  const riconosciuto = siglaProvincia(a.comune);
  const link = [["Sito", url(a.sito)], ["Instagram", url(a.instagram)], ["Facebook", url(a.facebook)], ["Maps", a.google_maps], ["Fonte", a.fonte_url]].filter(([, u]) => u);
  return (
    <article className="card">
      <div className="admin-testa">
        <span className="admin-origine">{TIPI_ATTORE[a.tipo] || a.tipo}</span>
        <small className="evento-data">{ORIGINI_ATTORE[a.origine] || a.origine} · {fmtData(a.creato, false)}</small>
      </div>
      <strong className="evento-titolo">{a.nome}</strong>
      <div className="admin-comune">
        <input className="input" value={comune} maxLength={80} onChange={(e) => setComune(e.target.value)} aria-label="Comune" />
        {comune !== (a.comune || "") && <button className="btn btn--outline" disabled={lavoro} onClick={() => onComune(comune.trim() || null)}>Salva comune</button>}
      </div>
      {a.comune && !riconosciuto && <small className="admin-avviso">⚠️ Comune non riconosciuto: forse è una frazione. Scrivi il comune vero.</small>}
      {a.indirizzo && <small>{a.indirizzo}</small>}
      {link.length > 0 && <small className="admin-link">{link.map(([l, u]) => <a key={l} className="link" href={u} target="_blank" rel="noopener">{l} ↗</a>)}</small>}
      {(a.telefono || a.email) && <small>{a.telefono} {a.email && <a className="link" href={`mailto:${a.email}`}>{a.email}</a>}</small>}
      {a.denominazioni && <small>🍇 {a.denominazioni}</small>}
      {a.note && <p className="muted">{a.note}</p>}
      {/* la riga che si legge sul sito: le note qui sopra restano solo per te */}
      <label className="admin-descr">
        <small>Descrizione sul sito (una o due righe)</small>
        <textarea className="input" rows={2} maxLength={220} value={descr} placeholder="Es. Biodinamica, villa storica sulle colline di Lucca" onChange={(e) => setDescr(e.target.value)} />
        {descr !== (a.descrizione || "") && <button className="btn btn--outline" disabled={lavoro} onClick={() => onDescrizione(descr.trim() || null)}>Salva descrizione</button>}
      </label>
      {a.foto && <a href={a.foto} target="_blank" rel="noopener"><img src={a.foto} alt="" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 10 }} /></a>}
      {a.segnalato_da_email && <small>Segnalata da <a className="link" href={`mailto:${a.segnalato_da_email}`}>{a.segnalato_da_email}</a></small>}
      {a.esito_controllo && <small className="muted">Ultimo giro sul sito: {a.esito_controllo}</small>}
      {a.note_admin && <small>📝 {a.note_admin}</small>}
      <div className="row">
        {a.stato !== "approvato" && <button className="btn btn--primary" disabled={lavoro} onClick={onApprova}>Approva</button>}
        {a.stato !== "rifiutato" && <button className="btn btn--outline" disabled={lavoro} onClick={onRifiuta}>Scarta</button>}
        {a.stato !== "in_attesa" && <button className="link" disabled={lavoro} onClick={onAttesa}>Rimetti da approvare</button>}
      </div>
    </article>
  );
}

// ---------- Cantine qualificate (secondo livello) ----------
// L'archivio qui sopra tiene tutto quello che trovano le ricerche. Una ricerca singola per ogni
// cantina (routine "qualifica cantine", funzione salva_qualifica) propone la scheda: se produce,
// se è azienda agricola, ettari, bottiglie, tipi di vino ed etichette, con le fonti lette.
// Tu confermi; le cantine confermate che producono diventano pubbliche.

const SI_NO = (v) => (v === true ? "sì" : v === false ? "no" : "non si sa");

export function Qualificate({ onEsci }) {
  const [lista, setLista] = useState(null);
  const [err, setErr] = useState("");
  const [vista, setVista] = useState("proposta");
  const [fascia, setFascia] = useState("");
  const [lavoro, setLavoro] = useState(false);
  const [quante, setQuante] = useState(30);

  const carica = () => tuttiGliAttori().then(setLista).catch((e) => { setLista([]); errore(e, onEsci, setErr); });
  useEffect(() => { carica(); }, []);

  // la soglia sta nelle regole dello scanner (Scanner > Regole > soglia_vignaioli)
  const [soglia, setSoglia] = useState(100000);
  useEffect(() => { registroScanner("scanner_regole", "nome=eq.soglia_vignaioli&select=testo").then((r) => { const n = parseInt(String(r?.[0]?.testo || "").replace(/\D/g, ""), 10); if (n) setSoglia(n); }).catch(() => {}); }, []);
  const fasciaDi = (a) => (a.bottiglie == null ? "" : a.bottiglie <= soglia ? "vignaioli" : "grandi");
  const tutte = lista || [];
  const archivio = tutte.filter((a) => !a.qualifica && ["cantina", "azienda_agricola", "fattoria", "altro"].includes(a.tipo) && a.stato !== "rifiutato").length;
  const conta = (v) => tutte.filter((a) => (v === "non_producono" ? a.qualifica === "confermata" && a.produce === false : v === "confermata" ? a.qualifica === "confermata" && a.produce !== false : a.qualifica === v)).length;
  const filtrate = tutte.filter((a) => (vista === "non_producono" ? a.qualifica === "confermata" && a.produce === false : vista === "confermata" ? a.qualifica === "confermata" && a.produce !== false : a.qualifica === vista))
    .filter((a) => !fascia || (fascia === "ignoti" ? a.bottiglie == null : fasciaDi(a) === fascia))
    .sort((x, y) => String(y.qualificata_il || "").localeCompare(String(x.qualificata_il || "")));
  const nomeDi = (id) => tutte.find((a) => a.id === id)?.nome || `#${id}`;

  const cambia = async (gruppi) => {
    setErr(""); setLavoro(true);
    try { for (const [ids, campi] of gruppi) await aggiornaAttori(ids, campi); await carica(); } catch (e) { errore(e, onEsci, setErr); }
    setLavoro(false);
  };
  // confermare: chi produce va online (se non lo era), chi non produce resta fuori dall'app
  const conferma = (righe) => {
    const ora = new Date().toISOString();
    const producono = righe.filter((a) => a.produce !== false).map((a) => a.id);
    const no = righe.filter((a) => a.produce === false).map((a) => a.id);
    return cambia([
      [producono, { qualifica: "confermata", confermata_il: ora, stato: "approvato", approvato: ora }],
      [no, { qualifica: "confermata", confermata_il: ora, stato: "in_attesa", approvato: null }],
    ]);
  };
  const rifai = (a) => {
    const nota = prompt("Cosa deve ricontrollare la ricerca? (facoltativo)", "");
    if (nota === null) return;
    cambia([[[a.id], { qualifica: null, qualifica_tentata: null, confermata_il: null, note_admin: nota ? `Da rifare: ${nota}` : a.note_admin }]]);
  };
  const togli = (a) => confirm(`Togliere ${a.nome} dall'app? Resta nell'archivio e tra le qualificate.`) && cambia([[[a.id], { stato: "in_attesa", approvato: null }]]);

  return (
    <>
      <h1 className="page-title">Cantine qualificate</h1>
      <p className="muted">Ogni cantina dell'archivio passa per una ricerca singola che verifica se produce, se è azienda agricola, i volumi e le etichette. Qui confermi il risultato: le cantine confermate che producono vanno nell'app. Sotto le {soglia.toLocaleString("it-IT")} bottiglie l'anno sono «{FASCE.vignaioli.nome}», sopra «{FASCE.grandi.nome}». Nell'archivio ne restano {archivio} da qualificare.</p>
      <Schede voci={[["proposta", "Da confermare"], ["confermata", "Confermate"], ["non_producono", "Non producono"], ["doppione", "Doppioni"]]} valore={vista} onCambia={(v) => { setVista(v); setQuante(30); }} conta={conta} />
      <div className="admin-filtri">
        <select className="input" value={fascia} onChange={(e) => setFascia(e.target.value)}>
          <option value="">Tutte le fasce</option>
          <option value="vignaioli">{FASCE.vignaioli.nome}</option>
          <option value="grandi">{FASCE.grandi.nome}</option>
          <option value="ignoti">Volumi non trovati</option>
        </select>
      </div>
      {err && <p className="error">{err}</p>}
      {!lista && <p className="muted">Carico…</p>}
      {lista && vista === "proposta" && filtrate.length > 1 && (
        <div className="row between">
          <small className="muted">{filtrate.length} da confermare</small>
          <button className="btn btn--outline" disabled={lavoro} onClick={() => confirm(`Confermare tutte le ${filtrate.length}? Quelle che producono compariranno nell'app.`) && conferma(filtrate)}>
            {lavoro ? "Confermo…" : `Conferma tutte le ${filtrate.length}`}
          </button>
        </div>
      )}
      {lista && filtrate.length === 0 && <p className="muted">{vista === "proposta" ? "Niente da confermare: la ricerca singola non ha ancora proposto nuove schede." : "Niente qui."}</p>}
      <div className="list">
        {filtrate.slice(0, quante).map((a) => (
          <Qualifica key={a.id} a={a} fascia={fasciaDi(a)} lavoro={lavoro} doppioneDi={a.doppione_di && nomeDi(a.doppione_di)}
            onConferma={() => conferma([a])} onRifai={() => rifai(a)} onTogli={() => togli(a)} />
        ))}
      </div>
      {filtrate.length > quante && <button className="btn btn--outline" onClick={() => setQuante((n) => n + 30)}>Mostra altre {Math.min(30, filtrate.length - quante)}</button>}
    </>
  );
}

function Qualifica({ a, fascia, lavoro, doppioneDi, onConferma, onRifai, onTogli }) {
  const vini = Array.isArray(a.vini) ? a.vini : [];
  return (
    <article className="card">
      <div className="admin-testa">
        <span className="admin-origine">{fascia ? FASCE[fascia].nome : a.qualifica === "doppione" ? "Doppione" : "Volumi non trovati"}</span>
        <small className="evento-data">{a.comune || "comune?"} · ricerca del {fmtData(a.qualificata_il, false)}{a.stato === "approvato" ? " · nell'app" : ""}</small>
      </div>
      <strong className="evento-titolo">{a.nome}</strong>
      {a.qualifica === "doppione" ? (
        <small>È la stessa realtà di <b>{doppioneDi}</b>. Nell'app compare solo quella.</small>
      ) : (
        <dl className="admin-qualifica">
          <dt>Produce</dt><dd>{a.produce === false ? "❌ no" : a.produce ? "✅ sì" : "❔ non si sa"}</dd>
          <dt>Azienda agricola</dt><dd>{SI_NO(a.azienda_agricola)}</dd>
          <dt>Volumi</dt><dd>{[a.ettari && `${a.ettari} ha`, a.bottiglie && `${a.bottiglie.toLocaleString("it-IT")} bottiglie${a.bottiglie_stima ? " (stima)" : ""}`].filter(Boolean).join(" · ") || "non trovati"}</dd>
          {a.gruppo && <><dt>Gruppo</dt><dd>{a.gruppo}</dd></>}
          {(a.tipologie || []).length > 0 && <><dt>Tipi</dt><dd>{a.tipologie.join(", ")}</dd></>}
          {vini.length > 0 && <><dt>Etichette</dt><dd>{vini.map((v) => v.nome).join(" · ")}</dd></>}
        </dl>
      )}
      {a.qualifica_note && <p className="muted">{a.qualifica_note}</p>}
      {(a.qualifica_fonti || []).length > 0 && (
        <small className="admin-link">{a.qualifica_fonti.map((u, i) => <a key={u} className="link" href={u} target="_blank" rel="noopener">Fonte {i + 1} ↗</a>)}{a.sito && <a className="link" href={url(a.sito)} target="_blank" rel="noopener">Sito ↗</a>}</small>
      )}
      <div className="row">
        {a.qualifica === "proposta" && <button className="btn btn--primary" disabled={lavoro} onClick={onConferma}>Conferma</button>}
        {a.qualifica === "confermata" && a.stato === "approvato" && <button className="btn btn--outline" disabled={lavoro} onClick={onTogli}>Togli dall'app</button>}
        <button className="link" disabled={lavoro} onClick={onRifai}>Rifai la ricerca</button>
      </div>
    </article>
  );
}

// ---------- Notizie per il blog ----------

export function Notizie({ onEsci }) {
  const [lista, setLista] = useState(null);
  const [err, setErr] = useState("");
  const [stato, setStato] = useState("in_attesa");
  const [edit, setEdit] = useState(null);

  const carica = () => tutteLeNotizie().then(setLista).catch((e) => { setLista([]); errore(e, onEsci, setErr); });
  useEffect(() => { carica(); }, []);
  const cambia = async (id, campi) => {
    setErr("");
    try { await aggiornaNotizia(id, campi); setEdit(null); carica(); } catch (e) { errore(e, onEsci, setErr); }
  };
  const conta = (st) => (lista || []).filter((n) => n.stato === st).length;
  const vista = (lista || []).filter((n) => n.stato === stato);

  return (
    <>
      <h1 className="page-title">Notizie per il blog</h1>
      <p className="muted">Bozze scritte dallo scanner, sempre con una fonte. Quelle che pubblichi compaiono nel Blog dell'app.</p>
      {!online() && <p className="rule">Le notizie funzionano solo con il database collegato.</p>}
      <Schede voci={[["in_attesa", "Da approvare"], ["pubblicata", "Pubblicate"], ["rifiutata", "Scartate"]]} valore={stato} onCambia={setStato} conta={conta} />
      {err && <p className="error">{err}</p>}
      {!lista && <p className="muted">Carico…</p>}
      {lista && vista.length === 0 && <p className="muted">Niente qui.</p>}
      <div className="list">
        {vista.map((n) => (
          <article key={n.id} className="card">
            <div className="admin-testa">
              <span className="admin-origine">{CATEGORIE_NOTIZIE[n.categoria] || n.categoria || "Notizia"}</span>
              <small className="evento-data">{n.data_fonte ? `Fonte del ${fmtData(n.data_fonte, false)}` : fmtData(n.creato, false)}</small>
            </div>
            {edit?.id === n.id ? (
              <div className="stack">
                <input className="input" maxLength={160} value={edit.titolo} onChange={(e) => setEdit({ ...edit, titolo: e.target.value })} />
                <textarea className="input" rows={8} maxLength={2000} value={edit.sintesi} onChange={(e) => setEdit({ ...edit, sintesi: e.target.value })} />
                <div className="row">
                  <button className="btn btn--primary" onClick={() => cambia(n.id, { titolo: edit.titolo.trim(), sintesi: edit.sintesi.trim() })}>Salva il testo</button>
                  <button className="link" onClick={() => setEdit(null)}>Annulla</button>
                </div>
              </div>
            ) : (
              <>
                <strong className="evento-titolo">{n.titolo}</strong>
                {n.sintesi && n.sintesi.split(/\n+/).map((p, i) => <p key={i} className="muted">{p}</p>)}
              </>
            )}
            <Dettagli d={n.dettagli} />
            <small className="admin-link">
              <a className="link" href={n.fonte_url} target="_blank" rel="noopener">{n.fonte_nome || "Fonte"} ↗</a>
              {n.fonte_url_2 && <a className="link" href={n.fonte_url_2} target="_blank" rel="noopener">Seconda fonte ↗</a>}
            </small>
            {n.note_admin && <small>📝 {n.note_admin}</small>}
            <div className="row">
              {n.stato !== "pubblicata" && <button className="btn btn--primary" onClick={() => cambia(n.id, { stato: "pubblicata", approvato: new Date().toISOString() })}>Pubblica nel blog</button>}
              {edit?.id !== n.id && <button className="btn btn--outline" onClick={() => setEdit({ id: n.id, titolo: n.titolo, sintesi: n.sintesi || "" })}>Modifica il testo</button>}
              {n.stato !== "rifiutata" && <button className="link" onClick={() => { const m = prompt("Perché la scarti? (resta nelle note)", ""); if (m !== null) cambia(n.id, { stato: "rifiutata", note_admin: m || null }); }}>Scarta</button>}
              {n.stato !== "in_attesa" && <button className="link" onClick={() => cambia(n.id, { stato: "in_attesa" })}>Rimetti in bozza</button>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

// I dettagli strutturati della notizia (vini, aziende, punteggi). Si usa anche nel blog.
// Con "cantine" (nel blog) l'azienda diventa il link alla sua scheda, se la mostriamo.
export function Dettagli({ d, cantine }) {
  const righe = Array.isArray(d) ? d.filter((r) => r && (r.vino || r.azienda)) : [];
  if (!righe.length) return null;
  return (
    <ul className="notizia-dettagli">
      {righe.map((r, i) => (
        <li key={i}>
          <b>{r.vino}{r.vino && r.azienda && " · "}<NomeAzienda nome={r.azienda} cantine={cantine} /></b>
          {(r.comune || r.punteggio != null || r.riconoscimento) && (
            <span>{[r.comune, r.punteggio != null && `${r.punteggio} punti`, r.riconoscimento].filter(Boolean).join(" · ")}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function NomeAzienda({ nome, cantine }) {
  const c = nome && cantine && trovaCantina(nome, cantine);
  if (!c) return nome || null;
  return <Link className="link" to={cantinaPercorso(c)}>{nome}</Link>;
}

// ---------- Registro dello scanner (sola lettura) e regole ----------

const VISTE = [
  ["scansioni", "Scansioni"],
  ["fonti", "Fonti"],
  ["censimento", "Censimento consorzi"],
  ["comuni", "Comuni"],
  ["regole", "Regole"],
];

export function Registro({ onEsci }) {
  const [vista, setVista] = useState("scansioni");
  return (
    <>
      <h1 className="page-title">Scanner</h1>
      <p className="muted">Cosa ha fatto lo scanner automatico. Qui si legge soltanto, tranne le regole che le routine usano a ogni giro.</p>
      {!online() && <p className="rule">Il registro funziona solo con il database collegato.</p>}
      <Schede voci={VISTE} valore={vista} onCambia={setVista} />
      {vista === "regole" ? <Regole key="regole" onEsci={onEsci} /> : <Tabella key={vista} vista={vista} onEsci={onEsci} />}
    </>
  );
}

const QUERY = {
  scansioni: ["scansioni", "select=*&order=inizio.desc&limit=100"],
  fonti: ["scanner_fonti", "select=*&order=ultima_lettura.desc.nullslast"],
  censimento: ["scanner_censimento", "select=*&order=stato.asc,nome.asc"],
  comuni: ["scanner_comuni", "select=*&order=eventi_trovati.desc,comune.asc"],
};

function Tabella({ vista, onEsci }) {
  const [righe, setRighe] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { registroScanner(...QUERY[vista]).then(setRighe).catch((e) => { setRighe([]); errore(e, onEsci, setErr); }); }, [vista]);
  if (err) return <p className="error">{err}</p>;
  if (!righe) return <p className="muted">Carico…</p>;
  if (!righe.length) return <p className="muted">Niente qui.</p>;

  if (vista === "scansioni") return (
    <div className="list">
      {righe.map((r) => (
        <div key={r.id} className="admin-riga">
          <b>{r.zona || "—"}</b>
          <small>{fmtData(r.inizio)} · trovati {r.trovati ?? 0}, inseriti {r.inseriti ?? 0}</small>
          {r.errore && <small className="error">{r.errore}</small>}
        </div>
      ))}
    </div>
  );
  if (vista === "fonti") return (
    <div className="list">
      {righe.map((r) => (
        <div key={r.id} className="admin-riga">
          <b>{r.attiva ? "" : "⏸ "}{r.url ? <a className="link" href={r.url} target="_blank" rel="noopener">{r.nome} ↗</a> : r.nome}</b>
          <small>{r.tipo} · {r.ultima_lettura ? `letta ${fmtData(r.ultima_lettura)}` : "mai letta"} · eventi {r.eventi_trovati ?? 0}</small>
          {r.esito && <small className="muted">{r.esito}</small>}
        </div>
      ))}
    </div>
  );
  if (vista === "censimento") {
    const finiti = righe.filter((r) => ["fatto", "non_trovato"].includes(r.stato)).length;
    return (
      <>
        <p><b>{finiti} su {righe.length}</b> elenchi letti (fatto o non trovato).</p>
        <div className="list">
          {righe.map((r) => (
            <div key={r.id} className="admin-riga">
              <b>{r.url ? <a className="link" href={r.url} target="_blank" rel="noopener">{r.nome} ↗</a> : r.nome}</b>
              <small>{r.zona} · {r.stato} · {r.attori_registrati ?? 0} realtà{r.ultimo_lavoro ? ` · ${fmtData(r.ultimo_lavoro)}` : ""}</small>
              {r.note && <small className="muted">{r.note}</small>}
            </div>
          ))}
        </div>
      </>
    );
  }
  // comuni
  const cercati = righe.filter((r) => r.ultima_ricerca).length;
  return (
    <>
      <p><b>{cercati} su {righe.length}</b> comuni già cercati almeno una volta.</p>
      <div className="list">
        {righe.map((r) => (
          <div key={r.comune} className="admin-riga">
            <b>{r.comune} ({r.provincia}){r.prioritario ? " ⭐" : ""}</b>
            <small>{r.zona || "—"} · {r.ultima_ricerca ? `cercato ${fmtData(r.ultima_ricerca, false)}` : "mai cercato"} · ricerche {r.ricerche ?? 0} · eventi {r.eventi_trovati ?? 0}</small>
          </div>
        ))}
      </div>
    </>
  );
}

function Regole({ onEsci }) {
  const [regole, setRegole] = useState(null);
  const [testi, setTesti] = useState({});
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const carica = () => registroScanner("scanner_regole", "select=*&order=nome.asc")
    .then((r) => { setRegole(r); setTesti(Object.fromEntries(r.map((x) => [x.nome, x.testo]))); })
    .catch((e) => { setRegole([]); errore(e, onEsci, setErr); });
  useEffect(() => { carica(); }, []);
  const salva = async (nome) => {
    setErr(""); setOk("");
    try { await salvaRegola(nome, testi[nome]); setOk(nome); carica(); } catch (e) { errore(e, onEsci, setErr); }
  };
  if (!regole) return <p className="muted">Carico…</p>;
  return (
    <div className="stack">
      <p className="rule">Le routine leggono questi testi a ogni giro. Cambiali con calma: valgono dalla prossima ricerca. Il formato degli eventi deve restare compatibile con lo scanner.</p>
      {err && <p className="error">{err}</p>}
      {regole.map((r) => (
        <section key={r.nome} className="card">
          <div className="row between"><strong>{r.nome}</strong><small className="muted">aggiornata {fmtData(r.aggiornato)}</small></div>
          <textarea className="input admin-regola" rows={14} value={testi[r.nome] ?? ""} onChange={(e) => setTesti({ ...testi, [r.nome]: e.target.value })} />
          <div className="row">
            <button className="btn btn--primary" disabled={testi[r.nome] === r.testo} onClick={() => salva(r.nome)}>Salva</button>
            {testi[r.nome] !== r.testo && <button className="link" onClick={() => setTesti({ ...testi, [r.nome]: r.testo })}>Annulla le modifiche</button>}
            {ok === r.nome && testi[r.nome] === r.testo && <small>✓ Salvata</small>}
          </div>
        </section>
      ))}
    </div>
  );
}
