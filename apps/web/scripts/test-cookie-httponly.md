# Teste de Cookie HttpOnly

## Como Testar Manualmente

### 1. Fazer Login
1. Abrir aplicação em `http://localhost:3000`
2. Fazer login com credenciais válidas
3. Verificar que redireciona para painel apropriado

### 2. Verificar Cookie no DevTools
1. Abrir DevTools (F12)
2. Ir para aba **Application** (Chrome) ou **Storage** (Firefox)
3. Expandir **Cookies** → `http://localhost:3000`
4. Procurar por `golffox-session`
5. Verificar:
   - ✅ **HttpOnly**: deve estar marcado
   - ✅ **Secure**: deve estar marcado (se HTTPS)
   - ✅ **SameSite**: deve ser `Lax`
   - ✅ **Path**: deve ser `/`

### 3. Testar que Cookie não é Acessível via JavaScript
1. No console do DevTools, executar:
   ```javascript
   document.cookie
   ```
2. Verificar que `golffox-session` **NÃO** aparece na lista
3. Tentar ler diretamente:
   ```javascript
   document.cookie.split(';').find(c => c.includes('golffox-session'))
   ```
4. Deve retornar `undefined`

### 4. Testar Logout
1. Fazer logout da aplicação
2. Verificar que cookie é removido
3. Verificar que redireciona para login

## Resultado Esperado

✅ Cookie é HttpOnly (não acessível via JavaScript)  
✅ Cookie é Secure em HTTPS  
✅ Cookie é limpo no logout  
✅ Autenticação funciona normalmente

## Problemas Comuns

### Cookie não é HttpOnly
- Verificar que está usando API `/api/auth/set-session`
- Verificar que não há código definindo cookie via `document.cookie`
- Verificar arquivo `apps/web/lib/auth.ts` - método `persistSession`

### Cookie não é definido
- Verificar logs do console para erros
- Verificar que API `/api/auth/set-session` retorna 200
- Verificar CSRF token se necessário

### Autenticação não funciona
- Verificar que middleware está validando tokens
- Verificar logs do middleware em desenvolvimento
- Verificar variáveis de ambiente do Supabase

