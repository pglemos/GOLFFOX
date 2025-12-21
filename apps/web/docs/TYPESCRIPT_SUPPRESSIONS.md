# Documentação de Supressões TypeScript

**Data:** 2025-01-XX  
**Total de Supressões:** 73 ocorrências em 31 arquivos

---

## Categorias de Supressões

### 1. Supabase Type Inference Issues (15 ocorrências)

**Problema:** O Supabase JS tem problemas de inferência de tipos em queries complexas, especialmente com:
- Views materializadas
- Funções RPC
- Queries com joins complexos
- Tipos gerados que não correspondem ao schema real

**Arquivos Afetados:**
- `lib/operational-alerts.ts` (3 ocorrências)
- `hooks/use-supabase-query.ts` (1 ocorrência)
- `app/api/admin/transportadoras/*.ts` (4 ocorrências)
- `app/empresa/prestadores/page.tsx` (1 ocorrência)
- `app/admin/rotas/use-route-create.ts` (1 ocorrência)

**Exemplo:**
```typescript
// @ts-ignore - Type mismatch between database schema and expected type
data = res.data
```

**Estratégia de Correção:**
- Regenerar tipos do Supabase quando o schema mudar
- Criar tipos auxiliares para queries complexas
- Usar type assertions específicas ao invés de `@ts-ignore`

---

### 2. Recharts Type Incompatibility (27 ocorrências)

**Problema:** A biblioteca Recharts tem tipos incompatíveis com React 19 e TypeScript 5.9, especialmente:
- Componentes de gráfico não reconhecem props corretamente
- Tipos de dados genéricos não são inferidos corretamente
- Incompatibilidade entre versões de @types/react

**Arquivo Principal:**
- `components/empresa/dashboard-charts.tsx` (27 ocorrências)

**Exemplo:**
```typescript
{/* @ts-ignore - Recharts type incompatibility */}
<LineChart data={tripsData as any}>
```

**Estratégia de Correção:**
- Atualizar Recharts para versão compatível com React 19
- Criar wrappers tipados para componentes do Recharts
- Usar type assertions específicas para dados do gráfico

---

### 3. React Hooks Dependencies (8 ocorrências)

**Problema:** ESLint rule `react-hooks/exhaustive-deps` gera warnings legítimos que precisam ser suprimidos em casos específicos:
- Dependências que não devem ser incluídas (objetos de configuração)
- Efeitos que devem rodar apenas uma vez
- Dependências que causam loops infinitos

**Arquivos Afetados:**
- `app/admin/configuracoes/page.tsx`
- `app/admin/relatorios/page.tsx`
- `app/admin/rotas/rotas-content.tsx`
- `app/admin/usuarios/page.tsx`
- `app/admin/socorro/page.tsx`
- `app/empresa/configuracoes/page.tsx`
- `app/transportadora/configuracoes/page.tsx`

**Exemplo:**
```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  // código que não deve rodar quando dependências mudam
}, [])
```

**Estratégia de Correção:**
- Revisar cada supressão individualmente
- Usar `useCallback` e `useMemo` quando apropriado
- Extrair lógica para hooks customizados

---

### 4. Next.js Type Issues (5 ocorrências)

**Problema:** Tipos do Next.js 16.1 podem ter incompatibilidades com:
- App Router types
- Server Components vs Client Components
- Tipos de `useSearchParams` e outros hooks

**Arquivos Afetados:**
- `app/admin/migrate/page.tsx` (3 ocorrências)
- `components/stop-generation/stop-generator.tsx` (2 ocorrências)

**Estratégia de Correção:**
- Aguardar atualizações do Next.js
- Usar type assertions específicas
- Separar Server e Client Components corretamente

---

### 5. Test Files (3 ocorrências)

**Problema:** Arquivos de teste podem precisar de supressões para:
- Mocks de objetos globais
- Tipos de funções de teste
- Ambientes de teste sem tipagem completa

**Arquivos Afetados:**
- `__tests__/route-modal.generator.int.test.tsx`
- `__tests__/lib/auth.test.ts`
- `lib/__tests__/rate-limit.test.ts`

