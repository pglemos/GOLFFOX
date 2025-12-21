# Relatório de Limpeza de Código Não Utilizado

**Data:** 2025-01-XX  
**Status:** Análise Completa - Pronto para Remoção

---

## Resumo Executivo

Este relatório identifica código não utilizado no projeto que pode ser removido para melhorar manutenibilidade e performance.

---

## 1. Componentes Não Utilizados

### 1.1 Componentes Exportados mas Nunca Importados

#### ❌ `components/view-transition.tsx`
**Status:** PARCIALMENTE NÃO UTILIZADO

**Componentes:**
- `ViewTransitionLink` - Exportado mas nunca importado/usado
- `ViewTransitionButton` - Exportado mas nunca importado/usado

**Uso encontrado:**
- Apenas mencionado em documentação (`docs/NEXTJS_16_IMPLEMENTATION.md`)
- Hook `useViewTransition` é usado em `premium-sidebar.tsx`, mas os componentes não

**Recomendação:** Remover `ViewTransitionLink` e `ViewTransitionButton` se não houver planos de uso imediato.

#### ❌ `components/performance-monitor.tsx`
**Status:** NÃO UTILIZADO

**Componentes:**
- `PerformanceMonitor` - Exportado mas nunca importado/usado
- `usePerformanceMonitor` - Exportado mas nunca importado/usado

**Evidências:**
- Comentado no código: `// PerformanceMonitor removido` em `advanced-route-map.tsx`
- Nenhum import encontrado no projeto

**Recomendação:** REMOVER - Componente foi removido do uso mas o arquivo permanece.

---

## 2. Funções Não Utilizadas

### 2.1 Funções Exportadas mas Nunca Chamadas

#### ❌ `lib/api/fetch-with-error-handling.ts`
**Status:** PARCIALMENTE NÃO UTILIZADO

**Função:**
- `fetchWithLoading` - Exportada mas nunca importada/chamada

**Uso encontrado:**
- `fetchWithErrorHandling` - Função principal é nova e pode não estar sendo usada ainda (criada na refatoração DRY)

**Recomendação:** Verificar se `fetchWithErrorHandling` está sendo usada. Se não, ambas podem ser removidas ou documentadas como utilitários futuros.

#### ❌ `lib/cqrs/bus/register-handlers.ts`
**Status:** NÃO UTILIZADO

**Função:**
- `registerAllHandlers()` - Exportada mas nunca chamada

**Análise:**
- Função vazia que apenas tem comentário
- Handlers são registrados diretamente no arquivo, não via função

**Recomendação:** REMOVER função `registerAllHandlers` ou implementar uso real se necessário.

---

## 3. Imports Não Utilizados

### 3.1 Imports Identificados pelo ESLint

**Análise ESLint executada - Encontrados ~30+ imports não utilizados:**

#### Exemplos de Imports Não Utilizados:
- `AnimatePresence` em vários arquivos
- `Filter`, `LineChart`, `Line` em componentes de gráficos
- `useMemo`, `Suspense` não utilizados
- `Button`, `Input`, `CardHeader`, `CardTitle` não utilizados em alguns modais
- `Users`, `XCircle`, `DollarSign` (ícones não utilizados)
- `supabase`, `notifyError` não utilizados em alguns componentes
- Variáveis `loading`, `router`, `selectedCompany` atribuídas mas nunca usadas

**Recomendação:** Remover imports não utilizados identificados pelo ESLint após validação manual.

---

## 4. useState Não Utilizados

### 4.1 Estados Identificados

#### ✅ `components/transportadora/transportadora-legal-rep-section.tsx`
**Status:** UTILIZADO (falso positivo)

**Estado:**
- `uploading` - Comentário indica "Mantido para compatibilidade visual"

**Análise:**
- Estado É usado nas linhas 302, 321, 323
- Comentário pode ser atualizado para refletir uso real

**Recomendação:** Atualizar comentário, não remover.

#### ⚠️ `components/admin-map/admin-map.tsx`
**Status:** VERIFICAR

**Comentário encontrado:**
- Linha 153: `// Removido estado não utilizado historicalPositions`

