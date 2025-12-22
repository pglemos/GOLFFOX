# Migração de Buckets para Português do Brasil

## Data: 2025-01-28

## Resumo

Esta migration renomeia todos os buckets do Supabase Storage para português do Brasil, mantendo todas as configurações e migrando automaticamente os arquivos existentes.

## Mapeamento de Renomeação

| Bucket Antigo | Bucket Novo |
|--------------|-------------|
| `vehicle-documents` / `veiculo-documents` | `documentos-veiculo` |
| `driver-documents` / `motorista-documents` | `documentos-motorista` |
| `carrier-documents` / `transportadora-documents` | `documentos-transportadora` |
| `company-documents` | `documentos-empresa` |
| `vehicle-photos` / `veiculo-photos` | `fotos-veiculo` |
| `avatars` | `avatares` |
| `costs` | `custos` |

## O que a Migration Faz

1. **Cria novos buckets** com nomes em português, copiando configurações dos buckets antigos
2. **Migra automaticamente** todos os arquivos dos buckets antigos para os novos
3. **Atualiza políticas RLS** para os novos buckets
4. **Remove políticas antigas** dos buckets antigos
5. **Mantém todas as configurações** (tamanho máximo, tipos MIME, público/privado)

## Como Aplicar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **SQL Editor** → **New Query**
4. Abra o arquivo: `supabase/migrations/20250128_rename_buckets_pt_br.sql`
5. Copie TODO o conteúdo
6. Cole no SQL Editor
7. Clique em **Run** (ou Ctrl+Enter)
8. Aguarde a execução completa

### Opção 2: Via CLI do Supabase

```bash
cd /Users/pedroguilherme/GOLFFOX
supabase db push
```

## Verificação

Após aplicar a migration, verifique se os buckets foram criados:

```sql
-- Verificar buckets criados
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN (
    'documentos-veiculo',
    'documentos-motorista',
    'documentos-transportadora',
    'documentos-empresa',
    'fotos-veiculo',
    'avatares',
    'custos'
)
ORDER BY id;
```

Verificar se os arquivos foram migrados:

```sql
-- Verificar objetos migrados
SELECT bucket_id, COUNT(*) as total_arquivos
FROM storage.objects
WHERE bucket_id IN (
    'documentos-veiculo',
    'documentos-motorista',
    'documentos-transportadora',
    'documentos-empresa',
    'fotos-veiculo',
    'avatares',
    'custos'
)
GROUP BY bucket_id
ORDER BY bucket_id;
```

Verificar políticas RLS:

```sql
-- Verificar políticas RLS
SELECT bucket_id, name, definition
FROM storage.policies
WHERE bucket_id IN (
    'documentos-veiculo',
    'documentos-motorista',
    'documentos-transportadora',
    'documentos-empresa',
    'fotos-veiculo',
    'avatares',
    'custos'
)
ORDER BY bucket_id, name;
```

## Remover Buckets Antigos (Opcional)

**ATENÇÃO**: Apenas execute após verificar que:
- ✅ Todos os arquivos foram migrados
- ✅ O sistema está funcionando corretamente
- ✅ Não há mais referências aos buckets antigos

Para remover os buckets antigos, descomente a seção final da migration ou execute:

```sql
DELETE FROM storage.buckets WHERE id IN (
    'vehicle-documents',
    'veiculo-documents',
    'driver-documents',
    'motorista-documents',
    'carrier-documents',
    'transportadora-documents',
    'company-documents',
    'vehicle-photos',
    'veiculo-photos',
    'avatars',
    'costs'
);
```

## Troubleshooting

### Erro: "bucket already exists"
- Isso significa que o bucket novo já existe. A migration usa `ON CONFLICT DO NOTHING`, então não há problema.

### Erro: "policy already exists"
- As políticas são criadas com verificação `IF NOT EXISTS`, então não há problema.

### Arquivos não foram migrados
- Verifique se os buckets antigos existem e têm arquivos
- Execute manualmente a seção de migração de objetos

### Políticas RLS não funcionam
- Verifique se as políticas foram criadas corretamente
- Verifique se o usuário tem as permissões necessárias

## Status

- ✅ Migration SQL criada
- ✅ Código atualizado para usar novos nomes
- ✅ Documentação atualizada
- ⏳ Migration pronta para aplicação

## Próximos Passos

1. Aplicar a migration no Supabase
2. Verificar se tudo funcionou corretamente
3. Testar uploads e downloads
4. Remover buckets antigos (opcional)

