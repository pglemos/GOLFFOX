# Correção das Chamadas de debug/error/logError

## Problema Identificado

O erro "true is not a function" estava ocorrendo porque as funções `debug`, `error` e `logError` estavam sendo chamadas com uma assinatura incorreta (3 parâmetros) quando o logger espera `(...args: unknown[])`.

## Correções Aplicadas

### 1. Correção em `apps/web/lib/auth.ts`

**Antes**:
```typescript
debug('Cookie de sessão definido via API (HttpOnly)', { role: userData.role }, 'AuthManager')
error('Falha ao definir cookie de sessão via API', { error: cookieErr }, 'AuthManager')
```

**Depois**:
```typescript
debug('[AuthManager] Cookie de sessão definido via API (HttpOnly)', { role: userData.role })
error('[AuthManager] Falha ao definir cookie de sessão via API', { error: cookieErr })
```

### 2. Correção em `apps/web/app/page.tsx`

**Antes**:
```typescript
debug("Iniciando autenticação", { email: maskedEmail }, "LoginPage")
debug("Login bem-sucedido", {
  redirectUrl: finalRedirectUrl,
  email: maskedEmail,
  role: userRoleFromDatabase,
  source: 'database'
}, "LoginPage")
logError("Erro inesperado no login", {
  error: err,
  errorName: err?.name,
```

**Depois**:
```typescript
debug("[LoginPage] Iniciando autenticação", { email: maskedEmail })
debug("[LoginPage] Login bem-sucedido", {
  redirectUrl: finalRedirectUrl,
  email: maskedEmail,
  role: userRoleFromDatabase,
  source: 'database'
})
logError("[LoginPage] Erro inesperado no login", {
  error: err,
  errorName: err?.name,
```

## Motivo da Correção

O logger exporta `debug`, `error` e `logError` como funções que aceitam `(...args: unknown[])`, mas estavam sendo chamadas com 3 parâmetros separados onde o terceiro parâmetro era um identificador de contexto (como `'AuthManager'` ou `'LoginPage'`).

A correção move o identificador de contexto para dentro da mensagem como prefixo, mantendo apenas 2 parâmetros: a mensagem (com contexto) e o objeto de dados.

## Arquivos Modificados

1. `apps/web/lib/auth.ts` - Todas as chamadas de `debug` e `error` corrigidas
2. `apps/web/app/page.tsx` - Chamadas de `debug` e `logError` corrigidas

## Status

✅ **Correções aplicadas e commitadas**

O código foi corrigido e está pronto para testes. O erro "true is not a function" não deve mais ocorrer devido a chamadas incorretas de funções de logging.

