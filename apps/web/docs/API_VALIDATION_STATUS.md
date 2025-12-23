# Status de Validação de APIs - GolfFox

**Data:** 2025-01-XX  
**Status:** ✅ Padrão Estabelecido, Migração em Progresso

---

## 📊 Resumo

- **Schemas compartilhados criados:** ✅
- **Documentação criada:** ✅
- **Rotas migradas:** 1+ (vehicles)
- **Rotas pendentes:** ~100+

---

## ✅ O que foi Implementado

### 1. Schemas Compartilhados ✅

**Arquivo:** `lib/validation/schemas.ts`

Schemas disponíveis:
- ✅ Usuários (createUserSchema, updateUserSchema)
- ✅ Empresas (createCompanySchema, updateCompanySchema)
- ✅ Transportadoras (createTransportadoraSchema, transportadoraLoginSchema)
- ✅ Veículos (createVehicleSchema, updateVehicleSchema)
- ✅ Rotas (createRouteSchema, updateRouteSchema)
- ✅ Motoristas (createDriverSchema, updateDriverSchema)
- ✅ Custos (createCostSchema, updateCostSchema)
- ✅ Orçamentos (budgetSchema)
- ✅ Receitas (createRevenueSchema, updateRevenueSchema)
- ✅ Utilitários (paginationSchema, dateRangeSchema, searchSchema, uuidSchema)

### 2. Helpers de Validação ✅

- ✅ `validateWithSchema()` - Retorna resultado sem lançar erro
- ✅ `parseWithSchema()` - Lança erro se inválido

### 3. Documentação ✅

- ✅ `docs/API_VALIDATION_GUIDE.md` - Guia completo de uso
- ✅ Exemplos de migração
- ✅ Checklist de implementação

### 4. Rotas Migradas ✅

- ✅ `app/api/admin/veiculos/route.ts` - Usa `createVehicleSchema` compartilhado

---

## ⏳ Rotas que Já Usam Zod (mas com schemas locais)

Estas rotas já usam Zod, mas precisam migrar para schemas compartilhados:

1. `app/api/admin/criar-transportadora-login/route.ts` - Usa `carrierLoginSchema` local
2. `app/api/costs/budgets/route.ts` - Usa `budgetSchema` local
3. `app/api/admin/veiculos/route.ts` - ✅ **Migrado** para schema compartilhado

---

## 📋 Próximos Passos

### Prioridade Alta (APIs Críticas)

1. **Autenticação:**
   - `app/api/auth/login/route.ts` - Adicionar validação Zod
   - `app/api/auth/set-session/route.ts` - Adicionar validação Zod

2. **Criação de Usuários:**
   - `app/api/admin/criar-empresa-login/route.ts`
   - `app/api/admin/criar-empresa-usuario/route.ts`
   - `app/api/admin/criar-transportadora-login/route.ts` - Migrar para schema compartilhado
   - `app/api/admin/criar-usuario/route.ts`

3. **CRUD Principal:**
   - `app/api/admin/empresas/route.ts`
   - `app/api/admin/motoristas/route.ts`
   - `app/api/admin/rotas/route.ts`

### Prioridade Média

4. **Custos e Financeiro:**
   - `app/api/costs/manual/route.ts`
   - `app/api/costs/budgets/route.ts` - Migrar para schema compartilhado
   - `app/api/revenues/route.ts`
   - `app/api/budgets/route.ts`

5. **Outras APIs Admin:**
   - `app/api/admin/transportadoras/*`
   - `app/api/admin/alertas/*`
   - `app/api/admin/kpis/route.ts`

### Prioridade Baixa

6. **APIs de Transportadora e Empresa:**
   - `app/api/transportadora/*`
   - `app/api/empresa/*`

---

## 🔄 Como Migrar uma Rota

### Passo 1: Importar schema

```typescript
import { createVehicleSchema, validateWithSchema } from '@/lib/validation/schemas'
```

### Passo 2: Substituir validação local

**Antes:**
```typescript
const vehicleSchema = z.object({ ... })
const validated = vehicleSchema.parse(body)
```

**Depois:**
```typescript
const validation = validateWithSchema(createVehicleSchema, body)
if (!validation.success) {
  return NextResponse.json(
    { error: 'Dados inválidos', details: validation.error.errors },
    { status: 400 }
  )
}
const validated = validation.data
```

### Passo 3: Remover schema local

Remover o schema local da rota.

### Passo 4: Testar

Garantir que validação funciona corretamente.

---

## 📝 Checklist por Rota

Para cada rota a migrar:

- [ ] Identificar schema apropriado (ou criar se não existir)
- [ ] Importar schema de `@/lib/validation/schemas`
- [ ] Substituir validação local por `validateWithSchema()` ou `parseWithSchema()`
- [ ] Remover schema local
- [ ] Atualizar tratamento de erros Zod
- [ ] Testar validação
- [ ] Atualizar testes (se necessário)

---

## 🎯 Meta

**Objetivo:** 100% das rotas API usando schemas Zod compartilhados

**Progresso:** ~1% (1 rota migrada de ~100+)

---

**Última atualização:** 2025-01-XX
