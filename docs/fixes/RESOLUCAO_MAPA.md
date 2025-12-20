# Resolução Completa do Problema do Mapa

## ⚠️ IMPORTANTE: Siga TODOS os passos na ordem

### Passo 1: Diagnóstico Inicial (5 minutos)

#### 1.1. Abra o Console do Navegador
1. Pressione `F12` no navegador
2. Vá na aba "Console"
3. Recarregue a página do mapa (`Ctrl+R`)
4. Anote os erros que aparecem

#### 1.2. Execute o Diagnóstico Automático
Cole este código no console e pressione Enter:

```javascript
// 1. Verificar se o usuário está logado
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuário:', user?.email);

// 2. Verificar role do usuário
const { data: userInfo } = await supabase
  .from('users')
  .select('role, company_id')
  .eq('id', user.id)
  .single();
console.log('Role:', userInfo.role);
console.log('Company ID:', userInfo.company_id);

// 3. Verificar veículos ativos
const { data: vehicles, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('is_active', true);
console.log('Veículos ativos:', vehicles?.length || 0);
console.log('Erro:', error);

if (vehicles && vehicles.length > 0) {
  console.log('Primeiros veículos:', vehicles.slice(0, 3));
} else {
  console.log('❌ PROBLEMA: Não há veículos ativos ou RLS está bloqueando');
}
```

---

### Passo 2: Criar Dados de Teste (SE necessário)

#### ⚠️ Execute este passo SE o diagnóstico mostrou 0 veículos

1. Vá no **Supabase Dashboard**
2. Clique em **SQL Editor**
3. Cole e execute este SQL:

```sql
-- Criar empresa de teste
INSERT INTO public.companies (id, name, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Empresa Teste', NOW())
ON CONFLICT (id) DO NOTHING;

-- Criar veículos de teste  
INSERT INTO public.vehicles (id, plate, model, year, is_active, company_id, capacity, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'TEST-001', 'Ônibus Mercedes', 2023, true, '00000000-0000-0000-0000-000000000001', 40, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'TEST-002', 'Van Sprinter', 2022, true, '00000000-0000-0000-0000-000000000001', 15, NOW()),
  ('33333333-3333-3333-3333-333333333333', 'TEST-003', 'Micro-ônibus Iveco', 2023, true, '00000000-0000-0000-0000-000000000001', 25, NOW())
ON CONFLICT (id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  company_id = EXCLUDED.company_id;

-- Verificar
SELECT id, plate, model, is_active, company_id 
FROM vehicles 
WHERE is_active = true;
```

---

### Passo 3: Corrigir Políticas RLS (SEMPRE execute)

#### 1. No Supabase SQL Editor, execute:

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "vehicles_select_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete_policy" ON public.vehicles;
DROP POLICY IF EXISTS "Admin full access vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "transportadora manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Others view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_admin_all" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_company_read" ON public.vehicles;

-- Criar política ADMIN (acesso total)
CREATE POLICY "admin_full_access_vehicles" ON public.vehicles
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Criar política OPERATOR (apenas sua empresa)
CREATE POLICY "operator_select_company_vehicles" ON public.vehicles
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'operador'
      AND company_id = vehicles.company_id
    )
  );

CREATE POLICY "operator_insert_company_vehicles" ON public.vehicles
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'operador'
      AND company_id = vehicles.company_id
    )
  );

CREATE POLICY "operator_update_company_vehicles" ON public.vehicles
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'operador'
      AND company_id = vehicles.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'operador'
      AND company_id = vehicles.company_id
    )
  );

