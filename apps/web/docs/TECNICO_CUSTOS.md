# Documentação Técnica - Sistema de Custos

## Arquitetura

### Banco de Dados

#### Tabelas Principais

**gf_cost_categories**
- Armazena a taxonomia completa de custos
- Estrutura hierárquica: grupo → categoria → subcategoria
- Campos: id, group_name, category, subcategory, unit, is_active

**gf_costs**
- Tabela fato de custos
- Dimensões: company_id, carrier_id, route_id, vehicle_id, driver_id, cost_category_id, cost_center_id
- Medidas: amount, qty, date
- Origem: manual, import, invoice, calc

**gf_budgets**
- Orçamentos por empresa, período e categoria
- Campos: company_id, period_month, period_year, category_id, amount_budgeted

#### Views

**v_costs_kpis**
- KPIs agregados: total_cost, cost_per_km, cost_per_trip, cost_per_passenger
- Últimos 30/90 dias

**v_costs_breakdown**
- Breakdown hierárquico por grupo/categoria/subcategoria
- Agregado por período (mês/ano)

**v_costs_vs_budget**
- Comparativo realizado vs orçado
- Mensal e YTD (Year-to-Date)

**v_costs_conciliation**
- Conciliação medido vs faturado
- Divergências calculadas automaticamente
- Flags de significância

**v_costs_secure**
- View segura com joins para nomes
- RLS aplicado via tabela base

#### Materialized Views

**mv_costs_monthly**
- Agregados mensais por dimensões
- Refresh via função `refresh_mv_costs_monthly()`
- Índices otimizados para consultas

### Row-Level Security (RLS)

Todas as tabelas de custos têm RLS ativado:
- Operadores: Acesso apenas às empresas mapeadas em `gf_user_company_map`
- Admins: Acesso a todas as empresas
- Políticas: SELECT, INSERT, UPDATE, DELETE baseados em `company_id`

### APIs

#### GET /api/costs/kpis
Retorna KPIs agregados para uma empresa.

**Query Params:**
- `company_id` (obrigatório): ID da empresa
- `period` (opcional): '30' ou '90' dias (padrão: '30')

**Resposta:**
```json
{
  "total_cost": 50000,
  "cost_per_km": 2.5,
  "cost_per_trip": 150,
  "cost_per_passenger": 3.2,
  "total_km": 20000,
  "total_trips": 333,
  "budget_variance": {
    "budgeted": 45000,
    "actual": 50000,
    "variance_percent": 11.1,
    "variance_absolute": 5000
  }
}
```

#### GET /api/costs/manual
Lista custos com filtros.

**Query Params:**
- `company_id` (obrigatório)
- `start_date`, `end_date`: Período
- `route_id`, `vehicle_id`, `driver_id`, `category_id`: Filtros opcionais
- `limit`, `offset`: Paginação

#### POST /api/costs/manual
Cria um custo manual.

**Body:**
```json
{
  "company_id": "uuid",
  "cost_category_id": "uuid",
  "date": "2024-01-15",
  "amount": 2500.00,
  "qty": 500,
  "unit": "litro",
  "route_id": "uuid (opcional)",
  "vehicle_id": "uuid (opcional)",
  "driver_id": "uuid (opcional)",
  "notes": "Observações (opcional)"
}
```

#### POST /api/costs/import
Importa custos via CSV/Excel.

**FormData:**
- `file`: Arquivo CSV
- `company_id`: ID da empresa
- `mapping` (opcional): Mapeamento de colunas

#### POST /api/costs/reconcile
Concilia uma fatura.

**Body:**
```json
{
  "invoice_id": "uuid",
  "route_id": "uuid (opcional)",
  "action": "approve" | "reject" | "request_revision",
  "notes": "Observações (opcional)"
}
```

#### GET /api/costs/export
Exporta custos em CSV/Excel/PDF.

**Query Params:**
- `company_id` (obrigatório)
- `format`: 'csv' | 'excel' | 'pdf'
- `filters` (JSON): Filtros aplicados

#### GET /api/costs/budgets
Lista orçamentos.

#### POST /api/costs/budgets
Cria/atualiza orçamento.

#### DELETE /api/costs/budgets
Remove orçamento.

### Componentes React

