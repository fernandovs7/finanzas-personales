create extension if not exists pgcrypto with schema extensions;

create type public.currency_code as enum ('CRC', 'USD');
create type public.fortnight_code as enum ('Q1', 'Q2');
create type public.planned_payment_kind as enum ('single', 'installment');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'es-CR',
  timezone text not null default 'America/Costa_Rica',
  selected_period date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint selected_period_starts_month check (
    selected_period is null or selected_period = date_trunc('month', selected_period)::date
  )
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, id),
  unique (user_id, client_id)
);

create unique index categories_user_name_unique
  on public.categories (user_id, lower(name));

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, id),
  unique (user_id, client_id)
);

create unique index payment_methods_user_name_unique
  on public.payment_methods (user_id, lower(name));

create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  paid_on date not null,
  total_usd numeric(16, 2) not null check (total_usd >= 0),
  exchange_rate numeric(12, 4) not null check (exchange_rate > 0),
  reserved_savings_usd numeric(16, 2) not null default 0 check (reserved_savings_usd >= 0),
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, id),
  unique (user_id, client_id)
);

create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  category_id uuid,
  label text not null check (length(trim(label)) > 0),
  amount numeric(16, 2) not null check (amount >= 0),
  currency public.currency_code not null,
  q1_percent numeric(5, 2) not null default 50 check (q1_percent between 0 and 100),
  q2_percent numeric(5, 2) not null default 50 check (q2_percent between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id),
  constraint fixed_expenses_distribution check (q1_percent + q2_percent = 100),
  constraint fixed_expenses_category_owner
    foreign key (user_id, category_id) references public.categories(user_id, id)
);

create table public.planned_payment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  category_id uuid,
  label text not null check (length(trim(label)) > 0),
  total_amount numeric(16, 2) not null check (total_amount >= 0),
  currency public.currency_code not null,
  installment_count integer not null check (installment_count > 0),
  starts_on date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, id),
  unique (user_id, client_id),
  constraint planned_payment_plans_category_owner
    foreign key (user_id, category_id) references public.categories(user_id, id)
);

create table public.planned_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  category_id uuid,
  plan_id uuid,
  due_on date not null,
  label text not null check (length(trim(label)) > 0),
  amount numeric(16, 2) not null check (amount >= 0),
  currency public.currency_code not null,
  kind public.planned_payment_kind not null default 'single',
  installment_number integer,
  installment_count integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id),
  constraint planned_payments_installments check (
    (kind = 'single' and installment_number is null and installment_count is null and plan_id is null)
    or
    (kind = 'installment' and installment_number > 0 and installment_count > 0 and installment_number <= installment_count and plan_id is not null)
  ),
  constraint planned_payments_category_owner
    foreign key (user_id, category_id) references public.categories(user_id, id),
  constraint planned_payments_plan_owner
    foreign key (user_id, plan_id) references public.planned_payment_plans(user_id, id) on delete cascade
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  category_id uuid,
  payment_method_id uuid,
  income_id uuid,
  spent_on date not null,
  label text not null check (length(trim(label)) > 0),
  amount numeric(16, 2) not null check (amount >= 0),
  currency public.currency_code not null default 'CRC',
  bag_fortnight public.fortnight_code,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id),
  constraint expenses_category_owner
    foreign key (user_id, category_id) references public.categories(user_id, id),
  constraint expenses_payment_method_owner
    foreign key (user_id, payment_method_id) references public.payment_methods(user_id, id),
  constraint expenses_income_owner
    foreign key (user_id, income_id) references public.incomes(user_id, id)
);

create table public.saving_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  starts_on date not null,
  target_amount numeric(16, 2) not null check (target_amount >= 0),
  currency public.currency_code not null,
  note text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, id),
  unique (user_id, client_id)
);

create table public.saving_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  saving_plan_id uuid,
  saved_on date not null,
  target_amount numeric(16, 2) not null default 0 check (target_amount >= 0),
  actual_amount numeric(16, 2) not null default 0 check (actual_amount >= 0),
  currency public.currency_code not null,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id),
  constraint saving_entries_plan_owner
    foreign key (user_id, saving_plan_id) references public.saving_plans(user_id, id)
);

