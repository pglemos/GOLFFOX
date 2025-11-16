# 🧪 TESTE MANUAL NO NAVEGADOR

## ⚠️ O TESTE AUTOMATIZADO ESTÁ PASSANDO

```
✅ Servidor online (200 OK)
✅ Login bem-sucedido (200 OK)
✅ Cookie criado
✅ Acesso ao /admin permitido (200 OK)
✅ Usuário permanece na área administrativa
```

**MAS** se não está funcionando no seu navegador, siga estes passos:

---

## 🔧 PASSO 1: LIMPAR COMPLETAMENTE O CACHE

### Chrome/Edge:

1. Pressione **F12** (abrir DevTools)
2. Clique com **botão direito** no ícone de recarregar (⟳)
3. Selecione **"Limpar cache e fazer hard refresh"**
4. **OU** vá em:
   - DevTools > **Application** > **Storage** > **Clear site data**
   - Marque **TUDO**
   - Clique em **"Clear site data"**

---

## 🕵️ PASSO 2: TESTAR EM MODO ANÔNIMO

1. Abra uma **janela anônima/privada**:
   - **Chrome/Edge:** `Ctrl + Shift + N`
   - **Firefox:** `Ctrl + Shift + P`

2. Acesse: **https://golffox.vercel.app**

3. Faça login:
   - Email: `golffox@admin.com`
   - Senha: `senha123`

4. **O QUE ACONTECE?**
   - ✅ Fica em `/admin`? → **SUCESSO!**
   - ❌ Volta para `/?next=/admin`? → **PROBLEMA PERSISTE**

---

## 🔍 PASSO 3: VERIFICAR CONSOLE DO NAVEGADOR

Com o DevTools aberto (F12):

1. Vá na aba **Console**
2. Faça o login
3. **Procure por erros em vermelho**
4. Copie e me envie qualquer erro que aparecer

---

## 📊 PASSO 4: VERIFICAR COOKIES

Com o DevTools aberto (F12):

1. Vá na aba **Application** (Chrome/Edge) ou **Storage** (Firefox)
2. Em **Cookies** > `https://golffox.vercel.app`
3. **Após fazer login**, deve ter:
   - ✅ `golffox-session` (com valor grande)
   - ✅ `golffox-csrf` (com valor grande)

4. **Se NÃO tiver esses cookies:**
   - Há um problema no frontend
   - Me envie o console (passo 3)

---

## 🎯 PASSO 5: VERIFICAR NETWORK

Com o DevTools aberto (F12):

1. Vá na aba **Network**
2. Marque **"Preserve log"**
3. Faça o login
4. **Procure por:**
   - `POST /api/auth/login` → Status deve ser **200**
   - `GET /admin` após o login → Status deve ser **200**

5. **Se você ver:**
   - `GET /?next=/admin` após o login → **Middleware está redirecionando**
   - Status **302** ou **307** → **Redirecionamento ativo**

---

## 🚨 SINTOMAS COMUNS E SOLUÇÕES

### Sintoma 1: "Volta para login imediatamente"
**Causa:** Cache do navegador com versão antiga do código  
**Solução:**
1. Limpar cache (Passo 1)
2. Testar em modo anônimo (Passo 2)

### Sintoma 2: "Erro no console: 'invalid_csrf'"
**Causa:** Cookies bloqueados ou problema de CORS  
**Solução:**
1. Verificar se cookies estão habilitados
2. Desabilitar extensões (AdBlock, etc.)

### Sintoma 3: "Cookie não é criado"
**Causa:** Problema no frontend (page.tsx)  
**Solução:**
1. Verificar console (Passo 3)
2. Me enviar os erros

### Sintoma 4: "Funciona em modo anônimo mas não na janela normal"
**Causa:** Cookies antigos ou cache  
**Solução:**
1. Limpar **TODOS** os cookies de `golffox.vercel.app`
2. Fazer hard refresh (Ctrl + Shift + R)

---

## 📋 CHECKLIST DE DIAGNÓSTICO

Execute NA ORDEM e me diga em qual passo falha:

