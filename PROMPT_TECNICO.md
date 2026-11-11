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
- Il progetto Supabase della demo è `rsdjlwwewwepbyekbant` (Match_House, Francoforte). La vista pubblica e Supabase Auth rispondono all’API. Il file `.env_locale` del vecchio stack non configura il client Supabase di questo MVP.

## Google Analytics 4

1. Crea una proprietà GA4 e un flusso di dati **Web** con l’URL pubblico del Worker. Copia l’ID di misurazione `G-…`.
2. Disattiva **Misurazione avanzata** nel flusso. L’app invia le visualizzazioni delle sezioni pubbliche e gestisce le transizioni del router. Le visualizzazioni automatiche basate sulla cronologia possono duplicarle. [Documentazione Google sulle visualizzazioni](https://developers.google.com/analytics/devguides/collection/ga4/views)
3. Aggiungi `VITE_GA_MEASUREMENT_ID` in **Cloudflare → Settings → Builds → Variables and secrets** e avvia una nuova build. Per una verifica locale usa la stessa variabile in `.env.local` e riavvia Vite.
4. Apri il sito in una finestra privata. Verifica che la richiesta al tag parta solo dopo **Accetta**, poi apri **Trova casa** e **Acquista casa**. Controlla in GA4 **In tempo reale** che le visite arrivino. Rifiuta dal footer e verifica che le nuove visite non vengano inviate.

Il tag resta disattivato finché l’ID è assente. Il codice invia `page_view` per home, ricerca, introduzione coinquilini, acquisto e informazioni. Usa URL di pagina senza parametri, frammenti o identificativi di profilo. Nei report, controlla utenti attivi, sessioni e visualizzazioni per pagina. I conteggi GA4 riflettono le visite misurabili dopo il consenso.

## Prossimi passi per la demo ufficiale

1. In Cloudflare apri il Worker **web-match-house**. Verifica che il repository `Clau0016/WEB_Match_House` sia collegato a `main` e che le variabili di build `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` puntino al progetto Match_House. I comandi del Worker sono `bun run build` e `npx wrangler deploy`.
2. Con **Deployments → Build → Retry build**, rigenera il Worker dopo ogni modifica alle variabili. Quando è **Ready**, copia il link pubblico da **Visit** e verifica **Trova casa**.
3. In Supabase Auth, imposta il link pubblico come **Site URL** e autorizza gli URL completi per `/account` e `/accesso?mode=update`. Configura la posta transazionale e assegna il ruolo amministratore al primo account verificato.
4. Esegui i [test funzionali](PROMPT_FUNZIONALE.md#verifica-prima-del-lancio) sul dominio pubblico con due utenti verificati e un amministratore. Controlla moderazione, visibilità e caricamento delle foto su desktop e smartphone.
5. Configura GA4 e verifica il primo evento. Completa informativa, preferenze statistiche e recapiti. Condividi il link pubblico dopo aver verificato registrazione, ricerca e recupero password sul dominio della demo.
