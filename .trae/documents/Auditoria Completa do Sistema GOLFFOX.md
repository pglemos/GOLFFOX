**Visão Geral do Sistema**

* Monorepo com múltiplos apps: web (Next.js 15), mobile (Flutter), utilitários compartilhados e infraestrutura para ambiente local com Supabase, Redis e cron jobs.

* Forte integração com Supabase (auth, Postgres, storage), com rotas API no próprio Next.js (app router) e serviços server-side.

* Testes: unitários (Jest/Vitest) e e2e (Playwright) no web; unit/widget/integration em Flutter; suíte de testes Python “testsprite” para validar endpoints.

**Tecnologias Principais**

* Web: `Next.js 15`, `React 18`, `TypeScript`, `TailwindCSS`, `Radix UI`, `Zod`, `Zustand`, `TanStack Query`, `SWR`, `@sentry/nextjs`, `Upstash Ratelimit/Redis`, `Google Maps API`.

* Backend/API (no Next): Handlers `GET/POST/...` via `next/server`, `@supabase/supabase-js` (anon e `service_role`), cron endpoints, serviços server-side.

* Mobile: `Flutter` (Android/iOS/Web) com arquitetura por módulos (core/data/domain/models/services/ui/widgets).

* Dados: Supabase (Postgres + RLS + views/RPCs/seeds/migrações), Storage para relatórios.

* DevOps: Docker Compose (stack Supabase local + Next.js dev), Vercel (cron), GitHub Actions (CI para Flutter e Next.js).

**Arquitetura Geral**

* Apps e Camadas:

  * `apps/web`: UI por rotas (`app/`), APIs (`app/api/*`), componentes (`components/*`), hooks (`hooks/*`), libs (`lib/*`), serviços (`server/services/*`), testes (`__tests__`, `e2e`), scripts admin (`scripts/*`).

  * `apps/mobile`: Flutter organizado em `lib/core|data|domain|models|services|ui|widgets`, com `pubspec.yaml`, `analysis_options.yaml`.

  * `web-app`: segundo app Next.js reduzido (duplicação parcial de funcionalidades admin/docs).

* Dados e Migrações:

  * `database/migrations`: versões e correções (RLS, relationships, views de custos/mapa/KPIs, RPCs operador).

  * `database/scripts`: criação/verificação de esquema, policies, views de relatório; seeds SQL em `database/seeds`.

* Infra/DevOps:

  * `infra/docker-compose.yml`: stack Supabase completa (DB, Auth, REST, Realtime, Storage, Imgproxy, Studio), Redis e Next.js dev.

  * `.github/workflows/ci.yml`: pipelines para Flutter e Next.js.

**Propósito/Escopo (inferido)**

* Plataforma de mobilidade/rotas para empresas e operadores: gestão de empresas, veículos, motoristas/funcionários e passageiros; custos e KPIs; mapa e otimização de rotas; relatórios programados e sob demanda; autenticação por papéis (admin/operator/carrier/driver/passenger).

**Inventário do que já existe (Repertório Atual)**

