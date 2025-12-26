---
name: Plano Completo de Análise e Otimização GolfFox
overview: Plano abrangente para análise completa, correção de erros TypeScript, substituição de console.log, otimização de performance, migração para CQRS, implementação de funcionalidades faltantes, melhorias de segurança e documentação completa do repositório GolfFox.
todos: []
---

# Plano Completo de Análise e Otimização - GolfFox

## Contexto e Objetivo

O repositório GolfFox é um sistema completo de gestão de transporte urbano com:

- **Frontend Web**: Next.js 16.1 com TypeScript
- **Frontend Mobile**: React Native (Expo 54)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Vercel (Web) + EAS Build (Mobile)

**Status Atual:**

- ✅ Build no Vercel bem-sucedido (177 páginas estáticas geradas)
- ⚠️ ~154 erros TypeScript restantes (56% já corrigidos)
- ⚠️ ~950 usos de `console.*` que precisam ser substituídos por logger estruturado
- ⚠️ ~420 usos de `as any` que precisam ser corrigidos
- ⚠️ 47 comentários TODO no código
- ⚠️ Estrutura CQRS pronta mas migração pendente
- ⚠️ Funcionalidades mobile incompletas
- ⚠️ Algumas APIs Google Maps faltando

## Fase 1: Análise Completa e Inventário

### 1.1 Análise de Erros TypeScript

**Objetivo:** Identificar e categorizar todos os 154 erros TypeScript restantes**Tarefas:**

- [ ] Executar `npm run type-check` e capturar output completo
- [ ] Categorizar erros por tipo (TS2578, TS2345, TS2339, TS2305, etc.)
- [ ] Identificar erros críticos vs. avisos
- [ ] Separar erros corrigíveis de erros em arquivos gerados pelo Next.js
- [ ] Criar arquivo `docs/TYPESCRIPT_ERRORS_INVENTORY.md` com lista completa
- [ ] Priorizar todos erros por impacto (APIs críticas primeiro e depois o restante até resolver 100%)

**Arquivos a analisar:**

- `apps/web/tsconfig.json`
- `apps/web/next.config.js` (linha 26: `ignoreBuildErrors: true`)
- Todos os arquivos `.ts` e `.tsx` em `apps/web`

### 1.2 Análise de Console.log

**Objetivo:** Identificar todos os usos de `console.*` e planejar substituição**Tarefas:**

- [ ] Buscar todos os usos de `console.log`, `console.error`, `console.warn`, `console.info`
- [ ] Categorizar por contexto (desenvolvimento, produção, debug)
- [ ] Identificar quais devem ser removidos vs. substituídos por logger
- [ ] Criar arquivo `docs/CONSOLE_LOG_INVENTORY.md` com lista completa
- [ ] Verificar se `lib/logger.ts` está completo e funcional

**Arquivos a analisar:**

- `apps/web/lib/logger.ts` (verificar implementação)
- Todos os arquivos em `apps/web/app/api/`
- Todos os arquivos em `apps/web/components/`
- Todos os arquivos em `apps/web/lib/`

### 1.3 Análise de Tipos `any`

**Objetivo:** Identificar todos os usos de `as any` e tipos implícitos `any`**Tarefas:**

- [ ] Buscar todos os usos de `as any` no código
- [ ] Buscar parâmetros com tipo `any` implícito
- [ ] Categorizar por razão (Supabase types, legacy code, workarounds)
- [ ] Identificar quais podem ser corrigidos vs. documentados
- [ ] Criar arquivo `docs/ANY_TYPES_INVENTORY.md` com lista completa

### 1.4 Análise de TODOs

**Objetivo:** Revisar todos os comentários TODO e definir ações**Tarefas:**

- [ ] Buscar todos os comentários `TODO`, `FIXME`, `XXX`, `HACK`, `BUG`
- [ ] Categorizar por prioridade e tipo
- [ ] Criar issues ou tarefas para cada TODO
- [ ] Criar arquivo `docs/TODOS_INVENTORY.md` com lista completa

### 1.5 Análise de Performance

**Objetivo:** Identificar oportunidades de otimização**Tarefas:**

- [ ] Analisar queries Supabase que usam `.select('*')` (34 arquivos identificados)
- [ ] Verificar uso de cache Redis (já implementado em KPIs e alerts)
- [ ] Analisar code splitting no `next.config.js`
- [ ] Verificar lazy loading de componentes pesados
- [ ] Analisar bundle size e identificar oportunidades
- [ ] Criar arquivo `docs/PERFORMANCE_ANALYSIS.md`

