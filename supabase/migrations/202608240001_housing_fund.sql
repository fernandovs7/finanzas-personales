create table public.housing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  label text not null check (length(trim(label)) > 0),
  monthly_amount_crc numeric(16, 2) not null check (monthly_amount_crc >= 0),
  destination_account text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, id),
  unique (user_id, client_id)
);

create table public.housing_fortnight_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  period date not null,
  fortnight public.fortnight_code not null,
  owner_contributed boolean not null default false,
  partner_contributed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id),
  unique (user_id, period, fortnight),
  constraint housing_status_period_starts_month check (
    period = date_trunc('month', period)::date
  )
);

create table public.housing_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  housing_item_id uuid not null,
  period date not null,
  fortnight public.fortnight_code not null,
  completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id),
  unique (user_id, housing_item_id, period, fortnight),
  constraint housing_transfer_period_starts_month check (
    period = date_trunc('month', period)::date
  ),
  constraint housing_transfer_item_owner
    foreign key (user_id, housing_item_id)
    references public.housing_items(user_id, id) on delete cascade
);

create index housing_items_user_active_idx
  on public.housing_items(user_id, active, sort_order);
create index housing_statuses_user_period_idx
  on public.housing_fortnight_statuses(user_id, period, fortnight);
create index housing_transfers_user_period_idx
  on public.housing_transfers(user_id, period, fortnight);

create trigger housing_items_set_updated_at before update on public.housing_items
for each row execute function public.set_updated_at();
create trigger housing_statuses_set_updated_at before update on public.housing_fortnight_statuses
for each row execute function public.set_updated_at();
create trigger housing_transfers_set_updated_at before update on public.housing_transfers
for each row execute function public.set_updated_at();

alter table public.housing_items enable row level security;
alter table public.housing_fortnight_statuses enable row level security;
alter table public.housing_transfers enable row level security;

create policy "Users manage their own housing items" on public.housing_items
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users manage their own housing statuses" on public.housing_fortnight_statuses
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users manage their own housing transfers" on public.housing_transfers
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on table
  public.housing_items,
  public.housing_fortnight_statuses,
  public.housing_transfers
to authenticated;

with eligible_users as (
  select distinct user_id
  from public.fixed_expenses
  where lower(trim(label)) = 'fabi y yo - vivienda'
),
default_items(label, monthly_amount_crc, destination_account, sort_order) as (
  values
    ('Cable, Internet, Medidor', 38470.00, 'Servicios vivienda', 1),
    ('Diario', 125000.00, 'Alimentación', 2),
    ('Fondo de emergencia', 10000.00, 'Fondo de emergencia', 3),
    ('Entretenimiento', 100000.00, 'Entretenimiento', 4),
    ('Gasolina', 145000.00, 'Transporte', 5),
    ('Peajes', 32240.00, 'Transporte', 6),
    ('Ahorro para casa', 110000.00, 'Ahorro casa', 7),
    ('Pago de Luz Doña Gaby', 70000.00, 'Servicios vivienda', 8)
)
insert into public.housing_items (
  user_id,
  client_id,
  label,
  monthly_amount_crc,
  destination_account,
  sort_order
)
select
  eligible_users.user_id,
  gen_random_uuid(),
  default_items.label,
  default_items.monthly_amount_crc,
  default_items.destination_account,
  default_items.sort_order
from eligible_users
cross join default_items
where not exists (
  select 1
  from public.housing_items existing
  where existing.user_id = eligible_users.user_id
    and lower(existing.label) = lower(default_items.label)
);
