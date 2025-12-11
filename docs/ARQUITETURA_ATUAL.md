# Arquitetura Atual – GolfFox

## Visão Geral
- Monorepo com módulos principais: web (Next.js 16.0.7), mobile (React Native Expo 54), banco (Supabase/Postgres), scripts/infra e documentação.
- Separação por camadas: domínio, aplicação, infra e apresentação.

### Resumo Executivo
- Fonte de verdade do frontend e API: `apps/web`
- Fonte de verdade do mobile: `apps/mobile`
- Código compartilhado cross-plataforma: `shared/*`
- Banco versionado com RLS: `database/*`
- Automação/DevOps: `infra/*`
- Documentação canônica: `docs/*`

## Estrutura de Pastas Alvo
```
GOLFFOX/
├── apps/
│   ├── web/
│   │   ├── app/                 # App Router e API routes
│   │   ├── components/          # UI base e domínios
│   │   ├── lib/                 # cliente supabase, auth, logger
│   │   ├── server/              # serviços, repositórios, casos de uso
│   │   ├── middleware.ts
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   └── vercel.json
│    └── mobile/
        ├── app/                  # Expo Router (file-based routing)
        ├── src/                  # Código-fonte (auth, services, components)
        ├── assets/               # Ícones e imagens
        └── app.config.ts         # Configuração Expo
├── shared/
│   ├── domain/                  # entidades/DTOs
│   ├── types/                   # tipos TS/JSON schemas
│   ├── utils/                   # utilidades puras
│   └── validation/              # esquemas Zod
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── scripts/
├── infra/
│   ├── ci/                       # GitHub Actions (em .github/workflows)
│   ├── docker/
│   ├── scripts/                  # scripts de setup/deploy/dev
│   └── tools/
├── docs/
│   ├── AUDITORIA_COMPLETA.md
│   ├── ARQUITETURA_ATUAL.md
│   └── GUIA_MIGRACAO_REPERTORIO.md
└── archive/
    └── LEGADO_NAO_USAR/
```

## Convenções
- Pastas/arquivos: `kebab-case`.
- Componentes React: `PascalCase.tsx`.
- Entidades/Tipos: `PascalCase`.
- Hooks: `useX.ts`.
- APIs: recursos REST com verbos no método.
- Aliases TS: `@/*` (apps/web), `@server/*`, `@lib/*`, `@shared/*` via `tsconfig` e `next.config.js`.

## Camadas
- Domínio (`shared/domain`): modelos, invariantes.
- Aplicação (`apps/web/server/usecases`): coordenação de regras.
- Infra (`apps/web/server/services`, `repositories`): Supabase, email, rate limiting, cache.
- Apresentação (`apps/web/app`, `apps/web/components`): páginas e UI.

## Principais Módulos
-- Auth e sessão: `apps/web/app/api/auth/*`, `apps/web/lib/auth.ts`.
-- Custos: `apps/web/app/api/costs/*`, `apps/web/lib/costs/*`.
-- Relatórios: `apps/web/app/api/reports/*`, `database/views`.
-- Realtime: `apps/web/lib/realtime-service.ts`.
-- Logger: `apps/web/lib/logger.ts`.

## Segurança e Observabilidade
- Cookies de sessão `httpOnly`, `secure`, `sameSite=lax`; payload mínimo.
- Rate limiting em endpoints sensíveis.
- Sentry (web + mobile) para erros e performance.

## Migração aplicada
- `web-app/`, `65-web-app/`, `components/` e `lib/` (Dart antigo) foram arquivados em `archive/LEGADO_NAO_USAR/`.
- Scripts de raiz migrados para `infra/scripts/`.
- `apps/web` é a fonte do frontend e API; `apps/mobile` é a fonte do Flutter.

## Banco de Dados
- Supabase/Postgres com RLS, RPCs e views.
- Migrações versionadas em `database/migrations/`.

## Build/Deploy
- Vercel (web), com jobs cron e env em `apps/web/vercel.json`.
- CI/CD em `infra/ci/`.
 
## Legado
- Conteúdos antigos de Next em raiz foram movidos para `archive/LEGADO_NAO_USAR/app-legacy/` para evitar conflitos com `apps/web/`.

## Referências Relacionadas
- Guia de Migração: `docs/GUIA_MIGRACAO.md`
- Auditoria Técnica Completa: `docs/auditoria/AUDITORIA_COMPLETA.md`
- Guia de Migração do Repositório (histórico): `docs/GUIA_MIGRACAO_REPERTORIO.md`

