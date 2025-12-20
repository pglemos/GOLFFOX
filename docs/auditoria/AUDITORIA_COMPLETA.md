# Auditoria Técnica Completa – Golf Fox (SaaS de Fretamento Corporativo)

> Atualização: 2025-11-16
>
> - Adicionados/atualizados documentos canônicos: `docs/ARQUITETURA_ATUAL.md` e `docs/GUIA_MIGRACAO.md`.
> - Revisada a seção de estrutura de repositório e migração para refletir estado atual.
> - Incluído checklist de verificação rápida pós-migração ao final deste arquivo.

## Resumo da Implementação (Rodada Atual)
- Correção de segurança no login API: cookie `golffox-session` agora é `httpOnly`, `secure`, `sameSite=lax` e com payload mínimo (id, role, companyId).
- Relatórios: adicionado rate limiting e paginação com seleção explícita de colunas em `web-app/app/api/reports/run/route.ts`.
- Documentação criada: `docs/ARQUITETURA_ATUAL.md` e `docs/GUIA_MIGRACAO_REPERTORIO.md` com estrutura alvo, convenções e mapeamento de migração.
- Branch de refatoração criada e publicada: `refactor/repositorio-organizado`.
- Endpoints de custos: rate limiting aplicado em `export`, `import`, `manual` e `kpis` com paginação/colunas consistentes em export.
- Observabilidade: integrada base de Sentry (`@sentry/nextjs`) com configs client/server/edge e habilitação condicional no `next.config.js`.
- Fixture E2E de autenticação adicionada (`web-app/scripts/auth-fixture.ts`) para testes com CSRF + login e saída de cookie.
- Criação de `archive/LEGADO_NAO_USAR/index.md` para quarentena de conteúdo legado antes da exclusão definitiva.
- Analytics: proteção de `GET`/`POST` de Web Vitals com rate limiting (`public`/`api`).
- Mobile: integração `sentry_flutter` condicional com bootstrap em `lib/core/error/sentry_setup.dart` e chamada em `AppBootstrap`.
- Tipagem: expansão de ícones `lucide-react`, correções em `framer-motion` e casts localizados de Supabase para estabilidade de TypeScript.
- OpenAPI: endpoint `/api/docs/openapi` e documento `docs/api/openapi.json` adicionados.
- Streaming: export CSV em `costs/export` e relatórios `reports/run` agora usam streaming com paginação.
- v49: roteiro de verificação adicionado em `web-app/scripts/check-v49-migration.ts` para checar tabela/políticas.
  - v49 aplicada e verificada: políticas presentes e RLS habilitado em `gf_user_company_map` (ver relatório do script `web-app/scripts/apply-v49-direct.js`).

## Atualização – Reestruturação do Repositório (esta rodada)
- Estrutura alvo consolidada: `apps/web`, `apps/mobile`, `shared`, `database`, `infra`, `docs`, `archive/LEGADO_NAO_USAR`.
- Conteúdo legado arquivado: `web-app/`, `65-web-app/`, `components/`, `lib/` (Dart antigo), `tools/flutter` (SDK local).
- Scripts raiz migrados para `infra/scripts` (setup, deploy, dev).
- Cookie de sessão corrigido em `apps/web/app/api/auth/set-session/route.ts` com payload mínimo e `httpOnly/secure`.
- `reports/dispatch` com SMTP via `nodemailer` já operacional (TLS e anexos).
- Rate limiting confirmado em rotas sensíveis (`reports/*`, `costs/*`, `analytics/*`, `auth/login`, `admin/companies`).

## Visão Geral do Sistema
- Plataforma multi-tenant que conecta Empresa Contratante, Transportadora, Motorista e Passageiro, com operação central pela Golf Fox (operadora master).
- Escopo funcional (documento “Visão Geral e Escopo”): planejamento de rotas, check-in/out de passageiros (NFC/QR/manual), rastreamento GPS em tempo real, gestão de frota/motoristas/custos/manutenções/incident es, relatórios operacionais e financeiros para todos os perfis.
- Ambientes: Painel Admin (Golf Fox), Painel Empresa, Painel Transportadora, App Motorista e App Passageiro.