- [ ] **1.** Limpar cache e cookies
- [ ] **2.** Abrir modo anônimo
- [ ] **3.** Acessar https://golffox.vercel.app
- [ ] **4.** Abrir DevTools (F12)
- [ ] **5.** Ir na aba **Console**
- [ ] **6.** Ir na aba **Network**
- [ ] **7.** Marcar "Preserve log"
- [ ] **8.** Fazer login (golffox@admin.com / senha123)
- [ ] **9.** Verificar se aparece erro no Console
- [ ] **10.** Verificar se `POST /api/auth/login` retorna 200
- [ ] **11.** Verificar se fica em `/admin` ou volta para `/`

---

## 📸 ME ENVIE:

1. **Screenshot do Console** (aba Console do DevTools após login)
2. **Screenshot do Network** (aba Network mostrando as requisições)
3. **Screenshot dos Cookies** (aba Application > Cookies)
4. **Descrição exata:** "Quando clico em Entrar, acontece: [descreva]"

---

## 🎯 TESTE RÁPIDO (30 SEGUNDOS)

```
1. Ctrl + Shift + N (modo anônimo)
2. https://golffox.vercel.app
3. golffox@admin.com / senha123
4. Clicar "Entrar"
5. Resultado?
   ✅ Fica em /admin → FUNCIONANDO!
   ❌ Volta para / → Envie console/network
```

---

## 🔬 TESTE AVANÇADO (Se o problema persistir)

Execute este código no Console do navegador:

```javascript
// Copie e cole no Console (F12 > Console)
console.clear();
console.log('🧪 TESTE DE LOGIN GOLFFOX');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Limpar cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
console.log('✅ Cookies limpos');

// Verificar variáveis de ambiente expostas
console.log('🔍 Env vars expostas:');
console.log('  SUPABASE_URL:', window.location.origin.includes('vercel') ? 'Vercel' : 'Local');

// Fazer login via console
fetch('/api/auth/csrf')
  .then(r => r.json())
  .then(csrf => {
    console.log('✅ CSRF obtido:', csrf.token.substring(0, 20) + '...');
    
    return fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrf.token
      },
      body: JSON.stringify({
        email: 'golffox@admin.com',
        password: 'senha123'
      }),
      credentials: 'include'
    });
  })
  .then(r => {
    console.log('📊 Status do login:', r.status);
    return r.json();
  })
  .then(data => {
    console.log('📦 Resposta:', data);
    
    if (data.user) {
      console.log('✅ LOGIN SUCESSO!');
      console.log('   User:', data.user.email);
      console.log('   Role:', data.user.role);
      
      // Verificar cookies
      const cookies = document.cookie.split(';').map(c => c.trim());
      console.log('🍪 Cookies após login:');
      cookies.forEach(c => {
        const name = c.split('=')[0];
        if (name.includes('golffox')) {
          console.log('  ✅', name);
        }
      });
      
      // Tentar acessar /admin
      console.log('\n🚀 Redirecionando para /admin...');
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1000);
      
    } else {
      console.error('❌ LOGIN FALHOU:', data);
    }
  })
  .catch(err => {
    console.error('❌ ERRO:', err);
  });
```

Esse código vai:
1. Limpar todos os cookies
2. Fazer login via API
3. Verificar se os cookies foram criados
4. Redirecionar para `/admin`
5. Mostrar logs detalhados

**ME ENVIE O OUTPUT DO CONSOLE!**

---

## 🆘 AINDA NÃO FUNCIONA?

Se mesmo após TODOS esses passos ainda não funcionar:

1. **Me envie:**
   - Screenshot do Console
   - Screenshot do Network
   - Screenshot dos Cookies
   - Descrição exata do comportamento

2. **Ou grave um vídeo curto (10-20 segundos):**
   - Mostrando você fazendo login
   - Com DevTools aberto
   - Mostrando o que acontece

---

**Status do Sistema:** ✅ API funcionando 100%  
**Próximo passo:** Diagnosticar problema específico do navegador

---

**Criado em:** 16/11/2025 18:25  
**Para:** Diagnóstico de problema no navegador

