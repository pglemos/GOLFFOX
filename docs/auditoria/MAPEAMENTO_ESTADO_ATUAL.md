# Mapeamento do Estado Atual - Golf Fox

**Data:** 2025-01-XX  
**Objetivo:** Documentar estrutura real do sistema para auditoria completa

---

## Estrutura Real Identificada

### Web App (`apps/web/`)

#### Rotas API Identificadas

**Autenticação (`app/api/auth/`):**
- `login/route.ts` - Login com validação CSRF, cookies httpOnly
- `set-session/route.ts` - Definir sessão
- `clear-session/route.ts` - Limpar sessão
- `csrf/route.ts` - Token CSRF
- `me/route.ts` - Obter usuário atual
- `seed-admin/route.ts` - Criar admin (dev)
- `fix-test-user/route.ts` - Fix usuário teste
- `fix-transportadora-user/route.ts` - Fix usuário transportadora
- `fix-users/` - Correções de usuários

**Admin (`app/api/admin/`):**
- `alerts/` - CRUD de alertas
- `assistance-requests/` - CRUD de solicitações de socorro
- `audit-db/route.ts` - Auditoria do banco
- `audit-log/route.ts` - Log de auditoria
- `companies/` - CRUD de empresas
- `create-operator/route.ts` - Criar operador
- `create-operator-login/route.ts` - Criar login operador
- `create-carrier-login/route.ts` - Criar login transportadora
- `create-transportadora-login/route.ts` - Criar login transportadora
- `create-user/route.ts` - Criar usuário
- `drivers/` - CRUD de motoristas
- `emergency/` - APIs de emergência
- `employees-list/route.ts` - Lista funcionários
- `execute-sql-fix/route.ts` - Executar correção SQL
- `fix-database/route.ts` - Corrigir banco
- `generate-stops/route.ts` - Gerar pontos de parada
- `kpis/route.ts` - KPIs do dashboard
- `migrate-users-address/route.ts` - Migrar endereços
- `optimize-route/route.ts` - Otimizar rota
- `routes/` - CRUD de rotas
- `seed-cost-categories/route.ts` - Seed categorias custo
- `transportadora/` - CRUD transportadora (duplicado com transportadoras/)
- `transportadoras/` - CRUD transportadoras
- `trips/` - CRUD de viagens
- `users/` - CRUD de usuários
- `vehicles/` - CRUD de veículos

**Operator (`app/api/operador/` e `app/api/operator/`):**
- `associate-company/route.ts` - Associar empresa
- `create-employee/route.ts` - Criar funcionário
- `employees/route.ts` - Lista funcionários
- `historico-rotas/route.ts` - Histórico de rotas
- `optimize-route/route.ts` - Otimizar rota

**Carrier/Transportadora (`app/api/transportadora/`):**
- `alertas/route.ts` - Alertas
- `alerts/route.ts` - Alertas (duplicado)
- `costs/` - Custos por rota/veículo
- `drivers/` - Documentos e exames de motoristas
- `motoristas/route.ts` - Motoristas
- `reports/` - Relatórios (performance, frota, viagens)
- `storage/signed-url/route.ts` - URL assinada storage
- `upload/route.ts` - Upload arquivos
- `vehicles/` - Documentos e manutenções de veículos

**Costs (`app/api/costs/`):**
- `budgets/route.ts` - Orçamentos
- `categories/route.ts` - Categorias
- `export/route.ts` - Export custos
- `import/route.ts` - Import custos
- `kpis/route.ts` - KPIs de custos
- `manual/route.ts` - Custos manuais
- `reconcile/route.ts` - Conciliação
- `vs-budget/route.ts` - Comparação com orçamento

**Reports (`app/api/reports/`):**
- `dispatch/route.ts` - Despachar relatório
- `run/route.ts` - Gerar relatório
- `schedule/route.ts` - Agendar relatório

**Cron (`app/api/cron/`):**
- `dispatch-reports/route.ts` - Despachar relatórios agendados
- `refresh-costs-mv/route.ts` - Atualizar materialized views custos
- `refresh-kpis/route.ts` - Atualizar KPIs

