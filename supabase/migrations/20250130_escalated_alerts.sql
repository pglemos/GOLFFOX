-- ============================================================
-- Migration: Tabela de Alertas Escalados
-- Data: 2025-01-30
-- Descrição: Cria tabela para gerenciar alertas escalados de transportadoras e empresas
-- ============================================================

-- ============================================================
-- 1. gf_escalated_alerts - Alertas Escalados
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gf_escalated_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Tipo e dados do alerta
  type VARCHAR(50) NOT NULL, -- 'sla_violation', 'document_expired', 'maintenance_overdue', 'complaint', etc.
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  -- Origem do alerta
  source VARCHAR(20) NOT NULL CHECK (source IN ('transportadora', 'empresa')),
  source_id UUID, -- ID da transportadora ou empresa
  source_name VARCHAR(255) NOT NULL, -- Nome da transportadora ou empresa
  -- Status e resolução
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolution TEXT, -- Descrição da resolução
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_escalated_alerts_status ON public.gf_escalated_alerts(status);
CREATE INDEX IF NOT EXISTS idx_escalated_alerts_severity ON public.gf_escalated_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_escalated_alerts_source ON public.gf_escalated_alerts(source, source_id);
CREATE INDEX IF NOT EXISTS idx_escalated_alerts_created ON public.gf_escalated_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalated_alerts_pending ON public.gf_escalated_alerts(status) WHERE status IN ('pending', 'in_progress');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_escalated_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_escalated_alerts_updated_at
  BEFORE UPDATE ON public.gf_escalated_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_escalated_alerts_updated_at();

-- Comentários
COMMENT ON TABLE public.gf_escalated_alerts IS 'Alertas escalados de transportadoras e empresas para administração';
COMMENT ON COLUMN public.gf_escalated_alerts.type IS 'Tipo do alerta (sla_violation, document_expired, etc.)';
COMMENT ON COLUMN public.gf_escalated_alerts.severity IS 'Severidade do alerta (low, medium, high, critical)';
COMMENT ON COLUMN public.gf_escalated_alerts.source IS 'Origem do alerta (transportadora ou empresa)';
COMMENT ON COLUMN public.gf_escalated_alerts.status IS 'Status do alerta (pending, in_progress, resolved, dismissed)';

-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.gf_escalated_alerts ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ler todos os alertas escalados
CREATE POLICY "escalated_alerts_admin_read" ON public.gf_escalated_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Política: Apenas admins podem inserir alertas escalados
CREATE POLICY "escalated_alerts_admin_insert" ON public.gf_escalated_alerts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Política: Apenas admins podem atualizar alertas escalados
CREATE POLICY "escalated_alerts_admin_update" ON public.gf_escalated_alerts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Política: Apenas admins podem deletar alertas escalados
CREATE POLICY "escalated_alerts_admin_delete" ON public.gf_escalated_alerts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

