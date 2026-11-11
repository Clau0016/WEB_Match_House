# Match House MVP web

La specifica principale è il documento **match house mvp sitoweb.docx**. Il codice mantiene TanStack Start, React, Vite e Supabase dell’export Lovable.

- [Guida funzionale e test prima del lancio](PROMPT_FUNZIONALE.md)
- [Guida tecnica e prossimi passi](PROMPT_TECNICO.md)

## Avvio locale

1. Installa le dipendenze con `npm install` usando Node.js 22 o successivo.
2. Copia `.env.example` in `.env.local`. Inserisci l’URL del progetto e la chiave pubblicabile Supabase. Le chiavi privilegiate vanno conservate sul server.
3. Esegui una volta [database/mvp.sql](database/mvp.sql) nel SQL Editor del progetto Supabase. Lo script crea tabelle MVP, funzioni, permessi e bucket privati. Usa nomi con prefisso `mh_` per affiancare eventuali tabelle Lovable preesistenti.
4. In Supabase Auth abilita la conferma email e configura gli URL di redirect verso `/account` e `/accesso?mode=update` per il dominio del sito e per l’origine locale utilizzata.
5. Avvia con `npm run dev`. Usa `npm test` per il controllo delle rotte e `npm run build` per la build di produzione.

## Amministrazione

Dopo aver registrato e verificato il primo account amministratore, aggiungi il suo UUID alla tabella `public.mh_admins` dal SQL Editor. L’area amministrativa è disponibile su `/amministrazione`. L’approvazione di un annuncio lo rende visibile nella ricerca pubblica. Una modifica del proprietario riporta l’annuncio in bozza o in verifica, secondo l’azione scelta.

## Dati e configurazione per la messa online

- Il sito parte senza annunci e profili di esempio. La fotografia della homepage ha funzione illustrativa.
- I pesi del matching si configurano nella funzione `mh_rank_roommates`. Città, budget e data di ingresso valgono insieme 60 punti su 100. I dettagli facoltativi vengono filtrati dal database.
- Le richieste di finanziamento compaiono nel pannello amministrativo. La simulazione calcola la rata usando il tasso ipotetico inserito dall’utente.
- Prima di aprire le registrazioni al pubblico, completa i testi legali con i dati del titolare e i contatti ufficiali, configura la posta transazionale e verifica gli accessi usando account di prova sul progetto Supabase di destinazione.
