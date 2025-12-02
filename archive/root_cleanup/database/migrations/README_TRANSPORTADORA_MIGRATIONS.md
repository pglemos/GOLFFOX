# Migrações de Transportadora (carrier → transportadora)

Este documento descreve as migrações necessárias para migrar completamente de `carrier_id` para `transportadora_id` no banco de dados.

## Ordem de Aplicação

As migrações devem ser aplicadas na seguinte ordem:

### 1. v63_fix_gf_costs_transportadora_id.sql
**Objetivo:** Migrar a tabela `gf_costs` de `carrier_id` para `transportadora_id`

**O que faz:**
- Adiciona coluna `transportadora_id` se não existir
- Copia dados de `carrier_id` para `transportadora_id`
- Cria índice em `transportadora_id`
- Remove índice e foreign key antigos
- Remove coluna `carrier_id`

**Status:** Pronta para aplicação

---

### 2. v62_fix_v_costs_secure_transportadora.sql
**Objetivo:** Corrigir a view `v_costs_secure` para usar `transportadora_id`

**O que faz:**
- Remove view antiga `v_costs_secure`
- Recria view usando `transportadora_id` em vez de `carrier_id`
- Suporta tanto `date` quanto `cost_date` para compatibilidade

**Status:** Pronta para aplicação
**Dependência:** Requer que a tabela `gf_costs` já use `transportadora_id` (v63)

---

### 3. v64_fix_drivers_transportadora_id.sql
**Objetivo:** Migrar a tabela `drivers` de `carrier_id` para `transportadora_id` (se existir)

**O que faz:**
- Verifica se a tabela `drivers` existe
- Se existir e tiver `carrier_id`, migra para `transportadora_id`
- Se a tabela não existir, apenas registra no log (motoristas podem estar em `users`)

**Status:** Pronta para aplicação

---

## Como Aplicar

### Via Supabase Dashboard (SQL Editor)

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Navegue até SQL Editor
3. Aplique cada migração na ordem acima

### Via CLI

```bash
# Aplicar migrações em ordem
psql $DATABASE_URL -f database/migrations/v63_fix_gf_costs_transportadora_id.sql
psql $DATABASE_URL -f database/migrations/v62_fix_v_costs_secure_transportadora.sql
psql $DATABASE_URL -f database/migrations/v64_fix_drivers_transportadora_id.sql
```

---

## Verificação

Após aplicar as migrações, execute o script de diagnóstico:

```bash
cd apps/web
node scripts/diagnose-supabase.js
```

O script deve retornar:
- ✅ Tabela `gf_costs` usa `transportadora_id`
- ✅ Tabela `gf_costs` não tem `carrier_id` (migração completa)
- ✅ View `v_costs_secure` existe e é acessível
- ✅ Nenhum problema encontrado

---

## Status das Migrações Anteriores

As seguintes migrações já foram aplicadas anteriormente:
- ✅ v55: Renomeação de `carrier_id` para `transportadora_id` em tabelas principais (`users`, `vehicles`, `routes`)
- ✅ v56-v61: Correções de views, funções RPC e RLS policies para usar `transportadora_id`

---

## Notas Importantes

1. **Compatibilidade:** O código mantém suporte para `carrier_id` durante o período de transição para garantir compatibilidade com APIs existentes.

2. **Tabela `drivers`:** Se a tabela `drivers` não existir no seu banco (motoristas estão na tabela `users` com `role = 'driver'`), a migração v64 apenas registra isso no log e não causa erro.

3. **View `v_costs_secure`:** Esta view é usada pelo endpoint `/api/costs/export` para exportação de custos. Certifique-se de que a migração v63 foi aplicada antes da v62.

---

## Rollback

Se necessário fazer rollback, as migrações são idempotentes e podem ser reaplicadas. Para reverter completamente, seria necessário:

1. Recriar colunas `carrier_id` nas tabelas afetadas
2. Copiar dados de `transportadora_id` para `carrier_id`
3. Reaplicar views e funções antigas

**Recomendação:** Não faça rollback a menos que seja absolutamente necessário. O sistema está funcionando corretamente com `transportadora_id`.

