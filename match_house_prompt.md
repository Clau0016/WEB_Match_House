# Match House — Prompt di sviluppo completo (versione SITO WEB DEMO gratuita)

## 1. Contesto e obiettivo

Sei uno sviluppatore full-stack senior. Il tuo compito è costruire **Match House**, un **sito web responsive** (mobile-first, usabile anche da desktop) per la ricerca di stanze in affitto e coinquilini, ispirato alla logica di Tinder applicata al mondo immobiliare.

**Vincoli non negoziabili (cambio di requisito rispetto alla versione app):**
- È un **SITO WEB**, non più un'app mobile. Niente React Native, Expo, EAS, store.
- È una **DEMO**: deve essere semplice, veloce da costruire, efficiente e **interamente gratuita**.
- **Zero costi e zero carte di credito**: ogni servizio usato deve avere un piano gratuito permanente (non una prova a tempo) che non richieda un metodo di pagamento.
- **Nessun server da gestire**: niente backend Node/Express dedicato, niente Docker, niente Redis.
- Interfaccia **tutta in italiano**, mercato Italia.
- Design **minimal, professionale e pulito**: superfici bianche, bordi sottili, tipografia leggera, nessun gradiente, nessuna ombra decorativa.

**Principi guida:** poche dipendenze · logica sensibile nel database (RLS + funzioni SQL) · una sola fonte di verità per i tipi · dati demo pronti all'uso · ogni schermata con stati loading/errore/vuoto.

---

## 2. Cosa cambia rispetto alla versione app

| Prima (app) | Ora (sito web demo) | Motivo |
|---|---|---|
| React Native + Expo + Expo Router | **React + Vite + React Router** (SPA) | Sito web, build statica ospitabile gratis |
| Express + Node (backend dedicato) | **Supabase** (Postgres + Auth + Storage + Realtime) | Nessun server da pagare/gestire |
| Prisma ORM | **Migrazioni SQL** + `supabase-js` con tipi generati | Meno strati |
| JWT/refresh/bcrypt custom + SecureStore | **Supabase Auth** (sessione in localStorage, refresh automatico) | Già incluso |
| Socket.io | **Supabase Realtime** (postgres_changes + broadcast) | Già incluso |
| Cloudinary | **Supabase Storage** + compressione immagini lato browser | Un solo servizio |
| Redis, node-cron, SMTP/SendGrid, OTP email | **Eliminati** (verifica email disattivata in demo) | Non servono alla demo |
| Reanimated + Gesture Handler | **Framer Motion** (drag) + pulsanti + tastiera | Equivalente web |
| Leaflet in WebView | **react-leaflet** + tile OpenStreetMap | Nessuna API key |
| Docker Compose, EAS Build, Railway/Render | **Cloudflare Pages** (hosting statico gratuito) | Deploy a costo zero |
| Push notification | **Toast in-page** (solo se il sito è aperto) | Push fuori scope demo |
| Monorepo `apps/mobile` + `apps/backend` | **Un solo progetto** frontend + cartella `supabase/` | Semplicità |

---

## 3. Stack tecnologico (tutto gratuito)

### Frontend
- **React 18** + **TypeScript strict** (niente `any`) + **Vite**
- **React Router** (modalità libreria, rotte con slug italiani)
- **Tailwind CSS** con i design token come variabili CSS
- **TanStack Query v5** per fetching/cache
- **Zustand** per stato globale leggero (sessione, stato onboarding, filtri)
- **@supabase/supabase-js v2** (Auth, DB, Storage, Realtime)
- **Framer Motion** per swipe e animazioni
- **react-leaflet + leaflet** per la mappa (OpenStreetMap)
- **zod + react-hook-form** per i form
- **date-fns** (locale `it`) per date e orari relativi
- **browser-image-compression** per ridurre le foto prima dell'upload
- **lucide-react** per le icone

### Backend (gestito, nessun codice server)
- **Supabase Free**: Postgres, Auth email+password, Storage (bucket `photos`), Realtime
- Logica di business in **funzioni SQL (RPC)** `security definer` + **Row Level Security** su ogni tabella

### Servizi esterni gratuiti
- **Geocodifica**: Nominatim (OpenStreetMap), solo su azione esplicita dell'utente, max 1 richiesta/secondo
- **Tile mappa**: OpenStreetMap con attribuzione visibile
- **Hosting**: Cloudflare Pages (alternative: Netlify, Vercel Hobby, GitHub Pages con `HashRouter`)
- **CI/Cron**: GitHub Actions (workflow "keepalive")

> I limiti dei piani gratuiti cambiano nel tempo: all'inizio del lavoro verifica le pagine prezzi ufficiali di Supabase, Cloudflare e GitHub e segnala eventuali differenze.

---

## 4. Limiti dei piani gratuiti e come restarci dentro

