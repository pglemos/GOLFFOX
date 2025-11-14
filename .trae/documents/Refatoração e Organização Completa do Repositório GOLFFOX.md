## Objetivos e Alcance
- Remover conteúdo obsoleto/duplicado e consolidar documentação.
- Reorganizar pastas e módulos para uma arquitetura clara e escalável.
- Padronizar nomes, camadas (domínio/aplicação/infra/apresentação) e convenções.
- Aplicar correções prioritárias de segurança e desempenho citadas na auditoria.
- Manter o sistema funcional (web + mobile) e pronto para evoluir.

## Inventário e Decisões
### O que permanece (núcleo)
- Web (Next.js 15 App Router) em `web-app/` com APIs e dashboards por perfil.
- Mobile (Flutter 3) em `lib/` (driver/passageiro) e serviços associados.
- Banco de dados Supabase: `database/` (migrations, seeds, scripts; RLS e RPC).
- Pontos fortes preservados:
  - Logger central: `web-app/lib/logger.ts:23-47,96-112`.
  - Realtime robusto: `web-app/lib/realtime-service.ts:136-205,364-399`.
  - Validações Zod em custos: `web-app/app/api/costs/budgets/route.ts:110`, `web-app/app/api/costs/manual/route.ts:27`.
  - Map rendering/validação polylines: `web-app/components/admin-map/layers.tsx:85-111`.

### O que corrigir/melhorar (prioridades da auditoria)
- Cookies de sessão inseguros: `web-app/app/api/auth/set-session/route.ts:50` → `httpOnly`, `secure`, `sameSite`, payload mínimo; armazenar server-side.
- SMTP (fallback) com `nodemailer`: `web-app/app/api/reports/dispatch/route.ts:145`.
- Checagem/aplicação da migration v49 (RLS `gf_user_company_map`).
- Rate limiting transversal em rotas sensíveis (import/export/reports).
- Export/relatórios: evitar `.select('*')`, usar paginação/streaming.
- Observabilidade: Sentry web/mobile.
- Validação E2E com autenticação real.
- Consolidar documentação duplicada (`RESUMO_*`, `RELATORIO_*`, `DEPLOY_*`).

### O que remover/arquivar
- Documentos redundantes e POCs desatualizadas; scripts sem uso; versões antigas de telas sem referência.
- Estratégia: mover para `archive/LEGADO_NAO_USAR/` com um `index.md` explicando cada item removido e motivo. Manter por 1 ciclo de release antes de exclusão definitiva.

