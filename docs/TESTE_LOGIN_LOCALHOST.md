# Teste de Login - Localhost:3000

**Data:** 2025-01-27  
**Status:** ⚠️ **ERRO DE CONFIGURAÇÃO**

---

## 🔍 Problema Identificado

O teste de login falhou com o seguinte erro:

```
Erro de configuração do servidor. Entre em contato com o suporte.
Código: server_config_error
Status: 500 (Internal Server Error)
```

## 🔧 Causa Raiz

A variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` não está definida no arquivo `.env.local`.

O código em `apps/web/app/api/auth/login/route.ts` (linha 64) verifica:

```typescript
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
}
```

## ✅ Solução

Adicione a variável `SUPABASE_SERVICE_ROLE_KEY` ao arquivo `apps/web/.env.local`:

```bash
# Adicionar ao arquivo apps/web/.env.local
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### Como obter a Service Role Key:

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie a **`service_role` key** (não a `anon` key)
5. Adicione ao arquivo `.env.local`

### ⚠️ IMPORTANTE:

- **NUNCA** commite a `SUPABASE_SERVICE_ROLE_KEY` no Git
- Esta chave tem acesso total ao banco de dados (bypassa RLS)
- Mantenha-a apenas no `.env.local` (que está no `.gitignore`)

## 📋 Arquivo .env.local Completo

```bash
# ========================================
# GOLF FOX - Variáveis de Ambiente
# ========================================

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui  # ⬅️ ADICIONAR ESTA LINHA

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM

# Ambiente
NODE_ENV=development
```

## 🔄 Após Adicionar a Variável

1. **Reinicie o servidor de desenvolvimento:**
   ```bash
   # Parar o servidor atual (Ctrl+C)
   # Iniciar novamente
   cd apps/web && npm run dev
   ```

2. **Teste o login novamente:**
   - Email: `golffox@admin.com`
   - Senha: `senha123`

## 📝 Notas

- O servidor precisa ser reiniciado após adicionar variáveis de ambiente
- A `SUPABASE_SERVICE_ROLE_KEY` é necessária para:
  - Buscar dados do usuário na tabela `users` (bypassando RLS)
  - Verificar mapeamento de usuário-empresa (`gf_user_company_map`)
  - Operações administrativas no banco de dados

