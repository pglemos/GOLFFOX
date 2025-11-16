# Guia de Migração do Repositório

## Objetivo
Padronizar e reorganizar o GOLFFOX para uma arquitetura clara, removendo redundâncias e melhorando segurança, desempenho e manutenção.

## Mudanças Principais
- Criação da estrutura alvo `apps/`, `shared/`, `infra/`, `docs/`, `archive/`.
- Extração de lógicas de handlers para `apps/web/server/{services,repositories,usecases}`.
- Criação de `shared/{domain,types,utils,validation}` para reutilização cross-plataforma.
- Consolidação de scripts em `infra/scripts/` e ferramentas em `infra/tools/`.
- `archive/LEGADO_NAO_USAR/` para itens antigos/POCs antes da exclusão.

## Mapeamento Antigo → Novo
- `web-app/` → `archive/LEGADO_NAO_USAR/web-app-legacy/` (fonte agora em `apps/web/`).
- `65-web-app/` → `archive/LEGADO_NAO_USAR/65-web-app-legacy/`.
- `components/` (raiz) → `archive/LEGADO_NAO_USAR/components-legacy/`.
- `lib/` (Flutter antigo) → `archive/LEGADO_NAO_USAR/flutter-legacy/` (fonte agora `apps/mobile/`).
- `tools/flutter` (SDK local) → `archive/LEGADO_NAO_USAR/flutter-sdk/`.
- `scripts/*` (raiz) → `infra/scripts/*`.
- `apps/web/scripts/*` permanecem para utilidades do app; novos scripts genéricos devem ir para `infra/scripts/*`.
- `tools/db/*` e `tools/pgapply/*` → `infra/tools/*`.
- Documentação dispersa (`RESUMO_*`, `RELATORIO_*`, `DEPLOY_*`) → `docs/` consolidado.
 - Estrutura antiga de Next em raiz (`app/*`) → `archive/LEGADO_NAO_USAR/app-legacy/`.

## Passos para o Time
1. Atualize imports usando aliases (`@server`, `@shared`, `@lib`).
2. Mova novas lógicas de API para casos de uso/serviços em `apps/web/server/*`.
3. Crie entidades/DTOs em `shared/domain` e tipos em `shared/types`.
4. Use validações comuns em `shared/validation`.
5. Registre scripts operacionais em `infra/scripts` e remova duplicados.

## Boas Práticas
- DRY nas lógicas de custos/relatórios.
- Padronizar erros com códigos e mensagens.
- Logger centralizado com redaction.
- Rate limiting em rotas pesadas.
- Não commitar segredos; usar `.env` e variáveis de ambiente.

## Verificação
- Build e lint sem erros.
- Testes E2E de auth e unitários de serviços críticos.
- Health-check `/api/health` ok.

## Referências
- `docs/ARQUITETURA_ATUAL.md` – estrutura e convenções.
- `AUDITORIA_COMPLETA.md` – diagnóstico e prioridades.

