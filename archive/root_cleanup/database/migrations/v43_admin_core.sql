-- Migration: v43_admin_core
-- Core tables para admin: custos, faturas, manutenção, checklists, documentos, incidentes, audit log
-- Idempotente: usa IF NOT EXISTS e verifica existência antes de alterar

-- ============================================
-- GF_COST_CENTERS (verificar se existe, ajustar se necessário)
-- ============================================
-- Tabela já existe em gf_operator_tables.sql, mas vamos garantir estrutura correta
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_cost_centers'
  ) THEN
    CREATE TABLE public.gf_cost_centers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
      code varchar(50) NOT NULL,
      name varchar(255) NOT NULL,
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now(),
      UNIQUE(company_id, code)
    );
    
    CREATE INDEX IF NOT EXISTS idx_gf_cost_centers_company 
      ON public.gf_cost_centers(company_id);
  END IF;
END $$;

-- ============================================
-- GF_INVOICES (atualizar para incluir carrier_id se não existir)
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_invoices'
  ) THEN
    CREATE TABLE public.gf_invoices (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      carrier_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
      empresa_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
      invoice_number varchar(50) UNIQUE,
      period_start date NOT NULL,
      period_end date NOT NULL,
      total_amount numeric(12, 2) NOT NULL DEFAULT 0,
      status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reconciled', 'approved', 'rejected', 'paid')),
      reconciled_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
      approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
      approved_at timestamptz,
      notes text,
      created_at timestamptz DEFAULT now()
    );
    
    CREATE INDEX IF NOT EXISTS idx_gf_invoices_carrier 
      ON public.gf_invoices(carrier_id);
    CREATE INDEX IF NOT EXISTS idx_gf_invoices_empresa 
      ON public.gf_invoices(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_gf_invoices_status 
      ON public.gf_invoices(status);
    CREATE INDEX IF NOT EXISTS idx_gf_invoices_period 
      ON public.gf_invoices(period_start, period_end);
  ELSE
    -- Adicionar carrier_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_invoices' AND column_name = 'carrier_id'
    ) THEN
      ALTER TABLE public.gf_invoices 
        ADD COLUMN carrier_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_gf_invoices_carrier 
        ON public.gf_invoices(carrier_id);
    END IF;
    
    -- Adicionar índices de período se não existirem
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'gf_invoices' 
      AND indexname = 'idx_gf_invoices_period'
    ) THEN
      CREATE INDEX idx_gf_invoices_period 
        ON public.gf_invoices(period_start, period_end);
    END IF;
  END IF;
END $$;

-- ============================================
-- GF_INVOICE_LINES (verificar estrutura)
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_invoice_lines'
  ) THEN
    CREATE TABLE public.gf_invoice_lines (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id uuid NOT NULL REFERENCES public.gf_invoices(id) ON DELETE CASCADE,
      route_id uuid REFERENCES public.routes(id) ON DELETE SET NULL,
      measured_km numeric(10, 2),
      invoiced_km numeric(10, 2),
      measured_time integer, -- minutos
      invoiced_time integer,
      measured_trips integer,
      invoiced_trips integer,
      amount numeric(12, 2) NOT NULL DEFAULT 0,
      discrepancy numeric(12, 2), -- diferença entre medido e faturado
      notes text,
      created_at timestamptz DEFAULT now()
    );
    
    CREATE INDEX IF NOT EXISTS idx_gf_invoice_lines_invoice 
      ON public.gf_invoice_lines(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_gf_invoice_lines_route 
      ON public.gf_invoice_lines(route_id);
  ELSE
    -- Garantir que campos existem
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_invoice_lines' AND column_name = 'measured_km'
    ) THEN
      ALTER TABLE public.gf_invoice_lines ADD COLUMN measured_km numeric(10, 2);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_invoice_lines' AND column_name = 'invoiced_km'
    ) THEN
      ALTER TABLE public.gf_invoice_lines ADD COLUMN invoiced_km numeric(10, 2);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_invoice_lines' AND column_name = 'measured_time'
    ) THEN
      ALTER TABLE public.gf_invoice_lines ADD COLUMN measured_time integer;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_invoice_lines' AND column_name = 'invoiced_time'
    ) THEN
      ALTER TABLE public.gf_invoice_lines ADD COLUMN invoiced_time integer;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_invoice_lines' AND column_name = 'measured_trips'
    ) THEN
      ALTER TABLE public.gf_invoice_lines ADD COLUMN measured_trips integer;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_invoice_lines' AND column_name = 'discrepancy'
    ) THEN
      ALTER TABLE public.gf_invoice_lines ADD COLUMN discrepancy numeric(12, 2);
    END IF;
  END IF;
END $$;

