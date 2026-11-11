# Match House — Master Prompt TECNICO (SITO WEB DEMO gratuito)

> Usa questo documento come contesto tecnico unico per far lavorare un'AI sulla creazione del **sito web demo**.
> Va usato **insieme** a `PROMPT_FUNZIONALE.md` (cosa deve fare il sito) e a `match_house_prompt.md` (contiene lo **schema SQL completo**, le RLS e le funzioni RPC: è la fonte di verità del database).
> Struttura: **A)** visione e vincoli, **B)** utenti e flussi, **C)** architettura e stack, **D)** database, **E)** "API" (Supabase + RPC), **F)** real-time, **G)** pagine e componenti, **H)** design system, **I)** sicurezza, **J)** infrastruttura e setup, **K)** migrazione dall'app esistente, **L)** roadmap, **M)** istruzioni operative per l'AI.

---

## A) Visione e vincoli

**Match House** è un **sito web responsive** (mobile-first, usabile anche da desktop) di matching per **stanze in affitto e coinquilini**, con la meccanica "swipe" di Tinder applicata al mondo immobiliare.

**Requisito aggiornato:** non più un'app mobile, ma un **sito web DEMO**, **semplice, efficiente e interamente gratuito**.

Vincoli:
1. **Costo zero e nessuna carta di credito**: solo servizi con piano gratuito permanente.
2. **Nessun server da gestire**: niente backend Node dedicato, Docker, Redis, cron server.
3. **Demo-first**: dati seed pronti, account di prova con un clic, bot che ricambiano match e rispondono in chat.
4. Interfaccia in **italiano**, mercato Italia, mappa centrata sull'Italia.
5. Tono visivo **minimal, professionale, pulito** (sezione H).

Ruoli:
- **LANDLORD** (proprietario o inquilino che cerca coinquilino): pubblica un annuncio e vede i cercatori.
- **SEEKER** (cercatore di stanza): crea un profilo e vede gli annunci.
- Swipe **SMASH** (destra) / **PASS** (sinistra); SMASH reciproco → **MATCH** → **chat in tempo reale**.

---

## B) Utenti e flussi principali

### B1. Primo accesso
1. **Benvenuto** (`/benvenuto`): logo, slogan *"Trova la stanza giusta. Trova le persone giuste."*, due card di ruolo, link "Accedi", pulsanti **"Prova la demo"** (accede con account preconfigurato).
2. **Registrazione**: email + password (8–72 caratteri) + ruolo (da query `?ruolo=`). `supabase.auth.signUp` con `options.data.user_type`; un trigger DB crea la riga `profiles`.
3. **Nessuna verifica email in demo** (impostazione "Confirm email" disattivata su Supabase). Niente schermata OTP.
4. **Onboarding** differenziato per ruolo, con barra di progresso a segmenti sottili:
   - **Landlord (4 passi)**: base (titolo, indirizzo, città, canone, **geocodifica + pin trascinabile**) → dettagli (stanze, inquilini, piano, mq, caratteristiche on/off) → descrizione e regole (data disponibilità con date picker nativo) → foto (fino a 8).
   - **Seeker (5 passi)**: personale (nome, cognome, età ≥ 18) → stile di vita (fumatore, animali, pulizia/rumore 1-5, hobby, sport) → lavoro e bio (occupazione, università/azienda, bio, orari, lingue) → preferenze (budget min/max, città, data ingresso) → foto (fino a 6).
   - Lo stato dei passi vive in uno **store Zustand** (persistito in `sessionStorage` tranne i `File` delle foto); **il salvataggio avviene solo all'ultimo passo**: insert profilo → compressione → upload foto → insert righe `photos`.
5. Ingresso in **/app/esplora**.

### B2. Uso quotidiano
- **Esplora**: stack di card swipe; pulsanti ✕ / ⓘ / ♥; tasti ← →; filtri (città, budget max, distanza); MatchModal alla corrispondenza.
- **Mappa**: annunci con pin-prezzo, ricerca città, popup con "Vedi profilo completo".
- **Match/Chat**: nuovi match, lista conversazioni, chat realtime con "sta scrivendo…" e stato letto.
- **Profilo**: vista, modifica completa, impostazioni (logout, ricomincia demo, elimina account, pagine legali).