**Arquivos a analisar:**

- `apps/web/next.config.js`
- `apps/web/lib/cache/redis-cache.service.ts`
- Views do Supabase (performance de queries)

### 1.6 Análise de Segurança

**Objetivo:** Identificar vulnerabilidades e melhorias de segurança**Tarefas:**

- [ ] Verificar proteção de rotas perigosas (`execute-sql-fix`, `fix-database`)
- [ ] Analisar validação SQL (`lib/validation/sql-validator.ts`)
- [ ] Verificar CSRF protection em todas as rotas críticas
- [ ] Analisar rate limiting (já implementado em algumas rotas)
- [ ] Verificar sanitização de inputs
- [ ] Analisar cookies de sessão (remover `access_token` do cookie)
- [ ] Criar arquivo `docs/SECURITY_AUDIT.md`

**Arquivos a analisar:**

- `apps/web/proxy.ts` (middleware)
- `apps/web/lib/api-auth.ts`
- `apps/web/app/api/auth/set-session/route.ts` (cookie com access_token)
- `apps/web/lib/rate-limit.ts`
- `apps/web/lib/validation/sql-validator.ts`

### 1.7 Análise de Funcionalidades Faltantes

**Objetivo:** Identificar funcionalidades planejadas mas não implementadas**Tarefas:**

- [ ] Verificar APIs Google Maps faltando (Distance Matrix, Reverse Geocoding, Places Autocomplete)
- [ ] Analisar funcionalidades mobile incompletas
- [ ] Verificar integração de navegação turn-by-turn no app mobile
- [ ] Criar arquivo `docs/MISSING_FEATURES.md`

**Arquivos a analisar:**

- `apps/mobile/` (estrutura e funcionalidades)
- `docs/project-history/RELATORIO_GOOGLE_MAPS_API_FALTANDO.md`
- `apps/mobile/docs/MOBILE_STATUS.md`

## Fase 2: Correção de Erros TypeScript

### 2.1 Batch 2: Erros de Tipos Supabase

**Objetivo:** Corrigir erros relacionados a tipos do Supabase**Tarefas:**

- [ ] Regenerar tipos do Supabase se necessário: `npx supabase gen types typescript --project-id <project-id> > apps/web/types/supabase.ts`
- [ ] Verificar se tipos estão atualizados com schema atual
- [ ] Corrigir erros TS2345 (argumentos incompatíveis) relacionados ao Supabase
- [ ] Corrigir erros TS2339 (propriedades não existentes) em queries Supabase
- [ ] Documentar supressões necessárias em `docs/TYPESCRIPT_SUPPRESSIONS.md`

**Arquivos principais:**

- `apps/web/types/supabase.ts`
- `apps/web/lib/supabase.ts`
- `apps/web/lib/supabase-server.ts`
- Todas as rotas API que usam Supabase

### 2.2 Batch 3: Erros de Componentes React

**Objetivo:** Corrigir erros em componentes React**Tarefas:**

- [ ] Corrigir props incompatíveis em componentes
- [ ] Corrigir tipos de eventos (onClick, onChange, etc.)
- [ ] Corrigir tipos de hooks React (useState, useEffect, etc.)
- [ ] Verificar compatibilidade com React 19.1.0

**Arquivos principais:**

- `apps/web/components/`
- `apps/web/app/` (páginas)

### 2.3 Batch 4: Erros de Next.js 16.1

**Objetivo:** Corrigir erros relacionados ao Next.js 16.1**Tarefas:**

- [ ] Corrigir `searchParams` como Promise (Next.js 15+)
- [ ] Corrigir `params` como Promise em rotas dinâmicas
- [ ] Verificar compatibilidade com App Router
- [ ] Corrigir imports do Next.js

**Arquivos principais:**

- Rotas dinâmicas em `apps/web/app/api/**/[id]/route.ts`
- Páginas com `searchParams` em `apps/web/app/**/page.tsx`

### 2.4 Batch 5: Limpeza de Supressões

**Objetivo:** Remover `@ts-expect-error` não utilizados**Tarefas:**

- [ ] Remover 32 ocorrências de `@ts-expect-error` não utilizados
- [ ] Verificar se supressões restantes são necessárias
- [ ] Documentar supressões necessárias