-- ============================================
-- GF_VEHICLE_MAINTENANCE (adaptar estrutura existente)
-- ============================================
-- Adicionar campos type, due_at, status se não existirem
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_vehicle_maintenance'
  ) THEN
    -- Adicionar type (alias para maintenance_type se não existir)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_vehicle_maintenance' AND column_name = 'type'
    ) THEN
      ALTER TABLE public.gf_vehicle_maintenance ADD COLUMN type varchar(50);
      -- Copiar valores de maintenance_type se existir
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gf_vehicle_maintenance' AND column_name = 'maintenance_type'
      ) THEN
        UPDATE public.gf_vehicle_maintenance SET type = maintenance_type WHERE type IS NULL;
      END IF;
    END IF;
    
    -- Adicionar due_at (alias para next_service_date se não existir)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_vehicle_maintenance' AND column_name = 'due_at'
    ) THEN
      ALTER TABLE public.gf_vehicle_maintenance ADD COLUMN due_at date;
      -- Copiar valores de next_service_date se existir
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gf_vehicle_maintenance' AND column_name = 'next_service_date'
      ) THEN
        UPDATE public.gf_vehicle_maintenance SET due_at = next_service_date WHERE due_at IS NULL;
      END IF;
    END IF;
    
    -- Adicionar status se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_vehicle_maintenance' AND column_name = 'status'
    ) THEN
      ALTER TABLE public.gf_vehicle_maintenance 
        ADD COLUMN status varchar(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'));
    END IF;
    
    -- Índice para due_at
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'gf_vehicle_maintenance' 
      AND indexname = 'idx_gf_vehicle_maintenance_due_at'
    ) THEN
      CREATE INDEX idx_gf_vehicle_maintenance_due_at 
        ON public.gf_vehicle_maintenance(due_at);
    END IF;
    
    -- Índice para status
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'gf_vehicle_maintenance' 
      AND indexname = 'idx_gf_vehicle_maintenance_status'
    ) THEN
      CREATE INDEX idx_gf_vehicle_maintenance_status 
        ON public.gf_vehicle_maintenance(status);
    END IF;
  END IF;
END $$;

-- ============================================
-- GF_VEHICLE_CHECKLISTS (nova tabela)
-- ============================================
CREATE TABLE IF NOT EXISTS public.gf_vehicle_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  filled_at timestamptz NOT NULL DEFAULT now(),
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'overdue')),
  issues jsonb DEFAULT '[]'::jsonb, -- array de problemas encontrados
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gf_vehicle_checklists_vehicle 
  ON public.gf_vehicle_checklists(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gf_vehicle_checklists_driver 
  ON public.gf_vehicle_checklists(driver_id);
CREATE INDEX IF NOT EXISTS idx_gf_vehicle_checklists_filled_at 
  ON public.gf_vehicle_checklists(filled_at DESC);
CREATE INDEX IF NOT EXISTS idx_gf_vehicle_checklists_status 
  ON public.gf_vehicle_checklists(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_gf_vehicle_checklists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gf_vehicle_checklists_updated_at ON public.gf_vehicle_checklists;
CREATE TRIGGER trigger_gf_vehicle_checklists_updated_at
  BEFORE UPDATE ON public.gf_vehicle_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_gf_vehicle_checklists_updated_at();

-- ============================================
-- GF_DRIVER_DOCUMENTS (adaptar estrutura existente)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_driver_documents'
  ) THEN
    -- Adicionar type (alias para document_type se não existir)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'type'
    ) THEN
      ALTER TABLE public.gf_driver_documents ADD COLUMN type varchar(50);
      -- Copiar valores de document_type se existir
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'document_type'
      ) THEN
        UPDATE public.gf_driver_documents SET type = document_type WHERE type IS NULL;
      END IF;
    END IF;
    
    -- Adicionar expires_at (alias para expiry_date se não existir)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'expires_at'
    ) THEN
      ALTER TABLE public.gf_driver_documents ADD COLUMN expires_at date;
      -- Copiar valores de expiry_date se existir
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'expiry_date'
      ) THEN
        UPDATE public.gf_driver_documents SET expires_at = expiry_date WHERE expires_at IS NULL;
      END IF;
    END IF;
    
    -- Adicionar status (alias para is_valid se não existir)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'status'
    ) THEN
      ALTER TABLE public.gf_driver_documents 
        ADD COLUMN status varchar(20) DEFAULT 'valid' 
        CHECK (status IN ('valid', 'expired', 'pending_renewal', 'invalid'));
      -- Copiar valores de is_valid se existir
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'is_valid'
      ) THEN
        UPDATE public.gf_driver_documents 
          SET status = CASE WHEN is_valid THEN 'valid' ELSE 'invalid' END 
          WHERE status = 'valid';
      END IF;
    END IF;
    
    -- Garantir file_url existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'file_url'
    ) THEN
      ALTER TABLE public.gf_driver_documents ADD COLUMN file_url text;
    END IF;
    
    -- Índice para expires_at
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'gf_driver_documents' 
      AND indexname = 'idx_gf_driver_documents_expires_at'
    ) THEN
      CREATE INDEX idx_gf_driver_documents_expires_at 
        ON public.gf_driver_documents(expires_at);
    END IF;
    
    -- Índice para status
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'gf_driver_documents' 
      AND indexname = 'idx_gf_driver_documents_status'
    ) THEN
      CREATE INDEX idx_gf_driver_documents_status 
        ON public.gf_driver_documents(status);
    END IF;
  END IF;
