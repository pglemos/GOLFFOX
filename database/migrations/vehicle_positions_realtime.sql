-- ========================================
-- GolfFox Vehicle Positions Real-time Migration
-- Criação da tabela para posições dos veículos com suporte a real-time
-- ========================================

CREATE TABLE IF NOT EXISTS public.vehicle_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id VARCHAR(50) NOT NULL,
  license_plate VARCHAR(20) NOT NULL,
  driver_name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  speed DECIMAL(5, 2) DEFAULT 0,
  heading DECIMAL(5, 2) DEFAULT 0,
  route_id VARCHAR(50),
  route_name VARCHAR(100),
  passenger_count INTEGER DEFAULT 0,
  capacity INTEGER DEFAULT 30,
  last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_vehicle_id ON public.vehicle_positions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_route_id ON public.vehicle_positions(route_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_status ON public.vehicle_positions(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_last_update ON public.vehicle_positions(last_update);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_vehicle_positions_updated_at 
    BEFORE UPDATE ON public.vehicle_positions 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.vehicle_positions ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Allow read access for authenticated users" ON public.vehicle_positions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserção/atualização para usuários autenticados
CREATE POLICY "Allow insert/update for authenticated users" ON public.vehicle_positions
    FOR ALL USING (auth.role() = 'authenticated');

-- Inserir dados mock para demonstração
INSERT INTO public.vehicle_positions (
    vehicle_id, license_plate, driver_name, latitude, longitude, 
    status, speed, heading, route_id, route_name, passenger_count, capacity
) VALUES 
    ('vehicle_1', 'ABC-1001', 'João Silva', -23.5505, -46.6333, 'active', 45.5, 90.0, 'route_1', 'Rota Centro-Zona Sul', 15, 30),
    ('vehicle_2', 'ABC-1002', 'Maria Santos', -23.5515, -46.6343, 'active', 38.2, 180.0, 'route_2', 'Rota Zona Norte-Centro', 22, 35),
    ('vehicle_3', 'ABC-1003', 'Pedro Oliveira', -23.5495, -46.6323, 'maintenance', 0.0, 0.0, 'route_1', 'Rota Centro-Zona Sul', 0, 30),
    ('vehicle_4', 'ABC-1004', 'Ana Costa', -23.5525, -46.6353, 'active', 52.1, 270.0, 'route_3', 'Rota Zona Leste-Centro', 18, 32),
    ('vehicle_5', 'ABC-1005', 'Carlos Ferreira', -23.5485, -46.6313, 'inactive', 0.0, 45.0, 'route_2', 'Rota Zona Norte-Centro', 0, 35),
    ('vehicle_6', 'ABC-1006', 'Lucia Almeida', -23.5535, -46.6363, 'active', 41.8, 315.0, 'route_4', 'Rota Zona Oeste-Centro', 25, 40),
    ('vehicle_7', 'ABC-1007', 'Roberto Lima', -23.5475, -46.6303, 'active', 47.3, 135.0, 'route_5', 'Rota Aeroporto-Centro', 12, 28),
    ('vehicle_8', 'ABC-1008', 'Fernanda Souza', -23.5545, -46.6373, 'active', 35.6, 225.0, 'route_1', 'Rota Centro-Zona Sul', 20, 30),
    ('vehicle_9', 'ABC-1009', 'Marcos Pereira', -23.5465, -46.6293, 'maintenance', 0.0, 0.0, 'route_3', 'Rota Zona Leste-Centro', 0, 32),
    ('vehicle_10', 'ABC-1010', 'Juliana Rodrigues', -23.5555, -46.6383, 'active', 43.9, 60.0, 'route_2', 'Rota Zona Norte-Centro', 17, 35),
    ('vehicle_11', 'ABC-1011', 'Antonio Barbosa', -23.5455, -46.6283, 'active', 39.7, 120.0, 'route_4', 'Rota Zona Oeste-Centro', 28, 40),
    ('vehicle_12', 'ABC-1012', 'Camila Martins', -23.5565, -46.6393, 'inactive', 0.0, 0.0, 'route_5', 'Rota Aeroporto-Centro', 0, 28),
    ('vehicle_13', 'ABC-1013', 'Rafael Gomes', -23.5445, -46.6273, 'active', 48.2, 200.0, 'route_1', 'Rota Centro-Zona Sul', 14, 30),
    ('vehicle_14', 'ABC-1014', 'Beatriz Carvalho', -23.5575, -46.6403, 'active', 36.4, 300.0, 'route_3', 'Rota Zona Leste-Centro', 21, 32),
    ('vehicle_15', 'ABC-1015', 'Eduardo Nascimento', -23.5435, -46.6263, 'active', 44.1, 15.0, 'route_2', 'Rota Zona Norte-Centro', 19, 35);

-- Comentário para habilitar real-time no Supabase Dashboard
-- IMPORTANTE: Após executar esta migração, vá para o Supabase Dashboard:
-- 1. Navegue para Database → Replication
-- 2. Habilite Real-time para a tabela 'vehicle_positions'
-- 3. Isso permitirá que o Flutter receba atualizações em tempo real
