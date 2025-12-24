# Configuração de Autenticação Supabase para Regeneração de Tipos

## 📋 Objetivo

Regenerar os tipos TypeScript do Supabase (`types/supabase.ts`) para corrigir os erros TS2306.

## ⚠️ Importante

O Supabase **não permite conexões diretas** ao PostgreSQL por segurança. É **obrigatório** usar um access token do Supabase CLI para gerar os tipos.

## 🔑 Como Obter o Access Token

1. Acesse: https://supabase.com/dashboard/account/tokens
2. Faça login na sua conta Supabase (mesma conta que criou o projeto)
3. Clique em "Generate new token"
4. Dê um nome descritivo (ex: "CLI Type Generation")
5. Copie o token gerado **IMEDIATAMENTE** (ele só aparece uma vez e não pode ser recuperado depois!)

## 🚀 Como Usar o Token

### Opção 1: Variável de Ambiente (Recomendado)

```bash
export SUPABASE_ACCESS_TOKEN="seu-token-aqui"
cd apps/web
npx supabase gen types typescript --project-id vmoxzesvjcfmrebagcwo > types/supabase.ts
```

### Opção 2: Flag --token

```bash
cd apps/web
npx supabase gen types typescript --project-id vmoxzesvjcfmrebagcwo --token "seu-token-aqui" > types/supabase.ts
```

### Opção 3: Login Interativo (se estiver em ambiente TTY)

```bash
cd apps/web
npx supabase login
npx supabase gen types typescript --project-id vmoxzesvjcfmrebagcwo > types/supabase.ts
```

## ✅ Verificação

Após gerar os tipos, verifique se o arquivo foi criado:

```bash
ls -lh apps/web/types/supabase.ts
```

O arquivo deve ter pelo menos alguns KB de tamanho (não pode estar vazio).

## 🔄 Próximos Passos

Após regenerar os tipos:

1. Verificar se os erros TS2306 foram resolvidos
2. Corrigir qualquer erro de tipo restante
3. Remover `ignoreBuildErrors` de `next.config.js` quando todos os erros estiverem corrigidos

## 📝 Notas

- O token é sensível e não deve ser commitado no Git
- O token expira após um período (geralmente 1 ano)
- Se o token expirar, gere um novo seguindo os mesmos passos

