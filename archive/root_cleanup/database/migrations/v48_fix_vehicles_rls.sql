-- ========================================
-- V48: Corrigir políticas RLS da tabela vehicles
-- ========================================
-- Data: 2025-01-06
-- Problema: Políticas RLS bloqueavam admin e operator de criar/atualizar veículos
-- Solução: Adicionar políticas para admin e operator, permitindo company_id

-- Primeiro, remover políticas antigas conflitantes
DROP POLICY IF EXISTS "vehicles_select_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete_policy" ON public.vehicles;
DROP POLICY IF EXISTS "Admin full access vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Carrier manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Others view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_admin_all" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_company_read" ON public.vehicles;

-- ========================================
-- POLÍTICAS RLS PARA VEHICLES
-- ========================================

-- 1. ADMIN: Acesso total (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "admin_full_access_vehicles" ON public.vehicles
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 2. OPERATOR: Pode gerenciar veículos da sua empresa
-- SELECT: Ver veículos da sua empresa
CREATE POLICY "operator_select_company_vehicles" ON public.vehicles
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'operator'
      AND company_id = vehicles.company_id
    )
  );

-- INSERT: Criar veículos para sua empresa (company_id deve corresponder)
CREATE POLICY "operator_insert_company_vehicles" ON public.vehicles
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'operator'
      AND company_id = vehicles.company_id
    )
  );

-- UPDATE: Atualizar veículos da sua empresa
CREATE POLICY "operator_update_company_vehicles" ON public.vehicles
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'operator'
      AND company_id = vehicles.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'operator'
      AND company_id = vehicles.company_id
    )
  );

-- DELETE: Deletar veículos da sua empresa
CREATE POLICY "operator_delete_company_vehicles" ON public.vehicles
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'operator'
      AND company_id = vehicles.company_id
    )
  );

-- 3. CARRIER: Pode gerenciar veículos do seu carrier_id
-- SELECT: Ver veículos do seu carrier
CREATE POLICY "carrier_select_vehicles" ON public.vehicles
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'carrier'
      AND (
        (users.carrier_id::text = vehicles.carrier_id::text)
        OR (users.carrier_id IS NULL AND vehicles.carrier_id IS NULL)
      )
    )
  );

-- INSERT: Criar veículos para seu carrier
CREATE POLICY "carrier_insert_vehicles" ON public.vehicles
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'carrier'
      AND (
        (users.carrier_id::text = vehicles.carrier_id::text)
        OR (users.carrier_id IS NULL AND vehicles.carrier_id IS NULL)
      )
    )
  );

-- UPDATE: Atualizar veículos do seu carrier
CREATE POLICY "carrier_update_vehicles" ON public.vehicles
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'carrier'
      AND (
        (users.carrier_id::text = vehicles.carrier_id::text)
        OR (users.carrier_id IS NULL AND vehicles.carrier_id IS NULL)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'carrier'
      AND (
        (users.carrier_id::text = vehicles.carrier_id::text)
        OR (users.carrier_id IS NULL AND vehicles.carrier_id IS NULL)
      )
    )
  );

-- DELETE: Deletar veículos do seu carrier
CREATE POLICY "carrier_delete_vehicles" ON public.vehicles
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'carrier'
      AND (
        (users.carrier_id::text = vehicles.carrier_id::text)
        OR (users.carrier_id IS NULL AND vehicles.carrier_id IS NULL)
      )
    )
  );

-- 4. DRIVER: Pode visualizar veículos atribuídos a suas viagens
CREATE POLICY "driver_view_assigned_vehicles" ON public.vehicles
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'driver'
    )
    AND (
      id IN (
        SELECT vehicle_id FROM public.trips 
        WHERE driver_id = auth.uid()
      )
      OR id IN (
        SELECT vehicle_id FROM public.trips 
        WHERE status = 'inProgress' 
        AND driver_id = auth.uid()
      )
    )
  );

-- 5. PASSENGER: Pode visualizar veículos das rotas ativas
CREATE POLICY "passenger_view_vehicles" ON public.vehicles
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'passenger'
    )
  );

-- Comentários das políticas
COMMENT ON POLICY "admin_full_access_vehicles" ON public.vehicles IS 
  'Admin tem acesso total a todos os veículos';

COMMENT ON POLICY "operator_select_company_vehicles" ON public.vehicles IS 
  'Operador pode visualizar veículos da sua empresa';

COMMENT ON POLICY "operator_insert_company_vehicles" ON public.vehicles IS 
  'Operador pode criar veículos para sua empresa (company_id deve corresponder)';

COMMENT ON POLICY "operator_update_company_vehicles" ON public.vehicles IS 
  'Operador pode atualizar veículos da sua empresa';

COMMENT ON POLICY "operator_delete_company_vehicles" ON public.vehicles IS 
  'Operador pode deletar veículos da sua empresa';

COMMENT ON POLICY "carrier_select_vehicles" ON public.vehicles IS 
  'Transportadora pode visualizar seus veículos';

COMMENT ON POLICY "carrier_insert_vehicles" ON public.vehicles IS 
  'Transportadora pode criar veículos (carrier_id deve corresponder)';

COMMENT ON POLICY "carrier_update_vehicles" ON public.vehicles IS 
  'Transportadora pode atualizar seus veículos';

COMMENT ON POLICY "carrier_delete_vehicles" ON public.vehicles IS 
  'Transportadora pode deletar seus veículos';

