# Banco de dados (Supabase)

Os arquivos em `sql/` são os "passos" do banco, na ordem. Cada um é colado
no **SQL Editor** do painel do Supabase e executado uma vez.

> Painel: https://supabase.com/dashboard → seu projeto → **SQL Editor** →
> **New query** → cole o arquivo inteiro → botão **Run** (ou `Ctrl+Enter`).

## Ordem dos arquivos

| Arquivo | O que faz |
|---|---|
| `sql/001_fundacao.sql` | Cria as tabelas `pessoa`, `usuario` e `configuracao`, as funções de permissão e liga a segurança por linha (RLS). |
| `sql/002_primeiro_admin.sql` | Transforma um login já criado no painel no primeiro administrador. **Edite o e-mail e o nome antes de rodar.** |

## Como criar o primeiro acesso

1. No painel: **Authentication → Users → Add user → Create new user**.
2. Preencha e-mail e senha e **marque "Auto Confirm User"** (senão o Supabase
   espera você confirmar o e-mail antes de deixar entrar).
3. Abra `sql/002_primeiro_admin.sql`, troque as duas linhas marcadas com
   `<<< TROQUE AQUI` e rode no SQL Editor.

## Conceitos que aparecem nesses arquivos

- **`auth.users`** — tabela do próprio Supabase, onde ficam e-mail e senha
  (criptografada). Não mexemos nela por SQL, só pelo painel ou pelo app.
- **`public.usuario`** — nossa tabela. Guarda o **perfil** (admin, almoxarife,
  produtor, campo) e se a conta está ativa. Usa o mesmo `id` de `auth.users`.
- **`public.pessoa`** — quem pode ser responsável por um item. Todo usuário tem
  uma pessoa, mas nem toda pessoa tem login (freelancers não têm).
- **RLS (Row Level Security)** — o banco só devolve as linhas que as regras
  permitem, mesmo que alguém use a chave pública do app por fora. É a nossa
  segunda camada de segurança, além das checagens no servidor.
