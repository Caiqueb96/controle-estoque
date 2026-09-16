# Progresso do projeto

> Diário de bordo para retomar o trabalho entre sessões. Atualize ao fim de cada dia.
> Requisitos completos do produto: [`PRD.md`](../PRD.md).

**Última atualização:** 15/09/2026
**Fase atual:** Fase 0 (Fundação), banco, login, Pessoas e edição de Usuários prontos; faltam criar login pelo app, Configurações e backup

---

## Onde paramos

O sistema **já funciona de ponta a ponta para pessoas e usuários**, testado pelo
usuário:

- Login, logout e proteção de todas as páginas.
- **Pessoas**: lista com busca e filtro, cadastro de freelancer, edição,
  ativar/desativar. CPF validado e único.
- **Usuários** (só admin): lista, correção de nome, troca de função e
  bloquear/liberar acesso.

Três SQLs já rodados no painel do Supabase: `001_fundacao`,
`002_primeiro_admin` e `003_pessoa_documento_unico`.

### Próximo passo combinado (retomar aqui)

Fechar a Fase 0, nesta ordem:

**1. Criar login novo pelo próprio app** (parte que falta do RF03). É a tarefa
delicada do dia. Roteiro:

- No painel do Supabase: *Project Settings → API Keys* → copiar a **Secret key**
  (`sb_secret_...`).
- Guardar em `.env.local` como `SUPABASE_SECRET_KEY` — **sem** o prefixo
  `NEXT_PUBLIC_`, senão ela vaza para o navegador. Acrescentar a linha ao
  `.env.example` (só o nome, sem o valor).
- Repetir a variável na Vercel: *Settings → Environment Variables*.
- Criar um cliente admin novo (ex.: `src/lib/supabase/admin.ts`) que use essa
  chave. Ele **ignora o RLS**, então só pode ser chamado depois de
  `exigirPerfil(["admin"])`.
- Fluxo da tela: `auth.admin.createUser({ email, password, email_confirm: true })`
  → criar a `pessoa` → criar a linha em `usuario` com o `id` devolvido. Se um
  dos passos falhar, desfazer os anteriores (senão sobra login órfão).

**2. Tela de Configurações** — editar `dias_folga_reserva` (tabela
`configuracao`). Tarefa curta, mesmo padrão das outras telas.

**3. Backup diário do banco** (PRD §13.5) — configuração no painel do Supabase,
sem código.

Depois disso começa a **Fase 1: Estoque** (itens, categorias, locais e
movimentações).

## Histórico

### 15/09/2026
- Criadas as tabelas `pessoa`, `usuario` e `configuracao` com RLS conforme a
  matriz de permissões (PRD §5.5). SQL em `supabase/sql/`, com passo a passo em
  `supabase/README.md`.
- Funções de permissão no banco: `perfil_atual()`, `logado()`, `tem_perfil()`.
- Semente da configuração `dias_folga_reserva = 0` (PRD D2).
- Tela de login (`src/app/login/`), área logada com cabeçalho e botão Sair
  (`src/app/(app)/`), e camada de verificação `src/lib/auth.ts`.
- Proxy passou a redirecionar quem não está logado para `/login`.
- Primeiro usuário administrador criado e login testado.
- Tela de **Pessoas** (PRD §7.9): lista com busca e filtro de situação, cadastro
  de freelancer, edição e ativar/desativar (RF80, RF83). Validação de CPF e
  telefone em `src/lib/formato.ts`; consultas em `src/lib/pessoas.ts`.
- `supabase/sql/003_pessoa_documento_unico.sql`: índice único parcial que impede
  cadastrar duas pessoas com o mesmo CPF.
- Tela de **Usuários** (só admin): lista, edição de nome e função, e
  bloquear/liberar acesso. Sem SQL novo — o RLS do 001 já cobria.
  Travas contra se trancar para fora: o admin não consegue tirar a própria
  função de administrador nem bloquear o próprio acesso.
- Perfis movidos para `src/lib/perfis.ts` (ver nota sobre servidor × navegador).
- Tudo testado pelo usuário: login, cadastro/edição/desativação de pessoa,
  busca, CPF inválido recusado, e edição de usuário.

### 14/09/2026
- PRD escrito e refinado até a v0.4, com decisões D1 a D9 na seção 12.
- Stack escolhida: Next.js + Supabase + Vercel (PRD §13).
- Projeto Next.js 16 criado com TypeScript, Tailwind CSS v4, shadcn/ui, Zod e React Hook Form.
- Conexão com o Supabase configurada (`src/lib/supabase/`) e proxy de sessão (`src/proxy.ts`).
- Repositório público criado: https://github.com/Caiqueb96/controle-estoque
- Projeto Supabase criado (região São Paulo, plano Free) e conexão testada com sucesso.
- Vercel ligada ao GitHub. Primeiro deploy de produção feito: https://controle-estoque-ten-lyart.vercel.app

## Checklist da Fase 0