* Backend / API

  * Autenticação:

    * `apps/web/app/api/auth/login/route.ts` — login com Supabase, CSRF opcional em dev/test, retorno de token/refresh, persistência cookie (`golffox-session`). Referência: `apps/web/app/api/auth/login/route.ts:46–64`, `228–229`.

    * CSRF: `apps/web/app/api/auth/csrf/route.ts`; seed admin: `apps/web/app/api/auth/seed-admin/route.ts`.

  * Saúde/Docs/Analytics:

    * Health: `apps/web/app/api/health/route.ts` — verifica Supabase; `apps/web/app/api/health/route.ts:27–44`.

    * OpenAPI parcial: `apps/web/app/api/docs/openapi/route.ts` e `apps/web/public/openapi.json`.

    * Web Vitals: `apps/web/app/api/analytics/web-vitals/route.ts`.

  * Custos:

    * Manual: `apps/web/app/api/costs/manual/route.ts` — validação com `zod` e compatibilidade com `date/cost_date`; `apps/web/app/api/costs/manual/route.ts:7–26`, `211–229`.

    * Import/Export/KPIs/Reconcile: `apps/web/app/api/costs/{import|export|kpis|reconcile}/route.ts`.

  * Admin:

    * Empresas: `apps/web/app/api/admin/companies/route.ts` — listagem/ criação com `requireAuth('admin')` e `withRateLimit`; `apps/web/app/api/admin/companies/route.ts:36–40`, `166–168`.

    * Veículos: `apps/web/app/api/admin/vehicles/route.ts` — GET/POST com bypass de autenticação em dev/test e criação de empresa default; `apps/web/app/api/admin/vehicles/route.ts:55–65`, `81–98`.

    * Usuários/Drivers/Employees/Routes/Trips (variados): `apps/web/app/api/admin/*` (list/delete/optimize/generate) e `audit-log/audit-db`.

  * Operador:

    * Criar funcionário: `apps/web/app/api/operator/create-employee/route.ts` — fluxo robusto c/ fallback em dev/test, validações de role e `company_id`; `apps/web/app/api/operator/create-employee/route.ts:30–60`, `222–238`, `312–341`.

    * Associar empresa / otimizar rota: `apps/web/app/api/operator/*`.

  * Cron/Relatórios:

    * Cron Vercel: `apps/web/app/api/cron/{refresh-kpis|refresh-costs-mv|dispatch-reports}/route.ts`. Despacho de relatórios: valida `CRON_SECRET` com lógica mais permissiva em dev/test; `apps/web/app/api/cron/dispatch-reports/route.ts:66–116`.

    * Geração/envio: `apps/web/app/api/reports/{run|schedule|dispatch}/route.ts` usando Supabase Storage e (opcional) Resend.

  * Serviços Server-side:

    * Reporting: `apps/web/server/services/reporting.ts` — supabase admin para consultas em views; `apps/web/server/services/reporting.ts:3–11`.

  * Autorização e Rate Limit:

    * Auth helpers: `apps/web/lib/api-auth.ts` — valida cookie/Basic/Bearer; `apps/web/lib/api-auth.ts:199–235`.

    * Rate limit: `apps/web/lib/rate-limit.ts` — Upstash; fail-open se Redis falhar; `apps/web/lib/rate-limit.ts:90–95`.

    * Logger com redaction: `apps/web/lib/logger.ts:25–38`.

* Frontend / Apps

  * Rotas principais por papel: `apps/web/app/{admin|operator|carrier|driver|passenger}/...`.

  * UI/Componentes: `apps/web/components/*` e `components/ui/*` (shadcn+Radix), mapas (`components/fleet-map.tsx`, `carrier-map.tsx`, `components/admin-map/*`).

  * Hooks: `apps/web/hooks/*` — auth, performance, responsive, supabase sync.

  * Middleware de proteção: `apps/web/middleware.ts` com bypass por env e exclusão de `/api`; `apps/web/middleware.ts:10–17`, `44–89`.

* Banco / Dados

  * Migrações SQL:

    * Admin core (cost centers, invoices, checklist, incidents, audit log): `database/migrations/v43_admin_core.sql` — idempotente e com índices; p.ex. `database/migrations/v43_admin_core.sql:39–63`, `229–267`, `356–496`.

  * Scripts: criação/verificação de policies/tabelas/perfis/report views em `database/scripts/*`.

  * Seeds: `database/seeds/*` (demo, admin, v74).

* Infra / DevOps

  * Docker Compose: Supabase full stack, Redis e Next.js dev; segredos DEMO expostos; `infra/docker-compose.yml:70–76`, `145–149`.

  * CI/CD: `.github/workflows/ci.yml` — pipelines Flutter (format/analyze/test/build) e Next.js (`web-app`); upload de artifacts.

  * Vercel: `apps/web/vercel.json` — crons.

* Outros

  * Scripts utilitários ricos: `apps/web/scripts/*` (migrar, seed, validar, health-check, deploy, RLS tests).

  * Documentação extensa: `docs/*` e `apps/web/docs/*` com guias, auditorias, checklists, arquitetura.

**O que NÃO foi criado e deveria existir (Lacunas)**

