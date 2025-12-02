-- =====================================================
-- CORREÇÃO DE POLÍTICAS RLS
-- =====================================================

-- 3. CRIAR POLÍTICAS RLS BÁSICAS

-- Políticas para users
CREATE POLICY IF NOT EXISTS "users_admin_all" ON public.users FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "users_self_read" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY IF NOT EXISTS "users_self_update" ON public.users FOR UPDATE USING (id = auth.uid());

-- Políticas para companies
CREATE POLICY IF NOT EXISTS "companies_admin_all" ON public.companies FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "companies_members_read" ON public.companies FOR SELECT USING (id = public.current_company_id());

-- Políticas para vehicles
CREATE POLICY IF NOT EXISTS "vehicles_admin_all" ON public.vehicles FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "vehicles_company_read" ON public.vehicles FOR SELECT USING (company_id = public.current_company_id());

-- Políticas para routes
CREATE POLICY IF NOT EXISTS "routes_admin_all" ON public.routes FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "routes_company_read" ON public.routes FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY IF NOT EXISTS "routes_public_read" ON public.routes FOR SELECT USING (is_active = true);

-- Políticas para trips
CREATE POLICY IF NOT EXISTS "trips_admin_all" ON public.trips FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "trips_driver_read" ON public.trips FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "trips_company_read" ON public.trips FOR SELECT USING (route_id IN (SELECT id FROM public.routes WHERE company_id = public.current_company_id()));

-- Políticas para driver_positions
CREATE POLICY IF NOT EXISTS "driver_positions_admin_all" ON public.driver_positions FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "driver_positions_driver_all" ON public.driver_positions FOR ALL USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "driver_positions_company_read" ON public.driver_positions FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE company_id = public.current_company_id()));

-- 4. POLÍTICAS PARA TABELAS GF_*

-- Políticas para gf_alerts
CREATE POLICY IF NOT EXISTS "gf_alerts_admin_all" ON public.gf_alerts FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "gf_alerts_company_read" ON public.gf_alerts FOR SELECT USING (public.can_access_company_data(company_id));

-- Políticas para gf_assistance_requests
CREATE POLICY IF NOT EXISTS "gf_assistance_requests_admin_all" ON public.gf_assistance_requests FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "gf_assistance_requests_company_read" ON public.gf_assistance_requests FOR SELECT USING (public.can_access_company_data(company_id));

-- Políticas para gf_driver_documents
CREATE POLICY IF NOT EXISTS "gf_driver_documents_admin_all" ON public.gf_driver_documents FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "gf_driver_documents_company_read" ON public.gf_driver_documents FOR SELECT USING (public.can_access_company_data(company_id));

-- Políticas para gf_driver_events
CREATE POLICY IF NOT EXISTS "gf_driver_events_admin_all" ON public.gf_driver_events FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "gf_driver_events_company_read" ON public.gf_driver_events FOR SELECT USING (public.can_access_company_data(company_id));

-- Políticas para gf_employee_company
CREATE POLICY IF NOT EXISTS "gf_employee_company_admin_all" ON public.gf_employee_company FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "gf_employee_company_company_read" ON public.gf_employee_company FOR SELECT USING (public.can_access_company_data(company_id));

-- Políticas para gf_roles
CREATE POLICY IF NOT EXISTS "gf_roles_admin_all" ON public.gf_roles FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "gf_roles_company_read" ON public.gf_roles FOR SELECT USING (public.can_access_company_data(company_id));

-- Políticas para gf_route_plan
CREATE POLICY IF NOT EXISTS "gf_route_plan_admin_all" ON public.gf_route_plan FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "gf_route_plan_company_read" ON public.gf_route_plan FOR SELECT USING (public.can_access_company_data(company_id));

-- Políticas para gf_user_roles
CREATE POLICY IF NOT EXISTS "gf_user_roles_admin_all" ON public.gf_user_roles FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "gf_user_roles_company_read" ON public.gf_user_roles FOR SELECT USING (public.can_access_company_data(company_id));

-- Políticas para gf_vehicle_costs
CREATE POLICY IF NOT EXISTS "gf_vehicle_costs_admin_all" ON public.gf_vehicle_costs FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "gf_vehicle_costs_company_read" ON public.gf_vehicle_costs FOR SELECT USING (public.can_access_company_data(company_id));

-- Políticas para gf_vehicle_maintenance
CREATE POLICY IF NOT EXISTS "gf_vehicle_maintenance_admin_all" ON public.gf_vehicle_maintenance FOR ALL USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "gf_vehicle_maintenance_company_read" ON public.gf_vehicle_maintenance FOR SELECT USING (public.can_access_company_data(company_id));
