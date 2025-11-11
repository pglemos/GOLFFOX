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

# Adicionar variáveis do Supabase (interativo)
Write-Host "🔧 Adicionando variáveis do Supabase..." -ForegroundColor Cyan
vercel env add SUPABASE_URL production preview development
vercel env add SUPABASE_ANON_KEY production preview development
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development

# Adicionar variáveis do Google Maps (interativo)
Write-Host "🗺️ Adicionando variáveis do Google Maps..." -ForegroundColor Cyan
vercel env add GOOGLE_MAPS_API_KEY production preview development
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production preview development

# Adicionar outras variáveis importantes (interativo)
Write-Host "⚙️ Adicionando configurações adicionais..." -ForegroundColor Cyan
vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development
vercel env add NODE_ENV production preview development
vercel env add NEXTAUTH_SECRET production preview development
vercel env add JWT_SECRET production preview development

Write-Host ""
Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host "🚀 Fazendo deploy..." -ForegroundColor Cyan

# Deploy (opcional)
$deploy = Read-Host "Deseja realizar deploy agora? (y/N)"
if ($deploy -eq 'y') {
  vercel --prod
}

Write-Host ""
Write-Host "🎉 Deploy concluído! Verifique sua aplicação no Vercel." -ForegroundColor Green
Write-Host "📱 URL: https://golffox.vercel.app" -ForegroundColor Cyan