## Tecnologias principais
- Frontend Web: `Next.js 15` (App Router), `React 18`, `Tailwind CSS`, `Radix UI`, `Framer Motion`, `SWR`/`React Query`.
- Backend Web: rotas API em `Next.js` + `Supabase` (Postgres, Auth, RLS, RPC, Realtime).
- Mobile: `Flutter 3` com `supabase_flutter`, `flutter_map`, `geolocator`, `riverpod`, `go_router`.
- Dados: `PostgreSQL/Supabase` com RLS, views, materialized views e RPCs.
- Integracões: `Google Maps`, `Resend`/`SMTP` (email), Vercel Cron (jobs), Web Vitals.
- Observabilidade: logger custom com webhook; scripts de análise e validação.

## Arquitetura geral
- Monorepo com módulos:
  - `web-app/`: aplicação Next.js (páginas, componentes, lib, rotas API, e2e, scripts)
  - `lib/`: código Flutter (apps móveis, serviços, modelos, UI)
  - `database/`: migrations, seeds e scripts SQL Supabase
  - `docs/`: guias, architecture, audit e deployment docs
  - `.github/`: CI/CD (build, deploy, checks)
- Multi-tenant via `company_id`/RLS, papéis: admin, operador (empresa), transportadora (transportadora), motorista, passageiro.
- Rastreamento em tempo real: inserção periódica em `driver_positions` + Supabase Realtime; fallback polling.
- Relatórios: views, materialized views e APIs para geração/dispatch/schedule.

## Breve resumo de propósito/escopo
- Gestão porta-a-porta de transporte corporativo: do planejamento de rotas e cadastro de colaboradores, à execução em campo (motoristas), visibilidade para passageiros, controles de custos, manutenção e indicadores, tudo consolidado em SaaS multi-tenant.

## Inventário do que já existe (Repertório Atual)

