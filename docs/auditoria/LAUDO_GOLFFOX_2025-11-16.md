## Resumo Executivo

- **Escopo auditado**: `F:\GOLFFOX` (web Next.js, mobile Flutter), banco (migrations/DDL/RLS), infra (Vercel, Docker), observabilidade e segurança, documentação.
- **Principais achados (ação imediata)**:
  - **Padronizar Service Role**: usar apenas `SUPABASE_SERVICE_ROLE_KEY` (com fallback controlado), unificando os clientes server-side.
  - **Rate limiting**: configurar Upstash em prod/preview e evitar fail-open (responder 429 em produção quando indisponível).
  - **Crons Vercel**: garantir `CRON_SECRET` definido e crons ativos (refresh-kpis, refresh-costs-mv, dispatch-reports).
  - **OpenAPI 100%**: completar especificação para todos os domínios (`admin/operador/costs/cron/docs`) e validar em CI.
  - **CSP duplicado**: centralizar os headers de segurança (manter em Next ou Vercel, não nos dois).
  - **RBAC por rota**: garantir `requireAuth`/`requireCompanyAccess` em todos endpoints sensíveis; criar verificação automatizada.
  - **Storage**: revisar buckets (ex.: fotos de veículos) e usar URLs assinadas se necessário.

- **Pontos fortes**: RLS abrangente multi-tenant, materialized views de custos e função de refresh, Sentry integrado (server/edge/client), API bem modularizada por domínios, app mobile com arquitetura moderna (Riverpod/GoRouter/Supabase/Sentry).

- **Plano de ação**: curto (0–7), médio (8–30) e longo (30+ dias) ao fim do documento.


## Laudo Técnico Completo

### 1) Visão Geral do Sistema
- **Tecnologias**:
  - Web: Next.js 15 (App Router), React 18, Zod, Radix UI, Tailwind, Sentry, Upstash Ratelimit, Supabase JS.
  - Mobile: Flutter 3.24+, Riverpod, GoRouter, Supabase Flutter, Sentry.
  - Banco: Postgres (Supabase) com RLS extensivo, materialized views e RPCs.
  - Infra: Vercel (build/headers/crons), Docker Compose local (stack Supabase + Redis), scripts Node/PS/SQL.
- **Arquitetura**: monorepo com `apps/web` (Next.js) e `apps/mobile` (Flutter), `database` (migrations/scripts), `infra` (docker), `docs` (arquitetura, OpenAPI parcial, checklists). API em `apps/web/app/api/**` segmentada por domínios.
- **Propósito/escopo**: SaaS de fretamento corporativo — planejamento/execução de rotas, check-in/out, rastreamento, gestão de frota/custos/manutenção, incidentes/qualidade, relatórios/KPIs, com perfis admin/operador/transportadora/motorista/passageiro.


