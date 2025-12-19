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
