# 🔧 Correção Urgente - Install Command

## 🐛 Problema Identificado

Mesmo com **Root Directory = `web-app`** configurado, o erro persiste:
```
Running "install" command: `cd web-app && npm install`...
sh: line 1: cd: web-app: No such file or directory
```

## ✅ Causa Raiz

O **Install Command** no dashboard da Vercel está com **Override ativado** e contém:
```
cd web-app && npm install
```

**Mas quando Root Directory = `web-app` está configurado, a Vercel JÁ está trabalhando DENTRO de `web-app/`!**

Então, fazer `cd web-app &&` tenta entrar em um diretório que não existe (porque já está dentro dele).

---

## 🔧 SOLUÇÃO - Corrigir no Dashboard

### Passo 1: Acessar Build Settings

1. **Acesse**: https://vercel.com/synvolt/golffox/settings/build-and-deployment

### Passo 2: Corrigir Install Command

**Encontre a seção "Install Command":**

**OPÇÃO A (RECOMENDADA - Mais Simples):**
- **Desative** o toggle **"Override"** (deixe desligado/cinza)
- Isso fará a Vercel usar o padrão automático: `npm install`
- **Clique em "Save"**

**OPÇÃO B (Se Precisar Manter Override):**
- Mantenha o toggle **"Override"** ativado
- **Altere o campo** de: `cd web-app && npm install`
- **Para apenas**: `npm install`
- **Clique em "Save"**

### Passo 3: Verificar Build Command

**Encontre a seção "Build Command":**

- Se Override estiver ativo e contiver `cd web-app &&`, **remova** essa parte
- Deve ser apenas: `npm run build`
- Ou melhor: **Desative o Override** e deixe padrão

### Passo 4: Verificar Output Directory

**Encontre a seção "Output Directory":**

- Se Override estiver ativo, deve ser: `.next` (NÃO `web-app/.next`)
- Ou melhor: **Desative o Override** e deixe padrão

### Passo 5: Salvar e Redeploy

1. **Clique em "Save"** na página
2. **Acesse**: https://vercel.com/synvolt/golffox/deployments
3. **Clique**: **"Redeploy"**
4. **Marque**: **"Use existing Build Cache"** = OFF
5. **Clique**: **"Redeploy"**

---

## ✅ Configuração Correta

Com **Root Directory = `web-app`** configurado:

```
Install Command: npm install (sem cd web-app &&)
Build Command: npm run build (sem cd web-app &&)
Output Directory: .next (não web-app/.next)
```

**Ou melhor ainda: Desative todos os Overrides e deixe a Vercel detectar automaticamente!**

---

## 📋 Resumo Visual

**Antes (ERRADO):**
```
Install Command: [Override ON] cd web-app && npm install ❌
```

**Depois (CORRETO):**
```
Install Command: [Override OFF] npm install ✅
OU
Install Command: [Override ON] npm install ✅
```

---

## 🎯 Por Que Isso Acontece?

1. Você configurou **Root Directory = `web-app`**
2. A Vercel automaticamente muda para o diretório `web-app/` antes de executar comandos
3. Mas o Install Command ainda tem `cd web-app &&` 
4. Isso tenta entrar em `web-app/web-app/` que não existe!

**Solução**: Remover `cd web-app &&` de TODOS os comandos quando Root Directory está configurado.

---

**AÇÃO URGENTE**: Vá em Build and Deployment e corrija o Install Command agora! 🚀