## Estrutura Alvo do Repositório
```
GOLFFOX/
├── apps/
│   ├── web/                      # migrado de `web-app/`
│   │   ├── app/                  # App Router e API routes (Next.js requer manter aqui)
│   │   ├── components/           # UI base e domínios (admin/operator/...)
│   │   ├── lib/                  # cliente supabase, auth helpers, logger
│   │   ├── server/               # serviços, repositórios, casos de uso (compartilhados pelas APIs)
│   │   ├── middleware.ts
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   └── vercel.json
│   └── mobile/                   # migrado de `lib/` (Flutter)
│       ├── driver/               # app do motorista
│       ├── passenger/            # app do passageiro
│       └── shared/               # core Flutter compartilhado (temas, auth, routing, security)
├── shared/                       # código compartilhado cross-plataforma
│   ├── domain/                   # modelos/entidades, DTOs, invariantes
│   ├── types/                    # tipos TS/JSON schemas; gerados de Postgres quando aplicável
│   ├── utils/                    # utilitários puros (datas, números, geodésico)
│   └── validation/               # esquemas zod reutilizáveis
├── database/                     # permanece como fonte de verdade do schema
│   ├── migrations/
│   ├── seeds/
│   └── scripts/
├── infra/
│   ├── ci/                       # GitHub Actions (.github/workflows/*)
│   ├── docker/                   # Dockerfile.dev, compose (se houver)
│   ├── scripts/                  # scripts de automação (consolidados)
│   └── tools/                    # `tools/db/*`, `tools/pgapply/*` reorganizados
├── docs/
│   ├── AUDITORIA_COMPLETA.md
│   ├── ARQUITETURA_ATUAL.md
│   └── GUIA_MIGRACAO_REPERTORIO.md
└── archive/
    └── LEGADO_NAO_USAR/         # lixo/POCs/duplicados com index.md
```

## Convenções e Padronização
- Pastas e arquivos: `kebab-case` (ex.: `driver-positions-service.ts`).
- Componentes React: `PascalCase.tsx`.
- Tipos/Entidades: `PascalCase` (ex.: `Trip`, `DriverPosition`).
- Hooks React: `useSomething.ts`.
- APIs REST: nomes orientados a recursos, sem verbos no path; verbos no método.
- Imports com aliases: configurar `tsconfig` (`baseUrl`, `paths`) e `next.config.js` para `@server/*`, `@lib/*`, `@shared/*`.
- Camadas:
  - Domínio (`shared/domain`): entidades, invariantes, regras.
  - Aplicação (`apps/web/server/usecases`): orquestra casos de uso/serviços.
  - Infra (`apps/web/server/services`, `apps/web/server/repositories`): supabase, email, rate limiters, cache.
  - Apresentação (`apps/web/app`, `apps/web/components`).

## Limpeza e Consolidação
- Documentação:
  - Consolidar `RESUMO_*`, `RELATORIO_*`, `DEPLOY_*` em `docs/` (apagar duplicatas). Criar índice em `ARQUITETURA_ATUAL.md`.
- Scripts:
  - Unificar em `infra/scripts/` com nomes claros. Remover scripts sem referência no CI ou nos docs.
- Código morto/POCs:
  - Varrer `apps/web/components/`, `apps/web/lib/`, `apps/mobile/*` e mover itens sem referências ou importadores para `archive/LEGADO_NAO_USAR` (pré-exclusão).

## Correções Prioritárias (Entrega Rápida)
- Sessão segura (`/api/auth/set-session`): `web-app/app/api/auth/set-session/route.ts:50`
  - `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, expiração curta.
  - Remover `accessToken` do cookie; usar id/role e armazenar server-side; avaliar `@supabase/ssr`.
- SMTP `nodemailer` (`reports/dispatch`): `web-app/app/api/reports/dispatch/route.ts:145`
  - Implementar envio com TLS, anexos; parametrizar credenciais por env.
- Migration v49:
  - Checar no Supabase; se faltando, aplicar `v49_protect_user_company_map.sql`.
- Rate limiting:
  - Middleware/serviço para `reports/*`, `costs/*`, `analytics/*`. Usar `@upstash/ratelimit` ou token bucket in-memory (edge-safe quando aplicável).
- Export/relatórios:
  - Paginação rigorosa e streaming CSV; evitar `.select('*')` em `web-app/app/api/reports/run/route.ts:157-171` e `costs/export`.

## Melhorias de Observabilidade
- Sentry Web: `@sentry/nextjs` com DSN, release, sourcemaps; capturar erros de handlers.
- Sentry Mobile (Flutter): adicionar `sentry_flutter` com captura de erros, performance básica.
- Logger: manter `logger.ts` como façade; padronizar níveis e redaction.

## Testes e Validação
- E2E auth: fixture que usa `/api/auth/csrf` + `/api/auth/set-session` com cookies `httpOnly`.
- Unitários: serviços de custos, relatórios, rate limiter.
- Integração: export streaming e dispatch de relatórios.
- Health-check: `/api/health` deve validar conexão Supabase (já existe `web-app/app/api/health/route.ts:8`).

## Git e Fluxo de Trabalho
- Branch: `refactor/repositorio-organizado` baseada na default (`main`).
- Commits granulares:
  - `chore: consolidar docs e remover duplicatas`
  - `refactor: mover web-app -> apps/web`
  - `feat: criar shared/domain e shared/types`
  - `fix: tornar cookie de sessão httpOnly e seguro`
  - `feat: rate limiting em endpoints de alto custo`
  - `perf: streaming/paginação em relatórios`
- PR com descrição e checklist (build, lint, testes, preview).

## Passos de Implementação (Fases)
### Fase 0 – Preparação
1. Criar branch e mapear itens de remoção (dry-run: localizar duplicatas e POCs).
2. Configurar `tsconfig` com aliases e atualizar imports automaticamente (busca/substituição segura).

### Fase 1 – Limpeza e Estrutura
1. Mover `web-app/` para `apps/web/` sem quebrar `app/api`.
2. Reorganizar componente/lib em `apps/web/components` e `apps/web/lib`.
3. Criar `apps/web/server/{services,repositories,usecases}` e extrair lógicas reutilizáveis dos handlers.
4. Reorganizar `lib/` (Flutter) para `apps/mobile/{driver,passenger,shared}`.
5. Criar `shared/{domain,types,utils,validation}` e apontar imports.
6. Consolidar `infra/{ci,scripts,tools}` e mover `tools/*`.
7. Criar `archive/LEGADO_NAO_USAR` e mover redundâncias.

### Fase 2 – Correções de Segurança/Desempenho
1. Fix cookie sessão (`auth/set-session`).
2. Implementar `nodemailer` fallback em `reports/dispatch`.
3. Checar/aplicar migration v49.
4. Adicionar rate limiting a endpoints críticos.
5. Revisar `.select('*')` e implementar paginação/streaming.

### Fase 3 – Observabilidade e Testes
1. Integrar Sentry web + mobile.
2. Fixtures E2E de auth; unitários/integrados para serviços críticos.
3. Ajustes finais de lint/format/type-check.

### Fase 4 – Documentação e PR
1. Atualizar `AUDITORIA_COMPLETA.md` com o que foi implementado.
2. Criar `docs/ARQUITETURA_ATUAL.md` (árvore de diretórios + responsabilidades).
3. Criar `docs/GUIA_MIGRACAO_REPERTORIO.md` (mapeamento antigo → novo e práticas).
4. Abrir PR com preview e checklist.

## Riscos e Mitigações
- Quebra de imports ao mover pastas: mitigar com aliases, testes e CI.
- Dependência de rotas App Router: manter `apps/web/app/api/*` no lugar e extrair apenas lógica.
- Credenciais SMTP/Sentry/Upstash: usar variáveis de ambiente; nunca commitar segredos.

## Critérios de Conclusão
- Repositório sem lixo; documentação consolidada em `docs/`.
- Estrutura clara: `apps/`, `shared/`, `database/`, `infra/`, `docs/`, `archive/`.
- Correções de segurança aplicadas; endpoints críticos com rate limiting e export streaming.
- Testes mínimos rodando; PR aberto na branch `refactor/repositorio-organizado` com preview funcionando.

---

Confirma este plano para iniciar a execução (limpeza, refatoração, correções e documentação) na branch `refactor/repositorio-organizado`. 