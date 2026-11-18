-- Rulează o singură dată în Supabase > SQL Editor (pentru cheltuieli generale)
create table if not exists expenses(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  vehicle_id uuid not null references vehicles on delete cascade,
  date date not null default current_date,
  category text not null, amount numeric(10,2) not null, note text,
  created_at timestamptz default now());
alter table expenses enable row level security;
create policy "own_expenses" on expenses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
