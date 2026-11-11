begin;

create table public.mh_members (
  user_id uuid primary key references auth.users on delete cascade,
  name text not null,
  active boolean not null default true
);
create table public.mh_admins (
  user_id uuid primary key references auth.users on delete cascade
);
create function public.mh_enabled() returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from auth.users u left join public.mh_members m on m.user_id = u.id
  where u.id = auth.uid() and u.email_confirmed_at is not null and coalesce(m.active,true)) $$;
create function public.mh_is_admin() returns boolean language sql stable security definer set search_path = ''
as $$ select public.mh_enabled() and exists(select 1 from public.mh_admins where user_id = auth.uid()) $$;
create function public.mh_sync_member() returns trigger language plpgsql security definer set search_path = ''
as $$ begin
  insert into public.mh_members(user_id,name) values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'first_name'),''),'Utente'))
  on conflict(user_id) do update set name = excluded.name;
  return new;
end $$;
create trigger mh_sync_member after insert or update of raw_user_meta_data on auth.users for each row execute function public.mh_sync_member();
insert into public.mh_members(user_id,name)
select id,coalesce(nullif(trim(raw_user_meta_data->>'first_name'),''),'Utente') from auth.users;

create function public.mh_owned_paths(owner uuid, paths text[]) returns boolean
language sql immutable set search_path = ''
as $$ select not exists(select 1 from unnest(paths) path where path is null or split_part(path,'/',1) <> owner::text) $$;

create table public.mh_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  city text not null default '', area text not null default '', address text not null default '',
  type text not null check(type in ('Stanza singola','Stanza doppia','Appartamento')),
  rent numeric not null default 0 check(rent >= 0), size numeric not null default 0 check(size >= 0),
  rooms integer not null default 0 check(rooms >= 0), roommates integer not null default 0 check(roommates >= 0),
  available date, amenities text[] not null default '{}',
  details jsonb not null default '{}',
  photos text[] not null default '{}' check(cardinality(photos) <= 12),
  documents text[] not null default '{}' check(cardinality(documents) <= 8),
  check(public.mh_owned_paths(owner_id,photos) and public.mh_owned_paths(owner_id,documents)),
  status text not null default 'draft' check(status in ('draft','pending','approved','rejected','inactive')),
  review_note text,
  constraint mh_submission_complete check(status not in ('pending','approved') or
    (length(trim(city)) > 0 and length(trim(area)) > 0 and length(trim(address)) > 0 and rent > 0 and size > 0
     and rooms > 0 and available is not null and cardinality(photos) > 0 and cardinality(documents) > 0
     and details ?& array['floor','bathrooms','fees','deposit','contract','duration','registered','pets','smoking','guests']
     and not (details @> '{"floor":""}' or details @> '{"contract":""}' or details @> '{"duration":""}')))
);
create index mh_listings_owner on public.mh_listings(owner_id);
create view public.mh_public_listings with (security_barrier = true) as
select l.id, l.title, l.city, l.area, l.address, l.type, l.rent, l.size, l.rooms, l.roommates, l.available,
  l.amenities, l.details, l.photos, l.status, l.created_at
from public.mh_listings l join public.mh_members m on m.user_id = l.owner_id
where l.status = 'approved' and m.active;

create table public.mh_questionnaires (
  user_id uuid primary key references auth.users on delete cascade,
  answers jsonb not null default '{}' check(jsonb_typeof(answers) = 'object'),
  step integer not null default 0 check(step between 0 and 23),
  completed boolean not null default false,
  visible boolean not null default false check(not visible or completed),
  show_details boolean not null default false,
  photo text,
  check(photo is null or public.mh_owned_paths(user_id,array[photo])),
  constraint mh_completed_answers check(not completed or coalesce(
    step = 23 and answers ?& array['age','city','job','languages','schedule','home','remote','clean','noise','chores','social','guests','smoke','pets','sports','interests','minimum','maximum','move','stay','bio']
    and answers->>'age' ~ '^(1[89]|[2-9][0-9]|1[01][0-9]|120)$'
    and answers->>'minimum' ~ '^[0-9]{1,6}$' and answers->>'maximum' ~ '^[0-9]{1,6}$'
    and (answers->>'minimum')::int <= (answers->>'maximum')::int
    and answers->>'clean' ~ '^[1-5]$' and answers->>'noise' ~ '^[1-5]$'
    and (answers->>'move')::date is not null
    and jsonb_typeof(answers->'interests') = 'array'
    and char_length(trim(answers->>'bio')) between 1 and 1200
    and char_length(trim(answers->>'city')) between 1 and 120, false))
);

