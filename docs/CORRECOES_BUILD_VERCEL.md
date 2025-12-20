# Correções de Build no Vercel - 2025-01-27

**Data:** 2025-01-27  
**Status:** ✅ **CORRIGIDO**

---

## 🐛 Problemas Identificados e Corrigidos

### 1. Imports de Componentes Incorretos ✅

**Problema:** Imports usando nomenclatura antiga (PT-BR) que não correspondem aos arquivos reais.

**Correções:**
- `create-operador-modal` → `create-operador-modal`
- `create-operador-login-modal` → `create-operador-login-modal`
- `motorista-modal` → `motorista-modal`
- `motorista-picker-modal` → `motorista-picker-modal`
- `motorista-compensation-section` → `motorista/motorista-compensation-section`
- `motorista-documents-section` → `motorista/motorista-documents-section`
- `transportadora-documents-section` → `transportadora/transportadora-documents-section`
- `transportadora-banking-section` → `transportadora/transportadora-banking-section`
- `transportadora-legal-rep-section` → `transportadora/transportadora-legal-rep-section`

**Arquivos Corrigidos:**
- `app/admin/empresas/page.tsx`
- `app/admin/usuarios/page.tsx`
- `app/admin/transportadoras/motoristas/page.tsx`
- `app/admin/rotas/route-create-modal.tsx`
- `app/transportadora/motoristas/page.tsx`
- `components/modals/company-operators-modal.tsx`
- `components/modals/motorista-modal.tsx`
- `components/modals/edit-transportadora-modal.tsx`

### 2. Imports de Tipos Incorretos ✅

**Problema:** Import usando `@/types/transportadora` que não existe.

**Correção:**
- `@/types/transportadora` → `@/types/transportadora`

**Arquivos Corrigidos:**
- `app/api/admin/transportadoras/create/route.ts`
- `app/api/admin/transportadoras/update/route.ts`
- `components/modals/edit-transportadora-modal.tsx`

### 3. Imports de i18n Incorretos ✅

**Problema:** Import usando `operador.json` que não existe (existe `operador.json`).

**Correção:**
- `@/i18n/operador.json` → `@/i18n/operador.json`
- Atualizado `lib/i18n.ts` para usar `operador.json` como alias de `operador`

**Arquivos Corrigidos:**
- `lib/i18n.ts`
- `components/empresa/company-selector.tsx`
- `app/empresa/rotas/page.tsx`

### 4. Inicialização do Supabase Durante Build ✅

**Problema:** `BaseRepository` estava inicializando o Supabase no construtor, causando erro durante o build quando as variáveis de ambiente não estavam disponíveis.

**Correção:** Tornar a inicialização do Supabase lazy (lazy initialization) usando um getter.

**Arquivo Corrigido:**
- `lib/repositories/base.repository.ts`

**Antes:**
```typescript
constructor(tableName: string) {
  this.tableName = tableName
  this.supabase = getSupabaseAdmin() // ❌ Executado durante build
}
```

**Depois:**
```typescript
protected _supabase: SupabaseClient | null = null

protected get supabase(): SupabaseClient {
  if (!this._supabase) {
    this._supabase = getSupabaseAdmin() // ✅ Executado apenas quando necessário
  }
  return this._supabase
}
```

### 5. Configuração Next.js Obsoleta ✅

**Problema:** `instrumentationHook` não é mais necessário no Next.js 16.1.0+.

**Correção:** Removido `instrumentationHook` do `next.config.js` (o arquivo `instrumentation.ts` é detectado automaticamente).

**Arquivo Corrigido:**
- `next.config.js`

### 6. Instrumentation Executando Durante Build ✅

**Problema:** `instrumentation.ts` poderia executar durante o build.

**Correção:** Adicionada verificação de fase de build.

**Arquivo Corrigido:**
- `instrumentation.ts`

**Adicionado:**
```typescript
if (process.env.NEXT_PHASE === 'phase-production-build') {
  return
}
```

### 7. dd-trace em devDependencies ✅

**Problema:** `dd-trace` estava em `devDependencies`, mas precisa estar em `dependencies` para produção.

**Correção:** Movido `dd-trace` para `dependencies`.

**Arquivo Corrigido:**
- `package.json`

---

## ✅ Resultado

- ✅ Build local passa com sucesso
- ✅ Todos os imports corrigidos
- ✅ Inicialização lazy do Supabase implementada
- ✅ Configuração Next.js atualizada
- ✅ Código mais robusto com tratamento de erros melhorado

---

## 🚀 Deploy

As correções foram commitadas e enviadas para o GitHub. O Vercel deve detectar o push e fazer deploy automaticamente.

**Commits:**
- `8c8829c` - feat: Integração APM Datadog, testes de performance k6 e aumento de cobertura de testes
- `54cc2d2` - fix: Corrigir erro de build no Vercel - mover dd-trace para dependencies
- `[último]` - fix: Corrigir erros de build no Vercel (imports e lazy initialization)

---

**Última atualização:** 2025-01-27

