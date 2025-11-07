# Migração V48 - Correção de RLS para Vehicles

## Problema Identificado

A tabela `vehicles` estava bloqueando operações de INSERT/UPDATE devido a políticas RLS que não permitiam:
- **Admin** criar/atualizar veículos sem company_id/carrier_id correto
- **Operator** criar/atualizar veículos da sua empresa
- **Carrier** criar/atualizar veículos do seu carrier

## Solução Implementada

### 1. Migração SQL (`v48_fix_vehicles_rls.sql`)

Criadas políticas RLS específicas para cada papel:

- **Admin**: Acesso total a todos os veículos
- **Operator**: Pode gerenciar veículos da sua empresa (company_id deve corresponder)
- **Carrier**: Pode gerenciar veículos do seu carrier (carrier_id deve corresponder)
- **Driver**: Pode visualizar veículos atribuídos às suas viagens
- **Passenger**: Pode visualizar veículos das rotas ativas

### 2. Atualização do Frontend

**`vehicle-modal.tsx`**:
- Adicionado carregamento automático de informações do usuário (role, company_id, carrier_id)
- Lógica para definir company_id/carrier_id baseado no papel do usuário:
  - Admin: pode definir qualquer company_id
  - Operator: usa automaticamente o company_id do usuário
  - Carrier: usa automaticamente o carrier_id do usuário

**`app/admin/veiculos/page.tsx`**:
- Removido fallback de dados mock
- Melhorado tratamento de erros
- Adicionado relacionamento com companies na query

## Como Executar

### Opção 1: Via Script Node.js

```bash
cd web-app
node run_v48_migration.js
```

### Opção 2: Manualmente no Supabase

1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Cole o conteúdo de `database/migrations/v48_fix_vehicles_rls.sql`
4. Execute o script

## Verificação

Após executar a migração, verifique:

1. **Admin pode criar/atualizar veículos**:
   ```sql
   -- Como admin, tente criar um veículo
   INSERT INTO vehicles (plate, model, company_id) 
   VALUES ('TEST-0001', 'Test Model', 'company-id');
   ```

2. **Operator pode criar/atualizar veículos da sua empresa**:
   ```sql
   -- Como operator, verifique seu company_id
   SELECT id, role, company_id FROM users WHERE id = auth.uid();
   
   -- Tente criar veículo com seu company_id
   INSERT INTO vehicles (plate, model, company_id) 
   VALUES ('TEST-0002', 'Test Model', 'seu-company-id');
   ```

3. **Verificar políticas criadas**:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
   FROM pg_policies 
   WHERE tablename = 'vehicles';
   ```

## Próximos Passos

1. Testar criação de veículo como admin
2. Testar criação de veículo como operator
3. Testar atualização de veículo
4. Verificar se o mapa está carregando veículos corretamente
5. Verificar se a página de veículos está funcionando corretamente

## Arquivos Modificados

- `database/migrations/v48_fix_vehicles_rls.sql` (novo)
- `web-app/run_v48_migration.js` (novo)
- `web-app/components/modals/vehicle-modal.tsx` (atualizado)
- `web-app/app/admin/veiculos/page.tsx` (atualizado)

