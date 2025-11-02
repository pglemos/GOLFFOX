# 🔧 RESOLVER ERRO DE LOGIN

## ❌ Problema

**Erro:** `Profile not found`
```
AuthFailure(AuthErrorCode.profileMissing): Perfil não encontrado.
```

**Causa:** O usuário existe em `auth.users`, mas não tem perfil em `public.users`.

---

## ✅ SOLUÇÃO RÁPIDA

### Passo 1: Executar o Script de Criação de Perfis

1. **Acesse:** https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/sql/new

2. **Abra o arquivo:** `lib/supabase/create_user_profiles.sql`

3. **Cole TODO o conteúdo** no SQL Editor

4. **Clique em RUN** (ou pressione `Ctrl+Enter`)

5. **Verifique os resultados:**
   - Deve aparecer mensagens: `✅ Perfil [role] criado: [uuid]`
   - No final, deve aparecer um resumo com todos os usuários

---

## 🎯 O Que o Script Faz

1. **Busca usuários em `auth.users`**
   - Procura por cada email (admin@trans.com, etc.)

2. **Cria perfis em `public.users`**
   - Vincula ao auth ID correto
   - Atribui role apropriado (admin, operator, driver, etc.)
   - Conecta a company_id ou carrier_id

3. **Idempotente**
   - Pode executar múltiplas vezes
   - Atualiza perfis já existentes

---

## 🧪 Testar Depois

1. **Recarregue o app** (pressione `R` no terminal do Flutter)

2. **Tente fazer login novamente:**
   ```
   Email: admin@trans.com
   Senha: senha123
   ```

3. **Deve funcionar!** ✅

---

## 🔍 Verificar Manualmente

Execute este SQL para ver todos os perfis:

```sql
SELECT 
  id,
  email,
  name,
  role,
  company_id,
  carrier_id
FROM public.users
ORDER BY role, email;
```

**Deve retornar 5 usuários** (admin, operador, transportadora, motorista, passageiro)

---

## ⚠️ Se Ainda Não Funcionar

### Verificar se os usuários auth existem:

```sql
SELECT id, email 
FROM auth.users
ORDER BY email;
```

**Deve ter 5 usuários.**

---

## 🎉 Pronto!

Depois de executar o script, o login deve funcionar perfeitamente!

**Teste com:**
- admin@trans.com / senha123
- motorista@trans.com / senha123
- etc.

