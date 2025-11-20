# Correção do Erro de Sessão nas Páginas de Configurações
## Data: 2025-01-27

## 🐛 Problema Identificado

**Erro:** "Sessão expirada. Por favor, faça login novamente." ao tentar alterar o Nome Completo nas páginas de Configurações.

**Causa Raiz:**
- O sistema usa cookie customizado `golffox-session` para autenticação
- As páginas de configurações verificavam `supabase.auth.getSession()` que pode retornar `null` mesmo quando há uma sessão válida no cookie
- Isso causava falsos positivos de "sessão expirada"

---

## ✅ Solução Implementada

### 1. Nova API Route Criada
**Arquivo:** `apps/web/app/api/user/update-profile/route.ts`

**Funcionalidades:**
- ✅ Valida autenticação via cookie `golffox-session`
- ✅ Atualiza nome na tabela `users` usando Service Role
- ✅ Atualiza email no Supabase Auth usando Admin API
- ✅ Atualiza senha no Supabase Auth usando Admin API
- ✅ Não depende de `supabase.auth.getSession()` no cliente

**Vantagens:**
- Usa Service Role para bypass de RLS
- Valida autenticação via cookie (mesmo método usado pelo resto do sistema)
- Centraliza lógica de atualização de perfil
- Mais seguro e confiável

### 2. Páginas de Configurações Atualizadas

**Arquivos modificados:**
- ✅ `apps/web/app/admin/configuracoes/page.tsx`
- ✅ `apps/web/app/operator/configuracoes/page.tsx`
- ✅ `apps/web/app/carrier/configuracoes/page.tsx`

**Mudanças:**
- ❌ Removida verificação de `supabase.auth.getSession()`
- ✅ Agora usa API route `/api/user/update-profile`
- ✅ Validação de dados antes de enviar
- ✅ Tratamento de erros melhorado
- ✅ Recarregamento automático após atualização de nome/email

---

## 🔧 Detalhes Técnicos

### Antes (Problema)
```typescript
// Verificava sessão Supabase (pode falhar mesmo com cookie válido)
const { data: { session }, error: sessionError } = await supabase.auth.getSession()
if (sessionError || !session) {
  notifyError('Sessão expirada. Por favor, faça login novamente.')
  return
}

// Atualizava diretamente no cliente
await supabase.from('users').update({ name: formData.name }).eq('id', user.id)
```

### Depois (Solução)
```typescript
// Usa API route que valida via cookie
const response = await fetch('/api/user/update-profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ name: formData.name })
})

const result = await response.json()
if (!response.ok || !result.success) {
  throw new Error(result.error || 'Erro ao salvar configurações')
}
```

---

## 📋 Fluxo de Atualização

1. **Usuário preenche formulário** → Página de Configurações
2. **Clica em "Salvar Alterações"** → `handleSave()` é chamado
3. **Valida dados localmente** → Verifica se há alterações e valida senhas
4. **Envia para API route** → `POST /api/user/update-profile`
5. **API valida cookie** → Verifica `golffox-session` cookie
6. **Atualiza no banco** → Usa Service Role para bypass de RLS
7. **Retorna sucesso** → Página mostra mensagem de sucesso
8. **Recarrega dados** → Se nome/email mudou, recarrega página

---

## ✅ Verificações Realizadas

- ✅ API route criada e funcionando
- ✅ Todas as 3 páginas de configurações atualizadas
- ✅ Nenhum erro de lint
- ✅ Imports corretos (mantido `supabase` apenas para carregar foto de perfil)
- ✅ Tratamento de erros robusto
- ✅ Validação de dados antes de enviar

---

## 🎯 Resultado

**Status:** ✅ **CORRIGIDO**

Agora é possível alterar o Nome Completo, Email e Senha nas páginas de Configurações sem o erro de "Sessão expirada", mesmo quando a sessão está válida via cookie.

**Funcionalidades testadas:**
- ✅ Atualizar Nome Completo
- ✅ Atualizar Email
- ✅ Atualizar Senha
- ✅ Validação de senhas coincidentes
- ✅ Mensagens de erro claras
- ✅ Mensagens de sucesso

---

## 📝 Notas

1. **Cookie vs Sessão Supabase:** O sistema usa cookie customizado para autenticação, então não devemos depender de `supabase.auth.getSession()` no cliente.

2. **Service Role:** A API route usa Service Role para bypass de RLS, garantindo que as atualizações funcionem mesmo sem sessão Supabase no cliente.

3. **Segurança:** A API route valida o cookie antes de permitir atualizações, garantindo que apenas usuários autenticados possam atualizar seus próprios perfis.

4. **Recarregamento:** Após atualizar nome ou email, a página é recarregada para garantir que os dados do usuário sejam atualizados em toda a aplicação.

---

## ✅ Conclusão

Problema completamente resolvido. As páginas de Configurações agora funcionam corretamente, usando a mesma autenticação via cookie que o resto do sistema.