**Outros:**
- `analytics/web-vitals/route.ts` - Métricas Web Vitals
- `cep/route.ts` - Busca CEP
- `docs/openapi/route.ts` - Documentação OpenAPI
- `health/route.ts` - Health check
- `notifications/` - Notificações (proximidade, email)
- `test-session/route.ts` - Testar sessão (dev)
- `user/update-profile/route.ts` - Atualizar perfil
- `user/upload-avatar/route.ts` - Upload avatar

#### Páginas Identificadas

**Admin (`app/admin/`):**
- `page.tsx` - Dashboard admin
- `empresas/page.tsx` - Gestão empresas
- `transportadoras/page.tsx` - Gestão transportadoras
- `usuarios/page.tsx` - Gestão usuários
- `motoristas/page.tsx` - Gestão motoristas
- `veiculos/page.tsx` - Gestão veículos
- `rotas/page.tsx` - Gestão rotas
- `mapa/page.tsx` - Mapa da frota
- `alertas/page.tsx` - Alertas
- `socorro/page.tsx` - Solicitações de socorro
- `relatorios/page.tsx` - Relatórios
- `custos/page.tsx` - Custos
- `preferences/page.tsx` - Preferências
- `ajuda-suporte/page.tsx` - Ajuda
- `configuracoes/page.tsx` - Configurações

**Operator (`app/operador/`):**
- `page.tsx` - Dashboard operador
- `funcionarios/page.tsx` - Funcionários
- `rotas/page.tsx` - Rotas
- `rotas/mapa/page.tsx` - Mapa de rotas
- `alertas/page.tsx` - Alertas
- `relatorios/page.tsx` - Relatórios
- `custos/page.tsx` - Custos
- `comunicacoes/page.tsx` - Comunicações
- `conformidade/page.tsx` - Conformidade
- `solicitacoes/page.tsx` - Solicitações
- `prestadores/page.tsx` - Prestadores
- `ajuda/page.tsx` - Ajuda
- `sincronizar/page.tsx` - Sincronização
- `preferencias/page.tsx` - Preferências
- `historico-rotas/page.tsx` - Histórico

**Transportadora (`app/transportadora/`):**
- `page.tsx` - Dashboard transportadora
- `mapa/page.tsx` - Mapa
- `veiculos/page.tsx` - Veículos
- `motoristas/page.tsx` - Motoristas
- `relatorios/page.tsx` - Relatórios
- `alertas/page.tsx` - Alertas
- `custos/page.tsx` - Custos
- `ajuda/page.tsx` - Ajuda
- `configuracoes/page.tsx` - Configurações
- `preferencias/page.tsx` - Preferências

**Outros:**
- `page.tsx` - Login (raiz)
- `driver/page.tsx` - Dashboard motorista
- `passenger/page.tsx` - Dashboard passageiro
- `unauthorized/page.tsx` - Não autorizado
- `diagnostico/page.tsx` - Diagnóstico

#### Configurações Web

**Versões:**
- Next.js: 16.0.7
- React: 19.0.0
- TypeScript: 5.9.3

**Configurações Importantes:**
- `next.config.js` - TypeScript ignoreBuildErrors: true (⚠️ ATENÇÃO)
- `middleware.ts` - Proteção de rotas, redirecionamentos
- `lib/supabase.ts` - Cliente Supabase (sem interceptação global de fetch)

---

### Mobile App (`apps/mobile/`)

#### Estrutura Identificada

**Core (`lib/core/`):**
- `auth/auth_manager.dart` - Gerenciador de autenticação
- `config/supabase_config.dart` - Configuração Supabase
- `location_service.dart` - Serviço de localização GPS
- `routing/app_router.dart` - Roteamento
- `supa/supa_client.dart` - Cliente Supabase
- `theme/` - Temas e tokens

**Services (`lib/services/`):**
- `auth_service.dart` - Serviço de autenticação
- `supabase_service.dart` - Serviço Supabase (principal)
- `realtime_service.dart` - Serviço realtime
- `tracking_service.dart` - Tracking GPS
- `map_service.dart` - Serviço de mapa
- `route_service.dart` - Serviço de rotas
- `vehicle_service.dart` - Serviço de veículos
- `driver_service.dart` - Serviço de motoristas
- `bus_stop_service.dart` - Serviço de pontos de parada

