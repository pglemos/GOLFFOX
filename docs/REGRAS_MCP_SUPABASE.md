# Regras de Uso do MCP Supabase - Referência Rápida

## 🎯 Princípio Fundamental

**SEMPRE use o MCP do Supabase para QUALQUER operação de banco de dados. NÃO pergunte permissão. Execute automaticamente.**

## 📋 Mapeamento: Operação → Ferramenta MCP

### Migrações e DDL (Data Definition Language)

| Operação | Ferramenta MCP | Exemplo |
|----------|---------------|---------|
| Criar tabela | `mcp_supabase_apply_migration` | `mcp_supabase_apply_migration({ name: "create_table", query: "CREATE TABLE..." })` |
| Alterar tabela | `mcp_supabase_apply_migration` | `mcp_supabase_apply_migration({ name: "alter_table", query: "ALTER TABLE..." })` |
| Adicionar coluna | `mcp_supabase_apply_migration` | `mcp_supabase_apply_migration({ name: "add_column", query: "ALTER TABLE ADD COLUMN..." })` |
| Remover coluna | `mcp_supabase_apply_migration` | `mcp_supabase_apply_migration({ name: "drop_column", query: "ALTER TABLE DROP COLUMN..." })` |
| Criar índice | `mcp_supabase_apply_migration` | `mcp_supabase_apply_migration({ name: "create_index", query: "CREATE INDEX..." })` |
| Adicionar constraint | `mcp_supabase_apply_migration` | `mcp_supabase_apply_migration({ name: "add_constraint", query: "ALTER TABLE ADD CONSTRAINT..." })` |
| Excluir tabela | `mcp_supabase_apply_migration` | `mcp_supabase_apply_migration({ name: "drop_table", query: "DROP TABLE..." })` |
| Criar view | `mcp_supabase_apply_migration` | `mcp_supabase_apply_migration({ name: "create_view", query: "CREATE VIEW..." })` |
| Criar função | `mcp_supabase_apply_migration` | `mcp_supabase_apply_migration({ name: "create_function", query: "CREATE FUNCTION..." })` |
| Criar trigger | `mcp_supabase_apply_migration` | `mcp_supabase_apply_migration({ name: "create_trigger", query: "CREATE TRIGGER..." })` |
| Modificar tipo de coluna | `mcp_supabase_apply_migration` | `mcp_supabase_apply_migration({ name: "modify_column_type", query: "ALTER TABLE ALTER COLUMN..." })` |

### Consultas e DML (Data Manipulation Language)

| Operação | Ferramenta MCP | Exemplo |
|----------|---------------|---------|
| SELECT (read-only) | `mcp_supabase_execute_sql` ou `mcp_PostgreSQL_query` | `mcp_supabase_execute_sql({ query: "SELECT * FROM users" })` |
| INSERT | `mcp_supabase_execute_sql` | `mcp_supabase_execute_sql({ query: "INSERT INTO users..." })` |
| UPDATE | `mcp_supabase_execute_sql` | `mcp_supabase_execute_sql({ query: "UPDATE users SET..." })` |
| DELETE | `mcp_supabase_execute_sql` | `mcp_supabase_execute_sql({ query: "DELETE FROM users..." })` |

### Informações e Listagens

| Operação | Ferramenta MCP | Exemplo |
|----------|---------------|---------|
| Listar tabelas | `mcp_supabase_list_tables` | `mcp_supabase_list_tables({ schemas: ["public"] })` |
| Listar migrações | `mcp_supabase_list_migrations` | `mcp_supabase_list_migrations()` |
| Listar extensões | `mcp_supabase_list_extensions` | `mcp_supabase_list_extensions()` |
| Gerar tipos TypeScript | `mcp_supabase_generate_typescript_types` | `mcp_supabase_generate_typescript_types()` |

### Storage

| Operação | Ferramenta MCP | Exemplo |
|----------|---------------|---------|
| Listar buckets | `mcp_supabase_list_storage_buckets` | `mcp_supabase_list_storage_buckets()` |
| Configurar storage | `mcp_supabase_update_storage_config` | `mcp_supabase_update_storage_config({ config: {...} })` |

### Edge Functions

