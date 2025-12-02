-- RPCs (Remote Procedure Calls) for Operator Panel - GOLF FOX v42.6
-- Functions for operator to create requests and actions

-- rpc_request_service: Criar solicitação para GOLF FOX
CREATE OR REPLACE FUNCTION rpc_request_service(
  p_empresa UUID,
  p_tipo TEXT,
  p_payload JSONB
) RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  -- Verificar se o usuário tem permissão para criar solicitação para esta empresa
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND company_id = p_empresa
    AND role = 'operator'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: usuário não pertence a esta empresa';
  END IF;

  INSERT INTO gf_service_requests (empresa_id, tipo, payload, status, created_by)
  VALUES (p_empresa, p_tipo, p_payload, 'enviado', auth.uid())
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- rpc_request_route_change: Solicitar alteração em rota
CREATE OR REPLACE FUNCTION rpc_request_route_change(
  p_empresa UUID,
  p_route UUID,
  p_payload JSONB
) RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  -- Verificar se a rota pertence à empresa
  IF NOT EXISTS (
    SELECT 1 FROM routes 
    WHERE id = p_route 
    AND company_id = p_empresa
  ) THEN
    RAISE EXCEPTION 'Rota não pertence a esta empresa';
  END IF;

  INSERT INTO gf_service_requests (empresa_id, tipo, payload, status, created_by)
  VALUES (p_empresa, 'alteracao_rota', jsonb_build_object('route_id', p_route, 'changes', p_payload), 'enviado', auth.uid())
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- rpc_raise_incident: Reportar incidente (cria incidente e service request)
CREATE OR REPLACE FUNCTION rpc_raise_incident(
  p_empresa UUID,
  p_rota UUID,
  p_tipo TEXT,
  p_severidade TEXT,
  p_descricao TEXT
) RETURNS UUID AS $$
DECLARE
  v_incident_id UUID;
BEGIN
  -- Verificar se a rota pertence à empresa (se fornecida)
  IF p_rota IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM routes 
    WHERE id = p_rota 
    AND company_id = p_empresa
  ) THEN
    RAISE EXCEPTION 'Rota não pertence a esta empresa';
  END IF;

  -- Criar incidente
  INSERT INTO gf_operator_incidents (empresa_id, route_id, tipo, severidade, descricao, status, created_by)
  VALUES (p_empresa, p_rota, p_tipo, p_severidade, p_descricao, 'aberto', auth.uid())
  RETURNING id INTO v_incident_id;
  
  -- Criar service request para GOLF FOX
  INSERT INTO gf_service_requests (empresa_id, tipo, payload, status, priority)
  VALUES (p_empresa, 'incidente', jsonb_build_object('incident_id', v_incident_id, 'route_id', p_rota), 'enviado', 
    CASE 
      WHEN p_severidade = 'critica' THEN 'urgente'
      WHEN p_severidade = 'alta' THEN 'alta'
      ELSE 'normal'
    END
  );
  
  RETURN v_incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- rpc_invoice_reconcile: Conciliação de fatura (calcula divergências)
CREATE OR REPLACE FUNCTION rpc_invoice_reconcile(p_invoice_id UUID)
RETURNS TABLE(discrepancy NUMERIC, details JSONB) AS $$
DECLARE
  v_empresa_id UUID;
  v_total_discrepancy NUMERIC := 0;
  v_details JSONB;
BEGIN
  -- Verificar se a fatura pertence à empresa do operador
  SELECT empresa_id INTO v_empresa_id
  FROM gf_invoices
  WHERE id = p_invoice_id;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Fatura não encontrada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND company_id = v_empresa_id
  ) THEN
    RAISE EXCEPTION 'Acesso negado: fatura não pertence à sua empresa';
  END IF;

  -- Calcular divergências por linha
  SELECT 
    SUM(discrepancy) as total,
    jsonb_agg(
      jsonb_build_object(
        'line_id', il.id,
        'route_id', il.route_id,
        'description', il.description,
        'km_discrepancy', COALESCE(il.invoiced_km, 0) - COALESCE(il.measured_km, 0),
        'time_discrepancy', COALESCE(il.invoiced_time, 0) - COALESCE(il.measured_time, 0),
        'trips_discrepancy', COALESCE(il.invoiced_trips, 0) - COALESCE(il.measured_trips, 0),
        'amount_discrepancy', il.discrepancy
      )
    ) INTO v_total_discrepancy, v_details
  FROM gf_invoice_lines il
  WHERE il.invoice_id = p_invoice_id;

  -- Atualizar status da fatura
  UPDATE gf_invoices
  SET status = 'reconciled',
      reconciled_by = auth.uid()
  WHERE id = p_invoice_id;

  RETURN QUERY SELECT v_total_discrepancy, COALESCE(v_details, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- rpc_carrier_monthly_score: Calcular score mensal da transportadora (se necessário, usado por admin mas visível para operador)
CREATE OR REPLACE FUNCTION rpc_carrier_monthly_score(
  p_carrier_id UUID,
  p_month DATE
) RETURNS TABLE(score NUMERIC, details JSONB) AS $$
DECLARE
  v_punctuality NUMERIC;
  v_availability NUMERIC;
  v_total_score NUMERIC;
  v_details JSONB;
BEGIN
  -- Calcular pontualidade
  SELECT 
    (COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes')::NUMERIC / 
     NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed'), 0)) * 100
  INTO v_punctuality
  FROM trips t
  JOIN routes r ON r.id = t.route_id
  JOIN gf_assigned_carriers ac ON ac.empresa_id = r.company_id AND ac.carrier_id = p_carrier_id
  WHERE DATE_TRUNC('month', t.scheduled_at) = DATE_TRUNC('month', p_month);

  -- Calcular disponibilidade (simplificado: viagens não canceladas / total)
  SELECT 
    (COUNT(DISTINCT t.id) FILTER (WHERE t.status != 'cancelled')::NUMERIC / 
     NULLIF(COUNT(DISTINCT t.id), 0)) * 100
  INTO v_availability
  FROM trips t
  JOIN routes r ON r.id = t.route_id
  JOIN gf_assigned_carriers ac ON ac.empresa_id = r.company_id AND ac.carrier_id = p_carrier_id
  WHERE DATE_TRUNC('month', t.scheduled_at) = DATE_TRUNC('month', p_month);

  -- Score composto (70% pontualidade, 30% disponibilidade)
  v_total_score := COALESCE(v_punctuality * 0.7, 0) + COALESCE(v_availability * 0.3, 0);

  v_details := jsonb_build_object(
    'punctuality', COALESCE(v_punctuality, 0),
    'availability', COALESCE(v_availability, 0),
    'month', p_month
  );

  RETURN QUERY SELECT v_total_score, v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

