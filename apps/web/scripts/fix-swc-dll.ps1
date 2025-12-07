# Script PowerShell para corrigir problema do SWC DLL no Windows
# Execute apos instalar Visual C++ Redistributable

Write-Host "Corrigindo problema do SWC DLL..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se o pacote esta instalado
$swcPath = "node_modules\@next\swc-win32-x64-msvc"
$swcNodeFile = "$swcPath\next-swc.win32-x64-msvc.node"

if (-not (Test-Path $swcNodeFile)) {
    Write-Host "Pacote SWC nao encontrado. Reinstalando..." -ForegroundColor Yellow
    npm install @next/swc-win32-x64-msvc@^16.0.0 --save-optional --force
}

# 2. Verificar se o arquivo existe e tem tamanho valido
if (Test-Path $swcNodeFile) {
    $file = Get-Item $swcNodeFile
    $sizeMB = [math]::Round($file.Length / 1MB, 2)
    Write-Host "Arquivo SWC encontrado: $sizeMB MB" -ForegroundColor Green
    
    if ($file.Length -lt 1000000) {
        Write-Host "Arquivo parece corrompido. Reinstalando..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $swcPath -ErrorAction SilentlyContinue
        npm install @next/swc-win32-x64-msvc@^16.0.0 --save-optional --force
    }
} else {
    Write-Host "Arquivo SWC nao encontrado!" -ForegroundColor Red
    exit 1
}

# 3. Verificar Visual C++ Redistributable
Write-Host ""
Write-Host "Verificando Visual C++ Redistributable..." -ForegroundColor Cyan

$vcRedist = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" -ErrorAction SilentlyContinue
if ($vcRedist) {
    Write-Host "Visual C++ Redistributable encontrado: Versao $($vcRedist.Version)" -ForegroundColor Green
} else {
    Write-Host "Visual C++ Redistributable nao encontrado no registro" -ForegroundColor Yellow
    Write-Host "Mas pode estar instalado. Continuando..." -ForegroundColor Yellow
}

# 4. Limpar cache do Next.js
Write-Host ""
Write-Host "Limpando cache do Next.js..." -ForegroundColor Cyan
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "Cache limpo" -ForegroundColor Green
}

# 5. Verificar se precisa copiar do fallback
$fallbackPath = "node_modules\next\next-swc-fallback\@next\swc-win32-x64-msvc"
if (Test-Path $fallbackPath) {
    if (-not (Test-Path $swcPath)) {
        Write-Host "Copiando SWC do fallback para local correto..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path "node_modules\@next" -Force | Out-Null
        Copy-Item -Recurse -Force $fallbackPath $swcPath
        Write-Host "Copiado com sucesso" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Correcao concluida!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "   1. Feche todos os terminais Node.js abertos" -ForegroundColor White
Write-Host "   2. Reinicie o terminal/PowerShell" -ForegroundColor White
Write-Host "   3. Execute: npm run dev" -ForegroundColor White
Write-Host ""