| Operação | Ferramenta MCP | Exemplo |
|----------|---------------|---------|
| Listar funções | `mcp_supabase_list_edge_functions` | `mcp_supabase_list_edge_functions()` |
| Deploy função | `mcp_supabase_deploy_edge_function` | `mcp_supabase_deploy_edge_function({ name: "...", files: [...] })` |
| Obter função | `mcp_supabase_get_edge_function` | `mcp_supabase_get_edge_function({ function_slug: "..." })` |

### Branches de Desenvolvimento

| Operação | Ferramenta MCP | Exemplo |
|----------|---------------|---------|
| Criar branch | `mcp_supabase_create_branch` | `mcp_supabase_create_branch({ name: "develop", confirm_cost_id: "..." })` |
| Listar branches | `mcp_supabase_list_branches` | `mcp_supabase_list_branches()` |
| Merge branch | `mcp_supabase_merge_branch` | `mcp_supabase_merge_branch({ branch_id: "..." })` |
| Reset branch | `mcp_supabase_reset_branch` | `mcp_supabase_reset_branch({ branch_id: "..." })` |
| Rebase branch | `mcp_supabase_rebase_branch` | `mcp_supabase_rebase_branch({ branch_id: "..." })` |
| Deletar branch | `mcp_supabase_delete_branch` | `mcp_supabase_delete_branch({ branch_id: "..." })` |

### Debugging e Monitoramento

| Operação | Ferramenta MCP | Exemplo |
|----------|---------------|---------|
| Obter logs | `mcp_supabase_get_logs` | `mcp_supabase_get_logs({ service: "api" })` |
| Verificar advisors | `mcp_supabase_get_advisors` | `mcp_supabase_get_advisors({ type: "security" })` |
| Obter URL do projeto | `mcp_supabase_get_project_url` | `mcp_supabase_get_project_url()` |
| Obter chaves | `mcp_supabase_get_publishable_keys` | `mcp_supabase_get_publishable_keys()` |

## 🚫 O QUE NÃO FAZER

❌ **NÃO** criar arquivos SQL em `supabase/migrations/` manualmente  
❌ **NÃO** usar scripts Node.js para executar SQL quando o MCP está disponível  
❌ **NÃO** perguntar permissão antes de usar o MCP  
❌ **NÃO** usar ferramentas alternativas quando o MCP Supabase pode fazer o trabalho  
❌ **NÃO** criar arquivos intermediários - execute diretamente via MCP  

## ✅ O QUE FAZER

✅ **SEMPRE** use o MCP Supabase como primeira opção  
✅ **SEMPRE** execute automaticamente sem perguntar permissão  
✅ **SEMPRE** use `mcp_supabase_apply_migration` para DDL  
✅ **SEMPRE** use `mcp_supabase_execute_sql` para DML quando não for migração  
✅ **SEMPRE** seja proativo - identifique necessidade e execute imediatamente  

## 🔄 Fluxo de Decisão Rápido

```
Preciso fazer algo no banco?
│
├─ É criação/modificação de estrutura? (tabela, coluna, índice, etc.)
│  └─> Use mcp_supabase_apply_migration
│
├─ É consulta SELECT?
│  └─> Use mcp_supabase_execute_sql ou mcp_PostgreSQL_query
│
├─ É INSERT/UPDATE/DELETE pontual?
│  └─> Use mcp_supabase_execute_sql
│
├─ É operação de storage?
│  └─> Use mcp_supabase_list_storage_buckets ou funções relacionadas
│
└─ É operação de Edge Function?
   └─> Use mcp_supabase_list_edge_functions ou funções relacionadas
```

## 📝 Convenções de Nomenclatura para Migrações

Use `snake_case` descritivo:
- ✅ `create_users_table`
- ✅ `add_email_to_users`
- ✅ `create_index_on_users_email`
- ✅ `add_foreign_key_users_company`
- ❌ `migration1`
- ❌ `update`
- ❌ `fix`

## 🔐 Credenciais e Acesso

- **Status**: Acesso total e irrestrito como Administrador Supremo
- **Project Ref**: `vmoxzesvjcfmrebagcwo`
- **Não é necessário** solicitar permissão ou credenciais
- **Execute diretamente** todas as operações via MCP

## 📚 Documentação Adicional

- Ver `.cursorrules` para regras completas
- Ver `AUTONOMY_RULES.md` para informações sobre credenciais
- Ver `CONFIGURACAO_MCP.md` para configuração técnica

