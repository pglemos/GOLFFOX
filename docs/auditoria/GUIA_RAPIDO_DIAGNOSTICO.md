# 🚀 GUIA RÁPIDO - Diagnosticar Problema de Login na Vercel

**Última atualização:** 16/11/2025

---

## 📋 O QUE FAZER AGORA

Siga estes passos **NA ORDEM** para identificar e resolver o problema de login:

---

## PASSO 1: Executar Script de Diagnóstico Automático

Abra o terminal na pasta do projeto e execute:

```bash
cd f:\GOLFFOX\apps\web
node scripts/diagnose-vercel-login.js seu@email.com SuaSenha123
```

**Substitua:**
- `seu@email.com` → seu email real de login
- `SuaSenha123` → sua senha real

### O que o script faz:

✅ Verifica se o servidor Vercel está online  
✅ Testa obtenção de CSRF token  
✅ Tenta fazer login e captura o erro exato  
✅ Fornece solução específica para cada problema  

---

## PASSO 2: Verificar Variáveis de Ambiente na Vercel

### 2.1. Acessar Dashboard da Vercel

1. Abra: https://vercel.com/synvolt/golffox/settings/environment-variables
2. Faça login se necessário

### 2.2. Verificar se EXISTEM estas variáveis:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`

### 2.3. Se NÃO existirem, CRIAR:

#### Como obter os valores corretos:

1. Acesse seu projeto no Supabase: https://supabase.com/dashboard
2. Clique no seu projeto GOLFFOX
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → valor para `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_URL`
   - **anon public** → valor para `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_ANON_KEY`

#### Como adicionar na Vercel:

1. No Vercel Dashboard, clique em **"Add New"** → **"Environment Variable"**
2. Adicione uma por uma:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://seu-projeto.supabase.co
Environments: ✅ Production  ✅ Preview  ✅ Development
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey... (seu token completo)
Environments: ✅ Production  ✅ Preview  ✅ Development
```

```
Name: SUPABASE_URL
Value: https://seu-projeto.supabase.co
Environments: ✅ Production  ✅ Preview  ✅ Development
```

```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey... (seu token completo)
Environments: ✅ Production  ✅ Preview  ✅ Development
```

3. **IMPORTANTE:** Após adicionar todas, clique em **"Redeploy"**

---

## PASSO 3: Verificar Usuário no Banco de Dados Supabase

### 3.1. Acessar SQL Editor do Supabase

1. Abra: https://supabase.com/dashboard
2. Clique no seu projeto GOLFFOX
3. Vá em **SQL Editor** (no menu lateral)

### 3.2. Executar Query de Verificação

Cole e execute este SQL:

```sql
-- Verificar se usuário existe no Auth
SELECT 
  id as user_id, 
  email, 
  confirmed_at,
  created_at,
  CASE 
    WHEN confirmed_at IS NULL THEN '❌ Email não confirmado'
    ELSE '✅ Email confirmado'
  END as status
FROM auth.users 
WHERE email = 'SEU_EMAIL_AQUI';
```

**Substitua `SEU_EMAIL_AQUI` pelo seu email de login**

### 3.3. Verificar se usuário existe na tabela `users`

```sql
-- Verificar se usuário existe na tabela users
SELECT 
  u.id,
  u.email,
  u.role,
  u.is_active,
  CASE 
    WHEN u.is_active = false THEN '❌ Usuário inativo'
    WHEN u.role IS NULL THEN '⚠️ Role não definido'
    ELSE '✅ OK'
  END as status
FROM public.users u
WHERE u.email = 'SEU_EMAIL_AQUI';
```

### 3.4. Se o usuário NÃO existir na tabela `users`:

**Execute este SQL para criar:**

```sql
-- IMPORTANTE: Primeiro pegue o ID do usuário no auth.users (query acima)
-- Substitua 'ID_DO_AUTH_USERS' pelo ID real