### Backend / API (web-app/app/api)
- Admin
  - `GET /api/admin/audit-db` – snapshot de auditoria (web/mobile, migrações) – `web-app/app/api/admin/audit-db/route.ts:3`
  - `GET /api/admin/audit-log` – eventos de auditoria `gf_audit_log` com `limit` – `web-app/app/api/admin/audit-log/route.ts:16`
  - `OPTIONS|GET|POST /api/admin/companies` – CORS, listagem e criação com validações – `web-app/app/api/admin/companies/route.ts:16,32,92`
  - `PUT|DELETE /api/admin/companies/[companyId]` – atualização, soft/hard delete – `web-app/app/api/admin/companies/[companyId]/route.ts:31,159`
  - `GET /api/admin/companies-list` – lista empresas (preferência por `is_active`) – `web-app/app/api/admin/companies-list/route.ts:16`
  - `GET /api/admin/users-list` – filtro por `role`, `status`, `company_id` – `web-app/app/api/admin/users-list/route.ts:16`
  - `DELETE /api/admin/users/delete` – exclui usuário; limpa `driver_id` em `trips` – `web-app/app/api/admin/users/delete/route.ts:16`
  - `PUT /api/admin/users/[userId]` – atualiza perfil + email no Auth – `web-app/app/api/admin/users/[userId]/route.ts:18`
  - `GET /api/admin/drivers-list` – lista motoristas – `web-app/app/api/admin/drivers-list/route.ts:16`
  - `DELETE /api/admin/drivers/delete` – exclui motorista; limpa vínculos – `web-app/app/api/admin/drivers/delete/route.ts:16`
  - `OPTIONS|GET|POST /api/admin/vehicles` – CORS, listagem e criação com `zod` – `web-app/app/api/admin/vehicles/route.ts:19,29,55`
  - `GET /api/admin/vehicles-list` – lista veículos com empresa – `web-app/app/api/admin/vehicles-list/route.ts:16`
  - `PATCH|DELETE /api/admin/vehicles/[vehicleId]` – atualização parcial; exclusão/arquivamento – `web-app/app/api/admin/vehicles/[vehicleId]/route.ts:146,22`
  - `OPTIONS|POST|GET /api/admin/routes` – cria rota (auto `company_id` em dev/test); lista com paginação – `web-app/app/api/admin/routes/route.ts:17,32,190`
  - `DELETE /api/admin/routes/delete` – exclui rota com limpeza de dependências – `web-app/app/api/admin/routes/delete/route.ts:16`
  - `GET /api/admin/routes-list` – lista rotas com empresa – `web-app/app/api/admin/routes-list/route.ts:16`
  - `GET|POST /api/admin/trips` – filtros completos; criação com normalização de campos – `web-app/app/api/admin/trips/route.ts:32,116`
  - `PUT|DELETE /api/admin/trips/[tripId]` – atualiza/exclui viagem – `web-app/app/api/admin/trips/[tripId]/route.ts:31,153`
  - `GET /api/admin/kpis` – leitura de views com fallback – `web-app/app/api/admin/kpis/route.ts:16`
  - `GET /api/admin/costs-options` – listas de filtros (rotas, veículos, motoristas, carriers) – `web-app/app/api/admin/costs-options/route.ts:16`
  - `POST /api/admin/create-operador` – cria operador e mapeia empresa + auditoria – `web-app/app/api/admin/create-operador/route.ts:28`
  - `POST /api/admin/create-operador-login` – cria login e associa empresa – `web-app/app/api/admin/create-operador-login/route.ts:16`
  - `POST /api/admin/execute-sql-fix` – SQL de correção de `updated_at` – `web-app/app/api/admin/execute-sql-fix/route.ts:16`
  - `POST /api/admin/fix-database` – tenta executar fix via RPC – `web-app/app/api/admin/fix-database/route.ts:16`
  - `POST|GET /api/admin/seed-cost-categories` – seed/lista categorias de custos – `web-app/app/api/admin/seed-cost-categories/route.ts:42,109`
  - `POST /api/admin/optimize-route` – otimização via Google APIs com cache – `web-app/app/api/admin/optimize-route/route.ts:171`
  - `GET|PUT|DELETE /api/admin/alerts/*` – lista, atualiza, exclui alertas – `web-app/app/api/admin/alerts-list/route.ts:16`, `web-app/app/api/admin/alerts/[alertId]/route.ts:18`, `web-app/app/api/admin/alerts/delete/route.ts:16`
  - `GET|PUT|DELETE /api/admin/assistance-requests/*` – lista, atualiza, exclui ocorrências – `web-app/app/api/admin/assistance-requests-list/route.ts:16`, `web-app/app/api/admin/assistance-requests/[requestId]/route.ts:18`, `web-app/app/api/admin/assistance-requests/delete/route.ts:16`
- Auth
  - `GET /api/auth/csrf` – gera token CSRF e cookie – `web-app/app/api/auth/csrf/route.ts:8`
  - `POST /api/auth/login` – autentica via Supabase; valida CSRF; resolve role/empresa; seta cookie sessão – `web-app/app/api/auth/login/route.ts:24`
  - `GET /api/auth/seed-admin` – garante usuário admin – `web-app/app/api/auth/seed-admin/route.ts:12`
  - `POST /api/auth/set-session` – cookie de sessão do app (double-submit CSRF) – `web-app/app/api/auth/set-session/route.ts:11`
  - `POST /api/auth/clear-session` – limpa cookies de sessão – `web-app/app/api/auth/clear-session/route.ts:3`
