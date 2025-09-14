-- Auto-grant welcome credits for new users
-- This ensures new users always get their 3 welcome credits

-- Create a function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Grant welcome credits to new user
  insert into public.user_credits (user_id, balance)
  values (new.id, 3)
  on conflict (user_id) do nothing;

  -- Log the welcome credits in ledger
  insert into public.credit_ledger (user_id, delta, reason)
  values (new.id, 3, 'welcome')
  on conflict do nothing;

  return new;
end;
$$;

-- Create trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Grant necessary permissions
grant execute on function public.handle_new_user() to service_role;
