# Script para adicionar variáveis de ambiente no Vercel
Write-Host "🚀 Adicionando variáveis de ambiente..." -ForegroundColor Green

# Função para adicionar variável
function Add-VercelEnv {
    param($name, $value)
    Write-Host "➕ Adicionando $name..." -ForegroundColor Cyan
    echo $value | vercel env add $name production preview development
}

# Variáveis do Supabase
Add-VercelEnv "SUPABASE_URL" "https://vmoxzesvjcfmrebagcwo.supabase.co"
Add-VercelEnv "SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"
Add-VercelEnv "NEXT_PUBLIC_SUPABASE_URL" "https://vmoxzesvjcfmrebagcwo.supabase.co"
Add-VercelEnv "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"

# Variáveis do Google Maps
Add-VercelEnv "GOOGLE_MAPS_API_KEY" "AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM"
Add-VercelEnv "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" "AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM"

# Outras variáveis
Add-VercelEnv "SUPABASE_SERVICE_ROLE" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A"
Add-VercelEnv "NODE_ENV" "production"
Add-VercelEnv "NEXTAUTH_SECRET" "golffox-production-secret-2024"
Add-VercelEnv "JWT_SECRET" "golffox-jwt-secret-2024"

Write-Host "✅ Todas as variáveis foram adicionadas!" -ForegroundColor Green
Write-Host "🚀 Fazendo deploy..." -ForegroundColor Cyan
vercel --prod