- Costs
  - `GET|POST|DELETE /api/costs/budgets` – orçamentos com `zod` e RLS – `web-app/app/api/costs/budgets/route.ts:15,110,259`
  - `GET|POST /api/costs/manual` – custos manuais (normalização, validação) – `web-app/app/api/costs/manual/route.ts:280,27`
  - `GET /api/costs/kpis` – KPIs e complemento vs orçamento – `web-app/app/api/costs/kpis/route.ts:5`
  - `POST /api/costs/import` – import CSV com mapeamentos – `web-app/app/api/costs/import/route.ts:24`
  - `GET /api/costs/export` – export `csv/excel/pdf` com filtros e RLS – `web-app/app/api/costs/export/route.ts:6`
  - `POST /api/costs/reconcile` – conciliação e atualização de faturas – `web-app/app/api/costs/reconcile/route.ts:15`
  - `GET /api/costs/vs-budget` – realizado vs orçamento – `web-app/app/api/costs/vs-budget/route.ts:4`
- Reports
  - `OPTIONS|POST /api/reports/run` – gera e retorna relatórios (arquivos/JSON) – `web-app/app/api/reports/run/route.ts:20,60`
  - `GET|POST /api/reports/dispatch` – gera/manda email; registra histórico – `web-app/app/api/reports/dispatch/route.ts:300,153` (SMTP mock; TODO nodemailer)
  - `OPTIONS|GET|POST|DELETE /api/reports/schedule` – agenda, lista, remove – `web-app/app/api/reports/schedule/route.ts:19,35,370,403`
- operador
  - `POST /api/operador/associate-company` – mapeia operador a empresa – `web-app/app/api/operador/associate-company/route.ts:19`
  - `OPTIONS|POST /api/operador/create-employee` – cria usuário (Auth + `users`) – `web-app/app/api/operador/create-employee/route.ts:19,30`
  - `POST /api/operador/optimize-route` – otimização sequência de pontos – `web-app/app/api/operador/optimize-route/route.ts:28`
- Cron
  - `GET|POST /api/cron/dispatch-reports` – job de envio de relatórios (CRON_SECRET) – `web-app/app/api/cron/dispatch-reports/route.ts:331,335`
  - `GET /api/cron/refresh-kpis` – atualiza MVs de KPIs via RPC – `web-app/app/api/cron/refresh-kpis/route.ts:4`
  - `GET /api/cron/refresh-costs-mv` – atualiza MV de custos via RPC – `web-app/app/api/cron/refresh-costs-mv/route.ts:4`
- Analytics
  - `GET|OPTIONS|POST /api/analytics/web-vitals` – coleta Web Vitals; cria alerta se `poor` – `web-app/app/api/analytics/web-vitals/route.ts:11,23,34`
- Health
  - `GET /api/health` – health-check app + conexão Supabase – `web-app/app/api/health/route.ts:8`

#### Configuração e Middleware
- Middleware (proteção de rotas por role, cookies, redirects): `web-app/middleware.ts`
- Configuração Next: `web-app/next.config.js` (type-safety, lint, build options)
- Vercel cron jobs e env: `web-app/vercel.json`, `VERCEL_ENV_VARS.txt`

### Frontend / Apps
- Admin/operador/transportadora/passageiro pages: `web-app/app/*/*/page.tsx`, com dashboards, mapa, custos, alertas, relatórios.
- Componentes de UI: `web-app/components/ui/*` (botões, inputs, cards, etc.), `admin-map/*` (camadas, painéis, renderização). Validação e desenho robusto de polylines/coordenadas: `web-app/components/admin-map/layers.tsx:85-111`.
- Hooks e serviços: `web-app/lib/*` (auth, logger, realtime, map-utils, costs, exports, route optimization, supabase client/service-role).

