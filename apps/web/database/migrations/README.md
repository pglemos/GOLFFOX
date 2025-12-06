# Sistema de Migrations Versionadas - GolfFox

Este diretório contém todas as migrations SQL do banco de dados com controle de versão.

## Como Funciona

O sistema de migrations versionadas garante que:
- Cada migration é aplicada apenas uma vez
- O histórico de migrations aplicadas é rastreado
- Migrations podem ser executadas em qualquer ordem (baseado no nome do arquivo)
- Rollback manual é possível consultando a tabela `schema_migrations`

## Estrutura de Arquivos

As migrations devem seguir o padrão de nomenclatura:

### Formato 1: Timestamp (Recomendado)
```
YYYYMMDD_HHMMSS_description.sql
```
Exemplo: `20250115_143022_add_user_roles.sql`

### Formato 2: Numérico (Compatibilidade)
```
001_description.sql
002_description.sql
```
Exemplo: `001_initial_schema.sql`, `002_missing_schema.sql`

## Executando Migrations

### Via Script NPM (Recomendado)
```bash
npm run db:migrate
```

### Via Script Direto
```bash
ts-node scripts/migrate.ts
```

## Tabela de Controle

A tabela `schema_migrations` armazena:
- `version`: Identificador único da migration (extraído do nome do arquivo)
- `name`: Nome completo do arquivo
- `applied_at`: Timestamp de quando foi aplicada

## Ordem de Execução

1. **000_schema_migrations.sql** - Cria tabela de controle (sempre primeiro)
2. **001_initial_schema.sql** - Schema inicial
3. **002_missing_schema.sql** - Correções e adições
4. Outras migrations em ordem alfabética/numerica

## Boas Práticas

1. **Sempre teste localmente** antes de aplicar em produção
2. **Use transações** quando possível (o script já faz isso)
3. **Documente mudanças** em comentários SQL
4. **Não modifique migrations já aplicadas** - crie uma nova migration
5. **Mantenha migrations pequenas** e focadas em uma mudança específica

## Verificando Status

Para ver quais migrations foram aplicadas:

```sql
SELECT * FROM schema_migrations ORDER BY applied_at;
```

## Troubleshooting

### Migration já aplicada mas precisa reexecutar
```sql
-- Remover registro (CUIDADO!)
DELETE FROM schema_migrations WHERE version = 'VERSION_AQUI';
```

### Verificar se migration foi aplicada
```sql
SELECT * FROM schema_migrations WHERE name LIKE '%nome_da_migration%';
```

## Integração CI/CD

O script `migrate.ts` pode ser integrado em pipelines CI/CD:

```yaml
# Exemplo GitHub Actions
- name: Run migrations
  run: npm run db:migrate
  env:
    GF_DB_HOST: ${{ secrets.DB_HOST }}
    GF_DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
```

## Notas Importantes

- O script **não aplica migrations duplicadas** automaticamente
- Erros em uma migration **param a execução** (fail-fast)
- Migrations são executadas **em transação** (rollback automático em erro)
- A tabela `schema_migrations` é criada automaticamente se não existir

