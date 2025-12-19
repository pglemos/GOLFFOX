# Runbook: Database Migration - GolfFox

**Última atualização:** 2025-01-XX

---

## 📋 Visão Geral

Este runbook descreve como aplicar migrations do banco de dados no Supabase.

---

## 📂 Localização das Migrations

**Diretório:** `supabase/migrations/`

**Arquivos:**
- `00_cleanup_financial_tables.sql`
- `20241203_add_address_columns.sql`
- `20241203_add_missing_columns.sql`
- `20241211_financial_system.sql`
- `20241215_mobile_tables.sql`

---

## 🚀 Aplicar Migrations

### Método 1: Supabase Dashboard (Recomendado)

1. **Acessar Supabase Dashboard**
   - [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecionar projeto

2. **Abrir SQL Editor**
   - Menu lateral → SQL Editor

3. **Aplicar em Ordem**
   - Executar cada migration na ordem:
     1. `00_cleanup_financial_tables.sql`
     2. `20241203_add_address_columns.sql`
     3. `20241203_add_missing_columns.sql`
     4. `20241211_financial_system.sql`
     5. `20241215_mobile_tables.sql`

4. **Verificar Execução**
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations 
   ORDER BY version;
   ```

### Método 2: Supabase CLI

```bash
# 1. Instalar Supabase CLI
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

### 1. Verificar Tabelas

```sql
-- Verificar tabelas principais
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'users', 'companies', 'carriers', 'vehicles', 
    'routes', 'trips', 'gf_costs', 'gf_budgets'
  )
ORDER BY table_name;
```

### 2. Verificar Views Materializadas

```sql
-- Verificar materialized views
SELECT matviewname 
FROM pg_matviews 
WHERE schemaname = 'public';
```

### 3. Verificar Funções RPC

```sql
-- Verificar funções
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION';
```

### 4. Verificar RLS Policies

```sql
-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🔄 Rollback de Migration

### Se algo der errado:

1. **Identificar Migration Problemática**
   - Verificar logs no Supabase Dashboard
   - Identificar qual migration falhou

2. **Reverter Manualmente**
   - Criar migration de rollback
   - Executar no SQL Editor

3. **Exemplo de Rollback**
   ```sql
   -- Se migration adicionou coluna
   ALTER TABLE table_name DROP COLUMN IF EXISTS column_name;
   
   -- Se migration criou tabela
   DROP TABLE IF EXISTS table_name CASCADE;
   ```

---

## 📝 Criar Nova Migration

### 1. Nomear Arquivo

**Formato:** `YYYYMMDD_description.sql`

**Exemplo:** `20250115_add_user_preferences.sql`

### 2. Estrutura da Migration

```sql
-- ============================================================
-- Migration: Descrição da Migration
-- Data: YYYY-MM-DD
-- Descrição: O que esta migration faz
-- ============================================================

-- 1. Criar tabela (se necessário)
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- colunas
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_table_name_column 
ON table_name(column_name);

-- 3. Criar RLS policies (se necessário)
CREATE POLICY "policy_name" ON table_name
FOR SELECT
USING (/* condição */);

-- 4. Comentários
COMMENT ON TABLE table_name IS 'Descrição da tabela';
```

### 3. Testar Localmente

- Aplicar migration em ambiente de desenvolvimento
- Testar funcionalidades afetadas
- Verificar que não quebrou nada

### 4. Aplicar em Produção

- Seguir processo de aplicação acima
- Fazer backup antes (se migration destrutiva)

---

## ⚠️ Boas Práticas

1. **Sempre usar `IF NOT EXISTS` / `IF EXISTS`**
   - Evita erros se migration já foi aplicada

2. **Não usar `DROP` sem `CASCADE` cuidadoso**
   - Pode quebrar dependências

3. **Testar em desenvolvimento primeiro**
   - Sempre testar localmente antes de produção

4. **Fazer backup antes de migrations destrutivas**
   - Especialmente `DROP TABLE`, `ALTER TABLE` grandes

5. **Documentar migrations complexas**
   - Adicionar comentários explicativos

---

## 🔍 Troubleshooting

### Migration Falha

1. **Verificar Logs**
   - Supabase Dashboard → Logs
   - Verificar erro específico

2. **Verificar Dependências**
   - Migration pode depender de outra
   - Verificar ordem de execução

3. **Verificar Permissões**
   - Service role key tem permissões?
   - RLS policies permitem operação?

### Tabela Já Existe

- Usar `CREATE TABLE IF NOT EXISTS`
- Ou verificar antes:
  ```sql
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'table_name'
    ) THEN
      CREATE TABLE table_name (...);
    END IF;
  END $$;
  ```

---

**Última atualização:** 2025-01-XX
