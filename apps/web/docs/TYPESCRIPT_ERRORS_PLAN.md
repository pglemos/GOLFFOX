# Plano de Correção de Erros TypeScript

**Data:** 2025-01-XX  
**Status:** Em Progresso  
**Objetivo:** Remover `ignoreBuildErrors` do `next.config.js`

---

## 📊 Estado Atual

- **Erros iniciais:** 351
- **Erros atuais:** ~154
- **Redução:** 197 erros corrigidos (56%)
- **`ignoreBuildErrors`:** `true` (temporário)

---

## 🎯 Estratégia de Correção

### Fase 1: Erros Críticos (Prioridade Alta) ✅
- ✅ Tipos do Supabase gerados
- ✅ Validação Zod corrigida
- ✅ Imports Next.js corrigidos
- ✅ Tratamento de erros em APIs

### Fase 2: Erros de Tipos (Prioridade Média) ⏳
- ⏳ Corrigir `@ts-expect-error` não utilizados (32 ocorrências)
- ⏳ Corrigir argumentos de tipo incompatível (28 ocorrências)
- ⏳ Corrigir propriedades não existentes (18 ocorrências)

### Fase 3: Erros de Módulos (Prioridade Baixa) ⏳
- ⏳ Corrigir módulos sem membro exportado (16 ocorrências)
- ⏳ Corrigir problemas de overload (12 ocorrências)
- ⏳ Corrigir parâmetros com tipo 'any' implícito (8 ocorrências)

### Fase 4: Outros Erros (Prioridade Baixa) ⏳
- ⏳ Diversos erros menores (40 ocorrências)

---

## 📋 Checklist de Remoção

- [ ] Reduzir erros para < 50
- [ ] Corrigir todos os erros críticos de APIs
- [ ] Corrigir todos os erros de tipos Supabase
- [ ] Testar build completo sem `ignoreBuildErrors`
- [ ] Remover `ignoreBuildErrors` do `next.config.js`
- [ ] Verificar que CI passa sem erros

---

## 🚀 Próximos Passos

1. Executar `npm run type-check` para listar erros atuais
2. Priorizar correção de erros em APIs críticas
3. Regenerar tipos do Supabase se necessário
4. Corrigir erros gradualmente por categoria
5. Remover `ignoreBuildErrors` quando < 20 erros

---

**Última atualização:** 2025-01-XX
