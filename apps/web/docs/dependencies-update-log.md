# Log de Atualização de Dependências

Data: 2025-01-XX

## Resumo

Este documento registra todas as atualizações de dependências realizadas para modernizar o projeto GolfFox Web App.

## Versões Atualizadas

### ✅ Dependências Atualizadas

#### Radix UI
- `@radix-ui/react-accordion`: ^1.2.1 → ^1.2.12
- `@radix-ui/react-alert-dialog`: ^1.1.2 → ^1.1.15
- `@radix-ui/react-avatar`: ^1.1.1 → ^1.1.11
- `@radix-ui/react-checkbox`: ^1.1.2 → ^1.3.3
- `@radix-ui/react-dialog`: ^1.1.2 → ^1.1.15
- `@radix-ui/react-dropdown-menu`: ^2.1.2 → ^2.1.16
- `@radix-ui/react-popover`: ^1.1.2 → ^1.1.15
- `@radix-ui/react-radio-group`: ^1.2.1 → ^1.3.8
- `@radix-ui/react-select`: ^2.1.2 → ^2.2.6
- `@radix-ui/react-slider`: ^1.2.1 → ^1.3.6
- `@radix-ui/react-switch`: ^1.1.1 → ^1.2.6
- `@radix-ui/react-tabs`: ^1.1.1 → ^1.1.13
- `@radix-ui/react-toast`: ^2.2.2 → ^1.2.15
- `@radix-ui/react-tooltip`: ^1.1.3 → ^1.2.8

#### Framer Motion
- `framer-motion`: ^11.15.0 → ^11.18.2

#### TanStack Query
- `@tanstack/react-query`: ^5.62.2 → ^5.90.11

#### Zustand
- `zustand`: ^5.0.2 → ^5.0.9

#### Jest
- `jest`: ^29.7.0 → ^30.2.0
- `jest-environment-jsdom`: ^29.7.0 → ^30.2.0
- `@types/jest`: ^29.5.14 → ^30.0.0

#### Playwright
- `@playwright/test`: ^1.48.2 → ^1.57.0

#### Web Vitals
- `web-vitals`: ^5.1.0 (já estava na versão mais recente)

### 🔄 Nova Biblioteca Adicionada

#### Google Maps (Migração Futura)
- `@vis.gl/react-google-maps`: ^1.7.1 (adicionada para migração futura)

**Nota:** A migração completa do Google Maps de `@react-google-maps/api` para `@vis.gl/react-google-maps` requer refatoração de múltiplos componentes e será feita em uma etapa separada.

## Breaking Changes Identificados

### Jest 30.x
- Mudanças na configuração podem ser necessárias
- Verificar compatibilidade com testes existentes
- Alguns mocks podem precisar de ajustes

### Radix UI
- Maioria são atualizações de patch/minor sem breaking changes
- Verificar comportamento de componentes após atualização

## Ajustes de Código Necessários

### Jest 30.x
- Nenhum ajuste crítico necessário, mas testes devem ser executados
- Verificar se todos os testes passam após atualização

### Framer Motion 11.18.2
- Compatível com React 19
- Nenhum ajuste necessário

### TanStack Query 5.90.11
- Nenhum ajuste necessário
- API mantida compatível

## Componentes Afetados

### Radix UI
- Todos os componentes em `components/ui/` podem precisar de verificação
- Componentes críticos: Dialog, Dropdown Menu, Select, Toast, Tooltip

### Framer Motion
- ~50+ componentes que usam framer-motion
- Todos os arquivos que importam `framer-motion`

### TanStack Query
- `lib/react-query-provider.tsx`
- Hooks em `hooks/` que usam useQuery, useMutation, etc.

## Testes Realizados

- [ ] Executar `npm install`
- [ ] Executar `npm run type-check`
- [ ] Executar `npm run build`
- [ ] Executar `npm test`
- [ ] Executar `npm run test:e2e`
- [ ] Testar componentes Radix UI manualmente
- [ ] Testar animações Framer Motion
- [ ] Verificar queries TanStack Query

## Próximos Passos

1. **Migração Google Maps** (tarefa separada)
   - Migrar `components/address-autocomplete.tsx`
   - Migrar `components/fleet-map.tsx`
   - Migrar outros componentes de mapa
   - Atualizar `lib/google-maps-loader.ts`
   - Remover `@react-google-maps/api` após migração completa

2. **Verificação Pós-Atualização**
   - Monitorar erros em produção
   - Verificar performance
   - Validar funcionalidades críticas

## Problemas Conhecidos

Nenhum problema conhecido até o momento.

## Rollback Plan

Se necessário reverter as atualizações:

1. Reverter `package.json` para versões anteriores
2. Executar `npm install`
3. Executar testes para garantir funcionamento
4. Documentar problemas encontrados

## Notas Adicionais

- Todas as atualizações mantêm compatibilidade com React 19 e Next.js 15.5.7
- TypeScript 5.9.3 permanece inalterado
- Node 22.x é requerido