### Banco / Dados
- Migrations (admin/custos/mapas/views/RLS): `database/migrations/*`
- Seeds: `database/seeds/*` (demo: empresa, veículo, rota, viagens, posições)
- RPCs: `v41_rpc_routes.sql` (gerar stops, otimização), `gf_notifications_boarding.sql` (validate boarding token, notificações)
- Views: `v43_admin_views.sql`, `v44_costs_views.sql`, `v44_map_views.sql`, `gf_views.sql`
- RLS: `v43_admin_rls.sql`, `v44_costs_rls.sql`, `gf_operator_rls.sql`

### Infra / DevOps
- CI/CD: `.github/workflows/ci.yml`, `deploy.yml` (lint/build/deploy), Vercel scripts (`web-app/scripts/*`), Dockerfile.dev.
- Scripts de validação: `web-app/scripts/validate-complete.js`, `test-*`, `health-check-*`, `run-all-tests.js`.
- Scripts Supabase: `database/scripts/*` (check policies/tables/schema; run migrations).

### Outros
- Jobs agendados: `vercel.json` (refresh KPIs/custos, dispatch reports).
- Utilitários internos: `tools/db/*` (auditoria RLS, schema); `tools/pgapply/*` (aplicar migrations programaticamente).

## O que NÃO foi criado e deveria existir (Lacunas)
- Push notifications (FCM/OneSignal) para chegada do ônibus e eventos
  - Por que faz falta: requisito de UX do passageiro, comunicação proativa.
  - Solução: integrar `flutter_local_notifications` com FCM, registrar `device_token` por usuário, serviço server-side para envio por evento/cron.
- Check-in via token NFC/QR padronizado no app do motorista (usar RPC)
  - Por que faz falta: hoje há inserção direta em `trip_passengers`; RPC garante validade, expiração e auditoria.
  - Solução: app chamar `rpc_validate_boarding` (`gf_notifications_boarding.sql:63-139`), ler token NFC/QR, registrar `gf_boarding_events`.
- Confirmação manual de embarque/desembarque pelo passageiro
  - Por que faz falta: escopo funcional prevê; melhora acurácia de presença.
  - Solução: telas e endpoints para “confirm check-in/out”, com RLS por `passenger_id`.
- Avaliação pós-viagem (rating) pelo passageiro
  - Por que faz falta: qualidade/feedback; presente no escopo.
  - Solução: tabela `trip_ratings`, UI `tripRating` (rota já prevista), endpoints de submissão/leitura.
- Rate limiting transversal nas APIs
  - Por que faz falta: prevenir abuso (import/export, reports), custos, estabilidade.
  - Solução: limiter por IP/rota com `@upstash/ratelimit` ou camada edge.
- Observabilidade central (Sentry/APM)
  - Por que faz falta: rastreamento de erros com contexto, performance, release health.
  - Solução: `@sentry/nextjs` + Sentry Flutter, sourcemaps, DSN de staging/produção.
- Documentação formal da API (OpenAPI/Swagger)
  - Por que faz falta: onboarding, validação, integração de terceiros.
  - Solução: gerar OpenAPI a partir dos handlers + exemplos, publicar em `docs/api`.
- Validação E2E com autenticação real
  - Por que faz falta: testes assumem login; aumenta confiança.
  - Solução: fixture de login via `/api/auth/set-session` com CSRF, cookies httpOnly.

## Problemas e pontos errados
- [Alta] `web-app/app/api/auth/set-session/route.ts:50` – cookie `golffox-session` não `httpOnly`; contém `accessToken` em base64.
  - Risco: segurança/XSS, exfiltração de token.
  - Correção: `httpOnly: true`, payload mínimo (id), armazenamento server-side; migrar para `@supabase/ssr`.
- [Média] SMTP não implementado (mock)
  - `web-app/app/api/reports/dispatch/route.ts:145` – TODO nodemailer.
  - Risco: envio falha sem Resend; confiabilidade.
  - Correção: implementar `nodemailer` com TLS/attachments.
