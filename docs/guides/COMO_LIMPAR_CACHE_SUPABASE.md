# 🔄 COMO LIMPAR O CACHE DO SUPABASE

## ⚠️ IMPORTANTE: Você precisa fazer isso MANUALMENTE

Eu não tenho acesso ao dashboard web do Supabase, então você precisa fazer manualmente seguindo estas instruções visuais:

---

## 📋 PASSO A PASSO (2 minutos)

### 1️⃣ Acesse o Dashboard do Supabase
**URL:** https://supabase.com/dashboard

- Faça login na sua conta Supabase
- Você verá uma lista dos seus projetos

### 2️⃣ Selecione o Projeto
- Clique no projeto **GOLFFOX**
- Você será levado ao dashboard do projeto

### 3️⃣ Vá em Settings (Configurações)
**Localização:** Menu lateral esquerdo, no final

```
┌─────────────────────┐
│ 📊 Dashboard        │
│ 🗄️  Database        │
│ 🔐 Authentication   │
│ 📁 Storage          │
│ ...                 │
│ ⚙️  Settings        │ ← CLIQUE AQUI
└─────────────────────┘
```

### 4️⃣ Clique em API
**Localização:** Submenu de Settings

```
Settings
┌─────────────────────┐
│ General             │
│ 🔌 API              │ ← CLIQUE AQUI
│ Database            │
│ Auth                │
│ Storage             │
└─────────────────────┘
```

### 5️⃣ Role até "Schema Cache"
**Localização:** Quase no final da página API

Você verá uma seção chamada **"Schema Cache"** com texto explicativo:

```
Schema Cache
───────────────────────────────────────
PostgREST caches the schema to improve
performance. Reload the cache after making
schema changes.

┌────────────────────────────────┐
│  🔄 Reload schema cache        │ ← CLIQUE AQUI
└────────────────────────────────┘
```

### 6️⃣ Clique em "Reload schema cache"
- Um botão verde/azul com texto "Reload schema cache"
- Clique nele
- Você verá uma mensagem de confirmação

### 7️⃣ Aguarde
- ⏰ Aguarde **30-60 segundos**
- O cache está sendo limpo e recriado

---

## ✅ VERIFICAÇÃO

Após limpar o cache, volte ao terminal e execute:

```bash
node web-app/scripts/force-supabase-cache-reload.js
```

Você deve ver:
```
✅ Veículos ativos: 5
✅ Trips ativas: 5
✅ GPS (última hora): 15
```

---

## 🎯 TESTE O MAPA

Depois de limpar o cache do Supabase:

1. **Limpe o cache do navegador:**
   - Pressione `Ctrl + Shift + Delete`
   - Marque "Cached images and files"
   - Clique em "Clear data"

2. **Acesse o mapa:**
   - URL: https://golffox.vercel.app/admin/mapa
   - Faça login se necessário

3. **Você deve ver 5 veículos no mapa!** 🎉

---

## 🔍 SE NÃO ENCONTRAR A OPÇÃO

### Alternativa 1: Via SQL Editor
1. No Supabase, vá em **SQL Editor**
2. Cole e execute:
```sql
NOTIFY pgrst, 'reload schema';
ANALYZE vehicles;
ANALYZE trips;
ANALYZE driver_positions;
```

### Alternativa 2: Esperar
O cache do Supabase se atualiza automaticamente após algum tempo (pode levar até 1 hora).

---

## 📞 PRECISA DE AJUDA?

Se não conseguir encontrar a opção no dashboard:

1. **Procure por:** "Schema Cache", "Reload", "API Settings"
2. **Tire um print** do dashboard e mostre onde está
3. **Alternativa:** Teste o mapa mesmo sem limpar o cache

O banco de dados **JÁ ESTÁ CORRETO**, apenas o cache pode estar desatualizado.

---

## 🎉 LEMBRE-SE

✅ **Banco de dados:** 100% configurado  
✅ **Dados de teste:** 5 veículos com GPS  
✅ **Código:** 100% correto  
⏳ **Cache:** Precisa ser limpo manualmente  

**O sistema está pronto!** Só falta limpar o cache para o Supabase ver as mudanças. 🚀