| Risorsa | Limite indicativo (da verificare) | Contromisura |
|---|---|---|
| Database Supabase | ~500 MB | Dati demo piccoli; testi con limiti di lunghezza (CHECK) |
| Storage Supabase | ~1 GB | Compressione foto a max 1200 px lato lungo, ≤ 400 KB; limite 5 MB/file nel bucket; foto seed ospitate fuori da Storage |
| Realtime | ~200 connessioni contemporanee | Un solo canale per chat aperta + un canale globale per utente |
| Pausa progetto | Il piano gratuito mette in pausa dopo circa 1 settimana senza attività | Workflow GitHub Actions "keepalive" ogni 3 giorni |
| Email auth | Invio email integrato molto limitato | **Conferma email disattivata** e reset password fuori demo |
| Nominatim | 1 richiesta/s, niente autocomplete | Ricerca solo su click "Trova sulla mappa"/"Cerca" |
| Cloudflare Pages | Sito statico, banda generosa | Nessuna azione necessaria |

---

## 5. Struttura del progetto

```
match-house/
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # router + guard
│   ├── pages/
│   │   ├── auth/                # Welcome, Login, Register
│   │   ├── onboarding/          # landlord/Step1..4, seeker/Step1..5
│   │   ├── app/                 # Explore, ProfileDetail, MapPage, Matches, Chat, Profile, EditProfile, Settings
│   │   └── legal/               # Terms, Privacy (statiche)
│   ├── components/              # SwipeCard, ProfileCard, ChatBubble, MatchModal, Button, Input, Badge, Chip, NavBar, Toast, DemoBanner, states/{Loading,Error,Empty}
│   ├── hooks/                   # useSession, useDiscover, useMatches, useChat, useRealtime
│   ├── stores/                  # authStore, onboardingStore, filtersStore
│   ├── lib/                     # supabase.ts, geocode.ts, image.ts, format.ts, validators.ts
│   ├── types/                   # database.types.ts (generato) + domain.ts
│   └── styles/                  # tokens.css, index.css
├── supabase/
│   └── schema.sql               # unico file SQL (vedi §6), da incollare nel SQL Editor
├── scripts/
│   └── seed.ts                  # popola utenti/profili demo (usa service_role in locale)
├── public/
│   └── _redirects               # "/* /index.html 200" (fallback SPA)
├── .github/workflows/keepalive.yml
├── .env.example
└── README.md
```

---

## 6. Database — `supabase/schema.sql` (fonte di verità)

Incollare nel **SQL Editor** di Supabase. Convenzione: l'identificatore pubblico di un profilo è sempre `user_id` (uuid), che coincide con `auth.users.id`.

