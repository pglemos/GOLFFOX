# Guia de Validação de API - GolfFox

**Data:** 2025-01-XX  
**Status:** ✅ Padrão Estabelecido

---

## 🎯 Objetivo

Padronizar validação de dados em todas as rotas API usando **Zod** com schemas compartilhados.

---

## 📋 Padrão de Validação

### 1. Use Schemas Compartilhados

**Arquivo:** `lib/validation/schemas.ts`

```typescript
import { createUserSchema, validateWithSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // Validar
  const validation = validateWithSchema(createUserSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: validation.error.errors },
      { status: 400 }
    )
  }
  
  const validated = validation.data
  // ... usar validated
}
```

### 2. Ou use parse (lança erro)

```typescript
import { createUserSchema, parseWithSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = parseWithSchema(createUserSchema, body)
    // ... usar validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    throw error
  }
}
```

---

## 📚 Schemas Disponíveis

### Usuários
- `createUserSchema`
- `updateUserSchema`
- `emailSchema`
- `passwordSchema`
- `nameSchema`

### Empresas
- `createCompanySchema`
- `updateCompanySchema`

### Transportadoras
- `createTransportadoraSchema`
- `updateTransportadoraSchema`
- `transportadoraLoginSchema`

### Veículos
- `createVehicleSchema`
- `updateVehicleSchema`

### Rotas
- `createRouteSchema`
- `updateRouteSchema`

### Motoristas
- `createDriverSchema`
- `updateDriverSchema`

### Custos
- `createCostSchema`
- `updateCostSchema`

### Orçamentos
- `budgetSchema`

### Receitas
- `createRevenueSchema`
- `updateRevenueSchema`

### Utilitários
- `paginationSchema`
- `dateRangeSchema`
- `searchSchema`
- `uuidSchema`

---

## ✅ Exemplo Completo

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { createVehicleSchema, validateWithSchema } from '@/lib/validation/schemas'
import { logError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

    // 2. Validar dados
    const body = await request.json()
    const validation = validateWithSchema(createVehicleSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const validated = validation.data

    // 3. Processar com dados validados
    // ... lógica de negócio usando validated

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    logError('Erro ao criar veículo', { error }, 'VehiclesAPI')
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
```

---

## 🔄 Migração de Rotas Existentes

### Antes (sem validação ou validação manual):

```typescript
const { plate, model } = await request.json()
if (!plate || !model) {
  return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
}
```

### Depois (com Zod):

```typescript
import { createVehicleSchema, validateWithSchema } from '@/lib/validation/schemas'

const body = await request.json()
const validation = validateWithSchema(createVehicleSchema, body)
if (!validation.success) {
  return NextResponse.json(
    { error: 'Dados inválidos', details: validation.error.errors },
    { status: 400 }
  )
}
const validated = validation.data
// Usar validated.plate, validated.model, etc.
```

---

## 📝 Checklist de Implementação

Para cada rota API:

- [ ] Importar schema apropriado de `@/lib/validation/schemas`
- [ ] Validar body com `validateWithSchema()` ou `parseWithSchema()`
- [ ] Retornar erro 400 com detalhes se validação falhar
- [ ] Usar dados validados (não o body original)
- [ ] Adicionar testes para validação

---

## 🎯 Benefícios

1. **Type Safety:** TypeScript infere tipos dos dados validados
2. **Consistência:** Mesma validação em todas as rotas
3. **Mensagens de Erro:** Mensagens claras e padronizadas
4. **Manutenibilidade:** Mudanças em um lugar afetam todas as rotas
5. **Segurança:** Validação robusta previne dados inválidos

---

**Última atualização:** 2025-01-XX
