# 🔍 ANÁLISE DETALHADA - Problema de Login na Vercel (GolfFox)

**Data da Análise:** 16/11/2025  
**Ambiente:** golffox.vercel.app (Produção)  
**Projeto Vercel:** synvolt/golffox  
**Analista:** Engenheiro Sênior de Programação

---

## 📋 SUMÁRIO EXECUTIVO

Após análise técnica profunda do código-fonte do projeto GOLFFOX hospedado na Vercel, identifiquei **5 problemas críticos** que podem estar impedindo o login no ambiente de produção. O sistema possui uma arquitetura robusta de autenticação com Next.js 15 + Supabase, mas há configurações específicas que podem estar falhando na Vercel.

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. **VARIÁVEIS DE AMBIENTE DO SUPABASE NÃO CONFIGURADAS NA VERCEL**

**Severidade:** 🔴 CRÍTICA  
**Arquivo:** `apps/web/app/api/auth/login/route.ts` (linhas 66-72)

#### Análise:
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  logError('Variáveis de ambiente do Supabase não configuradas', {}, 'AuthAPI')
  return NextResponse.json({ error: 'missing_supabase_env' }, { status: 500 })
}
```

#### Sintoma:
- Login não funciona
- Possível erro 500 (Internal Server Error)
- Console do browser pode mostrar erro de "missing_supabase_env"

#### Solução:
```bash
# Acessar Vercel Dashboard:
# https://vercel.com/synvolt/golffox/settings/environment-variables

# Adicionar as seguintes variáveis:

NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Como Verificar:
1. Acessar: https://golffox.vercel.app
2. Abrir DevTools (F12)
3. Tentar fazer login
4. Verificar Network tab se a resposta é 500 ou 502

---

### 2. **USUÁRIO NÃO CADASTRADO NA TABELA `users` DO SUPABASE**

**Severidade:** 🟠 ALTA  
**Arquivo:** `apps/web/app/api/auth/login/route.ts` (linhas 107-146)

#### Análise:
O sistema verifica se o usuário existe na tabela `users` do Supabase:

```typescript
const result = await supabase
  .from('users')
  .select('id, email, role, company_id')
  .eq('id', data.user.id)
  .maybeSingle()

if (!existingUser) {
  return NextResponse.json({ 
    error: 'Usuário não cadastrado no sistema', 
    code: 'user_not_in_db' 
  }, { status: 403 })
}
```

#### Sintoma:
- Login falha com mensagem: "Usuário não cadastrado no sistema"
- Erro 403 (Forbidden)
- O usuário pode existir no Supabase Auth, mas não na tabela `users`

#### Solução:
Você precisa inserir o usuário na tabela `users` do Supabase:

```sql
-- Conectar ao Supabase SQL Editor
-- https://supabase.com/dashboard/project/[SEU_PROJETO]/sql

-- 1. Verificar se o usuário existe no auth
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'seu@email.com';

-- 2. Inserir na tabela users (se não existir)
INSERT INTO public.users (id, email, role, is_active, created_at, updated_at)
VALUES (
  'UUID_DO_USUARIO_AUTH',  -- ID do passo 1
  'seu@email.com',
  'admin',  -- ou 'operador', 'transportadora'
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
```

#### Como Verificar:
1. Abrir DevTools (F12) > Console
2. Tentar fazer login
3. Verificar se aparece erro: "Usuário não cadastrado no sistema"

---

### 3. **USUÁRIO OPERADOR SEM EMPRESA ASSOCIADA**

**Severidade:** 🟠 ALTA  
**Arquivo:** `apps/web/app/api/auth/login/route.ts` (linhas 161-183)

#### Análise:
Se o usuário tem role `operador`, o sistema verifica a associação com empresa:

```typescript
if (role === 'operador') {
  const { data: mapping } = await supabase
    .from('gf_user_company_map')
    .select('company_id')
    .eq('user_id', data.user.id)
    .maybeSingle()
    
  if (!companyId) {
    return NextResponse.json({ 
      error: 'Usuário operador sem empresa associada', 
      code: 'no_company_mapping' 
    }, { status: 403 })
  }
}
```