### B3. Sessione persistente
`supabase-js` salva la sessione in localStorage e rinnova il token da solo. All'avvio: `getSession()` + `onAuthStateChange` → `authStore`. **Guard**: senza sessione → `/benvenuto`; con sessione ma senza profilo → onboarding del proprio ruolo; altrimenti → app.

---

## C) Architettura e stack

```
Browser (SPA React/Vite su Cloudflare Pages)
   │  supabase-js (HTTPS + WebSocket)
   ▼
Supabase Free
   ├─ Auth      (email + password, sessione JWT gestita da Supabase)
   ├─ Postgres  (tabelle + RLS + funzioni RPC security definer + trigger)
   ├─ Storage   (bucket "photos")
   └─ Realtime  (postgres_changes + broadcast)
Servizi esterni gratuiti: OpenStreetMap (tile), Nominatim (geocodifica)
CI: GitHub Actions (keepalive contro la pausa del progetto gratuito)
```

Progetto unico (niente monorepo):

```
match-house/
├── src/ (pages, components, hooks, stores, lib, types, styles)
├── supabase/schema.sql
├── scripts/seed.ts
├── public/_redirects
├── .github/workflows/keepalive.yml
└── .env.example
```

### Stack frontend
React 18 + **TypeScript strict** + **Vite** · **React Router** · **Tailwind CSS** (token come variabili CSS) · **TanStack Query v5** · **Zustand** · **@supabase/supabase-js v2** · **Framer Motion** (swipe) · **react-leaflet + leaflet** (mappa, tile OSM) · **zod + react-hook-form** · **date-fns** (it) · **browser-image-compression** · **lucide-react**.

### Backend
Nessun codice server. Logica in **SQL**: RLS su ogni tabella, funzioni RPC `security definer` (`swipe`, `discover_feed`, `map_properties`, `my_matches`, `mark_messages_read`, `reset_my_swipes`, `delete_my_account`), trigger (creazione profilo, limite foto, `updated_at`, bot demo).

### Limiti gratuiti da rispettare (verificare le pagine ufficiali)
| Risorsa | Indicativo | Contromisura |
|---|---|---|
| DB Supabase | ~500 MB | Dati piccoli, CHECK sulle lunghezze |
| Storage | ~1 GB | Compressione client (≤ 1200 px, ≤ 0,4 MB), 5 MB/file nel bucket, foto seed esterne |
| Realtime | ~200 connessioni | 1 canale chat + 1 canale globale per utente |
| Pausa progetto | dopo ~1 settimana senza attività | Workflow keepalive ogni 3 giorni |
| Email auth | molto limitata | Conferma email e reset password fuori demo |
| Nominatim | 1 richiesta/s, no autocomplete | Ricerca solo su clic |

---

## D) Database (riassunto — SQL completo in `match_house_prompt.md`)

Enum: `user_type { LANDLORD, SEEKER }`, `swipe_action { SMASH, PASS }`.

| Tabella | Campi chiave |
|---|---|
| **profiles** | `id` (= auth.users.id), `user_type`, `is_demo`, `created_at` |
| **landlord_profiles** | `user_id` PK, title, address, city, latitude, longitude, rent, total_rooms, available_rooms, current_tenants, square_meters?, floor?, furnished, bills_included, pets_allowed, smoking_allowed, wifi_included, parking_available, available_from (date), description, house_rules?, neighborhood_info?, `is_active` |
| **seeker_profiles** | `user_id` PK, first_name, last_name, age (18-99), bio, occupation, university?, company?, smoker, has_pets, schedule?, cleanliness 1-5, noise_level 1-5, budget_min?, budget_max?, preferred_city?, move_in_date?, hobbies[], sports[], languages[] |
| **photos** | id, `user_id`, url, `storage_path` (null per foto seed), position (0 = principale) — **tabella unica per entrambi i ruoli** |
| **swipes** | PK (from_user, to_user), action, created_at |
| **matches** | id, user_a < user_b (coppia ordinata), created_at, unique |
| **messages** | id, match_id, sender_id, content (1-2000), read, created_at |

