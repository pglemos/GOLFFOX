# Migrações Executadas com Sucesso

## Data: 2025-01-11

## Resumo
Todas as migrações SQL necessárias foram executadas com sucesso no banco de dados do Supabase.

## Migrações Executadas

### ✅ 1. Coluna `is_active` na tabela `companies`
- **Status:** Criada com sucesso
- **Tipo:** BOOLEAN DEFAULT true
- **Impacto:** Resolve erros relacionados a `column companies.is_active does not exist`

### ✅ 2. Coluna `cpf` na tabela `users`
- **Status:** Criada com sucesso
- **Tipo:** TEXT (opcional)
- **Índice:** Criado `idx_users_cpf` para busca otimizada
- **Impacto:** Resolve erro `Could not find the 'cpf' column of 'users'` ao criar motoristas

### ✅ 3. View `v_admin_dashboard_kpis`
- **Status:** Criada com sucesso
- **Descrição:** View para KPIs do dashboard administrativo
- **Impacto:** Resolve erros 404 ao acessar KPIs do admin

### ✅ 4. Materialized View `mv_admin_kpis`
- **Status:** Criada com sucesso
- **Descrição:** Materialized view para KPIs do admin (atualizada periodicamente)
- **Índice:** Criado `idx_mv_admin_kpis_unique` na coluna `last_updated`
- **Impacto:** Resolve erros 404 ao acessar KPIs do admin via materialized view

## Permissões Concedidas
- `GRANT SELECT` na view `v_admin_dashboard_kpis` para usuários autenticados
- `GRANT SELECT` na materialized view `mv_admin_kpis` para usuários autenticados

## Testes Afetados

As seguintes correções devem resolver os seguintes testes do TestSprite:

1. **TC008** - Cost Management Budget Creation
   - ✅ Erro 500 no endpoint `/api/costs/categories` (já corrigido no código)
   - ✅ Erro `column companies.is_active does not exist` (resolvido com migração)

2. **TC011** - Driver Mobile App Check-In
   - ✅ Erro `Could not find the 'cpf' column of 'users'` (resolvido com migração)

3. **TC004/TC005** - Admin/Operator Creation
   - ✅ Erros relacionados a `is_active` em `companies` (resolvido com migração)
   - ✅ Erros 404 nas views de KPIs (resolvido com migração)

## Próximos Passos

1. ✅ Migrações executadas
2. ⏭️ Reexecutar testes do TestSprite para validar correções
3. ⏭️ Verificar se todos os problemas foram resolvidos

## Scripts Utilizados

- **Script SQL:** `database/scripts/fix_missing_columns.sql`
- **Script de Execução:** `database/scripts/run_migration.js`
- **Banco de Dados:** Supabase (postgresql://db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres)

## Notas Técnicas

- As views foram ajustadas para usar `EXISTS` ao invés de `JOIN` direto com `trips`, pois a tabela `trips` não possui coluna `company_id` diretamente
- Usado `COALESCE` para tratar valores NULL nas colunas `is_active`
- Todas as operações são idempotentes (podem ser executadas múltiplas vezes sem causar erros)

