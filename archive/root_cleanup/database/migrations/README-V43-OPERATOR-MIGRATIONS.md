# Migrations v43 - Painel do Operador Multi-tenant

Este documento lista todas as migrations necessárias para implementar o painel do operador multi-tenant.

## Ordem de Execução

As migrations devem ser executadas **nesta ordem exata** devido às dependências entre elas:

### 1. Tabela de Mapeamento Usuário ↔ Empresa
**Arquivo:** `v43_gf_user_company_map.sql`

Cria a tabela `gf_user_company_map` que permite que um operador gerencie múltiplas empresas.

```bash
psql $DATABASE_URL -f database/migrations/v43_gf_user_company_map.sql
```

**O que faz:**
- Cria tabela `gf_user_company_map` (user_id, company_id)
- Habilita RLS na tabela
- Cria políticas de segurança
- Cria índices para performance
- Faz seed inicial de operadores existentes

---

### 2. Função de Verificação de Ownership
**Arquivo:** `v43_company_ownership_function.sql`

Cria a função utilitária `company_ownership()` usada em todas as policies RLS.

```bash
psql $DATABASE_URL -f database/migrations/v43_company_ownership_function.sql
```

**O que faz:**
- Cria função `company_ownership(cid uuid)` 
- Função verifica se o usuário autenticado tem acesso à empresa via `gf_user_company_map`
- Usada por todas as policies RLS

---

### 3. Tabela de Branding por Empresa
**Arquivo:** `v43_company_branding.sql`

Cria a tabela `gf_company_branding` para armazenar configurações visuais (logo, cores) por empresa.

```bash
psql $DATABASE_URL -f database/migrations/v43_company_branding.sql
```

**O que faz:**
- Cria tabela `gf_company_branding` (name, logo_url, primary_hex, accent_hex)
- Cria trigger para atualizar `updated_at`
- Habilita RLS com policies de SELECT/INSERT/UPDATE

---

### 4. Row Level Security (RLS) Completo
**Arquivo:** `v43_operator_rls_complete.sql`

Aplica RLS em todas as tabelas do operador usando a função `company_ownership()`.

```bash
psql $DATABASE_URL -f database/migrations/v43_operator_rls_complete.sql
```

**O que faz:**
- Habilita RLS nas seguintes tabelas:
  - `routes`
  - `trips`
  - `gf_employee_company`
  - `gf_alerts`
  - `gf_service_requests`
  - `gf_invoices`
  - `gf_invoice_lines`
  - `gf_operator_settings`
  - `gf_cost_centers`
  - `gf_operator_incidents`
  - `gf_assigned_carriers`
  - `gf_announcements`
  - `gf_announcement_templates`
  - `gf_announcement_reads`
  - `gf_holidays`
  - `gf_operator_audits`
  - `gf_operator_documents`
- Cria policies de SELECT/INSERT/UPDATE/DELETE para cada tabela

---

### 5. Views Seguras
**Arquivo:** `v43_operator_secure_views.sql`

Cria views que filtram dados automaticamente por empresa do operador.

```bash
psql $DATABASE_URL -f database/migrations/v43_operator_secure_views.sql
```

**O que faz:**
- Cria view `v_my_companies` - lista empresas acessíveis pelo usuário
- Cria view `v_operator_dashboard_kpis_secure` - KPIs filtrados por empresa
- Cria view `v_operator_routes_secure` - rotas filtradas
- Cria view `v_operator_alerts_secure` - alertas filtrados
- Cria view `v_operator_costs_secure` - custos filtrados
- Cria views `v_reports_*_secure` para relatórios:
  - `v_reports_delays_secure`
  - `v_reports_occupancy_secure`
  - `v_reports_not_boarded_secure`
  - `v_reports_efficiency_secure`
  - `v_reports_roi_sla_secure`

---

### 6. Materialized Views para KPIs
**Arquivo:** `v43_operator_kpi_matviews.sql`

Cria materialized view para cache de KPIs e função de refresh.

```bash
psql $DATABASE_URL -f database/migrations/v43_operator_kpi_matviews.sql
```

