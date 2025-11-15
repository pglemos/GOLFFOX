# Script PowerShell para deploy autônomo no Vercel
# Configura variáveis de ambiente e executa deploy

Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "🚀 Deploy Autônomo no Vercel" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host ""

# Gerar CRON_SECRET
$cronSecret = -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "🔑 CRON_SECRET gerado: $cronSecret" -ForegroundColor Magenta
Write-Host ""

# Função para adicionar variável de ambiente
function Add-VercelEnvVar {
    param($name, $value, $environments = @("production", "preview", "development"))
    
    Write-Host "➕ Configurando $name..." -ForegroundColor Cyan
    
    foreach ($env in $environments) {
        try {
            echo $value | vercel env add $name $env --yes 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ $name configurado para $env" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  $name pode já existir em $env" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "   ⚠️  Erro ao configurar $name para $env: $_" -ForegroundColor Yellow
        }
    }
}

# Variáveis de ambiente
Write-Host "1️⃣ Configurando variáveis de ambiente..." -ForegroundColor Blue
Write-Host ""

# Supabase
Add-VercelEnvVar "NEXT_PUBLIC_SUPABASE_URL" "https://vmoxzesvjcfmrebagcwo.supabase.co"
Add-VercelEnvVar "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"
Add-VercelEnvVar "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A"

# Google Maps
Add-VercelEnvVar "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" "AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM"

# CRON Secret
Add-VercelEnvVar "CRON_SECRET" $cronSecret

# Node Env
Add-VercelEnvVar "NODE_ENV" "production"

Write-Host ""
Write-Host "2️⃣ Executando deploy..." -ForegroundColor Blue
Write-Host ""

# Fazer deploy
try {
    vercel --prod --yes
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Magenta
        Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "🌐 Verifique o status em: https://vercel.com/dashboard" -ForegroundColor Blue
    } else {
        Write-Host ""
        Write-Host "❌ Deploy falhou. Verifique os logs acima." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro no deploy: $_" -ForegroundColor Red
    exit 1
}