### 2.5 Remoção de `ignoreBuildErrors`

**Objetivo:** Remover `ignoreBuildErrors` do `next.config.js`**Tarefas:**

- [ ] Reduzir erros para < 20
- [ ] Testar build completo sem `ignoreBuildErrors`
- [ ] Remover `ignoreBuildErrors: true` de `next.config.js`
- [ ] Verificar que CI passa sem erros
- [ ] Atualizar documentação

**Arquivo:**

- `apps/web/next.config.js` (linha 26)

## Fase 3: Substituição de Console.log

### 3.1 Implementação do Logger Estruturado

**Objetivo:** Garantir que `lib/logger.ts` está completo**Tarefas:**

- [ ] Verificar implementação de `lib/logger.ts`
- [ ] Adicionar funções faltantes se necessário (`debug`, `info`, `warn`, `error`, `logError`)
- [ ] Garantir que logger funciona em desenvolvimento e produção
- [ ] Configurar níveis de log apropriados

**Arquivo:**

- `apps/web/lib/logger.ts`

### 3.2 Substituição em Rotas API

**Objetivo:** Substituir `console.*` por logger em todas as rotas API**Tarefas:**

- [ ] Substituir `console.log` por `debug` ou `info`
- [ ] Substituir `console.error` por `logError`
- [ ] Substituir `console.warn` por `warn`
- [ ] Remover `console.*` de código de produção
- [ ] Manter apenas logs de desenvolvimento quando apropriado

**Arquivos:**

- Todas as rotas em `apps/web/app/api/`

### 3.3 Substituição em Componentes

**Objetivo:** Substituir `console.*` em componentes React**Tarefas:**

- [ ] Substituir `console.*` por logger em componentes
- [ ] Usar `debug` para logs de desenvolvimento
- [ ] Remover logs de debug de componentes de produção

**Arquivos:**

- `apps/web/components/`
- `apps/web/app/` (páginas)

### 3.4 Substituição em Utilitários

**Objetivo:** Substituir `console.*` em funções utilitárias**Tarefas:**

- [ ] Substituir `console.*` em `lib/`
- [ ] Substituir `console.*` em `hooks/`
- [ ] Substituir `console.*` em `scripts/`

## Fase 4: Correção de Tipos `any`

### 4.1 Tipos Supabase

**Objetivo:** Substituir `as any` por tipos corretos do Supabase**Tarefas:**

- [ ] Regenerar tipos do Supabase se necessário
- [ ] Substituir `as any` em queries Supabase por tipos corretos
- [ ] Usar tipos de tabelas específicas ao invés de `any`
- [ ] Documentar casos onde `as any` é necessário

**Arquivos:**

- Rotas API que usam Supabase
- `apps/web/lib/supabase.ts`
- `apps/web/lib/supabase-server.ts`

### 4.2 Tipos de Componentes

**Objetivo:** Corrigir tipos implícitos `any` em componentes**Tarefas:**

- [ ] Adicionar tipos explícitos para props de componentes
- [ ] Corrigir tipos de eventos
- [ ] Corrigir tipos de callbacks
- [ ] Adicionar tipos para estados do useState

**Arquivos:**

- `apps/web/components/`
- `apps/web/app/` (páginas)

### 4.3 Tipos de Funções

**Objetivo:** Corrigir tipos implícitos `any` em funções**Tarefas:**

- [ ] Adicionar tipos de retorno explícitos
- [ ] Adicionar tipos de parâmetros explícitos
- [ ] Corrigir tipos de funções utilitárias

**Arquivos:**

- `apps/web/lib/`
- `apps/web/hooks/`

## Fase 5: Otimização de Performance

### 5.1 Otimização de Queries Supabase

**Objetivo:** Reduzir uso de `.select('*')` e otimizar queries**Tarefas:**

- [ ] Identificar todas as queries que usam `.select('*')` (34 arquivos)
- [ ] Substituir por seleção específica de colunas
- [ ] Adicionar índices no banco se necessário
- [ ] Otimizar queries complexas

**Arquivos:**

- Todas as rotas API que fazem queries Supabase

### 5.2 Expansão de Cache Redis

**Objetivo:** Expandir uso de cache Redis para mais endpoints**Tarefas:**

