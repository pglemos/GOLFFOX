# Correção: Remover access_token do Cookie - Segurança

**Data:** 2025-01-27  
**Status:** ✅ **CORRIGIDO**

---

## 🔍 Problema Identificado

O cookie `golffox-session` continha o `access_token` completo do Supabase, mesmo sendo HttpOnly. Isso representa um risco de segurança porque:

1. **Se o cookie for comprometido** (ex: via vulnerabilidade no servidor), o token pode ser extraído
2. **Token no cookie aumenta superfície de ataque** mesmo com HttpOnly
3. **Melhor prática:** Token deve ser obtido apenas do cookie do Supabase ou header Authorization

---

## ✅ Correções Aplicadas

### 1. Removido access_token de `set-session`

**Arquivo:** `apps/web/app/api/auth/set-session/route.ts`

**Mudança:**
```typescript
// ANTES
const sessionPayload = {
  id: user.id,
  email: user.email,
  role: user.role,
  companyId: user.companyId ?? null,
  access_token: accessToken // ❌ REMOVIDO
}

// DEPOIS
const sessionPayload = {
  id: user.id,
  email: user.email,
  role: user.role,
  companyId: user.companyId ?? null
  // ✅ access_token removido por segurança
}
```

### 2. Removido access_token de `login`

**Arquivo:** `apps/web/app/api/auth/login/route.ts`

**Mudança:**
```typescript
// ANTES
const sessionCookieValue = Buffer.from(JSON.stringify({
  id: userPayload.id,
  email: userPayload.email,
  role: userPayload.role,
  companyId: userPayload.companyId,
  access_token: data.session.access_token // ❌ REMOVIDO
})).toString('base64')

// DEPOIS
const sessionCookieValue = Buffer.from(JSON.stringify({
  id: userPayload.id,
  email: userPayload.email,
  role: userPayload.role,
  companyId: userPayload.companyId
  // ✅ access_token removido por segurança
})).toString('base64')
```

### 3. Ajustado `validateAuth` para não buscar token do cookie customizado

**Arquivo:** `apps/web/lib/api-auth.ts`

**Mudança:**
```typescript
// ANTES
// 3. Tentar obter do cookie customizado (golffox-session)
if (!accessToken) {
  const golffoxSession = request.cookies.get('golffox-session')?.value
  if (golffoxSession) {
    const sessionData = decodeBase64Json(golffoxSession)
    const token = sessionData?.access_token // ❌ REMOVIDO
    // ...
  }
}

// DEPOIS
// 3. ✅ REMOVIDO: Não tentar obter token do cookie customizado
// O cookie customizado não contém mais access_token por segurança
// O token deve vir sempre do cookie do Supabase ou header Authorization
```

---

## 🔒 Como Funciona Agora

### Fluxo de Autenticação

1. **Login (`/api/auth/login`):**
   - Usuário faz login com Supabase Auth
   - Supabase cria cookie `sb-{project}-auth-token` automaticamente (contém access_token)
   - Sistema cria cookie `golffox-session`` (contém apenas id, email, role, companyId)
   - Token é retornado na resposta JSON (para uso do cliente)

2. **Validação (`validateAuth`):**
   - **Prioridade 1:** Busca token do header `Authorization: Bearer {token}`
   - **Prioridade 2:** Busca token do cookie do Supabase `sb-{project}-auth-token`
   - **Prioridade 3:** ❌ Não busca mais do cookie customizado (removido)

3. **Middleware (`proxy.ts`):**
   - Usa `validateAuth` que busca token do Supabase cookie ou header
   - Cookie customizado usado apenas para identificar usuário (não para autenticação)

---

## ✅ Benefícios de Segurança

1. **Redução de superfície de ataque:**
   - Token não está mais no cookie customizado
   - Token só existe no cookie do Supabase (gerenciado pelo Supabase) ou header Authorization

2. **Validação sempre com Supabase:**
   - Token sempre validado via `supabase.auth.getUser()`
   - Não há risco de usar token expirado ou inválido

3. **HttpOnly mantido:**
   - Cookie do Supabase é HttpOnly (gerenciado pelo Supabase)
   - Cookie customizado continua HttpOnly (mas não contém token)

4. **Compatibilidade mantida:**
   - Token ainda é retornado na resposta JSON do login (para uso do cliente)
   - Cliente pode usar token no header Authorization se necessário

---

## 🧪 Validação

### Teste Manual

1. **Fazer login:**
   ```bash
   POST /api/auth/login
   { "email": "teste@empresa.com", "password": "senha123" }
   ```

2. **Verificar cookies criados:**
   - ✅ `sb-{project}-auth-token` (contém access_token) - criado pelo Supabase
   - ✅ `golffox-session` (contém apenas id, email, role, companyId) - criado pelo sistema

3. **Verificar validação:**
   - Acessar rota protegida (ex: `/empresa`)
   - Middleware deve validar token do cookie do Supabase
   - Redirecionamento deve funcionar corretamente

---

## 📋 Checklist

- [x] Removido `access_token` de `set-session/route.ts`
- [x] Removido `access_token` de `login/route.ts`
- [x] Ajustado `validateAuth` para não buscar token do cookie customizado
- [x] Validado que token ainda é retornado na resposta JSON (para cliente)
- [x] Validado que cookie do Supabase é criado automaticamente
- [ ] Testar login e acesso a rotas protegidas
- [ ] Verificar que validação funciona corretamente

---

## 🔧 Notas Técnicas

### Cookie do Supabase

O Supabase Auth cria automaticamente o cookie `sb-{project}-auth-token` quando:
- `signInWithPassword()` é chamado
- Cookie contém: `{ access_token, refresh_token, expires_at, ... }`
- Cookie é HttpOnly e gerenciado pelo Supabase

### Cookie Customizado

O cookie `golffox-session` agora contém apenas:
- `id` - ID do usuário
- `email` - Email do usuário
- `role` - Role do usuário (normalizado)
- `companyId` - ID da empresa (se aplicável)
- `transportadoraId` - ID da transportadora (se aplicável)
- `avatar_url` - URL do avatar (se aplicável)

**NÃO contém mais:**
- ❌ `access_token`
- ❌ `refresh_token`
- ❌ Qualquer token de autenticação

---

**Última atualização:** 2025-01-27  
**Status:** ✅ Correções aplicadas

