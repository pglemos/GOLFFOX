# ⚠️ APLICAR MIGRATIONS URGENTEMENTE

**Status:** 🔴 **PENDENTE - REQUER AÇÃO IMEDIATA**

As migrations abaixo são **CRÍTICAS** porque o código já está usando essas tabelas:

- `gf_event_store` - Usado em `lib/events/event-store.ts`
- `gf_audit_log` - Usado em `lib/audit-log.ts`, `lib/middleware/dangerous-route-audit.ts`
- `gf_operational_alerts` - Usado em `lib/alerts/alert-manager.ts`
- `gf_web_vitals` - Usado em `app/api/analytics/web-vitals/route.ts`

---

## 🚀 Método Rápido (Recomendado)

### Opção 1: Via Supabase Dashboard (Mais Rápido)

1. **Acesse:** https://supabase.com/dashboard
2. **Selecione seu projeto**
3. **Vá em:** SQL Editor (menu lateral)
4. **Execute cada migration abaixo na ordem:**

#### Migration 1: Event Store
```sql
-- Copiar conteúdo completo de: supabase/migrations/20250115_event_store.sql
```

#### Migration 2: Tabelas Faltantes
```sql
-- Copiar conteúdo completo de: supabase/migrations/20250116_missing_tables.sql
```

5. **Verificar:** Execute a query abaixo para confirmar que as tabelas foram criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'gf_event_store',
    'gf_web_vitals',
    'gf_operational_alerts',
    'gf_audit_log'
  )
ORDER BY table_name;
```

**Resultado esperado:** 4 tabelas listadas

---

### Opção 2: Via Script Automatizado

#### Pré-requisitos:
Configure em `apps/web/.env.local`:

```env
# Opção A: DATABASE_URL (recomendado)
DATABASE_URL=postgresql://postgres:[SENHA]@db.[PROJECT_REF].supabase.co:5432/postgres

# Opção B: Ou use estas variáveis
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

**Como obter DATABASE_URL:**
1. Supabase Dashboard → Settings → Database
2. Copiar "Connection string" (modo "URI")
3. Substituir `[YOUR-PASSWORD]` pela senha real do banco

#### Executar:

```bash
# Método 1: PostgreSQL direto (requer DATABASE_URL)
npm run migrations:apply:direct

# Método 2: Via API (requer NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
node scripts/apply-migrations-via-api.js
```

---

## ✅ Validação Pós-Aplicação

Após aplicar as migrations, execute esta query no Supabase SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'gf_event_store',
    'gf_web_vitals',
    'gf_operational_alerts',
    'gf_audit_log'
  )
ORDER BY table_name;

-- Verificar índices
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'gf_event_store',
    'gf_web_vitals',
    'gf_operational_alerts',
    'gf_audit_log'
  )
ORDER BY tablename, indexname;

-- Verificar RLS policies
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'gf_event_store',
    'gf_web_vitals',
    'gf_operational_alerts',
    'gf_audit_log'
  )
ORDER BY tablename, policyname;
```

---

## 🐛 Troubleshooting

### Erro: "relation already exists"
**Solução:** A migration já foi aplicada. Pode ignorar ou usar `CREATE TABLE IF NOT EXISTS`.

### Erro: "permission denied"
**Solução:** Certifique-se de estar usando a service role key ou ter permissões de administrador.

### Erro: "syntax error"
**Solução:** Verifique se copiou o SQL completo. Alguns editores podem truncar.

---

## 📋 Checklist

- [ ] Migration `20250115_event_store.sql` aplicada
- [ ] Migration `20250116_missing_tables.sql` aplicada
- [ ] Tabela `gf_event_store` existe
- [ ] Tabela `gf_web_vitals` existe
- [ ] Tabela `gf_operational_alerts` existe
- [ ] Tabela `gf_audit_log` existe
- [ ] Índices criados corretamente
- [ ] RLS policies aplicadas
- [ ] Testado inserção de dados em cada tabela

---

**Última atualização:** 2025-01-27  
**Prioridade:** 🔴 CRÍTICA

