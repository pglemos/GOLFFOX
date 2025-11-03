# =============================================================================
# SCRIPT AUTOMATIZADO PARA CONFIGURAR VARIÁVEIS NO VERCEL
# =============================================================================

Write-Host "🚀 Configurando variáveis de ambiente no Vercel..." -ForegroundColor Green
Write-Host ""

# Verificar se Vercel CLI está instalado
if (!(Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI não encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g vercel
}

# Login no Vercel (se necessário)
Write-Host "🔐 Fazendo login no Vercel..." -ForegroundColor Cyan
vercel login

# Navegar para o diretório web-app
Set-Location "web-app"

# Link do projeto (se necessário)
Write-Host "🔗 Conectando ao projeto..." -ForegroundColor Cyan
vercel link --project=golffox

Write-Host ""
Write-Host "📝 Configurando variáveis de ambiente..." -ForegroundColor Green
Write-Host ""

# Remover variáveis existentes (se houver conflito)
Write-Host "🗑️ Removendo variáveis conflitantes..." -ForegroundColor Yellow
vercel env rm SUPABASE_URL --yes 2>$null
vercel env rm SUPABASE_ANON_KEY --yes 2>$null
vercel env rm NEXT_PUBLIC_SUPABASE_URL --yes 2>$null
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY --yes 2>$null

# Adicionar variáveis do Supabase
Write-Host "🔧 Adicionando variáveis do Supabase..." -ForegroundColor Cyan
vercel env add SUPABASE_URL production preview development
Write-Host "https://vmoxzesvjcfmrebagcwo.supabase.co"

vercel env add SUPABASE_ANON_KEY production preview development
Write-Host "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"

vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
Write-Host "https://vmoxzesvjcfmrebagcwo.supabase.co"

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
Write-Host "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"

# Adicionar variáveis do Google Maps
Write-Host "🗺️ Adicionando variáveis do Google Maps..." -ForegroundColor Cyan
vercel env add GOOGLE_MAPS_API_KEY production preview development
Write-Host "AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM"

vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production preview development
Write-Host "AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM"

# Adicionar outras variáveis importantes
Write-Host "⚙️ Adicionando configurações adicionais..." -ForegroundColor Cyan
vercel env add SUPABASE_SERVICE_ROLE production preview development
Write-Host "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A"

vercel env add NODE_ENV production preview development
Write-Host "production"

vercel env add NEXTAUTH_SECRET production preview development
Write-Host "golffox-production-secret-2024"

vercel env add JWT_SECRET production preview development
Write-Host "golffox-jwt-secret-2024"

Write-Host ""
Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host "🚀 Fazendo deploy..." -ForegroundColor Cyan

# Deploy
vercel --prod

Write-Host ""
Write-Host "🎉 Deploy concluído! Verifique sua aplicação no Vercel." -ForegroundColor Green
Write-Host "📱 URL: https://golffox.vercel.app" -ForegroundColor Cyan