# 🚀 GolfFox - Implementação Completa v7.4

## ✅ Status da Implementação

- [x] SQL Migration com todas as tabelas, RLS, RPC, triggers
- [x] Modelos Flutter atualizados (driver_positions com lat/lng)
- [x] Service layer com RPC de transição
- [x] Seed data para testes
- [ ] Execução do SQL no Supabase
- [ ] Configuração de Realtime no painel
- [ ] Testes end-to-end

---

## 📋 Passo a Passo para Executar

### 1. Execute a Migration no Supabase

1. Abra o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto: `vmoxzesvjcfmrebagcwo`
3. Vá em **SQL Editor**
4. Abra o arquivo `lib/supabase/migration_complete_v74.sql`
5. Copie TODO o conteúdo e cole no editor
6. Clique em **Run** (ou `Ctrl+Enter`)

**⚠️ Verifique se executou sem erros!**

### 2. Configure Realtime (Driver Positions)

1. No Dashboard → **Database** → **Replication**
2. Encontre a tabela `driver_positions`
3. Clique no toggle para **ativar Realtime**
4. Salve

### 3. Crie os Usuários de Teste

Você precisa criar 5 usuários no Supabase:

1. Dashboard → **Authentication** → **Users** → **Add User**
2. Para cada um:

**Admin:**
- Email: `golffox@admin.com`
- Password: `senha123`
- Confirme email: ✅

**Operador:**
- Email: `operador@empresa.com`
- Password: `senha123`
- Confirme email: ✅

**Transportadora:**
- Email: `transportadora@trans.com`
- Password: `senha123`
- Confirme email: ✅

**Motorista:**
- Email: `motorista@trans.com`
- Password: `senha123`
- Confirme email: ✅

**Passageiro:**
- Email: `passageiro@empresa.com`
- Password: `senha123`
- Confirme email: ✅

### 4. Execute a Patch de Auth e Seeds

1. **SQL Editor** → Nova query
2. Cole **TODO** o conteúdo de `lib/supabase/seeds_v74.sql`
3. **ANTES** de rodar, você precisa:
   - Pegar os IDs reais dos usuários criados no passo 3
   - Substituir no SQL onde tem `00000000-0000-0000-0000-0000000000a1`, etc.
4. Execute o SQL

**Como pegar os IDs:**
```sql
SELECT id, email FROM auth.users WHERE email IN (
  'golffox@admin.com',
  'operador@empresa.com',
  'transportadora@trans.com',
  'motorista@trans.com',
  'passageiro@empresa.com'
);
```

### 5. Execute Seeds (após pegar IDs reais)

Modifique o `seeds_v74.sql`:
```sql
-- Substitua os UUIDs placeholders pelos reais
UPDATE public.users SET
  email = 'golffox@admin.com',
  role = 'admin',
  company_id = NULL,
  carrier_id = NULL
WHERE id = '<ID_REAL_DO_ADMIN>';

-- Repita para cada usuário
```

Depois rode o seed completo.

### 6. Teste o Login Flutter

```bash
# Com variáveis de ambiente (não commitadas)
flutter run \
  --dart-define=SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Login de teste:**
- Email: `motorista@trans.com`
- Senha: `senha123`

---

## 🔍 Checklist de Validação

- [ ] Migration SQL executada sem erros
- [ ] Realtime habilitado em `driver_positions`
- [ ] 5 usuários criados com roles corretos
- [ ] Seeds executados com dados de teste
- [ ] App Flutter compila sem erros
- [ ] Login funciona com qualquer usuário
- [ ] Roteamento por role está funcionando
- [ ] RPC de transição de trip funciona
- [ ] Realtime de posições está funcionando

---

## 🐛 Troubleshooting

### Erro de RLS no login
**Causa:** Usuário não existe na tabela `public.users`  
**Solução:** Execute o INSERT de users no seeds

### Erro "invalid transition"
**Causa:** Tentou mudar status de forma inválida  
**Solução:** Use `p_force: true` para transições reversas (apenas admin/operator/carrier)

### Realtime não atualiza
**Causa:** Realtime não habilitado no painel  
**Solução:** Vá em Database → Replication → Ative em `driver_positions`

### Erro ao inserir posição
**Causa:** RLS bloqueando  
**Solução:** Verifique se o usuário logado é o driver da trip

---

## 📞 Testes com cURL

```bash
# 1. Login e pegar token
curl -X POST 'https://vmoxzesvjcfmrebagcwo.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: eyJ...' \
  -H 'Content-Type: application/json' \
  -d '{"email":"motorista@trans.com","password":"senha123"}'

# Guarde o access_token

# 2. Inserir posição
curl -X POST 'https://vmoxzesvjcfmrebagcwo.supabase.co/rest/v1/driver_positions' \
  -H 'apikey: eyJ...' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "trip_id": "<TRIP_ID>",
    "driver_id": "<DRIVER_ID>",
    "lat": -23.563099,
    "lng": -46.654389,
    "speed": 45.5
  }'

# 3. RPC Transition
curl -X POST 'https://vmoxzesvjcfmrebagcwo.supabase.co/rest/v1/rpc/rpc_trip_transition' \
  -H 'apikey: eyJ...' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "p_trip": "<TRIP_ID>",
    "p_new_status": "inProgress",
    "p_description": "Iniciando viagem",
    "p_lat": -23.563099,
    "p_lng": -46.654389,
    "p_force": false
  }'
```

---

## 🎯 Próximos Passos (Opcionais)

1. **Materialized Views** para relatórios
2. **pg_cron** jobs para refresh automático
3. **Storage Buckets** para documentos
4. **Edge Functions** para notificações push
5. **PostGIS** para geoconsultas avançadas
6. **Rate limiting** no RPC

---

## 📝 Logs Importantes

Execute no SQL Editor para verificar:

```sql
-- Ver políticas RLS
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver usuários e roles
SELECT id, email, role, company_id, carrier_id 
FROM public.users;

-- Ver trips com status
SELECT id, status, driver_id, route_id 
FROM public.trips;

-- Ver resumos calculados
SELECT trip_id, samples, total_distance_km, duration_minutes, avg_speed_kmh
FROM public.trip_summary;
```

---

## ✨ Concluído!

Se todos os itens do checklist estão ✅, seu sistema GolfFox v7.4 está **funcionando!**

Para suporte: verifique logs no Supabase Dashboard → Logs