END $$;

-- ============================================
-- GF_INCIDENTS (nova tabela - diferente de gf_operator_incidents)
-- ============================================
CREATE TABLE IF NOT EXISTS public.gf_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  route_id uuid REFERENCES public.routes(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  severity varchar(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status varchar(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_gf_incidents_company 
  ON public.gf_incidents(company_id);
CREATE INDEX IF NOT EXISTS idx_gf_incidents_route 
  ON public.gf_incidents(route_id);
CREATE INDEX IF NOT EXISTS idx_gf_incidents_vehicle 
  ON public.gf_incidents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gf_incidents_driver 
  ON public.gf_incidents(driver_id);
CREATE INDEX IF NOT EXISTS idx_gf_incidents_severity 
  ON public.gf_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_gf_incidents_status 
  ON public.gf_incidents(status);
CREATE INDEX IF NOT EXISTS idx_gf_incidents_created_at 
  ON public.gf_incidents(created_at DESC);

-- ============================================
-- GF_AUDIT_LOG (adaptar estrutura existente)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_audit_log'
  ) THEN
    -- Adicionar actor_id (alias para operator_id se não existir)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_audit_log' AND column_name = 'actor_id'
    ) THEN
      ALTER TABLE public.gf_audit_log ADD COLUMN actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
      -- Copiar valores de operator_id se existir
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gf_audit_log' AND column_name = 'operator_id'
      ) THEN
        UPDATE public.gf_audit_log SET actor_id = operator_id WHERE actor_id IS NULL;
      END IF;
    END IF;
    
    -- Garantir campos obrigatórios
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_audit_log' AND column_name = 'action_type'
    ) THEN
      ALTER TABLE public.gf_audit_log ADD COLUMN action_type varchar(50) NOT NULL DEFAULT 'unknown';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_audit_log' AND column_name = 'resource_type'
    ) THEN
      ALTER TABLE public.gf_audit_log ADD COLUMN resource_type varchar(50);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_audit_log' AND column_name = 'resource_id'
    ) THEN
      ALTER TABLE public.gf_audit_log ADD COLUMN resource_id uuid;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_audit_log' AND column_name = 'details'
    ) THEN
      ALTER TABLE public.gf_audit_log ADD COLUMN details jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gf_audit_log' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.gf_audit_log ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
    
    -- Índices
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'gf_audit_log' 
      AND indexname = 'idx_gf_audit_log_actor'
    ) THEN
      CREATE INDEX idx_gf_audit_log_actor ON public.gf_audit_log(actor_id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'gf_audit_log' 
      AND indexname = 'idx_gf_audit_log_action'
    ) THEN
      CREATE INDEX idx_gf_audit_log_action ON public.gf_audit_log(action_type);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'gf_audit_log' 
      AND indexname = 'idx_gf_audit_log_resource'
    ) THEN
      CREATE INDEX idx_gf_audit_log_resource ON public.gf_audit_log(resource_type, resource_id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'gf_audit_log' 
      AND indexname = 'idx_gf_audit_log_created_at'
    ) THEN
      CREATE INDEX idx_gf_audit_log_created_at ON public.gf_audit_log(created_at DESC);
    END IF;
  ELSE
    -- Criar tabela do zero
    CREATE TABLE public.gf_audit_log (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
      action_type varchar(50) NOT NULL,
      resource_type varchar(50),
      resource_id uuid,
      details jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    
    CREATE INDEX idx_gf_audit_log_actor ON public.gf_audit_log(actor_id);
    CREATE INDEX idx_gf_audit_log_action ON public.gf_audit_log(action_type);
    CREATE INDEX idx_gf_audit_log_resource ON public.gf_audit_log(resource_type, resource_id);
    CREATE INDEX idx_gf_audit_log_created_at ON public.gf_audit_log(created_at DESC);
  END IF;
END $$;

-- Comentários
COMMENT ON TABLE public.gf_cost_centers IS 'Centros de custo por empresa';
COMMENT ON TABLE public.gf_invoices IS 'Faturas de transportadoras para empresas';
COMMENT ON TABLE public.gf_invoice_lines IS 'Linhas detalhadas de fatura (conciliação km/tempo/viagens)';
COMMENT ON TABLE public.gf_vehicle_maintenance IS 'Manutenção de veículos (preventiva/corretiva)';
COMMENT ON TABLE public.gf_vehicle_checklists IS 'Checklists de veículos pre-viagem';
COMMENT ON TABLE public.gf_driver_documents IS 'Documentos de motoristas (CNH, certificados, etc)';
COMMENT ON TABLE public.gf_incidents IS 'Incidentes operacionais (acidentes, desvios, etc)';
COMMENT ON TABLE public.gf_audit_log IS 'Log de auditoria de ações do sistema';