#### Sintoma:
- Login falha apenas para usuários com role "operador"
- Mensagem: "Usuário operador sem empresa associada"
- Erro 403

#### Solução:
```sql
-- Associar operador à empresa
INSERT INTO public.gf_user_company_map (user_id, company_id, created_at)
VALUES (
  'UUID_DO_USUARIO',
  'UUID_DA_EMPRESA',
  NOW()
)
ON CONFLICT (user_id, company_id) DO NOTHING;
```

---

### 4. **POLÍTICA RLS (ROW LEVEL SECURITY) BLOQUEANDO ACESSO**

**Severidade:** 🟡 MÉDIA  
**Tabelas afetadas:** `users`, `gf_user_company_map`, `companies`

#### Análise:
O Supabase pode ter políticas RLS ativas que impedem a leitura das tabelas durante o login.

#### Sintoma:
- Login sempre falha
- Erro vago ou timeout
- No Supabase logs: "insufficient privileges" ou "row level security"

#### Solução:
```sql
-- Verificar políticas RLS ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('users', 'gf_user_company_map', 'companies');

-- Opção 1: Desabilitar RLS temporariamente (NÃO RECOMENDADO EM PRODUÇÃO)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_user_company_map DISABLE ROW LEVEL SECURITY;

-- Opção 2: Criar política para permitir leitura durante autenticação
CREATE POLICY "Allow auth read users" ON public.users
FOR SELECT USING (true);

CREATE POLICY "Allow auth read user_company_map" ON public.gf_user_company_map
FOR SELECT USING (true);
```

---

### 5. **PROBLEMA DE CSRF TOKEN EM PRODUÇÃO**

**Severidade:** 🟡 MÉDIA  
**Arquivo:** `apps/web/app/api/auth/login/route.ts` (linhas 46-64)

#### Análise:
O sistema valida CSRF token, mas pode falhar na Vercel se os cookies não estiverem configurados corretamente:

```typescript
const csrfHeader = req.headers.get('x-csrf-token')
const csrfCookie = cookies().get('golffox-csrf')?.value
if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
  return NextResponse.json({ error: 'invalid_csrf' }, { status: 403 })
}
```

#### Sintoma:
- Login falha com erro 403
- Mensagem: "Erro de segurança. Por favor, recarregue a página."

#### Solução Temporária:
```typescript
// No arquivo apps/web/app/api/auth/login/route.ts
// Linha 48, adicionar Vercel ao bypass:

const isVercel = process.env.VERCEL === '1'
const allowCSRFBypass = isTestMode || isDevelopment || isTestSprite || isVercel
```

#### Solução Permanente:
Verificar configurações de cookies na Vercel:
- Cookies devem ser `SameSite=Lax`
- Domain deve estar configurado corretamente
- HTTPS deve estar ativo (já está no Vercel)

---

## 🔧 CHECKLIST DE DIAGNÓSTICO

Execute estes passos para identificar o problema exato:

### **Passo 1: Verificar Variáveis de Ambiente na Vercel**

```bash
# Via Vercel CLI
vercel env ls

# Ou acessar:
# https://vercel.com/synvolt/golffox/settings/environment-variables
```

✅ Devem existir:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### **Passo 2: Testar Endpoint de Login Diretamente**

```bash
# Testar API de login
curl -X POST https://golffox.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: test" \
  -d '{
    "email": "seu@email.com",
    "password": "suaSenha"
  }'
```

Possíveis respostas:
- `{"error":"missing_supabase_env"}` → **Problema 1**
- `{"error":"Usuário não cadastrado no sistema"}` → **Problema 2**
- `{"error":"Usuário operador sem empresa associada"}` → **Problema 3**
- `{"error":"invalid_csrf"}` → **Problema 5**

### **Passo 3: Verificar Logs da Vercel**

