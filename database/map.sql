begin;

create or replace function public.mh_map_roommate_zones()
returns table (city text, area text, seekers bigint)
language sql stable security definer set search_path = ''
as $$
  with cities as (
    select unnest(array['Milano','Brescia','Bergamo','Pavia','Torino','Aosta','Genova','Bologna','Modena',
      'Parma','Ferrara','Rimini','Venezia','Padova','Verona','Trento','Bolzano','Trieste','Udine','Firenze',
      'Pisa','Siena','Perugia','Ancona','Urbino','Roma','Latina','Pescara','L’Aquila','Campobasso','Napoli',
      'Salerno','Bari','Lecce','Potenza','Catanzaro','Cosenza','Palermo','Catania','Messina','Cagliari','Sassari']) as name
  ), zones(city, area) as (
    values ('Milano','Città Studi'), ('Bologna','Bolognina'), ('Torino','San Salvario'), ('Roma','Pigneto')
  )
  select cities.name, coalesce(zones.area, ''), count(*)
  from public.mh_questionnaires q
  join public.mh_members m on m.user_id = q.user_id
  join auth.users u on u.id = q.user_id
  join cities on lower(trim(q.answers->>'city')) = lower(cities.name)
  left join zones on zones.city = cities.name and lower(trim(q.answers->>'area')) = lower(zones.area)
  where q.completed and q.visible and m.active and u.email_confirmed_at is not null
    and q.user_id is distinct from auth.uid()
    and (
      (q.user_id in ('d34d0000-0000-4000-8000-000000000001','d34d0000-0000-4000-8000-000000000002','d34d0000-0000-4000-8000-000000000003'))
      or (public.mh_enabled() and q.answers->>'show_on_map' = 'true')
    )
  group by cities.name, zones.area
  order by 1, 2;
$$;

revoke execute on function public.mh_map_roommate_zones() from public;
grant execute on function public.mh_map_roommate_zones() to anon, authenticated;

commit;
