# 🔧 INSTRUÇÕES: Executar Migration v48

## Problema
A criação de login de operador está falhando com o erro:
```
Database error creating new user
```

## Solução
Execute a migration `v48_fix_auth_user_creation.sql` no Supabase SQL Editor.

## Passo a Passo

### 1. Acessar o Supabase SQL Editor
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**

### 2. Executar a Migration
1. Abra o arquivo: `database/migrations/v48_fix_auth_user_creation.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **RUN** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

### 3. Verificar Execução
- Deve aparecer mensagens de sucesso (NOTICE)
- Verifique se não há erros em vermelho
- Se houver erros, leia as mensagens e corrija

### 4. Testar
Após executar a migration, teste novamente:
```bash
node scripts/test-complete-autonomous.js
```

Ou teste manualmente criando um login de operador no sistema.

## O que a Migration Faz

1. **Verifica triggers** em `auth.users`
2. **Verifica funções** relacionadas a usuários
3. **Verifica constraints** em `public.users`
4. **Cria função auxiliar** `safe_create_user_profile` para criar perfis de forma segura
5. **Verifica estrutura** da tabela `users`
6. **Verifica RLS** (Row Level Security)
7. **Cria índices** para melhorar performance

## Troubleshooting

### Se a migration falhar:
1. Verifique os logs do Supabase (Postgres Logs)
2. Verifique se há triggers problemáticos em `auth.users`
3. Verifique se há funções que estão falhando
4. Entre em contato com o suporte do Supabase se necessário

### Se ainda não funcionar após a migration:
1. Verifique os logs do servidor Next.js
2. Verifique os logs do Supabase (Postgres Logs)
3. Tente criar um usuário manualmente via Supabase Dashboard
4. Verifique se há políticas RLS bloqueando

## Arquivo da Migration
📁 `database/migrations/v48_fix_auth_user_creation.sql`

