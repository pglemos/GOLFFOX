# Troubleshooting - Mapa de Veículos

## Problema: "Sem veículos ativos"

### Diagnóstico Passo a Passo

#### 1. Verificar se há veículos no banco de dados

Execute no SQL Editor do Supabase:

```sql
-- Ver veículos ativos
SELECT id, plate, model, is_active, company_id, created_at
FROM vehicles
WHERE is_active = true
LIMIT 10;

-- Contar veículos por status
SELECT is_active, COUNT(*) as total
FROM vehicles
GROUP BY is_active;
```

**Se não houver veículos:** Execute o script `database/CREATE_TEST_DATA.sql`

#### 2. Verificar políticas RLS

```sql
-- Ver políticas RLS da tabela vehicles
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'vehicles';

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'vehicles';
```

**Se RLS bloquear:** Execute `database/migrations/v48_fix_vehicles_rls.sql`

#### 3. Verificar role do usuário logado

No console do navegador (F12), execute:

```javascript
const { data: { user } } = await supabase.auth.getUser();
const { data: userInfo } = await supabase
  .from('users')
  .select('role, company_id, carrier_id')
  .eq('id', user.id)
  .single();
console.log('Usuário:', userInfo);
```

**Problema comum:** Usuário não tem role 'admin' ou 'operador' e não consegue ver veículos.

#### 4. Testar query diretamente

No console do navegador:

```javascript
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('is_active', true);
  
console.log('Veículos:', data);
console.log('Erro:', error);
```

#### 5. Verificar logs do navegador

Abra o console (F12) e procure por:
- `❌` Erros em vermelho
- `⚠️` Avisos em amarelo
- `🔍` Logs de debug que mostram o que está sendo carregado

### Soluções Comuns

#### Solução 1: Criar dados de teste

```bash
# No Supabase SQL Editor, execute:
# database/CREATE_TEST_DATA.sql
```

#### Solução 2: Corrigir RLS

```bash
# No Supabase SQL Editor, execute:
# database/migrations/v48_fix_vehicles_rls.sql
```

#### Solução 3: Limpar cache do Supabase

No Supabase Dashboard:
1. Vá em Settings → API
2. Clique em "Reload schema cache"

#### Solução 4: Verificar variáveis de ambiente

Arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-anon-key
```

### Erros Específicos

#### Erro: "Could not find the table 'v_live_vehicles'"

**Causa:** View não existe no banco  
**Solução:** Código já foi atualizado para não usar essa view. Force um rebuild no Vercel.

#### Erro: "column gf_incidents.lat does not exist"

**Causa:** Tabela não tem colunas lat/lng  
**Solução:** Código já foi atualizado para não usar essas colunas. Force um rebuild no Vercel.

#### Erro: "new row violates row-level security policy"

**Causa:** RLS bloqueando operação  
**Solução:** Execute `database/migrations/v48_fix_vehicles_rls.sql`

### Debug Avançado

#### Habilitar logs SQL no Supabase

```sql
-- Ver últimas queries executadas
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;
```

#### Testar permissões RLS manualmente

```sql
-- Assumir role do usuário
SET ROLE authenticated;
SET request.jwt.claim.sub = 'USER_UUID_AQUI';

-- Testar query
SELECT * FROM vehicles WHERE is_active = true;

-- Voltar ao normal
RESET ROLE;
```

### Contato de Suporte

Se nenhuma solução funcionou:

1. Abra o console do navegador (F12)
2. Tire um print dos erros
3. Execute `database/DIAGNOSTIC_QUERIES.sql` e tire print dos resultados
4. Envie para análise

### Checklist de Verificação

- [ ] Há veículos com `is_active = true` no banco?
- [ ] RLS está configurado corretamente?
- [ ] Usuário tem role apropriada (admin/operador)?
- [ ] Não há erros 404 no console (views inexistentes)?
- [ ] Não há erros 400 (colunas inexistentes)?
- [ ] Cache do Supabase foi recarregado?
- [ ] Build no Vercel está atualizado?

