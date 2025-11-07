-- Script para criar dados de teste no Supabase
-- Execute este script se não houver veículos ativos

-- 1. Criar empresa de teste (se não existir)
INSERT INTO public.companies (id, name, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Empresa Teste', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Criar veículos de teste
INSERT INTO public.vehicles (id, plate, model, year, is_active, company_id, capacity, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'TEST-001', 'Ônibus Mercedes', 2023, true, '00000000-0000-0000-0000-000000000001', 40, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'TEST-002', 'Van Sprinter', 2022, true, '00000000-0000-0000-0000-000000000001', 15, NOW()),
  ('33333333-3333-3333-3333-333333333333', 'TEST-003', 'Micro-ônibus Iveco', 2023, true, '00000000-0000-0000-0000-000000000001', 25, NOW())
ON CONFLICT (id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  company_id = EXCLUDED.company_id;

-- 3. Criar rota de teste (se não existir)
INSERT INTO public.routes (id, name, company_id, is_active, created_at)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rota Teste Centro-Bairro', '00000000-0000-0000-0000-000000000001', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Criar route_stops de teste
INSERT INTO public.route_stops (route_id, seq, lat, lng, name)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, -15.7942, -47.8822, 'Parada 1 - Centro'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, -15.8000, -47.8900, 'Parada 2 - Meio'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, -15.8100, -47.9000, 'Parada 3 - Final')
ON CONFLICT DO NOTHING;

-- 5. Verificar resultados
SELECT 'Veículos ativos criados:' as status, COUNT(*) as total FROM vehicles WHERE is_active = true;
SELECT 'Rotas ativas criadas:' as status, COUNT(*) as total FROM routes WHERE is_active = true;
SELECT 'Route stops criados:' as status, COUNT(*) as total FROM route_stops;

