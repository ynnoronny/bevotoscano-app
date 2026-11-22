# Oroscopo del vino: aggiornamento mensile

Ogni volta che il Sole cambia segno, `src/games/oroscopoMese.json` va riscritto con 12 nuovi testi. Il lavoro lo fa un'attività programmata che gira tra il 19 e il 24 di ogni mese. Le istruzioni sono qui sotto, e valgono anche se qualcuno lo vuole fare a mano.

## Passi

1. `npm ci`, poi `node scripts/cielo-del-mese.mjs`. Lo script stampa il cielo reale del periodo:
   - segno del Sole, con la data di inizio e di fine;
   - segno dei pianeti a inizio e a fine periodo, e se sono retrogradi;
   - lune nuove e piene, con il loro segno.
2. Se `sole.segno` coincide con il segno citato in `edizione` del JSON attuale ("Sole in X"), **non fare niente**: il mese è già aggiornato.
3. Se invece il segno è cambiato, riscrivi `src/games/oroscopoMese.json` con la stessa struttura:
   - `edizione`: "Sole in <Segno>"
   - `dal` / `al`: date YYYY-MM-DD, prese da `sole.dal` e `sole.al` convertite all'ora di Roma
   - `cielo`: 2-3 frasi con i fatti del periodo (ingresso del Sole, lune, cambi di segno dei pianeti, retrogradazioni). Solo fatti presi dallo script.
   - `testi`: un oggetto per ciascuno dei 12 segni (ariete, toro, gemelli, cancro, leone, vergine, bilancia, scorpione, sagittario, capricorno, acquario, pesci), ognuno con:
     - `titolo`: massimo 6 parole, con un po' di spirito;
     - `testo`: 3-4 frasi, massimo 420 caratteri;
     - `affine` e `antagonista`: `{ "segno": "<id>", "nome": "...", "testo": "..." }`.
       L'affine è uno dei due segni dello stesso elemento (trigono), l'antagonista uno dei due in quadratura.
       Ogni mese scegli quello che il cielo del periodo mette in evidenza (dove sta il Sole, Venere, Marte, Giove…).
       `nome`: il nome del rapporto, massimo 5 parole, preso dal mondo del vino ("Uvaggio della domenica", "Troppo legno").
       `testo`: 1-2 frasi, massimo 160 caratteri, che citano i due vitigni o il transito che giustifica la scelta.
     - `vino`: una frase che consiglia un vino toscano (tipologia o vitigno, **mai marche o cantine**), legato al vitigno del segno in `src/games/oroscopoData.js` o al tema del mese.
4. Controlla che il JSON sia valido e che `npm run build` passi. Poi fai un commit su `main` con il messaggio "Oroscopo del vino: Sole in <Segno>" e pusha. Vercel ripubblica da solo.

## Come scrivere i testi

- **Basali sul cielo vero.** Per ogni segno usa la casa solare in cui cade il Sole del mese, contando dal segno stesso. Aggiungi gli aspetti principali: congiunzione, opposizione e quadratura con i pianeti e con le lune del periodo. Non inventare transiti che lo script non riporta.
- **Tono Bevotoscano:** concreto, ironico, caldo, con qualche tocco toscano ("garbo", "un gotto", "bimbi", "icché") ma senza caricature. Immagini dal mondo del vino e della campagna: vendemmia, potatura, cantina, tavolate, colline.
- **Niente promesse** su salute, soldi o amore presentate come certezze. È un gioco.
- Niente marketing e niente emoji nei testi.
- Non copiare né parafrasare oroscopi pubblicati da altri.
