-- ========================================
-- GolfFox Transport Management System
-- Seed Data v7.4 - Demo/Debug (UUIDs válidos + auto-driver)
-- ========================================

-- Extensões (necessário para gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Companies
INSERT INTO public.companies (id, name) VALUES
  ('11111111-1111-4111-8111-1111111111c1','Acme Corp')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;

-- Carriers
INSERT INTO public.carriers (id, name) VALUES
  ('22222222-2222-4222-8222-2222222222ca','TransPrime')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;

-- Vehicles
INSERT INTO public.vehicles (id, plate, model, carrier_id) VALUES
  ('33333333-3333-4333-8333-3333333333b1','GFX-0001','Marcopolo Torino','22222222-2222-4222-8222-2222222222ca')
ON CONFLICT (id) DO UPDATE SET plate=EXCLUDED.plate, model=EXCLUDED.model, carrier_id=EXCLUDED.carrier_id;

-- Routes
INSERT INTO public.routes (id, name, company_id, carrier_id) VALUES
  ('44444444-4444-4444-8444-4444444444b2','Rota ACME 1','11111111-1111-4111-8111-1111111111c1','22222222-2222-4222-8222-2222222222ca')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, company_id=EXCLUDED.company_id, carrier_id=EXCLUDED.carrier_id;

-- Route Stops (IDs 100% hex)
INSERT INTO public.route_stops (id, route_id, seq, name, lat, lng) VALUES
  ('55555555-5555-4555-8555-5555555555a1','44444444-4444-4444-8444-4444444444b2',1,'Ponto 1', -23.563099,-46.654389),
  ('66666666-6666-4666-8666-6666666666a2','44444444-4444-4444-8444-4444444444b2',2,'Ponto 2', -23.567100,-46.651000),
  ('77777777-7777-4777-8777-7777777777a3','44444444-4444-4444-8444-4444444444b2',3,'Empresa', -23.570200,-46.649500)
ON CONFLICT (id) DO UPDATE
  SET route_id=EXCLUDED.route_id, seq=EXCLUDED.seq, name=EXCLUDED.name, lat=EXCLUDED.lat, lng=EXCLUDED.lng;

-- ========================================
-- Sample Trip (auto-driver a partir de public.users)
-- ========================================
WITH d AS (
  SELECT id AS driver_id
  FROM public.users
  ORDER BY id
  LIMIT 1
)
INSERT INTO public.trips (id, route_id, vehicle_id, driver_id, status, scheduled_at)
SELECT
  '88888888-8888-4888-8888-8888888888b1',  -- <- corrigido
  '44444444-4444-4444-8444-4444444444b2',
  '33333333-3333-4333-8333-3333333333b1',
  d.driver_id,
  'scheduled',
  NOW()
FROM d
ON CONFLICT (id) DO UPDATE
  SET route_id=EXCLUDED.route_id,
      vehicle_id=EXCLUDED.vehicle_id,
      driver_id=EXCLUDED.driver_id,
      status=EXCLUDED.status,
      scheduled_at=EXCLUDED.scheduled_at;

-- ========================================
-- Sample Driver Positions (alinha com o mesmo driver_id)
-- ========================================
WITH d AS (
  SELECT id AS driver_id
  FROM public.users
  ORDER BY id
  LIMIT 1
)
INSERT INTO public.driver_positions (id, trip_id, driver_id, lat, lng, speed, "timestamp")
SELECT
  gen_random_uuid(),
  '88888888-8888-4888-8888-8888888888b1',  -- <- corrigido
  d.driver_id,
  -23.563099 + (g.i*0.0006),
  -46.654389 + (g.i*0.0006),
  35 + (g.i%5)*2,
  NOW() - ((30-g.i) * interval '10 seconds')
FROM d, generate_series(1,30) AS g(i)
ON CONFLICT DO NOTHING;

/*
Notas:
- Se public.users estiver vazio, os CTEs (WITH d AS ...) não retornam linhas e nada será inserido em trips/driver_positions.
- Como você já tem usuários, isso sobe sem violar a FK.
*/
