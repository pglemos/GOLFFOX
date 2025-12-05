# Relatório de Auditoria - Fase 1: Descoberta e Mapeamento

**Data:** 2025-01-XX  
**Status:** ✅ Fase 1 Completa

---

## RESUMO EXECUTIVO

A Fase 1 de descoberta e mapeamento foi concluída. Identificamos:
- ✅ Estrutura completa do sistema mapeada
- ✅ 340 erros de TypeScript identificados
- ✅ Migrations duplicadas detectadas
- ✅ Documentação desatualizada identificada
- ⚠️ Helper functions RLS ausentes nas migrations
- ⚠️ RPC functions simplificadas (sem SELECT FOR UPDATE)

---

## ESTRUTURA IDENTIFICADA

### Web App (`apps/web/`)

**Versões Confirmadas:**
- Next.js: 16.0.7
- React: 19.0.0
- TypeScript: 5.9.3
- Supabase JS: 2.81.0

**Rotas API:** 100+ rotas identificadas (ver `MAPEAMENTO_ESTADO_ATUAL.md`)

**Páginas:** 50+ páginas mapeadas

### Mobile App (`apps/mobile/`)

**Versões Confirmadas:**
- Flutter: >=3.24.0
- Dart SDK: ^3.6.0
- Supabase Flutter: 2.8.0

**Estrutura:** Core, Services, Models, Features mapeados

---

## PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. Erros de TypeScript (340 erros)

**Categorias:**
- **Type Safety:** Propriedades não existentes em tipos (`company_id`, `transportadora_id`, `role`)
- **Mock Supabase Client:** Tipos mock incompletos (faltam métodos `rpc`, `removeChannel`, `lt`, `or`, `upsert`)
- **Realtime:** Tipos incorretos para `postgres_changes` (esperado `presence`)
- **React Hooks:** `useRef` sem valor inicial
- **Zod:** Versão incompatível com `errorMap` em `z.enum`
- **Spread Types:** Tentativas de spread em tipos `never`

**Arquivos Mais Afetados:**
- `app/transportadora/page.tsx` - 28 erros
- `app/api/admin/create-operator/route.ts` - 19 erros
- `components/sidebar.tsx` - 9 erros
- `hooks/use-realtime-updates.ts` - 9 erros

**Prioridade:** P0 (bloqueia build em produção)

---

### 2. Migrations Duplicadas

**Problema:**
- `supabase/migrations/20241203_add_address_columns.sql` e `20241203_add_missing_columns.sql` são idênticos
- Ambos adicionam mesmas colunas em `users` e `vehicles`

**Risco:** Aplicação duplicada pode causar erros ou conflitos

**Prioridade:** P1

---

### 3. Helper Functions RLS Ausentes

**Esperado (conforme documentação):**
- `is_admin()` - Verificar se usuário é admin
- `current_role()` - Obter role atual do usuário
- `current_company_id()` - Obter company_id do usuário
- `current_carrier_id()` - Obter carrier_id do usuário

**Estado Atual:**
- ❌ Nenhuma dessas funções existe nas migrations atuais
- ⚠️ Documentação referencia essas funções mas não estão implementadas

**Impacto:** Políticas RLS podem não funcionar corretamente se dependem dessas funções

**Prioridade:** P0 (segurança)

---

### 4. RPC Functions Simplificadas

**`rpc_trip_transition` (002_missing_schema.sql):**
- ✅ Existe mas é simplificada
- ❌ Não usa `SELECT FOR UPDATE` (sem controle de concorrência)
- ❌ Não valida transições de estado
- ❌ Não verifica permissões (admin/operator/carrier)
- ❌ Não implementa `p_force` para reabertura

**Esperado (conforme documentação):**
- Controle de concorrência com `SELECT FOR UPDATE`
- Validação de transições válidas
- Verificação de permissões por role
- Suporte a `p_force` para admin override

**Prioridade:** P1 (funcionalidade crítica)

---

### 5. Tabela `carriers` Ausente

**Problema:**
- Documentação referencia tabela `carriers`
- Migrations não criam tabela `carriers`
- Apenas campo `carrier_id TEXT` em `users`, `routes`, `vehicles`

**Estado Atual:**
- `carrier_id` é TEXT (não UUID com FK)
- Sem tabela `carriers` para normalização
- Sem RLS policies específicas para carriers

**Prioridade:** P2 (pode ser por design, mas inconsistente com documentação)

---

### 6. Trip Summary Function Ausente

**Esperado (conforme documentação):**
- Função `calculate_trip_summary(p_trip_id)`
- Trigger `trg_driver_positions_recalc_summary`
- Tabela `trip_summary`

**Estado Atual:**
- ❌ Função não existe
- ❌ Trigger não existe
- ❌ Tabela `trip_summary` não existe

**Impacto:** Resumos de viagem não são calculados automaticamente

**Prioridade:** P1

---

### 7. RLS Policies Básicas

**Estado Atual:**
- Políticas básicas: `service_role` + `authenticated` genérico
- Não há políticas específicas por role (admin, operator, carrier, driver, passenger)
- Não há políticas canônicas conforme documentação

**Esperado:**
- Políticas canônicas por role
- Admin: acesso total
- Operator: escopo por `company_id`
- Carrier: escopo por `carrier_id`
- Driver: apenas próprias trips
- Passenger: apenas trips atribuídas

**Prioridade:** P0 (segurança)

---

### 8. TypeScript Build Errors Ignorados

**Problema:**
- `next.config.js` tem `ignoreBuildErrors: true`
- 340 erros de TypeScript são ignorados no build
- Build pode passar mas código tem problemas de tipo

**Risco:** Erros em runtime não detectados em build

