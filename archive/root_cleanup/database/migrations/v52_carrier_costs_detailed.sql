-- ============================================================================
-- v52_carrier_costs_detailed.sql
-- Tabelas de custos detalhados por veículo e por rota
-- ============================================================================

-- Custos por veículo
CREATE TABLE IF NOT EXISTS public.vehicle_costs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  cost_category text CHECK (cost_category IN ('combustivel', 'manutencao', 'seguro', 'ipva', 'depreciacao', 'pneus', 'lavagem', 'pedagio', 'multas', 'outros')) NOT NULL,
  cost_date date NOT NULL,
  amount_brl numeric(12, 2) NOT NULL,
  quantity numeric(10, 2),
  unit_measure text,
  odometer_km integer,
  description text,
  invoice_number text,
  supplier text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Custos por rota
CREATE TABLE IF NOT EXISTS public.route_costs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id uuid REFERENCES public.routes(id) ON DELETE CASCADE NOT NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  cost_date date NOT NULL,
  fuel_cost_brl numeric(12, 2) DEFAULT 0,
  labor_cost_brl numeric(12, 2) DEFAULT 0,
  maintenance_cost_brl numeric(12, 2) DEFAULT 0,
  toll_cost_brl numeric(12, 2) DEFAULT 0,
  fixed_cost_brl numeric(12, 2) DEFAULT 0,
  total_cost_brl numeric(12, 2) GENERATED ALWAYS AS (fuel_cost_brl + labor_cost_brl + maintenance_cost_brl + toll_cost_brl + fixed_cost_brl) STORED,
  passengers_transported integer DEFAULT 0,
  cost_per_passenger_brl numeric(12, 2) GENERATED ALWAYS AS (
    CASE WHEN passengers_transported > 0 
      THEN (fuel_cost_brl + labor_cost_brl + maintenance_cost_brl + toll_cost_brl + fixed_cost_brl) / passengers_transported 
      ELSE 0 
    END
  ) STORED,
  distance_km numeric(10, 2),
  notes text,
  created_at timestamptz DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_vehicle_id ON public.vehicle_costs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_date ON public.vehicle_costs(cost_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_category ON public.vehicle_costs(cost_category);
CREATE INDEX IF NOT EXISTS idx_route_costs_route_id ON public.route_costs(route_id);
CREATE INDEX IF NOT EXISTS idx_route_costs_trip_id ON public.route_costs(trip_id);
CREATE INDEX IF NOT EXISTS idx_route_costs_date ON public.route_costs(cost_date);

-- RLS Policies
ALTER TABLE public.vehicle_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_costs ENABLE ROW LEVEL SECURITY;

-- Policies para custos de veículos
DROP POLICY IF EXISTS "Carriers can manage their vehicle costs" ON public.vehicle_costs;
CREATE POLICY "Carriers can manage their vehicle costs"
  ON public.vehicle_costs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_costs.vehicle_id
      AND v.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Policies para custos de rotas
DROP POLICY IF EXISTS "Carriers can manage their route costs" ON public.route_costs;
CREATE POLICY "Carriers can manage their route costs"
  ON public.route_costs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.routes r
      WHERE r.id = route_costs.route_id
      AND r.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_vehicle_costs_updated_at ON public.vehicle_costs;
CREATE TRIGGER update_vehicle_costs_updated_at
  BEFORE UPDATE ON public.vehicle_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.vehicle_costs IS 'Custos operacionais detalhados por veículo';
COMMENT ON TABLE public.route_costs IS 'Custos consolidados por rota/viagem';

