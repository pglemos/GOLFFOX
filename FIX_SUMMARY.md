# ✅ Correção Aplicada - View v_costs_secure

## Data: 2025-01-27

---

## 🐛 Problema Identificado

No arquivo consolidado `APPLY_TRANSPORTADORA_MIGRATIONS.sql`, a view `v_costs_secure` (PASSO 2, linha 86) estava usando:

```sql
LEFT JOIN public.carriers car ON car.id = COALESCE(c.transportadora_id, c.carrier_id)
```

**Problema:** A migração v63 (PASSO 1) remove a coluna `carrier_id` da tabela `gf_costs` antes da view v62 ser criada. Quando a view tenta referenciar `c.carrier_id`, a coluna não existe mais, causando erro.

---

## ✅ Correção Aplicada

A referência foi corrigida para usar apenas `transportadora_id`:

```sql
LEFT JOIN public.carriers car ON car.id = c.transportadora_id  -- Usa apenas transportadora_id (carrier_id já foi removido na v63)
```

**Razão:** Como a migração v63 remove `carrier_id` antes da view ser criada, não há necessidade de COALESCE. A view deve referenciar apenas `transportadora_id`.

---

## 📋 Verificação

- ✅ Arquivo consolidado corrigido
- ✅ Arquivo individual v62 já estava correto (usa apenas `transportadora_id`)
- ✅ Comentário atualizado para refletir a mudança

---

## 🔍 Arquivos Afetados

- `database/migrations/APPLY_TRANSPORTADORA_MIGRATIONS.sql` - **Corrigido**

**Nota:** O arquivo individual `v62_fix_v_costs_secure_transportadora.sql` já estava correto, usando apenas `c.transportadora_id`.

---

## ✅ Status

**Correção aplicada e commitada.**

A migração consolidada agora funciona corretamente na ordem:
1. v63: Remove `carrier_id` de `gf_costs`
2. v62: Cria view usando apenas `transportadora_id`
3. v64: Migra tabela `drivers` (se existir)

---

**Problema resolvido! ✅**

