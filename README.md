# Match House MVP web

La specifica principale è il documento **match house mvp sitoweb.docx**. Il sito usa TanStack Start, React, Vite e Supabase.

- [Guida funzionale e test prima del lancio](PROMPT_FUNZIONALE.md)
- [Guida tecnica e prossimi passi](PROMPT_TECNICO.md)

## Avvio locale

1. Installa le dipendenze con `npm install` usando Node.js 22 o successivo.
2. Copia `.env.example` in `.env.local`. Inserisci l’URL del progetto e la chiave pubblicabile Supabase. Le chiavi privilegiate vanno conservate sul server.
3. Esegui una volta [database/mvp.sql](database/mvp.sql) nel SQL Editor di un progetto che non ha ancora lo schema. Lo script crea tabelle MVP con prefisso `mh_`, funzioni, permessi e bucket privati.
4. In Supabase Auth abilita la conferma email e configura gli URL di redirect verso `/account` e `/accesso?mode=update` per il dominio del sito e per l’origine locale utilizzata.
5. Avvia con `npm run dev`. Usa `npm test` per il controllo delle rotte e `npm run build` per la build di produzione.

Per abilitare le conversazioni tra coinquilini, esegui [database/chat.sql](database/chat.sql) e poi [database/chat-unread.sql](database/chat-unread.sql) nel SQL Editor dopo lo schema MVP. Le migrazioni recuperano le richieste di contatto esistenti, abilitano gli aggiornamenti tramite Supabase Realtime e aggiungono il conteggio dei non letti.

## Amministrazione

Dopo aver registrato e verificato il primo account amministratore, aggiungi il suo UUID alla tabella `public.mh_admins` dal SQL Editor. L’area amministrativa è disponibile su `/amministrazione`. L’approvazione di un annuncio lo rende visibile nella ricerca pubblica. Una modifica del proprietario riporta l’annuncio in bozza o in verifica, secondo l’azione scelta.

## Dati e configurazione per la messa online

- Per popolare una demo, esegui [database/demo.sql](database/demo.sql) dopo lo schema MVP. Crea quattro annunci di esempio e tre profili fittizi senza accesso. Gli annunci compaiono in **Trova casa**, i profili nei risultati del questionario. Foto e prezzi sono dimostrativi.
- I pesi del matching si configurano nella funzione `mh_rank_roommates`. Città, budget e data di ingresso valgono insieme 60 punti su 100. I dettagli facoltativi vengono filtrati dal database.
- Le richieste di finanziamento compaiono nel pannello amministrativo. La simulazione calcola la rata usando il tasso ipotetico inserito dall’utente.
- Prima di aprire le registrazioni al pubblico, completa i testi legali con i dati del titolare e i contatti ufficiali, configura la posta transazionale e verifica gli accessi usando account di prova sul progetto Supabase di destinazione.

## Demo pubblica su Cloudflare

Il Worker `web-match-house` usa il branch `main` di GitHub. La procedura per configurare Supabase, abilitare Google Analytics 4 e verificare il sito prima di condividere il link è nella [guida tecnica](PROMPT_TECNICO.md#prossimi-passi-per-la-demo-ufficiale).
