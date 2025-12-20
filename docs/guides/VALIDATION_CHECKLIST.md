# ✅ GolfFox v7.4 - Validation Checklist

## 🎯 Antes de Começar

Execute estes comandos SQL no Supabase SQL Editor para validar que tudo foi criado corretamente.

---

## 1️⃣ Validação de Extensões

```sql
-- Deve retornar 3 rows
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_cron');
```

✅ Esperado: `uuid-ossp`, `pgcrypto`, `pg_cron` presentes

---

## 2️⃣ Validação de Tabelas

```sql
-- Deve retornar 11 tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'companies', 'carriers', 'users', 'vehicles', 'routes', 
    'route_stops', 'trips', 'trip_passengers', 'driver_positions', 
    'trip_events', 'trip_summary', 'checklists', 'passenger_reports', 'chat_messages'
  )
ORDER BY table_name;
```

✅ Esperado: Todas as 14 tabelas presentes

---

## 3️⃣ Validação de Helper Functions

```sql
-- Deve retornar 4 functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_admin', 'current_role', 'current_company_id', 'current_carrier_id')
ORDER BY routine_name;
```

✅ Esperado: 4 funções criadas

---

## 4️⃣ Validação de RLS Policies

```sql
-- Deve retornar ~30 policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

✅ Esperado: ~30+ políticas RLS

**Verifique especialmente:**
- `driver_positions`: 4 policies (admin, insert, driver_read, company_read, carrier_read)
- `trips`: 5 policies (admin, company, transportadora, motorista, passageiro)
- `users`: 5 policies (admin, company, transportadora, self read, self update)

---

## 5️⃣ Validação de RLS Habilitado

```sql
-- Deve retornar TRUE para todas as tabelas
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'routes', 'trips', 'vehicles', 'driver_positions', 'trip_events', 'trip_summary');
```

✅ Esperado: `rowsecurity = true` para todas

---

## 6️⃣ Validação de Triggers

```sql
-- Deve retornar 1 trigger
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trg_driver_positions_recalc_summary';
```

✅ Esperado: Trigger `trg_driver_positions_recalc_summary` presente

---

## 7️⃣ Validação de RPC Function

```sql
-- Deve retornar 1 function
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'rpc_trip_transition';
```

✅ Esperado: Função `rpc_trip_transition` presente

---

## 8️⃣ Validação de Trip Summary Function

```sql
-- Deve retornar 1 function
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'calculate_trip_summary';
```

✅ Esperado: Função `calculate_trip_summary` presente

---

## 9️⃣ Validação de Índices

```sql
-- Deve retornar os índices criados
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname IN (
    'trips_driver_idx', 'trips_route_idx', 'routes_company_idx', 
    'routes_carrier_idx', 'pos_trip_idx', 'events_trip_idx', 'summary_trip_idx'
  );
```

✅ Esperado: 7 índices criados

---

## 🔟 Validação de Grants

```sql
-- Deve retornar grants para anon, authenticated, service_role
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee;
```

✅ Esperado: Grants para anon, authenticated, service_role

---

## 1️⃣1️⃣ Validação de Seeds (após executar)

```sql
-- Verificar se dados foram inseridos
SELECT 'companies' as table_name, COUNT(*) as count FROM companies
UNION ALL
SELECT 'carriers', COUNT(*) FROM carriers
UNION ALL
SELECT 'routes', COUNT(*) FROM routes
UNION ALL
SELECT 'route_stops', COUNT(*) FROM route_stops
UNION ALL
SELECT 'trips', COUNT(*) FROM trips
UNION ALL
SELECT 'driver_positions', COUNT(*) FROM driver_positions;
```

✅ Esperado: Pelo menos 1 row em cada tabela (após executar seeds)

---

## 1️⃣2️⃣ Validação de Auth Users (após criar)

```sql
-- Verificar se auth.users foram criados
SELECT email, email_confirmed_at IS NOT NULL as confirmed
FROM auth.users 
WHERE email IN (
  'golffox@admin.com',
  'operador@empresa.com',
  'transportadora@trans.com',
  'motorista@trans.com',
  'passageiro@empresa.com'
)
ORDER BY email;
```

✅ Esperado: 5 usuários, todos com `confirmed = true`

---

## 1️⃣3️⃣ Validação de Public Users (após executar auth patch)

```sql
-- Verificar se public.users foram linkados
SELECT u.email, u.role, c.name as company, ca.name as transportadora
FROM public.users u
LEFT JOIN public.companies c ON c.id = u.company_id
LEFT JOIN public.carriers ca ON ca.id = u.carrier_id
WHERE u.email IN (
  'golffox@admin.com',
  'operador@empresa.com',
  'transportadora@trans.com',
  'motorista@trans.com',
  'passageiro@empresa.com'
)
ORDER BY u.email;
```

✅ Esperado: 5 usuários com roles corretos

**Esperado Roles:**
- `golffox@admin.com` → role = `admin`, company/transportadora = NULL
- `operador@empresa.com` → role = `operador`, company = 'Acme Corp'
- `transportadora@trans.com` → role = `transportadora`, transportadora = 'TransPrime'
- `motorista@trans.com` → role = `motorista`, transportadora = 'TransPrime'
- `passageiro@empresa.com` → role = `passageiro`, company = 'Acme Corp'

---

## 1️⃣4️⃣ Validação de Realtime (após ativar no painel)

```sql
-- Verificar publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'driver_positions';
```

✅ Esperado: 1 row retornado (após ativar Realtime no painel)

**Como ativar:** Dashboard → Database → Replication → Toggle `driver_positions`

---

## 🎯 Teste de RLS (por papel)

### Teste Admin

```sql
-- Simular usuário admin
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id FROM auth.users WHERE email = 'golffox@admin.com'))::text, true);

