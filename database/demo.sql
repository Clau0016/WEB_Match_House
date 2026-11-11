begin;

-- Reserved demo identities have no password and no deliverable email address.
insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, banned_until, created_at, updated_at)
values
  ('d34d0000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'giulia@match-house.invalid', now(), '{}', '{"first_name":"Giulia (demo)"}', 'infinity', now(), now()),
  ('d34d0000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'samuele@match-house.invalid', now(), '{}', '{"first_name":"Samuele (demo)"}', 'infinity', now(), now()),
  ('d34d0000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'elena@match-house.invalid', now(), '{}', '{"first_name":"Elena (demo)"}', 'infinity', now(), now())
on conflict (id) do nothing;

alter table public.mh_listings drop constraint mh_listings_status_check;
alter table public.mh_listings add constraint mh_listings_status_check
  check (status in ('draft','pending','approved','rejected','inactive','demo'));

create or replace view public.mh_public_listings with (security_barrier = true) as
select l.id, l.title, l.city, l.area, l.address, l.type, l.rent, l.size, l.rooms, l.roommates, l.available,
  l.amenities, l.details, l.photos, l.status, l.created_at
from public.mh_listings l join public.mh_members m on m.user_id = l.owner_id
where l.status in ('approved','demo') and m.active;

insert into public.mh_listings (id,owner_id,title,city,area,address,type,rent,size,rooms,roommates,available,amenities,details,photos,status)
select d.id::uuid, 'd34d0000-0000-4000-8000-000000000001', d.title, d.city, d.area, 'Indirizzo dimostrativo', d.type, d.rent, d.size,
       d.rooms, d.roommates, current_date, d.amenities,
       jsonb_build_object('description','Annuncio fittizio per provare ricerca e filtri. Prezzo indicativo.'),
       array['d34d0000-0000-4000-8000-000000000001/' || d.photo], 'demo'
from (values
  ('d34d1000-0000-4000-8000-000000000001','Camera luminosa vicino al Politecnico','Milano','Città Studi','Stanza singola',650,16,1,2,array['Wi-Fi','Scrivania','Lavatrice'],'room-2.jpg'),
  ('d34d1000-0000-4000-8000-000000000002','Stanza con scrivania in appartamento condiviso','Bologna','Bolognina','Stanza singola',490,14,1,1,array['Wi-Fi','Scrivania','Riscaldamento'],'room-4.jpg'),
  ('d34d1000-0000-4000-8000-000000000003','Bilocale arredato a San Salvario','Torino','San Salvario','Appartamento',820,54,2,0,array['Lavatrice','Riscaldamento'],'room-6.jpg'),
  ('d34d1000-0000-4000-8000-000000000004','Camera doppia con balcone','Roma','Pigneto','Stanza doppia',540,22,1,2,array['Wi-Fi','Scrivania'],'room-8.jpg')
) as d(id,title,city,area,type,rent,size,rooms,roommates,amenities,photo)
on conflict (id) do nothing;

insert into public.mh_questionnaires (user_id,answers,step,completed,visible,show_details,photo)
select d.id::uuid, jsonb_build_object(
  'age',d.age::text,'city',d.city,'job',d.job,'languages','Italiano, inglese','schedule',d.schedule,
  'home','Principalmente la sera','remote','Alcuni giorni','clean','4','noise','2','chores','Turni organizzati','social','Un equilibrio tra le due',
  'guests','Qualche volta','smoke','No','pets','No','sports','Abbastanza','interests',to_jsonb(d.interests),
  'minimum',d.minimum::text,'maximum',d.maximum::text,'move',current_date::text,'stay','Da 6 a 12 mesi',
  'bio',d.bio,'area',d.area
), 23, true, true, true, d.id || '/' || d.photo
from (values
  ('d34d0000-0000-4000-8000-000000000001',24,'Milano','Studente','Mattiniero',480,720,array['Cucina','Lettura'],'Mi piace cucinare e tenere in ordine gli spazi condivisi. Cerco casa vicino all’università.','Città Studi','giulia.jpg'),
  ('d34d0000-0000-4000-8000-000000000002',29,'Bologna','Lavoratore','Flessibile',380,620,array['Sport','Cinema e serie TV'],'Lavoro in centro e nel tempo libero vado in bici. Cerco una casa tranquilla.','Bolognina','samuele.jpg'),
  ('d34d0000-0000-4000-8000-000000000003',27,'Torino','Lavoratore','Mattiniero',400,700,array['Musica','Cucina'],'Mi piace alternare cene insieme e serate tranquille. Cerco casa ben collegata.','San Salvario','elena.jpg')
) as d(id,age,city,job,schedule,minimum,maximum,interests,bio,area,photo)
on conflict (user_id) do nothing;

drop policy if exists mh_demo_no_contacts on public.mh_contacts;
create policy mh_demo_no_contacts on public.mh_contacts as restrictive for insert to authenticated
with check (recipient_id not in ('d34d0000-0000-4000-8000-000000000001','d34d0000-0000-4000-8000-000000000002','d34d0000-0000-4000-8000-000000000003'));

commit;
