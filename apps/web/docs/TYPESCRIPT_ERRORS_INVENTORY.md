# Inventário Completo de Erros TypeScript - GolfFox

**Data:** 2025-01-XX  
**Total de Erros:** 110  
**Status:** Em Análise

---

## Resumo Executivo

### Distribuição por Tipo de Erro

| Código | Quantidade | Descrição | Prioridade |
|--------|-----------|-----------|------------|
| TS2322 | 19 | Type is not assignable | Alta |
| TS2339 | 16 | Property does not exist | Alta |
| TS2551 | 12 | Property does not exist (sugestão) | Média |
| TS2306 | 12 | File is not a module | **CRÍTICA** |
| TS2304 | 11 | Cannot find name | Alta |
| TS2345 | 10 | Argument type mismatch | Alta |
| TS2451 | 6 | Cannot redeclare block-scoped variable | Média |
| TS2353 | 3 | Object literal may only specify known properties | Média |
| TS2305 | 3 | Module has no exported member | Média |
| TS7006 | 2 | Parameter implicitly has 'any' type | Baixa |
| TS2740 | 2 | Type is missing properties | Alta |
| TS2578 | 2 | Unused '@ts-expect-error' directive | Baixa |
| TS2561 | 2 | Object literal may only specify known properties (sugestão) | Média |
| TS2552 | 2 | Cannot find name (sugestão) | Média |
| TS2459 | 2 | Module declares locally but not exported | Média |
| TS2307 | 2 | Cannot find module | Média |
| TS2820 | 1 | Type is not assignable (literal) | Média |
| TS2741 | 1 | Property is missing | Alta |
| TS18046 | 1 | 'error' is of type 'unknown' | Média |
| TS17001 | 1 | JSX elements cannot have multiple attributes | Baixa |

### Erros Críticos (Prioridade Máxima)

#### 1. TS2306: File is not a module (12 ocorrências)
**Problema:** O arquivo `types/supabase.ts` está vazio ou mal formatado, causando erros em cascata.

**Arquivos Afetados:**
- `app/admin/rotas/use-route-create.ts`
- `components/admin-map/admin-map.tsx`
- `lib/core/supabase/client-helper.ts`
- `lib/core/supabase/client.ts`
- `lib/core/supabase/server.ts`
- `lib/services/company-service.ts`
- `lib/services/driver-service.ts`
- `lib/services/financial-service.ts`
- `lib/services/fleet-service.ts`
- `lib/services/user-service.ts`
- `lib/services/vehicle-service.ts`
- `types/index.ts`

**Ação:** Regenerar tipos do Supabase usando `npx supabase gen types typescript`

---

## Lista Completa de Erros por Arquivo

### APIs (Rotas)

#### `app/api/admin/criar-empresa-login/route.ts`
- **TS2345** (linha 147): Argument of type '{ message: string; }' is not assignable to parameter of type 'number'
  - **Prioridade:** Alta
  - **Ação:** Corrigir tipo do argumento

#### `app/api/admin/criar-operador/route.ts`
- **TS2345** (linha 95): Argument of type '{ status: number; }' is not assignable to parameter of type 'number'
  - **Prioridade:** Alta
  - **Ação:** Corrigir tipo do argumento

#### `app/api/admin/migrate-users-address/route.ts`
- **TS18046** (linha 134): 'error' is of type 'unknown'
  - **Prioridade:** Média
  - **Ação:** Adicionar type guard ou type assertion

#### `app/api/admin/rotas/route.ts`
- **TS2339** (linha 67): Property 'company_id' does not exist on type
  - **Prioridade:** Alta
  - **Ação:** Verificar tipo e adicionar propriedade ou usar nome correto

#### `app/api/admin/trips/route.ts`
- **TS2451** (linha 180): Cannot redeclare block-scoped variable 'route'
- **TS2339** (linha 181): Property 'data' does not exist on type 'SupabaseClientType'
- **TS2451** (linha 181): Cannot redeclare block-scoped variable 'existingRoute'
- **TS2339** (linha 181): Property 'error' does not exist on type 'SupabaseClientType'
- **TS2451** (linha 181): Cannot redeclare block-scoped variable 'routeError'
- **TS2451** (linha 183): Cannot redeclare block-scoped variable 'route'
- **TS2451** (linha 184): Cannot redeclare block-scoped variable 'existingRoute'
- **TS2451** (linha 184): Cannot redeclare block-scoped variable 'routeError'
  - **Prioridade:** Alta
  - **Ação:** Renomear variáveis duplicadas e corrigir tipo do Supabase client

