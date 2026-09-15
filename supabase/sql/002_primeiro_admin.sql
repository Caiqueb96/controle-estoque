-- =====================================================================
-- 002 - Cria o primeiro usuario administrador
-- =====================================================================
-- ANTES DE RODAR: crie o login no painel do Supabase em
--   Authentication > Users > "Add user" > "Create new user"
--   (marque "Auto Confirm User" para nao precisar confirmar por e-mail).
--
-- Depois: troque o e-mail e o nome nas duas linhas abaixo e rode este
-- arquivo no SQL Editor. Pode rodar de novo sem problema: se o usuario
-- ja existir, ele apenas vira admin e e reativado.
-- =====================================================================

do $$
declare
  v_email     text := 'troque-pelo-seu@email.com';   -- <<< TROQUE AQUI
  v_nome      text := 'Troque pelo seu nome';        -- <<< TROQUE AQUI
  v_auth_id   uuid;
  v_pessoa_id uuid;
begin
  -- 1. Procura o login criado no painel (Authentication > Users)
  select id into v_auth_id
    from auth.users
   where lower(email) = lower(v_email);

  if v_auth_id is null then
    raise exception 'Nao existe login com o e-mail %. Crie primeiro em Authentication > Users.', v_email;
  end if;

  -- 2. Se ja estiver cadastrado aqui, so garante que e admin e esta ativo
  if exists (select 1 from public.usuario where id = v_auth_id) then
    update public.usuario
       set perfil = 'admin', ativo = true
     where id = v_auth_id;
    raise notice 'Usuario % ja existia e foi confirmado como admin.', v_email;
    return;
  end if;

  -- 3. Cria a Pessoa (o cadastro "humano") e depois o Usuario (o acesso)
  insert into public.pessoa (nome, tipo)
       values (v_nome, 'usuario')
    returning id into v_pessoa_id;

  insert into public.usuario (id, pessoa_id, email, perfil, ativo)
       values (v_auth_id, v_pessoa_id, lower(v_email), 'admin', true);

  raise notice 'Administrador % criado com sucesso.', v_email;
end;
$$;

-- Confere o resultado
select u.email, u.perfil, u.ativo, p.nome
  from public.usuario u
  join public.pessoa  p on p.id = u.pessoa_id;
