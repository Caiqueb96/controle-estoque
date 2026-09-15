-- =====================================================================
-- 001 - Fundacao: pessoa, usuario, configuracao + regras de acesso (RLS)
-- =====================================================================
-- Como usar: Supabase > SQL Editor > New query > cole este arquivo inteiro
-- e clique em "Run". Pode rodar mais de uma vez sem quebrar nada.
--
-- Referencias do PRD: secao 5.5 (matriz de permissoes), secao 10 (modelo
-- de dados), decisao D2 (dias_folga_reserva = 0) e D6 (Pessoa separada de
-- Usuario, para aceitar freelancer sem login).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Funcao auxiliar: marca a data da ultima alteracao da linha
-- ---------------------------------------------------------------------
create or replace function public.marcar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 2. Tabela PESSOA
--    Quem pode ser responsavel por itens de um evento. Pode ser um
--    usuario do sistema ou um freelancer externo, que nao tem login.
-- ---------------------------------------------------------------------
create table if not exists public.pessoa (
  id            uuid        primary key default gen_random_uuid(),
  nome          text        not null,
  telefone      text,
  documento     text,
  tipo          text        not null default 'freelancer'
                            check (tipo in ('usuario', 'freelancer')),
  observacoes   text,
  ativo         boolean     not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table  public.pessoa      is 'Pessoas que podem ser responsaveis por itens: usuarios do sistema e freelancers sem login.';
comment on column public.pessoa.tipo is 'usuario = tem login no sistema; freelancer = cadastro externo, sem login.';

drop trigger if exists trg_pessoa_atualizado_em on public.pessoa;
create trigger trg_pessoa_atualizado_em
  before update on public.pessoa
  for each row execute function public.marcar_atualizado_em();


-- ---------------------------------------------------------------------
-- 3. Tabela USUARIO
--    Complementa o login do Supabase (auth.users) com o que e nosso:
--    o perfil de acesso e se a conta esta ativa.
--    A SENHA NAO FICA AQUI: ela e guardada pelo Supabase Auth.
--    O id desta tabela e o mesmo id do usuario em auth.users.
-- ---------------------------------------------------------------------
create table if not exists public.usuario (
  id            uuid        primary key references auth.users (id) on delete cascade,
  pessoa_id     uuid        not null unique references public.pessoa (id) on delete restrict,
  email         text        not null unique,
  perfil        text        not null
                            check (perfil in ('admin', 'almoxarife', 'produtor', 'campo')),
  ativo         boolean     not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table  public.usuario        is 'Perfil de acesso de quem tem login. O id e o mesmo de auth.users.';
comment on column public.usuario.perfil is 'admin | almoxarife | produtor | campo (PRD secao 5.5).';

drop trigger if exists trg_usuario_atualizado_em on public.usuario;
create trigger trg_usuario_atualizado_em
  before update on public.usuario
  for each row execute function public.marcar_atualizado_em();


-- ---------------------------------------------------------------------
-- 4. Tabela CONFIGURACAO
--    Ajustes gerais do sistema, no formato chave/valor.
-- ---------------------------------------------------------------------
create table if not exists public.configuracao (
  chave         text        primary key,
  valor         text        not null,
  descricao     text,
  atualizado_em timestamptz not null default now()
);

drop trigger if exists trg_configuracao_atualizado_em on public.configuracao;
create trigger trg_configuracao_atualizado_em
  before update on public.configuracao
  for each row execute function public.marcar_atualizado_em();

-- Valor inicial: sem dias de folga entre eventos (PRD decisao D2).
insert into public.configuracao (chave, valor, descricao) values
  ('dias_folga_reserva', '0', 'Dias de folga entre o retorno de um evento e a saida para o proximo.')
on conflict (chave) do nothing;


-- ---------------------------------------------------------------------
-- 5. Funcoes de permissao
--    Descobrem o perfil de quem esta logado agora.
--    "security definer" faz a funcao rodar com a permissao do dono, para
--    que ela consiga ler a tabela usuario sem cair nas proprias regras
--    de RLS (isso causaria um loop infinito).
-- ---------------------------------------------------------------------
create or replace function public.perfil_atual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.perfil
    from public.usuario u
   where u.id = auth.uid()
     and u.ativo = true;
$$;

comment on function public.perfil_atual() is 'Perfil do usuario logado, ou NULL se nao estiver logado / estiver inativo.';

-- Checagem basica: "e um usuario ativo do sistema?"
create or replace function public.logado()
returns boolean
language sql
stable
as $$
  select public.perfil_atual() is not null;
$$;

create or replace function public.tem_perfil(perfis text[])
returns boolean
language sql
stable
as $$
  select public.perfil_atual() = any (perfis);
$$;

grant execute on function public.perfil_atual()     to authenticated;
grant execute on function public.logado()           to authenticated;
grant execute on function public.tem_perfil(text[]) to authenticated;


-- ---------------------------------------------------------------------
-- 6. Regras de acesso (RLS - Row Level Security)
--    Com RLS ligado, NINGUEM le ou escreve nada a nao ser que exista uma
--    regra (policy) permitindo. Isso vale inclusive se alguem pegar a
--    chave publica do app: a seguranca esta no banco, nao so na tela.
-- ---------------------------------------------------------------------
alter table public.pessoa       enable row level security;
alter table public.usuario      enable row level security;
alter table public.configuracao enable row level security;

-- --- PESSOA ---------------------------------------------------------
-- Ler: qualquer usuario ativo (precisa ver nomes de responsaveis).
drop policy if exists pessoa_ler on public.pessoa;
create policy pessoa_ler on public.pessoa
  for select to authenticated
  using (public.logado());

-- Criar/editar: admin, almoxarife e produtor (PRD 5.5, "Cadastrar freelancer").
drop policy if exists pessoa_criar on public.pessoa;
create policy pessoa_criar on public.pessoa
  for insert to authenticated
  with check (public.tem_perfil(array['admin','almoxarife','produtor']));

drop policy if exists pessoa_editar on public.pessoa;
create policy pessoa_editar on public.pessoa
  for update to authenticated
  using      (public.tem_perfil(array['admin','almoxarife','produtor']))
  with check (public.tem_perfil(array['admin','almoxarife','produtor']));

-- Apagar: so o admin.
drop policy if exists pessoa_apagar on public.pessoa;
create policy pessoa_apagar on public.pessoa
  for delete to authenticated
  using (public.tem_perfil(array['admin']));

-- --- USUARIO --------------------------------------------------------
-- Ler: qualquer usuario ativo (para montar equipes e mostrar quem fez o que).
-- O "or id = auth.uid()" garante que voce sempre enxerga a sua propria
-- linha, mesmo que sua conta tenha sido desativada.
drop policy if exists usuario_ler on public.usuario;
create policy usuario_ler on public.usuario
  for select to authenticated
  using (public.logado() or id = auth.uid());

-- Criar/editar/apagar usuarios: so o admin (PRD 5.5, "Gerenciar usuarios").
drop policy if exists usuario_criar on public.usuario;
create policy usuario_criar on public.usuario
  for insert to authenticated
  with check (public.tem_perfil(array['admin']));

drop policy if exists usuario_editar on public.usuario;
create policy usuario_editar on public.usuario
  for update to authenticated
  using      (public.tem_perfil(array['admin']))
  with check (public.tem_perfil(array['admin']));

drop policy if exists usuario_apagar on public.usuario;
create policy usuario_apagar on public.usuario
  for delete to authenticated
  using (public.tem_perfil(array['admin']));

-- --- CONFIGURACAO ---------------------------------------------------
-- Ler: qualquer usuario ativo. Mudar: so o admin.
drop policy if exists configuracao_ler on public.configuracao;
create policy configuracao_ler on public.configuracao
  for select to authenticated
  using (public.logado());

drop policy if exists configuracao_criar on public.configuracao;
create policy configuracao_criar on public.configuracao
  for insert to authenticated
  with check (public.tem_perfil(array['admin']));

drop policy if exists configuracao_editar on public.configuracao;
create policy configuracao_editar on public.configuracao
  for update to authenticated
  using      (public.tem_perfil(array['admin']))
  with check (public.tem_perfil(array['admin']));


-- ---------------------------------------------------------------------
-- 7. Conferencia
-- ---------------------------------------------------------------------
select 'Tabelas criadas com sucesso. Agora rode o arquivo 002_primeiro_admin.sql' as resultado;
