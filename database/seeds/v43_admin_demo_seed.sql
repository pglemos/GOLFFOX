-- Seed de dados de demonstração para Admin V43
-- Executar apenas em dev/staging: verificar SEED_DEMO=true e TENANT_DEMO_COMPANY_ID
-- NUNCA executar em produção

DO $$
DECLARE
  v_seed_demo boolean := COALESCE(current_setting('app.seed_demo', true)::boolean, false);
  v_demo_company_id uuid := COALESCE(
    NULLIF(current_setting('app.tenant_demo_company_id', true), '')::uuid,
    NULL
  );
  v_admin_user_id uuid;
  v_operator_user_id uuid;
  v_driver_user_id uuid;
  v_company_id uuid;
  v_vehicle_id uuid;
  v_route_id uuid;
BEGIN
  -- Verificar se deve executar seed
  IF NOT v_seed_demo THEN
    RAISE NOTICE 'Seed de demonstração desabilitado. Defina app.seed_demo=true para executar.';
    RETURN;
  END IF;

  -- Se TENANT_DEMO_COMPANY_ID não fornecido, criar empresa demo
  IF v_demo_company_id IS NULL THEN
    INSERT INTO public.companies (id, name, is_active, created_at)
    VALUES (gen_random_uuid(), 'Empresa Demo Admin V43', true, now())
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_demo_company_id;
    
    IF v_demo_company_id IS NULL THEN
      SELECT id INTO v_demo_company_id FROM public.companies WHERE name = 'Empresa Demo Admin V43' LIMIT 1;
    END IF;
  ELSE
    v_company_id := v_demo_company_id;
  END IF;

  v_company_id := v_demo_company_id;

  RAISE NOTICE 'Seed de demonstração iniciado para empresa: %', v_company_id;

  -- 1. Criar usuários de demonstração (se não existirem)
  -- Admin
  SELECT id INTO v_admin_user_id FROM public.users WHERE email = 'admin@demo.com' LIMIT 1;
  IF v_admin_user_id IS NULL THEN
    INSERT INTO public.users (email, name, role, is_active, created_at)
    VALUES ('admin@demo.com', 'Admin Demo', 'admin', true, now())
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_admin_user_id;
    
    IF v_admin_user_id IS NULL THEN
      SELECT id INTO v_admin_user_id FROM public.users WHERE email = 'admin@demo.com' LIMIT 1;
    END IF;
  END IF;

  -- Operator
  SELECT id INTO v_operator_user_id FROM public.users WHERE email = 'operator@demo.com' LIMIT 1;
  IF v_operator_user_id IS NULL THEN
    INSERT INTO public.users (email, name, role, company_id, is_active, created_at)
    VALUES ('operator@demo.com', 'Operador Demo', 'operator', v_company_id, true, now())
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_operator_user_id;
    
    IF v_operator_user_id IS NULL THEN
      SELECT id INTO v_operator_user_id FROM public.users WHERE email = 'operator@demo.com' LIMIT 1;
    END IF;
  END IF;

  -- Driver
  SELECT id INTO v_driver_user_id FROM public.users WHERE email = 'driver@demo.com' LIMIT 1;
  IF v_driver_user_id IS NULL THEN
    INSERT INTO public.users (email, name, role, company_id, is_active, created_at)
    VALUES ('driver@demo.com', 'Motorista Demo', 'driver', v_company_id, true, now())
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_driver_user_id;
    
    IF v_driver_user_id IS NULL THEN
      SELECT id INTO v_driver_user_id FROM public.users WHERE email = 'driver@demo.com' LIMIT 1;
    END IF;
  END IF;

  -- 2. Mapear usuários à empresa (gf_user_company_map)
  INSERT INTO public.gf_user_company_map (user_id, company_id)
  VALUES 
    (v_operator_user_id, v_company_id),
    (v_driver_user_id, v_company_id)
  ON CONFLICT (user_id, company_id) DO NOTHING;

  -- 3. Criar veículos (5-10)
  INSERT INTO public.vehicles (company_id, plate, model, year, capacity, prefix, is_active, created_at)
  VALUES
    (v_company_id, 'ABC-1234', 'Mercedes-Benz O500U', 2022, 45, '001', true, now()),
    (v_company_id, 'DEF-5678', 'Volkswagen Crafter', 2021, 18, '002', true, now()),
    (v_company_id, 'GHI-9012', 'Iveco Daily', 2023, 22, '003', true, now()),
    (v_company_id, 'JKL-3456', 'Mercedes-Benz Sprinter', 2022, 20, '004', true, now()),
    (v_company_id, 'MNO-7890', 'Volkswagen LT', 2021, 16, '005', true, now())
  ON CONFLICT DO NOTHING;

  -- 4. Criar rotas (3-5)
  INSERT INTO public.routes (company_id, name, description, origin_address, destination_address, scheduled_time, days_of_week, is_active, created_at)
  VALUES
    (v_company_id, 'Rota Centro - Zona Norte', 'Rota principal do centro', 'Centro, São Paulo', 'Zona Norte, São Paulo', '08:00:00', ARRAY[1,2,3,4,5], true, now()),
    (v_company_id, 'Rota Zona Sul - Aeroporto', 'Rota para aeroporto', 'Zona Sul, São Paulo', 'Aeroporto GRU', '06:00:00', ARRAY[1,2,3,4,5,6], true, now()),
    (v_company_id, 'Rota Expressa Leste', 'Rota expressa', 'Zona Leste, São Paulo', 'Centro, São Paulo', '07:30:00', ARRAY[1,2,3,4,5], true, now())
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_route_id;

  -- 5. Criar manutenções (histórico)
  SELECT id INTO v_vehicle_id FROM public.vehicles WHERE company_id = v_company_id LIMIT 1;
  IF v_vehicle_id IS NOT NULL THEN
    INSERT INTO public.gf_vehicle_maintenance (vehicle_id, type, due_at, status, notes, created_at)
    VALUES
      (v_vehicle_id, 'preventiva', CURRENT_DATE + INTERVAL '30 days', 'pending', 'Revisão preventiva mensal', now()),
      (v_vehicle_id, 'corretiva', CURRENT_DATE - INTERVAL '5 days', 'completed', 'Troca de óleo realizada', now() - INTERVAL '5 days'),
      (v_vehicle_id, 'revisao', CURRENT_DATE + INTERVAL '60 days', 'scheduled', 'Revisão programada', now())
    ON CONFLICT DO NOTHING;
  END IF;

  -- 6. Criar checklists (histórico)
  IF v_vehicle_id IS NOT NULL AND v_driver_user_id IS NOT NULL THEN
    INSERT INTO public.gf_vehicle_checklists (vehicle_id, driver_id, filled_at, status, issues, notes, created_at)
    VALUES
      (v_vehicle_id, v_driver_user_id, CURRENT_DATE, 'completed', '{"lights": "ok", "tires": "ok", "brakes": "ok"}'::jsonb, 'Checklist completo', now()),
      (v_vehicle_id, v_driver_user_id, CURRENT_DATE - INTERVAL '1 day', 'failed', '{"lights": "failed", "tires": "ok"}'::jsonb, 'Farol queimado detectado', now() - INTERVAL '1 day'),
      (v_vehicle_id, v_driver_user_id, CURRENT_DATE - INTERVAL '2 days', 'completed', '{"lights": "ok", "tires": "ok", "brakes": "ok", "fluids": "ok"}'::jsonb, 'Tudo OK', now() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 7. Criar documentos de motoristas (com alguns expirando)
  IF v_driver_user_id IS NOT NULL THEN
    INSERT INTO public.gf_driver_documents (driver_id, type, expires_at, status, created_at)
    VALUES
      (v_driver_user_id, 'cnh', CURRENT_DATE + INTERVAL '365 days', 'valid', now()),
      (v_driver_user_id, 'certificado_transporte', CURRENT_DATE + INTERVAL '20 days', 'expiring_soon', now()),
      (v_driver_user_id, 'toxico', CURRENT_DATE - INTERVAL '10 days', 'expired', now() - INTERVAL '200 days'),
      (v_driver_user_id, 'residencia', CURRENT_DATE + INTERVAL '180 days', 'valid', now())
    ON CONFLICT DO NOTHING;
  END IF;

  -- 8. Criar faturas (pendentes e reconciliadas)
  INSERT INTO public.gf_invoices (carrier_id, empresa_id, invoice_number, period_start, period_end, total_amount, status, created_at)
  VALUES
    (v_company_id, v_company_id, 'INV-2024-001', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 15000.00, 'pending', now() - INTERVAL '5 days'),
    (v_company_id, v_company_id, 'INV-2024-002', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '30 days', 12500.00, 'reconciled', now() - INTERVAL '35 days'),
    (v_company_id, v_company_id, 'INV-2024-003', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '60 days', 18000.00, 'approved', now() - INTERVAL '65 days')
  ON CONFLICT DO NOTHING;

  -- 9. Criar linhas de fatura (invoice lines)
  DO $$
  DECLARE
    v_invoice_id uuid;
    v_route_line_id uuid;
  BEGIN
    SELECT id INTO v_invoice_id FROM public.gf_invoices WHERE empresa_id = v_company_id AND status = 'pending' LIMIT 1;
    SELECT id INTO v_route_line_id FROM public.routes WHERE company_id = v_company_id LIMIT 1;
    
    IF v_invoice_id IS NOT NULL AND v_route_line_id IS NOT NULL THEN
      INSERT INTO public.gf_invoice_lines (invoice_id, route_id, measured_km, invoiced_km, measured_time, invoiced_time, measured_trips, amount, discrepancy, notes, created_at)
      VALUES
        (v_invoice_id, v_route_line_id, 1250.50, 1300.00, 480, 500, 45, 5000.00, -49.50, 'Pequena divergência em km', now()),
        (v_invoice_id, v_route_line_id, 980.25, 1000.00, 360, 380, 38, 3500.00, -19.75, 'Conforme', now())
      ON CONFLICT DO NOTHING;
    END IF;
  END $$;

  -- 10. Criar incidentes (abertos e resolvidos)
  INSERT INTO public.gf_incidents (company_id, route_id, vehicle_id, driver_id, severity, status, description, created_at)
  VALUES
    (v_company_id, v_route_id, v_vehicle_id, v_driver_user_id, 'critical', 'open', 'Veículo quebrado na estrada', now()),
    (v_company_id, v_route_id, v_vehicle_id, v_driver_user_id, 'warning', 'resolved', 'Atraso de 15 minutos - resolvido', now() - INTERVAL '2 days'),
    (v_company_id, v_route_id, NULL, v_driver_user_id, 'medium', 'open', 'Desvio de rota detectado', now() - INTERVAL '1 day')
  ON CONFLICT DO NOTHING;

  -- 11. Criar alguns logs de auditoria
  INSERT INTO public.gf_audit_log (actor_id, action_type, resource_type, resource_id, details, created_at)
  VALUES
    (v_admin_user_id, 'create', 'company', v_company_id, '{"name": "Empresa Demo Admin V43"}'::jsonb, now() - INTERVAL '10 days'),
    (v_admin_user_id, 'create', 'vehicle', v_vehicle_id, '{"plate": "ABC-1234"}'::jsonb, now() - INTERVAL '8 days'),
    (v_admin_user_id, 'approve', 'invoice', (SELECT id FROM public.gf_invoices WHERE empresa_id = v_company_id LIMIT 1), '{"total": 18000}'::jsonb, now() - INTERVAL '5 days')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed de demonstração concluído com sucesso!';
  RAISE NOTICE 'Empresa ID: %', v_company_id;
  RAISE NOTICE 'Admin: admin@demo.com';
  RAISE NOTICE 'Operator: operator@demo.com';
  RAISE NOTICE 'Driver: driver@demo.com';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao executar seed de demonstração: %', SQLERRM;
END $$;

