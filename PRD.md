# PRD — Sistema de Gestão de Estoque para Empresa de Eventos

> **Status:** Rascunho v0.4 (stack tecnológica definida)
> **Data:** 14/09/2026
> **Tipo:** Projeto pessoal

---

## 1. Visão geral

Aplicação web para controlar o estoque de uma empresa de eventos. O sistema acompanha dois tipos de item:

- **Equipamentos (patrimônio):** itens que saem para um evento e **voltam**, como caixas de som, iluminação, mesas, cadeiras, tendas e toalhas.
- **Itens de consumo:** itens **gastos** no evento, como descartáveis, materiais de decoração, fitas e pilhas.

A diferença central em relação a um estoque comum é que, numa empresa de eventos, a maior parte dos itens **circula**: é reservada para uma data, sai do depósito, é usada e volta, às vezes com avaria ou perda. O sistema precisa responder com confiança à pergunta: **"Eu tenho esse item disponível nessa data?"**

## 2. Problema

Situações comuns hoje (a validar com o uso real):

- A disponibilidade é controlada em planilha, papel ou de memória, e por isso **dois eventos acabam reservando o mesmo equipamento** para a mesma data.
- Não há registro confiável do que saiu e do que voltou, então **perdas e avarias passam despercebidas** e ninguém é responsabilizado.
- Itens de consumo **acabam sem aviso** e a compra é feita às pressas.
- Não há histórico para saber quais itens são mais usados, quais dão mais problema e onde vale investir.

## 3. Objetivos

| # | Objetivo | Como medir |
|---|----------|------------|
| O1 | Eliminar conflitos de reserva de equipamentos | Zero eventos com item reservado acima da quantidade disponível |
| O2 | Rastrear toda saída e devolução de itens | 100% dos eventos com checklist de saída e de retorno fechado |
| O3 | Reduzir perdas não identificadas | Toda divergência entre saída e retorno registrada com motivo |
| O4 | Evitar falta de itens de consumo | Alerta disparado antes de o item chegar a zero |
| O5 | Dar visibilidade para decisões | Relatórios de uso, perdas e movimentações disponíveis |

## 4. Fora do escopo (MVP)

- Financeiro: orçamentos, faturamento, contas a pagar e a receber. O sistema **registra** o valor de avarias, perdas e sublocações e quem é responsável por elas, mas não faz a cobrança nem a baixa financeira.
- Emissão de nota fiscal.
- CRM e cadastro detalhado de clientes (o evento guarda só o nome e o contato do cliente).
- Gestão completa de fornecedores e pedidos de compra. Para sublocação há só um cadastro simples de fornecedor (§7.7).
- **Múltiplos depósitos** e transferência entre eles. A empresa tem mais de um, mas o MVP opera com **um único depósito**. O modelo de dados deve permitir adicionar outros depois sem retrabalho.
- **Controle por unidade individual** (número de série ou patrimônio). O controle por quantidade atende o MVP.
- Aplicativo nativo. A versão mobile será a própria web responsiva.
- Múltiplas empresas no mesmo sistema (multi-tenant).

## 5. Personas e perfis de acesso

### 5.1 Administrador / Dono
- **Quer:** visão geral do estoque, relatórios de perdas e uso, controle de quem acessa o sistema.
- **Permissões:** acesso total, incluindo gestão de usuários, configurações e exclusões.

### 5.2 Almoxarife / Estoquista
- **Quer:** registrar entradas de mercadoria, conferir saídas e devoluções e manter o cadastro de itens organizado.
- **Permissões:** CRUD de itens, categorias e locais; registro de movimentações; conferência de saída e retorno; ajustes de inventário.

### 5.3 Produtor de eventos
- **Quer:** montar a lista de itens de um evento e ter certeza de que estarão disponíveis.
- **Permissões:** criar e editar eventos próprios, reservar itens, consultar disponibilidade e estoque. Não altera quantidades do estoque diretamente.

