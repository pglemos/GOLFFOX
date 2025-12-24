# Inventário de Tipos `any` - GolfFox

**Data:** 2025-01-XX  
**Total de Ocorrências:** 458 (em 154 arquivos)  
**Status:** Em Análise

---

## Resumo Executivo

### Distribuição por Tipo

| Tipo | Quantidade | Descrição |
|------|-----------|-----------|
| `as any` | 458 | Type assertions explícitas |
| Parâmetros `any` implícitos | ~50 | Parâmetros sem tipo explícito |

### Categorização por Razão

| Razão | Quantidade | Prioridade |
|-------|-----------|------------|
| Tipos Supabase | ~200 | **CRÍTICA** (resolverá após regenerar tipos) |
| Legacy code | ~100 | Média |
| Workarounds temporários | ~80 | Média |
| Testes | ~50 | Baixa (aceitável em testes) |
| Documentação | ~28 | Baixa (exemplos) |

---

## Arquivos com Mais Ocorrências

### Libraries

#### `lib/services/map/map-services/vehicle-loader.ts`
- **Ocorrências:** 4
- **Razão:** Tipos Supabase
- **Ação:** Corrigir após regenerar tipos

#### `lib/realtime-service.ts`
- **Ocorrências:** 7
- **Razão:** Tipos Supabase
- **Ação:** Corrigir após regenerar tipos

#### `lib/core/auth/auth-session.ts`
- **Ocorrências:** 9
- **Razão:** Tipos Supabase e workarounds
- **Ação:** Corrigir após regenerar tipos

#### `lib/api-auth.ts`
- **Ocorrências:** 15
- **Razão:** Tipos Supabase
- **Ação:** Corrigir após regenerar tipos

#### `lib/cache/redis-cache.service.ts`
- **Ocorrências:** 7
- **Razão:** Tipos Redis
- **Ação:** Adicionar tipos do Redis

### Componentes

#### `components/admin-map/admin-map.tsx`
- **Ocorrências:** 20
- **Razão:** Tipos Supabase e tipos de mapa
- **Ação:** Corrigir após regenerar tipos e definir tipos de mapa

#### `components/providers/empresa-tenant-provider.tsx`
- **Ocorrências:** 12
- **Razão:** Tipos Supabase
- **Ação:** Corrigir após regenerar tipos

### Rotas API

#### `app/api/admin/veiculos/[vehicleId]/route.ts`
- **Ocorrências:** 10
- **Razão:** Tipos Supabase
- **Ação:** Corrigir após regenerar tipos

#### `app/api/admin/transportadoras/delete/route.ts`
- **Ocorrências:** 8
- **Razão:** Tipos Supabase
- **Ação:** Corrigir após regenerar tipos

---

## Plano de Correção

### Fase 1: Regenerar Tipos Supabase (CRÍTICA)
- [ ] Regenerar `types/supabase.ts`
- [ ] Isso deve resolver ~200 ocorrências automaticamente

### Fase 2: Corrigir Tipos Supabase Restantes
- [ ] Substituir `as any` em queries Supabase por tipos corretos
- [ ] Usar tipos de tabelas específicas

### Fase 3: Corrigir Tipos de Componentes
- [ ] Adicionar tipos explícitos para props
- [ ] Corrigir tipos de eventos
- [ ] Corrigir tipos de callbacks

### Fase 4: Corrigir Tipos de Funções
- [ ] Adicionar tipos de retorno explícitos
- [ ] Adicionar tipos de parâmetros explícitos

### Fase 5: Documentar Casos Necessários
- [ ] Documentar casos onde `as any` é necessário
- [ ] Criar tipos específicos para esses casos

---

## Notas

- Muitos `as any` são causados pelo arquivo `types/supabase.ts` vazio
- Após regenerar tipos do Supabase, muitos erros devem ser resolvidos automaticamente
- Alguns `as any` são necessários para workarounds temporários (devem ser documentados)
- `as any` em testes é aceitável
- `as any` em documentação é aceitável

