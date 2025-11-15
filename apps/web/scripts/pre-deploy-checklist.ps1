###############################################################################
# PRÉ-DEPLOY CHECKLIST - GOLFFOX (PowerShell)
# 
# Script automatizado para verificar se o sistema está pronto para deploy
###############################################################################

Write-Host "================================================================================" -ForegroundColor White
Write-Host "🚀 PRÉ-DEPLOY CHECKLIST - GOLFFOX" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor White
Write-Host ""

# Contadores
$Script:Passed = 0
$Script:Failed = 0
$Script:Warnings = 0

# Função para imprimir resultado
function Print-Result {
    param(
        [bool]$Success,
        [string]$Message
    )
    
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor Green
        $Script:Passed++
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
        $Script:Failed++
    }
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
    $Script:Warnings++
}

# 1. VERIFICAÇÃO DE DEPENDÊNCIAS
Write-Host "📋 1. VERIFICAÇÃO DE DEPENDÊNCIAS" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------------------------"

# Node.js
try {
    $nodeVersion = node -v
    Print-Result $true "Node.js instalado: $nodeVersion"
} catch {
    Print-Result $false "Node.js não encontrado"
}

# npm
try {
    $npmVersion = npm -v
    Print-Result $true "npm instalado: $npmVersion"
} catch {
    Print-Result $false "npm não encontrado"
}

# Vercel CLI
try {
    $null = Get-Command vercel -ErrorAction Stop
    Print-Result $true "Vercel CLI instalado"
} catch {
    Print-Warning "Vercel CLI não encontrado (opcional)"
}

Write-Host ""
Write-Host "📦 2. VERIFICAÇÃO DE PACOTES" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------------------------"

# package.json
if (Test-Path "package.json") {
    Print-Result $true "package.json encontrado"
} else {
    Print-Result $false "package.json não encontrado"
}

# node_modules
if (Test-Path "node_modules") {
    Print-Result $true "node_modules instalado"
} else {
    Print-Warning "node_modules não encontrado. Execute: npm install"
}

Write-Host ""
Write-Host "🔍 3. AUDITORIA DE LINKS" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------------------------"

# Executar auditoria
if (Test-Path "scripts/audit-and-fix-links.js") {
    try {
        $auditResult = node scripts/audit-and-fix-links.js 2>&1 | Out-String
        if ($LASTEXITCODE -eq 0) {
            Print-Result $true "Auditoria de links passou"
        } else {
            Print-Result $false "Auditoria de links falhou"
        }
    } catch {
        Print-Result $false "Erro ao executar auditoria"
    }
} else {
    Print-Warning "Script de auditoria não encontrado"
}

Write-Host ""
Write-Host "🧪 4. TESTES E2E" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------------------------"

# Executar testes E2E
if (Test-Path "scripts/test-links-e2e.js") {
    try {
        $e2eOutput = node scripts/test-links-e2e.js 2>&1 | Out-String
        $successMatch = [regex]::Match($e2eOutput, 'Taxa de sucesso: ([\d.]+)%')
        
        if ($successMatch.Success) {
            $successRate = $successMatch.Groups[1].Value
            if ($LASTEXITCODE -eq 0) {
                Print-Result $true "Testes E2E passaram completamente"
            } else {
                $msg = "Testes E2E: " + $successRate + "% de sucesso"
                Print-Warning $msg
            }
        } else {
            Print-Warning "Nao foi possivel determinar resultado dos testes E2E"
        }
    } catch {
        Print-Warning "Erro ao executar testes E2E"
    }
} else {
    Print-Warning "Script de testes E2E não encontrado"
}

Write-Host ""
Write-Host "🏗️  5. BUILD DE PRODUÇÃO" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------------------------"

# Verificar se .next existe
if (Test-Path ".next") {
    Print-Result $true "Build existente encontrado"
} else {
    Print-Warning "Nenhum build encontrado. Execute: npm run build"
}

Write-Host ""
Write-Host "⚙️  6. VARIÁVEIS DE AMBIENTE" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------------------------"

# .env.local
if (Test-Path ".env.local") {
    Print-Result $true ".env.local encontrado"
    
    $envContent = Get-Content ".env.local" -Raw
    
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL") {
        Print-Result $true "NEXT_PUBLIC_SUPABASE_URL configurado"
    } else {
        Print-Result $false "NEXT_PUBLIC_SUPABASE_URL ausente"
    }
    
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
        Print-Result $true "NEXT_PUBLIC_SUPABASE_ANON_KEY configurado"
    } else {
        Print-Result $false "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente"
    }
} else {
    Print-Result $false ".env.local não encontrado"
}

Write-Host ""
Write-Host "📄 7. DOCUMENTAÇÃO" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------------------------"

# Verificar documentos
if (Test-Path "../LINK_MIGRATION_REPORT.md") {
    Print-Result $true "Relatório de migração encontrado"
} else {
    Print-Warning "Relatório de migração não encontrado"
}

if (Test-Path "../LINK_MIGRATION_SUMMARY.md") {
    Print-Result $true "Sumário executivo encontrado"
} else {
    Print-Warning "Sumário executivo não encontrado"
}

if (Test-Path "scripts/AUDIT_REPORT.json") {
    Print-Result $true "Relatório de auditoria JSON encontrado"
} else {
    Print-Warning "Relatório de auditoria JSON não encontrado"
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor White
Write-Host "📊 RESUMO FINAL" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor White
Write-Host ""

Write-Host "✅ Passaram: $Script:Passed" -ForegroundColor Green
Write-Host "❌ Falharam: $Script:Failed" -ForegroundColor Red
Write-Host "⚠️  Avisos: $Script:Warnings" -ForegroundColor Yellow
Write-Host ""

# Calcular score
$total = $Script:Passed + $Script:Failed
if ($total -gt 0) {
    $score = [math]::Round(($Script:Passed * 100) / $total, 1)
    $scoreMsg = "📈 Score: " + $score + "%"
    Write-Host $scoreMsg -ForegroundColor Cyan
    Write-Host ""
}

# Decisão final
if ($Script:Failed -eq 0) {
    Write-Host "✅ SISTEMA PRONTO PARA DEPLOY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. git add ."
    Write-Host "   2. git commit -m 'chore: auditoria de links concluída'"
    Write-Host "   3. git push origin main"
    Write-Host "   4. vercel --prod (ou deploy automático via CI/CD)"
    Write-Host ""
    exit 0
} else {
    Write-Host "❌ CORRIJA OS ERROS ANTES DO DEPLOY" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Acoes necessarias:" -ForegroundColor Yellow
    if ($Script:Failed -gt 0) {
        $failedMsg = "   - Revise os " + $Script:Failed + " itens que falharam acima"
        Write-Host $failedMsg
    }
    if ($Script:Warnings -gt 0) {
        $warningMsg = "   - Verifique os " + $Script:Warnings + " avisos opcionais"
        Write-Host $warningMsg
    }
    Write-Host ""
    exit 1
}

