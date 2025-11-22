-- ============================================================================
-- GOLFFOX - Script de Criação de Tabelas Necessárias
-- Data: 2025-11-22
-- Objetivo: Garantir que todas as tabelas necessárias para CRUD existam
-- ============================================================================

-- ============================================================================
-- 1. TABELA CARRIERS (Transportadoras)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    contact_person TEXT,
    email TEXT,
    cnpj TEXT,
    state_registration TEXT,
    municipal_registration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

COMMENT ON TABLE public.carriers IS 'Transportadoras cadastradas no sistema';
COMMENT ON COLUMN public.carriers.name IS 'Nome da transportadora (obrigatório)';
COMMENT ON COLUMN public.carriers.cnpj IS 'CNPJ da transportadora';
COMMENT ON COLUMN public.carriers.contact_person IS 'Pessoa de contato';
COMMENT ON COLUMN public.carriers.is_active IS 'Se a transportadora está ativa';

-- ============================================================================
-- 2. TABELA COMPANIES (Empresas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.companies IS 'Empresas clientes do sistema';
COMMENT ON COLUMN public.companies.name IS 'Nome da empresa (obrigatório)';
COMMENT ON COLUMN public.companies.cnpj IS 'CNPJ da empresa';
COMMENT ON COLUMN public.companies.is_active IS 'Se a empresa está ativa';

-- ============================================================================
-- 3. VERIFICAR/ATUALIZAR TABELA USERS
-- ============================================================================

-- Adicionar colunas se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'company_id') THEN
        ALTER TABLE public.users ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'phone') THEN
        ALTER TABLE public.users ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'address') THEN
        ALTER TABLE public.users ADD COLUMN address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'city') THEN
        ALTER TABLE public.users ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'state') THEN
        ALTER TABLE public.users ADD COLUMN state TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'zip_code') THEN
        ALTER TABLE public.users ADD COLUMN zip_code TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'cnpj') THEN
        ALTER TABLE public.users ADD COLUMN cnpj TEXT;
    END IF;
END $$;

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) PARA CARRIERS
-- ============================================================================

ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Service role full access on carriers" ON public.carriers;
DROP POLICY IF EXISTS "Admins can view carriers" ON public.carriers;
DROP POLICY IF EXISTS "Admins can create carriers" ON public.carriers;
DROP POLICY IF EXISTS "Admins can update carriers" ON public.carriers;
DROP POLICY IF EXISTS "Admins can delete carriers" ON public.carriers;

-- Policy: Service role pode fazer tudo
CREATE POLICY "Service role full access on carriers"
ON public.carriers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Admins podem ler
CREATE POLICY "Admins can view carriers"
ON public.carriers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins podem criar
CREATE POLICY "Admins can create carriers"
ON public.carriers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins podem atualizar
CREATE POLICY "Admins can update carriers"
ON public.carriers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins podem deletar
CREATE POLICY "Admins can delete carriers"
ON public.carriers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) PARA COMPANIES
-- ============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Service role full access on companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can view companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can create companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can update companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can delete companies" ON public.companies;

-- Policy: Service role pode fazer tudo
CREATE POLICY "Service role full access on companies"
ON public.companies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Admins podem ler
CREATE POLICY "Admins can view companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins podem criar
CREATE POLICY "Admins can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins podem atualizar
CREATE POLICY "Admins can update companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins podem deletar
CREATE POLICY "Admins can delete companies"
ON public.companies
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_carriers_name ON public.carriers(name);
CREATE INDEX IF NOT EXISTS idx_carriers_cnpj ON public.carriers(cnpj);
CREATE INDEX IF NOT EXISTS idx_carriers_is_active ON public.carriers(is_active);
CREATE INDEX IF NOT EXISTS idx_carriers_created_at ON public.carriers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================================================
-- 7. TRIGGERS PARA AUTO-UPDATE DE updated_at
-- ============================================================================

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para carriers
DROP TRIGGER IF EXISTS update_carriers_updated_at ON public.carriers;
CREATE TRIGGER update_carriers_updated_at
    BEFORE UPDATE ON public.carriers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para companies
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Tabelas criadas/verificadas:';
    RAISE NOTICE '- carriers: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'carriers');
    RAISE NOTICE '- companies: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'companies');
    RAISE NOTICE '';
    RAISE NOTICE 'Script executado com sucesso!';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Testar criação de empresa no painel admin';
    RAISE NOTICE '2. Testar criação de transportadora no painel admin';
    RAISE NOTICE '3. Verificar logs de erro se ainda houver problemas';
END $$;
