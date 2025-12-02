-- Script de verificação e criação da tabela gf_user_company_map
-- Executa apenas se a tabela não existir

-- Verificar e criar gf_user_company_map
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_user_company_map'
  ) THEN
    CREATE TABLE public.gf_user_company_map(
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      PRIMARY KEY(user_id, company_id)
    );

    ALTER TABLE public.gf_user_company_map ENABLE ROW LEVEL SECURITY;

    -- Policy: usuários só veem seus próprios mapeamentos
    DROP POLICY IF EXISTS user_own_mappings ON public.gf_user_company_map;
    CREATE POLICY user_own_mappings ON public.gf_user_company_map
      FOR SELECT USING (user_id = auth.uid());

    -- Policy: admin pode gerenciar todos os mapeamentos
    DROP POLICY IF EXISTS admin_manage_user_companies ON public.gf_user_company_map;
    CREATE POLICY admin_manage_user_companies ON public.gf_user_company_map
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      );

    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_gf_user_company_map_user ON public.gf_user_company_map(user_id);
    CREATE INDEX IF NOT EXISTS idx_gf_user_company_map_company ON public.gf_user_company_map(company_id);

    COMMENT ON TABLE public.gf_user_company_map IS 'Tabela de vínculo usuário↔empresa para multi-tenant';
  END IF;
END $$;

-- Seed inicial: mapear usuários operadores existentes via users.company_id
INSERT INTO public.gf_user_company_map(user_id, company_id)
SELECT id, company_id 
FROM public.users 
WHERE role = 'operator' AND company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Verificar se tabela foi criada
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_user_company_map'
  ) THEN
    RAISE EXCEPTION 'Tabela gf_user_company_map não foi criada';
  END IF;
END $$;

-- Forçar reload do schema cache do Supabase (PostgREST)
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Analisar tabela para atualizar estatísticas
ANALYZE public.gf_user_company_map;

SELECT 'Tabela gf_user_company_map verificada/criada com sucesso' AS status;

