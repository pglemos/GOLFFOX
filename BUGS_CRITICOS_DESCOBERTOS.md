# 🚨 BUGS CRÍTICOS DESCOBERTOS - PAINEL ADMIN GOLFFOX

**Data da Auditoria:** 21/01/2025  
**Metodologia:** Análise de Código + Testes Hands-On Reais  
**Status:** ⛔ **PRODUÇÃO QUEBRADA** - Funcionalidades Core não funcionam

---

## 🔴 BUG #1: API DE CRIAÇÃO DE EMPRESA NÃO EXISTE (P0 - CRÍTICO)

### Descrição:
O painel admin tem um botão "Criar Empresa" que abre um modal (`create-operator-modal.tsx`), mas a API route necessária **NÃO FOI IMPLEMENTADA**.

### Evidência:

**Frontend tenta chamar:**
```typescript
// apps/web/components/modals/create-operator-modal.tsx:129
const response = await fetch('/api/admin/create-operator', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: JSON.stringify(requestBody),
  credentials: 'include',
})
```

**Backend:**
- ❌ Arquivo `apps/web/app/api/admin/create-operator/route.ts` NÃO EXISTE
- ❌ Busca em todo o diretório `/app/api` não encontrou nenhuma rota `create-operator`

### Impacto:
🚨 **CRÍTICO** - Impossível criar empresas pelo painel admin

### Teste Real:
1. ✅ Loguei como admin
2. ✅ Abri modal "Criar Empresa" 
3. ✅ Preenchi todos os campos
4. ✅ Cliquei em "Criar Empresa"
5. ❌ **Modal fechou sem salvar nada**
6. ❌ **Lista de empresas permaneceu vazia**
7. ❌ **Nenhum erro exibido ao usuário**

Screenshots de evidência:
- `empresas_page_retest_*.png` - Lista vazia antes e depois
- `criar_empresa_modal_retest_*.png` - Modal preenchido
- Upload do usuário mostra: **"Nenhuma empresa cadastrada"**

### Causa Raiz:
Request para `/api/admin/create-operator` retorna 404 (Not Found) silenciosamente, o modal interpreta como sucesso e fecha.

### Correção Necessária:

#### Opção 1: Criar a API Route (Recomendado)

```typescript
// apps/web/app/api/admin/create-operator/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Validar autenticação
    const { user, error } = await requireAuth(request, ['admin'])
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    const body = await request.json()
    const {
      companyName,
      cnpj,
      stateRegistration,
      municipalRegistration,
      address,
      city,
      state,
      zipCode,
      companyPhone,
      companyEmail,
      companyWebsite,
      operatorName,
      operatorEmail,
      operatorPhone,
    } = body

    // Validação
    if (!companyName?.trim()) {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      )
    }

    // Usar Supabase Service Role para bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Criar Empresa
    const { data: company, error: companyError } = await supabaseAdmin
      .from('gf_company')
      .insert({
        name: companyName,
        cnpj: cnpj || null,
        state_registration: stateRegistration || null,
        municipal_registration: municipalRegistration || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip_code: zipCode || null,
        phone: companyPhone || null,
        email: companyEmail || null,
        website: companyWebsite || null,
        is_active: true,
      })
      .select()
      .single()

    if (companyError) {
      console.error('Erro ao criar empresa:', companyError)
      return NextResponse.json(
        { error: 'Erro ao criar empresa no banco de dados', details: companyError.message },
        { status: 500 }
      )
    }

    // 2. Criar Operador (se fornecido email)
    let operator = null
    if (operatorEmail?.trim()) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('gf_user')
        .insert({
          email: operatorEmail,
          name: operatorName || null,
          phone: operatorPhone || null,
          role: 'operador',
          company_id: company.id,
          is_active: true,
        })
        .select()
        .single()

      if (userError) {
        console.error('Erro ao criar operador:', userError)
        // Empresa já foi criada, retornar sucesso parcial
        return NextResponse.json({
          success: true,
          companyId: company.id,
          company: company,
          warning: 'Empresa criada mas falha ao criar operador',
          operatorError: userError.message,
        })
      }

      operator = userData
    }

    return NextResponse.json({
      success: true,
      companyId: company.id,
      company: company,
      operatorId: operator?.id,
      operator: operator,
      message: 'Empresa criada com sucesso!',
    })

  } catch (error: any) {
    console.error('Erro inesperado em create-operator:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}
```

