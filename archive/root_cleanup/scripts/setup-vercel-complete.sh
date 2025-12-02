#!/bin/bash

# Script de configuração completa do GOLFFOX na Vercel
# Executa configuração de variáveis de ambiente e deploy

set -e

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║     🚀 CONFIGURAÇÃO COMPLETA - GOLFFOX VERCEL                     ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Credenciais Supabase
SUPABASE_URL="https://vmoxzesvjcfmrebagcwo.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"
SUPABASE_SERVICE_ROLE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A"

# Configuração Vercel
PROJECT_ID="prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m"
TEAM_ID="team_9kUTSaoIkwnAVxy9nXMcAnej"

echo "📋 Etapa 1: Configurando variáveis de ambiente na Vercel..."
echo ""

# Configurar variáveis via Vercel CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development <<EOF
$SUPABASE_URL
EOF

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development <<EOF
$SUPABASE_ANON_KEY
EOF

vercel env add SUPABASE_URL production preview development <<EOF
$SUPABASE_URL
EOF

vercel env add SUPABASE_ANON_KEY production preview development <<EOF
$SUPABASE_ANON_KEY
EOF

vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development <<EOF
$SUPABASE_SERVICE_ROLE
EOF

echo "✅ Variáveis de ambiente configuradas!"
echo ""

echo "📋 Etapa 2: Listando variáveis configuradas..."
vercel env ls
echo ""

echo "✅ Configuração completa!"
echo ""
echo "Próximo passo: Execute 'vercel --prod' para fazer deploy"

