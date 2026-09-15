# Progresso do projeto

> Diário de bordo para retomar o trabalho entre sessões. Atualize ao fim de cada dia.
> Requisitos completos do produto: [`PRD.md`](../PRD.md).

**Última atualização:** 14/09/2026
**Fase atual:** Fase 0 (Fundação), infraestrutura pronta, faltam banco e login

---

## Onde paramos

O projeto foi criado, está no GitHub, conectado ao Supabase e publicado na Vercel. O site no ar ainda mostra a página padrão do Next.js: **nenhuma tela ou tabela do sistema foi criada ainda.**

**Próximo passo combinado:** criar as primeiras tabelas no Supabase (pessoas, usuários com perfil, configurações) e a tela de login. O SQL fica num arquivo do projeto e o usuário cola no **SQL Editor** do painel do Supabase, com instruções passo a passo.

## Histórico

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
- [ ] Tabelas `pessoa`, `usuario` (com perfil) e `configuracao` (`dias_folga_reserva = 0`)
- [ ] Regras de acesso (RLS) conforme a matriz de permissões (PRD §5.5)
- [ ] Tela de login e proteção das páginas (redirecionar quem não está logado)
- [ ] Criar o primeiro usuário administrador
- [ ] Backup diário do banco (PRD §13.5)

## Notas técnicas importantes

- **Next.js 16 mudou APIs.** Antes de escrever código, consultar `node_modules/next/dist/docs/` (ver `AGENTS.md`). Exemplo: o antigo `middleware.ts` agora se chama `proxy.ts`.
- **Chave do Supabase:** o projeto usa a *Publishable key* (`sb_publishable_...`) na variável `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A *Secret key* (`sb_secret_...`) nunca deve ir para o código, para o GitHub ou para variáveis `NEXT_PUBLIC_`.
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