```sql
-- =====================================================================
-- 0. TIPI
-- =====================================================================
create type user_type as enum ('LANDLORD', 'SEEKER');
create type swipe_action as enum ('SMASH', 'PASS');

-- =====================================================================
-- 1. TABELLE
-- =====================================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  user_type   user_type not null,
  is_demo     boolean not null default false,   -- true solo per i profili di seed (bot demo)
  created_at  timestamptz not null default now()
);

create table landlord_profiles (
  user_id           uuid primary key references profiles(id) on delete cascade,
  title             text not null check (char_length(title) between 3 and 120),
  address           text not null check (char_length(address) between 3 and 200),
  city              text not null check (char_length(city) between 2 and 80),
  latitude          double precision not null check (latitude between -90 and 90),
  longitude         double precision not null check (longitude between -180 and 180),
  rent              numeric(8,2) not null check (rent > 0),
  total_rooms       int not null check (total_rooms between 1 and 20),
  available_rooms   int not null check (available_rooms between 0 and 20),
  current_tenants   int not null default 0 check (current_tenants between 0 and 20),
  square_meters     int check (square_meters > 0),
  floor             int,
  furnished         boolean not null default false,
  bills_included    boolean not null default false,
  pets_allowed      boolean not null default false,
  smoking_allowed   boolean not null default false,
  wifi_included     boolean not null default true,
  parking_available boolean not null default false,
  available_from    date not null,
  description       text not null check (char_length(description) between 20 and 2000),
  house_rules       text check (char_length(house_rules) <= 1000),
  neighborhood_info text check (char_length(neighborhood_info) <= 1000),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (available_rooms <= total_rooms)
);

create table seeker_profiles (
  user_id        uuid primary key references profiles(id) on delete cascade,
  first_name     text not null check (char_length(first_name) between 1 and 50),
  last_name      text not null check (char_length(last_name) between 1 and 50),
  age            int not null check (age between 18 and 99),
  bio            text not null check (char_length(bio) between 20 and 1000),
  occupation     text not null check (char_length(occupation) between 2 and 80),
  university     text check (char_length(university) <= 100),
  company        text check (char_length(company) <= 100),
  smoker         boolean not null default false,
  has_pets       boolean not null default false,
  schedule       text,
  cleanliness    int not null default 3 check (cleanliness between 1 and 5),
  noise_level    int not null default 2 check (noise_level between 1 and 5),
  budget_min     numeric(8,2) check (budget_min >= 0),
  budget_max     numeric(8,2) check (budget_max >= 0),
  preferred_city text check (char_length(preferred_city) <= 80),
  move_in_date   date,
  hobbies        text[] not null default '{}',
  sports         text[] not null default '{}',
  languages      text[] not null default '{Italiano}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (budget_min is null or budget_max is null or budget_max >= budget_min)
);

-- Foto di entrambi i ruoli. La principale è quella con position più bassa.
create table photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  url          text not null,
  storage_path text,               -- null per le foto seed ospitate esternamente
  position     int not null default 0,
  created_at   timestamptz not null default now()
);
create index photos_user_idx on photos (user_id, position);

create table swipes (
  from_user  uuid not null references profiles(id) on delete cascade,
  to_user    uuid not null references profiles(id) on delete cascade,
  action     swipe_action not null,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user),
  check (from_user <> to_user)
);

create table matches (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references profiles(id) on delete cascade,
  user_b     uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),           -- coppia ordinata: un solo match per coppia
  unique (user_a, user_b)
);

create table messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references matches(id) on delete cascade,
  sender_id  uuid not null references profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_match_idx on messages (match_id, created_at desc);

-- =====================================================================
-- 2. TRIGGER
-- =====================================================================
create function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_landlord_updated before update on landlord_profiles
  for each row execute function set_updated_at();
create trigger trg_seeker_updated before update on seeker_profiles
  for each row execute function set_updated_at();

-- Crea la riga in `profiles` alla registrazione (il ruolo arriva da signUp options.data.user_type)
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, user_type)
  values (new.id, (new.raw_user_meta_data->>'user_type')::user_type);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Limite foto: 8 proprietario, 6 cercatore
create function enforce_photo_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_max int; v_cnt int;
begin
  select case user_type when 'LANDLORD' then 8 else 6 end into v_max
    from profiles where id = new.user_id;
  select count(*) into v_cnt from photos where user_id = new.user_id;
  if v_cnt >= v_max then raise exception 'Numero massimo di foto raggiunto'; end if;
  return new;
end $$;
create trigger trg_photo_limit before insert on photos
  for each row execute function enforce_photo_limit();

-- =====================================================================
-- 3. ROW LEVEL SECURITY
-- =====================================================================
alter table profiles          enable row level security;
alter table landlord_profiles enable row level security;
alter table seeker_profiles   enable row level security;
alter table photos            enable row level security;
alter table swipes            enable row level security;
alter table matches           enable row level security;
alter table messages          enable row level security;

-- profiles: lettura per utenti loggati; nessuna scrittura diretta (ruolo immutabile)
create policy profiles_read on profiles for select to authenticated using (true);

-- landlord_profiles
create policy landlord_read   on landlord_profiles for select to authenticated using (true);
create policy landlord_insert on landlord_profiles for insert to authenticated
  with check (user_id = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid() and p.user_type = 'LANDLORD'));
create policy landlord_update on landlord_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy landlord_delete on landlord_profiles for delete to authenticated
  using (user_id = auth.uid());

-- seeker_profiles
create policy seeker_read   on seeker_profiles for select to authenticated using (true);
create policy seeker_insert on seeker_profiles for insert to authenticated
  with check (user_id = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid() and p.user_type = 'SEEKER'));
create policy seeker_update on seeker_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy seeker_delete on seeker_profiles for delete to authenticated
  using (user_id = auth.uid());

-- photos
create policy photos_read   on photos for select to authenticated using (true);
create policy photos_insert on photos for insert to authenticated with check (user_id = auth.uid());
create policy photos_update on photos for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy photos_delete on photos for delete to authenticated using (user_id = auth.uid());

-- swipes: solo lettura dei propri; la scrittura passa dalla funzione swipe()
create policy swipes_read on swipes for select to authenticated using (from_user = auth.uid());

-- matches: solo i partecipanti
create policy matches_read   on matches for select to authenticated
  using (auth.uid() in (user_a, user_b));
create policy matches_delete on matches for delete to authenticated
  using (auth.uid() in (user_a, user_b));

-- messages: lettura/invio solo nei propri match; "letto" solo via mark_messages_read()
create policy messages_read on messages for select to authenticated
  using (exists (select 1 from matches m where m.id = match_id and auth.uid() in (m.user_a, m.user_b)));
create policy messages_insert on messages for insert to authenticated
  with check (sender_id = auth.uid()
    and exists (select 1 from matches m where m.id = match_id and auth.uid() in (m.user_a, m.user_b)));

-- =====================================================================
-- 4. FUNZIONI RPC (security definer)
-- =====================================================================

-- 4.1 Swipe + match (max 60 swipe/minuto, solo ruoli opposti, idempotente)
create function swipe(p_to_user uuid, p_action swipe_action) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_match_id uuid;
  v_recent int;
begin
  if v_me is null then raise exception 'Non autenticato'; end if;
  if v_me = p_to_user then raise exception 'Non puoi fare swipe su te stesso'; end if;
  if (select user_type from profiles where id = v_me)
     is not distinct from (select user_type from profiles where id = p_to_user) then
    raise exception 'Combinazione di ruoli non valida';
  end if;

  select count(*) into v_recent from swipes
   where from_user = v_me and created_at > now() - interval '1 minute';
  if v_recent >= 60 then raise exception 'Troppi swipe, riprova tra un minuto'; end if;

  insert into swipes (from_user, to_user, action) values (v_me, p_to_user, p_action)
  on conflict (from_user, to_user) do update set action = excluded.action, created_at = now();

  if p_action = 'SMASH' then
    -- DEMO: i profili seed (is_demo) ricambiano lo SMASH nel ~70% dei casi (deterministico per coppia)
    if exists (select 1 from profiles where id = p_to_user and is_demo)
       and not exists (select 1 from swipes where from_user = p_to_user and to_user = v_me)
       and (get_byte(decode(md5(p_to_user::text || v_me::text), 'hex'), 0) % 10) < 7 then
      insert into swipes (from_user, to_user, action) values (p_to_user, v_me, 'SMASH')
      on conflict do nothing;
    end if;

    if exists (select 1 from swipes where from_user = p_to_user and to_user = v_me and action = 'SMASH') then
      insert into matches (user_a, user_b)
      values (least(v_me, p_to_user), greatest(v_me, p_to_user))
      on conflict (user_a, user_b) do nothing;
      select id into v_match_id from matches
       where user_a = least(v_me, p_to_user) and user_b = greatest(v_me, p_to_user);
    end if;
  end if;

  return jsonb_build_object('matched', v_match_id is not null, 'match_id', v_match_id);
end $$;

-- 4.2 Feed discovery (20 per batch, esclude già swipati e se stessi)
--     SEEKER  -> annunci con stanze libere, attivi; filtri città / budget max / raggio (haversine)
--     LANDLORD-> cercatori compatibili con città e canone del proprio annuncio
--     Ordinamento: con foto -> più vicini -> più vecchi
create function discover_feed(
  p_city text default null, p_budget_max numeric default null,
  p_lat double precision default null, p_lng double precision default null,
  p_radius_km double precision default null, p_limit int default 20
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_type user_type; v_result jsonb;
begin
  select user_type into v_type from profiles where id = v_me;
  if v_type is null then raise exception 'Non autenticato'; end if;

  if v_type = 'SEEKER' then
    select coalesce(jsonb_agg(r.j order by r.rn), '[]'::jsonb) into v_result from (
      select
        row_number() over (order by hp.has_photo desc, d.km asc nulls last, l.created_at asc) as rn,
        to_jsonb(l) || jsonb_build_object(
          'user_type', 'LANDLORD',
          'distance_km', d.km,
          'photos', (select coalesce(jsonb_agg(ph.url order by ph.position), '[]'::jsonb)
                       from photos ph where ph.user_id = l.user_id)) as j
      from landlord_profiles l
      cross join lateral (select case when p_lat is null or p_lng is null then null::double precision
        else 2 * 6371 * asin(least(1.0, sqrt(
               power(sin(radians(l.latitude - p_lat) / 2), 2)
             + cos(radians(p_lat)) * cos(radians(l.latitude))
               * power(sin(radians(l.longitude - p_lng) / 2), 2)))) end as km) d
      cross join lateral (select exists (select 1 from photos ph where ph.user_id = l.user_id) as has_photo) hp
      where l.user_id <> v_me and l.is_active and l.available_rooms > 0
        and not exists (select 1 from swipes s where s.from_user = v_me and s.to_user = l.user_id)
        and (p_city is null or l.city ilike '%' || p_city || '%')
        and (p_budget_max is null or l.rent <= p_budget_max)
        and (p_radius_km is null or d.km is null or d.km <= p_radius_km)
      order by rn
      limit least(coalesce(p_limit, 20), 50)
    ) r;
  else
    select coalesce(jsonb_agg(r.j order by r.rn), '[]'::jsonb) into v_result from (
      select
        row_number() over (order by hp.has_photo desc, s.created_at asc) as rn,
        to_jsonb(s) || jsonb_build_object(
          'user_type', 'SEEKER',
          'photos', (select coalesce(jsonb_agg(ph.url order by ph.position), '[]'::jsonb)
                       from photos ph where ph.user_id = s.user_id)) as j
      from seeker_profiles s
      join landlord_profiles me on me.user_id = v_me
      cross join lateral (select exists (select 1 from photos ph where ph.user_id = s.user_id) as has_photo) hp
      where s.user_id <> v_me
        and not exists (select 1 from swipes w where w.from_user = v_me and w.to_user = s.user_id)
        and (s.preferred_city is null or me.city ilike '%' || s.preferred_city || '%')
        and (s.budget_max is null or s.budget_max >= me.rent)
        and (p_city is null or s.preferred_city is null or s.preferred_city ilike '%' || p_city || '%')
      order by rn
      limit least(coalesce(p_limit, 20), 50)
    ) r;
  end if;
  return v_result;
end $$;

-- 4.3 Annunci per la mappa (max 100, stessi filtri città/budget)
create function map_properties(p_city text default null, p_budget_max numeric default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(l) || jsonb_build_object('user_type','LANDLORD','photos',
           (select coalesce(jsonb_agg(ph.url order by ph.position), '[]'::jsonb) from photos ph where ph.user_id = l.user_id))), '[]'::jsonb)
  from (select * from landlord_profiles
         where is_active and available_rooms > 0
           and (p_city is null or city ilike '%' || p_city || '%')
           and (p_budget_max is null or rent <= p_budget_max)
         order by created_at limit 100) l;
$$;

-- 4.4 Lista match con "l'altro utente", ultimo messaggio e non letti
create function my_matches() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(t.j order by t.sort_at desc), '[]'::jsonb) from (
    select coalesce(lm.created_at, m.created_at) as sort_at,
      jsonb_build_object(
        'match_id', m.id, 'created_at', m.created_at,
        'other_user_id', o.id, 'other_type', o.user_type,
        'display_name', case when o.user_type = 'SEEKER' then sp.first_name || ' ' || sp.last_name else lp.title end,
        'subtitle', case when o.user_type = 'SEEKER' then sp.occupation else lp.city || ' · €' || lp.rent::int || '/mo' end,
        'photo_url', (select ph.url from photos ph where ph.user_id = o.id order by ph.position limit 1),
        'last_message', case when lm.id is null then null
                        else jsonb_build_object('content', lm.content, 'sender_id', lm.sender_id, 'created_at', lm.created_at) end,
        'unread_count', (select count(*) from messages x
                          where x.match_id = m.id and x.sender_id <> auth.uid() and not x.read)
      ) as j
    from matches m
    join profiles o on o.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
    left join seeker_profiles sp on sp.user_id = o.id
    left join landlord_profiles lp on lp.user_id = o.id
    left join lateral (select * from messages x where x.match_id = m.id order by x.created_at desc limit 1) lm on true
    where auth.uid() in (m.user_a, m.user_b)
  ) t;
$$;

-- 4.5 Segna come letti i messaggi ricevuti
create function mark_messages_read(p_match_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from matches where id = p_match_id and auth.uid() in (user_a, user_b)) then
    raise exception 'Match non trovato';
  end if;
  update messages set read = true
   where match_id = p_match_id and sender_id <> auth.uid() and not read;
end $$;

-- 4.6 Strumenti demo/account
create function reset_my_swipes() returns void   -- "Ricomincia la demo": azzera i propri swipe e match
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Non autenticato'; end if;
  delete from matches where auth.uid() in (user_a, user_b);
  delete from swipes where from_user = auth.uid();
end $$;

create function delete_my_account() returns void  -- cascade su profilo, foto (righe), swipe, match, messaggi
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Non autenticato'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- 4.7 Bot demo: i profili seed rispondono con un messaggio predefinito
create function demo_bot_reply() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_other uuid;
  v_replies text[] := array[
    'Ciao! Grazie per il messaggio, molto piacere!',
    'Ciao, felice del match. Quando potremmo sentirci per saperne di più?',
    'Ottimo, mi fa piacere. Hai qualche domanda sulla casa o sulle abitudini?',
    'Perfetto, possiamo organizzare una visita o una videochiamata questa settimana.'];
begin
  if exists (select 1 from profiles where id = new.sender_id and is_demo) then return new; end if;
  select case when user_a = new.sender_id then user_b else user_a end into v_other
    from matches where id = new.match_id;
  if exists (select 1 from profiles where id = v_other and is_demo) then
    insert into messages (match_id, sender_id, content)
    values (new.match_id, v_other, v_replies[1 + floor(random() * array_length(v_replies, 1))::int]);
  end if;
  return new;
end $$;
create trigger trg_demo_bot after insert on messages
  for each row execute function demo_bot_reply();

-- 4.8 Permessi: le RPC sono solo per utenti loggati
revoke execute on function swipe(uuid, swipe_action) from public, anon;
revoke execute on function discover_feed(text, numeric, double precision, double precision, double precision, int) from public, anon;
revoke execute on function map_properties(text, numeric) from public, anon;
revoke execute on function my_matches() from public, anon;
revoke execute on function mark_messages_read(uuid) from public, anon;
revoke execute on function reset_my_swipes() from public, anon;
revoke execute on function delete_my_account() from public, anon;

-- =====================================================================
-- 5. STORAGE (bucket foto pubblico in lettura, scrittura solo nella propria cartella)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy photos_upload_own on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- 6. REALTIME
-- =====================================================================
alter publication supabase_realtime add table public.messages, public.matches;
```

