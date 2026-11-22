# BevoToscano – Scanner automatico (eventi, anagrafe, notizie)

> Documento di passaggio per l'agente che cura l'infrastruttura (app, backend, admin, Vercel).
> Lo scanner è stato costruito in un'altra sessione ("agente ricerca"). Vive tutto in **Supabase** (progetto `davnmxhgoxvtoypdrjkz`) e nelle **routine cloud di Claude Code**. Non ci sono server o costi API: le routine usano il piano Claude dell'utente.
> Aggiornato al 22/11/2026.

---

## 1. Come funziona in due righe

Sei routine cloud cercano sul web eventi del vino, realtà del vino e notizie. Scrivono **sempre "in attesa"** nel database. Una routine di verifica fa un secondo controllo. **L'admin approva** e solo allora le cose diventano pubbliche nell'app.

```
routine 1,2,5 ──► eventi (stato = in_attesa, fonte = scanner) ──► routine 6 verifica ──► ADMIN approva ──► eventi_pubblici
routine 2,4,5 ──► scanner_attori (stato = in_attesa)                                   ──► ADMIN approva ──► attori_pubblici
routine 3     ──► notizie (stato = in_attesa)                                          ──► ADMIN approva ──► blog
```

---

## 2. Cosa deve costruire il backend / pannello admin

### 2.1 Eventi dello scanner (tabella `eventi`, già usata dall'app)
- Mostrare gli eventi con `stato = 'in_attesa'`. Quelli dello scanner hanno `fonte = 'scanner'`.
- **Ordinare per `verifica`**: prima `pronto`, poi `da_completare`, poi `da_scartare`. Accanto mostrare **`verifica_note`**: la nota del verificatore, che spiega cosa ha controllato.
- Mostrare anche **`fonte_url`** (il link dove è stata letta la data), `note_scanner`, `categoria`.
- Azioni: **Approva** → `stato = 'pubblicato'`, `approvato = now()`. **Rifiuta** → `stato = 'rifiutato'` (+ `note_admin`).
- La vista pubblica `eventi_pubblici` **non è stata toccata** (stato `pubblicato`, non finiti). Mancano i campi nuovi: `orari`, `provincia`, `prenotazione`, `categoria`, `orario_trovato`. **Aggiungeteli alla vista** se l'app deve mostrarli.

### 2.2 Anagrafe realtà del vino (tabella `scanner_attori`) – NUOVA
Cantine, aziende agricole, fattorie, enoteche, wine bar, ristoranti del vino, consorzi, strade del vino. Oggi ci sono circa 420 righe, di cui circa 307 con sito.
- Pannello di approvazione: `stato` (`in_attesa` | `approvato` | `rifiutato`), `note_admin`, `approvato`. La policy UPDATE per l'admin c'è già.
- `origine` dice da dove arriva: `consorzio`, `osm` (OpenStreetMap), `ia` (ricerca web), `segnalazione` (utente), `admin`.
- **Segnalazioni degli utenti**: la policy `segnala attore` permette INSERT a `anon` e `authenticated` solo con `stato='in_attesa'`, `origine='segnalazione'`, `approvato` e `note_admin` nulli. Il form può salvare l'email del segnalante in `segnalato_da_email`.
  ⚠️ **Manca un limite anti-spam**: aggiungete un trigger come `limita_segnalazioni` / `limita_proposte`.
- Vista pubblica pronta: **`attori_pubblici`**, con le sole realtà approvate. Ha sempre un link `google_maps`: se manca quello esatto, genera una ricerca Maps da nome e comune.
- Da sistemare in approvazione: alcuni `comune` arrivati da OSM o dai consorzi sono **frazioni** (es. "Panzano in Chianti", "Bolgheri", "Montemerano"). Il comune giusto è quello senza la frazione.

### 2.3 Notizie per il blog (tabella `notizie`) – NUOVA
Uscite delle guide, concorsi, classifiche, dati dei consorzi, curiosità. Sono **solo bozze verificate** (fonte primaria obbligatoria).
- Colonne: `stato` (`in_attesa` | `pubblicata` | `rifiutata`), `categoria`, `titolo`, `sintesi` (testo già in stile news), `dettagli` (jsonb, es. aziende/vini/punteggi), `aziende` (text[]), `fonte_nome`, `fonte_url`, `fonte_url_2`, `data_fonte`, `note_admin`, `approvato`.
- Policy: l'admin fa tutto; `anon`/`authenticated` leggono solo `stato = 'pubblicata'`.
- Da fare: pagina blog nell'app + pannello di approvazione. Oggi ci sono 3 bozze.

### 2.4 Utili da mostrare all'admin (solo lettura)
- `scansioni`: registro di ogni importazione (zona/etichetta, trovati, inseriti, errore).
- `scanner_fonti`: fonti e aggregatori con esito dell'ultima lettura.
- `scanner_censimento`: avanzamento della lettura degli elenchi soci dei consorzi.
- `scanner_comuni`: i 273 comuni toscani (ISTAT) con data dell'ultima ricerca.
- `scanner_regole`: **i criteri e il formato degli eventi**. Le routine li leggono a ogni giro, quindi si possono modificare da qui senza toccare le routine. Un editor testuale nell'admin sarebbe comodo (policy admin ALL già presente).

---

## 3. Modifiche fatte alla tabella `eventi` (condivisa con l'app)

