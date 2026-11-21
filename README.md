# Bevotoscano · app

Web app mobile (si può anche "installare" sul telefono dalla home) con 5 sezioni:

- **Scopri**: la home, con il format "Qual è il vino più toscano che hai?"
- **Cantine**: le piccole cantine, filtrabili per zona
- **Esperienze**: Cantina Diffusa e visite, con lista d'attesa via email
- **Cassa**: la Cassa Bevotoscano, con lista d'attesa
- **Eventi**: gli eventi del vino in Toscana, ordinati per vicinanza, con filtri *Senza auto*, *Con guida*, date e distanza, lista o mappa, e i punti di raccolta (pickup) dei bus più vicini a chi cerca
- **Gioca**: la parte gaming
  - **Quanto ne sai di vino toscano?** quiz a tempo (10 domande, 15 secondi l'una, difficoltà crescente), punteggio in base a velocità e difficoltà, classifica mondiale. Se esci dall'app durante una domanda, la domanda è persa (niente ricerche su Google o sull'AI)
  - **L'oroscopo del vino**: data di nascita, segno, vitigno toscano corrispondente
  - Entrambi creano l'immagine 1080x1920 da condividere nelle stories

Link diretti: `bevotoscano.com/#/gioca/quiz` e `bevotoscano.com/#/gioca/oroscopo`

## Eventi: segnalazione e moderazione

- `#/eventi`: il catalogo pubblico. `#/eventi/123` apre un evento
- `#/segnala`: il form gratuito per cantine, enoteche, aziende bus. Anti-spam: campo trappola nascosto, invio troppo veloce scartato, massimo 5 segnalazioni al giorno per email (controllato dal database). Gli eventi arrivano **in attesa**: niente va online senza il tuo ok
- `#/admin`: il tuo backend (non è nel menu). Approvi, modifichi, rifiuti (con mail già pronta per l'organizzatore), inserisci eventi tuoi, trovi le coordinate di luoghi e pickup e salvi i pickup riutilizzabili

Finché Supabase non è collegato l'app mostra 5 eventi **di esempio inventati** (marcati "Esempio") e il giro segnala → approva funziona dentro il browser.

Per attivare l'admin vero, dopo aver eseguito `supabase.sql`:
1. Supabase → **Authentication → Users → Add user**: la tua email + una password (spunta "Auto confirm")
2. **SQL Editor**: `insert into admin (email) values ('tua@email.it');`
3. Apri `bevotoscano.com/#/admin` e accedi

Nel database: tabella `eventi` (con i dati privati dell'organizzatore), tabella `pickup_point` (fermate riutilizzabili), vista `eventi_pubblici` (solo eventi approvati e non ancora passati, senza email e telefono: è l'unica cosa che il sito pubblico legge).

## Dove si cambiano i contenuti

- `src/data.js`: cantine, esperienze, testi della cassa, lista dei giochi, link Instagram e mail
- `src/games/quizData.js`: le domande del quiz (la prima risposta è quella giusta, l'ordine si mescola da solo)
- `src/games/oroscopoData.js`: i 12 segni con il loro vitigno e i testi
- `src/config.js`: le chiavi del database Supabase
- `src/eventi/`: tutta la parte eventi (`esempi.js` = gli eventi di esempio, `shared.js` = etichette di accesso e tipi di organizzatore)

## Database: classifica mondiale + email raccolte (Supabase, gratis)

Finché non lo colleghi, classifica ed email restano sul telefono di chi gioca.

1. Crea un account su supabase.com e un nuovo progetto (regione: Europe)
2. **SQL Editor** → incolla tutto il file `supabase.sql` → Run
3. **Project Settings → API**: copia **Project URL** e la chiave **anon public**
4. Incollale in `src/config.js`

Le email le vedi in **Table Editor → contatti** (puoi esportarle in CSV). Il sito può solo aggiungerle, non leggerle.

## Metterla online (Vercel)

1. Crea un repo su GitHub (es. `bevotoscano-app`) e carica **tutto il contenuto di questa cartella** (anche `src/`, `src/games/` e `public/`)
2. Su vercel.com → Add New Project → importa il repo → Framework: Vite → Deploy
3. Per usare **bevotoscano.com**: Vercel → Settings → Domains → aggiungi `bevotoscano.com`, poi su Aruba cambia i record DNS come ti indica Vercel. Da quel momento il dominio apre l'app invece della pagina Notion.

## Sviluppo in locale

```
npm install
npm run dev
```
