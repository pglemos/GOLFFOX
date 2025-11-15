# 🚀 Comandos Vercel CLI - GOLFFOX

## 📋 Pré-requisitos
```bash
# Instalar Vercel CLI (se não tiver)
npm install -g vercel

# Fazer login
vercel login

# Navegar para web-app
cd web-app

# Conectar ao projeto
vercel link --project=golffox
```

## 🗑️ Remover Variáveis Conflitantes
```bash
vercel env rm SUPABASE_URL --yes
vercel env rm SUPABASE_ANON_KEY --yes
vercel env rm NEXT_PUBLIC_SUPABASE_URL --yes
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY --yes
```

## ➕ Adicionar Variáveis do Supabase
```bash
# SUPABASE_URL
vercel env add SUPABASE_URL production preview development
# Quando solicitado, cole: https://vmoxzesvjcfmrebagcwo.supabase.co

# SUPABASE_ANON_KEY
vercel env add SUPABASE_ANON_KEY production preview development
# Quando solicitado, cole: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU

# NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
# Quando solicitado, cole: https://vmoxzesvjcfmrebagcwo.supabase.co

# NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
# Quando solicitado, cole: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU
```

## 🗺️ Adicionar Variáveis do Google Maps
```bash
# GOOGLE_MAPS_API_KEY
vercel env add GOOGLE_MAPS_API_KEY production preview development
# Quando solicitado, cole: AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM

# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production preview development
# Quando solicitado, cole: AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
```

## ⚙️ Adicionar Configurações Adicionais
```bash
# SUPABASE_SERVICE_ROLE
vercel env add SUPABASE_SERVICE_ROLE production preview development
# Quando solicitado, cole: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A

# NODE_ENV
vercel env add NODE_ENV production preview development
# Quando solicitado, cole: production

# NEXTAUTH_SECRET
vercel env add NEXTAUTH_SECRET production preview development
# Quando solicitado, cole: golffox-production-secret-2024

# JWT_SECRET
vercel env add JWT_SECRET production preview development
# Quando solicitado, cole: golffox-jwt-secret-2024
```

## 🚀 Deploy Final
```bash
vercel --prod
```

## 📋 Verificar Variáveis
```bash
# Listar todas as variáveis
vercel env ls

# Ver valor de uma variável específica
vercel env pull .env.local
```

## 🔗 Links Úteis
- **Projeto Vercel**: https://vercel.com/synvolt/golffox
- **Documentação**: https://vercel.com/docs/cli/env