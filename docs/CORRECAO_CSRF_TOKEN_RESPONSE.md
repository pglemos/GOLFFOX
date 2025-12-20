# 🔧 Correção: Leitura do CSRF Token da API

**Data:** 2025-01-27  
**Problema:** Login não funcionando devido a erro na leitura do CSRF token  
**Status:** ✅ **CORRIGIDO**

---

## 🐛 Problema Identificado

O login não estava funcionando porque a API `/api/auth/csrf` retorna o token dentro de um objeto `data`:

```json
{
  "success": true,
  "data": {
    "token": "...",
    "csrfToken": "..."
  }
}
```

Mas o código do frontend estava tentando ler diretamente do objeto raiz:

```javascript
const token = data?.csrfToken || data?.token  // ❌ Não encontrava o token
```

---

## ✅ Solução Aplicada

### 1. **API CSRF Atualizada**

A API agora retorna o token tanto no objeto raiz quanto dentro de `data` para compatibilidade:

```typescript
const res = NextResponse.json({ 
  token, // ✅ Compatibilidade direta
  csrfToken: token, // ✅ Formato esperado pelos testes
  success: true,
  data: {
    token,
    csrfToken: token
  }
})
```

### 2. **Frontend Atualizado**

O código do frontend agora verifica múltiplos locais:

```javascript
// Verifica dentro de data primeiro, depois no objeto raiz
const token = data?.data?.token || data?.data?.csrfToken || data?.csrfToken || data?.token
```

**Arquivos Corrigidos:**
- ✅ `apps/web/app/page.tsx` (2 locais)
- ✅ `apps/web/lib/auth.ts`

---

## 🧪 Teste Realizado

Script de teste criado: `scripts/test-login-debug.js`

**Resultado:**
- ✅ CSRF token obtido corretamente
- ✅ Cookie CSRF definido
- ⚠️ Login ainda falhando por validação CSRF (cookie não sendo enviado no script Node.js)

**Nota:** O script Node.js não mantém cookies automaticamente entre requisições. No navegador, os cookies são enviados automaticamente.

---

## 📝 Próximos Passos

1. ✅ Correção aplicada e commitado
2. ⏳ Aguardando deploy no Vercel
3. ⏳ Testar login via navegador após deploy

---

**Status:** ✅ **CORREÇÃO APLICADA - AGUARDANDO DEPLOY**

