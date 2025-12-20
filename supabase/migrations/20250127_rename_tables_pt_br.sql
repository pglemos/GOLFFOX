-- Migration: Renomear tabelas de inglês para português
-- GolfFox - Padronização de Nomenclatura PT-BR
-- Data: 2025-01-27
--
-- IMPORTANTE: Esta migration renomeia tabelas do banco de dados
-- que ainda usam nomes em inglês para português.

-- ============================================
-- 1. Renomear tabelas driver_* → motorista_*
-- ============================================

-- driver_locations → motorista_locations
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'driver_locations') THEN
    ALTER TABLE public.driver_locations RENAME TO motorista_locations;
    RAISE NOTICE 'Tabela driver_locations renomeada para motorista_locations';
  END IF;
END $$;

-- driver_messages → motorista_messages
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'driver_messages') THEN
    ALTER TABLE public.driver_messages RENAME TO motorista_messages;
    RAISE NOTICE 'Tabela driver_messages renomeada para motorista_messages';
  END IF;
END $$;

-- driver_positions → motorista_positions
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'driver_positions') THEN
    ALTER TABLE public.driver_positions RENAME TO motorista_positions;
    RAISE NOTICE 'Tabela driver_positions renomeada para motorista_positions';
  END IF;
END $$;

-- ============================================
-- 2. Renomear tabelas passenger_* → passageiro_*
-- ============================================

-- passenger_checkins → passageiro_checkins
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'passenger_checkins') THEN
    ALTER TABLE public.passenger_checkins RENAME TO passageiro_checkins;
    RAISE NOTICE 'Tabela passenger_checkins renomeada para passageiro_checkins';
  END IF;
END $$;

-- passenger_cancellations → passageiro_cancellations
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'passenger_cancellations') THEN
    ALTER TABLE public.passenger_cancellations RENAME TO passageiro_cancellations;
    RAISE NOTICE 'Tabela passenger_cancellations renomeada para passageiro_cancellations';
  END IF;
END $$;

-- trip_passengers → trip_passageiros
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trip_passengers') THEN
    ALTER TABLE public.trip_passengers RENAME TO trip_passageiros;
    RAISE NOTICE 'Tabela trip_passengers renomeada para trip_passageiros';
  END IF;
END $$;

-- ============================================
-- 3. Renomear tabelas vehicle_* → veiculo_*
-- ============================================

-- vehicle_checklists → veiculo_checklists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicle_checklists') THEN
    ALTER TABLE public.vehicle_checklists RENAME TO veiculo_checklists;
    RAISE NOTICE 'Tabela vehicle_checklists renomeada para veiculo_checklists';
  END IF;
END $$;

-- ============================================
-- 4. Renomear tabelas gf_* que ainda estão em inglês
-- ============================================

-- gf_vehicle_checklists → gf_veiculo_checklists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_vehicle_checklists') THEN
    ALTER TABLE public.gf_vehicle_checklists RENAME TO gf_veiculo_checklists;
    RAISE NOTICE 'Tabela gf_vehicle_checklists renomeada para gf_veiculo_checklists';
  END IF;
END $$;

-- gf_vehicle_documents → gf_veiculo_documents
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_vehicle_documents') THEN
    ALTER TABLE public.gf_vehicle_documents RENAME TO gf_veiculo_documents;
    RAISE NOTICE 'Tabela gf_vehicle_documents renomeada para gf_veiculo_documents';
  END IF;
END $$;

-- gf_driver_compensation → gf_motorista_compensation
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_driver_compensation') THEN
    ALTER TABLE public.gf_driver_compensation RENAME TO gf_motorista_compensation;
    RAISE NOTICE 'Tabela gf_driver_compensation renomeada para gf_motorista_compensation';
  END IF;
END $$;

-- gf_carrier_documents → gf_transportadora_documents
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_carrier_documents') THEN
    ALTER TABLE public.gf_carrier_documents RENAME TO gf_transportadora_documents;
    RAISE NOTICE 'Tabela gf_carrier_documents renomeada para gf_transportadora_documents';
  END IF;
END $$;

-- ============================================
-- 5. Atualizar índices e constraints (se necessário)
-- ============================================
-- O PostgreSQL geralmente atualiza automaticamente os índices e constraints
-- quando uma tabela é renomeada, mas podemos verificar se há algum problema.

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration de renomeação de tabelas concluída!';
  RAISE NOTICE 'Verifique se todas as tabelas foram renomeadas corretamente:';
  RAISE NOTICE '========================================';
END $$;