**Prioridade:** P0

---

### 9. Documentação Desatualizada

**Problema:**
- Muitos documentos referem-se a v7.4 e estruturas antigas
- Documentos mencionam arquivos que não existem (`lib/supabase/migration_complete_v74.sql`)
- Documentos mencionam funções que não existem

**Arquivos Desatualizados Identificados:**
- `docs/guides/VALIDATION_CHECKLIST.md` - referencia funções ausentes
- `docs/api/AUDIT_REPORT_v7.4.md` - referencia v7.4
- `docs/deployment/EXECUTION_SUMMARY.md` - referencia arquivos ausentes

**Prioridade:** P2

---

## ANÁLISE DE MIGRATIONS

### Migrations em `apps/web/database/migrations/`

1. **`001_initial_schema.sql`** ✅
   - Cria tabelas core (companies, users, routes, vehicles, trips)
   - RLS básico habilitado
   - Políticas básicas (service_role + authenticated)
   - Índices criados
   - Triggers `updated_at`

2. **`002_missing_schema.sql`** ⚠️
   - Cria tabelas faltantes (driver_positions, route_stops, gf_incidents, etc.)
   - RLS habilitado
   - Políticas básicas
   - RPC `rpc_trip_transition` simplificada
   - Views criadas (vehicle_positions, profiles, v_costs_secure)

3. **`fix_supabase_issues.sql`** ✅
   - Adiciona `is_active` em `routes` e `users`
   - Idempotente

### Migrations em `supabase/migrations/`

1. **`20241203_add_address_columns.sql`** ⚠️ DUPLICADO
2. **`20241203_add_missing_columns.sql`** ⚠️ DUPLICADO

**Problema:** Ambos são idênticos, adicionam mesmas colunas.

---

## ANÁLISE DE CÓDIGO

### Web - Autenticação

**`apps/web/lib/auth.ts`:**
- ✅ Usa `getUserRoleByEmail` para obter role
- ✅ Persiste sessão em cookie `golffox-session`
- ✅ Integração com Supabase Auth

**`apps/web/lib/user-role.ts`:**
- ✅ Mapeamento hardcoded de emails para roles
- ⚠️ Não consulta banco de dados (usa apenas email)

**`apps/web/app/api/auth/login/route.ts`:**
- ✅ Validação CSRF (double-submit cookie)
- ✅ Rate limiting
- ✅ Cookies httpOnly, secure, sameSite
- ✅ Usa service_role para operações admin

### Web - Middleware

**`apps/web/middleware.ts`:**
- ✅ Proteção de rotas `/admin`, `/operador`, `/transportadora`
- ✅ Verificação de cookie `golffox-session`
- ✅ Fallback para cookie Supabase
- ✅ Redirecionamentos de compatibilidade

### Mobile - Supabase Service

**`apps/mobile/lib/services/supabase_service.dart`:**
- ✅ Cliente singleton
- ✅ Tratamento de erros (RLS, network, auth)
- ✅ Métodos para trips, positions, routes
- ⚠️ Não usa helper functions RLS (não existem)

### Mobile - Realtime Service

**`apps/mobile/lib/services/realtime_service.dart`:**
- ✅ Subscription para `vehicle_positions`
- ✅ Fallback para mock data em dev
- ⚠️ Usa view `vehicle_positions` (pode não existir)

---

## PRÓXIMOS PASSOS (Fase 2)

### Prioridade P0 (Crítico)

1. **Corrigir erros de TypeScript**
   - Expandir tipos mock do Supabase client
   - Corrigir tipos de Realtime
   - Corrigir `useRef` sem valor inicial
   - Atualizar Zod para versão compatível

2. **Implementar Helper Functions RLS**
   - Criar migration com `is_admin()`, `current_role()`, `current_company_id()`, `current_carrier_id()`
   - Atualizar políticas RLS para usar essas funções

3. **Implementar RLS Policies Canônicas**
   - Criar políticas específicas por role
   - Substituir políticas genéricas

4. **Remover `ignoreBuildErrors`**
   - Corrigir todos os erros de TypeScript
   - Habilitar verificação de tipos no build

### Prioridade P1 (Alto)

1. **Melhorar RPC `rpc_trip_transition`**
   - Adicionar `SELECT FOR UPDATE`
   - Validar transições de estado
   - Verificar permissões por role
   - Implementar `p_force`

2. **Implementar Trip Summary**
   - Criar função `calculate_trip_summary`
   - Criar trigger `trg_driver_positions_recalc_summary`
   - Criar tabela `trip_summary`

3. **Remover Migrations Duplicadas**
   - Consolidar migrations duplicadas
   - Verificar se foram aplicadas

### Prioridade P2 (Médio)

1. **Criar Tabela `carriers`**
   - Normalizar `carrier_id` para UUID com FK
   - Criar políticas RLS específicas

2. **Atualizar Documentação**
   - Remover referências a v7.4
   - Atualizar referências a arquivos
   - Documentar estado atual real

---

## ARQUIVOS ALTERADOS NESTA FASE

1. ✅ `docs/auditoria/MAPEAMENTO_ESTADO_ATUAL.md` - Criado
2. ✅ `docs/auditoria/RELATORIO_AUDITORIA_FASE1.md` - Criado (este arquivo)

---

## CONCLUSÃO

A Fase 1 identificou problemas críticos que precisam ser corrigidos antes de prosseguir:
- 340 erros de TypeScript bloqueiam build seguro
- Helper functions RLS ausentes comprometem segurança
- RLS policies básicas não seguem padrão canônico
- RPC functions simplificadas não têm controle de concorrência

**Recomendação:** Prosseguir para Fase 2 (Correção) com foco em P0 e P1.

