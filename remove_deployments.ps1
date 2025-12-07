# Script para remover todos os deployments exceto o especificado
$keepDeploymentId = "dpl_ksesgQVfahBDPGQRLpMqjwuuVaS3"
$deploymentsToRemove = @()

Write-Host "Listando todos os deployments..." -ForegroundColor Yellow

# Função para obter todos os deployments paginados
function Get-AllDeployments {
    $allUrls = @()
    $nextToken = $null
    $pageCount = 0
    
    do {
        $pageCount++
        Write-Host "Processando página $pageCount..." -ForegroundColor Gray
        
        if ($nextToken) {
            $output = vercel ls --next $nextToken 2>&1 | Out-String
        } else {
            $output = vercel ls 2>&1 | Out-String
        }
        
        # Extrair URLs dos deployments
        $urls = $output | Select-String -Pattern "https://golffox-[a-z0-9]+-synvolt\.vercel\.app" -AllMatches | ForEach-Object { $_.Matches } | ForEach-Object { $_.Value } | Select-Object -Unique
        $allUrls += $urls
        
        Write-Host "  Encontrados $($urls.Count) deployments nesta página" -ForegroundColor Gray
        
        # Verificar se há próxima página
        if ($output -match "--next\s+(\d+)") {
            $nextToken = $matches[1]
            Write-Host "  Próxima página disponível: $nextToken" -ForegroundColor Gray
        } else {
            $nextToken = $null
        }
    } while ($nextToken)
    
    return $allUrls
}

# Obter todos os deployments
$allUrls = Get-AllDeployments
Write-Host "Encontrados $($allUrls.Count) deployments" -ForegroundColor Cyan

# Para cada URL, obter o ID e verificar se deve ser removido
foreach ($url in $allUrls) {
    Write-Host "Verificando: $url" -ForegroundColor Gray
    $inspectOutput = vercel inspect $url 2>&1 | Out-String
    
    if ($inspectOutput -match "id\s+(dpl_\S+)") {
        $deploymentId = $matches[1]
        if ($deploymentId -ne $keepDeploymentId) {
            $deploymentsToRemove += $deploymentId
            Write-Host "  → ID: $deploymentId (será removido)" -ForegroundColor Red
        } else {
            Write-Host "  → ID: $deploymentId (MANTIDO)" -ForegroundColor Green
        }
    }
}

Write-Host "`nTotal de deployments para remover: $($deploymentsToRemove.Count)" -ForegroundColor Yellow

if ($deploymentsToRemove.Count -eq 0) {
    Write-Host "Nenhum deployment para remover!" -ForegroundColor Green
    exit 0
}

# Remover deployments automaticamente
$removedCount = 0
$errorCount = 0

Write-Host "`nIniciando remoção dos deployments..." -ForegroundColor Yellow

foreach ($deploymentId in $deploymentsToRemove) {
    Write-Host "Removendo: $deploymentId..." -ForegroundColor Yellow -NoNewline
    $result = vercel rm $deploymentId --yes 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK]" -ForegroundColor Green
        $removedCount++
    } else {
        Write-Host " [ERRO]" -ForegroundColor Red
        Write-Host "  $result" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n" -NoNewline
Write-Host "=== RESUMO ===" -ForegroundColor Cyan
Write-Host "  Removidos: $removedCount" -ForegroundColor Green
Write-Host "  Erros: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host "  Mantido: $keepDeploymentId" -ForegroundColor Green