Cambi rispetto alla versione app: **id pubblico = `user_id`** (niente id separati per profilo), **foto in una sola tabella**, **date come `date`** (non datetime), niente `RefreshToken`/`passwordHash` (li gestisce Supabase Auth), `is_active` per mettere in pausa un annuncio, `is_demo` per i bot. Tutte le FK con `on delete cascade`.

---

## E) "API": chiamate del frontend

Nessun REST custom: il client usa `supabase-js` e le RPC. Sicurezza = RLS + funzioni.

| Area | Chiamata | Note |
|---|---|---|
| Auth | `auth.signUp / signInWithPassword / signOut / getSession` | Ruolo in `options.data.user_type` |
| Profilo proprio | `select` / `insert` / `update` su `landlord_profiles` o `seeker_profiles` (`user_id = me`) | RLS: solo il proprio; `maybeSingle()` per capire se serve l'onboarding |
| Foto | Storage `upload('{uid}/{uuid}.jpg')` → `getPublicUrl` → `insert photos`; `remove` + `delete` per eliminare; `update position` per riordinare | Limite 8/6 via trigger |
| Feed | `rpc('discover_feed', { p_city, p_budget_max, p_lat, p_lng, p_radius_km })` → array di profili con `photos[]`, `distance_km`, `user_type` | 20 per batch; **il client deduplica** per `user_id` |
| Mappa | `rpc('map_properties', { p_city, p_budget_max })` | Max 100 |
| Dettaglio | `select` del profilo per `user_id` + `photos` | |
| Swipe | `rpc('swipe', { p_to_user, p_action })` → `{ matched, match_id }` | Idempotente, 60/min, ruoli opposti |
| Match | `rpc('my_matches')` → `{ match_id, other_user_id, display_name, subtitle, photo_url, last_message, unread_count }` | Risolve il vecchio problema "l'altro utente" |
| Elimina match | `from('matches').delete().eq('id', id)` | Cascade sui messaggi |
| Messaggi | `select` paginato per cursore su `created_at` (default 30) · `insert` per inviare | Invio solo via insert (niente doppio canale) |
| Letti | `rpc('mark_messages_read', { p_match_id })` | |
| Demo | `rpc('reset_my_swipes')` | "Ricomincia la demo" |
| Account | rimuovi file Storage → `rpc('delete_my_account')` → `signOut` | Cascade completo |

Errori: mostrare messaggi **in italiano**; mappare gli errori noti (`Troppi swipe…`, credenziali non valide, email già registrata, rate limit auth → "Troppi tentativi, riprova tra 15 minuti.").

---

## F) Real-time (Supabase Realtime)

