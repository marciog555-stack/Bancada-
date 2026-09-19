create table public.modelos_servico (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  tipo text not null check (tipo in ('reparo', 'forro', 'pintura', 'eletrica', 'hidraulica', 'instalacao', 'outro')),
  material_sistema text check (material_sistema in ('wpc', 'pvc', 'gesso', 'drywall', 'outro')),
  titulo text not null,
  instrucoes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.modelos_servico enable row level security;

create policy "modelos_servico_own_rows"
on public.modelos_servico
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create trigger set_updated_at
before update on public.modelos_servico
for each row execute function public.set_updated_at();

create index modelos_servico_tipo_material_idx
on public.modelos_servico (tipo, material_sistema);