create table public.mh_saved (
  user_id uuid references auth.users on delete cascade,
  listing_id uuid references public.mh_listings on delete cascade,
  primary key(user_id,listing_id)
);
create table public.mh_contacts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users on delete cascade,
  recipient_id uuid not null references auth.users on delete cascade check(recipient_id <> sender_id),
  message text not null check(char_length(trim(message)) between 1 and 1000),
  created_at timestamptz not null default now(),
  unique(sender_id,recipient_id)
);
create table public.mh_finance_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  city text not null check(char_length(trim(city)) between 1 and 100),
  message text not null check(char_length(trim(message)) between 1 and 1500),
  created_at timestamptz not null default now()
);
create table public.mh_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users on delete cascade,
  listing_id uuid references public.mh_listings on delete cascade,
  profile_id uuid references auth.users on delete cascade,
  reason text not null check(char_length(trim(reason)) between 1 and 1000),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  check(num_nonnulls(listing_id,profile_id) = 1)
);

create function public.mh_roommate_available(person uuid) returns boolean language sql stable security definer set search_path = ''
as $$ select public.mh_enabled() and exists(
  select 1 from public.mh_questionnaires q join public.mh_members m using(user_id)
  join auth.users u on u.id=q.user_id where q.user_id=person and q.completed and q.visible and m.active and u.email_confirmed_at is not null) $$;

create function public.mh_rank_roommates(target uuid default null)
returns table(user_id uuid, name text, answers jsonb, photo text, show_details boolean, score int)
language plpgsql stable security definer set search_path = '' as $$
declare mine jsonb;
begin
  if not public.mh_enabled() then raise exception 'Serve un account attivo con email verificata.'; end if;
  select q.answers into mine from public.mh_questionnaires q where q.user_id=auth.uid() and q.completed;
  if mine is null then raise exception 'Completa il questionario per vedere i risultati.'; end if;
  return query
    select q.user_id, m.name,
      (select jsonb_object_agg(key,value) from jsonb_each(q.answers)
       where key = any(array['age','city','job','bio','minimum','maximum','move'])
        or (target is not null and q.show_details and key <> 'organization')),
      q.photo, q.show_details,
      round(
        25 * (lower(trim(mine->>'city')) = lower(trim(q.answers->>'city')))::int +
        23 * ((mine->>'minimum')::int <= (q.answers->>'maximum')::int and (q.answers->>'minimum')::int <= (mine->>'maximum')::int)::int +
        12 * greatest(0, 1 - abs((mine->>'move')::date - (q.answers->>'move')::date) / 90.0) +
        case when mine->>'schedule'=q.answers->>'schedule' then 6 when 'Flessibile' in (mine->>'schedule',q.answers->>'schedule') then 4.5 else 0 end +
        6 * (1 - abs((mine->>'clean')::int - (q.answers->>'clean')::int) / 4.0) +
        5 * (1 - abs((mine->>'noise')::int - (q.answers->>'noise')::int) / 4.0) +
        5 * coalesce((mine->>'social'=q.answers->>'social')::int,0) +
        5 * coalesce((mine->>'smoke'=q.answers->>'smoke')::int,0) +
        4 * coalesce((mine->>'pets'=q.answers->>'pets')::int,0) +
        coalesce(4.0 * (select count(distinct item) from jsonb_array_elements_text(mine->'interests') as a(item) where (q.answers->'interests') ? item)
          / nullif((select count(distinct item) from jsonb_array_elements_text((mine->'interests') || (q.answers->'interests')) as all_interests(item)),0),0) +
        2 * coalesce((lower(trim(mine->>'area'))=lower(trim(q.answers->>'area')))::int,0) +
        coalesce((mine->>'guests'=q.answers->>'guests')::int,0) +
        coalesce((mine->>'chores'=q.answers->>'chores')::int,0) +
        coalesce((mine->>'stay'=q.answers->>'stay')::int,0)
      )::int
    from public.mh_questionnaires q join public.mh_members m using(user_id) join auth.users u on u.id=q.user_id
    where q.user_id<>auth.uid() and q.completed and q.visible and m.active and u.email_confirmed_at is not null
      and (target is null or q.user_id=target)
    order by 6 desc nulls last, 1;
end $$;

create function public.mh_delete_account() returns void language plpgsql security definer set search_path = ''
as $$ begin
  if auth.uid() is null then raise exception 'Accedi per continuare.'; end if;
  delete from auth.users where id=auth.uid();
end $$;

alter table public.mh_members enable row level security;
alter table public.mh_admins enable row level security;
alter table public.mh_listings enable row level security;
alter table public.mh_questionnaires enable row level security;
alter table public.mh_saved enable row level security;
alter table public.mh_contacts enable row level security;
alter table public.mh_finance_requests enable row level security;
alter table public.mh_reports enable row level security;

create policy mh_members_read on public.mh_members for select to authenticated using(user_id=auth.uid() or public.mh_is_admin());
create policy mh_members_admin on public.mh_members for update to authenticated using(public.mh_is_admin()) with check(public.mh_is_admin());
create policy mh_listing_read on public.mh_listings for select to authenticated using(owner_id=auth.uid() or public.mh_is_admin());
create policy mh_listing_insert on public.mh_listings for insert to authenticated with check(public.mh_enabled() and owner_id=auth.uid() and status in ('draft','pending'));
create policy mh_listing_update on public.mh_listings for update to authenticated
  using(owner_id=auth.uid() and public.mh_enabled() or public.mh_is_admin())
  with check(owner_id=auth.uid() and public.mh_enabled() and status in ('draft','pending','inactive') or public.mh_is_admin());