#### `app/api/admin/veiculos/route.ts`
- **TS2339** (linha 90): Property 'company_id' does not exist on type
  - **Prioridade:** Alta
  - **Ação:** Verificar tipo e adicionar propriedade ou usar nome correto

#### `app/api/alerts/has-critical/route.ts`
- **TS2322** (linha 44): Type '{ id: any; }[] | null' is not assignable
  - **Prioridade:** Alta
  - **Ação:** Adicionar propriedades 'severity' e 'is_resolved' ao tipo

#### `app/api/auth/csrf/route.ts`
- **TS2304** (linha 25): Cannot find name 'debug'
  - **Prioridade:** Alta
  - **Ação:** Importar 'debug' de '@/lib/logger'

#### `app/api/budgets/route.ts`
- **TS2353** (linha 231): 'company_id' does not exist in type 'Budget'
  - **Prioridade:** Média
  - **Ação:** Verificar tipo Budget e adicionar propriedade ou usar nome correto

#### `app/api/costs/categories/route.ts`
- **TS2551** (linha 160): Property 'profileType' does not exist (sugestão: 'profile_type')
- **TS2551** (linha 171): Property 'profileType' does not exist (sugestão: 'profile_type')
- **TS2551** (linha 172): Property 'parentId' does not exist (sugestão: 'parent_id')
- **TS2551** (linha 176): Property 'isOperational' does not exist (sugestão: 'is_operational')
- **TS2551** (linha 177): Property 'displayOrder' does not exist (sugestão: 'display_order')
  - **Prioridade:** Média
  - **Ação:** Usar nomes de propriedades corretos (snake_case)

#### `app/api/costs/manual-v2/route.ts`
- **TS2561** (linha 55): 'route_id' does not exist in type 'CostFilters' (sugestão: 'rota_id')
- **TS2551** (linha 96): Property 'route_id' does not exist (sugestão: 'rota_id')
- **TS2551** (linha 97): Property 'route_id' does not exist (sugestão: 'rota_id')
- **TS2353** (linha 317): 'company_id' does not exist in type 'ManualCost'
  - **Prioridade:** Média
  - **Ação:** Usar nomes de propriedades corretos

#### `app/api/empresa/associate-company/route.ts`
- **TS2552** (linha 119): Cannot find name 'logError' (sugestão: importar)
  - **Prioridade:** Alta
  - **Ação:** Importar 'logError' de '@/lib/logger'

#### `app/api/empresa/employees/route.ts`
- **TS2551** (linha 18): Property 'companyId' does not exist (sugestão: 'company_id')
- **TS2551** (linha 38): Property 'companyId' does not exist (sugestão: 'company_id')
  - **Prioridade:** Média
  - **Ação:** Usar 'company_id' ao invés de 'companyId'

#### `app/api/reports/schedule/route.ts`
- **TS2551** (linha 91): Property 'companyId' does not exist (sugestão: 'company_id')
- **TS2551** (linha 93): Property 'companyId' does not exist (sugestão: 'company_id')
  - **Prioridade:** Média
  - **Ação:** Usar 'company_id' ao invés de 'companyId'

#### `app/api/revenues/route.ts`
- **TS2561** (linha 291): 'company_id' does not exist in type 'ManualRevenue' (sugestão: 'company')
  - **Prioridade:** Média
  - **Ação:** Verificar tipo ManualRevenue e usar propriedade correta

### Páginas (App Router)

#### `app/admin/custos/page.tsx`
- **TS2339** (linha 345): Property 'recurringCount' does not exist
  - **Prioridade:** Média
  - **Ação:** Adicionar propriedade ao tipo ou remover uso

#### `app/admin/usuarios/page.tsx`
- **TS2322** (linha 272): Type mismatch em CreateOperadorLoginModalProps
  - **Prioridade:** Alta
  - **Ação:** Corrigir props do componente (usar 'companyId' ao invés de 'company_id')

#### `app/empresa/custos/page.tsx`
- **TS2322** (linha 43): Type '"empresa"' is not assignable to type 'ProfileType'
  - **Prioridade:** Média
  - **Ação:** Verificar tipo ProfileType e usar valor correto

#### `app/page.tsx`
- **TS2345** (linha 76): Argument of type 'string | null' is not assignable to parameter of type 'string'
  - **Prioridade:** Média
  - **Ação:** Adicionar verificação de null ou usar non-null assertion

