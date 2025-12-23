# Análise da Estrutura Atual - GolfFox

**Data:** 2025-01-XX  
**Status:** Análise Completa

## Arquivos Grandes (>500 linhas)

### Componentes
1. `components/admin-map/admin-map.tsx` - **1816 linhas** ⚠️
2. `components/advanced-route-map.tsx` - **975 linhas** ⚠️
3. `components/fleet-map.tsx` - **826 linhas** ⚠️
4. `components/costs/financial-dashboard-expanded.tsx` - **670 linhas** ⚠️
5. `components/modals/veiculo-modal.tsx` - **672 linhas** ⚠️
6. `components/modals/route-modal.tsx` - **634 linhas** ⚠️
7. `components/premium-sidebar.tsx` - **592 linhas** ⚠️
8. `components/costs/cost-detail-table.tsx` - **569 linhas** ⚠️
9. `components/modals/motorista-modal.tsx` - **563 linhas** ⚠️

### Páginas
1. `app/page.tsx` - **1744 linhas** ⚠️
2. `app/transportadora/veiculos/page.tsx` - **1135 linhas** ⚠️
3. `app/transportadora/page.tsx` - **893 linhas** ⚠️
4. `app/admin/configuracoes/page.tsx` - **707 linhas** ⚠️
5. `app/admin/custos/page.tsx` - **697 linhas** ⚠️
6. `app/transportadora/configuracoes/page.tsx` - **664 linhas** ⚠️
7. `app/empresa/configuracoes/page.tsx` - **658 linhas** ⚠️
8. `app/admin/rotas/route-create-modal.tsx` - **607 linhas** ⚠️
9. `app/admin/socorro/page.tsx` - **604 linhas** ⚠️

### Lib
1. `lib/auth.ts` - **400 linhas** ⚠️
2. `lib/supabase-sync.ts` - **529 linhas** ⚠️
3. `lib/animations.ts` - **516 linhas** ⚠️

### API Routes
1. `app/api/reports/run/route.ts` - **729 linhas** ⚠️
2. `app/api/auth/login/route.ts` - **595 linhas** ⚠️
3. `app/api/admin/criar-empresa-usuario/route.ts` - **593 linhas** ⚠️
4. `app/api/costs/manual/route.ts` - **541 linhas** ⚠️

## Padrões de Import Identificados

### Imports Relativos Profundos
- **130 arquivos** usam imports relativos (`../../../`)
- Principalmente em arquivos de teste e alguns módulos internos

### Imports Misturados
- Alguns arquivos usam `@/` (aliases)
- Outros usam caminhos relativos
- Falta consistência

### Arquivos com Muitos Imports
- `components/admin-map/admin-map.tsx`: 19+ imports
- `components/costs/financial-dashboard-expanded.tsx`: 15+ imports
- `app/page.tsx`: 20+ imports

## Dependências Circulares Potenciais

### Áreas de Risco Identificadas
1. **Auth ↔ Supabase**
   - `lib/auth.ts` importa `lib/supabase.ts`
   - `lib/api-auth.ts` importa `lib/supabase-server.ts`
   - `lib/supabase-client.ts` importa `lib/api-auth.ts`
   - ⚠️ Possível dependência circular

2. **API Modules**
   - `lib/api/*` podem ter dependências entre si
   - Necessário verificar imports cruzados

3. **Components ↔ Hooks**
   - Componentes importam hooks
   - Hooks podem importar componentes (verificar)

## Inconsistências de Organização

### Components
- ✅ Por tipo: `ui/`, `modals/`, `shared/`
- ✅ Por feature: `admin/`, `empresa/`, `transportadora/`, `costs/`
- ❌ Misturados na raiz: `fleet-map.tsx`, `advanced-route-map.tsx`, `premium-sidebar.tsx`

### API Routes
- ❌ Duplicação: `transportadora/` e `transportadoras/` coexistem
- ❌ Inconsistência: Algumas rotas REST, outras não
- ❌ Falta agrupamento consistente

### Lib
- ✅ Por tipo: `api/`, `cache/`, `events/`
- ✅ Por feature: `costs/`, `alerts/`, `map-services/`
- ❌ Arquivos soltos: `auth.ts`, `supabase.ts`, `logger.ts`

## Próximos Passos

1. Criar estrutura de pastas proposta
2. Dividir arquivos grandes
3. Padronizar imports
4. Reorganizar lib/ por camadas
5. Unificar nomenclatura de API routes

