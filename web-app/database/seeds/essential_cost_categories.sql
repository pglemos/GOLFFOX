-- ====================================================
-- Script de Seed: Categorias de Custo Essenciais
-- ====================================================
-- Este script cria as categorias de custo básicas necessárias
-- para o funcionamento do sistema de custos
-- 
-- Execute este script no Supabase SQL Editor se o seed não puder
-- ser executado via npm run db:seed:demo
-- ====================================================

-- Inserir categorias de custo essenciais
-- Usando INSERT ... ON CONFLICT para evitar duplicatas

INSERT INTO gf_cost_categories (id, name, description, is_active, created_at)
VALUES 
  -- Categoria 1: Combustível
  (
    'c1111111-1111-1111-1111-111111111111',
    'Combustível',
    'Gastos com combustível (gasolina, diesel, etanol)',
    true,
    NOW()
  ),
  -- Categoria 2: Manutenção
  (
    'c2222222-2222-2222-2222-222222222222',
    'Manutenção',
    'Manutenção preventiva e corretiva de veículos',
    true,
    NOW()
  ),
  -- Categoria 3: Pessoal
  (
    'c3333333-3333-3333-3333-333333333333',
    'Pessoal',
    'Salários, benefícios e encargos de motoristas e operadores',
    true,
    NOW()
  ),
  -- Categoria 4: Seguros
  (
    'c4444444-4444-4444-4444-444444444444',
    'Seguros',
    'Seguro de veículos, responsabilidade civil e outros',
    true,
    NOW()
  ),
  -- Categoria 5: Licenciamento
  (
    'c5555555-5555-5555-5555-555555555555',
    'Licenciamento',
    'IPVA, licenciamento, taxas e impostos sobre veículos',
    true,
    NOW()
  ),
  -- Categoria 6: Pneus
  (
    'c6666666-6666-6666-6666-666666666666',
    'Pneus',
    'Compra e manutenção de pneus',
    true,
    NOW()
  ),
  -- Categoria 7: Lavagem e Limpeza
  (
    'c7777777-7777-7777-7777-777777777777',
    'Lavagem e Limpeza',
    'Lavagem e limpeza interna/externa dos veículos',
    true,
    NOW()
  ),
  -- Categoria 8: Depreciação
  (
    'c8888888-8888-8888-8888-888888888888',
    'Depreciação',
    'Depreciação de veículos e equipamentos',
    true,
    NOW()
  ),
  -- Categoria 9: Outros
  (
    'c9999999-9999-9999-9999-999999999999',
    'Outros',
    'Custos diversos não categorizados',
    true,
    NOW()
  )
ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- Verificar se as categorias foram criadas
SELECT 
  id, 
  name, 
  description,
  is_active,
  created_at
FROM gf_cost_categories
ORDER BY name;

-- Resultado esperado: 9 categorias de custo ativas

