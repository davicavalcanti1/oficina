-- Esquema consolidado do projeto Supabase "oficina" (ref xqilzpbivuvmjjmrgsdx).
-- Estado após as migrações de 22/10/2026:
--   etapa_0_censo_patio, corrige_gatilho_historico, endurece_funcoes.
-- Toda tabela carrega oficina_id desde o início (preparação para multi-oficina).

create table public.oficinas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);

create table public.usuarios_oficina (
  user_id uuid not null references auth.users(id) on delete cascade,
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (user_id, oficina_id)
);

create type public.situacao_veiculo as enum ('nos', 'cliente', 'abandonado', 'andamento', 'entregue');

create table public.veiculos (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  placa text not null,
  modelo text not null,
  cliente_nome text not null,
  cliente_telefone text not null,
  cliente_responde boolean not null default true,
  entrada_ano int not null check (entrada_ano between 2000 and 2100),
  entrada_mes int check (entrada_mes between 1 and 12),
  servico_combinado text not null,
  feito text,
  falta text not null,
  dias_restantes int not null default 1 check (dias_restantes >= 0),
  valor_pago numeric(12,2) not null default 0 check (valor_pago >= 0),
  valor_a_receber numeric(12,2) not null default 0 check (valor_a_receber >= 0),
  pecas_compradas numeric(12,2) not null default 0 check (pecas_compradas >= 0),
  situacao public.situacao_veiculo not null default 'nos',
  observacao text,
  entregue_em date,
  valor_recebido_entrega numeric(12,2),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- A mesma placa pode voltar depois de entregue, mas não pode estar duas vezes no pátio.
create unique index veiculos_placa_no_patio
  on public.veiculos (oficina_id, placa)
  where situacao <> 'entregue';

create index veiculos_oficina_situacao on public.veiculos (oficina_id, situacao);

create table public.situacao_historico (
  id bigint generated always as identity primary key,
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  veiculo_id uuid not null references public.veiculos(id) on delete cascade,
  de public.situacao_veiculo,
  para public.situacao_veiculo not null,
  em timestamptz not null default now()
);

create index situacao_historico_veiculo on public.situacao_historico (veiculo_id, em);

-- Antes de gravar: carimbo de data e data de entrega.
create or replace function public.veiculos_antes_gravar()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em := now();
  if tg_op = 'UPDATE'
     and new.situacao = 'entregue'
     and old.situacao is distinct from 'entregue'
     and new.entregue_em is null then
    new.entregue_em := current_date;
  end if;
  return new;
end;
$$;

-- Depois de gravar: histórico de situação.
create or replace function public.veiculos_depois_gravar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.situacao_historico (oficina_id, veiculo_id, de, para)
      values (new.oficina_id, new.id, null, new.situacao);
  elsif new.situacao is distinct from old.situacao then
    insert into public.situacao_historico (oficina_id, veiculo_id, de, para)
      values (new.oficina_id, new.id, old.situacao, new.situacao);
  end if;
  return new;
end;
$$;

create trigger veiculos_antes
  before insert or update on public.veiculos
  for each row execute function public.veiculos_antes_gravar();

create trigger veiculos_depois
  after insert or update on public.veiculos
  for each row execute function public.veiculos_depois_gravar();

-- Primeiro acesso: cada usuário novo ganha a própria oficina.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nova_oficina uuid;
begin
  insert into public.oficinas (nome)
    values (coalesce(new.raw_user_meta_data ->> 'oficina_nome', 'Minha oficina'))
    returning id into nova_oficina;
  insert into public.usuarios_oficina (user_id, oficina_id)
    values (new.id, nova_oficina);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Oficinas do usuário logado, sem recursão de RLS.
create or replace function public.minhas_oficinas()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select oficina_id from public.usuarios_oficina where user_id = auth.uid();
$$;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.veiculos_depois_gravar() from anon, authenticated, public;
revoke execute on function public.veiculos_antes_gravar() from anon, authenticated, public;
revoke execute on function public.minhas_oficinas() from anon, public;

-- RLS
alter table public.oficinas enable row level security;
alter table public.usuarios_oficina enable row level security;
alter table public.veiculos enable row level security;
alter table public.situacao_historico enable row level security;

create policy "ver minhas oficinas" on public.oficinas
  for select to authenticated using (id in (select public.minhas_oficinas()));
create policy "editar minhas oficinas" on public.oficinas
  for update to authenticated using (id in (select public.minhas_oficinas()));

create policy "ver meus vinculos" on public.usuarios_oficina
  for select to authenticated using (user_id = auth.uid());

create policy "veiculos da minha oficina" on public.veiculos
  for all to authenticated
  using (oficina_id in (select public.minhas_oficinas()))
  with check (oficina_id in (select public.minhas_oficinas()));

create policy "historico da minha oficina" on public.situacao_historico
  for select to authenticated using (oficina_id in (select public.minhas_oficinas()));

-- Entrada estimada: sem mês, assume julho.
create or replace function public.entrada_estimada(ano int, mes int)
returns date
language sql
immutable
set search_path = public
as $$
  select make_date(ano, coalesce(mes, 7), 1);
$$;

-- Lista de prioridade: valor a receber / dias restantes.
create view public.veiculos_patio
with (security_invoker = true) as
select
  v.*,
  public.entrada_estimada(v.entrada_ano, v.entrada_mes) as entrada_estimada,
  (current_date - public.entrada_estimada(v.entrada_ano, v.entrada_mes)) as dias_parado,
  round(v.valor_a_receber / greatest(v.dias_restantes, 1), 2) as pontuacao
from public.veiculos v
where v.situacao <> 'entregue';

-- Painel do dono.
create view public.painel
with (security_invoker = true) as
select
  oficina_id,
  count(*)::int as carros_no_patio,
  coalesce(sum(valor_a_receber), 0) as dinheiro_parado,
  coalesce(sum(pecas_compradas), 0) as pecas_investidas,
  round(avg(dias_parado))::int as media_dias_parado,
  count(*) filter (where situacao = 'nos')::int as travados_nos,
  count(*) filter (where situacao = 'cliente')::int as travados_cliente,
  count(*) filter (where situacao = 'abandonado')::int as abandonados,
  count(*) filter (where situacao = 'andamento')::int as em_andamento
from public.veiculos_patio
group by oficina_id;
