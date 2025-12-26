# Inventário de Erros TypeScript - GolfFox

**Data:** 2025-12-26  
**Total de Erros Inicial:** 789  
**Total de Erros Atual:** 621 (Redução de ~21%)

## Resumo por Categoria (TS Code)

| Código | Descrição | Quantidade | Status |
|--------|-----------|------------|--------|
| TS2339 | Propriedade não existe no tipo | ~50 | 🔴 Crítico |
| TS2345 | Argumento incompatível | ~80 | 🔴 Crítico |
| TS2769 | Nenhuma sobrecarga corresponde | ~30 | 🟡 Média |
| TS2322 | Tipo não atribuível | ~100 | 🟡 Média |
| TS18048 | Objeto possivelmente 'undefined' | ~60 | 🟢 Baixa |
| TS18046 | Objeto possivelmente 'null' | ~40 | 🟢 Baixa |
| TS2304 | Nome não encontrado | ~15 | 🔴 Crítico |
| TS2451 | Redeclaração de variável | 12 | 🔴 Crítico |
| TS2352 | Conversão de tipo erro | ~20 | 🟡 Média |

## Arquivos Mais Problemáticos

### 1. `lib/validation/schemas.ts` (12 erros)
- **Problema:** Redeclaração de variáveis (`driverListQuerySchema`, `employeeListQuerySchema`, etc.)
- **Solução:** Renomear ou consolidar schemas duplicados

### 2. `app/api/admin/motoristas/route.ts` (16 erros)
- **Problema:** Propriedades `undefined`, tipos incompatíveis
- **Solução:** Adicionar defaults e type guards

### 3. `lib/services/map/map-services/vehicle-loader.ts` (4 erros)
- **Problema:** Tipos `ViagensRow`, `MotoristaPositionsRow` não encontrados
- **Solução:** Importar tipos corretos de `@/types/supabase`

### 4. `lib/realtime-service.ts` (4 erros)
- **Problema:** Colunas não existentes (`trip_id`, `route_id`)
- **Solução:** Atualizar queries para usar nomes de colunas corretos

### 5. `lib/retry-utils.ts` (2 erros)
- **Problema:** `logWarn` não encontrado
- **Solução:** Importar de `@/lib/logger`

## Próximas Ações

1. [ ] Corrigir `lib/validation/schemas.ts` - redeclarações
2. [ ] Corrigir `lib/retry-utils.ts` - importar logWarn
3. [ ] Corrigir `lib/services/map/map-services/vehicle-loader.ts` - importar tipos
4. [ ] Corrigir `lib/realtime-service.ts` - nomes de colunas
5. [ ] Corrigir `app/api/admin/motoristas/route.ts` - undefined handling
