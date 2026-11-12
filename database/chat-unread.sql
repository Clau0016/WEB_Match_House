begin;

alter table public.mh_contacts add column if not exists read_at timestamptz;
create index if not exists mh_contacts_unread
  on public.mh_contacts (recipient_id, sender_id) where read_at is null;

create or replace function public.mh_chat_mark_read(person uuid, message_ids uuid[])
returns void language sql security definer set search_path = ''
as $$
  update public.mh_contacts
  set read_at = now()
  where public.mh_enabled() and recipient_id = auth.uid() and sender_id = person
    and read_at is null and id = any(message_ids);
$$;

create or replace function public.mh_chat_unread_count()
returns bigint language sql stable set search_path = ''
as $$
  select count(*) from public.mh_contacts
  where recipient_id = auth.uid() and read_at is null;
$$;

create or replace function public.mh_chat_inbox_with_unread()
returns table (person uuid, name text, updated_at timestamptz, preview text, unread bigint)
language sql stable set search_path = ''
as $$
  select inbox.*, coalesce(unread.total, 0)
  from public.mh_chat_inbox() inbox
  left join (
    select sender_id, count(*) as total from public.mh_contacts
    where recipient_id = auth.uid() and read_at is null group by sender_id
  ) unread on unread.sender_id = inbox.person
  order by inbox.updated_at desc, inbox.person;
$$;

revoke execute on function public.mh_chat_mark_read(uuid,uuid[]),
  public.mh_chat_unread_count(), public.mh_chat_inbox_with_unread() from public, anon;
grant execute on function public.mh_chat_mark_read(uuid,uuid[]),
  public.mh_chat_unread_count(), public.mh_chat_inbox_with_unread() to authenticated;

commit;
