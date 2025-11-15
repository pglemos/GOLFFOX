# Script simplificado para deploy no Vercel
Write-Host "Configurando variaveis e fazendo deploy..." -ForegroundColor Magenta
Write-Host ""

# Gerar CRON_SECRET
$cronSecret = -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "CRON_SECRET gerado: $cronSecret" -ForegroundColor Cyan
Write-Host ""

# Variáveis obrigatórias
$envVars = @{
    "NEXT_PUBLIC_SUPABASE_URL" = "https://vmoxzesvjcfmrebagcwo.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"
    "SUPABASE_SERVICE_ROLE_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A"
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" = "AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM"
    "CRON_SECRET" = $cronSecret
    "NODE_ENV" = "production"
}

$environments = @("production", "preview", "development")

foreach ($varName in $envVars.Keys) {
    $varValue = $envVars[$varName]
    Write-Host "Configurando $varName..." -ForegroundColor Cyan
    
    foreach ($env in $environments) {
        try {
            echo $varValue | vercel env add $varName $env 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   OK ${env}" -ForegroundColor Green
            } else {
                Write-Host "   AVISO ${env} (pode ja existir)" -ForegroundColor Yellow
            }
        } catch {
            $errorMsg = $_.Exception.Message
            Write-Host "   AVISO ${env}: $errorMsg" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

Write-Host "Executando deploy..." -ForegroundColor Magenta
Write-Host ""
vercel --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deploy concluido com sucesso!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Deploy falhou" -ForegroundColor Red
    exit 1
}

