# Schema do Banco de Dados - GolfFox

**Data:** 2025-01-XX  
**Última atualização:** 2025-01-XX

---

## 📊 Visão Geral

O banco de dados utiliza **PostgreSQL** via **Supabase** com:
- **Row Level Security (RLS)** para isolamento multi-tenant
- **Views materializadas** para performance
- **Functions RPC** para lógica de negócio
- **Triggers** para auditoria e sincronização

---

## 🗂️ Tabelas Principais

### Autenticação e Usuários

#### `users`
Usuários do sistema (integrado com Supabase Auth)

**Colunas principais:**
- `id` (UUID, PK) - ID do usuário (mesmo do Supabase Auth)
- `email` (TEXT)
- `name` (TEXT)
- `role` (TEXT) - admin, empresa, transportadora, motorista, passageiro
- `company_id` (UUID, FK → companies.id)
- `transportadora_id` (UUID, FK → carriers.id)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

**RLS:** Sim, isolamento por company_id/transportadora_id

---

#### `companies`
Empresas contratantes

**Colunas principais:**
- `id` (UUID, PK)
- `name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

---

#### `carriers`
Transportadoras

**Colunas principais:**
- `id` (UUID, PK)
- `name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

---

### Gestão de Frota

#### `vehicles`
Veículos da frota

**Colunas principais:**
- `id` (UUID, PK)
- `plate` (TEXT, UNIQUE)
- `model` (TEXT)
- `year` (INTEGER)
- `carrier_id` (UUID, FK → carriers.id)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

---

#### `routes`
Rotas do sistema

**Colunas principais:**
- `id` (UUID, PK)
- `name` (TEXT)
- `company_id` (UUID, FK → companies.id)
- `carrier_id` (UUID, FK → carriers.id)
- `origin`, `destination` (TEXT)
- `origin_lat`, `origin_lng`, `destination_lat`, `destination_lng` (DOUBLE PRECISION)
- `polyline` (TEXT) - Polilinha do Google Maps
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

---

#### `trips`
Viagens realizadas

**Colunas principais:**
- `id` (UUID, PK)
- `route_id` (UUID, FK → routes.id)
- `vehicle_id` (UUID, FK → vehicles.id)
- `driver_id` (UUID, FK → users.id)
- `status` (TEXT) - scheduled, inProgress, completed, cancelled
- `started_at`, `completed_at` (TIMESTAMP)
- `created_at`, `updated_at` (TIMESTAMP)

---

### Sistema Financeiro

#### `gf_costs`
Custos do sistema

**Colunas principais:**
- `id` (UUID, PK)
- `category_id` (UUID, FK → gf_cost_categories.id)
- `route_id` (UUID, FK → routes.id)
- `vehicle_id` (UUID, FK → vehicles.id)
- `amount` (DECIMAL)
- `description` (TEXT)
- `date` (DATE)
- `company_id` (UUID, FK → companies.id)
- `carrier_id` (UUID, FK → carriers.id)
- `created_at`, `updated_at` (TIMESTAMP)

---

#### `gf_cost_categories`
Categorias de custos

**Colunas principais:**
- `id` (UUID, PK)
- `name` (TEXT)
- `icon` (TEXT)
- `color` (TEXT)
- `is_active` (BOOLEAN)

---

#### `gf_budgets`
Orçamentos

**Colunas principais:**
- `id` (UUID, PK)
- `company_id` (UUID, FK → companies.id)
- `carrier_id` (UUID, FK → carriers.id)
- `category_id` (UUID, FK → gf_cost_categories.id)
- `period_year` (INTEGER)
- `period_month` (INTEGER)
- `budgeted_amount` (DECIMAL)
- `alert_threshold_percent` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMP)

---

#### `gf_manual_revenues`
Receitas manuais

**Colunas principais:**
- `id` (UUID, PK)
- `company_id` (UUID, FK → companies.id)
- `carrier_id` (UUID, FK → carriers.id)
- `category` (TEXT)
- `description` (TEXT)
- `amount` (DECIMAL)
- `revenue_date` (DATE)
- `status` (TEXT) - confirmed, pending, cancelled
- `created_at`, `updated_at` (TIMESTAMP)

---

### Mobile e Funcionalidades

#### `gf_assistance_requests`
Solicitações de socorro

**Colunas principais:**
- `id` (UUID, PK)
- `trip_id` (UUID, FK → trips.id)
- `status` (TEXT)
- `severity` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

---

### Auditoria

#### `gf_audit_log`
Logs de auditoria

**Colunas principais:**
- `id` (UUID, PK)
- `actor_id` (UUID, FK → users.id)
- `action_type` (TEXT)
- `resource_type` (TEXT)
- `resource_id` (UUID)
- `details` (JSONB)
- `created_at` (TIMESTAMP)

---

## 🔍 Views e Materialized Views

### Views Materializadas

- `mv_operator_kpis` - KPIs do operador (atualizada via cron)
- `mv_costs_monthly` - Custos mensais agregados (atualizada via cron)

### Views Regulares

- `v_my_companies` - Empresas do usuário (com RLS)

---

## 🔐 Row Level Security (RLS)

### Políticas Implementadas

- **Isolamento por empresa:** Usuários veem apenas dados de sua empresa
- **Isolamento por transportadora:** Usuários veem apenas dados de sua transportadora
- **Admin bypass:** Admins veem todos os dados (via service role)

### Exemplo de Política

```sql
-- Usuários de empresa veem apenas dados de sua empresa
CREATE POLICY "Users see only their company data"
ON companies
FOR SELECT
USING (id = (SELECT company_id FROM users WHERE id = auth.uid()));
```

---

## 🔄 Functions RPC

### Funções Principais

- `refresh_mv_operator_kpis()` - Atualiza KPIs (chamada via cron)
- `refresh_mv_costs_monthly()` - Atualiza custos mensais (chamada via cron)
- `calculate_trip_summary()` - Calcula resumo de viagem

---

## 📝 Notas de Migrations

### Inconsistências Identificadas

- README menciona "v41-v74" mas há apenas 5 migrations
- Possível que migrations antigas tenham sido consolidadas
- Verificar histórico do Supabase para migrations anteriores

### Recomendações

1. Documentar todas as migrations aplicadas no Supabase
2. Criar script de verificação de estado do banco
3. Manter histórico de migrations aplicadas

---

## 🚀 Próximos Passos

1. Verificar estado atual do banco no Supabase
2. Comparar schema atual com migrations
3. Documentar diferenças (se houver)
4. Criar script de validação de schema

---

**Última atualização:** 2025-01-XX
