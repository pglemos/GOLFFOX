# Relatório de Políticas – Migration v49 (gf_user_company_map)

## Resultado da Aplicação
- Execução: `node web-app\scripts\apply-v49-direct.js`
- Conexão: Supabase (SSL, schema public)
- Status: Migration aplicada e verificada

## Políticas Detectadas
- admin_manage_user_companies (ALL)
- delete_self_company (DELETE)
- insert_self_company (INSERT)
- select_own_map (SELECT)
- update_self_company (UPDATE)
- user_own_mappings (SELECT)
- user_select_own_companies (SELECT)

## Row Level Security
- RLS habilitado: SIM

## Observações
- Reexecução do script retorna erro esperado de política já existente (`42710`).
- SQL base em `database/migrations/v49_protect_user_company_map.sql`.