### 2) Inventário do que já existe (Repertório Atual)
- **Backend/API (Next.js – apps/web/app/api/**)**:
  - auth: csrf, login, set-session, clear-session, seed-admin
  - admin: vehicles, users, companies, routes, trips, drivers, alerts, assistance-requests, listas, kpis, optimize-route, generate-stops, fix-database, execute-sql-fix, seed-cost-categories, audit-log, audit-db
  - operador: associate-company, create-employee, optimize-route
  - costs: budgets, categories, export, import, kpis, manual, reconcile, vs-budget
  - reports: run, dispatch, schedule
  - analytics: web-vitals
  - cron: refresh-kpis, refresh-costs-mv, dispatch-reports
  - health: health
  - docs: openapi

- **Frontend Web (Next.js – apps/web/app)**: áreas `admin`, `operador`, `transportadora`, `passageiro`, páginas de teste e error boundaries; middleware protege UI (bypass `/api`).

- **Mobile (Flutter – apps/mobile/lib)**: bootstrap, providers, roteamento, serviços, telas por domínio (motorista/operador/passageiro), Sentry e testes.

- **Banco/Dados**:
  - Migrations v41–v49 e v74 (RLS, matviews KPIs/custos, funções, LGPD/PII).
  - RLS custos/operador; matview `mv_costs_monthly` e função `refresh_mv_costs_monthly()`.

- **Infra/DevOps**:
  - `vercel.json` com crons (refresh-kpis, refresh-costs-mv, dispatch-reports) e headers (CSP/HSTS/XFO/RP).
  - `infra/docker-compose.yml` com Supabase stack local + Redis + Next dev.
  - CI/CD versionado: não encontrado (workflows ausentes no repo).


### 3) Lacunas (com justificativa e solução)
- **OpenAPI incompleto**: documentação parcial (não cobre `admin`, `operador`, `cron`, grande parte de `costs`).  
  - Impacto: integração/contrato instável, dificulta testes e comunicação.  
  - Ação: completar spec e validar em CI; publicar `/api/docs`.

- **Rate limiting fail-open (Upstash)**: em erro/ausência, requisições passam.  
  - Impacto: risco de abuso/DoS.  
  - Ação: configurar `UPSTASH_REDIS_REST_URL/TOKEN`; em produção, retornar 429 no catch e logar Sentry.

- **Service Role env divergente**: dois helpers com requisitos diferentes.  
  - Impacto: erros de configuração entre ambientes.  
  - Ação: padronizar `SUPABASE_SERVICE_ROLE_KEY` (fallback controlado) e unificar cliente server-side.

- **Proteção de rotas**: middleware não cobre `/api` (intencional), requer `requireAuth` em endpoints sensíveis.  
  - Impacto: risco de endpoint sem RBAC por engano.  
  - Ação: verificação automatizada (lint/test) exigindo `requireAuth`/`requireCompanyAccess` em `admin/*` e `operador/*`.

- **CSP duplicada (Next e Vercel)**: headers em dois lugares.  
  - Impacto: manutenção e possíveis conflitos.  
  - Ação: centralizar (manter em `next.config.js` ou `vercel.json`), remover duplicidade.

- **Storage policies**: revisar buckets (fotos de veículos) e privacidade.  
  - Impacto: LGPD/privacidade.  
  - Ação: tornar privado e usar URLs assinadas quando aplicável.

- **CI/CD**: pipelines ausentes no repo.  
  - Impacto: falta de garantia de qualidade em PR/deploy.  
  - Ação: adicionar workflows (lint, type-check, test, build, OpenAPI validation, migrations dry-run).


### 4) Problemas e pontos errados (gravidade, caminho, descrição, risco, sugestão)
- **Alta** — `apps/web/lib/rate-limit.ts`: fail-open em erro do Redis → retorna null.  
  - Risco: segurança/disponibilidade.  
  - Correção: em produção, responder 429 e reportar Sentry.

- **Média** — Service Role divergente: `supabase-server.ts` aceita `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE`; `supabase-service-role.ts` exige `SUPABASE_SERVICE_ROLE_KEY`.  
  - Risco: misconfig entre ambientes.  
  - Correção: padronizar para `SUPABASE_SERVICE_ROLE_KEY` e unificar helper.

- **Média** — `docs/api/openapi.json` parcial.  
  - Risco: integração, testes de contrato.  
  - Correção: completar rotas `admin/operador/costs/cron/docs` e validar em CI.

- **Baixa** — CSP duplicado (`vercel.json` e `next.config.js`).  
  - Risco: manutenção/conflitos.  
  - Correção: centralizar em um local.

- **Baixa** — Middleware não cobre `/api` (design), mas exige disciplina no RBAC.  
  - Risco: endpoint sem `requireAuth`.  
  - Correção: verificação automatizada por diretórios sensíveis.


### 5) Pontos Fortes (com caminhos e justificativas)
- **RLS abrangente e coerente**: políticas por empresa/role em custos e operador; reduz vazamento de dados multi-tenant.
- **Materialized views e função de refresh**: suporte eficiente a KPIs/relatórios; cron dedicado.
- **Sentry**: integrado no server/edge/client com instrumentation; base para tracing e alertas.
- **API modular por domínios**: clareza operacional e escalabilidade (auth/admin/operador/costs/reports/cron/analytics/health/docs).
- **Mobile moderno**: Riverpod, GoRouter, serviços e Sentry; base sólida para apps de campo.


### 6) Melhorias (priorização e como melhorar)
- **Alta**: Upstash configurado e fail-open desativado em produção; SLO de disponibilidade de API.
- **Alta**: OpenAPI completo + validação CI; publicar docs versionadas.
- **Média**: Padronizar variável de Service Role e unificar helper Supabase server-side.
- **Média**: Guardas de RBAC em 100% das rotas sensíveis + teste/lint de verificação.
- **Baixa**: Unificação de CSP; remoção de duplicidade.
- **Baixa**: Pipeline CI com estágios mínimos (lint, types, tests, build, spec, migrations dry-run).


### 7) Plano de Ação Prioritário
- **Curto prazo (0–7 dias)**:
  - Padronizar Service Role (`SUPABASE_SERVICE_ROLE_KEY`) e unificar cliente server-side.
  - Configurar `UPSTASH_REDIS_REST_URL/TOKEN`; em prod, retornar 429 em falha de rate limit.
  - Definir `CRON_SECRET` e validar os 3 crons no Vercel.
  - Centralizar CSP (Next ou Vercel) e remover duplicidade.
  - Garantir cookie `golffox-session` com `secure` em prod; revisar SameSite/Secure em ambientes.

- **Médio prazo (8–30 dias)**:
  - Completar OpenAPI (100%) e automatizar publicação/validação.
  - Adicionar CI (lint, type-check, test, build, OpenAPI validation, migrations dry-run).
  - Testes de autorização multi-empresa (admin/operador/transportadora/passageiro) cobrindo endpoints críticos.
  - Policies de Storage e URLs assinadas para assets sensíveis.

- **Longo prazo (30+ dias)**:
  - Tracing server-side por rota e métricas de cron/refresh; dashboards de observabilidade.
  - Hardening adicional de RLS (tabelas auxiliares, exceções, auditoria).
  - Runbooks operacionais (falhas de cron/refresh MV, reprocessamento, incidentes).


### Evidências (referências de código)

Proteção de UI (bypass `/api`):

```1:17:F:\GOLFFOX\apps\web\middleware.ts
if (pathname.startsWith('/api')) {
  return NextResponse.next()
}
```

Sessão via cookie com role/companyId:

```186:219:F:\GOLFFOX\apps\web\app\api\auth\login\route.ts
const cookieValue = Buffer.from(JSON.stringify(userPayload)).toString('base64')
response.cookies.set('golffox-session', cookieValue, {
  httpOnly: true,
  maxAge: 60 * 60 * 24,
  sameSite: 'lax',
  secure: isSecureRequest(req),
  path: '/',
})
```

RLS custos (multi-tenant):

```31:45:F:\GOLFFOX\database\migrations\v44_costs_rls.sql
CREATE POLICY operator_select_costs ON public.gf_costs
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.gf_user_company_map
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );
```

Matview e função refresh (cron):

```71:79:F:\GOLFFOX\database\migrations\v44_costs_matviews.sql
CREATE OR REPLACE FUNCTION public.refresh_mv_costs_monthly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_costs_monthly;
END;
$$;
```

Crons definidos no Vercel:

```7:15:F:\GOLFFOX\vercel.json
{
  "path": "/api/cron/refresh-costs-mv",
  "schedule": "0 2 * * *"
}
```

Validação de `CRON_SECRET`:

```8:17:F:\GOLFFOX\apps\web\app\api\cron\refresh-costs-mv\route.ts
const cronSecret = process.env.CRON_SECRET
if (authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Sentry configurado (server):

```1:8:F:\GOLFFOX\apps\web\sentry.server.config.ts
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2'),
  })
}
```


## Plano de Ação (síntese executiva)
- Padronizar Service Role e unificar cliente Supabase (imediato).
- Ativar Upstash e retornar 429 em falhas de rate limit (imediato).
- Confirmar `CRON_SECRET` e crons ativos (imediato).
- Completar OpenAPI e validar em CI (em 2 semanas).
- Centralizar CSP (em 1 semana).
- Adicionar CI completo (até 30 dias).
- Testes de RBAC por empresa (até 30 dias).
- Revisar Storage (privacidade) e URLs assinadas (até 30 dias).