- **`chat:{matchId}`** (solo con la chat aperta): `postgres_changes` INSERT su `messages` (filtro `match_id=eq.{id}`), UPDATE su `messages` (stato letto), `broadcast` `typing {userId,isTyping}` con stop automatico dopo 2 s.
- **`user:{me}`** (nel layout dell'app): `postgres_changes` INSERT su `matches` con **due listener** (`user_a=eq.{me}` e `user_b=eq.{me}`, perché il filtro ammette una sola condizione) → toast "Nuovo match!" + invalida `my_matches`; INSERT su `messages` → invalida `my_matches` e aggiorna i non letti.
- Alla riconnessione: ricarica lo storico. Nessuna coda offline in demo.
- Le tabelle `messages` e `matches` sono già aggiunte alla publication `supabase_realtime` nello schema.

---

## G) Pagine e componenti

```
/benvenuto  /accedi  /registrati?ruolo=
/onboarding/proprietario/1..4   /onboarding/cercatore/1..5
/app/esplora   /app/esplora/:userId
/app/mappa  (React.lazy)
/app/match     /app/match/:matchId
/app/profilo   /app/profilo/modifica   /app/impostazioni
/termini  /privacy
```

Layout `/app`: **mobile** = barra in basso scura con sole icone (Esplora `grid`, Mappa `map`, Match `heart`, Profilo `user`); **≥ 900 px** = barra verticale a sinistra con etichette; chat a due pannelli.

Componenti: `SwipeCard`, `ProfileCard`, `ChatBubble`, `MatchModal`, `PhotoPicker`, `LocationPicker`, `Button`, `Input`, `Badge`, `Chip`, `NavBar`, `Toast`, `DemoBanner`, stati `Loading/Error/Empty`.

### SwipeCard
- Framer Motion `drag="x"` solo sulla card in cima (`isTop`); soglia **30% della larghezza** oppure velocità > 500; rotazione ±15° interpolata; `touch-action: pan-y`.
- Overlay SMASH (verde, in alto a sinistra) / PASS (rosso, in alto a destra) con opacità legata a `x`.
- Uscita fly-out ~280 ms, altrimenti spring di ritorno.
- Stack di 3 card (scale 1 / 0.95 / 0.90, offset -8 px); prefetch quando restano ≤ 3 profili, con **deduplica** nel client.
- Input alternativi: pulsanti e tastiera (← PASS, → SMASH).
- Stati: skeleton, errore con "Riprova", vuoto "Hai visto tutto!".

### ProfileCard
Foto con puntini, info essenziali, badge solo delle caratteristiche attive, sezioni di testo; per gli annunci mini-mappa. Mai `dangerouslySetInnerHTML`.

### Mappa
`react-leaflet`, centro Italia (41.9, 12.5, zoom 6), pin `DivIcon` a pillola con `€prezzo` (attivo = nero/bianco), popup in **JSX React** (testi utente escapati di default), ricerca città con Nominatim su clic, attribuzione OSM visibile, tab caricata in lazy.

### Chat
Lista ordinata per data, update ottimistico, stato "Non inviato — Riprova" in caso di errore, `textarea` multilinea max 1000 caratteri (server: 2000), invio con Invio / Maiusc+Invio per andare a capo, segna come letti all'apertura, scroll automatico all'ultimo messaggio.

---

## H) Design system

**Principi**: minimal, professionale, pulito. Superfici bianche, bordi sottili, **niente gradienti, niente ombre** (solo modal/popup). Colori funzionali solo per **Smash (verde)** e **Pass (rosso)**; il resto scala di grigi. Mai colori hardcodati: solo token.

```css
:root {
  --bg:#FFFFFF; --surface:#F5F5F3; --border:rgba(0,0,0,.07); --border-strong:rgba(0,0,0,.14);
  --text:#111111; --text-2:#666666; --text-3:#AAAAAA;
  --smash:#1B9870; --smash-bg:#E0F4EE; --pass:#E04040; --pass-bg:#FBEAEA;
  --accent:#111111; --nav:#111111;
  --radius-sm:6px; --radius-md:12px; --radius-lg:20px; --radius-xl:28px; --radius-full:999px;
}
```

**Decisione (chiude l'incongruenza K9 della vecchia versione):** pesi font **solo 400 e 500** · font di sistema · h1 30/500, h2 22/500, h3 17/500, body 15/400 (lh 22), caption 12/400, label 11/500 maiuscolo `ls .4px` · **nessuna ombra** nemmeno sulla barra di navigazione.

- Navigazione: sfondo `--nav`, icone bianche (attiva piena con alone circolare tenue; inattive 35%), nessuna etichetta su mobile.
- Pulsanti primari neri con testo bianco e spinner; secondari `--surface` con bordo sottile; Smash/Pass tenui verde/rosso con bordo.
- Card radius 20, bordo 1 px; chip/toggle a pillola (attivi pieni `#111`); campi con sfondo `--surface`, errore rosso sotto.
- Pulsanti swipe: cerchi 60 px (Pass/Smash) e 46 px (info).
- Responsive, contrasto AA, focus visibile, `aria-label` sulle icone, rispetto di `prefers-reduced-motion`. Solo modalità chiara.
- **Ogni pagina con dati**: loading (skeleton/spinner), errore (messaggio + Riprova), vuoto (messaggio + azione).

---

## I) Sicurezza (checklist da mantenere)

- **RLS su tutte le tabelle**; `swipes` e `matches` non scrivibili direttamente; ruolo utente immutabile; "letto" solo via RPC.
- **Service_role key mai nel frontend né nel repo** (solo `.env.seed` locale). Le chiavi `VITE_*` sono pubbliche per natura: la protezione è RLS.
- Validazione zod lato client **e** CHECK nel DB (lunghezze, intervalli, età ≥ 18, budget max ≥ min, stanze disponibili ≤ totali).
- Niente `dangerouslySetInnerHTML`; testi sempre come testo (anche nei popup della mappa).
- Upload: MIME whitelist e 5 MB nel bucket, scrittura solo in `{uid}/`, limite foto per ruolo via trigger.
- Rate limit: 60 swipe/min nella RPC; limiti auth di Supabase.
- Email mai esposta ad altri utenti; ogni funzione RPC verifica `auth.uid()` e il ruolo del chiamante (no IDOR).
- Banner demo con avviso "non inserire dati personali reali sensibili"; pagine Termini/Privacy che dichiarano la natura dimostrativa.
- Nessun log di password/token; `.env*` nel `.gitignore`.

---

## J) Infrastruttura e setup (tutto gratuito)

**Locale**
1. `npm install`
2. Crea progetto Supabase Free → incolla `supabase/schema.sql` nel SQL Editor → disattiva "Confirm email".
3. Copia `.env.example` in `.env` e inserisci URL e anon key; crea `.env.seed` con la service_role (solo locale).
4. `npx supabase gen types typescript --project-id <id> > src/types/database.types.ts`
5. `npm run seed` (idempotente) → `npm run dev`.

**Produzione**
- **Cloudflare Pages** collegato al repo GitHub: build `npm run build`, output `dist`, variabili `VITE_*`; `public/_redirects` = `/* /index.html 200`. Alternative: Netlify, Vercel Hobby, GitHub Pages (con `HashRouter`).
- Supabase → Authentication → URL Configuration: Site URL e redirect con l'indirizzo `*.pages.dev`.
- **Keepalive** (`.github/workflows/keepalive.yml`): cron ogni 3 giorni con una richiesta REST usando la anon key (secret `SUPABASE_URL`, `SUPABASE_ANON_KEY`). Nei repo pubblici GitHub sospende i cron dopo circa 60 giorni di inattività: ricordarlo nel README.
- Nessun dominio personalizzato (a pagamento): si usa `*.pages.dev`.

**Variabili**: frontend `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DEMO_MODE`, `VITE_DEMO_*_EMAIL/PASSWORD`; seed `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

**Modalità demo**
- Seed: ≥ 20 proprietari e ≥ 20 cercatori realistici in più città italiane, `is_demo = true`, foto con URL esterni stabili (non occupano Storage); due account di prova completi (`is_demo = false`).
- I profili `is_demo` ricambiano lo SMASH (~70%, deterministico per coppia) e rispondono ai messaggi con testi predefiniti.
- "Ricomincia la demo" in Impostazioni → `reset_my_swipes()`.

---

## K) Migrazione dall'app esistente (cosa riusare, cosa scartare)

Esiste un progetto **app** (`apps/mobile` React Native + `apps/backend` Express/Prisma). Il sito web è un **nuovo progetto**: il vecchio codice è solo riferimento.

**Da riusare / portare**
- Testi UI in italiano, etichette, messaggi di errore e regole di validazione (portarli in zod).
- Design token e palette (con la decisione di stile della sezione H).
- Logica e parametri dello swipe (soglia 30%, rotazione ±15°, stack di 3 card).
- Struttura dell'onboarding (4 + 5 passi) e liste di hobby/sport/lingue/orari.
- Contenuti e idee per il seed (`prisma/seed.ts`), tradotti in `scripts/seed.ts`.
- Logica di discovery (filtri, ordinamento, haversine): ora in `discover_feed`.

**Da scartare (non esiste più nel sito)**
React Native / Expo / expo-router / SecureStore / Reanimated / WebView+Leaflet inlined · Express, Prisma, bcrypt, JWT custom, refresh token, interceptor Axios · Socket.io · Cloudinary/Multer · Redis, node-cron, nodemailer/SendGrid · OTP e reset in memoria · Docker Compose · script `.bat` · EAS Build · `react-native-maps` e Google Maps key.

**Problemi noti dell'app già risolti dall'architettura (non vanno riprodotti)**
| Vecchio problema | Come si risolve ora |
|---|---|
| Percorsi/payload client↔server disallineati (profili, swipe, discover, match, messaggi, `/auth/me`) | Non c'è più un REST custom: il client usa `supabase-js` con **tipi generati** e RPC con contratto fisso (§E) |
| Nomi evento socket e payload `match:new` incoerenti | Realtime con tabelle/filtri definiti in §F |
| Messaggio inviato sia via socket sia via REST | Solo `insert` su `messages` |
| "L'altro utente" nei match | RPC `my_matches` |
| OTP/reset in memoria | Verifica email disattivata in demo; reset password in Fase 2 |
| Upload foto con campo/risposta diversi | Upload diretto su Storage + insert in `photos` |
| Date `YYYY-MM-DD` vs datetime | Colonne `date` + `<input type="date">` |
| Coordinate annuncio 0,0 | Geocodifica Nominatim + pin trascinabile, coordinate obbligatorie |
| XSS nel popup mappa | Popup in JSX React |
| Discovery landlord senza filtro budget | Filtro `budget_max >= rent` e città in `discover_feed` |
| Utente senza profilo che entra in Esplora | Guard di onboarding nel router |
| Stile 600/700 vs 400/500, ombre | Decisione unica in §H |
| Elimina account non implementato | `delete_my_account()` con cascade |
| Limite foto 8 vs 10 | 8 proprietario / 6 cercatore, trigger DB |

**Ancora da implementare nel sito**: modifica profilo completa (tutti i campi), pagine legali reali, filtri feed nella UI, pagina dettaglio con Pass/Smash, stati loading/errore/vuoto ovunque.

---

## L) Roadmap

### Fase 1 — DEMO (da completare)
- [ ] Schema SQL + RLS + RPC + trigger + bucket applicati e verificati con due utenti
- [ ] Seed idempotente (≥ 20 profili per ruolo) e account di prova
- [ ] Auth (registrazione, login, logout, sessione persistente, guard)
- [ ] Onboarding landlord/seeker con geocodifica, date picker, upload foto compresse
- [ ] Esplora con swipe (drag, pulsanti, tastiera), filtri, dettaglio, MatchModal
- [ ] Mappa annunci con ricerca città
- [ ] Match + chat realtime (typing, letto) + bot demo
- [ ] Profilo, modifica completa, impostazioni, elimina account, ricomincia demo
- [ ] Pagine legali, banner demo, stati loading/errore/vuoto
- [ ] Deploy su Cloudflare Pages + keepalive

### Fase 2 — opzionale
Password dimenticata (SMTP gratuito) · annulla ultimo swipe · compatibilità % · badge non letti · blocca/segnala · elimina match dalla chat · annuncio attivo/in pausa · riordino foto con drag&drop · PWA installabile.

### Fuori dalla demo
Notifiche push/email, verifica OTP, videochiamata, boost/Super Smash, analytics, i18n, scadenza annunci con job, coda messaggi offline, app native, pagamenti.

---

## M) Istruzioni operative per l'AI

1. **Leggi prima** i tre documenti (`PROMPT_FUNZIONALE.md`, questo file, `match_house_prompt.md`) e, se presente, il codice esistente. Se esiste già una cartella del sito web, confronta e modifica; altrimenti parti da zero usando `apps/` solo come riferimento (sezione K). In caso di dubbio il **codice reale** vince sulla descrizione.
2. Ordine di lavoro: **DB e seed → scheletro (router, guard, token) → auth → onboarding → esplora/swipe/match → chat realtime → mappa → profilo/impostazioni → deploy**.
3. **TypeScript strict**, niente `any`; usa i tipi generati da Supabase e un file `domain.ts` per i tipi del feed (unione discriminata per `user_type`).
4. Validazione zod su ogni form; errori e testi UI **in italiano**.
5. Rispetta il design system (sezione H) e i token; ogni pagina con loading/errore/vuoto.
6. Swipe a 60 fps (motion value, niente re-render per frame); testa con touch e con mouse + tastiera.
7. **Costo zero come regola**: se una scelta richiede servizio a pagamento o carta, usa l'alternativa gratuita e segnalalo. All'inizio verifica i limiti correnti dei piani gratuiti.
8. Sicurezza: non indebolire nessun punto della sezione I; ogni nuova tabella nasce con RLS attiva e ogni nuova RPC verifica `auth.uid()`.
9. Quando aggiungi o cambi una funzionalità: aggiorna `schema.sql`, il seed, il README e questi documenti.
10. Non committare segreti (`.env`, `.env.seed`, service_role). Mantieni `.env.example` aggiornato.
11. A fine lavoro elenca le **assunzioni** fatte e le **differenze** rispetto ai documenti.
