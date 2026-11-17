create extension if not exists "pgcrypto";
create table vehicles(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  brand text, model text, year int, vin text, odometer int default 0,
  powertrain text not null check (powertrain in ('Benzină','Diesel','GPL','Hibrid','PHEV','Electric')),
  body text default 'Sedan' check (body in ('Sedan','SUV','Hatchback','Break','Coupe','Pickup')),
  color text default '#35507a', monthly_km int default 1200, style int default 1,
  image_url text, model_url text, created_at timestamptz default now());
create table vehicle_parts(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  vehicle_id uuid not null references vehicles on delete cascade,
  name text not null, category text, hot text, life_km int, life_months int,
  last_odo int default 0, last_date date default current_date, created_at timestamptz default now());
create table maintenance_logs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  vehicle_id uuid not null references vehicles on delete cascade,
  part_name text not null, category text, brand_oem text, date date not null default current_date,
  odometer int, part_cost numeric(10,2) default 0, labor_cost numeric(10,2) default 0,
  notes text, receipt_url text, created_at timestamptz default now());
create table fuel_logs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  vehicle_id uuid not null references vehicles on delete cascade,
  date date not null default current_date, odometer int,
  quantity numeric(8,2) not null, unit text check (unit in ('L','kWh')),
  price_per_unit numeric(8,3), total_cost numeric(10,2), station text, full_tank boolean default true,
  receipt_url text, created_at timestamptz default now());
create table documents(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  vehicle_id uuid not null references vehicles on delete cascade,
  type text check (type in ('ITP','RCA','CASCO','Rovinieta')),
  policy_number text, expires_on date not null, created_at timestamptz default now());
create table prices(
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  key text not null, price numeric not null, updated_at timestamptz default now(), created_at timestamptz default now(),
  primary key (user_id, key));
do $$ declare t text; begin
  foreach t in array array['vehicles','vehicle_parts','maintenance_logs','fuel_logs','documents','prices'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own_%1$s" on %1$I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop; end $$;
insert into storage.buckets(id,name,public) values ('media','media',false) on conflict do nothing;
create policy "media_own" on storage.objects for all to authenticated
  using (bucket_id='media' and (storage.foldername(name))[1]=auth.uid()::text)
  with check (bucket_id='media' and (storage.foldername(name))[1]=auth.uid()::text);