### 5.4 Equipe de campo
- **Quer:** abrir pelo celular a lista do que precisa carregar e marcar o que foi embarcado e o que voltou.
- **Permissões:** visualizar eventos atribuídos e marcar itens no checklist de carregamento e devolução, incluindo avarias com foto. Uso principal no **celular**.

### 5.5 Matriz de permissões

| Ação | Admin | Almoxarife | Produtor | Campo |
|------|:-----:|:----------:|:--------:|:-----:|
| Gerenciar usuários | ✅ | ❌ | ❌ | ❌ |
| Cadastrar/editar itens | ✅ | ✅ | ❌ | ❌ |
| Registrar entrada/ajuste de estoque | ✅ | ✅ | ❌ | ❌ |
| Consultar estoque e disponibilidade | ✅ | ✅ | ✅ | 👁️ (só do evento) |
| Criar evento e reservar itens | ✅ | ✅ | ✅ | ❌ |
| Cadastrar freelancer (pessoa sem login) | ✅ | ✅ | ✅ | ❌ |
| Dividir ocorrência e mudar situação da cobrança | ✅ | ❌ | ❌ | ❌ |
| Confirmar saída / devolução | ✅ | ✅ | ❌ | ✅ (checklist) |
| Registrar avaria/perda | ✅ | ✅ | ❌ | ✅ |
| Ver relatórios | ✅ | ✅ | Parcial | ❌ |

## 6. Conceitos do domínio