- [Média] Inconsistência sobre migration v49 aplicada
  - `STATUS_FINAL_CORRECOES.md:85-99` (pendente) vs `RESUMO_FINAL_AUDITORIA.md:75-79` (aplicada).
  - Risco: RLS `gf_user_company_map` pode não estar ativo.
  - Correção: verificar no Supabase e aplicar `v49_protect_user_company_map.sql` se ausente.
- [Média] Export/relatórios com `.select('*')` sem paginação rigorosa
  - `web-app/app/api/reports/run/route.ts:157-171` – potencial consumo pesado.
  - Risco: performance, timeout.
  - Correção: streaming CSV, paginação, filtros obrigatórios.
- [Baixa] Documentação duplicada/fragmentada
  - `web-app/` múltiplos `RESUMO_*`, `RELATORIO_*` e `DEPLOY_*` com redundância.
  - Risco: manutenção, confusão.
  - Correção: consolidar docs em uma fonte canônica.

## O que está funcionando bem (Pontos Fortes)
- Logger central com redaction e níveis por ambiente – `web-app/lib/logger.ts:23-47,96-112`.
- Realtime robusto com fallback e sanitização de dados – `web-app/lib/realtime-service.ts:136-205,364-399`.
- Validações com `zod` e normalizações de campos nas APIs de custos – `web-app/app/api/costs/budgets/route.ts:110`, `web-app/app/api/costs/manual/route.ts:27`.
- Checklist e tracking offline no app do motorista – `lib/driver_app/screens/driver_checklist_screen.dart:45-56`, `lib/services/tracking_service.dart:304-360,375-401`.
- RPC de transição de viagem com controle de concorrência e auditoria – `lib/services/supabase_service.dart:605-640`; migrações documentadas.
- Validação CSRF nas rotas de sessão – `web-app/app/api/auth/set-session/route.ts:14-18`.

## O que precisa melhorar (Refino e Otimização)
- Organização/Docs (Média)
  - Consolidar documentação (API, arquitetura, deployment) em `docs/` com índices claros.
- Segurança (Alta)
  - Cookies de sessão httpOnly; reduzir superfície de dados em cliente.
- Observabilidade (Média)
  - Integrar Sentry/APM; padronizar captura em handlers e cliente.
- Performance (Média)
  - Streaming/export, paginação consistente, cache `react-query`/SWR em listas pesadas.
- Testes (Média)
  - Fixtures de login E2E; CI com gates de lint/typecheck/test.

## Plano de Ação Prioritário
- Curto prazo (0–7 dias)
  - Tornar `golffox-session` httpOnly e mínimo (id/role) – `web-app/app/api/auth/set-session/route.ts`.
  - Implementar `nodemailer` em `reports/dispatch` para fallback SMTP.
  - Verificar/aplicar `v49` (RLS `gf_user_company_map`).
  - Adicionar rate-limiter nas rotas sensíveis.
- Médio prazo (8–30 dias)
  - Integrar FCM (push) com `device_tokens` e jobs de ETA.
  - Padronizar check-in do motorista via `rpc_validate_boarding`.
  - OpenAPI/Swagger das APIs; publicar em `docs/api`.
  - Consolidar documentação e criar “Architecture Overview”.
- Longo prazo (30+ dias)
  - Completar App Passageiro (confirm check-in/out, ratings).
  - Painéis transportadora/operador com indicadores ampliados.
  - Sentry/APM completo (web+mobile); dashboards operacionais.

---

# Inventário COMPLETO de Endpoints da API (web-app/app/api)

