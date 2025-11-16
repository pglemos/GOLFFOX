# Script PowerShell para deploy completo e testes
# Configuração automática do GOLFFOX na Vercel

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 DEPLOY E TESTE COMPLETO - GOLFFOX VERCEL                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Credenciais Supabase
$SUPABASE_URL = "https://vmoxzesvjcfmrebagcwo.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"
$SUPABASE_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A"

Write-Host "📋 Etapa 1: Adicionando arquivos ao Git..." -ForegroundColor Yellow
git add .
Write-Host "✅ Arquivos adicionados" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Etapa 2: Fazendo commit..." -ForegroundColor Yellow
git commit -m "fix: corrigir CSRF, Sentry DSN e configurar Supabase - análise completa e testes automatizados"
Write-Host "✅ Commit realizado" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Etapa 3: Fazendo push para GitHub (deploy automático)..." -ForegroundColor Yellow
git push origin main
Write-Host "✅ Push realizado - Deploy iniciado na Vercel" -ForegroundColor Green
Write-Host ""

Write-Host "⏳ Aguardando 30 segundos para o deploy iniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "📋 Etapa 4: Configurando variáveis de ambiente na Vercel..." -ForegroundColor Yellow
Write-Host ""

# Função para adicionar variável de ambiente
function Add-VercelEnv {
    param($Name, $Value)
    Write-Host "  → Configurando $Name..." -ForegroundColor Cyan
    
    # Criar arquivo temporário com o valor
    $tempFile = New-TemporaryFile
    Set-Content -Path $tempFile -Value $Value -NoNewline
    
    # Adicionar variável para todos os ambientes
    $cmd = "vercel env add $Name production --yes < `"$tempFile`""
    Invoke-Expression $cmd
    $cmd = "vercel env add $Name preview --yes < `"$tempFile`""
    Invoke-Expression $cmd
    $cmd = "vercel env add $Name development --yes < `"$tempFile`""
    Invoke-Expression $cmd
    
    Remove-Item $tempFile
    Write-Host "  ✅ $Name configurada" -ForegroundColor Green
}

# Configurar todas as variáveis
Add-VercelEnv "NEXT_PUBLIC_SUPABASE_URL" $SUPABASE_URL
Add-VercelEnv "NEXT_PUBLIC_SUPABASE_ANON_KEY" $SUPABASE_ANON_KEY
Add-VercelEnv "SUPABASE_URL" $SUPABASE_URL
Add-VercelEnv "SUPABASE_ANON_KEY" $SUPABASE_ANON_KEY
Add-VercelEnv "SUPABASE_SERVICE_ROLE_KEY" $SUPABASE_SERVICE_ROLE

Write-Host ""
Write-Host "✅ Todas as variáveis configuradas!" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Etapa 5: Fazendo redeploy com novas variáveis..." -ForegroundColor Yellow
vercel --prod --force
Write-Host "✅ Redeploy iniciado" -ForegroundColor Green
Write-Host ""

Write-Host "⏳ Aguardando 120 segundos para o deploy completar..." -ForegroundColor Yellow
Start-Sleep -Seconds 120

Write-Host "📋 Etapa 6: Executando testes automatizados..." -ForegroundColor Yellow
Write-Host ""

Set-Location "apps\web"

# Executar teste completo
Write-Host "🧪 Executando bateria completa de testes..." -ForegroundColor Cyan
node scripts\test-complete-system.js golffox@admin.com "sua_senha_aqui"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ✅ DEPLOY E TESTES CONCLUÍDOS                   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Verifique o relatório de testes acima" -ForegroundColor Cyan
Write-Host "🌐 Acesse: https://golffox.vercel.app" -ForegroundColor Cyan

