# 🚀 Guia Completo de Deploy no Vercel

**Data:** 07/01/2025  
**Projeto:** GOLFFOX  
**Vercel Project:** golffox | ID: prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m  
**Team:** team_9kUTSaoIkwnAVxy9nXMcAnej

---

## 📋 Pré-requisitos

### 1. Vercel CLI Instalado
```bash
npm install -g vercel
```

### 2. Autenticado no Vercel
```bash
vercel login
```

### 3. Selecionar Team Correto
```bash
vercel switch --scope team_9kUTSaoIkwnAVxy9nXMcAnej
```

---

## 🔐 Passo 1: Configurar Variáveis de Ambiente

### Variáveis Obrigatórias

Execute os comandos abaixo para adicionar cada variável:

```bash
# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
# Valor: https://vmoxzesvjcfmrebagcwo.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
# Valor: (sua chave anon do Supabase)

vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development
# Valor: (sua chave service_role do Supabase)

# Google Maps
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production preview development
# Valor: (sua chave do Google Maps)

# Cron Secret (gerar novo)
vercel env add CRON_SECRET production preview development
# Valor: (gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Variáveis Opcionais (se necessário)

```bash
# Email (para relatórios)
vercel env add RESEND_API_KEY production preview development
vercel env add REPORTS_FROM_EMAIL production preview development
vercel env add REPORTS_BCC production preview development

# Base URL
vercel env add NEXT_PUBLIC_BASE_URL production
# Valor: https://golffox.vercel.app
```

### Gerar CRON_SECRET

```bash
# Gerar secret seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**OU via PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## ✅ Passo 2: Validar Configuração

### Executar Script de Validação

```bash
cd web-app
node scripts/deploy-vercel.js
```

Este script verifica:
- ✅ Vercel CLI instalado
- ✅ Autenticação ativa
- ✅ Variáveis de ambiente configuradas
- ✅ Build local válido

---

## 🔨 Passo 3: Testar Build Local (Opcional mas Recomendado)

```bash
cd web-app
npm run build
```

**Verificar:**
- ✅ Build completa sem erros TypeScript
- ✅ Sem erros ESLint
- ✅ Sem warnings críticos

---

## 🚀 Passo 4: Deploy

### Opção 1: Deploy Manual via CLI

```bash
# No diretório raiz do projeto
vercel --prod
```

### Opção 2: Deploy via Git (Auto-deploy)

```bash
# Commit e push para trigger deploy automático
git add .
git commit -m "feat: aplicar correções de auditoria e segurança"
git push origin main
```

O Vercel detectará o push e fará deploy automaticamente.

---

## 📊 Passo 5: Verificar Deploy

### 1. Verificar Build no Dashboard
- Acesse: https://vercel.com/dashboard
- Selecione projeto: **golffox**
- Verifique se o deploy foi bem-sucedido

### 2. Testar Aplicação
```bash
# Health check
curl https://golffox.vercel.app/api/health

# Esperado: {"ok":true,"supabase":"ok",...}
```

### 3. Verificar Logs
- Vercel Dashboard → Deployments → [último deploy] → Functions Logs
- Verificar se há erros 401/403 (pode indicar problema de autenticação)

---

## 🔍 Passo 6: Validar Funcionalidades

### Testes Manuais em Produção

1. **Login:**
   - Acessar `https://golffox.vercel.app/login`
   - Fazer login como admin/operador
   - Verificar redirecionamento

2. **Middleware:**
   - Tentar acessar `/operador` sem login → deve redirecionar
   - Tentar acessar `/admin` como operador → deve redirecionar

3. **Branding:**
   - Login como operador → verificar logo/nome da empresa
   - Verificar se "GOLF FOX" não aparece

4. **APIs:**
   - Tentar criar custo sem auth → deve retornar 401
   - Tentar criar custo com auth → deve funcionar

---

## 🛠️ Troubleshooting

### Erro: "Build failed - TypeScript errors"
**Solução:**
```bash
cd web-app
npm run type-check
# Corrigir erros antes de fazer deploy
```

### Erro: "Environment variable not found"
**Solução:**
- Verificar se variável está configurada no Vercel Dashboard
- Verificar se está marcada para ambiente correto (Production/Preview/Development)
- Re-deploy após adicionar variável

### Erro: "CRON_SECRET não configurado"
**Solução:**
```bash
# Gerar e adicionar
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" | vercel env add CRON_SECRET production preview development
```

### Erro: "Unauthorized" em rotas protegidas
**Solução:**
- Verificar se middleware está funcionando
- Verificar cookies de sessão
- Verificar logs do Vercel

---

## 📋 Checklist de Deploy

### Antes do Deploy
- [x] Todas as correções aplicadas
- [x] Migration v49 aplicada no Supabase
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Build local testado
- [ ] Vercel CLI autenticado

### Durante o Deploy
- [ ] Monitorar build no Vercel Dashboard
- [ ] Verificar logs de erro
- [ ] Confirmar deploy bem-sucedido

### Após o Deploy
- [ ] Health check retorna 200
- [ ] Login funciona
- [ ] Middleware protege rotas
- [ ] APIs retornam 401 sem auth
- [ ] Branding operador correto
- [ ] Cron jobs configurados

---

## 🎯 Comandos Rápidos

### Validar Antes de Deploy
```bash
cd web-app
node scripts/deploy-vercel.js
```

### Deploy Manual
```bash
vercel --prod
```

### Verificar Variáveis
```bash
vercel env ls
```

### Ver Logs
```bash
vercel logs golffox.vercel.app
```

### Rollback (se necessário)
```bash
# No Vercel Dashboard → Deployments → [deploy anterior] → Promote to Production
```

---

## 📊 Status Atual

| Item | Status |
|------|--------|
| **Código** | ✅ Pronto |
| **Migrations** | ✅ Aplicadas |
| **Variáveis Env** | ⚠️ Verificar no Vercel |
| **Build** | ⚠️ Testar localmente |
| **Deploy** | ⚠️ Pendente |

---

## 🚀 Próxima Ação

1. **Configurar variáveis de ambiente no Vercel**
2. **Executar script de validação:** `node scripts/deploy-vercel.js`
3. **Fazer deploy:** `vercel --prod`

---

**Última atualização:** 07/01/2025