* Endpoint de exclusão/desativação de funcionário (employee):

  * Teste indica ausência explícita de delete; referência: `apps/web/testsprite_tests/TC006_create_employee_as_operator.py:65`.

  * Solução: criar `DELETE /api/admin/employees/{id}` com regra: excluir/arquivar conforme vínculos; registrar `gf_audit_log`.

* OpenAPI completa e unificada:

  * Hoje parcial em `apps/web/app/api/docs/openapi/route.ts` e `apps/web/public/openapi.json`.

  * Solução: gerar documentação automática consolidando todos handlers (paths, schemas zod) e publicar `/api/docs/openapi` com cobertura total.

* Padronização de respostas de erro:

  * Há diversidade entre endpoints; solução: middleware/util único para erros (código, mensagem, meta) e log centralizado.

* Rate limiting e segurança robustos em dev:

  * Fail-open e bypass em dev/test (`rate-limit.ts`, `middleware.ts`, `cron/*`); solução: flags finas por ambiente, testes que cobrem cenários sem bypass, docs claras.

* Unificação de apps Next.js (`apps/web` vs `web-app`):

  * Duplicidade gera divergência; solução: migrar/remover `web-app` ou integrá-lo como pacote compartilhado; ajustar CI para `apps/web`.

* Gestão segura de segredos:

  * `.env.example` possui chaves reais; `docs/*` e `docker-compose.yml` com secrets demo; solução: sanitizar exemplos, mover segredos para secrets/vars (GitHub/Vercel), rotacionar chaves.

* Testes de integração para APIs críticas:

  * Ampliar cobertura para custos, veículos, cron, reports, auth flows; adicionar testes de autorização `requireAuth/requireCompanyAccess`.

**Problemas e Pontos Errados**

* \[Gravidade Alta] `.env.example` expõe chaves reais de Supabase e Google Maps — `.env.example:8–16`, `21–23`.

  * Risco: segurança/comprometimento de ambiente.

  * Sugestão: remover/anonimizar, rotacionar chaves, usar secrets.

* \[Gravidade Alta] Cron `dispatch-reports` aceita secrets permissivos em dev/test — `apps/web/app/api/cron/dispatch-reports/route.ts:66–116`.

  * Risco: execução não autorizada; envio de emails/armazenamento indevido.

  * Sugestão: separar modo dev do deploy; exigir `CRON_SECRET` sempre em ambientes não-locais.

* \[Gravidade Média] Rate limit “fail-open” — `apps/web/lib/rate-limit.ts:90–95`.

  * Risco: abuso em caso de falha Redis.

  * Sugestão: fallback conservador (limitar por processo/IP) e observabilidade para incidentes.

* \[Gravidade Média] Bypass amplo no `middleware` por env — `apps/web/middleware.ts:10–17`.

  * Risco: acesso indevido se variável for habilitada em staging/prod.

  * Sugestão: restringir variável ao dev local; bloquear em CI/prod; adicionar banner em UI.

* \[Gravidade Média] Duplicação de apps (`apps/web` vs `web-app`).

  * Risco: rotas divergentes, manutenção difícil, testes/CI inconsistentes.

  * Sugestão: consolidar em `apps/web` e remover `web-app`.

* \[Gravidade Média] Endpoint de funcionário sem delete/archival padronizado — lacuna funcional; `apps/web/testsprite_tests/TC006_create_employee_as_operator.py:65`.

  * Risco: acúmulo de dados de teste; impactos em produção.

  * Sugestão: implementar `DELETE /api/admin/employees/{id}` com RLS/arquivamento.

* \[Gravidade Baixa] OpenAPI parcial — `apps/web/app/api/docs/openapi/route.ts`.

  * Risco: comunicação falha; APIs mal consumidas.

  * Sugestão: gerar specs completas por zod/tsdoc; publicar e versionar.

**O que está funcionando bem (Pontos Fortes)**

* Login API robusto com CSRF e sanitização: `apps/web/app/api/auth/login/route.ts:46–64`, `192–221`.

  * Ponto forte: boas práticas de segurança (CSRF, cookie `httpOnly`/`secure`), tratamento de erros Supabase.

* Validação com Zod em custos: `apps/web/app/api/costs/manual/route.ts:7–26`.

  * Ponto forte: schemas claros, compatibilidade de campos (`date/cost_date`), mensagens amigáveis.