## Módulos
- Admin
  - `GET /api/admin/audit-db` – Auditoria estática do stack – `web-app/app/api/admin/audit-db/route.ts:3`
  - `GET /api/admin/audit-log` – Listar `gf_audit_log` – `web-app/app/api/admin/audit-log/route.ts:16`
  - `OPTIONS|GET|POST /api/admin/companies` – Gerir empresas – `web-app/app/api/admin/companies/route.ts:16,32,92`
  - `PUT|DELETE /api/admin/companies/[companyId]` – Atualizar/Excluir – `web-app/app/api/admin/companies/[companyId]/route.ts:31,159`
  - `GET /api/admin/companies-list` – Listar empresas – `web-app/app/api/admin/companies-list/route.ts:16`
  - `GET /api/admin/users-list` – Listar usuários – `web-app/app/api/admin/users-list/route.ts:16`
  - `DELETE /api/admin/users/delete` – Excluir usuário – `web-app/app/api/admin/users/delete/route.ts:16`
  - `PUT /api/admin/users/[userId]` – Atualizar usuário – `web-app/app/api/admin/users/[userId]/route.ts:18`
  - `GET /api/admin/drivers-list` – Listar motoristas – `web-app/app/api/admin/drivers-list/route.ts:16`
  - `DELETE /api/admin/drivers/delete` – Excluir motorista – `web-app/app/api/admin/drivers/delete/route.ts:16`
  - `OPTIONS|GET|POST /api/admin/vehicles` – Gerir veículos – `web-app/app/api/admin/vehicles/route.ts:19,29,55`
  - `GET /api/admin/vehicles-list` – Listar veículos – `web-app/app/api/admin/vehicles-list/route.ts:16`
  - `PATCH|DELETE /api/admin/vehicles/[vehicleId]` – Atualizar/Excluir – `web-app/app/api/admin/vehicles/[vehicleId]/route.ts:146,22`
  - `OPTIONS|POST|GET /api/admin/routes` – Gerir rotas – `web-app/app/api/admin/routes/route.ts:17,32,190`
  - `DELETE /api/admin/routes/delete` – Excluir rota – `web-app/app/api/admin/routes/delete/route.ts:16`
  - `GET /api/admin/routes-list` – Listar rotas – `web-app/app/api/admin/routes-list/route.ts:16`
  - `GET|POST /api/admin/trips` – Listar/Cria viagens – `web-app/app/api/admin/trips/route.ts:32,116`
  - `PUT|DELETE /api/admin/trips/[tripId]` – Atualizar/Excluir viagem – `web-app/app/api/admin/trips/[tripId]/route.ts:31,153`
  - `GET /api/admin/kpis` – KPIs com fallback de views – `web-app/app/api/admin/kpis/route.ts:16`
  - `GET /api/admin/costs-options` – Opções de filtros custos – `web-app/app/api/admin/costs-options/route.ts:16`
  - `POST /api/admin/create-operador` – Criar operador – `web-app/app/api/admin/create-operador/route.ts:28`
  - `POST /api/admin/create-operador-login` – Criar login operador – `web-app/app/api/admin/create-operador-login/route.ts:16`
  - `POST /api/admin/execute-sql-fix` – SQL fix – `web-app/app/api/admin/execute-sql-fix/route.ts:16`
  - `POST /api/admin/fix-database` – Fix via RPC – `web-app/app/api/admin/fix-database/route.ts:16`
  - `POST|GET /api/admin/seed-cost-categories` – Seed/lista categorias – `web-app/app/api/admin/seed-cost-categories/route.ts:42,109`
  - `POST /api/admin/optimize-route` – Otimização – `web-app/app/api/admin/optimize-route/route.ts:171`
  - `GET|PUT|DELETE /api/admin/alerts/*` – Alertas – `web-app/app/api/admin/alerts-list/route.ts:16`, `web-app/app/api/admin/alerts/[alertId]/route.ts:18`, `web-app/app/api/admin/alerts/delete/route.ts:16`
  - `GET|PUT|DELETE /api/admin/assistance-requests/*` – Ocorrências – `web-app/app/api/admin/assistance-requests-list/route.ts:16`, `web-app/app/api/admin/assistance-requests/[requestId]/route.ts:18`, `web-app/app/api/admin/assistance-requests/delete/route.ts:16`
