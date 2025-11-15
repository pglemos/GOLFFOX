## Objetivo
Organizar, padronizar e limpar o repositório GOLFFOX aplicando integralmente as recomendações da auditoria, mantendo o sistema funcional e pronto para evolução.

## Leitura e Síntese da Auditoria
- Núcleo que permanece:
  - Monorepo com `web-app/` (Next.js 15), `lib/` (Flutter), `database/` (SQL Supabase), `docs/` e `.github/`.
  - Logger central e redaction (`web-app/lib/logger.ts:1-163`), realtime robusto (`web-app/lib/realtime-service.ts`), validações `zod` em custos.
  - Middleware de proteção de rotas (`web-app/middleware.ts`) e configuração CSP/headers (`web-app/next.config.js:13-48`).
- Melhorias obrigatórias:
  - Sessão mínima e segura (remover `accessToken` do cookie; manter apenas `id`/`role`) em `web-app/app/api/auth/set-session/route.ts:46-54`.
  - Rate limiting transversal em endpoints sensíveis (costs, reports, auth).
  - Consolidar documentação em `docs/` (eliminar duplicatas dispersas em raiz e `web-app/`).
  - Implementar SMTP real no dispatch de relatórios.
  - Verificar/aplicar v49 e RLS de `gf_user_company_map`.
- Remoções/arquivamentos:
  - Duplicatas de documentação e arquivos de instrução de migração já obsoletos.
  - Pastas/arquivos experimentais/POCs não usados (ex.: `testsprite_tests/`, `_dashboard_orig.dart`, `archive/golffox_flutter_ui`).
  - Estruturas duplicadas de Next em raiz (`app/operator/`) que conflitam com `web-app/`.

## Estrutura Alvo (Monorepo Padronizado)
- `apps/`
  - `web/` → conteúdo atual de `web-app/` (Next.js 15: app, components, lib, hooks, scripts, tests, configs)
  - `mobile/` → conteúdo atual de `lib/`, `android/`, `ios/`, `web/` (Flutter)
- `backend/` (planejado)
  - Serviços e workers independentes quando necessário (mantém APIs no `apps/web/app/api` por ora)
- `shared/`
  - Código compartilhado TS/JS existente (`shared/*`), DTOs, validações e utilitários cross-app
- `database/`
  - Migrations, seeds, scripts Supabase; relatórios SQL
- `infra/`
  - `.github/` (CI/CD), `tools/` (auditoria/pgapply), `scripts/` (setup/deploy), `docker-compose.yml`
- `docs/`
  - Canonical: arquitetura, APIs, deployment, guias e auditoria atualizada
- `archive/`
  - `LEGADO_NAO_USAR/` para quarentena antes da exclusão definitiva

Árvore resumida:
```
GOLFFOX/
  apps/
    web/ (de: web-app/)
    mobile/ (de: lib/, android/, ios/, web/)
  shared/
  database/
  infra/
    .github/
    tools/
    scripts/
  docs/
  archive/
```

## Limpeza (Safe Delete/Archive)
- Remover ou mover para `archive/LEGADO_NAO_USAR/`:
  - `testsprite_tests/`, `_dashboard_orig.dart`, `archive/golffox_flutter_ui/*`.
  - Documentos redundantes em raiz e `web-app/` (ex.: `RESUMO_*`, `RELATORIO_*`, `DEPLOY_*`, múltiplos `README_*`). Manter versões canônicas em `docs/`.
  - Estrutura duplicada de Next em raiz: `app/operator/page.tsx`.
  - Arquivos de setup que duplicam o conteúdo de `docs/deployment/`.
- Consolidar configs:
  - Garantir que apenas `apps/web/` contenha `package.json`, `next.config.js`, `tailwind.config.js`, `tsconfig.json`, `vercel.json`. O `package.json` da raiz será usado apenas para tooling cross-repo (se necessário) ou removido.

## Organização e Movimentação
- Migrar `web-app/` → `apps/web/` e ajustar aliases:
  - Atualizar `@` para `apps/web`, `@shared` para `../../shared` nas configs de bundling.
  - Corrigir imports relativos em componentes, hooks e rotas API.
