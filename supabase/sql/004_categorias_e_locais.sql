-- =====================================================================
-- 004 - Fase 1: deposito, categorias e locais de armazenagem
-- =====================================================================
-- Rode no SQL Editor do Supabase, depois do 003. Pode rodar mais de uma
-- vez sem quebrar nada.
--
-- Referencias do PRD: RF11 (categorias), RF12 (locais), secao 5.5
-- ("Cadastrar/editar itens": admin e almoxarife) e decisao D3 (um so
-- deposito no MVP, mas o modelo ja preve varios).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tabela DEPOSITO
--    O espaco fisico onde o estoque fica. No MVP existe um so, criado
--    aqui mesmo, e ele nao aparece na tela. A tabela existe para que,
--    no futuro, dar suporte a varios depositos nao exija refazer tudo.
-- ---------------------------------------------------------------------
create table if not exists public.deposito (
  id            uuid        primary key default gen_random_uuid(),
  nome          text        not null unique,
  endereco      text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

drop trigger if exists trg_deposito_atualizado_em on public.deposito;
create trigger trg_deposito_atualizado_em
  before update on public.deposito
  for each row execute function public.marcar_atualizado_em();

insert into public.deposito (nome) values ('Depósito principal')
on conflict (nome) do nothing;

-- Qual deposito usar quando ninguem disser qual: o mais antigo.
-- Serve de valor padrao nas tabelas que tem deposito_id.
create or replace function public.deposito_padrao()
returns uuid
language sql
stable
as $$
  select id from public.deposito order by criado_em limit 1;
$$;


-- ---------------------------------------------------------------------
-- 2. Tabela CATEGORIA
--    Agrupa os itens (Som, Luz, Mobiliario...). Nunca e apagada, so
--    desativada: itens antigos continuam apontando para ela.
-- ---------------------------------------------------------------------
create table if not exists public.categoria (
  id            uuid        primary key default gen_random_uuid(),
  nome          text        not null,
  descricao     text,
  ativo         boolean     not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Nome unico sem diferenciar maiusculas: "Som" e "som" sao a mesma.
create unique index if not exists categoria_nome_unico
  on public.categoria (lower(nome));

drop trigger if exists trg_categoria_atualizado_em on public.categoria;
create trigger trg_categoria_atualizado_em
  before update on public.categoria
  for each row execute function public.marcar_atualizado_em();

-- Categorias iniciais, os exemplos do RF11. Da para renomear ou desativar.
insert into public.categoria (nome) values
  ('Som'), ('Luz'), ('Mobiliário'), ('Decoração'), ('Descartáveis')
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 3. Tabela LOCAL
--    Posicao dentro do deposito (ex.: "Prateleira A3").
-- ---------------------------------------------------------------------
create table if not exists public.local (
  id            uuid        primary key default gen_random_uuid(),
  deposito_id   uuid        not null default public.deposito_padrao()
                            references public.deposito (id) on delete restrict,
  nome          text        not null,
  descricao     text,
  ativo         boolean     not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- O mesmo nome pode existir em depositos diferentes, mas nao no mesmo.
create unique index if not exists local_nome_unico
  on public.local (deposito_id, lower(nome));

drop trigger if exists trg_local_atualizado_em on public.local;
create trigger trg_local_atualizado_em
  before update on public.local
  for each row execute function public.marcar_atualizado_em();


-- ---------------------------------------------------------------------
-- 4. Regras de acesso (RLS)
--    Ler: qualquer usuario ativo (todo mundo precisa ver de onde e o
--    item). Criar/editar: admin e almoxarife (PRD 5.5).
--    Nao ha regra de apagar: sem regra, o banco recusa. Desative.
-- ---------------------------------------------------------------------
alter table public.deposito  enable row level security;
alter table public.categoria enable row level security;
alter table public.local     enable row level security;

-- --- DEPOSITO (sem tela no MVP; so o admin mexe) -------------------
drop policy if exists deposito_ler on public.deposito;
create policy deposito_ler on public.deposito
  for select to authenticated
  using (public.logado());

drop policy if exists deposito_editar on public.deposito;
create policy deposito_editar on public.deposito
  for update to authenticated
  using      (public.tem_perfil(array['admin']))
  with check (public.tem_perfil(array['admin']));

-- --- CATEGORIA -----------------------------------------------------
drop policy if exists categoria_ler on public.categoria;
create policy categoria_ler on public.categoria
  for select to authenticated
  using (public.logado());

drop policy if exists categoria_criar on public.categoria;
create policy categoria_criar on public.categoria
  for insert to authenticated
  with check (public.tem_perfil(array['admin','almoxarife']));

drop policy if exists categoria_editar on public.categoria;
create policy categoria_editar on public.categoria
  for update to authenticated
  using      (public.tem_perfil(array['admin','almoxarife']))
  with check (public.tem_perfil(array['admin','almoxarife']));

-- --- LOCAL ---------------------------------------------------------
drop policy if exists local_ler on public.local;
create policy local_ler on public.local
  for select to authenticated
  using (public.logado());

drop policy if exists local_criar on public.local;
create policy local_criar on public.local
  for insert to authenticated
  with check (public.tem_perfil(array['admin','almoxarife']));

drop policy if exists local_editar on public.local;
create policy local_editar on public.local
  for update to authenticated
  using      (public.tem_perfil(array['admin','almoxarife']))
  with check (public.tem_perfil(array['admin','almoxarife']));


-- ---------------------------------------------------------------------
-- 5. Conferencia
-- ---------------------------------------------------------------------
select
  (select count(*) from public.deposito)  as depositos,
  (select count(*) from public.categoria) as categorias,
  (select count(*) from public.local)     as locais;