**Análise:**
- Estado foi removido, mas comentário permanece
- Verificar se há outros estados não utilizados no arquivo

**Recomendação:** Remover comentário obsoleto após verificação.

---

## 5. Código Comentado

### 5.1 Código Comentado Identificado

#### ⚠️ `components/admin-map/admin-map.tsx`
**Comentários encontrados:**
- Linha 679: `// Montar dados finais dos veículos - MOSTRAR TODOS OS VEÍCULOS ATIVOS`
- Linha 762: `// Processar TODOS os veículos - não filtrar por coordenadas`
- Linha 153: `// Removido estado não utilizado historicalPositions`

**Análise:**
- Comentários explicativos são úteis
- Comentário sobre estado removido pode ser deletado

**Recomendação:** Manter comentários explicativos, remover comentário sobre código removido.

---

## 6. Elementos a Verificar Mais Detalhadamente

### 6.1 Componentes Duplicados

#### ❌ `components/modals/driver-modal.tsx`
**Status:** NÃO UTILIZADO (DUPLICADO)

**Análise:**
- Arquivo duplicado de `motorista-modal.tsx`
- Ambos exportam `MotoristaModal` com mesma funcionalidade
- `driver-modal.tsx` nunca é importado
- `motorista-modal.tsx` é usado em 2 lugares

**Recomendação:** REMOVER `driver-modal.tsx` - é duplicado e não utilizado.

---

## 7. Priorização de Remoção

### Alta Prioridade (Remover Imediatamente)
1. ✅ `components/performance-monitor.tsx` - Componente removido do uso (290 linhas)
2. ✅ `components/modals/driver-modal.tsx` - Duplicado, nunca importado (564 linhas)
3. ✅ `lib/cqrs/bus/register-handlers.ts` - Função `registerAllHandlers` vazia (remover função apenas)

### Média Prioridade (Verificar e Remover)
1. ⚠️ `components/view-transition.tsx` - Componentes `ViewTransitionLink` e `ViewTransitionButton` (remover apenas componentes, manter hook)
2. ⚠️ `lib/api/fetch-with-error-handling.ts` - Função `fetchWithLoading` (função criada recentemente, pode ser útil no futuro)

### Baixa Prioridade (Limpeza de Comentários)
1. ⚠️ `components/admin-map/admin-map.tsx` - Remover comentário obsoleto linha 153
2. ⚠️ `components/advanced-route-map.tsx` - Remover comentários sobre PerformanceMonitor removido

### Baixa Prioridade (Manter por enquanto)
1. ⚠️ Comentários explicativos úteis
2. ⚠️ Código que pode ser usado no futuro

---

## 8. Ações Realizadas

1. ✅ Validar falsos positivos - Concluído
2. ✅ Executar ESLint para imports não utilizados - Concluído (~30+ imports identificados)
3. ✅ Remover código confirmado como não utilizado - Concluído
4. ✅ Verificar build após remoção - Build passou com sucesso ✓

### Código Removido:
- ✅ `components/performance-monitor.tsx` (290 linhas)
- ✅ `components/modals/driver-modal.tsx` (564 linhas)
- ✅ `components/view-transition.tsx` - Componentes `ViewTransitionLink` e `ViewTransitionButton` (mantido apenas re-export do hook)
- ✅ `lib/cqrs/bus/register-handlers.ts` - Função `registerAllHandlers` vazia
- ✅ Comentários obsoletos removidos de `admin-map.tsx` e `advanced-route-map.tsx`

### Próximos Passos (Opcional):
- Remover imports não utilizados identificados pelo ESLint (pode ser feito incrementalmente)
- Considerar remover `fetchWithLoading` se não for usada no futuro

---

## 9. Métricas Alcançadas

- **Componentes removidos:** 2 arquivos completos (854 linhas)
- **Funções removidas:** 3 funções/componentes
- **Imports não utilizados identificados:** ~30+ (para remoção futura)
- **Comentários limpos:** 3 comentários obsoletos removidos
- **Redução de código:** ~854 linhas removidas
- **Build status:** ✅ Passou com sucesso após remoção
- **Lint status:** ✅ Sem erros após remoção

