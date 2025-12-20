# 🔄 Migração de Tabelas do Supabase para PT-BR

## 📋 Objetivo

Padronizar **100%** os nomes das tabelas do Supabase para nomenclatura PT-BR, alinhando com o código e documentação.

## 🔄 Tabelas a Renomear

### Tabelas Principais

| Inglês (Atual) | Português (Novo) | Status |
|----------------|------------------|--------|
| `carriers` | `transportadoras` | ✅ Migration criada |
| `drivers` | `motoristas` | ⚠️ Verificar se existe como tabela separada |
| `vehicles` | `veiculos` | ✅ Migration criada |
| `passengers` | `passageiros` | ✅ Migration criada |
| `operators` | `operadores` | ⚠️ Verificar se existe |

### Tabelas gf_*

| Inglês (Atual) | Português (Novo) | Status |
|----------------|------------------|--------|
| `gf_carriers` | `gf_transportadoras` | ✅ Migration criada |
| `gf_drivers` | `gf_motoristas` | ✅ Migration criada |
| `gf_vehicles` | `gf_veiculos` | ✅ Migration criada |
| `gf_passengers` | `gf_passageiros` | ✅ Migration criada |
| `gf_operators` | `gf_operadores` | ✅ Migration criada |

## 📝 Migration SQL

**Arquivo:** `supabase/migrations/20250127_rename_all_tables_pt_br.sql`

A migration:
- ✅ Verifica existência antes de renomear (seguro)
- ✅ Mantém automaticamente foreign keys, constraints e índices
- ✅ Usa transações (BEGIN/COMMIT) para rollback seguro
- ✅ Inclui logs informativos

## 🔧 Script de Atualização de Código

**Arquivo:** `scripts/update-all-table-references.js`

O script:
- ✅ Procura todas as referências `.from('tabela')` no código
- ✅ Substitui automaticamente para os nomes PT-BR
- ✅ Processa: `apps/web`, `apps/mobile`
- ✅ Ignora: `node_modules`, `.next`, migrations SQL

## 📋 Passos para Aplicar

### 1. Atualizar Código (Já Feito)

```bash
node scripts/update-all-table-references.js
```

### 2. Aplicar Migration no Supabase

**Opção A: Via Supabase Dashboard**
1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase/migrations/20250127_rename_all_tables_pt_br.sql`
4. Execute

**Opção B: Via Script Autônomo**
```bash
node scripts/apply-migrations-statements.js
```

### 3. Verificar

```bash
# Testar rotas críticas
node scripts/test-all-vercel-routes.js

# Verificar build
cd apps/web && npm run build
```

## ⚠️ Importante

1. **Ordem de Execução:**
   - ✅ Código atualizado primeiro (já feito)
   - ⏳ Migration aplicada no Supabase (próximo passo)
   - ⏳ Testes de validação

2. **Backup:**
   - Fazer backup do banco antes de aplicar migration
   - Testar em ambiente de desenvolvimento primeiro

3. **Dependências:**
   - Views que referenciam essas tabelas precisam ser atualizadas
   - Funções RPC que usam essas tabelas precisam ser atualizadas
   - RLS policies serão mantidas automaticamente

## ✅ Checklist

- [x] Migration SQL criada
- [x] Script de atualização de código criado
- [x] Código atualizado (referências `.from()`)
- [ ] Migration aplicada no Supabase
- [ ] Views atualizadas (se necessário)
- [ ] Funções RPC atualizadas (se necessário)
- [ ] Testes de validação executados
- [ ] Build passando
- [ ] Rotas testadas em produção

## 📊 Estatísticas

- **Tabelas a renomear:** ~10-15
- **Arquivos de código a atualizar:** ~100+
- **Referências `.from()` a substituir:** ~200+

---

**Status:** ✅ Código atualizado | ⏳ Aguardando aplicação da migration no Supabase