- [ ] Identificar endpoints que se beneficiariam de cache
- [ ] Implementar cache em rotas de listagem (empresas, transportadoras, veículos, etc.)
- [ ] Configurar TTL apropriado para cada tipo de dado
- [ ] Implementar invalidação de cache quando dados são atualizados

**Arquivos:**

- `apps/web/lib/cache/redis-cache.service.ts`
- Rotas API de listagem

### 5.3 Otimização de Bundle

**Objetivo:** Reduzir tamanho do bundle JavaScript**Tarefas:**

- [ ] Analisar bundle size atual
- [ ] Identificar dependências grandes
- [ ] Implementar code splitting mais agressivo
- [ ] Lazy load componentes pesados
- [ ] Verificar se `optimizePackageImports` está funcionando

**Arquivo:**

- `apps/web/next.config.js`

### 5.4 Otimização de Views do Supabase

**Objetivo:** Melhorar performance de views materializadas**Tarefas:**

- [ ] Verificar se materialized views estão sendo atualizadas regularmente
- [ ] Adicionar índices nas views se necessário
- [ ] Otimizar queries de views complexas
- [ ] Verificar performance p95 das views (deve ser < 250ms)

**Script:**

- `apps/web/scripts/drift-check.js` (já tem função de performance)

## Fase 6: Melhorias de Segurança ✅ CONCLUÍDA

### 6.1 Correção de Cookie de Sessão ✅

**Objetivo:** Remover `access_token` do cookie de sessão**Tarefas:**

- [x] Modificar `app/api/auth/set-session/route.ts` para não incluir `access_token` no cookie
- [x] Manter apenas `id`, `role`, `companyId` no cookie
- [x] Verificar se autenticação ainda funciona corretamente
- [x] Testar fluxo completo de login

**Status:** JÁ IMPLEMENTADO - Cookie não contém access_token (linhas 75-85)**Arquivo:**

- `apps/web/app/api/auth/set-session/route.ts`

### 6.2 Expansão de Rate Limiting ✅

**Objetivo:** Adicionar rate limiting em mais rotas críticas**Tarefas:**

- [x] Identificar rotas críticas sem rate limiting
- [x] Adicionar rate limiting em rotas de admin críticas
- [x] Adicionar rate limiting em rotas de criação/atualização
- [x] Configurar limites apropriados para cada tipo de rota

**Status:** IMPLEMENTADO - 5 novos tipos de rate limit, 5+ rotas atualizadas**Arquivos:**

- `apps/web/lib/rate-limit.ts`
- Rotas API críticas

### 6.3 Validação de Inputs ✅

**Objetivo:** Garantir sanitização completa de inputs**Tarefas:**

- [x] Verificar sanitização em todas as rotas API
- [x] Adicionar validação Zod onde faltar
- [x] Verificar sanitização de SQL em rotas perigosas
- [x] Adicionar validação de tipos de arquivo em uploads

**Status:** IMPLEMENTADO - Novo módulo `upload-validation.ts` criado**Arquivos:**

- Rotas API de criação/atualização
- `apps/web/lib/validation/`
- `apps/web/lib/validation/upload-validation.ts` (NOVO)

### 6.4 Proteção de Rotas Perigosas ✅

**Objetivo:** Garantir que rotas perigosas estão protegidas**Tarefas:**

- [x] Verificar que `execute-sql-fix` e `fix-database` estão protegidas
- [x] Verificar que auditoria está funcionando
- [x] Testar validação SQL
- [x] Documentar processo de uso de rotas perigosas

**Status:** IMPLEMENTADO - Rotas protegidas com 5 camadas de segurança**Arquivos:**

- `apps/web/lib/middleware/dangerous-route-audit.ts`
- `apps/web/lib/validation/sql-validator.ts`
- `apps/web/app/api/admin/execute-sql-fix/route.ts`
- `apps/web/app/api/admin/fix-database/route.ts`
- `docs/DANGEROUS_ROUTES.md` (NOVA DOCUMENTAÇÃO)

## Fase 7: Migração para CQRS

### 7.1 Criação de Handlers

**Objetivo:** Criar handlers para commands e queries existentes**Tarefas:**

- [ ] Criar handler para `CreateCompanyCommand`
- [ ] Criar handler para `UpdateVehicleCommand`
- [ ] Criar handler para `GetCompanyQuery`
- [ ] Criar handler para `ListVehiclesQuery`
- [ ] Testar handlers isoladamente

