# Migrations - Golf Fox

**Status:** ✅ Todas as migrations criadas e prontas para aplicação

---

## 📋 ORDEM DE APLICAÇÃO

### ⚠️ IMPORTANTE: Aplicar nesta ordem

1. **000_APPLY_ALL_MIGRATIONS.sql** ⭐ **RECOMENDADO**
   - Script consolidado que aplica todas as migrations
   - Ordem correta garantida
   - Aplicar este se quiser aplicar tudo de uma vez

2. **003_rls_helper_functions.sql**
   - Helper functions RLS
   - Pré-requisito para outras migrations

3. **004_canonical_rls_policies.sql**
   - Políticas RLS canônicas
   - Requer: `003_rls_helper_functions.sql`

4. **005_improve_rpc_trip_transition.sql**
   - RPC melhorada com controle de concorrência
   - Requer: `003_rls_helper_functions.sql`

5. **006_trip_summary.sql**
   - Trip Summary com Haversine
   - Requer: Tabelas `trips` e `driver_positions`

6. **008_create_gf_user_company_map.sql**
   - Tabela gf_user_company_map
   - Requer: Tabelas `users` e `companies`

7. **007_consolidate_address_columns.sql** (Opcional)
   - Colunas de endereço
   - Aplicar apenas se colunas ainda não existirem

---

## 🚀 APLICAÇÃO RÁPIDA

### Opção 1: Script Consolidado (Recomendado)

1. Abrir `000_APPLY_ALL_MIGRATIONS.sql`
2. Copiar todo o conteúdo
3. Colar no Supabase SQL Editor
4. Executar

### Opção 2: Migrations Individuais

Aplicar uma por uma na ordem acima.

---

## ✅ VERIFICAÇÃO

Após aplicar, executar queries de verificação em `docs/auditoria/GUIA_APLICACAO_MIGRATIONS.md`

---

## 📚 DOCUMENTAÇÃO

- `docs/auditoria/GUIA_APLICACAO_MIGRATIONS.md` - Guia completo
- `docs/auditoria/MIGRATIONS_CRIADAS.md` - Detalhes das migrations
- `docs/auditoria/CHECKLIST_APLICACAO.md` - Checklist de verificação

---

## ⚠️ NOTAS

- Todas as migrations são **idempotentes** (podem ser executadas múltiplas vezes)
- Ordem de aplicação é **crítica**
- Sempre verificar após aplicação

