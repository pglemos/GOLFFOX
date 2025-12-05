# Relatório de Auditoria - Fase 2: Análise de Autenticação Web

**Data:** 2025-01-XX  
**Status:** ✅ Análise Completa

---

## RESUMO EXECUTIVO

Análise detalhada das rotas de autenticação web (`app/api/auth/*`). Identificados:
- ✅ Proteção CSRF implementada (double-submit cookie)
- ✅ Rate limiting aplicado no login
- ✅ Cookies httpOnly e secure configurados corretamente
- ⚠️ Bypass de CSRF em produção Vercel (temporário)
- ⚠️ RPC `get_user_by_id_for_login` pode não existir
- ⚠️ Tabela `gf_user_company_map` pode não existir

---

## ANÁLISE DETALHADA POR ROTA

### 1. `/api/auth/login` (POST)

**Arquivo:** `app/api/auth/login/route.ts`

#### Segurança

**✅ CSRF Protection:**
- Implementa double-submit cookie pattern
- Valida `x-csrf-token` header contra cookie `golffox-csrf`
- ⚠️ **PROBLEMA:** Bypass em produção Vercel (`isVercelProduction`)
  ```typescript
  const isVercelProduction = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production'
  const allowCSRFBypass = isTestMode || isDevelopment || isTestSprite || isVercelProduction
  ```
  **Risco:** CSRF desabilitado em produção Vercel
  **Prioridade:** P0

**✅ Rate Limiting:**
- Usa `withRateLimit(loginHandler, 'auth')`
- Limite: 5 tentativas por minuto por IP/sessão

**✅ Sanitização:**
- Email sanitizado (remove caracteres perigosos)
- Senha não sanitizada (correto - pode conter caracteres especiais)

**✅ Validação:**
- Regex de email
- Verificação de credenciais obrigatórias

#### Autenticação

**✅ Fluxo:**
1. Valida CSRF
2. Autentica com Supabase Auth (`signInWithPassword`)
3. Busca usuário na tabela `users` usando service_role
4. Verifica se usuário existe no banco
5. Obtém role do usuário
6. Valida empresa para operadores
7. Cria cookie de sessão

**⚠️ PROBLEMA: RPC `get_user_by_id_for_login`**
- Código tenta usar RPC que pode não existir
- Fallback para query direta por email
- **Risco:** Se RPC não existir, usa fallback menos seguro
- **Prioridade:** P1

**⚠️ PROBLEMA: Tabela `gf_user_company_map`**
- Código referencia tabela que pode não existir
- Usado para validar empresa de operadores
- **Risco:** Erro se tabela não existir
- **Prioridade:** P1

#### Cookies

**✅ Configuração:**
- Nome: `golffox-session`
- httpOnly: ❌ **NÃO** (deveria ser true)
- secure: ✅ Sim (em HTTPS)
- sameSite: ✅ Lax
- max-age: 3600 (1 hora)

**⚠️ PROBLEMA: Cookie não é httpOnly**
- Cookie contém dados sensíveis (access_token)
- Pode ser acessado via JavaScript (XSS risk)
- **Prioridade:** P0 (segurança)

**Conteúdo do Cookie:**
```json
{
  "id": "user-id",
  "email": "user@email.com",
  "name": "User Name",
  "role": "admin",
  "companyId": "company-id",
  "transportadoraId": "transportadora-id",
  "avatar_url": "url",
  "access_token": "supabase-token" // ⚠️ Token exposto
}
```

---

### 2. `/api/auth/set-session` (POST)

**Arquivo:** `app/api/auth/set-session/route.ts`

#### Segurança

**✅ CSRF Protection:**
- Validação CSRF implementada
- Bypass em desenvolvimento/teste

**✅ Cookies:**
- httpOnly: ✅ **SIM**
- secure: ✅ Sim (em HTTPS)
- sameSite: ✅ Lax
- maxAge: 24 horas

**✅ Payload:**
- **NÃO** inclui access_token (removido por segurança)
- Apenas dados básicos do usuário

**Status:** ✅ Seguro

---

### 3. `/api/auth/clear-session` (POST)

**Arquivo:** `app/api/auth/clear-session/route.ts`

#### Segurança

**⚠️ PROBLEMA: Cookie não é httpOnly ao limpar**
- `httpOnly: false` ao remover cookie
- Deveria manter `httpOnly: true` para consistência