#### `app/transportadora/page.tsx`
- **TS2551** (linha 65): Property 'transportadoraId' does not exist (sugestão: 'transportadora_id')
- **TS2578** (linha 186): Unused '@ts-expect-error' directive
  - **Prioridade:** Média
  - **Ação:** Usar 'transportadora_id' e remover @ts-expect-error não utilizado

#### `app/transportadora/veiculos/page.tsx`
- **TS2322** (linha 543): Type 'MaintenanceRecord[]' is not assignable to type 'Maintenance[]'
- **TS2820** (linha 636): Type '"veiculo-documents"' is not assignable
  - **Prioridade:** Média
  - **Ação:** Corrigir tipos de manutenção e bucket name

### Componentes

#### `components/admin-map/admin-map.tsx`
- **TS2306** (linha 59): File '/types/supabase.ts' is not a module
- **TS2304** (linha 452): Cannot find name 'SupabaseStop'
- **TS2345** (linha 1240): Argument type mismatch em Veiculo
- **TS2740** (linha 1628): Type 'Veiculo' is missing properties
- **TS2345** (linha 1651): Argument type mismatch em Veiculo
- **TS2345** (linha 1657): Argument type mismatch em Veiculo
- **TS2740** (linha 1670): Type 'MapAlert' is missing properties
- **TS2322** (linha 1677): Type 'string | undefined' is not assignable to type 'string'
- **TS2322** (linha 1695): Type mismatch em Veiculo
- **TS2322** (linha 1696): Type mismatch em callback Veiculo
- **TS2345** (linha 1699): Argument type mismatch em MapAlert
  - **Prioridade:** Alta
  - **Ação:** Regenerar tipos Supabase e corrigir tipos de Veiculo e MapAlert

#### `components/admin-map/layers.tsx`
- **TS2459** (linha 19): Module declares 'RoutePolyline' locally, but it is not exported
  - **Prioridade:** Média
  - **Ação:** Exportar RoutePolyline de admin-map.tsx

#### `components/admin-map/panels.tsx`
- **TS2459** (linha 18): Module declares 'RoutePolyline' locally, but it is not exported
  - **Prioridade:** Média
  - **Ação:** Exportar RoutePolyline de admin-map.tsx

#### `components/admin-map/use-vehicle-markers.ts`
- **TS2339** (linha 21): Property 'id' does not exist on type 'Veiculo'
- **TS2339** (linha 38): Property 'id' does not exist on type 'Veiculo'
- **TS2339** (linha 50): Property 'is_active' does not exist on type 'Veiculo'
- **TS2339** (linha 58): Property 'id' does not exist on type 'Veiculo'
  - **Prioridade:** Alta
  - **Ação:** Corrigir tipo Veiculo para incluir propriedades necessárias

#### `components/admin-map/vehicle-panel.tsx`
- **TS2339** (linha 43): Property 'id' does not exist on type 'Veiculo'
- **TS2339** (linha 52): Property 'is_active' does not exist on type 'Veiculo'
- **TS2339** (linha 53): Property 'is_active' does not exist on type 'Veiculo'
  - **Prioridade:** Alta
  - **Ação:** Corrigir tipo Veiculo

#### `components/admin/alertas/alertas-page-client.tsx`
- **TS2304** (linha 315): Cannot find name 'tempFilterSeverity'
- **TS2304** (linha 316): Cannot find name 'setTempFilterSeverity'
  - **Prioridade:** Alta
  - **Ação:** Adicionar variáveis de estado faltantes

#### `components/admin/dashboard/admin-dashboard-presentational.tsx`
- **TS2322** (linha 65): Type 'AdminFilters' is not assignable
  - **Prioridade:** Média
  - **Ação:** Corrigir tipo AdminFilters

#### `components/admin/lazy-components.tsx`
- **TS2339** (linha 36): Property 'StopGenerator' does not exist
- **TS2322** (linha 53): Type mismatch em AdminMapProps
- **TS2322** (linha 58): Type mismatch em FinancialDashboardExpandedProps
- **TS2322** (linha 63): Type mismatch em CostDashboardProps
  - **Prioridade:** Média
  - **Ação:** Corrigir imports e tipos de componentes lazy

#### `components/advanced-route-map.tsx`
- **TS2305** (linha 11): Module has no exported member 'useReducedMotion'
- **TS2339** (linha 62): Property 'currentBreakpoint' does not exist
- **TS2304** (linha 407): Cannot find name 'setFocusedMarkerIndex'
- **TS2304** (linha 567): Cannot find name 'setHotspotPosition'
- **TS2304** (linha 568): Cannot find name 'setShowHotspot'
- **TS2304** (linha 569): Cannot find name 'setShowTooltip'
  - **Prioridade:** Alta
  - **Ação:** Adicionar imports faltantes e variáveis de estado

