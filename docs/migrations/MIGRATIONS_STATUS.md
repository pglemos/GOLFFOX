# Status das Migrations - GolfFox

**Data:** 2025-01-XX  
**Última atualização:** 2025-01-XX

---

## 📊 Resumo

- **Total de migrations:** 5 arquivos
- **Ordem de execução:** Por data/nome
- **Status:** Todas devem ser aplicadas em ordem

---

## 📋 Lista de Migrations

### 1. `00_cleanup_financial_tables.sql`
**Data:** Inicial  
**Descrição:** Limpeza de tabelas financeiras antigas  
**Status:** ✅ Deve ser aplicada primeiro

**Conteúdo:**
- Remove tabelas antigas se existirem
- Prepara ambiente para novo sistema financeiro

---

### 2. `20241203_add_address_columns.sql`
**Data:** 2024-12-03  
**Descrição:** Adiciona colunas de endereço  
**Status:** ✅ Deve ser aplicada

**Conteúdo:**
- Adiciona colunas de endereço em tabelas relevantes
- Suporte para endereços completos (CEP, rua, número, etc.)

---

### 3. `20241203_add_missing_columns.sql`
**Data:** 2024-12-03  
**Descrição:** Adiciona colunas faltantes  
**Status:** ✅ Deve ser aplicada

**Conteúdo:**
- Adiciona colunas que faltavam em várias tabelas
- Garante compatibilidade com funcionalidades

---

### 4. `20241211_financial_system.sql`
**Data:** 2024-12-11  
**Descrição:** Sistema financeiro completo  
**Status:** ✅ Deve ser aplicada

**Conteúdo:**
- Tabelas de custos (`gf_costs`, `gf_cost_categories`)
- Tabelas de orçamentos (`gf_budgets`)
- Tabelas de receitas (`gf_manual_revenues`)
- Views materializadas para KPIs
- Functions RPC para cálculos

---

### 5. `20241215_mobile_tables.sql`
**Data:** 2024-12-15  
**Descrição:** Tabelas para app mobile  
**Status:** ✅ Deve ser aplicada

**Conteúdo:**
- Tabelas para funcionalidades mobile
- Suporte para checklists, checkins, etc.

---

## 🔍 Como Verificar Status

### Verificar migrations aplicadas no Supabase

```sql
-- No Supabase SQL Editor, execute:
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version;
```

### Verificar se tabelas existem

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

### Verificar views materializadas

```sql
-- Verificar materialized views
SELECT matviewname 
FROM pg_matviews 
WHERE schemaname = 'public';
```

---

## 🚀 Como Aplicar Migrations

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Execute cada migration em ordem:
   - `00_cleanup_financial_tables.sql`
   - `20241203_add_address_columns.sql`
   - `20241203_add_missing_columns.sql`
   - `20241211_financial_system.sql`
   - `20241215_mobile_tables.sql`

### Opção 2: Via Supabase CLI

```bash
# Se tiver Supabase CLI configurado
supabase db reset
# ou
supabase migration up
```

### Opção 3: Via Script

```bash
cd apps/web
npm run db:migrate
```

---

## ⚠️ Notas Importantes

1. **Ordem é crítica:** Execute migrations na ordem listada
2. **Backup:** Faça backup do banco antes de aplicar migrations em produção
3. **Teste primeiro:** Teste migrations em ambiente de desenvolvimento
4. **Dependências:** Algumas migrations dependem de outras

---

## 📝 Checklist de Aplicação

- [ ] Backup do banco criado
- [ ] Migration `00_cleanup_financial_tables.sql` aplicada
- [ ] Migration `20241203_add_address_columns.sql` aplicada
- [ ] Migration `20241203_add_missing_columns.sql` aplicada
- [ ] Migration `20241211_financial_system.sql` aplicada
- [ ] Migration `20241215_mobile_tables.sql` aplicada
- [ ] Verificação de tabelas executada
- [ ] Verificação de views executada
- [ ] Testes de funcionalidade executados

---

## 🔗 Referências

- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Última atualização:** 2025-01-XX