- Auth
  - `GET /api/auth/csrf` – CSRF token – `web-app/app/api/auth/csrf/route.ts:8`
  - `POST /api/auth/login` – Login + sessão – `web-app/app/api/auth/login/route.ts:24`
  - `GET /api/auth/seed-admin` – Seed admin – `web-app/app/api/auth/seed-admin/route.ts:12`
  - `POST /api/auth/set-session` – Seta cookie sessão – `web-app/app/api/auth/set-session/route.ts:11`
  - `POST /api/auth/clear-session` – Limpa cookies – `web-app/app/api/auth/clear-session/route.ts:3`
- Costs
  - `GET|POST|DELETE /api/costs/budgets` – Orçamentos – `web-app/app/api/costs/budgets/route.ts:15,110,259`
  - `GET|POST /api/costs/manual` – Custos manuais – `web-app/app/api/costs/manual/route.ts:280,27`
  - `GET /api/costs/kpis` – KPIs custos – `web-app/app/api/costs/kpis/route.ts:5`
  - `POST /api/costs/import` – Import CSV custos – `web-app/app/api/costs/import/route.ts:24`
  - `GET /api/costs/export` – Export custos – `web-app/app/api/costs/export/route.ts:6`
  - `POST /api/costs/reconcile` – Conciliação – `web-app/app/api/costs/reconcile/route.ts:15`
  - `GET /api/costs/vs-budget` – Vs orçamento – `web-app/app/api/costs/vs-budget/route.ts:4`
- Reports
  - `OPTIONS|POST /api/reports/run` – Gerar relatórios – `web-app/app/api/reports/run/route.ts:20,60`
  - `GET|POST /api/reports/dispatch` – Dispatch relatórios – `web-app/app/api/reports/dispatch/route.ts:300,153`
  - `OPTIONS|GET|POST|DELETE /api/reports/schedule` – Agendamentos – `web-app/app/api/reports/schedule/route.ts:19,35,370,403`
- operador
  - `POST /api/operador/associate-company` – Associar operador – `web-app/app/api/operador/associate-company/route.ts:19`
  - `OPTIONS|POST /api/operador/create-employee` – Criar usuário – `web-app/app/api/operador/create-employee/route.ts:19,30`
  - `POST /api/operador/optimize-route` – Otimizar rota – `web-app/app/api/operador/optimize-route/route.ts:28`
- Cron
  - `GET|POST /api/cron/dispatch-reports` – Enviar relatórios – `web-app/app/api/cron/dispatch-reports/route.ts:331,335`
  - `GET /api/cron/refresh-kpis` – Atualizar KPIs – `web-app/app/api/cron/refresh-kpis/route.ts:4`
  - `GET /api/cron/refresh-costs-mv` – Atualizar MV custos – `web-app/app/api/cron/refresh-costs-mv/route.ts:4`
- Analytics
  - `GET|OPTIONS|POST /api/analytics/web-vitals` – Web Vitals – `web-app/app/api/analytics/web-vitals/route.ts:11,23,34`
- Health
  - `GET /api/health` – Health-check – `web-app/app/api/health/route.ts:8`

### Middleware e Configuração
- `web-app/middleware.ts` – protege `/admin` e `/operador`, valida roles, cookies e redirects.
- `web-app/next.config.js` – habilita type-safety; lint no build.
- `web-app/vercel.json` – jobs cron configurados (refresh KPIs/custos; dispatch reports).

---

> Fim da Auditoria Técnica Completa. 

---

## Checklist Rápido Pós-Migração (2025-11-16)

- [x] `docs/ARQUITETURA_ATUAL.md` atualizado e vinculado pela auditoria
- [x] `docs/GUIA_MIGRACAO.md` criado com passos e verificação
- [x] Estrutura de pastas refletida na documentação
- [x] Scripts de validação de migração referenciados em `docs/migrations/*`
- [ ] PR aberto para `main` com descrição e checklist desta atualização