#### `components/app-shell.tsx`
- **TS7006** (linha 142): Parameter 'e' implicitly has an 'any' type
  - **Prioridade:** Baixa
  - **Ação:** Adicionar tipo explícito ao parâmetro

#### `components/costs/cost-form-presentational.tsx`
- **TS2322** (linha 112): Type mismatch em callback de categoria
  - **Prioridade:** Média
  - **Ação:** Corrigir tipo do callback

#### `components/costs/financial-dashboard-container.tsx`
- **TS2322** (linha 52): Property 'costs' does not exist
  - **Prioridade:** Média
  - **Ação:** Verificar props de FinancialDashboardExpandedProps

#### `components/costs/financial-dashboard-expanded.tsx`
- **TS2322** (linha 331): Property 'carrierId' does not exist
  - **Prioridade:** Média
  - **Ação:** Verificar props de CostFormContainerProps

#### `components/features/maps/admin-map/index.ts`
- **TS2307** (linha 6): Cannot find module '../../../../admin-map/admin-map'
- **TS2307** (linha 7): Cannot find module '../../../../admin-map/admin-map'
  - **Prioridade:** Média
  - **Ação:** Corrigir caminho do módulo

#### `components/fleet-map.tsx`
- **TS2552** (linha 107): Cannot find name 'useUrlFilters' (sugestão: importar)
- **TS2304** (linha 595): Cannot find name 'updateUrlFilters'
- **TS2322** (linha 725): Type mismatch em MouseEventHandler
  - **Prioridade:** Alta
  - **Ação:** Adicionar imports e corrigir tipo do handler

#### `components/landing/hero-background.tsx`
- **TS2305** (linha 4): Module 'framer-motion' has no exported member 'useScroll'
  - **Prioridade:** Média
  - **Ação:** Verificar versão do framer-motion ou usar alternativa

#### `components/landing/login-form.tsx`
- **TS2304** (linha 103): Cannot find name 'AnimatePresence'
- **TS2304** (linha 117): Cannot find name 'AnimatePresence'
  - **Prioridade:** Média
  - **Ação:** Importar AnimatePresence de framer-motion

#### `components/modals/company-operadores-modal.tsx`
- **TS17001** (linha 213): JSX elements cannot have multiple attributes with the same name
  - **Prioridade:** Baixa
  - **Ação:** Remover atributo duplicado

#### `components/shared/smart-data-table.tsx`
- **TS2322** (linha 76): Type mismatch em Column<T>[]
- **TS2322** (linha 84): Type mismatch em callback
  - **Prioridade:** Média
  - **Ação:** Corrigir tipos de Column e callbacks

### Hooks

#### `hooks/use-admin-map.ts`
- **TS7006** (linha 170): Parameter 'a' implicitly has an 'any' type
- **TS2339** (linha 401): Property 'id' does not exist on type 'RoutePolyline'
  - **Prioridade:** Média
  - **Ação:** Adicionar tipos explícitos e corrigir tipo RoutePolyline

#### `hooks/use-api-mutation.ts`
- **TS2322** (linha 281): Type mismatch em I18nKey
  - **Prioridade:** Baixa
  - **Ação:** Corrigir tipo I18nKey

#### `hooks/use-documents.ts`
- **TS2322** (linha 68): Type 'string' is not assignable to bucket type
  - **Prioridade:** Média
  - **Ação:** Usar tipo literal correto para bucket

#### `hooks/use-financial-dashboard.ts`
- **TS2305** (linha 6): Module '@tanstack/react-query' has no exported member 'useMemo'
  - **Prioridade:** Média
  - **Ação:** Importar useMemo de 'react' ao invés de '@tanstack/react-query'

#### `hooks/use-supabase-query.ts`
- **TS2578** (linha 294): Unused '@ts-expect-error' directive
  - **Prioridade:** Baixa
  - **Ação:** Remover @ts-expect-error não utilizado

### Libraries

#### `lib/api/costs-api.ts`
- **TS2741** (linha 87): Property 'data' is missing in type
  - **Prioridade:** Alta
  - **Ação:** Adicionar propriedade 'data' ao tipo de resposta

#### `lib/core/auth/auth-session.ts`
- **TS2339** (linha 89): Property 'message' does not exist on type '{}'
  - **Prioridade:** Média
  - **Ação:** Adicionar type guard ou type assertion

