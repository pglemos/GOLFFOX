# ⚠️ IMPORTANTE - Configuração Vercel

## Problema Identificado

O projeto Next.js está em `/web-app`, mas a Vercel está tentando fazer build na raiz.

## Solução: Configurar Root Directory na Vercel

### Passo 1: Configurar Root Directory

1. Acesse: https://vercel.com/synvolt/golffox/settings/general
2. Role até **"Root Directory"**
3. Digite: `web-app`
4. Clique em **"Save"**

### Passo 2: Ou Usar Configuração via vercel.json

Já foi criado um `vercel.json` na raiz que aponta para `web-app`, mas a forma mais confiável é configurar diretamente no dashboard da Vercel.

---

## Arquivos Criados

- ✅ `vercel.json` na raiz (backup)
- ✅ `package.json` na raiz (para compatibilidade)
- ✅ `.vercelignore` (ignora arquivos desnecessários)

---

## Após Configurar Root Directory

1. Vá em: https://vercel.com/synvolt/golffox/deployments
2. Clique em **"Redeploy"** no deployment mais recente
3. Marque **"Use existing Build Cache"** = OFF
4. Clique em **"Redeploy"**
5. Aguarde o build completar

---

**A configuração via dashboard é mais confiável!** Configure o Root Directory como `web-app` nas configurações do projeto.

