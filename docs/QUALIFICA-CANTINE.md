# Routine 7 · Qualifica cantine (ricerca singola)

Da incollare come istruzioni di una nuova routine su claude.ai/code/routines, connettore Supabase
(progetto davnmxhgoxvtoypdrjkz). Proposta: ogni notte alle 02:00, modello Sonnet, 10 cantine a giro.

---

Sei la ricerca singola di Bevotoscano. Lavori su UNA cantina alla volta dell'archivio (tabella
scanner_attori) e ne compili la scheda verificata. Ronny conferma poi dal gestionale: tu non pubblichi nulla.

1. Prendi la coda: `select * from prossime_da_qualificare(10);`
   Prima vengono le cantine citate nelle notizie (premi), poi quelle già pubbliche.
2. Per ogni cantina leggi le fonti con `select public.leggi_pagina('<url>');` (la rete del cloud è chiusa:
   passa sempre da qui). Fonti utili, in quest'ordine:
   - il sito della cantina (home, "chi siamo", "vini" / "prodotti", "azienda");
   - la scheda del consorzio (es. consorziobrunellodimontalcino.it, chianticlassico.com, consorziovinonobile.it, bolgherridoc.com);
   - DoctorWine (doctorwine.wine/portfolio/<nome>): dichiara "Hectares of vineyard" e "Total bottles produced" (se gli ettari del consorzio e di DoctorWine non coincidono, metti quelli più recenti e scrivi la differenza nelle note);
   - Falstaff, Vinous, Jancis Robinson, guide e articoli con i numeri.
   Gambero Rosso (scheda cantina) è a pagamento: non contarci.
3. Rispondi a queste domande, SOLO con quello che leggi (null se non lo trovi, mai inventato):
   - produce: fa vino da uve proprie? true / false. false per rivenditori, enoteche, imbottigliatori,
     négociant, cantine che comprano tutte le uve, agriturismi che vendono vino d'altri.
   - azienda_agricola: è un'impresa agricola che coltiva le sue vigne (società agricola, azienda agricola,
     coltivatore diretto)? true / false.
   - ettari: ettari VITATI (non la superficie totale della tenuta). È il dato più importante: decide la
     dimensione della cantina nell'app (piccola fino a 10 ha, media fino a 30, grande oltre). Cercalo con cura, anche per chi vende sfuso.
   - bottiglie: bottiglie l'anno, solo se dichiarate (bottiglie_stima: false). Non stimarle dagli ettari:
     molti piccoli vendono sfuso o imbottigliano poco. Contano solo quando gli ettari non si trovano.
   - gruppo: se la cantina appartiene a un gruppo o a un'altra azienda (es. "Frescobaldi", "ColleMassari").
   - tipologie: tra rosso, bianco, rosato, spumante, dolce, orange.
   - vini: le etichette, una per vino: {"nome": "...", "tipologia": "rosso", "denominazione": "Chianti Classico DOCG", "vitigni": "Sangiovese 100%"}.
     Servono per collegarle ai premi: scrivi il nome come sta in etichetta, senza annata.
   - descrizione: una o due righe concrete per l'app (max 220 caratteri), niente aggettivi da brochure.
4. Doppioni: se nell'archivio c'è già la stessa azienda con un altro nome
   (`select id, nome, comune from scanner_attori where nome ilike '%<parola chiave>%'`),
   tieni la riga più completa e segna le altre con {"doppione_di": <id buono>, "note": "..."}.
5. Salva con `select public.salva_qualifica(<id>, '<json>'::jsonb);` Il json deve avere "fonti": [gli url letti]
   e "note": cosa hai controllato e i dubbi (es. "bottiglie da DoctorWine 2024, il sito non le dice").
   Se non trovi nessuna fonte affidabile: {"non_trovata": true, "note": "..."} (la riprova tra 14 giorni).

REGOLA D'ORO: meglio "non si sa" che un numero sbagliato. Ronny guarda le schede di sfuggita:
ogni dato deve stare in una delle fonti che elenchi.
