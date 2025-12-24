# Inventário de Console.log - GolfFox

**Data:** 2025-01-XX  
**Total de Ocorrências:** 828 (em 159 arquivos)  
**Ocorrências em código fonte (.ts/.tsx):** 281  
**Status:** Em Análise

---

## Resumo Executivo

### Distribuição por Tipo

| Tipo | Quantidade | Descrição |
|------|-----------|-----------|
| `console.log` | ~400 | Logs gerais de debug |
| `console.error` | ~200 | Logs de erro |
| `console.warn` | ~150 | Logs de aviso |
| `console.info` | ~50 | Logs informativos |
| `console.debug` | ~28 | Logs de debug detalhado |

### Distribuição por Localização

| Localização | Arquivos | Ocorrências |
|-------------|----------|-------------|
| `app/api/` | 1 arquivo | 7 ocorrências |
| `components/` | 59 arquivos | ~200 ocorrências |
| `lib/` | ~50 arquivos | ~300 ocorrências |
| `hooks/` | ~20 arquivos | ~50 ocorrências |
| `scripts/` | ~30 arquivos | ~200 ocorrências (aceitável) |
| `docs/` | ~50 arquivos | ~70 ocorrências (aceitável) |

---

## Estratégia de Substituição

### Categorização

1. **Desenvolvimento/Debug** → Substituir por `debug()` do logger
2. **Erros** → Substituir por `logError()` do logger
3. **Avisos** → Substituir por `warn()` do logger
4. **Informações** → Substituir por `info()` do logger
5. **Scripts** → Manter console.* (scripts são executados diretamente)
6. **Documentação** → Manter console.* (exemplos de código)

### Prioridade

1. **Alta:** Rotas API (`app/api/`)
2. **Alta:** Componentes React (`components/`)
3. **Média:** Hooks (`hooks/`)
4. **Média:** Libraries (`lib/`)
5. **Baixa:** Scripts e documentação

---

## Arquivos Prioritários para Correção

### Rotas API (7 ocorrências)

#### `app/api/admin/employees-list/route.ts`
- **Ocorrências:** 7
- **Tipo:** `console.log`, `console.error`
- **Ação:** Substituir por `debug()` e `logError()`

### Componentes (59 arquivos, ~200 ocorrências)

#### Arquivos com mais ocorrências:
- `components/providers/empresa-tenant-provider.tsx` - 18 ocorrências
- `components/modals/veiculo-modal.tsx` - 16 ocorrências
- `components/topbar.tsx` - 7 ocorrências
- `components/providers/realtime-provider.tsx` - 5 ocorrências
- `components/modals/route-modal.tsx` - 4 ocorrências
- `components/modals/motorista-modal.tsx` - 3 ocorrências

### Libraries (50 arquivos, ~300 ocorrências)

#### Arquivos com mais ocorrências:
- `lib/realtime-service.ts` - 7 ocorrências
- `lib/api/documents-handler.ts` - 8 ocorrências
- `lib/core/auth/auth-session.ts` - múltiplas ocorrências
- `lib/api-auth.ts` - múltiplas ocorrências

---

## Plano de Substituição

### Fase 1: Rotas API (Prioridade Máxima)
- [ ] `app/api/admin/employees-list/route.ts` - 7 ocorrências

### Fase 2: Componentes Críticos
- [ ] `components/providers/empresa-tenant-provider.tsx` - 18 ocorrências
- [ ] `components/modals/veiculo-modal.tsx` - 16 ocorrências
- [ ] `components/topbar.tsx` - 7 ocorrências
- [ ] `components/providers/realtime-provider.tsx` - 5 ocorrências

### Fase 3: Libraries
- [ ] `lib/realtime-service.ts` - 7 ocorrências
- [ ] `lib/api/documents-handler.ts` - 8 ocorrências
- [ ] `lib/core/auth/auth-session.ts`
- [ ] `lib/api-auth.ts`

### Fase 4: Hooks
- [ ] Todos os hooks com console.*

### Fase 5: Componentes Restantes
- [ ] Componentes com menos ocorrências

---

## Notas

- Logger já está implementado em `lib/core/logger.ts`
- Logger exporta: `debug`, `info`, `warn`, `error`, `logError`
- Logger condicional: logs de debug/info/warn só aparecem em desenvolvimento
- Erros sempre são logados (críticos para produção)
- Scripts podem manter console.* (executados diretamente)
- Documentação pode manter console.* (exemplos de código)

