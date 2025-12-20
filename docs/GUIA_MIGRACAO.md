# Guia de Migração – GolfFox

## Objetivo
Orientar a migração para a estrutura atual do monorepo, garantindo segurança, consistência e manutenção simplificada.

## Escopo
- Reestruturação de pastas (apps/, shared/, database/, infra/, docs/, archive/).
- Consolidação de documentação e scripts.
- Verificações funcionais e de segurança pós-migração.

## Passos de Migração
1. Preparação
   - Crie um branch: `feat/migracao-estrutura-atual`
   - Garanta build e lint verdes antes de iniciar.
2. Reorganização de Código
   - Mover frontend/Next para `apps/web`
   - Mover Flutter para `apps/mobile`
   - Consolidar utilitários comuns em `shared/{domain,types,utils,validation}`
   - Centralizar scripts em `infra/scripts` e ferramentas em `infra/tools`
   - Arquivar conteúdo legado em `archive/LEGADO_NAO_USAR/*`
3. Ajustes de Imports/Aliases
   - Configurar `@/*`, `@server/*`, `@shared/*` no `tsconfig.json` e `next.config.js`
   - Atualizar imports conforme novos aliases
4. Banco de Dados e RLS
   - Validar migrações em `database/migrations/*`
   - Confirmar políticas RLS essenciais ativas (admin/operador/transportadora/motorista/passageiro)
5. Observabilidade e Segurança
   - Cookies `httpOnly`, `secure`, `sameSite=lax` com payload mínimo
   - Rate limiting em endpoints sensíveis (`reports`, `costs`, `auth`)
   - Sentry (web/mobile) quando disponível
6. Documentação
   - Atualizar `docs/ARQUITETURA_ATUAL.md`
   - Atualizar auditoria em `docs/auditoria/AUDITORIA_COMPLETA.md`

## Verificação (Checklist)
- [ ] Build e lint do `apps/web` OK
- [ ] Testes críticos (auth, custos, relatórios) OK
- [ ] RLS verificada nas tabelas principais
- [ ] Rotas `reports/*` e `costs/*` com paginação/limitação
- [ ] `docs/ARQUITETURA_ATUAL.md` e `docs/GUIA_MIGRACAO.md` presentes e atualizados
- [ ] Conteúdo legado movido para `archive/LEGADO_NAO_USAR/*`

## Scripts Úteis
- Validação Supabase: `database/scripts/verify_supabase_setup.sql`
- Verificação RLS: `apps/web/scripts/validate-rls-isolation.sql`
- Auditoria geral: `apps/web/scripts/audit-vercel.js`

## Referências
- `docs/ARQUITETURA_ATUAL.md`
- `docs/auditoria/AUDITORIA_COMPLETA.md`
- `docs/GUIA_MIGRACAO_REPERTORIO.md` (histórico)


