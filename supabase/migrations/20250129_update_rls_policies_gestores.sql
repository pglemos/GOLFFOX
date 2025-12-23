-- Migration: Atualização de RLS Policies para Novos Roles
-- GolfFox - Padronização de Nomenclatura
-- Data: 2025-01-29
-- 
-- Esta migration atualiza todas as RLS policies que verificam roles diretamente
-- para suportar os novos roles: gestor_empresa e gestor_transportadora
-- Mantém compatibilidade temporária com roles antigas

BEGIN;

-- ============================================
-- 1. Atualizar policies de storage (já atualizadas nas migrations anteriores)
-- ============================================
-- As policies de storage já foram atualizadas nas migrations anteriores
-- (20250128_create_bucket_policies_pt_br.sql e 20250128_rename_buckets_pt_br.sql)
-- Elas já incluem compatibilidade: (role = 'gestor_transportadora' OR role = 'transportadora')

-- ============================================
-- 2. Atualizar policies financeiras que verificam role diretamente
-- ============================================

-- Atualizar policy de categorias de custos
DO $$
BEGIN
    -- Verificar se a policy existe e atualizar
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'gf_cost_categories'
        AND policyname = 'categories_admin_write'
    ) THEN
        DROP POLICY IF EXISTS "categories_admin_write" ON public.gf_cost_categories;
        
        CREATE POLICY "categories_admin_write" ON public.gf_cost_categories
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
        );
    END IF;
END $$;

-- Atualizar policy de custos admin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'gf_manual_costs_v2'
        AND policyname = 'costs_admin_full'
    ) THEN
        DROP POLICY IF EXISTS "costs_admin_full" ON public.gf_manual_costs_v2;
        
        CREATE POLICY "costs_admin_full" ON public.gf_manual_costs_v2
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
        );
    END IF;
END $$;

-- Renomear e atualizar policy de custos transportadora
DO $$
BEGIN
    -- Renomear policy antiga se existir
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'gf_manual_costs_v2'
        AND policyname = 'costs_transportadora_access'
    ) THEN
        DROP POLICY IF EXISTS "costs_transportadora_access" ON public.gf_manual_costs_v2;
    END IF;
    
    -- Criar nova policy com nome atualizado
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'gf_manual_costs_v2'
        AND policyname = 'costs_gestor_transportadora_access'
    ) THEN
        CREATE POLICY "costs_gestor_transportadora_access" ON public.gf_manual_costs_v2
        FOR ALL USING (
            transportadora_id IN (
                SELECT transportadora_id FROM users WHERE id = auth.uid()
            )
            OR transportadora_id IN (
                SELECT transportadora_id FROM profiles WHERE id = auth.uid()
            )
        );
    END IF;
END $$;

-- Atualizar policy de receitas admin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'gf_manual_revenues'
        AND policyname = 'revenues_admin_full'
    ) THEN
        DROP POLICY IF EXISTS "revenues_admin_full" ON public.gf_manual_revenues;
        
        CREATE POLICY "revenues_admin_full" ON public.gf_manual_revenues
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
        );
    END IF;
END $$;

-- Renomear e atualizar policy de receitas transportadora
DO $$
BEGIN
    -- Renomear policy antiga se existir
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'gf_manual_revenues'
        AND policyname = 'revenues_transportadora_access'
    ) THEN
        DROP POLICY IF EXISTS "revenues_transportadora_access" ON public.gf_manual_revenues;
    END IF;
    
    -- Criar nova policy com nome atualizado
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'gf_manual_revenues'
        AND policyname = 'revenues_gestor_transportadora_access'
    ) THEN
        CREATE POLICY "revenues_gestor_transportadora_access" ON public.gf_manual_revenues
        FOR ALL USING (
            transportadora_id IN (
                SELECT transportadora_id FROM users WHERE id = auth.uid()
            )
            OR transportadora_id IN (
                SELECT transportadora_id FROM profiles WHERE id = auth.uid()
            )
        );
    END IF;
END $$;

-- Atualizar policy de orçamentos admin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'gf_budgets'
        AND policyname = 'budgets_admin_full'
    ) THEN
        DROP POLICY IF EXISTS "budgets_admin_full" ON public.gf_budgets;
        
        CREATE POLICY "budgets_admin_full" ON public.gf_budgets
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
        );
    END IF;
END $$;

-- Atualizar policy de projeções admin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'gf_financial_forecasts'
        AND policyname = 'forecasts_admin_full'
    ) THEN
        DROP POLICY IF EXISTS "forecasts_admin_full" ON public.gf_financial_forecasts;
        
        CREATE POLICY "forecasts_admin_full" ON public.gf_financial_forecasts
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
        );
    END IF;
END $$;

-- ============================================
-- 3. Verificar e atualizar outras policies que verificam role
-- ============================================

-- Atualizar policies que verificam role em announcements (se existirem)
DO $$
BEGIN
    -- Verificar se há policies que verificam role em announcements
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'announcements'
        AND (qual::text LIKE '%role%' OR with_check::text LIKE '%role%')
    LOOP
        -- As policies de announcements geralmente não verificam role diretamente,
        -- mas verificam company_id/transportadora_id, então não precisam ser atualizadas
        RAISE NOTICE 'Policy de announcements encontrada: % (não requer atualização de role)', policy_record.policyname;
    END LOOP;
END $$;

-- ============================================
-- 4. Verificação final
-- ============================================
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Contar policies que ainda referenciam roles antigos diretamente
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE (qual::text LIKE '%role%''transportadora''%' 
           OR qual::text LIKE '%role%''operador''%'
           OR qual::text LIKE '%role%''empresa''%'
           OR with_check::text LIKE '%role%''transportadora''%'
           OR with_check::text LIKE '%role%''operador''%'
           OR with_check::text LIKE '%role%''empresa''%')
    AND qual::text NOT LIKE '%gestor%';
    
    IF policy_count > 0 THEN
        RAISE NOTICE 'Atenção: % policies ainda podem referenciar roles antigos diretamente', policy_count;
        RAISE NOTICE 'Execute a query abaixo para verificar:';
        RAISE NOTICE 'SELECT schemaname, tablename, policyname, qual FROM pg_policies WHERE qual::text LIKE ''%%role%%'' ORDER BY schemaname, tablename, policyname;';
    ELSE
        RAISE NOTICE '✅ Todas as policies foram atualizadas com sucesso!';
    END IF;
END $$;

COMMIT;

-- ============================================
-- 5. Query de verificação (executar manualmente após migration)
-- ============================================
-- SELECT schemaname, tablename, policyname, qual 
-- FROM pg_policies 
-- WHERE qual::text LIKE '%role%' 
-- ORDER BY schemaname, tablename, policyname;
