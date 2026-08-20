alter table public.fixed_expenses
  add column if not exists paid_periods text[] not null default '{}';
