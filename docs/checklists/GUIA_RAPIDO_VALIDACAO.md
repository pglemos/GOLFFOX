# 🚀 Guia Rápido de Validação Pós-Deploy

**URL Produção:** https://golffox-bzj0446dr-synvolt.vercel.app

---

## ⚡ Testes Rápidos (5 minutos)

### 1. Health Check
```bash
curl https://golffox-bzj0446dr-synvolt.vercel.app/api/health
```
**Esperado:** `{"ok":true,"supabase":"ok",...}`

### 2. Página Inicial
- Acesse: https://golffox-bzj0446dr-synvolt.vercel.app
- **Esperado:** Página carrega ou redireciona para login

### 3. Login
- Acesse: https://golffox-bzj0446dr-synvolt.vercel.app/login
- **Esperado:** Página de login aparece

### 4. Rotas Protegidas (sem login)
- Acesse: https://golffox-bzj0446dr-synvolt.vercel.app/operador
- **Esperado:** Redireciona para `/login?redirect=/operador`

- Acesse: https://golffox-bzj0446dr-synvolt.vercel.app/admin
- **Esperado:** Redireciona para `/login?redirect=/admin`

### 5. API Protegida (sem auth)
```bash
curl https://golffox-bzj0446dr-synvolt.vercel.app/api/costs/manual?company_id=test
```
**Esperado:** `{"error":"Unauthorized"}` ou status 401

---

## 🔐 Testes com Autenticação (10 minutos)

### Pré-requisito
Ter credenciais de teste:
- Operador: `operador@example.com`
- Admin: `admin@example.com`

### 1. Login como Operador
1. Acesse `/login`
2. Faça login com credenciais de operador
3. **Verificar:**
   - Redireciona para `/operador`
   - Logo/nome da empresa aparece (se configurado)
   - "GOLF FOX" não aparece

### 2. Tentar Acessar Admin (como Operador)
1. Ainda logado como operador
2. Acesse `/admin`
3. **Esperado:** Redireciona para `/unauthorized`

### 3. Login como Admin
1. Faça logout
2. Faça login como admin
3. Acesse `/admin`
4. **Esperado:** Página admin carrega

### 4. Testar API com Auth
1. Com cookie de sessão ativo
2. Acesse interface de custos
3. Tente criar custo manual
4. **Esperado:** Funciona se autenticado

---

## 📊 Checklist Mínimo

### Funcionalidades Críticas
- [ ] Login funciona
- [ ] Middleware redireciona sem auth
- [ ] Operador não acessa `/admin`
- [ ] Admin acessa tudo
- [ ] APIs retornam 401 sem auth

### Branding
- [ ] Logo da empresa aparece (se configurado)
- [ ] Nome da empresa aparece
- [ ] "GOLF FOX" não aparece no operador

### Segurança
- [ ] RLS está ativo (verificar no Supabase)
- [ ] Cookies de sessão funcionam
- [ ] Logout limpa sessão

---

## 🔍 Verificar Logs

### Vercel
1. Acesse: https://vercel.com/synvolt/golffox
2. Vá em **Deployments** → [último deploy]
3. Clique em **Functions Logs**
4. Verifique erros

### Supabase
1. Acesse: https://supabase.com/dashboard
2. Vá em **Logs** → **Postgres Logs**
3. Verifique queries e erros RLS

---

## ⚠️ Problemas Comuns

### Health Check retorna 401
- **Causa:** Pode ser esperado se middleware protege tudo
- **Solução:** Verificar se `/api/health` está excluído do matcher

### Páginas retornam 401
- **Causa:** Middleware muito restritivo
- **Solução:** Verificar matcher no `middleware.ts`

### APIs retornam 401 mesmo com auth
- **Causa:** Cookie não está sendo enviado
- **Solução:** Verificar se cookie `golffox-session` existe

---

## ✅ Critérios de Sucesso

Se todos os testes acima passarem:
- ✅ **Deploy:** Funcionando
- ✅ **Segurança:** Implementada
- ✅ **Funcionalidades:** Operacionais

**Próximo passo:** Validação completa (ver `CHECKLIST_VALIDACAO_PRODUCAO.md`)

---

**Última atualização:** 07/01/2025