create function public.mh_listing_protect() returns trigger language plpgsql set search_path = ''
as $$ begin
  if new.owner_id is distinct from old.owner_id or new.id is distinct from old.id then raise exception 'Identificativo immutabile.'; end if;
  if not public.mh_is_admin() and new.review_note is distinct from old.review_note then raise exception 'Nota riservata alla moderazione.'; end if;
  return new;
end $$;
create trigger mh_listing_protect before update on public.mh_listings for each row execute function public.mh_listing_protect();
create policy mh_questionnaire_read on public.mh_questionnaires for select to authenticated using(user_id=auth.uid());
create policy mh_questionnaire_insert on public.mh_questionnaires for insert to authenticated with check(user_id=auth.uid() and public.mh_enabled());
create policy mh_questionnaire_update on public.mh_questionnaires for update to authenticated using(user_id=auth.uid() and public.mh_enabled()) with check(user_id=auth.uid() and public.mh_enabled());
create policy mh_saved_read on public.mh_saved for select to authenticated using(user_id=auth.uid());
create policy mh_saved_insert on public.mh_saved for insert to authenticated with check(user_id=auth.uid() and public.mh_enabled() and exists(select 1 from public.mh_public_listings l where l.id=listing_id));
create policy mh_saved_delete on public.mh_saved for delete to authenticated using(user_id=auth.uid());
create policy mh_contact_read on public.mh_contacts for select to authenticated using(public.mh_enabled() and auth.uid() in (sender_id,recipient_id));
create policy mh_contact_insert on public.mh_contacts for insert to authenticated with check(sender_id=auth.uid() and public.mh_roommate_available(recipient_id));
create policy mh_finance_read on public.mh_finance_requests for select to authenticated using(user_id=auth.uid() or public.mh_is_admin());
create policy mh_finance_insert on public.mh_finance_requests for insert to authenticated with check(user_id=auth.uid() and public.mh_enabled());
create policy mh_report_read on public.mh_reports for select to authenticated using(reporter_id=auth.uid() or public.mh_is_admin());
create policy mh_report_insert on public.mh_reports for insert to authenticated with check(reporter_id=auth.uid() and public.mh_enabled() and
  (exists(select 1 from public.mh_public_listings l where l.id=listing_id) or public.mh_roommate_available(profile_id)));
create policy mh_report_update on public.mh_reports for update to authenticated using(public.mh_is_admin()) with check(public.mh_is_admin());

revoke all on public.mh_members,public.mh_admins,public.mh_listings,public.mh_questionnaires,public.mh_saved,public.mh_contacts,
 public.mh_finance_requests,public.mh_reports,public.mh_public_listings from anon,authenticated;
grant select on public.mh_public_listings to anon,authenticated;
grant select on public.mh_members to authenticated;
grant update(active) on public.mh_members to authenticated;
grant select,insert,update on public.mh_listings,public.mh_questionnaires to authenticated;
grant select,insert,delete on public.mh_saved to authenticated;
grant select,insert on public.mh_contacts,public.mh_finance_requests,public.mh_reports to authenticated;
grant update(resolved) on public.mh_reports to authenticated;
revoke execute on function public.mh_enabled(),public.mh_is_admin(),public.mh_roommate_available(uuid),
 public.mh_rank_roommates(uuid),public.mh_delete_account(),public.mh_sync_member(),public.mh_listing_protect() from public,anon;
grant execute on function public.mh_enabled(),public.mh_is_admin(),public.mh_roommate_available(uuid),
 public.mh_rank_roommates(uuid),public.mh_delete_account() to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('mh-photos','mh-photos',false,8388608,array['image/jpeg','image/png','image/webp']),
 ('mh-documents','mh-documents',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp']);
create function public.mh_can_view_photo(path text) returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.mh_public_listings l where path = any(l.photos))
  or exists(select 1 from public.mh_questionnaires q where q.photo=path and public.mh_roommate_available(q.user_id)) $$;
revoke execute on function public.mh_can_view_photo(text) from public;
grant execute on function public.mh_can_view_photo(text) to anon,authenticated;
create policy mh_media_public on storage.objects for select to anon,authenticated using(bucket_id='mh-photos' and public.mh_can_view_photo(name));
create policy mh_media_owner on storage.objects for select to authenticated using(
  bucket_id in ('mh-photos','mh-documents') and ((storage.foldername(name))[1]=auth.uid()::text or public.mh_is_admin()));
create policy mh_media_upload on storage.objects for insert to authenticated with check(
  bucket_id in ('mh-photos','mh-documents') and public.mh_enabled() and (storage.foldername(name))[1]=auth.uid()::text);
create policy mh_media_remove on storage.objects for delete to authenticated using(
  bucket_id in ('mh-photos','mh-documents') and (storage.foldername(name))[1]=auth.uid()::text);

commit;