| Termo | Definição |
|-------|-----------|
| **Item** | Cadastro de um produto (ex.: "Cadeira Tiffany branca"). Tem tipo: *equipamento* ou *consumo*. |
| **Controle por quantidade** | O item é contado em lote, sem identificação individual (ex.: 200 cadeiras). |
| **Controle por unidade (patrimônio)** | Cada unidade tem código próprio (ex.: Caixa de som JBL #003). **Fora do MVP**, previsto para o futuro. |
| **Depósito** | Espaço físico onde o estoque fica. O MVP tem um só depósito. |
| **Local de armazenagem** | Posição dentro do depósito (ex.: prateleira A3, área de mobiliário). |
| **Sublocação** | Item alugado de um fornecedor para cobrir a falta em um evento. Não entra no estoque próprio: fica vinculado só àquele evento e precisa ser devolvido ao fornecedor. |
| **Fornecedor** | Empresa ou pessoa de quem se sublocam itens. |
| **Pessoa** | Cadastro de quem pode ser responsável por itens. Pode ser um **usuário do sistema** (ex.: produtor) ou um **freelancer externo sem login** (ex.: técnico contratado para o evento). |
| **Responsável pelo item** | Pessoa que responde por um item do evento, normalmente o produtor. Avarias e perdas são atribuídas a ela para cobrança. |
| **Ocorrência** | Registro de avaria ou perda, com valor total e descrição. O valor pode ser **dividido entre uma ou mais pessoas**. |
| **Parcela de cobrança** | Parte do valor da ocorrência atribuída a uma pessoa, com situação própria (pendente, cobrado, abonado). |
| **Evento** | Compromisso com data de montagem, realização e desmontagem, cliente e local. |
| **Reserva** | Vínculo de uma quantidade de itens a um evento para um período. Bloqueia disponibilidade, mas **não** tira o item do estoque físico. |
| **Saída** | Momento em que o item deixa fisicamente o depósito para o evento. |
| **Devolução / Retorno** | Momento em que o item volta. Divergências viram avaria ou perda. |
| **Movimentação** | Registro imutável de toda alteração de quantidade: entrada, saída, devolução, consumo, perda, avaria, ajuste. |
| **Estoque mínimo** | Quantidade abaixo da qual o sistema gera alerta. |

### 6.1 Estados de um equipamento

```
Disponível → Reservado → Em uso (saiu) → Devolvido → Disponível
                                      ↘ Avariado → Em manutenção → Disponível
                                      ↘ Perdido (baixa)
```

### 6.2 Ciclo de vida de um evento

```
Rascunho → Confirmado → Em separação → Em andamento (itens saíram) → Em retorno → Finalizado
                ↘ Cancelado (libera reservas)
```

### 6.3 Regra de disponibilidade

Para um equipamento, num período `[início, fim]`:

```
disponível = quantidade_total
           − quantidade_em_manutenção
           − soma(reservas de outros eventos com período sobreposto)
```

- O período de reserva vai da **data de saída** (montagem) até a **data de retorno** (desmontagem), **sem dias de folga** (folga = 0). As datas contam dia inteiro, então o dia de retorno ainda é do evento. Exemplo: um item que volta no dia 10 fica livre para sair de novo no dia 11. A folga padrão é 0 e pode ser mudada nas configurações gerais se for preciso tempo para conferência e limpeza.
- Itens **sublocados** não entram nesse cálculo. Eles cobrem só o evento ao qual foram vinculados.
- Itens de consumo não têm reserva por período. A reserva só abate da quantidade prevista e gera alerta se faltar.

### 6.4 Regra de responsabilidade e cobrança

- Todo evento tem um **responsável** (normalmente o produtor). Por padrão ele responde por todos os itens do evento.
- Um item específico da reserva pode ter **outro responsável** (ex.: o técnico de som responde pelas caixas).
- O responsável é uma **Pessoa**: um usuário do sistema ou um **freelancer externo** cadastrado só com nome, telefone e documento, sem acesso ao sistema.
- Quando o checklist de retorno registra avaria ou perda, o sistema cria uma **ocorrência** com o valor sugerido a partir do valor de reposição. O valor pode ser editado.
- A ocorrência nasce com **uma parcela de 100%** para o responsável do item. Depois ela pode ser **dividida** entre várias pessoas:
  - em partes iguais, ou
  - com valor manual por pessoa.
  - A soma das parcelas deve ser igual ao valor total da ocorrência.
- Cada parcela tem sua própria situação: `Pendente → Cobrado` ou `Pendente → Abonado` (perdoado, com justificativa). A ocorrência só fica **encerrada** quando todas as parcelas saem de *Pendente*.
- Avaria ou perda de item **sublocado** gera ocorrência também, porque a empresa terá de pagar o fornecedor. Ela é atribuída e dividida da mesma forma.

## 7. Requisitos funcionais (MVP)

Prioridade: **P0** = obrigatório no MVP · **P1** = importante, entra se der · **P2** = futuro

### 7.1 Autenticação e usuários
| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| RF01 | Login com e-mail e senha | P0 |
| RF02 | Perfis de acesso conforme §5.5 | P0 |
| RF03 | Admin cria, edita e desativa usuários | P0 |
| RF04 | Recuperação de senha por e-mail | P1 |

### 7.2 Cadastro de itens
| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| RF10 | Cadastrar item com nome, descrição, tipo (equipamento/consumo), categoria, unidade de medida, quantidade, local de armazenagem e estoque mínimo | P0 |
| RF11 | Gerenciar categorias (ex.: Som, Luz, Mobiliário, Decoração, Descartáveis) | P0 |
| RF12 | Gerenciar locais de armazenagem | P0 |
| RF13 | Anexar uma ou mais fotos ao item | P1 |
| RF14 | Busca e filtros por nome, categoria, tipo, local e status | P0 |
| RF15 | Registrar valor de reposição do item, usado como valor sugerido de cobrança em avarias e perdas | P0 |
| RF16 | Controle por unidade individual com código de patrimônio | P2 |
| RF17 | Etiqueta com QR Code por item | P2 |
| RF18 | Importar itens de planilha (CSV/Excel). Com ~50 itens, o cadastro manual é viável | P2 |

### 7.3 Movimentações de estoque
| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| RF20 | Registrar entrada (compra ou reposição) com quantidade, data e observação | P0 |
| RF21 | Registrar ajuste de inventário com motivo obrigatório | P0 |
| RF22 | Enviar item para manutenção e registrar o retorno dele | P1 |
| RF23 | Dar baixa de item (perda, descarte) com motivo | P0 |
| RF24 | Histórico de movimentações por item, imutável, com usuário, data e hora | P0 |

### 7.4 Eventos e reservas
| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| RF30 | Criar evento com nome, cliente, contato, local/endereço, datas de saída, realização e retorno, responsável e observações | P0 |
| RF31 | Adicionar itens e quantidades ao evento (reserva) | P0 |
| RF32 | Mostrar a disponibilidade em tempo real ao adicionar um item, considerando o período do evento | P0 |
| RF33 | **Bloquear** reserva acima do disponível. O sistema oferece **cobrir a diferença com sublocação** (§7.7). Admin pode forçar, com justificativa registrada | P0 |
| RF33a | Aplicar os dias de folga configurados (padrão: 0) após a data de retorno no cálculo de disponibilidade | P0 |
| RF34 | Alterar status do evento conforme §6.2 | P0 |
| RF35 | Cancelar evento libera todas as reservas | P0 |
| RF36 | Calendário/agenda com os eventos do mês | P1 |
| RF37 | Duplicar evento, reaproveitando a lista de itens | P1 |
| RF38 | Kits/pacotes (ex.: "Kit Som Pequeno" = 2 caixas + 1 mesa + cabos) | P2 |
| RF39 | Atribuir membros da equipe de campo ao evento | P0 |
| RF39a | Definir o responsável do evento e, opcionalmente, um responsável diferente por item reservado. O responsável pode ser usuário ou freelancer | P0 |

### 7.5 Saída e devolução (checklist)
| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| RF40 | Gerar checklist de saída a partir das reservas do evento | P0 |
| RF41 | Marcar quantidade efetivamente embarcada por item, que pode ser menor que a reservada | P0 |
| RF42 | Confirmar saída, gerando movimentações de saída | P0 |
| RF43 | Checklist de retorno com quantidade devolvida, avariada e perdida por item | P0 |
| RF44 | Para itens de consumo, registrar quanto foi consumido e quanto sobrou e voltou | P0 |
| RF45 | Anexar foto e descrição à avaria | P1 |
| RF46 | Resumo de divergências ao finalizar o evento (saiu × voltou) | P0 |
| RF47 | Interface do checklist otimizada para celular: botões grandes, poucos toques | P0 |
| RF48 | Assinatura ou nome de quem conferiu | P1 |
| RF49 | Avaria ou perda no retorno gera ocorrência automática para o responsável do item (§6.4) | P0 |

### 7.7 Sublocação
| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| RF60 | Cadastro simples de fornecedor: nome, contato, telefone, observações | P0 |
| RF61 | Adicionar ao evento um item sublocado com fornecedor, quantidade, período, custo e item equivalente do catálogo (opcional) | P0 |
| RF62 | Itens sublocados aparecem nos checklists de saída e retorno, identificados visualmente | P0 |
| RF63 | Registrar a devolução ao fornecedor, com data e quantidade | P0 |
| RF64 | Alerta de sublocação com devolução ao fornecedor atrasada | P1 |
| RF65 | Relatório de custo de sublocação por período, fornecedor e item, mostrando os itens que mais faltam e que talvez valha comprar | P1 |

### 7.8 Ocorrências e cobrança
| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| RF70 | Lista de ocorrências (avarias e perdas) com filtro por responsável, evento, período e situação | P0 |
| RF71 | Editar o valor total da ocorrência | P0 |
| RF71a | Dividir a ocorrência entre várias pessoas, em partes iguais ou com valor manual. O sistema valida que a soma das parcelas é igual ao total | P0 |
| RF71b | Mudar a situação de cada parcela para Cobrado ou Abonado, com justificativa no abono | P0 |
| RF72 | Resumo por pessoa: total pendente, cobrado e abonado | P0 |
| RF73 | Histórico de ocorrências e parcelas no cadastro da pessoa (usuário ou freelancer) | P1 |

### 7.9 Pessoas (responsáveis)
| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| RF80 | Cadastrar freelancer externo com nome, telefone, documento (CPF, opcional) e observações, sem criar login | P0 |
| RF81 | Todo usuário do sistema também existe como pessoa, sem cadastro duplicado | P0 |
| RF82 | Cadastrar freelancer rapidamente a partir da tela do evento, sem sair dela | P1 |
| RF83 | Desativar pessoa sem apagar o histórico de ocorrências | P0 |

### 7.6 Alertas e relatórios
| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| RF50 | Painel inicial com próximos eventos, itens em uso, alertas e divergências pendentes | P0 |
| RF51 | Alerta de item de consumo abaixo do estoque mínimo | P0 |
| RF52 | Alerta de evento próximo com item em conflito ou sem disponibilidade | P0 |
| RF53 | Alerta de evento com retorno atrasado (data passou e checklist não foi fechado) | P1 |
| RF54 | Relatório de movimentações por período, item e tipo | P0 |
| RF55 | Relatório de itens mais utilizados | P1 |
| RF56 | Relatório de perdas e avarias por período, evento e responsável, com valor e situação da cobrança | P0 |
| RF57 | Relatório de uso por evento (o que saiu, voltou e foi consumido) | P0 |
| RF58 | Exportar relatórios em CSV/Excel | P1 |
| RF59 | Notificações por e-mail/WhatsApp | P2 |

## 8. Principais fluxos (user stories)

**US01: Montar um evento (Produtor)**
> Como produtor, quero criar um evento e adicionar itens vendo a disponibilidade na data, para não prometer ao cliente algo que não tenho.

Critérios de aceite:
- Ao escolher o item, vejo "X disponíveis de Y no período", já contando os dias de folga configurados.
- Se eu pedir mais do que o disponível, o sistema impede, mostra quais eventos estão usando o item e oferece sublocar a diferença.

**US02: Carregar o caminhão (Equipe de campo)**
> Como membro da equipe de campo, quero abrir no celular a lista do evento e marcar cada item embarcado, para não esquecer nada.

Critérios de aceite:
- A lista funciona bem numa tela de ~400px.
- Consigo marcar "tudo ok" de uma vez ou ajustar a quantidade item a item.
- A saída só é confirmada quando todos os itens foram conferidos ou justificados.

**US03: Receber o retorno (Almoxarife/Campo)**
> Como almoxarife, quero conferir o que voltou do evento, para registrar avarias e perdas na hora.

Critérios de aceite:
- Para cada item, informo devolvido, avariado e perdido. A soma deve bater com o que saiu.
- Itens avariados vão para o status "Avariado/Manutenção" e deixam de contar como disponíveis.
- Perdas geram baixa automática no estoque.
- Avarias e perdas geram ocorrência para o responsável do item, com valor sugerido.

**US04: Repor consumíveis (Almoxarife)**
> Como almoxarife, quero ser avisado quando um item de consumo estiver acabando, para comprar antes de faltar.

**US05: Cobrar o prejuízo (Admin)**
> Como dono, quero ver as avarias e perdas do mês por responsável, para cobrar de quem ficou com o item e acompanhar o que já foi pago.

Critérios de aceite:
- Vejo o total pendente por pessoa, seja usuário ou freelancer, e abro cada ocorrência com evento, item, foto e valor.
- Divido uma ocorrência entre várias pessoas, em partes iguais ou com valores diferentes, e o sistema não deixa a soma ficar diferente do total.
- Marco cada parcela como Cobrada ou Abonada, e fica registrado quem mudou e quando.

**US06: Sublocar o que falta (Produtor/Almoxarife)**
> Como produtor, quando não tenho quantidade suficiente de um item, quero registrar que vou alugar de um fornecedor, para fechar o evento e não esquecer de devolver.

Critérios de aceite:
- Informo fornecedor, quantidade, período e custo sem sair da tela do evento.
- O item sublocado aparece nos checklists e o sistema me lembra da devolução ao fornecedor.

## 9. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| RNF01 | **Responsivo:** uso completo em desktop; checklist e consultas otimizados para celular |
| RNF02 | **Integridade:** reservas concorrentes não podem exceder o disponível (validação transacional no backend) |
| RNF03 | **Auditoria:** toda movimentação registra usuário, data e hora e não pode ser apagada, só estornada |
| RNF04 | **Segurança:** senhas com hash, permissões verificadas no backend, HTTPS |
| RNF05 | **Desempenho:** telas principais carregam em menos de 2s. Volume esperado: ~50 itens cadastrados, ~15 eventos/mês (~180/ano), ~10 usuários. Com folga, o sistema deve suportar 10× esse volume sem mudar a arquitetura |
| RNF06 | **Idioma e formato:** interface em português (pt-BR), datas dd/mm/aaaa, moeda R$, fuso America/Sao_Paulo |
| RNF07 | **Backup:** backup automático diário do banco de dados (ver §13.5) |
| RNF08 | **Conectividade:** o checklist deve tolerar conexão instável no local do evento (P2: modo offline com sincronização) |
| RNF09 | **Custo:** hospedagem de baixo custo, compatível com projeto pessoal. O volume cabe em planos gratuitos ou de entrada da maioria dos provedores |

## 10. Modelo de dados (rascunho)

```
Pessoa         (id, nome, telefone, documento?, tipo[usuario|freelancer], observacoes, ativo)
Usuario        (id, pessoa_id, email, senha_hash, perfil, ativo)
Configuracao   (chave, valor)            -- ex.: dias_folga_reserva = 0
Deposito       (id, nome, endereco)      -- MVP: um único registro
Categoria      (id, nome)
Local          (id, deposito_id, nome, descricao)
Item           (id, nome, descricao, tipo[equipamento|consumo], categoria_id, local_id,
                unidade_medida, qtd_total, qtd_manutencao, estoque_minimo,
                valor_reposicao, ativo)
FotoItem       (id, item_id, url)
Fornecedor     (id, nome, contato, telefone, observacoes)
Evento         (id, nome, cliente_nome, cliente_contato, endereco,
                data_saida, data_evento, data_retorno, status, responsavel_pessoa_id, observacoes)
EventoEquipe   (evento_id, usuario_id)
Reserva        (id, evento_id, item_id, responsavel_pessoa_id?, qtd_reservada, qtd_saida,
                qtd_devolvida, qtd_avariada, qtd_perdida, qtd_consumida, observacao)
Sublocacao     (id, evento_id, fornecedor_id, item_id?, descricao, quantidade,
                data_retirada, data_devolucao_prevista, data_devolucao_real,
                custo, responsavel_pessoa_id?, qtd_saida, qtd_devolvida, qtd_avariada, qtd_perdida)
Movimentacao   (id, item_id, evento_id?, deposito_id, tipo[entrada|saida|devolucao|consumo|
                avaria|perda|manutencao|ajuste|estorno], quantidade, motivo,
                usuario_id, criado_em)
Ocorrencia     (id, evento_id, reserva_id?, sublocacao_id?, tipo[avaria|perda],
                quantidade, descricao, foto_url, valor_total,
                status[aberta|encerrada], criado_por, criado_em)
ParcelaCobranca(id, ocorrencia_id, pessoa_id, valor,
                status[pendente|cobrado|abonado], justificativa,
                atualizado_por, atualizado_em)
```

> - A quantidade em estoque deve ser **derivada ou conferida** a partir das movimentações, para manter a rastreabilidade.
> - `deposito_id` já existe em `Local` e `Movimentacao` para suportar vários depósitos no futuro. No MVP ele aponta sempre para o depósito padrão e não aparece na interface.
> - `Reserva.responsavel_pessoa_id` vazio significa que vale o responsável do evento.
> - Responsáveis apontam para `Pessoa`, não para `Usuario`, para aceitar freelancers sem login. Todo `Usuario` tem uma `Pessoa`.
> - Regra de integridade: `soma(ParcelaCobranca.valor) = Ocorrencia.valor_total`. A ocorrência fica `encerrada` quando nenhuma parcela está `pendente`.

## 11. Telas do MVP

1. **Login**
2. **Painel (Dashboard):** próximos eventos, alertas, itens em uso, divergências
3. **Itens:** lista com busca e filtros → detalhe (dados, fotos, histórico, agenda de reservas) → formulário
4. **Categorias e Locais:** cadastros simples
5. **Movimentações:** registrar entrada, ajuste, baixa e manutenção; histórico geral
6. **Eventos:** lista e calendário → detalhe (dados, itens reservados, sublocações, responsáveis, equipe, status) → formulário com seletor de itens e disponibilidade
7. **Checklist de saída** (mobile-first)
8. **Checklist de retorno** (mobile-first)
9. **Fornecedores:** cadastro simples e sublocações em aberto
10. **Ocorrências:** avarias e perdas por pessoa, com divisão em parcelas e situação da cobrança
11. **Pessoas:** usuários e freelancers, com histórico de ocorrências
12. **Relatórios**
13. **Usuários e configurações** (admin), incluindo os dias de folga da reserva

## 12. Decisões tomadas

| # | Tema | Decisão |
|---|------|---------|
| D1 | Controle por unidade | **Não** entra no MVP. Todo item é controlado por quantidade. |
| D2 | Folga entre eventos | **0 dias**. O item fica livre no dia seguinte ao retorno. O valor pode ser mudado nas configurações. |
| D3 | Depósitos | A empresa tem mais de um, mas o MVP opera com **um só**. O modelo já prevê `deposito_id` para crescer depois. |
| D4 | Sublocação | **Sim**, a empresa aluga de terceiros. Entra no MVP (§7.7). |
| D5 | Cobrança de avaria/perda | Cobrada do **produtor ou de quem ficou responsável pelo item**. O sistema registra responsável, valor e situação, mas não faz a cobrança financeira (§6.4, §7.8). |
| D6 | Responsável externo | O responsável **pode ser um freelancer sem login**. Criada a entidade `Pessoa`, separada de `Usuario` (§7.9). |
| D7 | Divisão da cobrança | Uma ocorrência **pode ser dividida** entre várias pessoas, em partes iguais ou com valor manual. Cada parcela tem sua própria situação. |
| D8 | Volume | ~50 itens, ~15 eventos/mês, ~10 usuários. É um sistema pequeno: priorizar simplicidade e baixo custo em vez de escalabilidade. |

| D9 | Stack tecnológica | **Next.js + Supabase + Vercel**, com TypeScript, Tailwind CSS e shadcn/ui (§13). |

## 13. Stack tecnológica

### 13.1 Critérios

- **Pouca experiência com programação:** o código será escrito em grande parte com ajuda de IA. A stack precisa ser muito popular (mais exemplos e respostas corretas), ter pouca configuração e poucas peças para manter.
- **Prioridade é colocar no ar rápido:** login, banco, armazenamento de fotos e hospedagem devem vir prontos, sem montar servidor.
- **Custo zero ou baixo** para ~50 itens, ~15 eventos/mês e ~10 usuários.
- **Banco relacional:** o domínio tem muitas relações (evento → reservas → ocorrências → parcelas) e regras de integridade (disponibilidade, soma das parcelas).
- **Boa experiência no celular** para os checklists.

### 13.2 Escolha

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| Linguagem | **TypeScript** | Uma linguagem só para tela e servidor. Os tipos pegam erros antes de rodar, o que ajuda quem está começando e ajuda a IA a acertar |
| Framework web | **Next.js** (App Router) | Framework React mais usado. Tela e lógica de servidor no mesmo projeto, sem backend separado |
| Interface | **Tailwind CSS + shadcn/ui** | Componentes prontos e bonitos (tabelas, formulários, modais), responsivos por padrão |
| Banco de dados | **Supabase (PostgreSQL)** | Postgres gerenciado, com painel visual para ver e editar dados |
| Autenticação | **Supabase Auth** | Login com e-mail e senha e recuperação de senha prontos (RF01, RF04) |
| Permissões | **Row Level Security (RLS)** do Supabase + verificação no servidor | Aplica a matriz de permissões (§5.5) no próprio banco (RNF04) |
| Arquivos | **Supabase Storage** | Fotos de itens e de avarias (RF13, RF45) |
| Formulários e validação | **React Hook Form + Zod** | Valida os dados na tela e no servidor com as mesmas regras |
| Hospedagem | **Vercel** | Deploy automático a cada `git push`, HTTPS incluso, integração nativa com Next.js |
| Código-fonte | **Git + GitHub** | Histórico de versões e deploy automático na Vercel |

### 13.3 Como as regras críticas serão implementadas

- **Disponibilidade sem conflito (RNF02):** o cálculo e a gravação da reserva acontecem numa **função do banco** (Postgres function) executada numa transação. Assim, duas pessoas reservando o mesmo item ao mesmo tempo não conseguem ultrapassar o disponível.
- **Soma das parcelas = valor total:** validada no servidor e garantida no banco com uma verificação na gravação.
- **Movimentações imutáveis (RNF03):** as regras de permissão do banco não permitem editar nem apagar movimentações. Correções só com estorno.
- **Freelancer sem login (D6):** `Pessoa` é uma tabela própria. Só quem tem login recebe registro no Supabase Auth, vinculado a `Usuario`.

### 13.4 Alternativas consideradas

| Opção | Por que não foi escolhida |
|-------|---------------------------|
| **Django (Python)** | Muito bom e com painel admin pronto, mas exige hospedar e manter um servidor e montar a parte de celular à parte. Mais peças para quem está começando |
| **Laravel (PHP)** | Produtivo, mas também exige servidor próprio e tem menos integração pronta com hospedagem gratuita |
| **React + Node/Express separados** | Dois projetos, dois deploys, autenticação e banco montados à mão. Mais trabalho sem ganho para este volume |
| **Firebase** | Fácil de começar, mas o banco não é relacional. Regras como disponibilidade por período e soma das parcelas ficam difíceis e frágeis |
| **No-code / low-code (AppSheet, Bubble)** | O mais rápido para um primeiro protótipo, mas regras específicas (disponibilidade com período, divisão de cobrança, checklist sob medida) esbarram nos limites da ferramenta, e o objetivo é construir um app próprio |

### 13.5 Custos e pontos de atenção

- **Custo inicial:** os planos gratuitos da Vercel (Hobby) e do Supabase (Free) devem bastar para o volume do MVP. Confirmar os limites atuais antes do lançamento.
- **Pausa por inatividade:** projetos no plano gratuito do Supabase são pausados após um período sem acesso. Com uso diário isso não deve acontecer, mas é bom saber.
- **Backup (RNF07):** o plano gratuito do Supabase **não inclui backup automático gerenciado**. Opções:
  1. no MVP, fazer um backup diário automatizado (ex.: exportação agendada via GitHub Actions) sem custo;
  2. quando o sistema estiver em uso real, migrar para o plano pago do Supabase, que tem backups diários.
- **Uso comercial na Vercel:** o plano Hobby é para uso pessoal e não comercial. Se o sistema for usado pela empresa em produção, avaliar o plano Pro ou outra hospedagem compatível com Next.js.
- **Dependência de plataforma:** o banco é Postgres padrão, então é possível migrar para outro provedor no futuro sem reescrever o sistema.

## 14. Questões em aberto

- [ ] Nenhuma no momento. Novas dúvidas surgidas durante o desenvolvimento serão registradas aqui.

## 15. Roadmap sugerido

| Fase | Entregas |
|------|----------|
| **Fase 0: Fundação** | Criar projeto Next.js, conectar Supabase e GitHub, deploy na Vercel, autenticação, perfis, pessoas (usuários e freelancers), configurações, backup |
| **Fase 1: Estoque** | Itens, categorias, locais, movimentações (entrada, ajuste, baixa), histórico |
| **Fase 2: Eventos** | Eventos, reservas com disponibilidade por período, folga configurável, bloqueio de conflito, responsáveis, equipe |
| **Fase 3: Sublocação** | Fornecedores, itens sublocados no evento, devolução ao fornecedor |
| **Fase 4: Operação** | Checklists de saída e retorno (mobile), consumo, avarias, perdas, ocorrências |
| **Fase 5: Visibilidade** | Painel, alertas, tela de ocorrências com divisão de cobrança, relatórios, exportação |
| **Pós-MVP** | Múltiplos depósitos, fotos, QR Code, controle por unidade, kits, calendário, notificações, modo offline |
