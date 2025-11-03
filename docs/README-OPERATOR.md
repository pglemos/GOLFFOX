# GOLF FOX - Painel do Operador (v42.6)

## O que o Operador faz
- Gerencia seus funcionários e solicita serviços à GOLF FOX (nova rota, ajustes, reforços, incidentes, socorro).
- Acompanha execução, SLA e custos (faturado GOLF FOX), sem criar/editar transportadoras diretamente.

## Principais Páginas
- `/operator` Dashboard: KPIs do dia + Torre de Controle + Mapa preview
- Funcionários: `/operator/funcionarios`
- Rotas & Mapa: `/operator/rotas` e `/operator/rotas/mapa?route_id=...`
- Prestadores (read-only): `/operator/prestadores`
- Solicitações (kanban): `/operator/solicitacoes`
- Custos & Relatórios: `/operator/custos`, `/operator/relatorios`
- Conformidade / Comunicações / Preferências

## Dados & Segurança
- RLS por empresa (operador só vê sua `empresa_id`).
- Tabelas: `gf_service_requests`, `gf_operator_incidents`, `gf_invoices`, `gf_invoice_lines`, `gf_assigned_carriers`, etc.
- Views: `v_operator_*` (read-only para o operador).

## Como testar rapidamente
1. Aplique as migrações em `database/migrations`.
2. (Opcional) Execute o seed `database/seeds/operator_demo_seed.sql` ajustando IDs.
3. Rode o health-check: `ts-node web-app/scripts/health-check-operator.ts`.
4. Acesse `/operator` no ambiente apontado.

## Escopo (Regra de Negócio)
- Operador = Empresa-cliente da GOLF FOX.
- GOLF FOX (Admin) = contrata/aciona transportadoras e aloca veículos/motoristas.
- Operador não cria transportadoras; apenas solicita e acompanha.