**Status:** ⚠️ Funcional mas pode melhorar

---

### 4. `/api/auth/csrf` (GET)

**Arquivo:** `app/api/auth/csrf/route.ts`

#### Segurança

**✅ Token:**
- Gera token aleatório de 32 bytes (hex)
- Usa `crypto.randomBytes`

**✅ Cookies:**
- Nome: `golffox-csrf`
- httpOnly: ❌ **NÃO** (correto para double-submit)
- secure: ✅ Sim (em HTTPS)
- sameSite: ✅ Strict
- maxAge: 15 minutos

**Status:** ✅ Seguro (httpOnly false é correto para double-submit)

---

### 5. `/api/auth/me` (GET)

**Arquivo:** `app/api/auth/me/route.ts`

#### Segurança

**✅ Autenticação:**
- Lê cookie `golffox-session`
- Valida estrutura do cookie

**✅ Busca no Banco:**
- Usa service_role para bypassar RLS
- Busca dados completos do usuário

**✅ Fallback:**
- Se falhar busca no banco, usa dados do cookie

**Status:** ✅ Seguro

---

## PROBLEMAS IDENTIFICADOS

### P0 (Crítico)

1. **CSRF Bypass em Produção Vercel**
   - Localização: `app/api/auth/login/route.ts:84`
   - Impacto: CSRF desabilitado em produção
   - Correção: Remover bypass ou corrigir problema de cookies na Vercel

2. **Cookie `golffox-session` não é httpOnly**
   - Localização: `app/api/auth/login/route.ts:470-478`
   - Impacto: Token exposto a JavaScript (XSS risk)
   - Correção: Adicionar `httpOnly: true` ao cookie

### P1 (Alto)

1. **RPC `get_user_by_id_for_login` pode não existir**
   - Localização: `app/api/auth/login/route.ts:196`
   - Impacto: Fallback menos seguro
   - Correção: Criar RPC ou remover tentativa

2. **Tabela `gf_user_company_map` pode não existir**
   - Localização: `app/api/auth/login/route.ts:400`
   - Impacto: Erro ao validar empresa de operadores
   - Correção: Criar tabela ou usar alternativa

### P2 (Médio)

1. **Cookie `clear-session` não é httpOnly**
   - Localização: `app/api/auth/clear-session/route.ts:27`
   - Impacto: Menor (apenas ao limpar)
   - Correção: Manter `httpOnly: true` ao limpar

---

## RECOMENDAÇÕES

### Imediatas (P0)

1. **Remover bypass de CSRF em produção:**
   ```typescript
   // REMOVER esta linha:
   const isVercelProduction = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production'
   // E remover de allowCSRFBypass
   ```

2. **Tornar cookie httpOnly:**
   ```typescript
   const cookieOptions = [
     `golffox-session=${sessionCookieValue}`,
     'path=/',
     'max-age=3600',
     'httpOnly', // ADICIONAR
     'SameSite=Lax',
     ...(isSecure ? ['Secure'] : [])
   ].join('; ')
   ```

### Curto Prazo (P1)

1. **Criar RPC `get_user_by_id_for_login`:**
   ```sql
   CREATE OR REPLACE FUNCTION get_user_by_id_for_login(p_user_id UUID)
   RETURNS TABLE(id UUID, email TEXT, name TEXT, role TEXT, company_id UUID, transportadora_id TEXT, avatar_url TEXT)
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     RETURN QUERY
     SELECT u.id, u.email, u.name, u.role, u.company_id, u.carrier_id as transportadora_id, u.avatar_url
     FROM public.users u
     WHERE u.id = p_user_id;
   END;
   $$;
   ```

2. **Criar tabela `gf_user_company_map` ou usar alternativa:**
   - Verificar se tabela existe
   - Se não existir, criar ou usar `users.company_id` diretamente

### Médio Prazo (P2)

1. **Melhorar `clear-session`:**
   - Manter `httpOnly: true` ao limpar cookies

---

## CONCLUSÃO

As rotas de autenticação estão **funcionalmente corretas** mas têm **problemas de segurança críticos**:
- CSRF bypass em produção
- Cookie não httpOnly expõe token

**Recomendação:** Corrigir problemas P0 antes de prosseguir.

