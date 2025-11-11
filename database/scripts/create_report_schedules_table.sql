-- Script para criar tabela de agendamento de relatórios
-- Baseado em v43_report_scheduling.sql

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.gf_report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  report_key VARCHAR(50) NOT NULL,
  cron VARCHAR(50) NOT NULL, -- formato cron: "0 9 * * 1" (segunda-feira às 9h)
  recipients TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  CONSTRAINT valid_report_key CHECK (report_key IN ('delays', 'occupancy', 'not_boarded', 'efficiency', 'driver_ranking'))
);

-- Tabela de histórico de execuções
CREATE TABLE IF NOT EXISTS public.gf_report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.gf_report_schedules(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  report_key VARCHAR(50) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_url TEXT,
  file_storage_path TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed
  error_message TEXT,
  recipients TEXT[],
  format VARCHAR(10) NOT NULL DEFAULT 'csv', -- csv, excel, pdf
  record_count INT,
  file_size_bytes BIGINT,
  CONSTRAINT valid_report_key CHECK (report_key IN ('delays', 'occupancy', 'not_boarded', 'efficiency', 'driver_ranking')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed')),
  CONSTRAINT valid_format CHECK (format IN ('csv', 'excel', 'pdf'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_gf_report_schedules_company ON public.gf_report_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_gf_report_schedules_active ON public.gf_report_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gf_report_history_company ON public.gf_report_history(company_id);
CREATE INDEX IF NOT EXISTS idx_gf_report_history_schedule ON public.gf_report_history(schedule_id);

-- Verificar se as tabelas foram criadas
SELECT 
  'gf_report_schedules' AS table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_report_schedules'
  ) THEN '✅ Criada' ELSE '❌ Não criada' END AS status
UNION ALL
SELECT 
  'gf_report_history' AS table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_report_history'
  ) THEN '✅ Criada' ELSE '❌ Não criada' END AS status;

