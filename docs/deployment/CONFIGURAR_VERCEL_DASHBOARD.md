# ⚠️ IMPORTANTE - Configure no Dashboard da Vercel

## 🚨 Problema Identificado

O erro ocorre porque:
1. O `vercel.json` na raiz está tentando executar comandos customizados
2. Mas o Root Directory não está configurado no dashboard
3. A Vercel está confusa sobre onde está o projeto

## ✅ Solução: Configuração APENAS via Dashboard

Removi os arquivos de configuração na raiz que estavam causando conflito.

**A forma MAIS CONFIÁVEL é configurar TUDO no dashboard da Vercel.**

---

## 🔧 Passo 1: Configurar Root Directory

1. **Acesse**: https://vercel.com/synvolt/golffox/settings/general

2. **Role até**: Seção **"Root Directory"**

3. **No campo "Root Directory"**, digite:
   ```
   web-app
   ```
   (sem barra no final)

4. **Clique em**: **"Save"**

---

## 🔧 Passo 2: Verificar Build Settings

Na mesma página, verifique:

- **Framework Preset**: Next.js (deve estar selecionado)
- **Build Command**: `npm run build` (deixe padrão ou vazio - Next.js detecta automaticamente)
- **Output Directory**: `.next` (padrão do Next.js - deixe vazio)
- **Install Command**: `npm install` (padrão - deixe vazio)

**Não precisa configurar nada manualmente se o Root Directory estiver correto!**

---

## 🔧 Passo 3: Configurar Variáveis de Ambiente

Se ainda não configurou, adicione:

**URL**: https://vercel.com/synvolt/golffox/settings/environment-variables

1. `NEXT_PUBLIC_SUPABASE_URL` = `https://vmoxzesvjcfmrebagcwo.supabase.co`
   - ☑ Production ☑ Preview ☑ Development

2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU`
   - ☑ Production ☑ Preview ☑ Development

3. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = `AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM`
   - ☑ Production ☑ Preview ☑ Development

4. `SUPABASE_SERVICE_ROLE` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A`
   - ☑ Production ☑ Preview ❌ Development

---

## 🚀 Passo 4: Fazer Redeploy

Após configurar o Root Directory:

1. **Acesse**: https://vercel.com/synvolt/golffox/deployments

2. **Clique**: **"Redeploy"** no deployment mais recente

3. **Marque**: **"Use existing Build Cache"** = OFF

4. **Clique**: **"Redeploy"**

5. **Aguarde**: O build deve completar com sucesso!

---

## ✅ O Que Deve Acontecer

### Logs Esperados:

```
✅ Cloning completed
✅ Detected Next.js
✅ Installing dependencies...
   (em /vercel/path0/web-app/ - correto!)

✅ Running build command: npm run build

✅ Compiled successfully

✅ Generating static pages
```

### Não Deve Aparecer:

```
❌ cd: web-app: No such file or directory
❌ npm error path /vercel/path0/package.json
```

---

## 📋 Resumo

**A configuração via dashboard é MAIS CONFIÁVEL que arquivos de configuração!**

1. ✅ Root Directory = `web-app` (no dashboard)
2. ✅ Variáveis de ambiente configuradas
3. ✅ Redeploy

**Pronto!** 🚀

