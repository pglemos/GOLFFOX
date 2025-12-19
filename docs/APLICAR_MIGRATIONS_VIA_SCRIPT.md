# Aplicar Migrations via Script - GolfFox

**Última atualização:** 2025-01-16

---

## 🚀 Método Rápido (Script Automatizado)

### Pré-requisitos

1. **Configurar DATABASE_URL**

   Crie ou edite `apps/web/.env.local`:

   ```env
   DATABASE_URL=postgresql://postgres:[SENHA]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```

   Ou:

   ```env
   SUPABASE_DB_URL=postgresql://postgres:[SENHA]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```

   **Como obter a senha:**
   - Supabase Dashboard → Settings → Database
   - Copiar "Connection string" (modo "URI")
   - Substituir `[YOUR-PASSWORD]` pela senha real

2. **Instalar dependências** (se necessário)

   ```bash
   npm install pg dotenv
   ```

### Aplicar Migrations

```bash
# Aplicar migrations pendentes
npm run migrations:apply:direct

# Ou diretamente
node scripts/apply-migrations-direct.js
```

O script irá:
- ✅ Conectar ao banco Supabase
- ✅ Aplicar `20250115_event_store.sql`
- ✅ Aplicar `20250116_missing_tables.sql`
- ✅ Verificar se tabelas foram criadas
- ✅ Mostrar resumo completo

---

## 📋 O Que Será Aplicado

### Migration 1: `20250115_event_store.sql`
- Tabela `gf_event_store` para Event Sourcing
- 4 índices para performance
- RLS policies

### Migration 2: `20250116_missing_tables.sql`
- `gf_web_vitals` - Métricas Web Vitals
- `gf_operational_alerts` - Alertas operacionais
- `gf_audit_log` - Log de auditoria
- `driver_positions` - Compatibilidade GPS
- `gf_vehicle_checklists` - Checklists
- RLS policies e triggers

---

## ✅ Verificação

Após aplicar, o script verifica automaticamente se as tabelas foram criadas.

Para verificação manual:

```sql
-- Executar no Supabase SQL Editor
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

---

## 🐛 Troubleshooting

### Erro: "DATABASE_URL não configurado"

**Solução:**
1. Verificar se `.env.local` existe em `apps/web/`
2. Adicionar `DATABASE_URL` ou `SUPABASE_DB_URL`
3. Formato: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

### Erro: "Connection refused" ou "ENOTFOUND"

**Solução:**
1. Verificar se a URL está correta
2. Verificar se o projeto Supabase está ativo
3. Verificar firewall/rede

### Erro: "password authentication failed"

**Solução:**
1. Verificar se a senha está correta
2. Obter nova senha em Supabase Dashboard → Settings → Database

### Migration já aplicada

**Normal:** O script detecta automaticamente e pula migrations já aplicadas.

---

## 🔄 Alternativa: Supabase Dashboard

Se o script não funcionar, use o método manual:

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. SQL Editor
3. Copiar conteúdo de cada migration
4. Executar

Ver: `docs/MIGRATION_INSTRUCTIONS.md`

---

## 📝 Notas

- ✅ Migrations são idempotentes (podem ser aplicadas múltiplas vezes)
- ✅ Script detecta migrations já aplicadas
- ✅ Verificação automática de tabelas criadas
- ✅ Logs detalhados de cada passo

---

**Status:** ✅ Script pronto para uso