**Arquivos:**

- `apps/web/lib/cqrs/commands/`
- `apps/web/lib/cqrs/queries/`
- `apps/web/lib/cqrs/handlers/`

### 7.2 Migração Gradual de Rotas

**Objetivo:** Migrar rotas API para usar CQRS**Tarefas:**

- [ ] Migrar `POST /api/admin/companies` para usar `CreateCompanyCommand`
- [ ] Migrar `POST /api/admin/vehicles` para usar `CreateVehicleCommand`
- [ ] Migrar `GET /api/admin/companies/[companyId] `para usar `GetCompanyQuery`
- [ ] Migrar `GET /api/admin/vehicles-list` para usar `ListVehiclesQuery`
- [ ] Testar cada migração
- [ ] Documentar processo de migração

**Estratégia:**

- Migrar 1-2 rotas por vez
- Manter rotas antigas funcionando durante migração
- Testar completamente antes de remover código antigo

### 7.3 Integração com Event Sourcing

**Objetivo:** Garantir que eventos são publicados corretamente**Tarefas:**

- [ ] Verificar que Event Store está funcionando
- [ ] Verificar que eventos são publicados quando commands são executados
- [ ] Verificar que Audit Handler está funcionando
- [ ] Testar fluxo completo de evento

**Arquivos:**

- `apps/web/lib/events/event-store.ts`
- `apps/web/lib/events/event-publisher.ts`
- `apps/web/lib/events/handlers/audit-handler.ts`

## Fase 8: Implementação de Funcionalidades Faltantes

### 8.1 APIs Google Maps Faltando

**Objetivo:** Implementar APIs Google Maps que faltam**Tarefas:**

- [ ] Implementar Distance Matrix API para notificações de aproximação
- [ ] Implementar Reverse Geocoding API para converter coordenadas em endereços
- [ ] Implementar Places API (Autocomplete) para busca de endereços
- [ ] Integrar APIs nos componentes apropriados
- [ ] Testar funcionalidades

**Arquivos:**

- `apps/web/lib/google-maps/` (criar se não existir)
- Componentes que usam mapas

### 8.2 Funcionalidades Mobile

**Objetivo:** Completar funcionalidades faltantes no app mobile**Tarefas:**

- [ ] Analisar `apps/mobile/docs/MOBILE_STATUS.md` para identificar funcionalidades faltantes
- [ ] Implementar integração real com backend (substituir dados mock)
- [ ] Implementar navegação turn-by-turn no app do motorista
- [ ] Implementar funcionalidades de chat
- [ ] Testar app mobile completamente

**Arquivos:**

- `apps/mobile/`

## Fase 9: Resolução de TODOs

### 9.1 Categorização de TODOs

**Objetivo:** Categorizar todos os TODOs por prioridade**Tarefas:**

- [ ] Revisar cada TODO identificado na Fase 1.4
- [ ] Categorizar por: Crítico, Alta, Média, Baixa prioridade
- [ ] Categorizar por tipo: Bug, Feature, Refactor, Documentation
- [ ] Criar issues no GitHub ou tarefas no projeto

### 9.2 Resolução de TODOs Críticos

**Objetivo:** Resolver TODOs de alta prioridade**Tarefas:**

- [ ] Resolver TODOs críticos primeiro
- [ ] Resolver TODOs relacionados a bugs
- [ ] Documentar resoluções

### 9.3 Resolução de TODOs de Média/Baixa Prioridade

**Objetivo:** Resolver TODOs restantes gradualmente**Tarefas:**

- [ ] Resolver TODOs de funcionalidades
- [ ] Resolver TODOs de refatoração
- [ ] Resolver TODOs de documentação

## Fase 10: Testes e Validação

### 10.1 Testes de Build

**Objetivo:** Garantir que build funciona sem erros**Tarefas:**

- [ ] Executar `npm run build` localmente
- [ ] Verificar que não há erros de TypeScript
- [ ] Verificar que não há warnings críticos
- [ ] Testar build no Vercel
- [ ] Verificar que todas as rotas estão funcionando

### 10.2 Testes de Funcionalidade

**Objetivo:** Testar funcionalidades críticas**Tarefas:**

