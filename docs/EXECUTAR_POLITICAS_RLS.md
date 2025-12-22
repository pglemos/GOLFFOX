# Executar Políticas RLS - Instruções Finais

## Status

✅ **Buckets criados** - 7/7 buckets em português criados via API
⏳ **Políticas RLS** - Requer execução manual via SQL (por segurança do Supabase)

## Como Executar

### Método 1: Supabase Dashboard (Recomendado)

1. **Acesse:** https://app.supabase.com
2. **Selecione** seu projeto: `vmoxzesvjcfmrebagcwo`
3. **Vá em:** SQL Editor → New Query
4. **Abra o arquivo:** `supabase/migrations/20250128_create_bucket_policies_pt_br.sql`
5. **Copie TODO o conteúdo**
6. **Cole** no SQL Editor
7. **Execute:** Clique em "Run" ou pressione `Ctrl+Enter` (Mac: `Cmd+Enter`)

### Método 2: Via psql (se disponível)

```bash
psql "postgresql://postgres:Guigui1309%40@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres?sslmode=require" -f supabase/migrations/20250128_create_bucket_policies_pt_br.sql
```

### Método 3: Via Supabase CLI

```bash
# Se tiver Supabase CLI instalado
supabase db push
```

## Verificação

Após executar, verifique se as políticas foram criadas:

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

**Esperado:** 22 políticas criadas

## Arquivo da Migration

📄 `supabase/migrations/20250128_create_bucket_policies_pt_br.sql`

Este arquivo está corrigido e pronto para execução:
- ✅ Usa `pg_policies` (não `storage.policies`)
- ✅ Usa `DROP POLICY IF EXISTS` (não `DELETE FROM`)
- ✅ Todas as verificações corrigidas

## Nota

O Supabase não permite execução direta de SQL via REST API por segurança. Por isso, a execução precisa ser feita manualmente via Dashboard ou CLI.

