-- ============================================================================
-- v42_enable_realtime_tables.sql
-- Habilita publicação Supabase Realtime para tabelas usadas no Admin Map
-- ============================================================================

-- Driver positions (já deveria estar habilitada, reforçamos aqui)
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_positions;

-- Trips (status em tempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;

-- Alertas (incidentes e solicitações de socorro) – opcional
-- Habilite somente se deseja receber eventos destas tabelas em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.gf_incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gf_service_requests;

-- Comentários para auditoria
COMMENT ON TABLE public.trips IS 'Realtime enabled: trip status updates for Admin Map';
COMMENT ON TABLE public.driver_positions IS 'Realtime enabled: live GPS positions for Admin Map';
COMMENT ON TABLE public.gf_incidents IS 'Realtime enabled: open incidents stream';
COMMENT ON TABLE public.gf_service_requests IS 'Realtime enabled: assistance requests stream';