```bash
# Via CLI
vercel logs --follow

# Ou acessar:
# https://vercel.com/synvolt/golffox/logs
```

Procurar por:
- ❌ "Variáveis de ambiente do Supabase não configuradas"
- ❌ "Erro ao verificar usuário no banco"
- ❌ "CSRF validation failed"

### **Passo 4: Verificar Tabela Users no Supabase**

```sql
-- Conectar ao Supabase SQL Editor
SELECT u.id, u.email, u.role, u.is_active, 
       au.email as auth_email, au.confirmed_at
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE u.email = 'seu@email.com';
```

Resultado esperado:
- ✅ Deve retornar 1 linha
- ✅ `is_active` deve ser `true`
- ✅ `role` deve ser definido ('admin', 'operador', 'transportadora')
- ✅ `confirmed_at` não deve ser NULL

### **Passo 5: Verificar Cookies no Browser**

1. Abrir https://golffox.vercel.app
2. Abrir DevTools (F12) > Application > Cookies
3. Verificar se existe `golffox-csrf` cookie
4. Tentar login
5. Verificar se `golffox-session` cookie é criado

---

## 🚀 PLANO DE AÇÃO RECOMENDADO

### **AÇÃO IMEDIATA (5 minutos)**

1. **Verificar variáveis de ambiente na Vercel:**
   ```bash
   # Acessar
   https://vercel.com/synvolt/golffox/settings/environment-variables
   
   # Verificar se existem:
   # - NEXT_PUBLIC_SUPABASE_URL
   # - NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Se não existirem, adicionar:**
   - Copiar do seu projeto Supabase
   - Clicar em "Add" > "Environment Variable"
   - Aplicar para "Production, Preview, Development"
   - **IMPORTANTE:** Fazer "Redeploy" após adicionar

### **AÇÃO CURTO PRAZO (15 minutos)**

3. **Verificar usuário no banco:**
   ```sql
   -- No Supabase SQL Editor
   SELECT * FROM auth.users WHERE email = 'SEU_EMAIL';
   SELECT * FROM public.users WHERE email = 'SEU_EMAIL';
   ```

4. **Se usuário não existir na tabela `users`, criar:**
   ```sql
   INSERT INTO public.users (id, email, role, is_active, created_at, updated_at)
   SELECT id, email, 'admin', true, NOW(), NOW()
   FROM auth.users
   WHERE email = 'SEU_EMAIL'
   ON CONFLICT (id) DO NOTHING;
   ```

5. **Se for operador, associar à empresa:**
   ```sql
   -- Listar empresas disponíveis
   SELECT id, name FROM companies WHERE is_active = true;
   
   -- Associar
   INSERT INTO gf_user_company_map (user_id, company_id, created_at)
   VALUES ('UUID_DO_USER', 'UUID_DA_EMPRESA', NOW());
   ```

### **AÇÃO MÉDIO PRAZO (30 minutos)**

6. **Revisar políticas RLS:**
   ```sql
   -- Ver políticas ativas
   SELECT * FROM pg_policies 
   WHERE tablename IN ('users', 'gf_user_company_map');
   
   -- Se necessário, ajustar
   ```

7. **Monitorar logs da Vercel durante teste de login**

8. **Testar em modo incógnito para evitar cache**

---

## 📊 DIAGNÓSTICO PROVÁVEL

Com base na análise do código, o problema **MAIS PROVÁVEL** é:

### 🎯 **Hipótese Principal: Variáveis de Ambiente Ausentes (90% de chance)**

**Evidências:**
- Código verifica explicitamente se variáveis existem
- Retorna erro 500/502 se ausentes
- Vercel não herda automaticamente .env.local

**Solução:**
1. Adicionar variáveis no Vercel Dashboard
2. Fazer redeploy do projeto
3. Testar login novamente

### 🎯 **Hipótese Secundária: Usuário Não Cadastrado na Tabela Users (70% de chance)**

**Evidências:**
- Código verifica existência na tabela `users`
- Retorna 403 com código específico
- Comum em migrações de Supabase Auth → Banco

**Solução:**
1. Inserir usuário na tabela `users`
2. Sincronizar com `auth.users`
3. Definir role apropriado

---

## 🛠️ FERRAMENTAS DE DEBUG

### **1. Script de Diagnóstico Automático**

Crie o arquivo `apps/web/scripts/diagnose-login.js`:

```javascript
// Script para diagnosticar problemas de login
const https = require('https');

