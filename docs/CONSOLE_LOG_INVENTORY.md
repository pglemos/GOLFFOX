# Inventário de Console Logs - GolfFox

**Data:** 2025-12-26  
**Total Encontrado:** 15  
**Total em Produção Real:** 1-2

## Arquivos com Console Logs

| Arquivo | Logs | Tipo | Ação |
|---------|------|------|------|
| `lib/cqrs/bus/register-handlers.ts:64` | 1 | Debug | Substituir por `debug()` |
| `lib/retry-service.ts:71,73` | 2 | JSDoc (exemplo) | Ignorar |
| `lib/api/fetch-with-error-handling.ts:28,30` | 2 | JSDoc (exemplo) | Ignorar |
| `lib/safe-async.ts:34,36,131,133,160,189,191` | 7 | JSDoc (exemplo) | Ignorar |
| `hooks/use-file-upload.ts:87` | 1 | JSDoc (exemplo) | Ignorar |
| `hooks/use-effect-event.ts:10` | 1 | JSDoc (exemplo) | Ignorar |
| `components/providers/realtime-provider.tsx:60` | 1 | Comentado | Já desabilitado |

## Análise

A maioria dos `console.log` encontrados (13 de 15) estão em comentários JSDoc como exemplos de uso.

### Ações Necessárias:

1. **Substituir por logger:**
   - `lib/cqrs/bus/register-handlers.ts:64` - Único log real em produção

### Observações:

- ✅ As rotas de API já usam o logger estruturado de `@/lib/logger`
- ✅ Logs em `scripts/` são aceitáveis (ferramentas CLI)
- ✅ Logs em arquivos de logger (`lib/core/logger.ts`, `lib/dev-logger.ts`) são esperados
