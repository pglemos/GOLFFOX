# Migrations Criadas na Auditoria

**Data:** 2025-01-XX  
**Status:** ✅ Todas as migrations criadas e prontas para aplicação

---

## RESUMO

Durante a auditoria completa do sistema Golf Fox, foram criadas **5 novas migrations** para corrigir problemas críticos e implementar melhorias funcionais.

---

## ORDEM DE APLICAÇÃO

### ⚠️ IMPORTANTE: Aplicar na ordem abaixo

1. **003_rls_helper_functions.sql** - Helper functions RLS (pré-requisito para políticas)
2. **004_canonical_rls_policies.sql** - Políticas RLS canônicas (usa helper functions)
3. **005_improve_rpc_trip_transition.sql** - RPC melhorada (usa helper functions)
4. **006_trip_summary.sql** - Trip Summary (usa tabela trips)
5. **007_consolidate_address_columns.sql** - Colunas de endereço (opcional, se necessário)

---

## DETALHAMENTO DAS MIGRATIONS

### 1. `003_rls_helper_functions.sql`

**Objetivo:** Criar funções helper para políticas RLS

**Funções Criadas:**
- `is_admin()` - Verifica se usuário é admin
- `current_role()` - Obtém role atual do usuário
- `current_company_id()` - Obtém company_id do usuário
- `current_carrier_id()` - Obtém carrier_id do usuário
- `get_user_by_id_for_login(p_user_id UUID)` - Busca usuário por ID (usado pela API de login)

**Dependências:** Nenhuma

**Idempotente:** ✅ Sim (CREATE OR REPLACE)

---

### 2. `004_canonical_rls_policies.sql`

**Objetivo:** Substituir políticas RLS básicas por políticas canônicas por role

**Políticas Criadas:**
- **Companies:** Admin (full), Operator (own company), Carrier (own company)
- **Users:** Admin (full), Operator (company users), Carrier (carrier users), Driver (own profile), Passenger (own profile)
- **Routes:** Admin (full), Operator (company routes), Carrier (carrier routes), Driver (assigned routes), Passenger (assigned routes)
- **Vehicles:** Admin (full), Operator (company vehicles), Carrier (carrier vehicles), Driver (assigned vehicles)
- **Trips:** Admin (full), Operator (company trips), Carrier (carrier trips), Driver (own trips), Passenger (assigned trips)
- **Costs:** Admin (full), Operator (company costs), Carrier (carrier costs)
- **Driver Positions:** Admin (full), Driver (insert own), Operator (company trips), Carrier (carrier trips), Driver (own trips)

**Total:** 30+ políticas canônicas

**Dependências:** 
- ✅ `003_rls_helper_functions.sql` (usa `is_admin()`, `current_role()`, etc.)

**Idempotente:** ✅ Sim (DROP POLICY IF EXISTS antes de criar)

---

### 3. `005_improve_rpc_trip_transition.sql`

**Objetivo:** Melhorar RPC de transição de trips com controle de concorrência e validações

**Melhorias:**
- ✅ `SELECT FOR UPDATE` para controle de concorrência
- ✅ Validação de transições de estado válidas
- ✅ Verificação de permissões por role
- ✅ Suporte a `p_force` para reabertura (admin/operator/carrier)
- ✅ Atualização automática de timestamps (`actual_start_time`, `actual_end_time`)
- ✅ Atualização de coordenadas GPS
- ✅ Audit trail em `trip_events`

**Transições Válidas:**
- `scheduled → inProgress` (Driver starts)
- `scheduled → cancelled` (Admin/Operator/Carrier cancels)
- `inProgress → completed` (Driver completes)
- `inProgress → cancelled` (Admin/Operator/Carrier cancels)
- `completed → inProgress` (Admin/Operator/Carrier reopen com force=true)

**Dependências:**
- ✅ `003_rls_helper_functions.sql` (usa `is_admin()`, `current_role()`)
- ✅ Tabela `trips` deve existir
- ✅ Tabela `trip_events` deve existir

**Idempotente:** ✅ Sim (DROP FUNCTION IF EXISTS antes de criar)

---

### 4. `006_trip_summary.sql`

**Objetivo:** Implementar cálculo automático de resumos de trips usando fórmula Haversine

**Componentes Criados:**

#### Tabela `trip_summary`
- Métricas calculadas: distância total, duração, velocidades, contagem de posições
- RLS policies por role

#### Função `haversine_distance`
- Calcula distância entre duas coordenadas GPS
- Retorna distância em quilômetros
- Precisão alta usando fórmula Haversine

#### Função `calculate_trip_summary`
- Calcula métricas automaticamente
- Usa window functions para eficiência
- Upsert idempotente

#### Trigger `trg_driver_positions_recalc_summary`
- Recalcula summary automaticamente em INSERT/UPDATE/DELETE de `driver_positions`
- Mantém summary sempre atualizado

**Dependências:**
- ✅ Tabela `trips` deve existir
- ✅ Tabela `driver_positions` deve existir
- ✅ `003_rls_helper_functions.sql` (para RLS policies)

**Idempotente:** ✅ Sim (CREATE IF NOT EXISTS, DROP TRIGGER IF EXISTS)

