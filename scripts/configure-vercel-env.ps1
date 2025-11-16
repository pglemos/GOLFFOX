# Script PowerShell para configurar variáveis de ambiente na Vercel via API

$ErrorActionPreference = "Stop"

Write-Host "`n🔧 Configurando variáveis de ambiente na Vercel via API...`n" -ForegroundColor Cyan

$PROJECT_ID = "prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m"
$TEAM_ID = "team_9kUTSaoIkwnAVxy9nXMcAnej"
$VERCEL_TOKEN = "V8FJoSMM3um4TfU05Y19PwFa"

# Variáveis do Supabase
$SUPABASE_URL = "https://vmoxzesvjcfmrebagcwo.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"
$SUPABASE_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A"

# Função para adicionar variável
function Add-VercelEnvVar {
    param($Key, $Value, $Target)
    
    Write-Host "  → Adicionando $Key para $Target..." -ForegroundColor Yellow
    
    $body = @{
        key = $Key
        value = $Value
        type = "encrypted"
        target = @($Target)
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $VERCEL_TOKEN"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID" `
            -Method Post `
            -Headers $headers `
            -Body $body
        
        Write-Host "  ✅ $Key adicionada" -ForegroundColor Green
        return $true
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 409) {
            Write-Host "  ⚠️  $Key já existe, atualizando..." -ForegroundColor Yellow
            return Update-VercelEnvVar -Key $Key -Value $Value -Target $Target
        } else {
            Write-Host "  ❌ Erro ao adicionar $Key : $_" -ForegroundColor Red
            return $false
        }
    }
}

# Função para atualizar variável existente
function Update-VercelEnvVar {
    param($Key, $Value, $Target)
    
    # Primeiro, listar env vars para pegar o ID
    $headers = @{
        "Authorization" = "Bearer $VERCEL_TOKEN"
    }
    
    try {
        $envVars = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_ID/env?teamId=$TEAM_ID" `
            -Method Get `
            -Headers $headers
        
        # Encontrar a variável pelo nome e target
        $existingVar = $envVars.envs | Where-Object { $_.key -eq $Key -and $_.target -contains $Target } | Select-Object -First 1
        
        if ($existingVar) {
            # Atualizar a variável
            $body = @{
                value = $Value
                type = "encrypted"
                target = @($Target)
            } | ConvertTo-Json
            
            $headers["Content-Type"] = "application/json"
            
            $response = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_ID/env/$($existingVar.id)?teamId=$TEAM_ID" `
                -Method Patch `
                -Headers $headers `
                -Body $body
            
            Write-Host "  ✅ $Key atualizada" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "  ❌ Erro ao atualizar $Key : $_" -ForegroundColor Red
        return $false
    }
    
    return $false
}

# Configurar para cada ambiente
$environments = @("production", "preview", "development")
$success = $true

foreach ($env in $environments) {
    Write-Host "`n📋 Configurando ambiente: $env" -ForegroundColor Cyan
    
    $success = $success -and (Add-VercelEnvVar "NEXT_PUBLIC_SUPABASE_URL" $SUPABASE_URL $env)
    $success = $success -and (Add-VercelEnvVar "NEXT_PUBLIC_SUPABASE_ANON_KEY" $SUPABASE_ANON_KEY $env)
    $success = $success -and (Add-VercelEnvVar "SUPABASE_URL" $SUPABASE_URL $env)
    $success = $success -and (Add-VercelEnvVar "SUPABASE_ANON_KEY" $SUPABASE_ANON_KEY $env)
    $success = $success -and (Add-VercelEnvVar "SUPABASE_SERVICE_ROLE_KEY" $SUPABASE_SERVICE_ROLE $env)
}

Write-Host "`n"
if ($success) {
    Write-Host "✅ Todas as variáveis configuradas com sucesso!" -ForegroundColor Green
    Write-Host "`n🚀 Próximo passo: Fazer redeploy na Vercel" -ForegroundColor Yellow
    Write-Host "   Executando redeploy automático...`n" -ForegroundColor Cyan
    
    # Trigger redeploy
    $headers = @{
        "Authorization" = "Bearer $VERCEL_TOKEN"
        "Content-Type" = "application/json"
    }
    
    try {
        # Pegar o último deployment
        $deployments = Invoke-RestMethod -Uri "https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID&teamId=$TEAM_ID&limit=1" `
            -Method Get `
            -Headers $headers
        
        if ($deployments.deployments.Count -gt 0) {
            $lastDeployment = $deployments.deployments[0]
            
            # Trigger redeploy
            $body = @{
                name = "golffox"
                deploymentId = $lastDeployment.uid
                target = "production"
            } | ConvertTo-Json
            
            $redeploy = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments?teamId=$TEAM_ID&forceNew=1" `
                -Method Post `
                -Headers $headers `
                -Body $body
            
            Write-Host "✅ Redeploy iniciado!" -ForegroundColor Green
            Write-Host "🌐 URL: https://golffox.vercel.app" -ForegroundColor Cyan
            Write-Host "📊 Status: https://vercel.com/synvolt/golffox/deployments" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "⚠️  Não foi possível fazer redeploy automático: $_" -ForegroundColor Yellow
        Write-Host "   Faça manualmente em: https://vercel.com/synvolt/golffox" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Algumas variáveis podem não ter sido configuradas" -ForegroundColor Yellow
}

Write-Host "`n✅ Script concluído!`n" -ForegroundColor Green

