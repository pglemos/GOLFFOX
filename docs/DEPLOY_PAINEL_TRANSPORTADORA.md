# Guia de Deploy - Painel da Transportadora

## Instruções Passo a Passo

### 1. Aplicar Migrations no Supabase

1. Acesse o Supabase Dashboard: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **SQL Editor**
4. Clique em **New Query**
5. Abra o arquivo: `database/migrations/v50_to_v54_carrier_complete.sql`
6. Copie todo o conteúdo e cole no SQL Editor
7. Clique em **Run** (ou pressione Ctrl+Enter)
8. Aguarde a execução completa

**Verificação:**
```sql
-- Execute esta query para verificar se as tabelas foram criadas:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%driver%' OR table_name LIKE '%vehicle%' OR table_name LIKE '%route_cost%')
ORDER BY table_name;
```

**Resultado esperado:**
- `driver_documents`
- `driver_medical_exams`
- `vehicle_documents`
- `vehicle_maintenances`
- `vehicle_costs`
- `route_costs`

### 2. Verificar Views Criadas

```sql
-- Execute para verificar as views:
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE 'v_carrier%'
ORDER BY viewname;
```

**Resultado esperado:**
- `v_carrier_expiring_documents`
- `v_carrier_vehicle_costs_summary`
- `v_carrier_route_costs_summary`

### 3. Criar Bucket no Supabase Storage

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Storage** → **Buckets**
4. Clique em **New Bucket**
5. Configure:
   - **Name:** `carrier-documents`
   - **Public bucket:** ❌ **DESABILITADO** (deixe desmarcado - bucket privado)
   - **File size limit:** `10 MB` (ou maior se necessário)
   - **Allowed MIME types:** `image/jpeg,image/png,application/pdf`
6. Clique em **Create Bucket**

**Nota:** As políticas RLS já foram criadas na migration v54. Elas serão aplicadas automaticamente quando o bucket for criado.

### 4. Habilitar Supabase Realtime

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Database** → **Replication**
4. Habilite a replicação (Realtime) para as seguintes tabelas:
   - ✅ `driver_positions`
   - ✅ `trips`
   - ✅ `trip_passengers`

**Nota:** Se as tabelas já estiverem habilitadas, não é necessário fazer nada.

### 5. Atualizar RPC do Mapa (Se necessário)

O arquivo `database/migrations/gf_rpc_map_snapshot.sql` foi atualizado para incluir o campo `capacity`. Se você já tinha uma versão anterior da função, execute apenas esta parte:

```sql
-- Atualizar a função gf_map_snapshot_full para incluir capacity
-- O arquivo completo está em: database/migrations/gf_rpc_map_snapshot.sql
-- Execute apenas a função completa (substituindo a anterior se existir)
```

### 6. Verificar Dependências do Frontend

Certifique-se de que a dependência `recharts` está instalada:

```bash
cd apps/web
npm install recharts
# ou
pnpm install recharts
```

### 7. Deploy no Vercel

Após aplicar as migrations e configurar o Storage, faça o deploy:

```bash
# Fazer commit das mudanças
git add .
git commit -m "feat: Implementação completa do Painel da Transportadora (100%)"
git push origin main
```

O Vercel fará o deploy automaticamente após o push.

### 8. Verificação Pós-Deploy

Após o deploy, verifique:

1. **Login como Carrier:**
   - Acesse: https://golffox.vercel.app
   - Faça login com uma conta de role `carrier`
   - Deve redirecionar para `/carrier`

2. **Testar Funcionalidades:**
   - ✅ Acessar `/carrier/motoristas` - deve abrir com tabs
   - ✅ Acessar `/carrier/veiculos` - deve abrir com tabs
   - ✅ Acessar `/carrier/custos` - deve abrir dashboard
   - ✅ Acessar `/carrier/alertas` - deve abrir dashboard
   - ✅ Acessar `/carrier/mapa` - deve mostrar mapa em tempo real

3. **Testar Upload de Arquivos:**
   - ✅ Fazer upload de documento de motorista
   - ✅ Verificar se o arquivo aparece na lista
   - ✅ Verificar se o arquivo está acessível via URL

4. **Testar Realtime:**
   - ✅ Abrir o mapa em duas abas diferentes
   - ✅ Atualizar posição de um veículo em uma aba
   - ✅ Verificar se a outra aba atualiza automaticamente

## Solução de Problemas

### Erro: "relation already exists"
Se alguma tabela já existir, as migrations usarão `CREATE TABLE IF NOT EXISTS`, então não deve haver problema. Se houver, execute:

```sql
-- Verificar se a tabela existe
SELECT * FROM information_schema.tables WHERE table_name = 'driver_documents';

-- Se existir e quiser recriar (CUIDADO - apaga dados!):
-- DROP TABLE IF EXISTS public.driver_documents CASCADE;
```

### Erro: "policy already exists"
As migrations usam `DROP POLICY IF EXISTS` antes de criar, então não deve haver problema.

### Erro: "bucket does not exist"
Crie o bucket manualmente conforme o passo 3. As políticas RLS só funcionam depois que o bucket existe.

### Erro: "function does not exist" (gf_map_snapshot_full)
Execute o arquivo completo `database/migrations/gf_rpc_map_snapshot.sql` para criar/atualizar a função.

### Erro: "Cannot read property 'map' of undefined" (Frontend)
Isso geralmente significa que as APIs estão retornando dados vazios ou em formato inesperado. Verifique:
1. Se as migrations foram aplicadas corretamente
2. Se o usuário tem `carrier_id` configurado na tabela `users`
3. Se os dados de teste foram criados

## Dados de Teste (Opcional)

Para testar as funcionalidades, você pode criar dados de teste:

```sql
-- Criar um motorista de teste (assumindo que já existe um usuário com role 'driver')
-- ATUALIZE os IDs conforme necessário

-- Exemplo de documento de motorista:
INSERT INTO public.driver_documents (driver_id, document_type, file_url, file_name, expiry_date, status)
VALUES (
  'ID_DO_MOTORISTA_AQUI'::uuid,
  'cnh',
  'https://exemplo.com/documento.pdf',
  'cnh.pdf',
  (NOW() + INTERVAL '60 days')::date,
  'valid'
);

-- Exemplo de manutenção de veículo:
INSERT INTO public.vehicle_maintenances (
  vehicle_id, 
  maintenance_type, 
  description, 
  scheduled_date, 
  cost_parts_brl, 
  cost_labor_brl, 
  status
)
VALUES (
  'ID_DO_VEICULO_AQUI'::uuid,
  'preventiva',
  'Revisão preventiva',
  NOW()::date,
  500.00,
  200.00,
  'completed'
);
```

## Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] Todas as migrations foram aplicadas (v50 a v54)
- [ ] Bucket `carrier-documents` foi criado no Supabase Storage
- [ ] Realtime está habilitado para `driver_positions`, `trips`, `trip_passengers`
- [ ] Função `gf_map_snapshot_full` foi atualizada com campo `capacity`
- [ ] Dependência `recharts` está instalada no frontend
- [ ] Deploy no Vercel foi concluído
- [ ] Login como carrier funciona
- [ ] Todas as páginas do carrier abrem corretamente
- [ ] Upload de arquivos funciona
- [ ] Mapa em tempo real funciona

---

**Documentação completa:** `docs/IMPLEMENTACAO_PAINEL_TRANSPORTADORA_COMPLETA.md`

