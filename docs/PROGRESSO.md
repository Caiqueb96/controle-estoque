# Progresso do projeto

> Diário de bordo para retomar o trabalho entre sessões. Atualize ao fim de cada dia.
> Requisitos completos do produto: [`PRD.md`](../PRD.md).

**Última atualização:** 15/09/2026
**Fase atual:** Fase 0 (Fundação), banco e login prontos; faltam telas de pessoas/usuários e backup

---

## Onde paramos

O banco tem as três primeiras tabelas com segurança por linha (RLS) ligada, e o
sistema **já tem login funcionando**: quem não está logado é mandado para
`/login`, e quem entra cai no `/painel` com nome e perfil na tela. O primeiro
administrador foi criado.

**Próximo passo combinado:** fechar a Fase 0 com as telas de **Pessoas**
(freelancers) e **Usuários** (admin cria, edita e desativa — RF03), mais a tela
de **Configurações**. Depois disso começa a Fase 1 (itens, categorias, locais e
movimentações).

> Atenção para o RF03: criar um login novo pelo app exige a *Secret key* do
> Supabase (`supabase.auth.admin.createUser`). Ela **só pode** ficar numa
> variável de ambiente do servidor (sem `NEXT_PUBLIC_`), nunca no código.

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
- [ ] Tela de Pessoas (cadastro de freelancers) — PRD §7.9
- [ ] Tela de Usuários: admin cria, edita e desativa — RF03
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