**O que faz:**
- Cria materialized view `mv_operator_kpis` baseada em `v_operator_dashboard_kpis_secure`
- Cria índice único para refresh concurrent
- Cria função `refresh_mv_operator_kpis()` para atualização
- Esta função deve ser chamada via cron (ex: Vercel Cron a cada 5 minutos)

---

### 7. Cache de Otimização de Rotas
**Arquivo:** `v43_route_optimization_cache.sql`

Cria tabela para cache de resultados de otimização de rotas.

```bash
psql $DATABASE_URL -f database/migrations/v43_route_optimization_cache.sql
```

**O que faz:**
- Cria tabela `gf_route_optimization_cache` (route_id, optimized_order, etas, cached_at)
- Habilita RLS com policies
- Cria índices para performance

---

### 8. Agendamento de Relatórios
**Arquivo:** `v43_report_scheduling.sql`

Cria tabelas para agendamento e histórico de relatórios.

```bash
psql $DATABASE_URL -f database/migrations/v43_report_scheduling.sql
```

**O que faz:**
- Cria tabela `gf_report_schedules` (company_id, report_key, cron, recipients[], is_active)
- Cria tabela `gf_report_history` (company_id, report_key, format, recipients, status, generated_at)
- Habilita RLS com policies
- Cria triggers para `updated_at`

---

## Execução em Lote

Para executar todas as migrations de uma vez:

```bash
# Ajuste o caminho conforme necessário
export DATABASE_URL="postgresql://user:password@host:port/database"

# Executar todas em ordem
psql $DATABASE_URL -f database/migrations/v43_gf_user_company_map.sql
psql $DATABASE_URL -f database/migrations/v43_company_ownership_function.sql
psql $DATABASE_URL -f database/migrations/v43_company_branding.sql
psql $DATABASE_URL -f database/migrations/v43_operator_rls_complete.sql
psql $DATABASE_URL -f database/migrations/v43_operator_secure_views.sql
psql $DATABASE_URL -f database/migrations/v43_operator_kpi_matviews.sql
psql $DATABASE_URL -f database/migrations/v43_route_optimization_cache.sql
psql $DATABASE_URL -f database/migrations/v43_report_scheduling.sql
```

## Verificação Pós-Migração

Após executar as migrations, verifique se tudo foi criado corretamente:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'gf_%' 
ORDER BY table_name;

-- Verificar views
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE 'v_operator%' OR viewname LIKE 'v_my_%' OR viewname LIKE 'v_reports_%'
ORDER BY viewname;

-- Verificar materialized views
SELECT matviewname 
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname;

-- Verificar função
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'company_ownership';

-- Testar função
SELECT company_ownership('seu-company-id-aqui'::uuid);
```

## Próximos Passos

Após executar as migrations:

1. **Configurar Vercel Cron** para refresh de KPIs:
   - Adicionar `CRON_SECRET` nas variáveis de ambiente
   - Configurar cron job no `vercel.json` (já configurado)
   - Endpoint: `/api/cron/refresh-kpis`

2. **Configurar Branding das Empresas:**
   ```sql
   INSERT INTO gf_company_branding (company_id, name, logo_url, primary_hex, accent_hex)
   VALUES ('company-id', 'Nome da Empresa', 'https://...', '#F97316', '#2E7D32');
   ```

3. **Mapear Operadores às Empresas:**
   ```sql
   INSERT INTO gf_user_company_map (user_id, company_id)
   VALUES ('user-id', 'company-id');
   ```

4. **Testar RLS:**
   - Fazer login como operador
   - Verificar se só vê dados da(s) empresa(s) mapeada(s)

## Notas Importantes

- ⚠️ **Nunca execute migrations em produção sem backup**
- ⚠️ **As migrations são idempotentes** (podem ser executadas múltiplas vezes com segurança)
- ⚠️ **A migration `v43_gf_user_company_map.sql` faz seed automático** de operadores existentes
- ⚠️ **A materialized view `mv_operator_kpis` precisa ser populada manualmente** após criação:
  ```sql
  REFRESH MATERIALIZED VIEW mv_operator_kpis;
  ```
  Ou aguardar o primeiro cron job (5 minutos)