**Exemplo:**
```typescript
// @ts-expect-error Legacy: valid em ambiente sem tipagem
this.limit = mockLimit
```

**Estratégia de Correção:**
- Tipar mocks corretamente
- Usar `@types/jest` atualizado
- Criar helpers de teste tipados

---

### 6. Legacy Code Compatibility (2 ocorrências)

**Problema:** Código legado que precisa de supressões temporárias até ser refatorado.

**Arquivos Afetados:**
- `lib/supabase-sync.ts` (1 ocorrência)
- `lib/realtime-service.ts` (1 ocorrência)

**Estratégia de Correção:**
- Refatorar código legado gradualmente
- Adicionar tipos explícitos
- Remover supressões após refatoração

---

### 7. setTimeout Return Type (1 ocorrência)

**Problema:** `setTimeout` retorna tipos diferentes em Node.js vs Browser.

**Arquivo:**
- `hooks/use-performance.ts` (1 ocorrência)

**Exemplo:**
```typescript
// @ts-ignore - setTimeout return type incompatibility
timeoutRef.current = setTimeout(() => {
```

**Estratégia de Correção:**
- Usar tipo union: `NodeJS.Timeout | number`
- Criar helper tipado para setTimeout

---

### 8. ESLint Disable (12 ocorrências)

**Problema:** Regras do ESLint que precisam ser desabilitadas em casos específicos:
- `@typescript-eslint/no-explicit-any` - quando `any` é necessário temporariamente
- `@next/next/no-img-element` - quando necessário usar `<img>` ao invés de `next/image`
- `@typescript-eslint/no-require-imports` - quando require é necessário

**Arquivos Afetados:**
- `app/api/reports/run/route.ts` (2 ocorrências)
- `components/modals/veiculo-modal.tsx` (1 ocorrência)
- `components/ui/document-card.tsx` (1 ocorrência)
- `app/empresa/funcionarios/page.tsx` (2 ocorrências)
- Outros arquivos diversos

**Estratégia de Correção:**
- Substituir `any` por tipos específicos
- Usar `next/image` quando possível
- Refatorar código que usa `require`

---

## Plano de Remoção Gradual

### Fase 1: Supressões de Testes (Prioridade Baixa)
- **Prazo:** 1-2 semanas
- **Esforço:** Baixo
- **Impacto:** Melhora qualidade dos testes

### Fase 2: React Hooks (Prioridade Média)
- **Prazo:** 2-4 semanas
- **Esforço:** Médio
- **Impacto:** Melhora performance e correção de bugs

### Fase 3: Supabase Types (Prioridade Alta)
- **Prazo:** 1-2 meses
- **Esforço:** Alto
- **Impacto:** Melhora type safety crítico

### Fase 4: Recharts (Prioridade Média)
- **Prazo:** 2-3 meses
- **Esforço:** Médio-Alto
- **Impacto:** Melhora manutenibilidade dos gráficos

### Fase 5: Next.js Types (Prioridade Baixa)
- **Prazo:** Aguardar atualizações do Next.js
- **Esforço:** Baixo
- **Impacto:** Melhora compatibilidade

---

## Regras para Adicionar Novas Supressões

1. **Sempre documente o motivo** da supressão em comentário
2. **Categorize** a supressão usando este documento
3. **Adicione issue/ticket** para rastrear remoção futura
4. **Evite supressões amplas** - seja específico
5. **Revise periodicamente** se a supressão ainda é necessária

---

## Exemplo de Boa Prática

```typescript
// ❌ RUIM
// @ts-ignore
const data = res.data

// ✅ BOM
// @ts-ignore - Type mismatch: Supabase generated types don't match actual schema
// TODO: Regenerate Supabase types after schema migration v50
// Issue: #123
const data = res.data as ExpectedType
```

---

## Referências

- [TypeScript Suppression Comments](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html#-ts-expect-error-comments)
- [ESLint Disable Comments](https://eslint.org/docs/latest/use/configure/rules#disabling-rules)
- [Supabase Type Generation](https://supabase.com/docs/guides/api/generating-types)

