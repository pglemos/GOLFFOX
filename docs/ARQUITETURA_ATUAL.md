# Arquitetura Atual – GolfFox

## Visão Geral
- Monorepo com módulos principais: web (Next.js 15), mobile (Flutter 3), banco (Supabase/Postgres), scripts/infra e documentação.
- Separação por camadas: domínio, aplicação, infra e apresentação.

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
│   └── mobile/
│       ├── driver/
│       ├── passenger/
│       ├── shared/              # core Flutter compartilhado
│       └── flutter-web/         # build/web do Flutter (assets)
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
│   ├── ci/                      # GitHub Actions
│   ├── docker/
│   ├── scripts/
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
- Aliases TS: `@server/*`, `@lib/*`, `@shared/*` via `tsconfig` e `next.config.js`.

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

## Banco de Dados
- Supabase/Postgres com RLS, RPCs e views.
- Migrações versionadas em `database/migrations/`.

## Build/Deploy
- Vercel (web), com jobs cron e env em `apps/web/vercel.json`.
- CI/CD em `infra/ci/`.
 
## Legado
- Conteúdos antigos de Next em raiz foram movidos para `archive/LEGADO_NAO_USAR/app-legacy/` para evitar conflitos com `apps/web/`.

