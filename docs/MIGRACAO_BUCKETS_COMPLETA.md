# ✅ Migração de Buckets para Português BR - COMPLETA

## Data: 2025-01-28

## Status da Migração

### ✅ Concluído

1. **Buckets Criados via API** ✅
   - ✅ `documentos-veiculo` (privado, 10MB)
   - ✅ `documentos-motorista` (privado, 10MB)
   - ✅ `documentos-transportadora` (privado, 10MB)
   - ✅ `documentos-empresa` (privado, 10MB)
   - ✅ `fotos-veiculo` (público, sem limite)
   - ✅ `avatares` (público, 5MB)
   - ✅ `custos` (privado, 10MB)

2. **Código Atualizado** ✅
   - Todos os arquivos do código foram atualizados para usar os novos nomes

3. **Arquivos Migrados** ✅
   - Nenhum arquivo encontrado nos buckets antigos (estavam vazios)

### ⏳ Pendente

**Políticas RLS** - Requer execução via SQL

## Como Aplicar Políticas RLS

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **SQL Editor** → **New Query**
4. Abra o arquivo: `supabase/migrations/20250128_create_bucket_policies_pt_br.sql`
5. Copie TODO o conteúdo
6. Cole no SQL Editor
7. Clique em **Run** (ou Ctrl+Enter)

### Opção 2: Via Script (se DATABASE_URL configurado)

```bash
# Configure DATABASE_URL no .env.local
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Execute o script
node scripts/apply-bucket-policies-direct.js
```

### Opção 3: Via Supabase CLI

```bash
# Se tiver Supabase CLI instalado
supabase db push
```

## Verificação

Após aplicar as políticas RLS, verifique:

```sql
-- Verificar políticas criadas
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%avatares%'
   OR policyname LIKE '%documentos%'
   OR policyname LIKE '%fotos%'
   OR policyname LIKE '%custos%'
ORDER BY policyname;
```

## Arquivos da Migração

- ✅ `supabase/migrations/20250128_create_bucket_policies_pt_br.sql` - Políticas RLS (corrigido)
- ✅ `supabase/migrations/20250128_rename_buckets_pt_br.sql` - Migration completa
- ✅ `scripts/create-buckets-pt-br-via-api.js` - Criar buckets via API
- ✅ `scripts/migrate-bucket-objects-via-api.js` - Migrar arquivos
- ✅ `scripts/apply-bucket-policies-direct.js` - Aplicar políticas via SQL
- ✅ `scripts/apply-complete-buckets-migration-autonomous.js` - Script completo autônomo

## Correções Aplicadas

- ✅ Corrigido erro `storage.policies does not exist`
- ✅ Substituído por `pg_policies` (view do sistema)
- ✅ Usado `DROP POLICY IF EXISTS` em vez de `DELETE FROM`
- ✅ Verificação de políticas usando `pg_policies`

## Próximos Passos

1. ✅ Buckets criados
2. ⏳ Aplicar políticas RLS (via SQL)
3. ⏳ Testar uploads e downloads
4. ⏳ Remover buckets antigos (opcional)

## Nota Importante

A migration foi corrigida para usar `pg_policies` em vez de `storage.policies` (que não existe). Todas as verificações de políticas agora usam a view `pg_policies` do PostgreSQL.

