# PowerShell Script para Conversão .drawio para .vsdx
# Requer Draw.io Web ou Desktop

param(
    [string]$InputFile = "docs\diagrams\GOLFFOX_FLUXOGRAMA_COMPLETO.drawio",
    [string]$OutputFile = "docs\diagrams\GOLFFOX_FLUXOGRAMA_COMPLETO_v1.0.0.vsdx",
    [switch]$OpenBrowser = $false
)

Write-Host "🔄 Conversor Draw.io para VSDX - GolfFox" -ForegroundColor Cyan
Write-Host ""

# Verifica se o arquivo existe
if (-not (Test-Path $InputFile)) {
    Write-Host "❌ Erro: Arquivo não encontrado: $InputFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo encontrado: $InputFile" -ForegroundColor Green
Write-Host ""

# Verifica Draw.io CLI (opcional)
$drawioCli = Get-Command "drawio" -ErrorAction SilentlyContinue

if ($drawioCli) {
    Write-Host "📦 Draw.io CLI encontrado. Tentando conversão automática..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        drawio --export --format vsdx --output $OutputFile $InputFile
        
        if (Test-Path $OutputFile) {
            Write-Host "✅ Conversão concluída com sucesso!" -ForegroundColor Green
            Write-Host "📄 Arquivo salvo em: $OutputFile" -ForegroundColor Green
            exit 0
        }
    } catch {
        Write-Host "⚠️ Conversão CLI falhou, usando método web..." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Método Web
Write-Host "🌐 Abrindo Draw.io Web para conversão manual..." -ForegroundColor Cyan
Write-Host ""

# Cria URL para abrir o arquivo no Draw.io Web
$fullPath = (Resolve-Path $InputFile).Path
$fileUri = [System.Uri]::EscapeDataString("file:///$($fullPath.Replace('\', '/'))")
$drawioUrl = "https://app.diagrams.net/?splash=0&lightbox=1&nav=1&title=GOLFFOX_FLUXOGRAMA_COMPLETO.drawio#U$fileUri"

Write-Host "📋 INSTRUÇÕES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. O navegador será aberto com o Draw.io Web" -ForegroundColor White
Write-Host "2. Aguarde o diagrama carregar" -ForegroundColor White
Write-Host "3. No menu: File → Export as → VSDX" -ForegroundColor White
Write-Host "4. Configure o nome: GOLFFOX_FLUXOGRAMA_COMPLETO_v1.0.0" -ForegroundColor White
Write-Host "5. Clique em 'Export' e salve em: docs\diagrams\" -ForegroundColor White
Write-Host ""

if ($OpenBrowser) {
    Write-Host "🌐 Abrindo navegador..." -ForegroundColor Cyan
    Start-Process $drawioUrl
} else {
    Write-Host "💡 Para abrir automaticamente no navegador, execute:" -ForegroundColor Yellow
    Write-Host "   .\convert-drawio-to-vsdx.ps1 -OpenBrowser" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Ou acesse manualmente:" -ForegroundColor Cyan
    Write-Host "   https://app.diagrams.net/" -ForegroundColor White
    Write-Host ""
    Write-Host "   E abra o arquivo: $InputFile" -ForegroundColor White
}

Write-Host ""
Write-Host "✅ Processo concluído!" -ForegroundColor Green