**Models (`lib/models/`):**
- `driver_position.dart` - Posição do motorista
- `trip.dart` - Viagem
- `route.dart` - Rota
- `vehicle.dart` - Veículo
- `user.dart` - Usuário
- `company.dart` - Empresa
- `driver.dart` - Motorista
- E outros modelos...

**Features (`lib/features/`):**
- `auth/` - Autenticação
- `driver/` - App motorista
- `passenger/` - App passageiro
- `operator/` - Operador
- `carrier/` - Transportadora
- `routes/` - Rotas
- `vehicles/` - Veículos
- `drivers/` - Motoristas
- E outras features...

**Configurações Mobile:**
- Flutter: >=3.24.0
- Dart SDK: ^3.6.0
- `analysis_options.yaml` - Regras de linting rigorosas

---

### Migrations Identificadas

#### `apps/web/database/migrations/`
1. `001_initial_schema.sql` - Schema inicial completo
   - Extensões (uuid-ossp, pgcrypto)
   - Tabelas core (companies, carriers, users, vehicles, routes, trips)
   - RLS policies básicas
   - Índices

2. `002_missing_schema.sql` - Schema faltante inferido do código
   - `driver_positions` - Posições GPS
   - `route_stops` - Pontos de parada
   - `gf_incidents` - Incidentes/alertas
   - Outras tabelas faltantes

3. `fix_supabase_issues.sql` - Correções
   - Adiciona `is_active` em `routes`
   - Adiciona `is_active` em `users`

#### `supabase/migrations/`
1. `20241203_add_address_columns.sql` - Colunas de endereço
   - Adiciona colunas de endereço em `users`
   - Adiciona colunas em `vehicles` (chassis, renavam, color, fuel_type, vehicle_type, carrier_id)

2. `20241203_add_missing_columns.sql` - Colunas faltantes
   - Mesmas colunas de endereço (duplicado?)
   - Mesmas colunas de veículos (duplicado?)

**⚠️ ATENÇÃO:** Migrations duplicadas entre `supabase/migrations/` podem causar conflitos.

---

## Configurações Críticas Identificadas

### Web - Autenticação
- Login em `app/api/auth/login/route.ts`:
  - Validação CSRF (double-submit cookie)
  - Cookies httpOnly, secure, sameSite
  - Verificação de usuário no banco (`getUserRoleByEmail`)
  - Rate limiting aplicado
  - Uso de service_role para operações admin

### Web - Middleware
- `middleware.ts`:
  - Proteção de rotas `/admin`, `/operador`, `/transportadora`
  - Verificação de cookie `golffox-session`
  - Fallback para cookie Supabase
  - Redirecionamentos de compatibilidade (`/operator` → `/operador`)

### Mobile - Autenticação
- `lib/core/auth/auth_manager.dart`:
  - Gerenciamento de estado de autenticação
  - Carregamento de perfil de usuário
  - Role-based access control
  - Persistência de sessão

### Mobile - Supabase
- `lib/services/supabase_service.dart`:
  - Cliente Supabase singleton
  - Tratamento de erros (RLS, network, auth)
  - Métodos para trips, positions, routes
  - Timeout de 20s padrão

---

## Problemas Identificados Inicialmente

### 1. Migrations Duplicadas
- `supabase/migrations/20241203_add_address_columns.sql` e `20241203_add_missing_columns.sql` parecem duplicados
- Necessário verificar se ambas foram aplicadas

### 2. Rotas API Duplicadas
- `/api/admin/transportadora/` e `/api/admin/transportadoras/` - verificar qual é a correta
- `/api/operador/` e `/api/operator/` - verificar qual é a correta

### 3. TypeScript Build Errors Ignorados
- `next.config.js` tem `ignoreBuildErrors: true` - necessário investigar erros reais

### 4. Documentação Desatualizada
- Muitos documentos referem-se a v7.4 e estruturas antigas
- Necessário atualizar documentação

---

## Próximos Passos

1. ✅ Mapeamento inicial completo
2. ⏳ Análise detalhada de cada rota API
3. ⏳ Análise de migrations e compatibilidade
4. ⏳ Validação de RLS policies
5. ⏳ Execução de testes

