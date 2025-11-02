# START HERE - GolfFox v7.4

## Rápido: o que fazer agora

### 1) Execute o SQL Migration (5 min)
```
- Arquivo: lib/supabase/migration_complete_v74.sql
- Link: https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/sql/new

1. Abra o link acima
2. Cole TODO o conteúdo de migration_complete_v74.sql
3. Clique em RUN (Ctrl+Enter)
4. Verifique se executou sem erros
```

### 2) Crie os usuários (10 min)
```
- Link: https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/auth/users

Para cada usuário, clique em "Add User" (marque Email confirmed):
- golffox@admin.com (senha: senha123)
- operador@empresa.com (senha: senha123)
- transportadora@trans.com (senha: senha123)
- motorista@trans.com (senha: senha123)
- passageiro@empresa.com (senha: senha123)
```

### 3) Pegue os IDs e ajuste seeds (5 min)
```sql
-- Execute no SQL Editor:
SELECT id, email FROM auth.users WHERE email IN (
  'golffox@admin.com',
  'operador@empresa.com',
  'transportadora@trans.com',
  'motorista@trans.com',
  'passageiro@empresa.com'
);

-- Copie os IDs e substitua em lib/supabase/seeds_v74.sql
-- Depois execute os seeds no SQL Editor
```

### 4) Ative Realtime (1 min)
```
- Link: https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/database/replication

Ative o toggle para "driver_positions" e salve.
```

### 5) Teste o Flutter (2 min)
```bash
flutter run
# Login: motorista@trans.com / senha123
```

---

## Arquivos prontos

- Migration SQL: lib/supabase/migration_complete_v74.sql
- Seeds: lib/supabase/seeds_v74.sql
- Código Flutter: configurado e pronto
- Credenciais: já inseridas no código

---

## Links rápidos

| O que fazer      | Link                                                                 |
|------------------|----------------------------------------------------------------------|
| Executar SQL     | https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/sql/new |
| Criar usuários   | https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/auth/users |
| Ativar Realtime  | https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/database/replication |
| Ver logs         | https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/logs |

---

## Se algo não funcionar

1. Erro no SQL: veja logs → https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/logs/postgres
2. Não consegue fazer login: confirme se o usuário existe em `public.users`
3. Realtime não funciona: confirme que está ativo em Replication

---

## Depois dos 5 passos

O sistema GolfFox v7.4 fica 100% funcional. Veja também `IMPLEMENTATION_COMPLETE.md`.

