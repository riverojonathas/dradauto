# Plano de Revisao e Refinamento - Tela Pacientes

Data: 2026-04-14
Status: Implementacao em andamento (commits 1-6 concluidos tecnicamente, QA final pendente)
Escopo: lista e perfil de pacientes

## Progresso da execucao

- 2026-04-14: Commit 1 concluido (status + busca)
- 2026-04-14: Commit 2 concluido (UX de lista + metricas)
- 2026-04-14: Commit 3 concluido (historico + navegacao)
- 2026-04-14: Commit 4 concluido (sync + robustez tecnica)
- Validacao tecnica: sem erros de TypeScript nos arquivos alterados
- 2026-04-14: QA parcial executado na busca com achado de normalizacao de WhatsApp (consulta sem DDI nao encontra em todos os casos)
- 2026-04-14: Commit 5 concluido (busca WhatsApp com normalizacao flexivel no backend + microcopy)
- 2026-04-14: Commit 6 concluido (refatoracao UI/UX do card de paciente: compactacao, hierarquia e responsividade)
- 2026-04-14: Ajuste tecnico aplicado na integracao Google Contacts para sincronizacao correta de telefone (formato compativel com People API)
- 2026-04-14: Tela de Configuracoes atualizada com secao de Integracoes (Agenda Google, Contatos Google e Google Social) com acoes de autorizar/revogar/gerenciar
- 2026-04-14: Correcao do retry de sync no card de paciente com tratamento de escopo ausente/token revogado e redirecionamento para reconexao em Configuracoes
- 2026-04-14: Toasts de sincronizacao adicionados no badge com mensagens detalhadas (escopo, token, erro da API Google)

## Ajustes pos-QA solicitados pelo usuario

- [x] Validacao de CPF no cadastro/edicao com bloqueio para CPF invalido (client e server).
- [x] Excluir paciente implementado com protecao de integridade (bloqueia exclusao com prontuario vinculado).
- [x] Cards de metricas do topo compactados para melhorar leitura da pagina.
- [x] Sincronizacao Google revisada com feedback de erro e retry por paciente.
- [ ] Avaliar integracao avancada via MCP Google Contacts + fluxo de social login para enriquecer criacao de contato (proposta arquitetural, nao implementado nesta rodada).
- [x] Revisar UI/UX do card do paciente (reduzir altura, reorganizar hierarquia visual e melhorar escaneabilidade no desktop/mobile).
- [x] Corrigir sincronizacao de telefone para Google Contacts.
- [x] Adicionar em Configuracoes as integracoes para autorizar/revogar (Agenda Google, Contatos Google, Google Social).
- [x] Corrigir fluxo de clique em sincronizar no badge quando houver falha por permissao/token (feedback e acao de reconexao).

## Diretrizes seguidas

- Respeitar arquitetura e fases do documento consultorio-medico-virtual.md.
- Manter mudancas atomicas e verificaveis por commit.
- Nao alterar fluxo de auth/middleware (usar apenas proxy.ts no projeto).
- Atualizar commits-e-pushes.md a cada commit/push.

## Objetivo

Investigar bugs e problemas de UX/UI da tela de pacientes e executar correcoes com baixo risco de regressao, priorizando consistencia de dados, clareza visual e performance percebida.

## Achados da auditoria (priorizados)

### Critico

1. Mapeamento de status inconsistente no historico de consultas.
- Problema: historico usa chaves como confirmada, pendente, cancelada, mas dominio atual usa pending, confirmed, cancelled, completed.
- Impacto: badge de status incorreta no perfil do paciente.
- Arquivo: dradauto/components/patients/appointment-history.tsx

### Alto

2. Busca promete nome ou WhatsApp, mas backend filtra somente por nome.
- Problema: placeholder informa busca por WhatsApp, porem listPatients aplica apenas ilike em nome.
- Impacto: UX enganosa e baixa encontrabilidade.
- Arquivos: dradauto/components/patients/patients-list.tsx, dradauto/app/actions/patients.ts