#### `lib/core/supabase/client-helper.ts`
- **TS2306** (linha 16): File '/types/supabase.ts' is not a module
  - **Prioridade:** **CRÍTICA**
  - **Ação:** Regenerar tipos do Supabase

#### `lib/core/supabase/client.ts`
- **TS2306** (linha 10): File '/types/supabase.ts' is not a module
  - **Prioridade:** **CRÍTICA**
  - **Ação:** Regenerar tipos do Supabase

#### `lib/core/supabase/server.ts`
- **TS2306** (linha 3): File '/types/supabase.ts' is not a module
  - **Prioridade:** **CRÍTICA**
  - **Ação:** Regenerar tipos do Supabase

#### `lib/safe-async.ts`
- **TS2353** (linha 143): 'showToast' does not exist in type 'SafeAsyncOptions<T>'
  - **Prioridade:** Média
  - **Ação:** Adicionar propriedade ao tipo ou remover uso

#### `lib/services/company-service.ts`
- **TS2306** (linha 2): File '/types/supabase.ts' is not a module
  - **Prioridade:** **CRÍTICA**
  - **Ação:** Regenerar tipos do Supabase

#### `lib/services/driver-service.ts`
- **TS2306** (linha 1): File '/types/supabase.ts' is not a module
  - **Prioridade:** **CRÍTICA**
  - **Ação:** Regenerar tipos do Supabase

#### `lib/services/financial-service.ts`
- **TS2306** (linha 3): File '/types/supabase.ts' is not a module
  - **Prioridade:** **CRÍTICA**
  - **Ação:** Regenerar tipos do Supabase

#### `lib/services/fleet-service.ts`
- **TS2306** (linha 2): File '/types/supabase.ts' is not a module
  - **Prioridade:** **CRÍTICA**
  - **Ação:** Regenerar tipos do Supabase

#### `lib/services/map/map-services/vehicle-loader.ts`
- **TS2345** (linha 308): Argument type mismatch em map function
  - **Prioridade:** Alta
  - **Ação:** Corrigir tipo do parâmetro da função map

#### `lib/services/user-service.ts`
- **TS2306** (linha 1): File '/types/supabase.ts' is not a module
  - **Prioridade:** **CRÍTICA**
  - **Ação:** Regenerar tipos do Supabase

#### `lib/services/vehicle-service.ts`
- **TS2306** (linha 2): File '/types/supabase.ts' is not a module
  - **Prioridade:** **CRÍTICA**
  - **Ação:** Regenerar tipos do Supabase

#### `lib/supabase-sync.ts`
- **TS2345** (linha 153): Argument of type '{}' is not assignable to parameter of type 'string'
- **TS2345** (linha 180): Argument of type '{}' is not assignable to parameter of type 'string'
  - **Prioridade:** Alta
  - **Ação:** Corrigir tipo dos argumentos

### Types

#### `types/index.ts`
- **TS2306** (linha 30): File '/types/supabase.ts' is not a module
  - **Prioridade:** **CRÍTICA**
  - **Ação:** Regenerar tipos do Supabase

---

## Plano de Correção

### Fase 1: Erros Críticos (12 erros TS2306)
1. Regenerar tipos do Supabase
2. Verificar que arquivo foi gerado corretamente
3. Testar build

### Fase 2: Erros de Tipos (TS2322, TS2339, TS2345)
1. Corrigir tipos de Veiculo e MapAlert
2. Corrigir props de componentes
3. Corrigir tipos de callbacks
4. Corrigir tipos de argumentos

### Fase 3: Erros de Imports (TS2304, TS2305, TS2307)
1. Adicionar imports faltantes
2. Corrigir caminhos de módulos
3. Verificar exports

### Fase 4: Erros de Nomenclatura (TS2551, TS2561)
1. Padronizar nomes de propriedades (snake_case vs camelCase)
2. Corrigir sugestões do TypeScript

### Fase 5: Outros Erros
1. Remover @ts-expect-error não utilizados
2. Corrigir variáveis duplicadas
3. Corrigir tipos implícitos any

---

## Notas

- Muitos erros são causados pelo arquivo `types/supabase.ts` vazio
- Após regenerar tipos do Supabase, muitos erros devem ser resolvidos automaticamente
- Alguns erros são relacionados a inconsistências de nomenclatura (camelCase vs snake_case)
- Alguns erros são relacionados a tipos incompatíveis entre diferentes partes do código