INSERT INTO public.users (
  id, 
  email, 
  role, 
  is_active, 
  created_at, 
  updated_at
)
VALUES (
  'ID_DO_AUTH_USERS',  -- ⚠️ SUBSTITUA AQUI
  'seu@email.com',     -- ⚠️ SUBSTITUA AQUI
  'admin',             -- ou 'operator' ou 'carrier'
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  is_active = true,
  role = EXCLUDED.role,
  updated_at = NOW();
```

### 3.5. Se for OPERADOR, verificar empresa associada:

```sql
-- Verificar se operador tem empresa associada
SELECT 
  m.user_id,
  m.company_id,
  c.name as company_name,
  c.is_active as company_active,
  CASE 
    WHEN c.is_active = false THEN '❌ Empresa inativa'
    WHEN m.company_id IS NULL THEN '❌ Sem empresa'
    ELSE '✅ OK'
  END as status
FROM public.users u
LEFT JOIN public.gf_user_company_map m ON m.user_id = u.id
LEFT JOIN public.companies c ON c.id = m.company_id
WHERE u.email = 'SEU_EMAIL_AQUI';
```

**Se não tiver empresa associada:**

```sql
-- Primeiro, liste empresas disponíveis
SELECT id, name, is_active 
FROM companies 
WHERE is_active = true;

-- Depois, associe o usuário a uma empresa
INSERT INTO gf_user_company_map (user_id, company_id, created_at)
VALUES (
  'ID_DO_USUARIO',    -- ⚠️ SUBSTITUA pelo ID do usuário
  'ID_DA_EMPRESA',    -- ⚠️ SUBSTITUA pelo ID da empresa escolhida
  NOW()
)
ON CONFLICT DO NOTHING;
```

---

## PASSO 4: Testar Login Novamente

### 4.1. Via Browser

1. Abra em **modo anônimo/privado**: https://golffox.vercel.app
2. Abra as **DevTools** (F12)
3. Vá na aba **Console**
4. Tente fazer login
5. Observe mensagens de erro no console

### 4.2. Via Script (Recomendado)

```bash
node scripts/diagnose-vercel-login.js seu@email.com SuaSenha123
```

---

## PASSO 5: Verificar Logs da Vercel

Se ainda não funcionar:

1. Acesse: https://vercel.com/synvolt/golffox/logs
2. Filtre por "Error" ou "login"
3. Procure mensagens como:
   - "Variáveis de ambiente do Supabase não configuradas"
   - "Usuário não cadastrado no sistema"
   - "CSRF validation failed"

---

## 🆘 TROUBLESHOOTING RÁPIDO

### Erro: "Erro de segurança. Recarregue a página"

**Solução:**
1. Limpe cookies do browser
2. Teste em modo anônimo
3. Verifique se HTTPS está ativo (deve estar na Vercel)

### Erro: "Usuário não encontrado no banco de dados"

**Solução:**
- Execute o PASSO 3 acima (verificar e criar usuário na tabela `users`)

### Erro: "Usuário operador sem empresa associada"

**Solução:**
- Execute a query de associação do PASSO 3.5

### Erro: "Não foi possível conectar ao Supabase"

**Solução:**
- Verifique as variáveis de ambiente no PASSO 2
- Confirme que o projeto Supabase está online
- Teste acesso direto: https://seu-projeto.supabase.co

### Login funciona localmente mas não na Vercel

**Causas comuns:**
1. Variáveis de ambiente não configuradas na Vercel
2. Usuário existe localmente mas não no Supabase de produção
3. Problema de CORS ou CSP

**Solução:**
1. Compare `.env.local` com variáveis da Vercel
2. Verifique se está usando o mesmo projeto Supabase
3. Faça redeploy após qualquer mudança

---

## 📞 CHECKLIST FINAL

Antes de reportar problemas, confirme:

- [ ] Executei o script de diagnóstico
- [ ] Verifiquei variáveis de ambiente na Vercel
- [ ] Confirmei que usuário existe na tabela `users`
- [ ] Se operador, verifiquei associação com empresa
- [ ] Testei em modo anônimo do browser
- [ ] Verifiquei logs da Vercel
- [ ] Aguardei pelo menos 1 minuto após redeploy

---

## 📊 LOGS ÚTEIS PARA DEBUG

### No Browser (DevTools Console):

```javascript
// Ver cookies
document.cookie

// Ver se há token CSRF
document.cookie.includes('golffox-csrf')

// Ver se há sessão
document.cookie.includes('golffox-session')

// Testar API diretamente
fetch('https://golffox.vercel.app/api/health')
  .then(r => r.json())
  .then(console.log)
```

### Via CURL (Terminal):

```bash
# Testar health
curl https://golffox.vercel.app/api/health

# Obter CSRF
curl https://golffox.vercel.app/api/auth/csrf

# Testar login (substitua email e senha)
curl -X POST https://golffox.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: test" \
  -d '{"email":"seu@email.com","password":"suasenha"}'
```

---

## ✅ PRÓXIMOS PASSOS APÓS RESOLVER

1. Documente qual foi o problema exato encontrado
2. Crie um usuário de teste para validações futuras
3. Configure alertas de monitoramento na Vercel
4. Considere adicionar logs mais detalhados na API de login

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- [Análise Completa do Problema](./ANALISE_PROBLEMA_LOGIN_VERCEL.md)
- [Arquitetura do Sistema](../ARQUITETURA_ATUAL.md)
- [Guia de Deploy Vercel](../deployment/DEPLOY_VERCEL.md)

---

**Última atualização:** 16 de Novembro de 2025  
**Versão:** 1.0  
**Autor:** Engenheiro Sênior - Análise Remota