- Migrar Flutter:
  - `lib/` → `apps/mobile/` e relacionar `android/`, `ios/`, `web/` sob `apps/mobile/` mantendo compatibilidade com `pubspec.yaml`.
- Infraestrutura:
  - Mover `tools/` e `scripts/` para `infra/` mantendo paths usados em automações.
  - Manter `.github/` dentro de `infra/` (atalho simbólico opcional) ou no topo conforme preferência do pipeline.
- Shared libs:
  - Manter `shared/` como pacote leve (barrel `index.ts` por módulo) e reforçar o uso de `@shared/*` no `apps/web`.

## Padronização de Código e Arquitetura
- Camadas e convenções:
  - `apps/web/app/api/*` por contexto (admin, operator, costs, reports, auth, cron, analytics, health) – manter.
  - Introduzir padrões: `services/`, `repositories/`, `usecases/` na lib do web onde aplica.
  - Componentes: PascalCase, arquivos `index.tsx` com export central, co-location de testes (`__tests__` próximos).
- Sessão/Segurança:
  - Refatorar cookie em `web-app/app/api/auth/set-session/route.ts:46-54` para payload mínimo (sem `accessToken`) e transicionar para sessão server-side (`supabase-server.ts` / `@supabase/ssr`).
  - Habilitar `sameSite=lax` para compatibilidade e manter `httpOnly`/`secure`.
- Rate limiting:
  - Aplicar limiter comum (`web-app/lib/rate-limit.ts`) em `costs/*`, `reports/*`, `auth/*` e endpoints de export/import.
- Observabilidade:
  - Padronizar captura de erro via wrapper em handlers (try/catch + `logger.error`) e integração Sentry (`sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`).
- API Responses:
  - Padronizar esquema `{ ok, data, error, meta }` e validações `zod`.
- Tipos/DTOs:
  - Centralizar em `shared/types` e `shared/validation`; reforçar uso com `@shared` alias.

## Git e GitHub
- Branch: `refactor/repositorio-organizado` (já referenciada na auditoria; confirmar existência e reusar).
- Commits granulares:
  - `chore(cleanup): remover módulos legados`
  - `refactor(structure): mover web-app → apps/web`
  - `feat(shared): criar pacote de tipos/DTOs`
  - `fix(auth): sessão httpOnly mínima`
  - `perf(reports): streaming + paginação consistente`
- PR alvo: `main` com checklist de validação (build, testes, lint, e2e mínimos).

## Documentação Final
- Atualizar `docs/AUDITORIA_COMPLETA.md` com o resumo das ações implementadas.
- Criar/atualizar:
  - `docs/ARQUITETURA_ATUAL.md` – nova árvore, módulos e responsabilidades.
  - `docs/GUIA_MIGRACAO_REPERTORIO.md` – mapeamento do que saiu/onde foi parar, como trabalhar daqui em diante.
  - `docs/api/openapi.json` – garantir geração e publicação; endpoint `/api/docs/openapi` já existe.
  - Índices em `docs/` e limpeza de redundâncias.

## Validação
- Web:
  - Rodar build/tests (`apps/web`: Jest/Vitest) e smoke de rotas críticas.
  - Validar middleware e auth (login flow) e cookies.
- Mobile:
  - Build `apps/mobile` (Flutter), smoke de login/tracking.
- Banco:
  - Scripts de verificação de RLS/policies e seeds.

## Sequência de Execução (Fases)
1. Preparação (branch, checklist, backup de docs) – sem mudanças funcionais.
2. Limpeza dirigida (arquivar/remover duplicatas e POCs).
3. Movimentação estrutural (apps/, infra/, shared/) com ajustes de imports/aliases.
4. Padronização de sessão e rate limiting.
5. Observabilidade e respostas padronizadas.
6. Documentação e PR com validação completa.

## Itens Críticos com Referências
- Sessão insegura/verbosa – ajustar cookie e payload: `web-app/app/api/auth/set-session/route.ts:46-54`.
- SMTP mock – implementar `nodemailer`: `web-app/app/api/reports/dispatch/route.ts`.
- Export sem paginação rigorosa – revisar: `web-app/app/api/reports/run/route.ts:157-171`.
- Duplicatas de documentação – consolidar em `docs/`.

Confirma prosseguir com este plano para executar a refatoração e organização completa?