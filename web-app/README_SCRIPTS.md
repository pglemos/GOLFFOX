# Scripts de Análise e Manutenção

Este documento descreve os scripts disponíveis para análise, correção e validação do sistema.

---

## 📊 Scripts de Análise

### `analyze-supabase-comprehensive.js`
Analisa completamente a estrutura do Supabase, verificando:
- Estrutura de tabelas e colunas
- Foreign keys e integridade
- Duplicatas e dados inválidos
- RLS policies

**Uso:**
```bash
node scripts/analyze-supabase-comprehensive.js
```

**Saída:**
- `SUPABASE_ANALYSIS_REPORT.json` - Relatório completo em JSON

---

### `analyze-codebase-comprehensive.js`
Analisa o código TypeScript, verificando:
- Erros de TypeScript
- API routes (autenticação, tratamento de erros)
- Hooks e utilitários
- Imports quebrados

**Uso:**
```bash
node scripts/analyze-codebase-comprehensive.js
```

**Saída:**
- `CODEBASE_ANALYSIS_REPORT.json` - Relatório completo em JSON

---

## 🔧 Scripts de Correção

### `fix-all-issues.js`
Corrige automaticamente problemas encontrados no Supabase:
- Adiciona colunas faltantes
- Corrige registros órfãos
- Gera SQL de correção

**Uso:**
```bash
node scripts/fix-all-issues.js
```

**Saída:**
- `FIXES_APPLY.sql` - SQL para aplicar correções manualmente

---

### `fix-nextjs15-params.js`
Corrige rotas dinâmicas para compatibilidade com Next.js 15:
- Converte `params` para `Promise<params>`
- Adiciona `await params` onde necessário

**Uso:**
```bash
node scripts/fix-nextjs15-params.js
```

---

## ✅ Scripts de Validação

### `validate-complete.js`
Validação final completa do sistema:
- Verifica Supabase
- Verifica TypeScript
- Verifica API routes

**Uso:**
```bash
node scripts/validate-complete.js
```

---

### `health-check-complete.js`
Health check rápido do sistema:
- Verifica conexão com Supabase
- Verifica se aplicação está rodando
- Verifica tabelas críticas

**Uso:**
```bash
node scripts/health-check-complete.js
```

---

## 📋 Fluxo Recomendado

### Análise Completa
```bash
# 1. Analisar Supabase
node scripts/analyze-supabase-comprehensive.js

# 2. Analisar código
node scripts/analyze-codebase-comprehensive.js

# 3. Validar tudo
node scripts/validate-complete.js
```

### Correção de Problemas
```bash
# 1. Corrigir problemas do Supabase
node scripts/fix-all-issues.js

# 2. Aplicar SQL gerado (se houver)
# Execute FIXES_APPLY.sql no Supabase SQL Editor

# 3. Corrigir rotas Next.js 15
node scripts/fix-nextjs15-params.js

# 4. Validar correções
node scripts/validate-complete.js
```

### Health Check Diário
```bash
# Verificar saúde do sistema
node scripts/health-check-complete.js
```

---

## 📄 Relatórios Gerados

- `SUPABASE_ANALYSIS_REPORT.json` - Análise completa do Supabase
- `CODEBASE_ANALYSIS_REPORT.json` - Análise completa do código
- `FIXES_APPLY.sql` - SQL de correções (quando necessário)
- `RELATORIO_ANALISE_COMPLETA.md` - Relatório em Markdown

---

## 🔍 Interpretando Resultados

### ✅ Sucesso
- Nenhum problema encontrado
- Sistema funcionando corretamente

### ⚠️ Avisos
- Problemas não críticos
- Não afetam funcionalidade
- Podem ser corrigidos posteriormente

### ❌ Erros
- Problemas críticos
- Requerem correção imediata
- Podem afetar funcionalidade

---

## 💡 Dicas

1. **Execute análises regularmente** para manter o sistema saudável
2. **Revise relatórios JSON** para detalhes completos
3. **Aplique correções gradualmente** testando após cada mudança
4. **Use health check** antes de deploy
5. **Mantenha backups** antes de aplicar correções no banco

---

**Última atualização:** 2025-11-13