-- Deve retornar todas as trips
SELECT COUNT(*) FROM trips;
```

✅ Esperado: Retorna todas as trips (admin vê tudo)

---

### Teste motorista

```sql
-- Simular usuário motorista
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id FROM auth.users WHERE email = 'motorista@trans.com'))::text, true);

-- Deve retornar apenas trips do motorista
SELECT COUNT(*) FROM trips WHERE driver_id = (SELECT id FROM auth.users WHERE email = 'motorista@trans.com');
```

✅ Esperado: Retorna apenas trips do motorista logado

---

### Teste operador (Company-scoped)

```sql
-- Simular usuário operador
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id FROM auth.users WHERE email = 'operador@empresa.com'))::text, true);

-- Deve retornar apenas routes da company
SELECT COUNT(*) FROM routes WHERE company_id = (SELECT company_id FROM public.users WHERE email = 'operador@empresa.com');
```

✅ Esperado: Retorna apenas routes da company do operador

---

## 🎯 Teste RPC Trip Transition

```sql
-- Simular usuário admin
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id FROM auth.users WHERE email = 'golffox@admin.com'))::text, true);

-- Pegar trip de teste
SELECT id, status FROM trips LIMIT 1;

-- Transicionar para inProgress (substitua <trip_id>)
SELECT * FROM rpc_trip_transition(
  '<trip_id>'::uuid,
  'inProgress',
  'Teste de transição',
  -23.563099,
  -46.654389,
  false
);
```

✅ Esperado: Retorna `{"status": "inProgress"}` e a trip muda de status

**Verificar:**
```sql
-- Deve ter criado evento
SELECT COUNT(*) FROM trip_events WHERE trip_id = '<trip_id>';
```

---

## 🎯 Teste Trip Summary Calculation

```sql
-- Inserir algumas posições de teste
INSERT INTO driver_positions (trip_id, driver_id, lat, lng, speed)
SELECT 
  (SELECT id FROM trips LIMIT 1),
  (SELECT id FROM auth.users WHERE email = 'motorista@trans.com'),
  -23.563 + (i * 0.001),
  -46.654 + (i * 0.001),
  45 + (i % 5)
FROM generate_series(1, 10) i;

-- Verificar se summary foi calculado automaticamente (via trigger)
SELECT 
  trip_id, 
  samples, 
  total_distance_km, 
  duration_minutes, 
  avg_speed_kmh
FROM trip_summary 
WHERE trip_id = (SELECT id FROM trips LIMIT 1);
```

✅ Esperado: Summary calculado com `samples > 0`

---

## ✅ Checklist Final

- [ ] Todas as 14 tabelas criadas
- [ ] Todas as 4 helper functions criadas
- [ ] ~30+ políticas RLS criadas
- [ ] RLS habilitado em todas as tabelas
- [ ] Trigger de summary criado
- [ ] RPC function criada
- [ ] 7 índices criados
- [ ] Grants aplicados
- [ ] Seeds executados (dados de teste)
- [ ] 5 auth.users criados e confirmados
- [ ] 5 public.users linkados com roles corretos
- [ ] Realtime habilitado em `driver_positions`
- [ ] RLS testado (admin, motorista, operador)
- [ ] RPC de transição funcionando
- [ ] Trip summary sendo calculado

---

## 🚨 Se alguma validação falhar:

1. **Verifique logs**: Dashboard → Logs → Postgres
2. **Re-execute SQL**: Todo SQL é idempotente, pode rodar múltiplas vezes
3. **Verifique erros**: Procure por mensagens de erro no SQL Editor
4. **Consulte docs**: Veja `IMPLEMENTATION_COMPLETE.md`

---

## ✨ Próximo Passo

Após TODAS as validações passarem:

→ **Rode o app Flutter e teste o login!**

```bash
flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
```

**Login:** `motorista@trans.com` / `senha123`

