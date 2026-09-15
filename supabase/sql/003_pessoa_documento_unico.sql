-- =====================================================================
-- 003 - Evita pessoas duplicadas pelo documento (CPF)
-- =====================================================================
-- Rode no SQL Editor do Supabase, depois do 001 e do 002.
-- =====================================================================

-- O app guarda o documento so com numeros (sem ponto e sem traco).
-- Este indice impede cadastrar duas pessoas com o mesmo CPF.
-- E um indice "parcial": vale so para as linhas que TEM documento
-- preenchido, entao varias pessoas podem ficar sem documento.
create unique index if not exists pessoa_documento_unico
  on public.pessoa (documento)
  where documento is not null;

select 'Indice criado. Nao e mais possivel repetir o mesmo CPF.' as resultado;
