<!-- 6bb0b97b-ae92-48df-af7f-d91faa374422 964ce01f-8923-4216-b2fc-d7473992b10b -->
# Plano de Auditoria Profunda – Golf Fox

## Objetivo

Executar uma auditoria técnica completa do repositório `F:\GOLFFOX`, cobrindo organização, código (backend/frontend/mobile), banco de dados, infraestrutura, observabilidade, segurança e processos. Entregar um laudo final no formato solicitado, com inventário, lacunas, problemas (com gravidade/risco/correção), pontos fortes, melhorias e plano de ação (0–7, 8–30, 30+ dias).

## Escopo e Fontes

- Repositório local: `F:\GOLFFOX` (acesso somente leitura)
- Documento de visão e escopo: `c:\Users\Pedro\Downloads\Golf Fox – Visão Geral e Escopo Téc.txt`
- Ambientes externos read-only: Supabase (URL/chaves), Vercel (projeto `synvolt/golffox`)

## Entregável (formato do laudo)

1) Visão Geral do Sistema

- Tecnologias principais
- Arquitetura geral
- Breve resumo do propósito/escopo
2) Inventário do que já existe (Repertório Atual)
- Backend/API
- Frontend/Apps
- Banco/Dados
- Infra/DevOps
- Outros (jobs, scripts utilitários, ferramentas internas)
3) O que NÃO foi criado e deveria existir (Lacunas) – com justificativa e solução sugerida
4) Problemas e pontos errados – tabela/bullets: Gravidade, Caminho, Descrição, Risco, Sugestão de correção
5) O que está funcionando bem (Pontos Fortes) – exemplos com caminhos e justificativas
6) O que precisa melhorar (Refino e Otimização) – priorizado (Alta/Média/Baixa) e como melhorar
7) Plano de Ação Prioritário – Curto (0–7), Médio (8–30), Longo (30+)

## Metodologia (etapas e evidências)

1) Mapeamento do repositório

- Gerar árvore resumida das pastas principais (ignorar node_modules/.git/dist/build/coverage/_next etc.)
- Identificar módulos, serviços, APIs, componentes, scripts, jobs, infra
2) Backend/API (Next.js – `apps/web/app/api/**` e correlatos)
- Classificar rotas (auth, admin, operator, costs, reports, analytics, cron, health, docs)
- Verificar autenticação, sessão, RBAC/ABAC, middlewares, rate limiting
- Analisar tratamento de erros/respostas e padronização
- Comparar implementação x `docs/api/openapi.json` e listar divergências; cobrir 100% de admin/operator/costs/cron
3) Frontend/Apps
- Web (Next.js – `apps/web`): páginas, componentes críticos, estados globais, fetchers, padrões UI/UX
- Mobile (Flutter – `apps/mobile`): estrutura `lib/`, navegação, serviços, testes (unit/widget/integration)
4) Banco de Dados
- Ler migrations/DDL (`database/migrations/**`), políticas RLS, índices/FKs/constraints/naming
- Confirmar RLS efetiva (ANON) e bypass com SERVICE, checar views de relatórios e jobs SQL
5) Infra/DevOps
- Docker Compose local, scripts de setup/deploy, vercel.json (headers/crons), lint/typecheck/test/build
- CI/CD (workflows); definir pipeline recomendado caso ausente
6) Observabilidade e Segurança
- Sentry (web e server/tracing), Web Vitals, logger, políticas de segredo/variáveis, CSP/HSTS/XFO/Referrer-Policy
7) Ambientes Externos (read-only)
- Vercel: projeto/envs/cron/domínios/deployments – verificar aderência ao código e gaps
- Supabase: GoTrue settings, Storage buckets, PostgREST (amostras), coerência com RLS e schema
8) Consolidação
- Tabela de problemas com gravidade/risco/arquivo/ação
- Pontos fortes com caminhos e justificativas
- Lacunas com justificativa e solução
- Plano de ação priorizado

## Critérios de Conclusão

- 100% das rotas de `apps/web/app/api/**` mapeadas e avaliadas
- OpenAPI atualizado com gaps listados e plano de cobertura 100%
- RLS/índices/FKs revisados com recomendações objetivas
- Infra/headers/crons/CI-CD avaliados; recomendações acionáveis
- Laudo completo entregue no formato solicitado (com exemplos de código/caminhos)

## Principais Achados que já serão incorporados

- Variável de Service Role divergente (código usa `SUPABASE_SERVICE_ROLE_KEY`; Vercel possui também `SUPABASE_SERVICE_ROLE`)
- Rate limiting sem credenciais Upstash em prod/preview → fail-open
- Crons do Vercel sem `/api/cron/refresh-costs-mv` apesar de existir no `vercel.json`
- Bucket `vehicle-photos` público (avaliar privacidade)
- GoTrue: email on, sign-up on, autoconfirm off (ajustar conforme onboarding)

## Próximas Ações (execução pós-laudo)

- Padronizar env de Service Role (manter apenas `SUPABASE_SERVICE_ROLE_KEY` + fallback no código)
- Configurar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` em prod/preview
- Ativar cron `/api/cron/refresh-costs-mv` no Vercel
- Tornar `vehicle-photos` privado e expor via URLs assinadas (se aplicável)
- Completar OpenAPI e validar em CI
- Helpers padronizados de resposta/erro; integrar Sentry no server/tracing
- Matrizes RBAC e testes de autorização por empresa

### To-dos

- [ ] Mapear e classificar rotas em apps/web/app/api/**
- [ ] Auditar autenticação, sessão, RBAC/ABAC e middlewares
- [ ] Avaliar tratamento de erros/respostas e padronização
- [ ] Comparar implementação x docs/api/openapi.json e listar gaps
- [ ] Ler migrations e políticas RLS; avaliar índices/constraints
- [ ] Revisar infra/docker-compose e scripts de setup/deploy
- [ ] Auditar projeto Vercel (envs, domínios, build, headers)
- [ ] Auditar Supabase (schemas, policies, storage, funções)
- [ ] Consolidar laudo, problemas, pontos fortes e plano de ação