* Logger com redaction de dados sensíveis: `apps/web/lib/logger.ts:25–38`.

  * Ponto forte: higiene de logs; webhook opcional; níveis por ambiente.

* Migrações idempotentes e com índices: `database/migrations/v43_admin_core.sql` (várias seções).

  * Ponto forte: segurança evolutiva do schema; desempenho por índices.

* Middleware de proteção por papéis e cookie leve: `apps/web/middleware.ts:44–89`.

  * Ponto forte: UX rápida e validação suficiente em páginas protegidas.

* Testes estruturados no web (Jest/Playwright) e mobile (Flutter) com CI: `apps/web/jest.config.js:32–39`, `apps/web/playwright.config.ts:20–24`, `.github/workflows/ci.yml`.

  * Ponto forte: automação e cobertura mínima garantida.

**O que precisa melhorar (Refino e Otimização)**

* \[Alta] Segredos e variáveis de ambiente.

  * Melhorar: sanitizar `.env.example`, remover chaves reais de `docs/*`, parametrizar `docker-compose.yml`.

* \[Alta] Consolidação de apps Next.js.

  * Melhorar: migrar pipelines/rotas para `apps/web`, desativar `web-app`.

* \[Média] Padronização de respostas de erro e códigos.

  * Melhorar: util único com `error_code`, `message`, `meta`; testes de contrato.

* \[Média] Rate limiting e anti-abuso.

  * Melhorar: fallback local; métricas/alertas; cobrir endpoints sensíveis.

* \[Média] Documentação de APIs.

  * Melhorar: geração OpenAPI completa; publicar UI Swagger/ReDoc.

* \[Baixa] Observabilidade.

  * Melhorar: expandir Sentry (traces, releases), logs estruturados com correlação; dashboard de cron/jobs.

**Plano de Ação Prioritário**

* Curto prazo (0–7 dias)

  * Sanitizar segredos: limpar `.env.example`, `docs/*`, parametrizar `docker-compose.yml`.

  * Fixar cron auth: exigir `CRON_SECRET` em todos ambientes não-dev; bloquear permissivo.

  * Consolidar CI em `apps/web` e desabilitar build/test de `web-app`.

  * Adicionar endpoint `DELETE /api/admin/employees/{id}` com arquivamento/audit.

* Médio prazo (8–30 dias)

  * Padronizar erros/respostas; criar lib `api-error` e aplicar em handlers.

  * Implementar rate limit robusto + observabilidade; alertas em Upstash falha.

  * Gerar OpenAPI completo a partir dos schemas zod; publicar `/api/docs/openapi`.

  * Ampliar testes integração: custos, veículos, cron/reports; cenários auth/RLS.

* Longo prazo (30+ dias)

  * Unificar apps Next.js; remover `web-app` e migrar utilidades.

  * Fortalecer arquitetura de domínio (módulos costs/reports/operators) com serviços e repositórios claros.

  * Observabilidade avançada: tracing end-to-end, dashboards KPIs técnicos; auditoria estruturada (`gf_audit_log`).

**Navegação da Pasta (Mapa Resumido)**

* `apps/web/` — app Next.js (UI, APIs, componentes, hooks, lib, tests, scripts, docs; configs `next.config.js`, `jest.config.js`).

* `apps/mobile/` — app Flutter (Android/iOS/web), arquitetura modular.

* `database/` — migrações SQL, scripts, seeds, relatórios.

* `infra/` — scripts e `docker-compose.yml` (stack Supabase local, Redis, Next.js dev).

* `shared/` — tipos e utils TS.

* `test/` — testes Flutter.

* `web-app/` — app Next.js secundário (duplicado) com algumas APIs/docs.

* `docs/` e `apps/web/docs/` — documentação técnica.

**Nota sobre o Documento Anexado**

* Não foi possível acessar o arquivo indicado (`c:\Users\Pedro\Downloads\Golf Fox – Visão Geral e Escopo Téc.txt`) a partir do ambiente atual. A auditoria acima foi baseada exclusivamente no conteúdo de `f:\GOLFFOX`. Se desejar, posso incorporar o documento assim que estiver acessível dentro do repositório ou compartilhado por outro meio.