3. Card de KPI duplicado na pagina de pacientes.
- Problema: cards "Total de pacientes" e "Total cadastrados" exibem o mesmo valor.
- Impacto: ruido visual e leitura de dashboard menos util.
- Arquivo: dradauto/app/(dashboard)/pacientes/page.tsx

4. Acao "Detalhes" no historico nao executa nada.
- Problema: botao visual para consultas futuras sem handler.
- Impacto: affordance falsa e friccao de uso.
- Arquivo: dradauto/components/patients/appointment-history.tsx

### Medio

5. Estatistica de nao sincronizados baseada apenas na pagina carregada (limit 100).
- Problema: banner de sync usa contagem local parcial.
- Impacto: numero pode ficar incorreto em bases maiores.
- Arquivos: dradauto/components/patients/patients-list.tsx, dradauto/app/actions/patients.ts

6. Badge de sync tem intencao de retry, mas sem acao funcional.
- Problema: componente contem fluxo de sync manual incompleto/comentado.
- Impacto: UX incompleta para resolucao individual.
- Arquivo: dradauto/components/patients/google-sync-badge.tsx

7. Tipagem frouxa com any em componentes centrais.
- Problema: PatientCard, PatientDetailHeader, AppointmentHistory recebem any.
- Impacto: maior risco de regressao e bugs silenciosos.
- Arquivos: dradauto/components/patients/*.tsx

### Baixo

8. Mensagens de empty-state pouco orientadas por contexto de busca.
- Problema: mesmo texto para "sem pacientes" e "sem resultado da busca".
- Impacto: orientacao de proximo passo poderia ser melhor.
- Arquivo: dradauto/components/patients/patients-list.tsx

## Plano de implementacao (commits atomicos)

### Commit 1 - Correcao funcional de status e busca

- [x] Ajustar mapeamento de status em appointment-history para o dominio atual.
- [x] Adicionar busca por WhatsApp em listPatients (nome OR whatsapp normalizado).
- [x] Alinhar microcopy do campo de busca ao comportamento real.

Criterios de aceite:
- [x] Badge de status correta para pending/confirmed/cancelled/completed.
- [x] Busca retorna por nome e por telefone.

### Commit 2 - UX de lista e metricas

- [x] Remover ou substituir KPI duplicado com metrica util (ex.: com consulta no periodo, sem sync, ou ultima semana).
- [x] Melhorar empty-state: diferenciar "sem cadastro" vs "sem resultado da busca".
- [x] Revisar CTA principal para manter consistencia visual no desktop/mobile.

Criterios de aceite:
- [x] Nenhum card duplicado de informacao.
- [x] Empty-state contextual e acionavel.

### Commit 3 - Historico e navegacao

- [x] Corrigir CTA "Detalhes" sem acao (link real ou remover botao).
- [x] Melhorar agrupamento visual de informacoes no historico (hora, tipo, status, pagamento).
- [x] Revisar acessibilidade de interacoes (focus, hover, labels).

Criterios de aceite:
- [x] Nao existir CTA sem comportamento.
- [x] Fluxo de historico previsivel em consultas passadas e futuras.

### Commit 4 - Sincronizacao Google e robustez tecnica

- [x] Definir estrategia de contagem real de nao sincronizados no backend.
- [x] Tratar badge de sync com retry unitario funcional.
- [x] Substituir any por tipos de dominio nos componentes principais.

Criterios de aceite:
- [x] Contagem de nao sincronizados confiavel.
- [x] Sem fluxo parcialmente implementado no badge.
- [x] Tipagem forte nos componentes auditados.

## Verificacao e QA

1. Teste de busca:
- Nome parcial - funcionou 
- WhatsApp em formatos diferentes - funcionou apenas quando informado com DDI no inicio (ajuste pendente)
- Busca sem resultados - funcionou

2. Teste de historico:
- Cada status do dominio com badge correta
- Consulta futura e passada com CTA valido

3. Teste de sync:
- Com Google conectado/desconectado
- Banner e badges coerentes com estado real

4. Regressao geral:
- Criacao/edicao de paciente
- Abrir perfil
- Abrir nova consulta pelo perfil

Status da verificacao:
- [ ] QA manual completo ainda pendente (executar em ambiente de navegacao apos nova rodada de ajustes)

## Nova rodada de ajustes (solicitacao atual)

### Frente A - Busca por WhatsApp mais tolerante

- [x] Revisar normalizacao no backend para aceitar busca por telefone com e sem DDI, com ou sem mascara.
- [x] Garantir compatibilidade com padrao E.164 persistido e entrada flexivel no campo de busca.

Criterios de aceite:
- [x] Busca por WhatsApp retorna o mesmo paciente para entradas equivalentes (ex.: 119..., 55119..., com/sem pontuacao).
- [x] Placeholder e comportamento permanecem alinhados.

### Frente B - Revisao completa de UI/UX do card de paciente

Problema atual:
- Card visualmente grande, desorganizado e com baixa hierarquia de informacao.

Objetivo:
- Tornar o card mais compacto, legivel e consistente com o design system teal, sem perder informacoes essenciais.

Escopo tecnico previsto:
- [x] Redefinir estrutura do card (cabecalho, corpo, rodape) com espacamentos menores e alinhamento previsivel.
- [x] Priorizar informacoes-chave na primeira dobra (nome, contato principal, status de sync, ultima interacao).
- [x] Reorganizar acoes para reduzir ruido visual (acoes primarias vs secundarias).
- [x] Melhorar responsividade no mobile (quebras de linha, densidade e area clicavel).
- [x] Revisar estados visuais (hover, focus, loading, empty/error) para acessibilidade e clareza.

Criterios de aceite:
- [x] Card reduz altura total percebida sem cortar informacao critica.
- [x] Leitura do card em ate 3 segundos para identificar paciente e proxima acao.
- [x] Layout consistente em desktop e mobile, sem sobreposicao/quebra indevida.
- [x] Interacoes com foco visivel e sem CTA ambigua.

### Commit 5 - Busca de WhatsApp (normalizacao flexivel)

- [x] Implementar ajuste de busca por telefone com/sem DDI no backend.
- [x] Validar microcopy e testes manuais de busca.

### Commit 6 - UI/UX do card de paciente

- [x] Refatorar composicao visual do card com foco em compactacao e hierarquia.
- [x] Ajustar tipografia, espacamento, badges e distribuicao de metadados.
- [x] Revisar responsividade e acessibilidade do card.

### Commit 7 - QA final e regressao da tela de pacientes

- [ ] Executar QA manual completo (busca, listagem, perfil, historico, sync, card novo).
- [ ] Registrar evidencias e resultado final de validacao no plano.
- [ ] Atualizar commits-e-pushes.md e CLAUDE.md ao encerrar a rodada.

## Fora de escopo desta rodada

- Mudancas de pagamentos (fase Stripe).
- Mudancas no fluxo de agenda fora do modulo pacientes.
- Migracoes de dados amplas fora do necessario para bugs desta tela.

## Ordem de execucao sugerida

1. Commit 1 (funcional bloqueante)
2. Commit 2 (UX base)
3. Commit 3 (interacoes)
4. Commit 4 (robustez e acabamento)
5. Commit 5 (busca WhatsApp sem friccao)
6. Commit 6 (refatoracao UI/UX do card de paciente)
7. Commit 7 (QA final e fechamento)

## Nota operacional

Ao iniciar implementacao, atualizar tambem:
- commits-e-pushes.md (a cada commit/push)
- CLAUDE.md (contexto e log de sessao ao encerrar)
