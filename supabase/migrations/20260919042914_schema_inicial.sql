-- Bancada — schema inicial
-- Função utilitária para updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- configuracoes_escala (singleton por usuário)
-- =========================================================
create table public.configuracoes_escala (
  user_id uuid primary key references auth.users(id) default auth.uid(),
  data_plantao_referencia date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.configuracoes_escala enable row level security;

create policy "configuracoes_escala_own_rows"
on public.configuracoes_escala
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create trigger set_updated_at
before update on public.configuracoes_escala
for each row execute function public.set_updated_at();

-- =========================================================
-- registros_treino ("treinei hoje")
-- =========================================================
create table public.registros_treino (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  data date not null,
  treinou boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, data)
);

alter table public.registros_treino enable row level security;

create policy "registros_treino_own_rows"
on public.registros_treino
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index registros_treino_user_data_idx
on public.registros_treino (user_id, data);

-- =========================================================
-- ferramentas
-- =========================================================
create table public.ferramentas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  nome text not null,
  categoria text,
  fase smallint not null check (fase in (1, 2, 3)),
  status text not null default 'quero_comprar' check (status in ('quero_comprar', 'comprada')),
  preco_estimado numeric(10, 2),
  preco_pago numeric(10, 2),
  data_compra date,
  onde_comprei text,
  condicao text check (condicao in ('nova', 'usada')),
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ferramentas enable row level security;

create policy "ferramentas_own_rows"
on public.ferramentas
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create trigger set_updated_at
before update on public.ferramentas
for each row execute function public.set_updated_at();

create index ferramentas_user_status_idx
on public.ferramentas (user_id, status);

create index ferramentas_user_fase_idx
on public.ferramentas (user_id, fase);

-- =========================================================
-- clientes
-- =========================================================
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  nome text not null,
  whatsapp text,
  bairro text,
  observacao text,
  created_at timestamptz not null default now()
);

alter table public.clientes enable row level security;

create policy "clientes_own_rows"
on public.clientes
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index clientes_user_idx
on public.clientes (user_id);

-- =========================================================
-- projetos
-- =========================================================
create table public.projetos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  cliente_id uuid references public.clientes(id) on delete set null,
  titulo text not null,
  descricao text,
  tipo text not null check (tipo in ('reparo', 'forro', 'pintura', 'eletrica', 'hidraulica', 'instalacao', 'outro')),
  status text not null default 'orcamento' check (status in ('orcamento', 'agendado', 'em_andamento', 'concluido', 'cancelado')),
  valor_cobrado numeric(10, 2),
  data_prevista date,
  data_agendada date,
  hora_inicio_agendada time,
  hora_fim_agendada time,
  horas_estimadas_ia numeric(6, 2),
  etapas_ia jsonb,
  alertas_seguranca_ia jsonb,
  observacoes_ia text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projetos enable row level security;

create policy "projetos_own_rows"
on public.projetos
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create trigger set_updated_at
before update on public.projetos
for each row execute function public.set_updated_at();

create index projetos_user_status_idx
on public.projetos (user_id, status);

create index projetos_cliente_idx
on public.projetos (cliente_id);

-- =========================================================
-- projeto_ferramentas (junção projeto x ferramenta)
-- =========================================================
create table public.projeto_ferramentas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  ferramenta_id uuid not null references public.ferramentas(id) on delete cascade,
  essencial boolean not null default true,
  created_at timestamptz not null default now(),
  unique (projeto_id, ferramenta_id)
);

alter table public.projeto_ferramentas enable row level security;

create policy "projeto_ferramentas_own_rows"
on public.projeto_ferramentas
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index projeto_ferramentas_projeto_idx
on public.projeto_ferramentas (projeto_id);

create index projeto_ferramentas_ferramenta_idx
on public.projeto_ferramentas (ferramenta_id);

-- =========================================================
-- projeto_materiais
-- =========================================================
create table public.projeto_materiais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  nome text not null,
  quantidade numeric(10, 2),
  unidade text,
  custo numeric(10, 2),
  created_at timestamptz not null default now()
);

alter table public.projeto_materiais enable row level security;

create policy "projeto_materiais_own_rows"
on public.projeto_materiais
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index projeto_materiais_projeto_idx
on public.projeto_materiais (projeto_id);

-- =========================================================
-- pagamentos
-- =========================================================
create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  valor numeric(10, 2) not null,
  data date not null default current_date,
  forma text not null check (forma in ('pix', 'dinheiro', 'cartao')),
  created_at timestamptz not null default now()
);

alter table public.pagamentos enable row level security;

create policy "pagamentos_own_rows"
on public.pagamentos
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index pagamentos_projeto_idx
on public.pagamentos (projeto_id);

-- =========================================================
-- registros_ponto (cronômetro / lançamento manual de horas)
-- =========================================================
create table public.registros_ponto (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  inicio timestamptz not null,
  fim timestamptz,
  origem text not null default 'cronometro' check (origem in ('cronometro', 'manual')),
  created_at timestamptz not null default now(),
  check (fim is null or fim > inicio)
);

alter table public.registros_ponto enable row level security;

create policy "registros_ponto_own_rows"
on public.registros_ponto
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index registros_ponto_projeto_idx
on public.registros_ponto (projeto_id);

-- só pode existir um cronômetro ativo (fim is null) por usuário
create unique index registros_ponto_um_ativo_por_usuario_idx
on public.registros_ponto (user_id)
where (fim is null);
