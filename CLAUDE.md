@AGENTS.md

# Controle de Estoque para Empresa de Eventos

App web para gestão de estoque de uma empresa de eventos: equipamentos que saem e voltam, itens de consumo, reservas por evento, checklists de saída e retorno, sublocação e cobrança de avarias.

## Ao iniciar uma sessão

1. Leia `docs/PROGRESSO.md`: onde paramos, próximo passo e notas técnicas.
2. Consulte `PRD.md` para requisitos (RFxx), regras de negócio (§6), modelo de dados (§10) e decisões (§12).
3. Ao fim da sessão, atualize `docs/PROGRESSO.md` com o que foi feito e o próximo passo.

## Sobre o usuário

- Tem pouca experiência com programação: explique em português simples e diga claramente o que ele precisa fazer manualmente (painel do Supabase, Vercel etc.).
- Prioridade: colocar no ar rápido, com baixo custo e poucas peças.

## Stack

- Next.js 16 (App Router, `src/`), TypeScript, Tailwind CSS v4, shadcn/ui
- Supabase: Postgres, Auth, Storage, RLS. Clientes em `src/lib/supabase/`
- Zod + React Hook Form
- Vercel: push na `main` publica em produção

## Regras do projeto

- Interface em pt-BR, datas dd/mm/aaaa, moeda R$, fuso America/Sao_Paulo.
- Permissões verificadas no servidor e no banco (RLS), nunca só na tela.
- Movimentações de estoque são imutáveis: correção só por estorno.
- Regras críticas (disponibilidade de reserva, soma das parcelas de cobrança) devem ser garantidas no banco, em transação.
- Nunca commitar `.env.local` nem usar a Secret key do Supabase no código.
