# 🚀 INSTRUÇÕES DE DEPLOY - PAINEL DA TRANSPORTADORA

## ⚡ AÇÃO URGENTE NECESSÁRIA

Após o push automático do código, você precisa executar as migrations e configurações no Supabase.

---

## 📋 CHECKLIST DE DEPLOY

### ✅ PASSO 1: Aplicar Migrations no Supabase (CRÍTICO)

**Arquivo consolidado:** `database/migrations/v50_to_v54_carrier_complete.sql`

**Como aplicar:**
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **SQL Editor** → **New Query**
4. Abra o arquivo: `database/migrations/v50_to_v54_carrier_complete.sql`
5. Copie TODO o conteúdo
6. Cole no SQL Editor
7. Clique em **Run** (ou Ctrl+Enter)
8. Aguarde a execução (pode levar alguns minutos)

**Verificação:**
```sql
-- Execute para verificar se as tabelas foram criadas:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%motorista%' OR table_name LIKE '%veiculo%' OR table_name LIKE '%route_cost%')
ORDER BY table_name;
```

**Resultado esperado (6 tabelas):**
- `driver_documents` ✅
- `driver_medical_exams` ✅
- `vehicle_documents` ✅
- `vehicle_maintenances` ✅
- `vehicle_costs` ✅
- `route_costs` ✅

---

### ✅ PASSO 2: Criar Bucket no Supabase Storage (CRÍTICO)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Storage** → **Buckets**
4. Clique em **New Bucket**
5. Configure:
   - **Name:** `documentos-transportadora`
   - **Public bucket:** ❌ **DESMARCADO** (deixe como privado)
   - **File size limit:** `10 MB`
   - **Allowed MIME types:** `image/jpeg,image/png,application/pdf`
6. Clique em **Create Bucket**

**⚠️ IMPORTANTE:** As políticas RLS já foram criadas na migration v54. Elas serão aplicadas automaticamente.

---

### ✅ PASSO 3: Habilitar Realtime (IMPORTANTE)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Database** → **Replication**
4. Habilite a replicação (Realtime) para:
   - ✅ `driver_positions`
   - ✅ `trips`
   - ✅ `trip_passengers`

**Nota:** Se já estiverem habilitadas, não é necessário fazer nada.

---

### ✅ PASSO 4: Atualizar Função do Mapa (Se necessário)

O arquivo `database/migrations/gf_rpc_map_snapshot.sql` foi atualizado para incluir `capacity` e melhorar a contagem de passageiros.

**Execute no SQL Editor se você já tinha uma versão anterior:**

Abra o arquivo `database/migrations/gf_rpc_map_snapshot.sql` e execute a função completa (ela substituirá a anterior).

---

## 🎯 TESTES APÓS DEPLOY

Após o Vercel fazer o deploy automaticamente (após o push), teste:

1. **Login como transportadora:**
   - Acesse: https://golffox.vercel.app
   - Login com conta `transportadora`
   - Deve redirecionar para `/transportadora`

2. **Testar Páginas:**
   - ✅ `/transportadora/motoristas` - Tabs devem funcionar
   - ✅ `/transportadora/veiculos` - Tabs devem funcionar
   - ✅ `/transportadora/custos` - Dashboard deve abrir
   - ✅ `/transportadora/alertas` - Dashboard deve abrir
   - ✅ `/transportadora/mapa` - Mapa deve carregar com Realtime

3. **Testar Upload:**
   - ✅ Upload de documento de motorista
   - ✅ Upload de exame médico
   - ✅ Upload de documento de veículo

4. **Testar Realtime:**
   - ✅ Abrir mapa em duas abas
   - ✅ Atualizar posição em uma aba
   - ✅ Verificar atualização automática na outra aba

---

## 🔍 VERIFICAÇÕES FINAIS

### Verificar se as Views foram criadas:
```sql
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE 'v_carrier%'
ORDER BY viewname;
```

**Resultado esperado (3 views):**
- `v_carrier_expiring_documents` ✅
- `v_carrier_vehicle_costs_summary` ✅
- `v_carrier_route_costs_summary` ✅

### Verificar se as Políticas RLS foram criadas:
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE '%motorista%' OR tablename LIKE '%veiculo%' OR tablename LIKE '%route_cost%'
ORDER BY tablename, policyname;
```

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### Erro: "relation already exists"
✅ **OK** - As migrations usam `IF NOT EXISTS`, então não há problema.

### Erro: "policy already exists"
✅ **OK** - As migrations usam `DROP POLICY IF EXISTS` antes de criar.

### Erro: "bucket does not exist"
❌ **CRÍTICO** - Você precisa criar o bucket manualmente (PASSO 2).

### Erro: "function does not exist" (gf_map_snapshot_full)
❌ Execute o arquivo completo `database/migrations/gf_rpc_map_snapshot.sql`.

### Erro: "Cannot read property 'map' of undefined" (Frontend)
❌ Verifique:
1. Se as migrations foram aplicadas
2. Se o usuário tem `carrier_id` na tabela `users`
3. Console do navegador para erros de API

---

## 📝 RESUMO DO QUE FOI IMPLEMENTADO

### ✅ Banco de Dados
- 6 novas tabelas
- 3 novas views
- Função auxiliar para contar passageiros
- Políticas RLS completas

### ✅ Backend (APIs)
- 8 novos endpoints REST
- Validação com Zod
- Filtros automáticos por transportadora

### ✅ Frontend
- 2 páginas atualizadas (motoristas, veículos)
- 2 novas páginas (custos, alertas)
- Componente de upload
- Integração Realtime no mapa

---

## 🎉 PRONTO PARA USO

Após executar os 3 passos acima, o sistema estará 100% funcional!

**Documentação completa:**
- `docs/IMPLEMENTACAO_PAINEL_TRANSPORTADORA_COMPLETA.md`
- `docs/DEPLOY_PAINEL_TRANSPORTADORA.md`

---

**Data:** 16 de Novembro de 2025  
**Status:** ✅ Código commitado e enviado para o repositório