- [x] Projeto Next.js + Tailwind + shadcn/ui
- [x] Repositório no GitHub
- [x] Supabase conectado (`.env.local` local + variáveis na Vercel)
- [x] Deploy automático na Vercel (push na `main` = produção)
- [x] Tabelas `pessoa`, `usuario` (com perfil) e `configuracao` (`dias_folga_reserva = 0`)
- [x] Regras de acesso (RLS) conforme a matriz de permissões (PRD §5.5)
- [x] Tela de login e proteção das páginas (redirecionar quem não está logado)
- [x] Criar o primeiro usuário administrador
- [x] Tela de Pessoas (cadastro de freelancers) — PRD §7.9
- [x] Tela de Usuários: admin **edita** nome e função, e bloqueia/libera acesso
- [ ] Criar login novo pelo próprio app (parte que falta do RF03 — exige a Secret key)
- [ ] Tela de Configurações (dias de folga da reserva)
- [ ] Backup diário do banco (PRD §13.5)

## Notas técnicas importantes

- **Next.js 16 mudou APIs.** Antes de escrever código, consultar `node_modules/next/dist/docs/` (ver `AGENTS.md`). Exemplo: o antigo `middleware.ts` agora se chama `proxy.ts`.
- **Senha não fica na nossa tabela.** O PRD §10 previa `Usuario.senha_hash`; na prática o Supabase Auth guarda e-mail e senha em `auth.users`. Nossa tabela `usuario` só tem `perfil` e `ativo`, e usa o **mesmo `id`** de `auth.users`.
- **Três camadas de segurança:** proxy (checagem rápida do cookie) → `exigirUsuario()` / `exigirPerfil()` em cada página e Server Action → RLS no banco. Nunca confiar só na tela.
- **RLS e loop infinito:** uma policy da tabela `usuario` que consulta a própria `usuario` trava. Por isso `perfil_atual()` é `security definer` — ela roda com permissão de dono e não cai nas próprias regras.
- **Chave do Supabase:** o projeto usa a *Publishable key* (`sb_publishable_...`) na variável `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A *Secret key* (`sb_secret_...`) nunca deve ir para o código, para o GitHub ou para variáveis `NEXT_PUBLIC_`.
- **Tipos do banco:** hoje as consultas ao Supabase voltam sem tipagem e são convertidas à mão (ex.: `data as LinhaUsuario | null`). Quando houver mais tabelas, vale gerar os tipos com `supabase gen types typescript` e passá-los para `createClient`.
- **Zod v4:** é `z.email()` (função de topo), não mais `z.string().email()`.
- **Botão que vira link:** o shadcn atual (estilo `base-nova`) roda sobre o Base UI, que **não tem `asChild`**. Use `render`: `<Button render={<Link href="/x" />}>Texto</Button>`.
- **Comentário JSX com crase quebra o build:** o Turbopack não conseguiu ler um `{/* ... */}` que tinha crases dentro. Evite crases em comentários JSX.
- **Servidor × navegador:** um arquivo `"use client"` não pode importar, nem
  indiretamente, nada que use `next/headers` — o build quebra com
  *"You're importing a component that needs next/headers"*. Por isso constantes
  compartilhadas (como os perfis) moram em `src/lib/perfis.ts`, sem imports de
  servidor, e `src/lib/auth.ts` só re-exporta o tipo.
- **Join do Supabase sem tipos gerados:** em `select("... pessoa (nome)")` o
  TypeScript assume que `pessoa` pode ser uma lista, embora em tempo de
  execução venha um objeto. Ver o tratamento em `src/lib/usuarios.ts`. Some
  quando gerarmos os tipos do banco.
- **Telefone e CPF** são gravados **só com números** (`src/lib/formato.ts`), e formatados na hora de exibir. Assim a busca e o índice de CPF único funcionam.
- **Grupo de rotas `(app)`:** pasta entre parênteses organiza os arquivos sem aparecer no endereço. Tudo dentro de `src/app/(app)/` herda o layout protegido.
- **Variáveis de ambiente:** modelo em `.env.example`. O `.env.local` é ignorado pelo Git. Na Vercel, as mesmas variáveis estão em *Settings → Environment Variables*.
- **Pacote `cn`:** o shadcn/ui atual usa o pacote `cn` (do repositório oficial `shadcn-ui/cn`) no lugar de `clsx` + `tailwind-merge`. É legítimo.
- **Checagem de tipos:** `npx tsc --noEmit` só funciona depois de rodar `npm run build` ou `npm run dev` pelo menos uma vez, porque tipos como `LayoutProps` são gerados pelo Next.js.
- **Windows:** comandos com `!` no prompt do Claude Code rodam em Bash, então comandos do PowerShell (ex.: `Copy-Item`) falham ali.
- **Deploy:** todo `git push` na `main` publica em produção em cerca de 30 segundos.

## Como rodar localmente

```bash
npm install        # só na primeira vez ou quando mudar dependências
npm run dev        # abre em http://localhost:3000
npm run build      # confere se o projeto compila
npm run lint       # confere o estilo do código
```

## Banco de dados

O SQL fica em `supabase/sql/`, numerado na ordem de execução. Cada arquivo é
colado no **SQL Editor** do painel do Supabase. Instruções e conceitos em
[`supabase/README.md`](../supabase/README.md).
