#!/bin/bash

# Script para configurar variáveis de ambiente na Vercel via API
# Usa o token de deploy da Vercel para configurar automaticamente

set -e

echo "🔧 Configurando variáveis de ambiente na Vercel..."

PROJECT_ID="prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m"
TEAM_ID="team_9kUTSaoIkwnAVxy9nXMcAnej"
VERCEL_TOKEN="V8FJoSMM3um4TfU05Y19PwFa"

# Variáveis do Supabase
SUPABASE_URL="https://vmoxzesvjcfmrebagcwo.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"
SUPABASE_SERVICE_ROLE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A"

# Função para adicionar variável de ambiente
add_env_var() {
    local key=$1
    local value=$2
    local target=$3
    
    echo "  → Adicionando $key para $target..."
    
    curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"key\": \"$key\",
        \"value\": \"$value\",
        \"type\": \"encrypted\",
        \"target\": [\"$target\"]
      }" \
      -s > /dev/null
    
    echo "  ✅ $key adicionada"
}

# Adicionar variáveis para cada ambiente
for env in "production" "preview" "development"; do
    echo ""
    echo "📋 Configurando ambiente: $env"
    
    add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "$env"
    add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "$env"
    add_env_var "SUPABASE_URL" "$SUPABASE_URL" "$env"
    add_env_var "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "$env"
    add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE" "$env"
done

echo ""
echo "✅ Todas as variáveis configuradas!"
echo ""
echo "Próximo passo: Fazer redeploy na Vercel"

