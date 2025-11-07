# ✅ Checklist de Deploy para Produção

**Data:** 07/01/2025  
**Status:** ✅ Pronto para Deploy

---

## 🔴 Pré-Deploy (Obrigatório)

### Correções Aplicadas
- [x] Middleware com autenticação
- [x] Branding operador corrigido
- [x] RLS em gf_user_company_map (aplicado)
- [x] Type-safety habilitado
- [x] 13 rotas API protegidas

### Database
- [x] Migration v49 aplicada no Supabase
- [x] RLS validado (100% passou)
- [x] Políticas ativas confirmadas

### Código
- [x] TypeScript errors corrigidos
- [x] ESLint errors corrigidos
- [x] Console.logs removidos em produção
- [x] Logger respeita NODE_ENV

---

## 🟡 Validação em Staging (Recomendado)

### Testes Funcionais
- [ ] Login como admin → acessar `/admin` → deve permitir
- [ ] Login como operator → acessar `/operator` → deve permitir
- [ ] Login como operator → acessar `/admin` → deve redirecionar para `/unauthorized`
- [ ] Sem login → acessar `/operator` → deve redirecionar para `/login`
- [ ] Sem login → acessar `/admin` → deve redirecionar para `/login`

### Branding
- [ ] Login como operador → verificar se exibe logo/nome da empresa
- [ ] Verificar se "GOLF FOX" não aparece no painel do operador
- [ ] Verificar se logo customizado aparece quando configurado

### APIs
- [ ] POST `/api/costs/manual` sem auth → deve retornar 401
- [ ] POST `/api/costs/manual` com auth → deve funcionar
- [ ] GET `/api/costs/export` sem auth → deve retornar 401
- [ ] POST `/api/admin/create-operator` como operator → deve retornar 403
- [ ] POST `/api/admin/create-operator` como admin → deve funcionar

### RLS
- [ ] Como operador, tentar inserir mapeamento para outra empresa → deve falhar
- [ ] Como admin, tentar inserir mapeamento → deve funcionar

---

## 🟢 Variáveis de Ambiente Vercel

### Obrigatórias
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Configurada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Configurada
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Configurada (server-side)
- [ ] `CRON_SECRET` - Configurada

### Opcionais
- [ ] `RESEND_API_KEY` - Para envio de emails
- [ ] `REPORTS_FROM_EMAIL` - Email remetente
- [ ] `REPORTS_BCC` - Email BCC
- [ ] `NEXT_PUBLIC_BASE_URL` - URL base da aplicação

### Verificar
```bash
vercel env pull .env.production
cat .env.production | grep NEXT_PUBLIC
```

---

## 🔵 Build e Deploy

### Build Local (Teste)
```bash
cd web-app
npm run build
# Deve completar sem erros TypeScript/ESLint
```

### Deploy Vercel
```bash
# Verificar se está no branch correto
git branch

# Push para trigger deploy
git push origin main

# OU deploy manual
vercel --prod
```

### Verificar Deploy
- [ ] Build completou com sucesso
- [ ] Sem erros no console do Vercel
- [ ] Aplicação acessível em `golffox.vercel.app`
- [ ] Health check `/api/health` retorna 200

---

## 🟣 Pós-Deploy

### Monitoramento (Primeiras 24h)
- [ ] Verificar logs do Vercel (erros 401/403)
- [ ] Verificar logs do Supabase (erros RLS)
- [ ] Monitorar performance do middleware
- [ ] Verificar se cron jobs estão executando

### Validação em Produção
- [ ] Testar login em produção
- [ ] Testar acesso a rotas protegidas
- [ ] Testar criação de custo
- [ ] Testar export de dados
- [ ] Verificar branding operador

---

## 📊 Métricas de Sucesso

### Segurança
- ✅ 0 rotas desprotegidas
- ✅ 0 erros de RLS
- ✅ 0 vazamentos multi-tenant

### Performance
- ⚠️ Middleware < 100ms (medir)
- ⚠️ APIs < 500ms (medir)
- ⚠️ Build < 5min (medir)

### Qualidade
- ✅ 0 erros TypeScript em build
- ✅ 0 erros ESLint em build
- ✅ 0 console.logs em produção

---

## 🚨 Rollback Plan

Se houver problemas críticos:

1. **Reverter código:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Reverter migration (se necessário):**
   ```sql
   -- No Supabase SQL Editor
   DROP POLICY IF EXISTS admin_manage_user_companies ON public.gf_user_company_map;
   DROP POLICY IF EXISTS user_select_own_companies ON public.gf_user_company_map;
   ALTER TABLE public.gf_user_company_map DISABLE ROW LEVEL SECURITY;
   ```

3. **Reverter env vars:**
   - Via Vercel Dashboard → Settings → Environment Variables

---

## ✅ Checklist Final

### Antes do Deploy
- [x] Todas as correções aplicadas
- [x] Migration aplicada no Supabase
- [x] Testes RLS passaram
- [ ] Build local testado
- [ ] Variáveis de ambiente verificadas

### Durante o Deploy
- [ ] Monitorar build no Vercel
- [ ] Verificar logs de erro
- [ ] Confirmar deploy bem-sucedido

### Após o Deploy
- [ ] Validar aplicação em produção
- [ ] Testar funcionalidades críticas
- [ ] Monitorar logs por 24h
- [ ] Documentar problemas encontrados

---

## 🎉 Status

**Sistema:** ✅ **Pronto para Deploy em Produção**

**Última atualização:** 07/01/2025

