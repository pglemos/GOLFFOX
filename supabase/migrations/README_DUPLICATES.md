# ⚠️ Migrations Duplicadas - Ação Requerida

## Problema Identificado

As seguintes migrations são **idênticas** e adicionam as mesmas colunas:

1. `20241203_add_address_columns.sql`
2. `20241203_add_missing_columns.sql`

## Solução

Uma migration consolidada foi criada em:
- `apps/web/database/migrations/007_consolidate_address_columns.sql`

## Recomendação

### Opção 1: Manter apenas uma (Recomendado)
- Manter `20241203_add_address_columns.sql`
- Remover ou renomear `20241203_add_missing_columns.sql` para `.sql.bak`

### Opção 2: Usar migration consolidada
- Aplicar `apps/web/database/migrations/007_consolidate_address_columns.sql`
- Remover ambas as migrations duplicadas

## Verificação

Para verificar se as migrations foram aplicadas:

```sql
-- Verificar colunas em users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name LIKE 'address%' OR column_name IN ('cnh', 'cnh_category')
ORDER BY column_name;

-- Verificar colunas em vehicles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'vehicles' 
  AND column_name IN ('chassis', 'renavam', 'color', 'fuel_type', 'vehicle_type', 'carrier_id')
ORDER BY column_name;
```

## Status

- ✅ Migration consolidada criada
- ⏳ Ação manual requerida: Remover ou consolidar migrations duplicadas

