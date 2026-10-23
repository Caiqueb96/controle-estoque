-- =====================================================================
-- 005 - Fase 1: itens do estoque
-- =====================================================================
-- Rode no SQL Editor do Supabase, depois do 004. Pode rodar mais de uma
-- vez sem quebrar nada.
--
-- Referencias do PRD: RF10 (cadastro), RF14 (busca e filtros), RF15
-- (valor de reposicao), secao 5.5 ("Cadastrar/editar itens": admin e
-- almoxarife) e secao 10 (quantidade derivada das movimentacoes).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tabela ITEM
--    Um produto do estoque, contado por quantidade (decisao D1).
--
--    qtd_total e qtd_manutencao NAO sao digitadas no cadastro: o item
--    nasce com 0 e so muda por movimentacao (entrada, ajuste, baixa...),
--    que vem no proximo SQL. Assim toda mudanca de quantidade fica
--    registrada com quem fez e quando.
-- ---------------------------------------------------------------------
create table if not exists public.item (
  id              uuid          primary key default gen_random_uuid(),
  nome            text          not null,
  descricao       text,
  tipo            text          not null
                                check (tipo in ('equipamento', 'consumo')),
  categoria_id    uuid          not null
                                references public.categoria (id) on delete restrict,
  local_id        uuid          references public.local (id) on delete restrict,
  unidade_medida  text          not null default 'un',
  qtd_total       integer       not null default 0 check (qtd_total >= 0),
  qtd_manutencao  integer       not null default 0
                                check (qtd_manutencao >= 0 and qtd_manutencao <= qtd_total),
  estoque_minimo  integer       not null default 0 check (estoque_minimo >= 0),
  -- Valor para repor UMA unidade. Sugere o valor da cobranca em avarias.
  valor_reposicao numeric(12,2) not null default 0 check (valor_reposicao >= 0),
  ativo           boolean       not null default true,
  criado_em       timestamptz   not null default now(),
  atualizado_em   timestamptz   not null default now()
);

-- Nome unico sem diferenciar maiusculas.
create unique index if not exists item_nome_unico
  on public.item (lower(nome));

-- Deixam rapidos os filtros por categoria e por local.
create index if not exists item_categoria_idx on public.item (categoria_id);
create index if not exists item_local_idx     on public.item (local_id);

drop trigger if exists trg_item_atualizado_em on public.item;
create trigger trg_item_atualizado_em
  before update on public.item
  for each row execute function public.marcar_atualizado_em();


-- ---------------------------------------------------------------------
-- 2. Quem pode escrever QUAIS colunas
--    O Supabase da permissao de escrever em todas as colunas. Aqui
--    tiramos essa permissao e devolvemos so para as colunas do cadastro.
--    Resultado: nem pela tela, nem por fora dela, alguem consegue mudar
--    qtd_total ou qtd_manutencao direto. So as movimentacoes poderao.
-- ---------------------------------------------------------------------
revoke all on public.item from anon;
revoke insert, update on public.item from authenticated;

grant insert (nome, descricao, tipo, categoria_id, local_id, unidade_medida,
              estoque_minimo, valor_reposicao, ativo)
  on public.item to authenticated;

grant update (nome, descricao, tipo, categoria_id, local_id, unidade_medida,
              estoque_minimo, valor_reposicao, ativo)
  on public.item to authenticated;


-- ---------------------------------------------------------------------
-- 3. Regras de acesso (RLS)
--    Ler: qualquer usuario ativo (o checklist da equipe de campo vai
--    precisar ver o nome dos itens). Criar/editar: admin e almoxarife.
--    Nao ha regra de apagar: so desativar.
-- ---------------------------------------------------------------------
alter table public.item enable row level security;

drop policy if exists item_ler on public.item;
create policy item_ler on public.item
  for select to authenticated
  using (public.logado());

drop policy if exists item_criar on public.item;
create policy item_criar on public.item
  for insert to authenticated
  with check (public.tem_perfil(array['admin','almoxarife']));

drop policy if exists item_editar on public.item;
create policy item_editar on public.item
  for update to authenticated
  using      (public.tem_perfil(array['admin','almoxarife']))
  with check (public.tem_perfil(array['admin','almoxarife']));


-- ---------------------------------------------------------------------
-- 4. Conferencia
-- ---------------------------------------------------------------------
select count(*) as itens from public.item;