---

### 5. `007_consolidate_address_columns.sql`

**Objetivo:** Consolidar migrations duplicadas de colunas de endereço

**Colunas Adicionadas:**

**Users:**
- `address_zip_code`, `address_street`, `address_number`, `address_neighborhood`
- `address_complement`, `address_city`, `address_state`
- `cnh`, `cnh_category`

**Vehicles:**
- `chassis`, `renavam`, `color`, `fuel_type`, `vehicle_type`, `carrier_id`

**Dependências:** Nenhuma

**Idempotente:** ✅ Sim (ADD COLUMN IF NOT EXISTS)

**Nota:** Esta migration consolida as duplicadas em `supabase/migrations/`. Ver `supabase/migrations/README_DUPLICATES.md` para detalhes.

---

## VERIFICAÇÃO PÓS-APLICAÇÃO

### 1. Verificar Helper Functions

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'is_admin', 
    'current_role', 
    'current_company_id', 
    'current_carrier_id',
    'get_user_by_id_for_login'
  )
ORDER BY routine_name;
```

**Esperado:** 5 funções

---

### 2. Verificar RLS Policies

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Esperado:** 30+ políticas distribuídas entre as tabelas

---

### 3. Verificar RPC Function

```sql
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'rpc_trip_transition';
```

**Esperado:** 1 função

---

### 4. Verificar Trip Summary

```sql
-- Verificar tabela
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'trip_summary';

-- Verificar função
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'calculate_trip_summary';

-- Verificar trigger
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trg_driver_positions_recalc_summary';
```

**Esperado:** Tabela, função e trigger presentes

---

### 5. Verificar Colunas de Endereço

```sql
-- Verificar colunas em users
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name LIKE 'address%' 
ORDER BY column_name;

-- Verificar colunas em vehicles
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'vehicles' 
  AND column_name IN ('chassis', 'renavam', 'color', 'fuel_type', 'vehicle_type', 'carrier_id')
ORDER BY column_name;
```

**Esperado:** Todas as colunas presentes

---

## TESTES RECOMENDADOS

### Teste 1: RPC Trip Transition

```sql
-- Criar uma trip de teste
INSERT INTO trips (route_id, driver_id, status) 
VALUES (
  (SELECT id FROM routes LIMIT 1),
  (SELECT id FROM users WHERE role = 'driver' LIMIT 1),
  'scheduled'
) RETURNING id;

-- Testar transição scheduled → inProgress
SELECT rpc_trip_transition(
  '<trip_id>'::uuid,
  'inProgress',
  'Teste de início de viagem',
  -23.563099,
  -46.654389,
  false
);

-- Verificar se status mudou
SELECT id, status, actual_start_time FROM trips WHERE id = '<trip_id>';

-- Verificar se evento foi criado
SELECT * FROM trip_events WHERE trip_id = '<trip_id>' ORDER BY created_at DESC;
```

---

### Teste 2: Trip Summary

```sql
-- Inserir posições de teste
INSERT INTO driver_positions (trip_id, driver_id, lat, lng, speed, timestamp)
VALUES 
  ('<trip_id>'::uuid, '<driver_id>'::uuid, -23.563099, -46.654389, 45, NOW()),
  ('<trip_id>'::uuid, '<driver_id>'::uuid, -23.564099, -46.655389, 50, NOW() + INTERVAL '1 minute'),
  ('<trip_id>'::uuid, '<driver_id>'::uuid, -23.565099, -46.656389, 55, NOW() + INTERVAL '2 minutes');

-- Verificar se summary foi calculado automaticamente (via trigger)
SELECT * FROM trip_summary WHERE trip_id = '<trip_id>';

-- Recalcular manualmente
SELECT calculate_trip_summary('<trip_id>'::uuid);

-- Verificar summary atualizado
SELECT * FROM trip_summary WHERE trip_id = '<trip_id>';
```

---

### Teste 3: RLS Policies

```sql
-- Testar como admin (deve ver tudo)
SET ROLE authenticated;
SET request.jwt.claim.sub = '<admin_user_id>';

SELECT COUNT(*) FROM trips; -- Deve retornar todas

-- Testar como driver (deve ver apenas próprias trips)
SET request.jwt.claim.sub = '<driver_user_id>';

SELECT COUNT(*) FROM trips; -- Deve retornar apenas trips do driver
```

---

## PROBLEMAS CONHECIDOS

### Nenhum problema conhecido

Todas as migrations foram criadas com:
- ✅ Idempotência (podem ser executadas múltiplas vezes)
- ✅ Tratamento de erros
- ✅ Documentação completa

---

## PRÓXIMOS PASSOS

1. ✅ Aplicar migrations no banco de dados
2. ✅ Executar verificações pós-aplicação
3. ✅ Executar testes recomendados
4. ✅ Verificar logs do Supabase para erros
5. ✅ Testar aplicação web e mobile

---

## CONCLUSÃO

Todas as migrations foram criadas e estão prontas para aplicação. A ordem de aplicação é crítica - seguir a ordem especificada acima.

**Status:** ✅ Pronto para aplicação

