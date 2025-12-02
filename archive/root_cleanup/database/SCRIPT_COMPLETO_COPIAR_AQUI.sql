-- ========================================
-- V47: Adicionar colunas faltantes na tabela vehicles
-- ========================================
-- Execute este arquivo NO SUPABASE SQL EDITOR
-- Data: 2025-01-06
--
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo (Ctrl+A, Ctrl+C)
-- 2. Abra o Supabase SQL Editor
-- 3. Cole o conteúdo (Ctrl+V)
-- 4. Clique em "Run" (ou Ctrl+Enter)
-- 5. Aguarde as mensagens de sucesso
-- ========================================

-- Verificar se a coluna photo_url existe antes de adicionar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE public.vehicles 
    ADD COLUMN photo_url TEXT NULL;
    
    COMMENT ON COLUMN public.vehicles.photo_url IS 
      'URL pública da foto do veículo armazenada no Supabase Storage';
  END IF;
END $$;

-- Verificar se a coluna capacity existe antes de adicionar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'capacity'
  ) THEN
    ALTER TABLE public.vehicles 
    ADD COLUMN capacity INTEGER NULL;
    
    COMMENT ON COLUMN public.vehicles.capacity IS 
      'Capacidade de passageiros do veículo';
  END IF;
END $$;

-- Verificar se a coluna is_active existe antes de adicionar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.vehicles 
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    
    COMMENT ON COLUMN public.vehicles.is_active IS 
      'Indica se o veículo está ativo no sistema';
  END IF;
END $$;

-- Verificar se a coluna company_id existe antes de adicionar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.vehicles 
    ADD COLUMN company_id UUID NULL;
    
    -- Adicionar foreign key para companies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
      ALTER TABLE public.vehicles 
      ADD CONSTRAINT fk_vehicles_company 
      FOREIGN KEY (company_id) 
      REFERENCES public.companies(id) 
      ON DELETE SET NULL;
    END IF;
    
    COMMENT ON COLUMN public.vehicles.company_id IS 
      'ID da empresa proprietária do veículo';
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_vehicles_is_active ON public.vehicles(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON public.vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(plate);

-- Criar bucket de storage para fotos de veículos se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage para permitir leitura pública
DROP POLICY IF EXISTS "Public read access for vehicle photos" ON storage.objects;
CREATE POLICY "Public read access for vehicle photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-photos');

-- Política de storage para permitir upload autenticado
DROP POLICY IF EXISTS "Authenticated users can upload vehicle photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload vehicle photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-photos' 
  AND auth.role() = 'authenticated'
);

-- Política de storage para permitir update autenticado
DROP POLICY IF EXISTS "Authenticated users can update vehicle photos" ON storage.objects;
CREATE POLICY "Authenticated users can update vehicle photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vehicle-photos' 
  AND auth.role() = 'authenticated'
);

-- Política de storage para permitir delete autenticado
DROP POLICY IF EXISTS "Authenticated users can delete vehicle photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete vehicle photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-photos' 
  AND auth.role() = 'authenticated'
);

-- Atualizar view v_live_vehicles se ela existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'v_live_vehicles'
  ) THEN
    -- Recriar a view com as novas colunas
    DROP VIEW IF EXISTS public.v_live_vehicles CASCADE;
    
    CREATE OR REPLACE VIEW public.v_live_vehicles AS
    WITH latest_positions AS (
      SELECT DISTINCT ON (dp.trip_id)
        dp.trip_id,
        t.vehicle_id,
        t.route_id,
        t.driver_id,
        dp.latitude AS lat,
        dp.longitude AS lng,
        dp.speed,
        dp.heading,
        dp.timestamp AS last_position_time,
        t.status AS trip_status
      FROM public.driver_positions dp
      INNER JOIN public.trips t ON t.id = dp.trip_id
      WHERE t.status = 'inProgress'
        AND dp.timestamp > NOW() - INTERVAL '5 minutes'
      ORDER BY dp.trip_id, dp.timestamp DESC
    ),
    vehicle_status AS (
      SELECT 
        v.id AS vehicle_id,
        v.plate,
        v.model,
        v.capacity,
        v.is_active,
        v.photo_url,
        v.company_id,
        COALESCE(c.name, 'Sem Empresa') AS company_name,
        lp.trip_id,
        lp.route_id,
        r.name AS route_name,
        lp.driver_id,
        u.name AS driver_name,
        u.email AS driver_email,
        lp.lat,
        lp.lng,
        lp.speed,
        lp.heading,
        lp.last_position_time,
        lp.trip_status,
        CASE
          WHEN lp.speed IS NULL OR lp.speed < 0.83 THEN
            CASE 
              WHEN lp.last_position_time < NOW() - INTERVAL '3 minutes' THEN 'stopped_long'
              WHEN lp.last_position_time < NOW() - INTERVAL '2 minutes' THEN 'stopped_short'
              ELSE 'stopped_short'
            END
          ELSE 'moving'
        END AS vehicle_status,
        COALESCE(
          (SELECT COUNT(*) FROM public.trip_passengers tp WHERE tp.trip_id = lp.trip_id),
          0
        ) AS passenger_count
      FROM public.vehicles v
      LEFT JOIN public.companies c ON c.id = v.company_id
      LEFT JOIN latest_positions lp ON lp.vehicle_id = v.id
      LEFT JOIN public.routes r ON r.id = lp.route_id
      LEFT JOIN public.users u ON u.id = lp.driver_id
      WHERE v.is_active = true
        AND (lp.vehicle_id IS NOT NULL OR v.id IN (
          SELECT DISTINCT vehicle_id FROM public.trips WHERE status = 'inProgress'
        ))
    )
    SELECT * FROM vehicle_status;
    
    COMMENT ON VIEW public.v_live_vehicles IS 
      'Veículos em tempo real com última posição, heading calculado, status e ocupação. Admin vê todas as empresas.';
  END IF;
END $$;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration v47 completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added columns: photo_url, capacity, is_active, company_id to vehicles table';
  RAISE NOTICE 'Created storage bucket: vehicle-photos';
  RAISE NOTICE 'Updated view: v_live_vehicles';
  RAISE NOTICE 'Created indexes: idx_vehicles_is_active, idx_vehicles_company_id, idx_vehicles_plate';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify columns: SELECT * FROM information_schema.columns WHERE table_name = ''vehicles'';';
  RAISE NOTICE '2. Verify storage: Check Storage > vehicle-photos in Supabase dashboard';
  RAISE NOTICE '3. Test the system: Try creating a vehicle with photo';
  RAISE NOTICE '========================================';
END $$;