#### CostDashboard
Componente principal de KPIs e gráficos.

**Props:**
- `companyId`: ID da empresa
- `period`: '30' | '90' dias

**Funcionalidades:**
- Exibe 4 KPIs principais
- Gráfico de evolução mensal
- Gráfico de distribuição por grupo (pie chart)
- Alertas de orçamento

#### CostDetailTable
Tabela detalhada de custos com drill-down.

**Props:**
- `costs`: Array de custos
- `onReconcile`: Callback para conciliação
- `loading`: Estado de loading

**Funcionalidades:**
- Agrupamento por grupo ou categoria
- Ordenação por colunas
- Exportação CSV/Excel/PDF
- Virtualização para performance

#### CostFilters
Componente de filtros reutilizável.

**Props:**
- `onFiltersChange`: Callback quando filtros mudam
- `routes`, `vehicles`, `drivers`, `categories`, `carriers`: Opções de filtro

**Funcionalidades:**
- Presets de período (hoje, semana, mês, trimestre, ano)
- Filtros por dimensões
- Filtros customizados por data

#### ManualCostForm
Formulário para adicionar custo manual.

**Props:**
- `isOpen`: Estado do modal
- `onClose`: Callback ao fechar
- `onSave`: Callback ao salvar
- `companyId`: ID da empresa

#### ImportCostModal
Modal de importação CSV.

**Funcionalidades:**
- Upload de arquivo
- Preview de linhas válidas
- Validação e feedback de erros
- Progresso de importação

#### ReconciliationModal
Modal de conciliação de faturas.

**Funcionalidades:**
- Comparação medido vs faturado
- Detecção de divergências significativas
- Ações: aprovar, rejeitar, solicitar revisão
- Exportação de relatório

#### BudgetView
Visualização de orçamentos.

**Funcionalidades:**
- Gráfico realizado vs orçado
- Tabela de orçamentos cadastrados
- CRUD de orçamentos
- Cálculo de variações

### Bibliotecas Utilizadas

- **Recharts**: Gráficos (linha, barra, pizza)
- **React Hook Form**: Formulários (opcional)
- **Zod**: Validação de dados
- **PapaParse**: Parser de CSV
- **react-window**: Virtualização de tabelas (para performance)

### Performance

#### Otimizações

1. **Materialized Views**: Agregações pesadas pré-calculadas
2. **Índices**: Índices em todas as colunas de filtro
3. **Lazy Loading**: Componentes pesados carregados dinamicamente
4. **Virtualização**: Tabelas com muitas linhas (>1k)
5. **Paginação**: Server-side pagination nas APIs

#### Refresh de Materialized Views

A materialized view `mv_costs_monthly` é atualizada via cron:
- Endpoint: `/api/cron/refresh-costs-mv`
- Execução: Diária (configurar no Vercel Cron)
- Autenticação: Bearer token com `CRON_SECRET`

### Segurança

#### RLS (Row-Level Security)

Todas as queries são filtradas automaticamente por `company_id` via RLS:
- Operadores: Apenas empresas em `gf_user_company_map`
- Admins: Todas as empresas

#### Validação

- Validação Zod em todas as APIs
- Validação de permissões no servidor
- Sanitização de dados de entrada

#### Autenticação

- APIs protegidas por sessão Supabase
- Cron jobs protegidos por `CRON_SECRET`

### Migrations

#### v44_costs_taxonomy.sql
Cria tabelas base: `gf_cost_categories`, `gf_costs`, `gf_budgets`

#### v44_costs_rls.sql
Aplica RLS policies em todas as tabelas

#### v44_seed_cost_categories.sql
Seed inicial de todas as categorias (7 grupos)

#### v44_costs_views.sql
Cria views de agregação e conciliação

#### v44_costs_matviews.sql
Cria materialized view e função de refresh

### Testes

#### Unit Tests
- Cálculos (custo/km, variação vs orçamento, outliers)
- Validações Zod

#### E2E Tests
- Fluxo completo: import → visualizar → conciliar → export

### Próximos Passos

1. Implementar Centros de Custo
2. Implementar Auditoria
3. Adicionar mais visualizações (treemap, heatmap)
4. Otimizar queries de conciliação
5. Adicionar cache Redis para KPIs

