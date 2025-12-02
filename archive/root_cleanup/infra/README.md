# Infraestrutura

Estrutura planejada para consolidar ferramentas e scripts:

- `infra/tools/` — ferramentas de banco e automações (migrar de `tools/*`).
- `infra/scripts/` — scripts operacionais (migrar de `web-app/scripts/*` e `database/scripts/*`).

Nesta etapa, mantemos os caminhos originais para evitar impactos no CI e App Router. A migração será feita em PR dedicado com atualização de referências e validações.

