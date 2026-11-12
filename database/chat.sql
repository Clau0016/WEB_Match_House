begin;

create table if not exists public.mh_chats (
  first_user uuid references auth.users on delete cascade,
  second_user uuid references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (first_user, second_user),
  check (first_user < second_user)
);

insert into public.mh_chats (first_user, second_user, created_at)
select least(sender_id, recipient_id), greatest(sender_id, recipient_id), min(created_at)
from public.mh_contacts group by 1, 2 on conflict do nothing;

alter table public.mh_contacts drop constraint if exists mh_contacts_sender_id_recipient_id_key;
create index if not exists mh_contacts_pair_time on public.mh_contacts (sender_id, recipient_id, created_at, id);
create index if not exists mh_chats_second_user on public.mh_chats (second_user);
alter table public.mh_chats enable row level security;
revoke all on public.mh_chats from anon, authenticated;
grant select on public.mh_chats to authenticated;
drop policy if exists mh_chats_read on public.mh_chats;
create policy mh_chats_read on public.mh_chats for select to authenticated
using (public.mh_enabled() and auth.uid() in (first_user, second_user));

create or replace function public.mh_chat_target_active(person uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from auth.users u join public.mh_members m on m.user_id = u.id
  where u.id = person and u.email_confirmed_at is not null and m.active
    and (u.banned_until is null or u.banned_until <= now())
) $$;

create or replace function public.mh_open_chat(person uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.mh_enabled() or person is null or person = auth.uid() then
    raise exception 'Conversazione non disponibile.';
  end if;
  if exists (select 1 from public.mh_chats
    where first_user = least(auth.uid(), person) and second_user = greatest(auth.uid(), person)) then
    return;
  end if;
  if not public.mh_roommate_available(person) or not public.mh_chat_target_active(person)
     or not exists (select 1 from public.mh_rank_roommates(person)) then
    raise exception 'Profilo non disponibile per la chat.';
  end if;
  insert into public.mh_chats (first_user, second_user)
  values (least(auth.uid(), person), greatest(auth.uid(), person)) on conflict do nothing;
end $$;

create or replace function public.mh_chat_name(person uuid)
returns text language sql stable security definer set search_path = ''
as $$
  select m.name from public.mh_members m
  where m.user_id = person and public.mh_enabled() and exists (
    select 1 from public.mh_chats c
    where c.first_user = least(auth.uid(), person) and c.second_user = greatest(auth.uid(), person)
  )
$$;

create or replace function public.mh_chat_inbox()
returns table (person uuid, name text, updated_at timestamptz, preview text)
language sql stable set search_path = ''
as $$
  select peers.person, coalesce(names.name, 'Coinquilino'),
         coalesce(last_message.created_at, chats.created_at), last_message.message
  from public.mh_chats chats
  cross join lateral (select case when chats.first_user = auth.uid()
    then chats.second_user else chats.first_user end as person) peers
  left join lateral (
    select c.created_at, c.message from public.mh_contacts c
    where (c.sender_id = auth.uid() and c.recipient_id = peers.person)
       or (c.sender_id = peers.person and c.recipient_id = auth.uid())
    order by c.created_at desc, c.id desc limit 1
  ) last_message on true
  left join lateral (select public.mh_chat_name(peers.person) as name) names on true
  order by 3 desc, 1
$$;

create or replace function public.mh_chat_can_send(person uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.mh_enabled() and public.mh_chat_target_active(person)
  and exists (select 1 from public.mh_chats
    where first_user = least(auth.uid(), person) and second_user = greatest(auth.uid(), person))
$$;

drop policy if exists mh_contact_insert on public.mh_contacts;
create policy mh_contact_insert on public.mh_contacts for insert to authenticated
with check (sender_id = auth.uid() and public.mh_chat_can_send(recipient_id));
revoke insert on public.mh_contacts from authenticated;
grant insert (sender_id, recipient_id, message) on public.mh_contacts to authenticated;

revoke execute on function public.mh_chat_target_active(uuid), public.mh_open_chat(uuid),
  public.mh_chat_name(uuid), public.mh_chat_inbox(), public.mh_chat_can_send(uuid) from public, anon;
grant execute on function public.mh_open_chat(uuid), public.mh_chat_name(uuid),
  public.mh_chat_inbox(), public.mh_chat_can_send(uuid) to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
    and schemaname = 'public' and tablename = 'mh_contacts') then
    alter publication supabase_realtime add table public.mh_contacts;
  end if;
end $$;

commit;
