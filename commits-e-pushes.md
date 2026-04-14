# Commits e Pushes — dradauto

Documento oficial para rastrear todo commit e push do projeto.

## Regra de Atualizacao (obrigatoria)

Sempre que houver acao de versionamento, atualizar este arquivo na mesma sessao:

1. Ao criar commit: adicionar uma linha em "Historico" com status `NAO` em "Push realizado".
2. Ao executar push: atualizar a mesma linha para `SIM`, preencher data/hora de push e branch remota.
3. Ao corrigir historico: nunca apagar linhas antigas; usar nota em "Observacoes".
4. Se nao houver upstream configurado: registrar em "Observacoes" e usar comparacao com `origin/main` quando disponivel.

## Estado Atual

- Data de referencia: 2026-04-14
- Branch local: `main`
- HEAD local: `9a974a0`
- Ultimo commit conhecido em `origin/main`: `3ed8d85`
- Situacao: HEAD esta a frente de `origin/main` (push pendente)

## Historico

| Data commit | Hora commit | Hash | Mensagem | Branch local | Push realizado | Data push | Hora push | Branch remota | Observacoes |
|-------------|-------------|------|----------|--------------|----------------|-----------|-----------|---------------|-------------|
| 2026-04-14 | 13:57 | 1ea759e | feat: initial commit — dradauto SaaS medico (Fases 0-4) | main | SIM | 2026-04-14 | 15:37 | origin/main | Base inicial publicada antes das melhorias de agenda |
| 2026-04-14 | 15:37 | 3ed8d85 | feat(agenda): improve appointment status UX and navigation | main | SIM | 2026-04-14 | 15:37 | origin/main | Push confirmado na sessao |
| 2026-04-14 | 16:07 | 9a974a0 | feat(agenda): harden new appointment flow and phone normalization | main | NAO | - | - | - | Commit local criado; push ainda nao executado |

## Checklist Rapido Antes de Push

1. `git status --short` sem arquivos indevidos no commit.
2. `get_errors` sem erros nos arquivos alterados.
3. Confirmar que arquivos de documentacao foram atualizados quando aplicavel.
4. Executar push e atualizar este documento.

## Comandos de Referencia

- Ver status: `git status -sb`
- Ver commits recentes: `git --no-pager log --oneline -n 10`
- Ver commit remoto: `git rev-parse --short origin/main`
- Ver HEAD local: `git rev-parse --short HEAD`
- Confirmar se HEAD contem remoto: `git merge-base --is-ancestor origin/main HEAD`