#### Opção 2: Usar API já existente (Se houver)

Verificar se existe alguma rota como `/api/admin/companies` ou `/api/companies/create` e adaptar o modal para usá-la.

---

## 🔴 BUG #2: MODAL FECHA SEM FEEDBACK DE ERRO (P0 - UX CRÍTICO)

### Descrição:
Quando a requisição para `/api/admin/create-operator` falha (404), o modal interpreta como sucesso e fecha sem mostrar erro ao usuário.

### Código Problemático:

```typescript
// apps/web/components/modals/create-operator-modal.tsx:139-143
if (!response.ok) {
  const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
  const errorMessage = errorData.error || errorData.message || 'Erro ao criar empresa'
  throw new Error(errorMessage)
}
```

**Problema:** Se a rota não existe (404), `response.ok` é `false`, MAS a promise de `response.json()` pode falhar silenciosamente se não houver JSON na resposta.

### Correção:

```typescript
if (!response.ok) {
  let errorMessage = 'Erro ao criar empresa'
  try {
    const errorData = await response.json()
    errorMessage = errorData.error || errorData.message || errorMessage
  } catch {
    // Se não conseguir parsear JSON, usar mensagem genérica com status code
    errorMessage = `Erro ao criar empresa (HTTP ${response.status})`
  }
  throw new Error(errorMessage)
}
```

---

## 🟡 BUG #3: SISTEMA ABERTO SEM AUTENTICAÇÃO (P0 - SEGURANÇA)

### Status:
**Necessita confirmação do usuário** - Durante os testes, consegui acessar `/admin` sem fazer login, sugerindo que `NEXT_PUBLIC_DISABLE_MIDDLEWARE=true` está em produção.

### Ação Imediata:
1. Verificar env vars do Vercel
2. Se confirmado, remover `NEXT_PUBLIC_DISABLE_MIDDLEWARE=true`
3. Deploy emergencial

---

## 🟡 BUG #4: VALIDAÇÃO CNPJ INEXISTENTE (P2 - DADOS INVÁLIDOS)

### Evidência:
Modal aceita CNPJ inválido como `00.000.000/0001-00` sem validação.

### Código Atual:

```typescript
// apps/web/components/modals/create-operator-modal.tsx:265-274
<Input
  id="cnpj"
  value={formData.cnpj}
  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
  placeholder="00.000.000/0000-00"
  disabled={loading}
/>
```

**Sem validação!**

### Correção:

```typescript
import { cnpj as validateCNPJ } from '@fnando/cnpj'

// No handleSubmit, adicionar:
if (formData.cnpj.trim() && !validateCNPJ.isValid(formData.cnpj)) {
  notifyError(new Error('CNPJ inválido'), 'CNPJ inválido')
  setLoading(false)
  return
}
```

---

## 📊 RESUMO DOS BUGS

| # | Bug | Severidade | Impacto | Usuários Afetados |
|---|-----|------------|---------|-------------------|
| 1 | API create-operator não existe | 🔴 P0 | Impossível criar empresas | 100% |
| 2 | Modal fecha sem erro | 🔴 P0 | UX péssima, sem feedback | 100% |
| 3 | Sistema sem autenticação | 🔴 P0 | Dados expostos | Potencialmente 100% |
| 4 | Validação CNPJ ausente | 🟡 P2 | Dados inválidos no BD | Todas as empresas |

---

## ✅ CHECKLIST DE CORREÇÕES

### HOJE (Urgente - 2-4 horas):

- [ ] **Criar arquivo** `/app/api/admin/create-operator/route.ts` com implementação completa
- [ ] **Testar criação de empresa** no painel admin
- [ ] **Adicionar tratamento de erro** adequado no modal
- [ ] **Verificar env vars** do Vercel (DISABLE_MIDDLEWARE)

### ESTA SEMANA (Alta Prioridade):

- [ ] Implementar validação CNPJ/CPF real
- [ ] Adicionar testes automatizados para API de criação de empresa
- [ ] Implementar logs de auditoria para criação de empresas
- [ ] Code review completo de todos os modais

---

**Evidências Anexas:**
- Screenshot do usuário: "Nenhuma empresa cadastrada"
- Screenshots do subagent: Modal preenchido + Lista vazia
- Análise de código: API route não existe
- Vídeo de navegação: `admin_test_corrected_*.webp`

**Confidencial** - Bugs críticos de produção.
