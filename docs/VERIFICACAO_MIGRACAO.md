# ✅ Verificação da Migração de Buckets

## Status Atual

### ✅ Concluído

1. **Buckets Criados** ✅
   - ✅ `documentos-veiculo` (privado, 10MB)
   - ✅ `documentos-motorista` (privado, 10MB)
   - ✅ `documentos-transportadora` (privado, 10MB)
   - ✅ `documentos-empresa` (privado, 10MB)
   - ✅ `fotos-veiculo` (público, sem limite)
   - ✅ `avatares` (público, 5MB)
   - ✅ `custos` (privado, 10MB)

2. **Código Atualizado** ✅
   - ✅ Todas as referências no código foram atualizadas
   - ✅ Nenhuma referência a buckets antigos encontrada

### ⚠️ Pendente

1. **Políticas RLS** ⏳
   - Status: Não verificadas (hostname não resolve no DNS)
   - Ação: Execute a migration SQL no Supabase Dashboard
   - Arquivo: `supabase/migrations/20250128_create_bucket_policies_pt_br.sql`

2. **Buckets Antigos** ⏳
   - 7 buckets antigos ainda existem (podem ser removidos após verificar que tudo funciona)
   - Buckets antigos: `vehicle-documents`, `driver-documents`, `carrier-documents`, `company-documents`, `vehicle-photos`, `avatars`, `costs`

## Como Verificar Políticas RLS

Execute no Supabase SQL Editor:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND (
    policyname LIKE '%avatares%'
    OR policyname LIKE '%documentos%'
    OR policyname LIKE '%fotos%'
    OR policyname LIKE '%custos%'
)
ORDER BY policyname;
```

**Esperado:** 22 políticas

## Como Remover Buckets Antigos

⚠️ **ATENÇÃO:** Remova apenas após verificar que tudo está funcionando!

Execute no Supabase SQL Editor:

```sql
DELETE FROM storage.buckets WHERE id IN (
    'vehicle-documents',
    'driver-documents',
    'carrier-documents',
    'company-documents',
    'vehicle-photos',
    'avatars',
    'costs'
);
```

## Scripts Disponíveis

- `scripts/verify-buckets-migration.js` - Verificação completa
- `scripts/fix-missing-policies.js` - SQL para corrigir políticas faltantes
- `scripts/apply-bucket-policies-direct.js` - Aplicar políticas via PostgreSQL

## Próximos Passos

1. ✅ Buckets criados
2. ⏳ Verificar/executar políticas RLS
3. ⏳ Testar uploads e downloads
4. ⏳ Remover buckets antigos (opcional)

