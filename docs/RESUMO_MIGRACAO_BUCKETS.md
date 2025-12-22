# Resumo da Migração de Buckets para Português BR

## ✅ Implementação Completa

### 1. Código Atualizado

Todos os arquivos do código foram atualizados para usar os novos nomes de buckets em português:

- ✅ `apps/web/hooks/use-file-upload.ts` - Tipos TypeScript
- ✅ `apps/web/lib/documents-config.ts` - Configurações
- ✅ `apps/web/app/api/upload/route.ts` - Lista de buckets permitidos
- ✅ `apps/web/app/api/user/upload-avatar/route.ts` - Bucket avatares
- ✅ `apps/web/app/api/transportadora/upload/route.ts` - Bucket documentos-transportadora
- ✅ `apps/web/app/api/transportadora/storage/signed-url/route.ts` - Bucket documentos-transportadora
- ✅ `apps/web/components/modals/motorista-modal.tsx` - Bucket documentos-motorista
- ✅ `apps/web/components/modals/veiculo-modal.tsx` - Bucket fotos-veiculo
- ✅ `apps/web/lib/api/vehicles-api.ts` - Bucket fotos-veiculo
- ✅ `apps/web/components/transportadora/transportadora-legal-rep-section.tsx` - Bucket documentos-transportadora
- ✅ `apps/web/components/costs/cost-form-container.tsx` - Bucket custos
- ✅ `apps/web/__tests__/api/user/upload-avatar.test.ts` - Testes atualizados
- ✅ Documentação atualizada

### 2. Migration SQL Criada

Arquivo: `supabase/migrations/20250128_rename_buckets_pt_br.sql`

A migration faz:
1. ✅ Cria novos buckets em português (copiando configurações dos antigos)
2. ✅ Migra automaticamente todos os arquivos dos buckets antigos para os novos
3. ✅ Remove políticas RLS antigas
4. ✅ Cria políticas RLS para os novos buckets
5. ✅ Mantém todas as configurações (tamanho, tipos MIME, público/privado)

### 3. Scripts Criados

- ✅ `scripts/apply-buckets-migration-direct.js` - Script para aplicar migration automaticamente
- ✅ `docs/MIGRACAO_BUCKETS_PT_BR.md` - Documentação completa da migração

## 🚀 Como Aplicar a Migration

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **SQL Editor** → **New Query**
4. Abra o arquivo: `supabase/migrations/20250128_rename_buckets_pt_br.sql`
5. Copie TODO o conteúdo
6. Cole no SQL Editor
7. Clique em **Run** (ou Ctrl+Enter)
8. Aguarde a execução completa

### Opção 2: Via Script (se DATABASE_URL estiver configurado)

```bash
cd /Users/pedroguilherme/GOLFFOX
node scripts/apply-buckets-migration-direct.js
```

## 📋 Verificação Pós-Migração

Execute estas queries no Supabase SQL Editor para verificar:

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

-- Verificar arquivos migrados
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

## ✅ Checklist Final

- [x] Código atualizado para usar novos nomes
- [x] Migration SQL criada
- [x] Scripts de aplicação criados
- [x] Documentação criada
- [ ] Migration aplicada no Supabase
- [ ] Buckets verificados
- [ ] Arquivos migrados verificados
- [ ] Políticas RLS verificadas
- [ ] Testes de upload/download realizados
- [ ] Buckets antigos removidos (opcional)

## 🎯 Próximos Passos

1. **Aplicar a migration** no Supabase (via Dashboard ou script)
2. **Verificar** se tudo foi criado corretamente
3. **Testar** uploads e downloads no sistema
4. **Remover buckets antigos** (opcional, após confirmar que tudo funciona)

## 📖 Documentação Adicional

- `docs/MIGRACAO_BUCKETS_PT_BR.md` - Guia completo de migração
- `supabase/migrations/20250128_rename_buckets_pt_br.sql` - Migration SQL

## ⚠️ Importante

- A migration é **idempotente** (pode ser executada múltiplas vezes sem problemas)
- Os buckets antigos **não são removidos automaticamente** (comentado na migration)
- Remova os buckets antigos **apenas após confirmar** que tudo está funcionando

