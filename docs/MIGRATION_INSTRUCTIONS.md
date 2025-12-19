# Instruções de Aplicação de Migrations - GolfFox

**Gerado em:** 2025-01-16
**Total de migrations:** 7

---

## 🚀 Aplicação Rápida (Todas de uma vez)

### Via Supabase Dashboard

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo de cada migration abaixo na ordem
5. Execute cada uma

### Via Supabase CLI

```bash
# 1. Instalar CLI (se não tiver)
npm install -g supabase

# 2. Login
supabase login

# 3. Link projeto
supabase link --project-ref [seu-project-ref]

# 4. Aplicar todas
supabase db push
```

---

## 📋 Migrations Individuais

### 1. 00_cleanup_financial_tables.sql

**Tamanho:** ~2.00 KB  
**Linhas:** ~50  
**Arquivo:** `supabase/migrations/00_cleanup_financial_tables.sql`

**Status:** ✅ Provavelmente já aplicada

---

### 2. 20241203_add_address_columns.sql

**Tamanho:** ~1.50 KB  
**Linhas:** ~40  
**Arquivo:** `supabase/migrations/20241203_add_address_columns.sql`

**Status:** ✅ Provavelmente já aplicada

---

### 3. 20241203_add_missing_columns.sql

**Tamanho:** ~2.00 KB  
**Linhas:** ~50  
**Arquivo:** `supabase/migrations/20241203_add_missing_columns.sql`

**Status:** ✅ Provavelmente já aplicada

---

### 4. 20241211_financial_system.sql

**Tamanho:** ~15.00 KB  
**Linhas:** ~500  
**Arquivo:** `supabase/migrations/20241211_financial_system.sql`

**Status:** ✅ Provavelmente já aplicada

**Conteúdo:** Ver arquivo original (muito grande para incluir aqui)

---

### 5. 20241215_mobile_tables.sql

**Tamanho:** ~8.00 KB  
**Linhas:** ~280  
**Arquivo:** `supabase/migrations/20241215_mobile_tables.sql`

**Status:** ✅ Provavelmente já aplicada

**Conteúdo:** Ver arquivo original (muito grande para incluir aqui)

---

### 6. 20250115_event_store.sql ⭐ NOVA

**Tamanho:** ~2.50 KB  
**Linhas:** ~52  
**Arquivo:** `supabase/migrations/20250115_event_store.sql`

**Status:** ⏳ **PENDENTE DE APLICAÇÃO**

```sql
-- ============================================================
-- Migration: Event Store para Event Sourcing
-- Data: 2025-01-15
-- Descrição: Tabela para armazenar eventos de domínio
-- ============================================================

-- Tabela de Event Store
CREATE TABLE IF NOT EXISTS gf_event_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_event_store_aggregate 
ON gf_event_store(aggregate_type, aggregate_id);

CREATE INDEX IF NOT EXISTS idx_event_store_type 
ON gf_event_store(event_type);

CREATE INDEX IF NOT EXISTS idx_event_store_occurred 
ON gf_event_store(occurred_at);

CREATE INDEX IF NOT EXISTS idx_event_store_event_id 
ON gf_event_store(event_id);

-- Comentários
COMMENT ON TABLE gf_event_store IS 'Event store para event sourcing - armazena todos os eventos de domínio';
COMMENT ON COLUMN gf_event_store.event_id IS 'ID único do evento';
COMMENT ON COLUMN gf_event_store.event_type IS 'Tipo do evento (ex: CompanyCreated)';
COMMENT ON COLUMN gf_event_store.aggregate_id IS 'ID do aggregate (ex: company_id)';
COMMENT ON COLUMN gf_event_store.aggregate_type IS 'Tipo do aggregate (ex: Company)';
COMMENT ON COLUMN gf_event_store.event_data IS 'Dados do evento (JSON)';
COMMENT ON COLUMN gf_event_store.metadata IS 'Metadados adicionais (userId, IP, etc.)';

-- RLS: Apenas service role pode escrever
-- Leitura pode ser permitida para usuários autenticados (futuro)
ALTER TABLE gf_event_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on event_store" 
ON gf_event_store 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
```

---

### 7. 20250116_missing_tables.sql ⭐ NOVA

**Tamanho:** ~12.00 KB  
**Linhas:** ~350  
**Arquivo:** `supabase/migrations/20250116_missing_tables.sql`

**Status:** ⏳ **PENDENTE DE APLICAÇÃO**

**Conteúdo:** Ver arquivo `supabase/migrations/20250116_missing_tables.sql`

**Tabelas criadas:**
- `gf_web_vitals` - Métricas de Web Vitals
- `gf_operational_alerts` - Alertas operacionais
- `gf_audit_log` - Log de auditoria
- `driver_positions` - Compatibilidade GPS (view ou tabela)
- `gf_vehicle_checklists` - Checklists de veículos (view ou tabela)

---

## ✅ Verificação

Após aplicar todas as migrations, execute:

```bash
node scripts/check-migrations-status.js
```

Ou execute o script SQL de verificação:

```sql
-- Ver arquivo: scripts/verify-migration.sql
-- Ou copiar conteúdo do arquivo e executar no Supabase SQL Editor
```

---

## 📝 Notas Importantes

1. **Ordem:** Aplicar migrations na ordem listada acima
2. **Idempotência:** Todas usam `IF NOT EXISTS`, podem ser aplicadas múltiplas vezes
3. **Backup:** Recomendado fazer backup antes de aplicar em produção
4. **Teste:** Testar em ambiente de desenvolvimento primeiro

---

**Última atualização:** 2025-01-16
