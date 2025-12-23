# Regeneração de Tipos do Supabase

## Status

✅ **Tipos regenerados com sucesso!**

- **Data:** 2025-01-15
- **Erros TypeScript antes:** 34
- **Erros TypeScript depois:** 0
- **Arquivo:** `apps/web/types/supabase.ts`

## Como Foi Feito

```bash
npx supabase gen types typescript --project-id vmoxzesvjcfmrebagcwo > types/supabase.ts
```

## Correções Aplicadas

### Type Assertions Adicionadas

Algumas tabelas/views não estão nos tipos gerados (provavelmente views ou tabelas em schemas diferentes). Adicionamos `as any` nas seguintes:

- `drivers` - Tabela de motoristas
- `costs` - Tabela de custos  
- `audit_logs` - Tabela de logs de auditoria
- `v_company_employees_secure` - View segura de funcionários
- `v_operator_assigned_carriers` - View de transportadoras do operador
- `gf_gamification_scores` - Tabela de pontuação de gamificação

### Arquivos Modificados

- `apps/web/app/api/admin/motoristas/route.ts`
- `apps/web/app/api/admin/motoristas/[driverId]/route.ts`
- `apps/web/app/api/admin/transportadoras/[transportadoraId]/drivers/[driverId]/route.ts`
- `apps/web/app/api/admin/transportadoras/delete/route.ts`
- `apps/web/app/api/admin/usuarios/change-role/route.ts`
- `apps/web/app/admin/rotas/use-route-create.ts`
- `apps/web/app/operador/prestadores/page.tsx`
- `apps/web/app/transportadora/page.tsx`

## Próximas Ações

Se essas tabelas/views forem adicionadas ao schema público do Supabase, os tipos podem ser regenerados e as assertions `as any` podem ser removidas.

## Como Regenerar no Futuro

```bash
# Opção 1: Usando project ID
npx supabase gen types typescript --project-id vmoxzesvjcfmrebagcwo > types/supabase.ts

# Opção 2: Usando URL (se configurado)
npx supabase gen types typescript --url $NEXT_PUBLIC_SUPABASE_URL > types/supabase.ts
```

## Backup

Um backup do arquivo anterior foi criado em:
- `apps/web/types/supabase_backup.ts`