-- Verificar
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'vehicles';
```

---

### Passo 4: Limpar Cache do Supabase (IMPORTANTE)

1. No Supabase Dashboard:
   - Vá em **Settings** → **API**
   - Clique em **"Reload schema cache"**
   - Aguarde 10 segundos

---

### Passo 5: Fazer Deploy no Vercel

#### Opção A: Via Git (Recomendado)
```bash
git add .
git commit -m "fix: Update map queries and fix RLS policies"
git push
```

Aguarde o deploy no Vercel completar (1-3 minutos)

#### Opção B: Force Redeploy no Vercel
1. Vá no dashboard do Vercel
2. Clique no projeto
3. Clique em "Deployments"
4. Clique nos 3 pontos do último deploy
5. Clique em "Redeploy"

---

### Passo 6: Testar Novamente

1. **Limpe o cache do navegador:** `Ctrl + Shift + Delete`
2. **Faça hard reload:** `Ctrl + Shift + R`
3. **Abra o console novamente:** `F12`
4. **Vá no mapa:** https://golffox.vercel.app/admin/mapa

#### Execute o teste novamente no console:
```javascript
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('is_active', true);
  
console.log('Teste final - Veículos:', data?.length || 0);
console.log('Erro:', error);

if (data && data.length > 0) {
  console.log('✅ SUCESSO! Veículos encontrados:', data);
} else {
  console.log('❌ AINDA COM PROBLEMA');
  console.log('Detalhes do erro:', error);
}
```

---

## 🔍 Problemas Comuns e Soluções

### Problema 1: "Could not find the table 'v_live_vehicles'"
**Causa:** View não existe  
**Solução:** Código já corrigido. Force redeploy no Vercel.

### Problema 2: "column gf_incidents.lat does not exist"
**Causa:** Coluna não existe  
**Solução:** Código já corrigido. Force redeploy no Vercel.

### Problema 3: "new row violates row-level security policy"
**Causa:** RLS bloqueando  
**Solução:** Execute Passo 3 (Corrigir RLS)

### Problema 4: Ainda mostra 0 veículos após tudo
**Soluções:**

1. **Verificar se o usuário tem company_id correto:**
```sql
-- No Supabase SQL Editor
SELECT id, email, role, company_id 
FROM users 
WHERE id = 'SEU_USER_ID_AQUI';

-- Atualizar company_id se necessário
UPDATE users 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE id = 'SEU_USER_ID_AQUI';
```

2. **Verificar se os veículos têm company_id correspondente:**
```sql
SELECT v.id, v.plate, v.company_id, c.name
FROM vehicles v
LEFT JOIN companies c ON c.id = v.company_id
WHERE v.is_active = true;
```

3. **Desabilitar RLS temporariamente (APENAS PARA TESTE):**
```sql
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
-- ATENÇÃO: HABILITAR NOVAMENTE DEPOIS
-- ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
```

---

## 📞 Se Nada Funcionar

Execute este diagnóstico completo e envie o resultado:

```javascript
async function diagnosticoCompleto() {
  const results = {};
  
  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser();
  results.user = { id: user?.id, email: user?.email };
  
  // 2. User info
  const { data: userInfo } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single();
  results.userInfo = userInfo;
  
  // 3. Vehicles
  const { data: vehicles, error: vError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true);
  results.vehicles = { count: vehicles?.length || 0, error: vError };
  
  // 4. RLS Status
  const { data: rlsStatus } = await supabase
    .rpc('get_rls_status', { table_name: 'vehicles' })
    .single();
  results.rlsStatus = rlsStatus;
  
  console.log('📊 DIAGNÓSTICO COMPLETO:');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

diagnosticoCompleto();
```

Envie o output acima para análise.

---

## ✅ Checklist Final

- [ ] Usuário está autenticado como admin ou operator
- [ ] Há pelo menos 1 veículo com `is_active = true` no banco
- [ ] RLS policies foram atualizadas (Passo 3)
- [ ] Cache do Supabase foi limpo (Passo 4)
- [ ] Deploy no Vercel foi feito (Passo 5)
- [ ] Cache do navegador foi limpo
- [ ] Console não mostra erros 404 ou 400
- [ ] Teste final passou (Passo 6)

Se TODOS os itens estiverem marcados e ainda não funcionar, há um problema mais profundo que requer análise do banco de dados completo.

