alter table public.organization_years
  add column if not exists selection_status text not null default 'selected',
  add column if not exists withdrawn_at timestamptz;

alter table public.organization_years
  drop constraint if exists organization_years_selection_status_check;

alter table public.organization_years
  add constraint organization_years_selection_status_check
  check (
    (selection_status = 'selected' and withdrawn_at is null)
    or (selection_status = 'withdrawn' and withdrawn_at is not null)
  );

create index if not exists organization_years_year_selection_status_idx
  on public.organization_years (year, selection_status);
