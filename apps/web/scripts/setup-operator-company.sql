-- Script Helper: Configuração Inicial de Empresa para Operador
-- Execute este script no Supabase SQL Editor ou via psql

-- ============================================
-- PASSO 1: Identificar Company ID e User ID
-- ============================================
-- Antes de executar, substitua os valores abaixo:

-- Exemplo: Obter IDs existentes
-- SELECT id, name FROM companies LIMIT 10;
-- SELECT id, email, role FROM users WHERE role = 'operator' LIMIT 10;

-- ============================================
-- PASSO 2: Configurar Branding da Empresa
-- ============================================
-- Substitua 'SEU-COMPANY-ID-AQUI' pelo ID real da empresa
DO $$
DECLARE
    v_company_id uuid := 'SEU-COMPANY-ID-AQUI'::uuid;
BEGIN
    INSERT INTO gf_company_branding (
        company_id, 
        name, 
        logo_url, 
        primary_hex, 
        accent_hex
    )
    VALUES (
        v_company_id,
        'Nome da Empresa',  -- Altere para o nome real
        'https://exemplo.com/logo.png',  -- URL do logo ou NULL
        '#F97316',  -- Cor primária (laranja padrão)
        '#2E7D32'   -- Cor de destaque (verde padrão)
    )
    ON CONFLICT (company_id) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        logo_url = EXCLUDED.logo_url,
        primary_hex = EXCLUDED.primary_hex,
        accent_hex = EXCLUDED.accent_hex,
        updated_at = now();
    
    RAISE NOTICE 'Branding configurado para empresa %', v_company_id;
END $$;

-- ============================================
-- PASSO 3: Mapear Operador à Empresa
-- ============================================
-- Substitua os IDs abaixo pelos IDs reais
DO $$
DECLARE
    v_user_id uuid := 'SEU-USER-ID-AQUI'::uuid;
    v_company_id uuid := 'SEU-COMPANY-ID-AQUI'::uuid;
BEGIN
    INSERT INTO gf_user_company_map (user_id, company_id)
    VALUES (v_user_id, v_company_id)
    ON CONFLICT (user_id, company_id) DO NOTHING;
    
    RAISE NOTICE 'Operador % mapeado para empresa %', v_user_id, v_company_id;
END $$;

-- ============================================
-- PASSO 4: Popular Materialized View
-- ============================================
REFRESH MATERIALIZED VIEW mv_operator_kpis;

-- ============================================
-- VERIFICAÇÃO: Testar Configuração
-- ============================================

-- Verificar empresas do usuário (execute como o usuário operador autenticado)
-- SELECT * FROM v_my_companies;

-- Verificar branding configurado
SELECT 
    cb.company_id,
    c.name as company_name,
    cb.name as branding_name,
    cb.logo_url,
    cb.primary_hex,
    cb.accent_hex
FROM gf_company_branding cb
JOIN companies c ON c.id = cb.company_id
ORDER BY cb.updated_at DESC;

-- Verificar mapeamentos de operadores
SELECT 
    ucm.user_id,
    u.email as user_email,
    u.name as user_name,
    ucm.company_id,
    c.name as company_name,
    ucm.created_at
FROM gf_user_company_map ucm
JOIN users u ON u.id = ucm.user_id
JOIN companies c ON c.id = ucm.company_id
ORDER BY ucm.created_at DESC;

-- Verificar KPIs disponíveis
SELECT 
    company_id,
    trips_today,
    trips_in_progress,
    trips_completed,
    delays_over_5min,
    avg_occupancy,
    daily_cost,
    sla_d0
FROM mv_operator_kpis
ORDER BY company_id;