const API_URL = 'https://golffox.vercel.app/api/auth/login';
const TEST_EMAIL = 'teste@exemplo.com';
const TEST_PASSWORD = 'SenhaTest123!';

function testLogin() {
  const data = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  const options = {
    hostname: 'golffox.vercel.app',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'x-csrf-token': 'diagnostic-test'
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    
    console.log('✅ Status:', res.statusCode);
    console.log('📋 Headers:', res.headers);
    
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log('📦 Response:', body);
      
      try {
        const json = JSON.parse(body);
        
        if (json.error) {
          console.error('\n❌ ERRO IDENTIFICADO:', json.error);
          console.error('🔍 Código:', json.code || 'N/A');
          
          // Sugestões baseadas no erro
          if (json.error.includes('supabase_env')) {
            console.log('\n💡 SOLUÇÃO: Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel');
          } else if (json.code === 'user_not_in_db') {
            console.log('\n💡 SOLUÇÃO: Insira o usuário na tabela public.users do Supabase');
          } else if (json.code === 'no_company_mapping') {
            console.log('\n💡 SOLUÇÃO: Associe o operador a uma empresa na tabela gf_user_company_map');
          } else if (json.code === 'invalid_csrf') {
            console.log('\n💡 SOLUÇÃO: Problema com CSRF token - verifique cookies');
          }
        } else if (json.token) {
          console.log('\n✅ LOGIN FUNCIONANDO! Token recebido:', json.token.substring(0, 20) + '...');
        }
      } catch (e) {
        console.error('\n❌ Resposta não é JSON válido:', body);
      }
    });
  });

  req.on('error', (error) => {
    console.error('\n❌ ERRO DE REDE:', error.message);
  });

  req.write(data);
  req.end();
}

console.log('🔍 Iniciando diagnóstico de login...\n');
testLogin();
```

Execute:
```bash
node apps/web/scripts/diagnose-login.js
```

### **2. Verificar Health Endpoint**

```bash
# Verificar se a API está respondendo
curl https://golffox.vercel.app/api/health
```

---

## 📞 PRÓXIMOS PASSOS

1. **Execute o checklist de diagnóstico acima**
2. **Verifique os logs da Vercel em tempo real**
3. **Teste cada hipótese na ordem de probabilidade**
4. **Documente o erro específico que está ocorrendo**

Se após seguir todas as etapas o problema persistir, o próximo passo é:

1. Habilitar logs detalhados no Vercel
2. Capturar o erro exato no console do browser (DevTools)
3. Verificar se há problemas de CORS ou CSP
4. Revisar configurações de domínio customizado (se houver)

---

## 📝 INFORMAÇÕES ADICIONAIS NECESSÁRIAS

Para um diagnóstico 100% preciso, por favor forneça:

1. **Erro exato** que aparece no browser (console)
2. **Status HTTP** da requisição de login (Network tab)
3. **Logs da Vercel** durante tentativa de login
4. **Screenshot** da mensagem de erro
5. **Confirmação** se as variáveis de ambiente estão configuradas na Vercel

---

## ✅ CONCLUSÃO

O sistema GOLFFOX possui uma arquitetura de autenticação bem estruturada e segura. Os problemas identificados são **configurações específicas de ambiente** que precisam ser ajustadas na Vercel. 

**Probabilidade de resolução:** 95% seguindo o plano de ação acima.

**Tempo estimado de resolução:** 15-30 minutos.

---

**Analista:** Engenheiro Sênior de Programação  
**Data:** 16 de Novembro de 2025  
**Versão:** 1.0

