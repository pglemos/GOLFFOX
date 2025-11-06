# 🚀 Guia de Execução - Migração v47

## ⚠️ IMPORTANTE: Leia Antes de Executar

Esta migração adiciona colunas essenciais à tabela `vehicles` e configura o storage para fotos de veículos.

## 📋 O Que Será Adicionado

### Colunas na Tabela `vehicles`:
1. **`photo_url`** (TEXT NULL) - URL da foto do veículo
2. **`capacity`** (INTEGER NULL) - Capacidade de passageiros
3. **`is_active`** (BOOLEAN DEFAULT true) - Status ativo/inativo
4. **`company_id`** (UUID NULL) - ID da empresa proprietária

### Storage:
- Bucket `vehicle-photos` para armazenar fotos
- Políticas de acesso (leitura pública, upload autenticado)

### Índices:
- `idx_vehicles_is_active` - Para filtros por status
- `idx_vehicles_company_id` - Para filtros por empresa
- `idx_vehicles_plate` - Para buscas por placa

### Views:
- Atualização da view `v_live_vehicles` com as novas colunas

## 🔧 Passo a Passo para Executar

### 1. Acesse o Supabase SQL Editor

1. Abra seu projeto no Supabase: https://app.supabase.com
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New Query**

### 2. Cole o Script SQL

Copie TODO o conteúdo do arquivo:
```
database/migrations/v47_add_vehicle_columns.sql
```

E cole no editor SQL do Supabase.

### 3. Execute o Script

1. Clique no botão **Run** (ou pressione Ctrl+Enter)
2. Aguarde a execução (deve levar 2-5 segundos)
3. Verifique se aparece a mensagem de sucesso:
   ```
   NOTICE: Migration v47 completed successfully!
   NOTICE: Added columns: photo_url, capacity, is_active, company_id to vehicles table
   NOTICE: Created storage bucket: vehicle-photos
   NOTICE: Updated view: v_live_vehicles
   ```

### 4. Verifique a Execução

Execute estas queries para confirmar:

```sql
-- Verificar colunas adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'vehicles'
AND column_name IN ('photo_url', 'capacity', 'is_active', 'company_id');

-- Verificar índices criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'vehicles'
AND indexname LIKE 'idx_vehicles_%';

-- Verificar bucket de storage
SELECT * FROM storage.buckets WHERE id = 'vehicle-photos';

-- Verificar view atualizada
SELECT * FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'v_live_vehicles';
```

### 5. Resultado Esperado

✅ **Colunas:**
- photo_url: TEXT, nullable
- capacity: INTEGER, nullable
- is_active: BOOLEAN, not null, default true
- company_id: UUID, nullable

✅ **Índices:**
- idx_vehicles_is_active
- idx_vehicles_company_id
- idx_vehicles_plate

✅ **Storage:**
- Bucket: vehicle-photos (público)
- 4 políticas de acesso configuradas

✅ **View:**
- v_live_vehicles atualizada com novas colunas

## 🔄 Após a Execução

### 1. Remover Proteções do Código

Agora que as colunas existem no banco, você pode remover as proteções do código:

#### `web-app/components/modals/vehicle-modal.tsx`
```typescript
// ANTES (com proteção):
const vehicleDataRaw: any = {
  plate: formData.plate,
  model: formData.model,
  year: formData.year ? parseInt(formData.year as string) : null,
  prefix: formData.prefix || null,
  // NÃO incluir: company_id, capacity, is_active, photo_url
}

// DEPOIS (sem proteção):
const vehicleDataRaw: any = {
  plate: formData.plate,
  model: formData.model,
  year: formData.year ? parseInt(formData.year as string) : null,
  prefix: formData.prefix || null,
  capacity: formData.capacity ? parseInt(formData.capacity as string) : null,
  is_active: formData.is_active !== undefined ? formData.is_active : true,
  photo_url: photoUrl || null,
  company_id: formData.company_id || null,
}
```

#### `web-app/lib/supabase-sync.ts`
```typescript
// REMOVER estas linhas:
if ('capacity' in mapped) delete mapped.capacity
if ('company_id' in mapped) delete mapped.company_id
if ('is_active' in mapped) delete mapped.is_active
if ('photo_url' in mapped) delete mapped.photo_url
```

#### `web-app/components/admin-map/admin-map.tsx`
```typescript
// ANTES:
let vehiclesQuery = supabase
  .from('vehicles')
  .select(`
    id,
    plate,
    model
  `)

// DEPOIS:
let vehiclesQuery = supabase
  .from('vehicles')
  .select(`
    id,
    plate,
    model,
    capacity,
    is_active,
    photo_url,
    company_id,
    companies!inner(name)
  `)
  .eq('is_active', true)
```

### 2. Restaurar UI

#### `web-app/app/admin/veiculos/page.tsx`
```typescript
// Restaurar exibição de campos:
<div className="flex gap-4 text-sm text-[var(--ink-muted)]">
  <span>Ano: {veiculo.year || "N/A"}</span>
  <span>Capacidade: {veiculo.capacity || "N/A"} lugares</span>
</div>

// Restaurar badge de status:
<Badge variant={veiculo.is_active ? "default" : "secondary"}>
  {veiculo.is_active ? "Ativo" : "Inativo"}
</Badge>

// Restaurar foto:
{veiculo.photo_url && (
  <img 
    src={veiculo.photo_url} 
    alt={veiculo.plate}
    className="w-20 h-20 rounded-lg object-cover border border-[var(--border)]"
  />
)}
```

### 3. Testar Funcionalidades

Execute estes testes:

1. **Criar Veículo:**
   - ✅ Com foto
   - ✅ Com capacidade
   - ✅ Com status ativo/inativo
   - ✅ Com empresa

2. **Editar Veículo:**
   - ✅ Alterar foto
   - ✅ Alterar capacidade
   - ✅ Alterar status
   - ✅ Alterar empresa

3. **Listar Veículos:**
   - ✅ Foto aparece na lista
   - ✅ Capacidade aparece
   - ✅ Status aparece
   - ✅ Filtro por empresa funciona

4. **Excluir Veículo:**
   - ✅ Foto é removida do storage
   - ✅ Veículo é removido do banco

## ⚠️ Rollback (Se Necessário)

Se algo der errado, execute este script para reverter:

```sql
-- Remover colunas
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS photo_url;
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS capacity;
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS is_active;
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS company_id;

-- Remover índices
DROP INDEX IF EXISTS idx_vehicles_is_active;
DROP INDEX IF EXISTS idx_vehicles_company_id;
DROP INDEX IF EXISTS idx_vehicles_plate;

-- Remover bucket (CUIDADO: apaga todas as fotos!)
DELETE FROM storage.buckets WHERE id = 'vehicle-photos';

-- Recriar view antiga (se necessário)
-- [Cole aqui a versão antiga da view v_live_vehicles]
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase
2. Confirme que você tem permissões de admin
3. Verifique se há dados existentes que possam causar conflito
4. Entre em contato com o suporte

## ✅ Checklist Final

- [ ] Backup do banco de dados realizado
- [ ] Script SQL executado com sucesso
- [ ] Colunas verificadas
- [ ] Índices verificados
- [ ] Storage verificado
- [ ] View verificada
- [ ] Proteções removidas do código
- [ ] UI restaurada
- [ ] Testes realizados
- [ ] Deploy realizado
- [ ] Produção verificada

---

**Data de Criação:** 2025-01-06  
**Versão:** 1.0.0  
**Autor:** Equipe GOLF FOX