create index categories_user_id_idx on public.categories(user_id);
create index payment_methods_user_id_idx on public.payment_methods(user_id);
create index incomes_user_paid_on_idx on public.incomes(user_id, paid_on desc);
create index fixed_expenses_user_active_idx on public.fixed_expenses(user_id, active);
create index planned_payment_plans_user_starts_on_idx on public.planned_payment_plans(user_id, starts_on);
create index planned_payments_user_due_on_idx on public.planned_payments(user_id, due_on);
create index expenses_user_spent_on_idx on public.expenses(user_id, spent_on desc);
create index saving_plans_user_active_idx on public.saving_plans(user_id, active);
create index saving_entries_user_saved_on_idx on public.saving_entries(user_id, saved_on desc);

create trigger user_settings_set_updated_at before update on public.user_settings
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger payment_methods_set_updated_at before update on public.payment_methods
for each row execute function public.set_updated_at();
create trigger incomes_set_updated_at before update on public.incomes
for each row execute function public.set_updated_at();
create trigger fixed_expenses_set_updated_at before update on public.fixed_expenses
for each row execute function public.set_updated_at();
create trigger planned_payment_plans_set_updated_at before update on public.planned_payment_plans
for each row execute function public.set_updated_at();
create trigger planned_payments_set_updated_at before update on public.planned_payments
for each row execute function public.set_updated_at();
create trigger expenses_set_updated_at before update on public.expenses
for each row execute function public.set_updated_at();
create trigger saving_plans_set_updated_at before update on public.saving_plans
for each row execute function public.set_updated_at();
create trigger saving_entries_set_updated_at before update on public.saving_entries
for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;
alter table public.categories enable row level security;
alter table public.payment_methods enable row level security;
alter table public.incomes enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.planned_payment_plans enable row level security;
alter table public.planned_payments enable row level security;
alter table public.expenses enable row level security;
alter table public.saving_plans enable row level security;
alter table public.saving_entries enable row level security;

create policy "Users manage their own settings" on public.user_settings
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users manage their own categories" on public.categories
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users manage their own payment methods" on public.payment_methods
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users manage their own incomes" on public.incomes
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users manage their own fixed expenses" on public.fixed_expenses
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users manage their own planned payment plans" on public.planned_payment_plans
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users manage their own planned payments" on public.planned_payments
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users manage their own expenses" on public.expenses
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users manage their own saving plans" on public.saving_plans
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users manage their own saving entries" on public.saving_entries
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.bootstrap_finance_user()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  category_name text;
  payment_method_name text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  insert into public.user_settings (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing;

  foreach category_name in array array[
    'Vivienda', 'Servicios', 'Internet', 'Supermercado', 'Restaurantes',
    'Transporte', 'Salud', 'Psicologo', 'Regalos', 'Deudas',
    'Entretenimiento', 'Hogar', 'Compras', 'Suscripciones', 'Educacion',
    'Ahorro', 'Otros'
  ]
  loop
    insert into public.categories (user_id, client_id, name)
    values (current_user_id, gen_random_uuid(), category_name)
    on conflict do nothing;
  end loop;

  foreach payment_method_name in array array[
    'Tarjeta BAC Personal', 'Apple Pay', 'SINPE Móvil', 'Efectivo'
  ]
  loop
    insert into public.payment_methods (user_id, client_id, name)
    values (current_user_id, gen_random_uuid(), payment_method_name)
    on conflict do nothing;
  end loop;
end;
$$;

revoke all on function public.bootstrap_finance_user() from public;
grant execute on function public.bootstrap_finance_user() to authenticated;

grant select, insert, update, delete on table
  public.user_settings,
  public.categories,
  public.payment_methods,
  public.incomes,
  public.fixed_expenses,
  public.planned_payment_plans,
  public.planned_payments,
  public.expenses,
  public.saving_plans,
  public.saving_entries
to authenticated;
