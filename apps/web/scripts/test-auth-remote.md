# Teste de Autenticação Remota

## Checklist de Teste

### 1. Teste de Login
- [ ] Acessar https://golffox.vercel.app/
- [ ] Fazer login com credenciais válidas
- [ ] Verificar se o cookie `golffox-session` é criado
- [ ] Verificar se o redirecionamento funciona após login

### 2. Teste de Acesso a Páginas Protegidas
- [ ] Acessar https://golffox.vercel.app/admin/empresas
- [ ] Verificar se não há erro de "Usuário não autenticado"
- [ ] Verificar se a página carrega corretamente

### 3. Teste de Criação de Empresa
- [ ] Clicar em "Criar Empresa"
- [ ] Preencher os dados da empresa
- [ ] Submeter o formulário
- [ ] Verificar se não há erro de autenticação
- [ ] Verificar se a empresa é criada com sucesso

### 4. Verificar Logs no Console
- [ ] Abrir DevTools > Console
- [ ] Verificar se há logs de autenticação:
  - `🔍 validateAuth - Verificando autenticação`
  - `✅ Usuário autenticado via cookie`
  - `✅ Cookie de sessão criado`

### 5. Verificar Cookies
- [ ] Abrir DevTools > Application > Cookies
- [ ] Verificar se o cookie `golffox-session` está presente
- [ ] Verificar se o cookie tem `HttpOnly`, `SameSite=Lax`, `Secure` (em HTTPS)

### 6. Verificar Requisições
- [ ] Abrir DevTools > Network
- [ ] Fazer uma requisição que precisa de autenticação
- [ ] Verificar se o cookie está sendo enviado no header `Cookie`
- [ ] Verificar a resposta da API (status 200 ou 401)

## Problemas Comuns e Soluções

### Cookie não está sendo criado
- Verificar se a requisição de login retorna status 200
- Verificar se o cookie está sendo setado no header `Set-Cookie` da resposta
- Verificar configuração de `secure` e `sameSite` em produção

### Cookie não está sendo enviado
- Verificar se `credentials: 'include'` está presente nas requisições fetch
- Verificar se o cookie tem `path=/` para ser enviado em todas as rotas
- Verificar se não há problemas com CORS ou SameSite

### Erro de "Usuário não autenticado" mesmo após login
- Verificar logs do servidor (Vercel Logs)
- Verificar se o cookie está sendo lido corretamente em `validateAuth`
- Verificar se há problemas de decodificação do cookie