Dopo l'esecuzione: **Dashboard → Authentication → Providers → Email → disattiva "Confirm email"** (demo senza verifica). Genera i tipi con `npx supabase gen types typescript --project-id <id> > src/types/database.types.ts`.

---

## 7. "API": cosa chiama il frontend (niente REST custom)

Il client parla direttamente con Supabase; la sicurezza è garantita da RLS e dalle funzioni SQL.

| Funzione | Chiamata | Note |
|---|---|---|
| Registrazione | `supabase.auth.signUp({ email, password, options: { data: { user_type } } })` | Il trigger crea `profiles` |
| Login / logout | `signInWithPassword` / `signOut` | Sessione persistente e refresh automatico |
| Sessione iniziale | `supabase.auth.getSession()` + `onAuthStateChange` | Alimenta `authStore` |
| Il mio profilo | `from('landlord_profiles' \| 'seeker_profiles').select('*').eq('user_id', me).maybeSingle()` | Se `null` → onboarding |
| Crea / modifica profilo | `insert` / `update` (RLS: solo il proprio) | Validare con zod prima |
| Foto | `storage.from('photos').upload('{uid}/{uuid}.jpg', file)` → `getPublicUrl` → `insert` in `photos` | Compressione lato client |
| Elimina foto | `storage.remove([path])` + `delete` riga `photos` | |
| Riordina foto | `update photos set position` (in batch) | La prima è la principale |
| Feed | `rpc('discover_feed', { p_city, p_budget_max, p_lat, p_lng, p_radius_km })` | **Deduplicare nel client** i profili già in coda |
| Mappa | `rpc('map_properties', { p_city, p_budget_max })` | |
| Dettaglio profilo | `select` su `landlord_profiles`/`seeker_profiles` + `photos` per `user_id` | |
| Swipe | `rpc('swipe', { p_to_user, p_action })` → `{ matched, match_id }` | |
| Lista match | `rpc('my_matches')` | |
| Elimina match | `from('matches').delete().eq('id', matchId)` | Cascade sui messaggi |
| Storico messaggi | `from('messages').select('*').eq('match_id', id).order('created_at', { ascending: false }).limit(30)` + cursore su `created_at` | |
| Invia messaggio | `from('messages').insert({ match_id, sender_id, content })` | UI ottimistica |
| Segna letti | `rpc('mark_messages_read', { p_match_id })` | All'apertura chat |
| Ricomincia demo | `rpc('reset_my_swipes')` | In Impostazioni |
| Elimina account | rimuovi i file da Storage → `rpc('delete_my_account')` → `signOut` | |