| Cosa | Dettaglio |
|---|---|
| `fonte` | ora ammette anche `'scanner'` (check `eventi_fonte_check`) |
| `org_email` | ora **nullable**; resta obbligatoria per `fonte='form'` (check `eventi_org_email_form_check`) |
| `impronta` | text, **unique**: impedisce i doppioni (titolo + data + comune) |
| `fonte_url` | pagina dove lo scanner ha letto l'evento |
| `categoria` | degustazione, fiera, cantine_aperte, anteprima, masterclass, festa_del_vino, arte_e_vino, vigna_e_natura, altro |
| `orari`, `provincia`, `prenotazione`, `orario_trovato`, `verificato_il`, `note_scanner` | campi del prompt eventi BevoToscano |
| `verifica`, `verifica_note`, `verificato_ia` | esito del verificatore (routine 6) |
| trigger `eventi_scanner_conta` | conta gli eventi trovati per comune (tabella `scanner_comuni`) |

Lo scanner compila anche le colonne che esistevano già: `guidato`, `accesso` (auto/bus/treno/piedi), `pickup` (fermate navetta), `prezzo` ("Gratis" o cifre), `immagine`, `org_social`, `org_email`, `org_telefono`, `lat`/`lng`.

---

## 4. Da NON toccare (o avvisare l'agente ricerca prima)

- Le funzioni dello scanner, tutte `security definer` e **non eseguibili da anon/authenticated**: `importa_eventi_scanner`, `registra_attori`, `importa_notizie`, `leggi_pagina`, `segna_*`, `prossimi_comuni`, `prossimo_censimento`, `attori_*`, `eventi_da_verificare`, `eventi_visittuscany`, `osm_importa_provincia`. Le usano solo le routine, tramite il connettore Supabase. **Non concedetele ad anon**: `leggi_pagina` scarica pagine web e in mano pubblica sarebbe un rischio.
- I nomi delle colonne usate dalle funzioni (sezione 3) e i valori dei check.
- L'indice unico su `eventi.impronta` e su `scanner_attori (lower(nome), lower(comune))`.
- Estensioni usate: `http` (schema extensions), `pg_net`, `pg_cron` (oggi nessun job cron).

### Residui da pulire (non servono più)
- Edge Function **`scansione-eventi`**: vecchia versione a pagamento (API Anthropic), non viene più chiamata. **Si può cancellare.**
- Segreti del Vault `scanner_chiave` e `progetto_url` e la funzione `scanner_chiave_ok`: servivano a quella funzione. Si possono rimuovere insieme.

---

## 5. Le routine (claude.ai → Code → Routines)

| # | Nome | Cosa fa | Frequenza ora (avvio) | Modello |
|---|---|---|---|---|
| 1 | BevoToscano 1 - fonti, zone e province | aggregatori, 14 zone del vino, 10 province, bus/navette | ogni 3 giorni, 06:00 | Sonnet |
| 2 | BevoToscano 2 - comune per comune | 8 comuni al giorno in profondità + anagrafe + social | ogni giorno, 06:30 | Opus |
| 3 | BevoToscano 3 - notizie, guide e concorsi | bozze blog verificate | lun e gio, 07:00 | Sonnet |
| 4 | BevoToscano 4 - censimento cantine, enoteche e social | elenchi soci consorzi, OpenStreetMap, social/Maps | ogni notte, 04:00 | Opus |
| 5 | BevoToscano 5 - giro siti delle cantine | apre 40 siti di cantine a notte e cerca eventi | ogni notte, 03:00 | Sonnet |
| 6 | BevoToscano 6 - verificatore eventi | secondo controllo degli eventi in attesa | ogni mattina, 08:00 | Opus |

(Orari in ora italiana.) Le routine usano solo il connettore **Supabase**. La rete del cloud blocca molti siti, quindi le pagine si leggono con la funzione `leggi_pagina` del database.

---

## 6. Piano frequenze: AVVIO → REGIME

La fase di **avvio** serve a riempire l'anagrafe e fare il primo giro completo di comuni e siti. Poi le frequenze vanno **abbassate** per consumare meno piano.

**Fine dell'avvio** quando è vero tutto questo:
- `scanner_censimento`: tutti gli elenchi in `fatto` o `non_trovato`;
- `scanner_comuni`: tutti i 273 comuni con `ultima_ricerca` valorizzata;
- `scanner_attori`: quasi tutti gli attori con un sito controllato almeno una volta (`ultimo_controllo_eventi` non nullo).

Stima: **2–4 settimane** (circa metà dicembre 2026).

| # | Avvio (ora) | Regime (proposto) |
|---|---|---|
| 1 | ogni 3 giorni | 1 volta a settimana |
| 2 | ogni giorno, 8 comuni | ogni 3 giorni, 8 comuni (giro completo ~3 mesi; i comuni "fertili" tornano prima) |
| 3 | lun + gio | invariato (in autunno, stagione delle guide), poi 1 volta a settimana |
| 4 | ogni notte | 1 volta al mese (ricontrolla elenchi e completa i social) |
| 5 | ogni notte, 40 siti | ogni 2 giorni, 40 siti |
| 6 | ogni mattina | ogni mattina (costa poco: lavora solo sugli eventi nuovi) |

Per cambiarle basta chiedere all'agente ricerca, oppure modificare la pianificazione da claude.ai → Routines.

---

## 7. Note di sicurezza (advisor Supabase)

- Le viste `eventi_pubblici` (già esistente) e `attori_pubblici` (nuova) sono `security definer`: Supabase le segnala, è voluto (espongono solo righe approvate e colonne pubbliche). In alternativa si possono rifare con `security_invoker` + policy SELECT pubbliche sulle righe approvate.
- `pg_net` è installato nello schema `public` (avviso dell'advisor, non si può spostare).
- `is_admin()` e `limita_segnalazioni()` sono eseguibili da anon (avviso preesistente).
