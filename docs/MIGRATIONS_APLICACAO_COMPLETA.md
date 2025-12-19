# Aplicação de Migrations - Status Completo

**Data:** 2025-01-16  
**Status:** ✅ Scripts Prontos para Aplicação

---

## 🎯 Objetivo

Aplicar as 2 migrations pendentes no banco Supabase de forma autônoma.

---

## ✅ Scripts Criados

### 1. `scripts/apply-migrations-direct.js` ⭐ PRINCIPAL

**Função:** Aplicar migrations diretamente via PostgreSQL

**Uso:**
```bash
npm run migrations:apply:direct
```

**Requisitos:**
- `DATABASE_URL` ou `SUPABASE_DB_URL` configurado em `.env.local`

**Funcionalidades:**
- ✅ Conecta ao Supabase via PostgreSQL
- ✅ Aplica migrations na ordem
- ✅ Detecta migrations já aplicadas
- ✅ Verifica tabelas criadas
- ✅ Gera relatório completo

---

### 2. `scripts/apply-migrations-supabase.js`

**Função:** Alternativa usando configuração do Supabase

**Uso:**
```bash
node scripts/apply-migrations-supabase.js
```

---

## 📋 Migrations a Aplicar

### 1. `20250115_event_store.sql`
- **Tabela:** `gf_event_store`
- **Tamanho:** ~2.5 KB
- **Status:** ⏳ Pendente

### 2. `20250116_missing_tables.sql`
- **Tabelas:** 5 tabelas principais
- **Tamanho:** ~12 KB
- **Status:** ⏳ Pendente

---

## 🚀 Como Aplicar

### Opção 1: Script Automatizado (Recomendado)

```bash
# 1. Configurar DATABASE_URL
# Editar apps/web/.env.local:
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# 2. Aplicar
npm run migrations:apply:direct
```

### Opção 2: Supabase Dashboard (Manual)

1. Acessar [Supabase Dashboard](https://supabase.com/dashboard)
2. SQL Editor
3. Copiar conteúdo de cada migration
4. Executar

Ver: `docs/MIGRATION_INSTRUCTIONS.md`

---

## ✅ Verificação Pós-Aplicação

### Automática (via script)

O script verifica automaticamente se as tabelas foram criadas.

### Manual (via SQL)

```sql
-- Executar no Supabase SQL Editor
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
```

---

## 📊 Resultado Esperado

Após aplicação bem-sucedida:

```
✅ Aplicadas: 2
⏭️  Puladas: 0
❌ Erros: 0

🔍 Verificação: ✅ Todas as tabelas criadas

🎉 Migrations aplicadas com sucesso!
```

---

## 🔧 Configuração Necessária

### Arquivo: `apps/web/.env.local`

```env
# Opção 1: DATABASE_URL completo
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Opção 2: SUPABASE_DB_URL
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**Como obter:**
1. Supabase Dashboard → Settings → Database
2. Copiar "Connection string" (URI)
3. Substituir `[YOUR-PASSWORD]` pela senha real

---

## 🐛 Troubleshooting

### "DATABASE_URL não configurado"
→ Configurar em `apps/web/.env.local`

### "Connection refused"
→ Verificar URL e senha

### "Migration já aplicada"
→ Normal, script detecta e pula

---

## 📝 Próximos Passos

Após aplicar migrations:

1. ✅ Verificar tabelas criadas
2. ✅ Testar funcionalidades que usam as novas tabelas
3. ✅ Monitorar logs de erro
4. ✅ Verificar performance

---

**Status:** ✅ Scripts prontos, aguardando configuração de DATABASE_URL
