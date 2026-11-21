-- 1. The free trial now runs in Stripe (card required), so the app-side trial date goes away.
--    Nothing in the code reads it any more.
alter table public.organization_billing drop column trial_ends_at;

-- 2. Google / Microsoft sign-ups: the name can arrive as `name` instead of `full_name`,
--    and the email may be missing. Fall back instead of failing the sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      new.raw_user_meta_data ->> 'name',
      ''
    ), 120),
    coalesce(new.email, '')
  );
  return new;
end;
$$;
