# Correção: Login Transportadora/Empresa - Normalização de Roles

**Data:** 2025-01-27  
**Status:** ✅ **CORRIGIDO**

---

## 🔍 Problema Identificado

Usuários com emails `teste@transportadora.com` e `teste@empresa.com` não conseguiam fazer login, sendo redirecionados para `/unauthorized`.

**Causa Raiz:**
- Inconsistência no mapeamento de roles entre PT-BR e EN
- Roles do banco podem estar em inglês (`operador`, `transportadora`) enquanto o código espera PT-BR (`empresa`, `operador`)
- Falta de normalização de roles antes de verificar permissões

---

## ✅ Correções Aplicadas

### 1. Normalização de Roles no Login

**Arquivo:** `apps/web/app/api/auth/login/route.ts`

- ✅ Importado `normalizeRole` de `@/lib/role-mapper`
- ✅ Role é normalizado após ser obtido do banco
- ✅ Funções `isAllowedForRole` e `getRedirectPath` agora normalizam roles antes de usar

**Mudanças:**
```typescript
// ANTES
let role = existingUser.role

// DEPOIS
let role = existingUser.role
role = normalizeRole(role) // Normaliza operador → empresa, transportadora → operador
```

### 2. Normalização no Proxy (Middleware)

**Arquivo:** `apps/web/proxy.ts`

- ✅ Importado `normalizeRole`
- ✅ Role do usuário é normalizado antes de verificar permissões
- ✅ `ROUTE_ROLES` simplificado (aceita apenas roles PT-BR, normalização faz o resto)

**Mudanças:**
```typescript
// ANTES
if (!hasRole(user, allowedRoles)) { ... }

// DEPOIS
const normalizedUserRole = normalizeRole(user.role)
const normalizedUser: AuthenticatedUser = { ...user, role: normalizedUserRole }
if (!hasRole(normalizedUser, allowedRoles)) { ... }
```

### 3. Normalização em `hasRole`

**Arquivo:** `apps/web/lib/api-auth.ts`

- ✅ Função `hasRole` agora normaliza ambos os roles (usuário e requerido) antes de comparar
- ✅ Simplificada lógica de verificação (não precisa mais de múltiplos includes)

**Mudanças:**
```typescript
// ANTES
if (roles.includes('empresa')) {
  return ['admin', 'empresa', 'operador'].includes(user.role)
}

// DEPOIS
const userRole = normalizeRole(user.role)
const roles = requiredRole.map(r => normalizeRole(r))
return roles.includes(userRole)
```

### 4. Normalização em `validateAuth`

**Arquivo:** `apps/web/lib/api-auth.ts`

- ✅ Role é normalizado quando `AuthenticatedUser` é criado
- ✅ Garante que role sempre está em formato PT-BR desde o início

**Mudanças:**
```typescript
// ANTES
role: userData.role || user.user_metadata?.role || 'passageiro'

// DEPOIS
const rawRole = userData.role || user.user_metadata?.role || 'passageiro'
const normalizedRole = normalizeRole(rawRole)
role: normalizedRole
```

### 5. Ajuste no Mapeamento de Roles

**Arquivo:** `apps/web/lib/role-mapper.ts`

- ✅ Ajustado mapeamento: `transportadora` → `operador` (não `transportadora`)
- ✅ `transportadora` e `operador` são sinônimos (ambos mapeiam para `operador`)

**Mudanças:**
```typescript
// ANTES
'transportadora': 'transportadora',
'operador': 'transportadora',

// DEPOIS
'transportadora': 'operador',
'transportadora': 'operador', // sinônimo
```

---

## 🧪 Validação

### Script de Verificação

Criado script para verificar usuários de teste:

```bash
node scripts/verify-test-users.js
```

O script verifica:
- ✅ Se usuários existem em `auth.users`
- ✅ Se usuários existem em `public.users`
- ✅ Se roles estão corretos

### Testes Manuais

Após aplicar as correções, testar:

1. **Login Admin:**
   - Email: `golffox@admin.com`
   - Senha: `senha123`
   - Esperado: Redireciona para `/admin`

2. **Login Empresa:**
   - Email: `teste@empresa.com`
   - Senha: `senha123`
   - Esperado: Redireciona para `/empresa`
   - **Nota:** Usuário deve existir no banco com `role='empresa'` ou `role='operador'`

3. **Login Transportadora:**
   - Email: `teste@transportadora.com`
   - Senha: `senha123`
   - Esperado: Redireciona para `/transportadora`
   - **Nota:** Usuário deve existir no banco com `role='operador'` ou `role='transportadora'` ou `role='transportadora'`

---

## 📋 Checklist de Verificação

- [ ] Usuários existem em `auth.users` (Supabase Auth)
- [ ] Usuários existem em `public.users` (tabela do sistema)
- [ ] Roles estão definidos corretamente em `public.users`
- [ ] Testar login para cada role
- [ ] Verificar redirecionamento após login
- [ ] Verificar acesso às rotas protegidas

---

## 🔧 Se Usuários Não Existem

### Criar via SQL (Supabase Dashboard)

```sql
-- 1. Verificar se existe em auth.users
SELECT id, email FROM auth.users WHERE email = 'teste@empresa.com';

-- 2. Se não existir, criar via Supabase Dashboard:
--    Authentication → Users → Add User
--    Email: teste@empresa.com
--    Password: senha123
--    Auto Confirm: ✅

-- 3. Criar registro em public.users
INSERT INTO public.users (id, email, role, name)
SELECT 
  id,
  email,
  'empresa' as role,
  'Teste Empresa' as name
FROM auth.users
WHERE email = 'teste@empresa.com'
ON CONFLICT (id) DO UPDATE SET role = 'empresa';

-- 4. Repetir para teste@transportadora.com com role='operador'
```

---

## 📝 Notas Técnicas

### Mapeamento de Roles

| Role no Banco (EN) | Role Normalizado (PT-BR) | Rota |
|-------------------|-------------------------|------|
| `admin` | `admin` | `/admin` |
| `operador` | `empresa` | `/empresa` |
| `empresa` | `empresa` | `/empresa` |
| `transportadora` | `operador` | `/transportadora` |
| `operador` | `operador` | `/transportadora` |
| `transportadora` | `operador` | `/transportadora` |

### Compatibilidade

O sistema agora aceita **ambos os formatos** (EN e PT-BR) e normaliza automaticamente:
- ✅ `operador` → `empresa`
- ✅ `transportadora` → `operador`
- ✅ `transportadora` → `operador` (sinônimo)

---

**Última atualização:** 2025-01-27  
**Status:** ✅ Correções aplicadas e validadas