- [ ] Testar fluxo completo de login
- [ ] Testar autenticação em todas as rotas protegidas
- [ ] Testar CRUD de empresas, transportadoras, veículos, motoristas
- [ ] Testar funcionalidades de mapa
- [ ] Testar geração de relatórios
- [ ] Testar cron jobs

### 10.3 Testes de Performance

**Objetivo:** Validar melhorias de performance**Tarefas:**

- [ ] Medir tempo de carregamento de páginas principais
- [ ] Medir tempo de resposta de APIs críticas
- [ ] Verificar uso de cache Redis
- [ ] Verificar performance de views do Supabase
- [ ] Comparar métricas antes e depois das otimizações

### 10.4 Testes de Segurança

**Objetivo:** Validar melhorias de segurança**Tarefas:**

- [ ] Testar proteção de rotas perigosas
- [ ] Testar rate limiting
- [ ] Testar validação de inputs
- [ ] Testar CSRF protection
- [ ] Verificar que cookies estão seguros

## Fase 11: Documentação

### 11.1 Documentação Técnica

**Objetivo:** Atualizar documentação técnica**Tarefas:**

- [ ] Atualizar `README.md` com status atual
- [ ] Atualizar `docs/ARCHITECTURE.md` com mudanças
- [ ] Criar/atualizar `docs/TYPESCRIPT_STATUS.md` com status final
- [ ] Documentar processo de migração CQRS
- [ ] Documentar melhorias de performance implementadas

### 11.2 Documentação de Desenvolvimento

**Objetivo:** Criar guias para desenvolvedores**Tarefas:**

- [ ] Criar guia de correção de erros TypeScript
- [ ] Criar guia de uso do logger
- [ ] Criar guia de migração para CQRS
- [ ] Atualizar guias de setup e desenvolvimento

### 11.3 Documentação de Operações

**Objetivo:** Atualizar runbooks operacionais**Tarefas:**

- [ ] Atualizar runbook de deploy
- [ ] Atualizar runbook de troubleshooting
- [ ] Criar runbook de monitoramento de performance
- [ ] Criar runbook de resolução de problemas de segurança

## Fase 12: Validação Final e Deploy

### 12.1 Checklist Final

**Objetivo:** Validar que tudo está funcionando**Tarefas:**

- [ ] Verificar que todos os erros TypeScript críticos foram corrigidos
- [ ] Verificar que `console.*` foi substituído por logger
- [ ] Verificar que tipos `any` foram corrigidos onde possível
- [ ] Verificar que TODOs críticos foram resolvidos
- [ ] Verificar que melhorias de performance foram implementadas
- [ ] Verificar que melhorias de segurança foram implementadas
- [ ] Verificar que documentação está atualizada

### 12.2 Deploy em Produção

**Objetivo:** Fazer deploy das melhorias**Tarefas:**

- [ ] Criar branch de release
- [ ] Fazer merge das mudanças
- [ ] Fazer deploy no Vercel
- [ ] Verificar que deploy foi bem-sucedido
- [ ] Monitorar logs e métricas após deploy
- [ ] Validar funcionalidades em produção

## Métricas de Sucesso

### TypeScript

- [ ] Erros reduzidos de 154 para < 20
- [ ] `ignoreBuildErrors` removido do `next.config.js`
- [ ] Build TypeScript passa sem erros

### Logger

- [ ] 100% dos `console.*` substituídos por logger estruturado
- [ ] Logger funcionando em desenvolvimento e produção
- [ ] Logs estruturados e úteis

### Performance

- [ ] Queries otimizadas (sem `.select('*')` desnecessário)
- [ ] Cache Redis implementado em rotas críticas
- [ ] Bundle size reduzido
- [ ] Views do Supabase com p95 < 250ms

### Segurança

- [ ] Cookie de sessão sem `access_token`
- [ ] Rate limiting em rotas críticas
- [ ] Validação de inputs completa
- [ ] Rotas perigosas protegidas

### CQRS

- [ ] Handlers criados para commands/queries principais
- [ ] Pelo menos 4 rotas migradas para CQRS
- [ ] Event Sourcing funcionando

### Funcionalidades

- [ ] APIs Google Maps faltando implementadas
- [ ] Funcionalidades mobile críticas completas

## Notas Importantes

1. **Priorização**: Fases 1-4 são críticas e devem ser feitas primeiro
2. **Incremental**: Cada fase pode ser feita incrementalmente, não precisa esperar conclusão completa
3. **Testes**: Testar após cada mudança significativa