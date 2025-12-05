# Checklist de Aplicação - Migrations Golf Fox

**Use este checklist para garantir que todas as migrations foram aplicadas corretamente.**

---

## ✅ PRÉ-APLICAÇÃO

- [ ] Backup do banco de dados criado
- [ ] Ambiente identificado (dev/test/prod)
- [ ] Acesso ao Supabase Dashboard confirmado
- [ ] Script consolidado (`000_APPLY_ALL_MIGRATIONS.sql`) copiado

---

## ✅ APLICAÇÃO

- [ ] SQL Editor aberto no Supabase Dashboard
- [ ] Script consolidado colado no editor
- [ ] Script executado sem erros
- [ ] Mensagens de sucesso verificadas

---

## ✅ VERIFICAÇÃO PÓS-APLICAÇÃO

### Helper Functions (5 funções)

- [ ] `is_admin()` existe
- [ ] `current_role()` existe
- [ ] `current_company_id()` existe
- [ ] `current_carrier_id()` existe
- [ ] `get_user_by_id_for_login()` existe

**Query:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_admin', 'current_role', 'current_company_id', 'current_carrier_id', 'get_user_by_id_for_login');
```

### RLS Policies (30+ políticas)

- [ ] Políticas criadas para `companies`
- [ ] Políticas criadas para `users`
- [ ] Políticas criadas para `routes`
- [ ] Políticas criadas para `vehicles`
- [ ] Políticas criadas para `trips`
- [ ] Políticas criadas para `gf_costs`
- [ ] Políticas criadas para `driver_positions` (se tabela existe)
- [ ] Políticas criadas para `trip_summary`
- [ ] Políticas criadas para `gf_user_company_map`

**Query:**
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies WHERE schemaname = 'public'
GROUP BY tablename ORDER BY tablename;
```

### RPC Function

- [ ] `rpc_trip_transition` existe
- [ ] Função aceita parâmetros corretos
- [ ] Função retorna JSONB

**Query:**
```sql
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'rpc_trip_transition';
```

### Trip Summary

- [ ] Tabela `trip_summary` existe
- [ ] Função `calculate_trip_summary` existe
- [ ] Função `haversine_distance` existe
- [ ] Trigger `trg_driver_positions_recalc_summary` existe

**Query:**
```sql
-- Tabela
SELECT table_name FROM information_schema.tables WHERE table_name = 'trip_summary';

-- Funções
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('calculate_trip_summary', 'haversine_distance');

-- Trigger
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'trg_driver_positions_recalc_summary';
```

### gf_user_company_map

- [ ] Tabela `gf_user_company_map` existe
- [ ] Índices criados
- [ ] RLS habilitado
- [ ] Políticas RLS criadas

**Query:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'gf_user_company_map';
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'gf_user_company_map';
```

---

## ✅ CONFIGURAÇÃO ADICIONAL

- [ ] Realtime habilitado em `driver_positions`
  - Dashboard → Database → Replication → `driver_positions` → Enable

---

## ✅ TESTES FUNCIONAIS

### Autenticação

- [ ] Login funciona com CSRF token válido
- [ ] Login falha sem CSRF token (em produção)
- [ ] Cookie `golffox-session` é httpOnly
- [ ] Logout limpa cookie corretamente

### RLS Policies

- [ ] Admin vê todos os dados
- [ ] Operator vê apenas dados da empresa
- [ ] Carrier vê apenas dados do carrier
- [ ] Driver vê apenas próprias trips
- [ ] Passenger vê apenas trips atribuídas

### RPC Trip Transition

- [ ] Driver pode iniciar trip (scheduled → inProgress)
- [ ] Driver pode completar trip (inProgress → completed)
- [ ] Admin pode cancelar trip (inProgress → cancelled)
- [ ] Admin pode reabrir trip (completed → inProgress com force)
- [ ] Transições inválidas são rejeitadas

### Trip Summary

- [ ] Summary calculado automaticamente ao inserir posições
- [ ] Distância calculada corretamente
- [ ] Velocidades calculadas corretamente
- [ ] Summary atualizado ao deletar posições

---

## ✅ CONCLUSÃO

- [ ] Todas as verificações passaram
- [ ] Todos os testes funcionais passaram
- [ ] Sistema pronto para uso

---

## 📝 NOTAS

**Data de Aplicação:** _______________

**Aplicado por:** _______________

**Ambiente:** [ ] Dev [ ] Test [ ] Prod

**Observações:**
_______________________________________
_______________________________________
_______________________________________

