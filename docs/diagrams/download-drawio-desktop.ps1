# PowerShell Script para Baixar Draw.io Desktop
# Versão mais recente do GitHub

Write-Host "📦 Download Draw.io Desktop - GolfFox" -ForegroundColor Cyan
Write-Host ""

$repo = "jgraph/drawio-desktop"
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"

Write-Host "🔍 Verificando versão mais recente..." -ForegroundColor Yellow

try {
    $release = Invoke-RestMethod -Uri $apiUrl -Headers @{"Accept"="application/json"}
    $version = $release.tag_name
    $assets = $release.assets
    
    # Procura instalador Windows
    $windowsInstaller = $assets | Where-Object { 
        $_.name -match "\.exe$|\.msi$" -and $_.name -notmatch "portable|dmg"
    } | Select-Object -First 1
    
    if (-not $windowsInstaller) {
        Write-Host "❌ Erro: Instalador Windows não encontrado" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Versão encontrada: $version" -ForegroundColor Green
    Write-Host "📦 Arquivo: $($windowsInstaller.name)" -ForegroundColor White
    Write-Host "📊 Tamanho: $([math]::Round($windowsInstaller.size / 1MB, 2)) MB" -ForegroundColor White
    Write-Host ""
    
    $downloadUrl = $windowsInstaller.browser_download_url
    $outputFile = "$PSScriptRoot\$($windowsInstaller.name)"
    
    Write-Host "⬇️  Iniciando download..." -ForegroundColor Yellow
    Write-Host "   URL: $downloadUrl" -ForegroundColor Gray
    Write-Host ""
    
    # Download
    Invoke-WebRequest -Uri $downloadUrl -OutFile $outputFile -UseBasicParsing
    
    if (Test-Path $outputFile) {
        Write-Host "✅ Download concluído!" -ForegroundColor Green
        Write-Host "📄 Arquivo salvo em: $outputFile" -ForegroundColor White
        Write-Host ""
        Write-Host "🚀 Próximos passos:" -ForegroundColor Cyan
        Write-Host "   1. Execute o instalador: $($windowsInstaller.name)" -ForegroundColor White
        Write-Host "   2. Instale o Draw.io Desktop" -ForegroundColor White
        Write-Host "   3. Abra: docs\diagrams\GOLFFOX_FLUXOGRAMA_COMPLETO.drawio" -ForegroundColor White
        Write-Host "   4. File → Export as → VSDX" -ForegroundColor White
        Write-Host ""
        
        # Pergunta se quer abrir
        $open = Read-Host "Abrir o instalador agora? (S/N)"
        if ($open -eq "S" -or $open -eq "s") {
            Start-Process $outputFile
            Write-Host "✅ Instalador aberto!" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Erro: Download falhou" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Erro ao buscar informações: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Acesse manualmente:" -ForegroundColor Yellow
    Write-Host "   https://github.com/jgraph/drawio-desktop/releases/latest" -ForegroundColor White
    Write-Host ""
    Write-Host "   Baixe o arquivo .exe ou .msi para Windows" -ForegroundColor White
    exit 1
}
