# 🔧 Correção Final - Install Command na Vercel

## 🐛 Problema

Mesmo com Root Directory = `web-app` configurado, ainda aparece:
```
Running "install" command: `cd web-app && npm install`...
sh: line 1: cd: web-app: No such file or directory
```

## ✅ Causa

O problema é que o **Install Command** no dashboard da Vercel está com **Override ativado** e ainda contém `cd web-app && npm install`.

**Quando o Root Directory está configurado, a Vercel JÁ está dentro do diretório `web-app/`**, então não precisa fazer `cd web-app &&`.

## 🔧 Solução - Passo a Passo

### 1. Acessar Build Settings

1. **Acesse**: https://vercel.com/synvolt/golffox/settings/build-and-deployment

2. **Encontre a seção**: **"Install Command"**

3. **Verifique**: Se há um toggle **"Override"** ativado (azul)

### 2. Corrigir Install Command

**Opção A (Recomendada): Desativar Override**
- **Desative** o toggle **"Override"** do Install Command
- Deixe a Vercel usar o padrão automático (`npm install`)
- Clique em **"Save"**

**Opção B: Corrigir o Comando Manualmente**
- Se precisar manter o Override:
  - **Remova** `cd web-app &&` do campo
  - **Deixe apenas**: `npm install`
  - Clique em **"Save"**

### 3. Verificar Outros Comandos

Verifique também:

**Build Command:**
- Se Override está ativo, deve ser apenas: `npm run build` (sem `cd web-app &&`)
- Ou melhor: **Desative o Override** e deixe padrão

**Output Directory:**
- Se Override está ativo, deve ser: `.next` (sem `web-app/.next`)
- Ou melhor: **Desative o Override** e deixe padrão

### 4. Fazer Redeploy

Após corrigir:

1. **Acesse**: https://vercel.com/synvolt/golffox/deployments
2. **Clique**: **"Redeploy"**
3. **Marque**: **"Use existing Build Cache"** = OFF
4. **Clique**: **"Redeploy"**

---

## ✅ Configuração Ideal

Com Root Directory = `web-app` configurado, os comandos devem ser:

```
Install Command: npm install (sem override, ou override com apenas isso)
Build Command: npm run build (sem override, ou override com apenas isso)
Output Directory: .next (sem override, ou override com apenas isso)
```

**NÃO deve ter:**
- ❌ `cd web-app &&` em nenhum comando
- ❌ `web-app/.next` no Output Directory
- ❌ Qualquer referência a `web-app/` nos comandos

**Por quê?** Porque a Vercel JÁ está dentro de `web-app/` quando o Root Directory está configurado!

---

## 📋 Checklist de Correção

- [ ] Acessar Build and Deployment settings
- [ ] **Desativar Override do Install Command** (ou remover `cd web-app &&`)
- [ ] Verificar Build Command (remover `cd web-app &&` se houver)
- [ ] Verificar Output Directory (usar `.next` e não `web-app/.next`)
- [ ] Salvar alterações
- [ ] Fazer Redeploy
- [ ] Verificar logs

---

**Ação**: Vá em Build and Deployment e corrija o Install Command removendo `cd web-app &&` ou desativando o Override! 🚀

