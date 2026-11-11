# Guida tecnica Match House MVP

L’app usa React, TanStack Start e Vite. Supabase gestisce autenticazione, PostgreSQL e archiviazione. La specifica principale è **match house mvp sitoweb.docx**.

## Configurazione e avvio

1. Installa le dipendenze con `npm install` usando Node.js 22 o successivo.
2. Copia `.env.example` in `.env.local` e configura `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` dal progetto scelto. Conserva il file in locale.
3. Verifica nel Table Editor se esistono già le tabelle `mh_*`. Su un progetto privo dello schema, esegui [database/mvp.sql](database/mvp.sql) una volta nel SQL Editor. Se lo schema esiste già, verifica le differenze prima di applicare modifiche.
4. In Supabase Auth abilita la conferma email e configura il dominio del sito, l’origine locale e i redirect verso `/account` e `/accesso?mode=update`.
5. Registra e verifica l’account amministratore. Dal SQL Editor aggiungi il suo UUID a `public.mh_admins`.
6. Esegui `npm run dev` e apri l’URL stampato dal terminale. Esegui `npm test` e `npm run build` prima della pubblicazione.

## Dati e autorizzazioni

- La ricerca pubblica legge la vista `mh_public_listings`, che espone gli annunci approvati dei proprietari attivi.
- Il punteggio si calcola in PostgreSQL con `mh_rank_roommates`. Città, budget e data di ingresso pesano 60 punti su 100. La funzione controlla profilo attivo, email confermata e visibilità prima di restituire i risultati.
- Le policy RLS regolano le operazioni per proprietari, utenti verificati e amministratori. Foto e documenti usano bucket privati con URL firmati.
- L’anteprima dell’export Lovable era configurata per il progetto `zinmrniycuyprmpekelm`. Verifica che sia il progetto di destinazione prima di applicare lo schema. Il file `.env_locale` del vecchio stack non configura il client Supabase di questo MVP.

## Prossimi passi

1. Accedere al progetto Supabase di destinazione, verificare lo schema e completare Auth, posta transazionale e account amministratore.
2. Eseguire i [test funzionali](PROMPT_FUNZIONALE.md#verifica-prima-del-lancio) con due utenti verificati e un amministratore. Verificare anche il rifiuto delle operazioni riservate quando si accede come utente normale.
3. Ripristinare l’autenticazione GitHub per `Clau0016/WEB_Match_House` e inviare i commit su `main`. Il precedente tentativo di push è stato respinto da GitHub per autenticazione.
4. Configurare l’hosting, impostare le variabili Supabase nell’ambiente di build e aggiungere il dominio pubblico ai redirect Auth. Verificare i flussi sul dominio pubblicato prima di aprire le registrazioni.
