# Guia de Aplicação das Migrations - Golf Fox

**Data:** 2025-01-XX  
**Status:** ✅ Pronto para Aplicação

---

## RESUMO

Este guia fornece instruções passo a passo para aplicar todas as migrations criadas durante a auditoria completa do sistema Golf Fox.

---

## OPÇÃO 1: Aplicar Script Consolidado (Recomendado)

### Arquivo: `apps/web/database/migrations/000_APPLY_ALL_MIGRATIONS.sql`

**Vantagens:**
- ✅ Aplica todas as migrations de uma vez
- ✅ Ordem correta garantida
- ✅ Mensagens de sucesso ao final

**Passos:**

1. **Acessar Supabase Dashboard**
   - Ir para: https://app.supabase.com
   - Selecionar seu projeto

2. **Abrir SQL Editor**
   - Menu lateral → SQL Editor
   - Clicar em "New query"

3. **Copiar e Colar**
   - Abrir arquivo `apps/web/database/migrations/000_APPLY_ALL_MIGRATIONS.sql`
   - Copiar todo o conteúdo
   - Colar no SQL Editor

4. **Executar**
   - Clicar em "Run" ou pressionar Ctrl+Enter
   - Aguardar execução (pode levar alguns minutos)

5. **Verificar Sucesso**
   - Verificar mensagens de sucesso no final
   - Executar queries de verificação abaixo

---

## OPÇÃO 2: Aplicar Migrations Individuais

Se preferir aplicar uma por uma, siga esta ordem:

### 1. `003_rls_helper_functions.sql`
**Pré-requisito:** Nenhum  
**Tempo estimado:** 5 segundos

### 2. `004_canonical_rls_policies.sql`
**Pré-requisito:** `003_rls_helper_functions.sql`  
**Tempo estimado:** 10 segundos

### 3. `005_improve_rpc_trip_transition.sql`
**Pré-requisito:** `003_rls_helper_functions.sql`  
**Tempo estimado:** 5 segundos

### 4. `006_trip_summary.sql`
**Pré-requisito:** Tabelas `trips` e `driver_positions` devem existir  
**Tempo estimado:** 10 segundos

### 5. `008_create_gf_user_company_map.sql`
**Pré-requisito:** Tabelas `users` e `companies` devem existir  
**Tempo estimado:** 5 segundos

### 6. `007_consolidate_address_columns.sql` (Opcional)
**Pré-requisito:** Nenhum  
**Tempo estimado:** 5 segundos  
**Nota:** Aplicar apenas se colunas de endereço ainda não existirem

---

## VERIFICAÇÃO PÓS-APLICAÇÃO

### Query 1: Verificar Helper Functions

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

**Esperado:** 5 funções retornadas

---

### Query 2: Verificar RLS Policies

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Esperado:** 30+ políticas distribuídas entre as tabelas

---

### Query 3: Verificar RPC Function

```sql
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'rpc_trip_transition';
```

**Esperado:** 1 função retornada

---

### Query 4: Verificar Trip Summary

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

### Query 5: Verificar gf_user_company_map

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'gf_user_company_map';

SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'gf_user_company_map';
```

**Esperado:** Tabela existe e tem 4+ políticas RLS

---

## TESTES RECOMENDADOS

### Teste 1: Helper Functions

```sql
-- Testar como usuário autenticado
SET ROLE authenticated;
SET request.jwt.claim.sub = '<user_id>';

-- Testar is_admin (deve retornar false para não-admin)
SELECT public.is_admin();

-- Testar current_role
SELECT public.current_role();

-- Testar current_company_id
SELECT public.current_company_id();
```

---

### Teste 2: RPC Trip Transition

```sql
-- Criar trip de teste
INSERT INTO trips (route_id, driver_id, status) 
VALUES (
  (SELECT id FROM routes LIMIT 1),
  (SELECT id FROM users WHERE role = 'driver' LIMIT 1),
  'scheduled'
) RETURNING id;

-- Testar transição (substituir <trip_id>)
SELECT rpc_trip_transition(
  '<trip_id>'::uuid,
  'inProgress',
  'Teste de início',
  -23.563099,
  -46.654389,
  false
);

-- Verificar se status mudou
SELECT id, status, actual_start_time FROM trips WHERE id = '<trip_id>';
```

---

### Teste 3: Trip Summary

```sql
-- Inserir posições de teste
INSERT INTO driver_positions (trip_id, driver_id, lat, lng, speed, timestamp)
VALUES 
  ('<trip_id>'::uuid, '<driver_id>'::uuid, -23.563099, -46.654389, 45, NOW()),
  ('<trip_id>'::uuid, '<driver_id>'::uuid, -23.564099, -46.655389, 50, NOW() + INTERVAL '1 minute');

-- Verificar se summary foi calculado automaticamente
SELECT * FROM trip_summary WHERE trip_id = '<trip_id>';
```

---

## TROUBLESHOOTING

### Erro: "function does not exist"

**Causa:** Ordem de aplicação incorreta  
**Solução:** Aplicar `003_rls_helper_functions.sql` primeiro

---

### Erro: "relation does not exist"

**Causa:** Tabela referenciada não existe  
**Solução:** Verificar se migrations anteriores foram aplicadas

---

### Erro: "permission denied"

**Causa:** RLS bloqueando operação  
**Solução:** Verificar se políticas RLS foram aplicadas corretamente

---

### Erro: "duplicate key value"

**Causa:** Migration já foi aplicada parcialmente  
**Solução:** Todas as migrations são idempotentes - pode executar novamente

---

## PRÓXIMOS PASSOS APÓS APLICAÇÃO

1. ✅ **Habilitar Realtime**
   - Dashboard → Database → Replication
   - Habilitar `driver_positions`

2. ✅ **Testar Autenticação**
   - Login com CSRF token
   - Verificar cookie httpOnly

3. ✅ **Testar RLS**
   - Verificar acesso por role
   - Testar isolamento de dados

4. ✅ **Testar RPC**
   - Transições de trip
   - Verificar permissões

5. ✅ **Testar Trip Summary**
   - Inserir posições GPS
   - Verificar cálculo automático

---

## CONCLUSÃO

Todas as migrations estão prontas para aplicação. O script consolidado (`000_APPLY_ALL_MIGRATIONS.sql`) é a forma mais rápida e segura de aplicar todas as correções de uma vez.

**Status:** ✅ Pronto para aplicação

