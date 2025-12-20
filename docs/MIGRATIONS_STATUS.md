# Status das Migrations - GolfFox

**Última atualização:** 2025-01-16

---

## 📋 Migrations Disponíveis

### Migrations Existentes (6 arquivos)

1. **`00_cleanup_financial_tables.sql`**
   - Limpeza de tabelas financeiras antigas
   - Status: ✅ Base

2. **`20241203_add_address_columns.sql`**
   - Adiciona colunas de endereço
   - Status: ✅ Base

3. **`20241203_add_missing_columns.sql`**
   - Adiciona colunas faltantes
   - Status: ✅ Base

4. **`20241211_financial_system.sql`**
   - Sistema financeiro completo (custos, receitas, orçamentos)
   - Status: ✅ Base

5. **`20241215_mobile_tables.sql`**
   - Tabelas para app mobile (check-ins, checklists, GPS, mensagens)
   - Status: ✅ Base

6. **`20250115_event_store.sql`** ⭐ NOVA
   - Tabela para Event Sourcing
   - Status: ⏳ **PENDENTE DE APLICAÇÃO**

7. **`20250116_missing_tables.sql`** ⭐ NOVA
   - Tabelas faltantes referenciadas no código:
     - `gf_web_vitals` - Métricas de Web Vitals
     - `gf_operational_alerts` - Alertas operacionais
     - `gf_audit_log` - Log de auditoria
     - `driver_positions` - Compatibilidade GPS
     - `gf_vehicle_checklists` - Checklists de veículos
   - Status: ⏳ **PENDENTE DE APLICAÇÃO**

---

## 🚀 Aplicar Migrations

### Método 1: Script Automatizado (Recomendado)

```bash
# 1. Verificar status atual
node scripts/check-migrations-status.js

# 2. Aplicar todas as migrations
node scripts/apply-migrations.js
```

**Requisitos:**
- Variáveis de ambiente configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Método 2: Supabase Dashboard

1. Acessar [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecionar projeto
3. Abrir SQL Editor
4. Aplicar migrations na ordem:

```sql
-- 1. Event Store
-- Copiar conteúdo de: supabase/migrations/20250115_event_store.sql

-- 2. Tabelas Faltantes
-- Copiar conteúdo de: supabase/migrations/20250116_missing_tables.sql
```

### Método 3: Supabase CLI

```bash
# 1. Instalar CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link projeto
supabase link --project-ref [project-ref]

# 4. Aplicar migrations
supabase db push
```

---

## ✅ Verificação Pós-Migration

### Script SQL de Verificação

Execute no Supabase SQL Editor:

```sql
-- Arquivo: scripts/verify-migration.sql
-- Ou copiar conteúdo do arquivo
```

### Verificação Manual

```sql
-- 1. Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'gf_event_store',
    'gf_web_vitals',
    'gf_operational_alerts',
    'gf_audit_log',
    'driver_positions',
    'gf_vehicle_checklists'
  )
ORDER BY table_name;

-- 2. Verificar índices
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'gf_event_store',
    'gf_web_vitals',
    'gf_operational_alerts',
    'gf_audit_log'
  )
ORDER BY tablename, indexname;

-- 3. Verificar RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'gf_event_store',
    'gf_web_vitals',
    'gf_operational_alerts',
    'gf_audit_log'
  );
```

---

## 📊 Tabelas Criadas pelas Novas Migrations

### `gf_event_store`
- **Propósito:** Armazenar eventos de domínio para Event Sourcing
- **Colunas principais:** `event_id`, `event_type`, `aggregate_id`, `event_data`
- **Índices:** 4 índices para performance
- **RLS:** Apenas service role

### `gf_web_vitals`
- **Propósito:** Coletar métricas Core Web Vitals do frontend
- **Colunas principais:** `url`, `metrics` (JSONB), `timestamp`
- **Índices:** 3 índices
- **RLS:** Apenas service role

### `gf_operational_alerts`
- **Propósito:** Alertas operacionais (performance, segurança, erros)
- **Colunas principais:** `type`, `severity`, `title`, `message`, `details`
- **Índices:** 6 índices
- **RLS:** Service role + leitura para autenticados

### `gf_audit_log`
- **Propósito:** Log de auditoria de todas as ações
- **Colunas principais:** `action`, `entity_type`, `user_id`, `details`
- **Índices:** 5 índices
- **RLS:** Apenas service role

### `driver_positions`
- **Propósito:** Compatibilidade para rastreamento GPS
- **Tipo:** View ou tabela (depende de `driver_locations`)
- **Uso:** Mobile app (LocationService)

### `gf_vehicle_checklists`
- **Propósito:** Checklists de verificação pré-viagem
- **Tipo:** View ou tabela (depende de `vehicle_checklists`)
- **Uso:** Mobile app (motorista checklist)

---

## 🔄 Ordem de Aplicação

**IMPORTANTE:** Aplicar migrations na ordem:

1. ✅ `00_cleanup_financial_tables.sql` (já aplicada)
2. ✅ `20241203_add_address_columns.sql` (já aplicada)
3. ✅ `20241203_add_missing_columns.sql` (já aplicada)
4. ✅ `20241211_financial_system.sql` (já aplicada)
5. ✅ `20241215_mobile_tables.sql` (já aplicada)
6. ⏳ `20250115_event_store.sql` (PENDENTE)
7. ⏳ `20250116_missing_tables.sql` (PENDENTE)

---

## ⚠️ Notas Importantes

1. **Idempotência:** Todas as migrations usam `IF NOT EXISTS`, então podem ser aplicadas múltiplas vezes sem erro

2. **Dependências:** 
   - `20250116_missing_tables.sql` pode criar views se `driver_locations` ou `vehicle_checklists` já existirem
   - Isso garante compatibilidade com código existente

3. **RLS:** Todas as novas tabelas têm RLS habilitado com políticas para service role

4. **Backup:** Recomendado fazer backup antes de aplicar migrations em produção

---

## 🐛 Troubleshooting

### Erro: "relation already exists"
- **Causa:** Migration já foi aplicada parcialmente
- **Solução:** Migration usa `IF NOT EXISTS`, então é seguro executar novamente

### Erro: "permission denied"
- **Causa:** Service role key não tem permissões
- **Solução:** Verificar `SUPABASE_SERVICE_ROLE_KEY` está correto

### Erro: "function does not exist"
- **Causa:** Função `update_updated_at_column()` não existe
- **Solução:** Migration cria a função automaticamente

---

## 📝 Próximos Passos

Após aplicar as migrations:

1. ✅ Verificar status com `scripts/check-migrations-status.js`
2. ✅ Testar funcionalidades que usam as novas tabelas
3. ✅ Verificar logs de erro no Supabase Dashboard
4. ✅ Monitorar performance das queries

---

**Status:** ⏳ 2 migrations pendentes de aplicação