---

## 8. Real-time (Supabase Realtime)

- **Canale chat** `chat:{matchId}` (solo con la chat aperta):
  - `postgres_changes` INSERT su `messages` con `filter: match_id=eq.{matchId}` → nuovo messaggio
  - `postgres_changes` UPDATE su `messages` (stesso filtro) → aggiorna lo stato "letto"
  - `broadcast` evento `typing` con `{ userId, isTyping }` → indicatore "sta scrivendo…" (stop automatico dopo 2 s)
- **Canale globale** `user:{me}` (nel layout dell'app):
  - `postgres_changes` INSERT su `matches` con `filter: user_a=eq.{me}` **e** un secondo listener con `user_b=eq.{me}` (il filtro ammette una sola condizione) → toast "Nuovo match!" + invalidazione query `my_matches`
  - `postgres_changes` INSERT su `messages` (RLS limita ai propri match) → invalida `my_matches` e aggiorna il badge non letti
- Alla riconnessione ricaricare lo storico dei messaggi (nessuna coda offline in demo).

---

## 9. Routing e pagine

```
/                          → redirect in base alla sessione
/benvenuto                 Welcome (scelta ruolo)
/accedi                    Login
/registrati?ruolo=proprietario|cercatore
/onboarding/proprietario/1..4
/onboarding/cercatore/1..5
/app/esplora               Swipe        /app/esplora/:userId   Dettaglio (pagina)
/app/mappa                 Mappa annunci (lazy loaded)
/app/match                 Lista match e nuovi match
/app/match/:matchId        Chat
/app/profilo               Il mio profilo
/app/profilo/modifica      Modifica completa
/app/impostazioni          Impostazioni
/termini  /privacy         Pagine legali statiche
```

**Guard** (in `App.tsx`): nessuna sessione → `/benvenuto`; sessione ma senza riga profilo (landlord/seeker) → primo passo di onboarding del proprio ruolo; profilo completo → `/app/esplora`. Un utente non può mai entrare in `/app/*` senza profilo.

**Layout `/app`**: su mobile barra di navigazione in basso (sfondo `#111`, solo icone, attiva piena bianca con alone, inattive bianche 35%); da 900 px in su barra verticale a sinistra con icone ed etichette. Chat a due pannelli (lista + conversazione) su desktop.

---

## 10. Componenti chiave

### `<SwipeCard />` (cuore del sito)
- Framer Motion: `drag="x"`, `useMotionValue(x)`, rotazione `useTransform(x, [-200,0,200], [-15,0,15])`, `touch-action: pan-y`.
- Overlay **SMASH** (verde, in alto a sinistra) e **PASS** (rosso, in alto a destra) con opacità legata a `x`; la card si tinge leggermente.
- Conferma se `|offset.x| > 30% della larghezza` **oppure** `|velocity.x| > 500`; altrimenti spring di ritorno.
- Uscita fly-out ~280 ms, poi `onSwipe(userId, action)`.
- Stack di 3 card (scale 1 / 0.95 / 0.90, offset verticale -8 px); solo la prima è trascinabile.
- Alternative all'input: pulsanti ✕ / ⓘ / ♥ e tasti **← → **.
- Quando restano ≤ 3 profili, prefetch del batch successivo con deduplica per `user_id`.

```ts
interface SwipeCardProps {
  profile: LandlordFeedItem | SeekerFeedItem;   // discriminata da user_type
  onSwipe: (userId: string, action: "SMASH" | "PASS") => void;
  isTop: boolean;
}
```

### `<ProfileCard />`
Foto con puntini (clic per cambiare), informazioni essenziali, badge delle sole caratteristiche attive, sezioni testuali; per gli annunci anche mini-mappa statica. Testi sempre renderizzati come testo (mai `dangerouslySetInnerHTML`).

### `<ChatBubble />`
Allineamento per `sender_id`, orario relativo ("adesso", "5 min fa", "ieri"), stato lettura sui propri messaggi, wrap del testo lungo.

### `<MatchModal />`
Overlay scuro, due foto circolari che si avvicinano, "Avete scelto di conoscervi", CTA "Scrivi subito" (→ chat) e "Continua a esplorare". Chiudibile con Esc.

### Altri
`MapPage` (react-leaflet, pin = `DivIcon` con `€prezzo`, popup in JSX React → nessun rischio XSS), `PhotoPicker` (input file + drag&drop, compressione, anteprime, rimozione), `LocationPicker` (geocodifica + pin trascinabile), `DemoBanner`, `Toast`, stati `Loading`/`Error`/`Empty`.

---

## 11. Upload foto, geocodifica, mappa

- **Foto**: `browser-image-compression` → max 1200 px lato lungo, ≤ 0,4 MB, JPEG/WebP; path `{uid}/{uuid}.jpg`; ordine = posizione. Non usare le trasformazioni immagine di Supabase (non gratuite).
- **Geocodifica** (onboarding proprietario e modifica annuncio): pulsante "Trova sulla mappa" → `GET https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q={indirizzo, città}`; mostra mappa con **pin trascinabile** per correggere; `latitude/longitude` non possono restare 0,0. Se la ricerca fallisce: l'utente clicca sulla mappa per posizionare il pin.
- **Mappa**: centro iniziale Italia (41.9, 12.5, zoom 6); ricerca città (stessa geocodifica) che sposta e zooma; attribuzione OpenStreetMap sempre visibile; pulsante "Centra sulla mia posizione" via `navigator.geolocation` (opzionale, solo su clic).

---

## 12. Design system web

Token in `src/styles/tokens.css` e mappati in Tailwind. **Mai colori hardcodati** nei componenti.

```css
:root {
  --bg: #FFFFFF;          --surface: #F5F5F3;
  --border: rgba(0,0,0,.07); --border-strong: rgba(0,0,0,.14);
  --text: #111111;        --text-2: #666666;     --text-3: #AAAAAA;
  --smash: #1B9870;       --smash-bg: #E0F4EE;
  --pass: #E04040;        --pass-bg: #FBEAEA;
  --accent: #111111;      --nav: #111111;
  --radius-sm: 6px; --radius-md: 12px; --radius-lg: 20px; --radius-xl: 28px; --radius-full: 999px;
}
/* spaziatura: 4 / 8 / 16 / 24 / 32 / 48 */
```

**Decisione di stile (risolve l'incongruenza della vecchia versione):** pesi font **solo 400 e 500**; font di sistema (`system-ui`); h1 30/500, h2 22/500, h3 17/500, body 15/400 con interlinea 22, caption 12/400, label 11/500 maiuscolo con `letter-spacing .4px`. **Nessuna ombra** tranne modal/popup. Nessun gradiente.

- Card: radius 20, bordo 1 px `--border`, sfondo bianco. Chip/toggle a pillola, attivi pieni `#111` con testo bianco.
- Pulsante primario: nero, testo bianco, spinner durante il caricamento. Smash/Pass: tenui verde/rosso con bordo.
- Campi: sfondo `--surface`, bordo sottile, etichetta sopra, errore rosso sotto; password con mostra/nascondi.
- Pulsanti swipe: cerchi 60 px (Pass/Smash) e 46 px (info).
- Colori funzionali solo per Smash (verde) e Pass (rosso); tutto il resto scala di grigi.
- Layout **responsive**: contenuto swipe centrato con larghezza massima ~480 px; rispettare `prefers-reduced-motion`; contrasto AA; focus visibile; `aria-label` sui pulsanti a sola icona.

---

## 13. Funzionalità

### Fase 1 — DEMO (da completare)
- [ ] Registrazione con ruolo, login, logout, sessione persistente (senza verifica email)
- [ ] Pulsanti "Prova la demo" con account demo preconfigurati
- [ ] Onboarding proprietario (4 passi) e cercatore (5 passi) con selettore data nativo
- [ ] Upload foto con compressione su Supabase Storage
- [ ] Geocodifica indirizzo + pin trascinabile
- [ ] Feed swipe (trascinamento, pulsanti, tastiera) con Smash/Pass
- [ ] Filtri feed: città, budget massimo (cercatore), distanza
- [ ] Match bilaterale + MatchModal
- [ ] Mappa annunci con ricerca città
- [ ] Lista match + chat in tempo reale (typing, letto)
- [ ] Profilo, modifica completa, impostazioni, elimina account reale
- [ ] Pagine legali statiche; banner "Versione demo"
- [ ] Dati seed (≥ 20 profili per ruolo) e bot demo (auto-SMASH e risposte in chat)
- [ ] Stati loading / errore con "Riprova" / vuoto in ogni pagina
- [ ] Deploy gratuito su Cloudflare Pages + workflow keepalive

### Fase 2 — opzionale
- [ ] Password dimenticata (se si configura SMTP gratuito)
- [ ] Annulla ultimo swipe · percentuale di compatibilità · badge messaggi non letti
- [ ] Blocca / segnala utente · elimina match dalla chat
- [ ] Annuncio attivo/in pausa (il campo `is_active` esiste già)
- [ ] Riordino foto con drag&drop · PWA installabile (`vite-plugin-pwa`)

### Fuori dalla demo
Notifiche push ed email, verifica email via OTP, videochiamata, boost/Super Smash, dashboard analytics, i18n, scadenza annunci con job periodici, coda messaggi offline, app native, pagamenti.

---

## 14. Variabili d'ambiente

`.env.example` (frontend — **le chiavi `VITE_*` sono pubbliche per natura**; la sicurezza è in RLS):
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_DEMO_MODE=true
VITE_DEMO_SEEKER_EMAIL=demo.cercatore@matchhouse.demo
VITE_DEMO_SEEKER_PASSWORD=...
VITE_DEMO_LANDLORD_EMAIL=demo.proprietario@matchhouse.demo
VITE_DEMO_LANDLORD_PASSWORD=...
```
`.env.seed` (solo locale, **mai committato, mai nel frontend**): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 15. Sicurezza — checklist obbligatoria

- RLS attiva su **tutte** le tabelle; nessuna scrittura diretta su `swipes`, `matches` (solo delete), ruolo immutabile.
- La **service_role key** non compare mai nel codice frontend né nel repository.
- Validazione: zod lato client + vincoli CHECK nel database (lunghezze, intervalli, 18+).
- Nessun `dangerouslySetInnerHTML`; testi utente sempre come testo (anche nei popup della mappa).
- Upload: MIME whitelist e limite 5 MB nel bucket; scrittura solo nella cartella `{uid}/`; limite foto per ruolo via trigger.
- Rate limit swipe (60/min) nella funzione `swipe`; limiti auth integrati in Supabase (mappare l'errore in "Troppi tentativi, riprova tra 15 minuti.").
- L'email non è mai esposta: non esiste nelle tabelle pubbliche.
- Header di sicurezza opzionali via file `public/_headers` (CSP che consenta Supabase, OSM tile e Nominatim).
- Banner demo: "Non inserire dati personali reali sensibili".
- Nessun log di password/token.

---

## 16. Seed e modalità demo

- `scripts/seed.ts` (Node, esegue in locale con service_role): crea con `auth.admin.createUser({ email_confirm: true, user_metadata: { user_type } })` almeno **20 proprietari** e **20 cercatori** italiani realistici (Milano, Roma, Torino, Bologna, Firenze, Napoli; coordinate reali con piccola variazione), imposta `is_demo = true`, inserisce i profili e le righe `photos` con URL esterni stabili (ritratti `randomuser.me`; interni da immagini libere Unsplash/Pexels o file in `public/seed/`). Le foto seed **non** occupano Storage.
- Crea inoltre due account di prova (`is_demo = false`): un proprietario e un cercatore, con profilo completo, usati dal pulsante "Prova la demo".
- Comportamento demo: i profili `is_demo` ricambiano lo SMASH nel ~70% dei casi e rispondono in chat; "Ricomincia la demo" (Impostazioni) azzera swipe e match dell'utente.
- Lo script deve essere **idempotente** (ri-eseguibile senza duplicati).

---

## 17. Deploy gratuito

1. Crea un progetto **Supabase** (piano Free), esegui `supabase/schema.sql`, disattiva "Confirm email", copia URL e anon key.
2. Esegui il seed in locale: `npm run seed`.
3. Pubblica il repository su **GitHub**.
4. **Cloudflare Pages** → collega il repo → build `npm run build` → output `dist` → imposta le variabili `VITE_*`. Il file `public/_redirects` garantisce il fallback SPA.
5. In Supabase → Authentication → URL Configuration: imposta Site URL e Redirect URL con l'indirizzo `*.pages.dev`.
6. Aggiungi i secret `SUPABASE_URL` e `SUPABASE_ANON_KEY` su GitHub e attiva `.github/workflows/keepalive.yml` (cron ogni 3 giorni, una richiesta REST con la anon key; ricorda che GitHub sospende i cron dopo ~60 giorni di inattività del repo pubblico).
7. Nessun dominio a pagamento: si usa l'indirizzo `*.pages.dev`.

---

## 18. Istruzioni per lo sviluppo

1. **Inizia dal database**: applica `schema.sql`, genera i tipi TypeScript, crea e lancia il seed; verifica le RLS con due utenti diversi prima di scrivere la UI.
2. **Poi lo scheletro**: Vite + Tailwind + token, router, guard di sessione, Welcome / Login / Register.
3. **Poi l'onboarding** (con geocodifica e upload foto), quindi **Esplora + swipe + match**, poi **chat realtime**, poi **mappa**, profilo e impostazioni.
4. **TypeScript strict** ovunque, nessun `any`; usa i tipi generati da Supabase e un file `domain.ts` per i tipi del feed.
5. **Tre stati sempre**: ogni pagina con dati ha skeleton, errore con "Riprova", stato vuoto con messaggio e azione.
6. **Swipe fluido** (60 fps): niente re-render per frame (usa i motion value di Framer Motion); testa su telefono reale e su desktop (mouse + tastiera).
7. Carica la pagina mappa con `React.lazy` per tenere leggero il bundle iniziale.
8. Mantieni la demo **a costo zero**: se una scelta richiede un servizio a pagamento o una carta, scegli l'alternativa gratuita e segnalalo.
9. Aggiorna `README.md` (setup, deploy, account demo) a ogni modifica rilevante.
