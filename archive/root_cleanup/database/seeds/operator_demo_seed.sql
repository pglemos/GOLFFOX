-- GOLF FOX - Operator Demo Seed (ajuste os IDs antes de executar)
-- Substitua os placeholders pelos IDs reais da sua instância
-- :empresa_id       -> company_id do operador
-- :carrier_id       -> company_id de uma transportadora disponível
-- :invoice_id       -> será preenchido pelo primeiro insert returning
-- :route_id_1/_2/_3 -> rotas reais da empresa (opcional para custos/incidentes)

-- Vincular uma transportadora à empresa (read-only para operador, visível em /operator/prestadores)
insert into gf_assigned_carriers (empresa_id, carrier_id, period_start, notes)
values (:empresa_id, :carrier_id, current_date - interval '15 days', 'Alocação inicial pela GolfFox')
on conflict do nothing;

-- Criar fatura e linhas (visível em /operator/custos)
insert into gf_invoices (empresa_id, invoice_number, period_start, period_end, total_amount, status)
values (:empresa_id, 'GF-INV-0001', date_trunc('month', current_date), (date_trunc('month', current_date) + interval '1 month - 1 day')::date, 12500, 'pending')
returning id into :invoice_id;

-- Selecione até 3 rotas reais da empresa para popular custos
-- select id,name from routes where company_id = :empresa_id limit 3;

insert into gf_invoice_lines (invoice_id, route_id, description, measured_km, invoiced_km, measured_time, invoiced_time, measured_trips, invoiced_trips, unit_price, amount, discrepancy)
values
  (:invoice_id, :route_id_1, 'Serviço turno manhã', 820, 850, 1320, 1380, 26, 26, 250, 6500, 120),
  (:invoice_id, :route_id_2, 'Serviço turno tarde', 610, 600, 1010, 1000, 20, 20, 240, 4800, -50),
  (:invoice_id, :route_id_3, 'Reserva contingência', 0, 0, 0, 0, 0, 0, 1200, 1200, 0);

-- Solicitações do operador (visível em /operator/solicitacoes)
select rpc_request_service(
  :empresa_id,
  'nova_rota',
  jsonb_build_object(
    'turno','manha',
    'janela','06:00-08:00',
    'dias', array['seg','ter','qua','qui','sex'],
    'volume_previsto', 42
  )
);

insert into gf_service_requests (empresa_id, tipo, payload, status, priority, created_by)
values
  (:empresa_id, 'alteracao', jsonb_build_object('route_id', :route_id_1, 'janela','07:00-09:00'), 'em_analise', 'normal', auth.uid()),
  (:empresa_id, 'socorro', jsonb_build_object('descricao','Veículo parado no acesso A'), 'enviado', 'alta', auth.uid());

-- Incidente (visível em /operator/conformidade)
select rpc_raise_incident(:empresa_id, :route_id_2, 'veiculo_quebrado', 'alta', 'Pane elétrica próximo à portaria.');

-- Comunicados (visível em /operator/comunicacoes)
insert into gf_announcements (operator_id, empresa_id, title, message, target_type, created_at)
values (auth.uid(), :empresa_id, 'Ajuste de Janela', 'Rota manhã com nova janela 06:20-07:50 a partir de amanhã.', 'company', now());
