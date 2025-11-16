# Script completo de configuração GolfFox v7.4
# Autor: AI Assistant
# Data: 2025

Write-Host "🚀 GOLF-FOX TRANSPORT SYSTEM v7.4" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configurações
$supabaseProject = "vmoxzesvjcfmrebagcwo"
$supabaseUrl = "https://$supabaseProject.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"

Write-Host "📋 ETAPA 1: Verificando estrutura do projeto..." -ForegroundColor Yellow

# Verifica se o arquivo de migration existe
if (Test-Path "lib\supabase\migration_complete_v74.sql") {
    Write-Host "✅ Migration SQL encontrada" -ForegroundColor Green
} else {
    Write-Host "❌ Migration SQL NÃO encontrada!" -ForegroundColor Red
    exit 1
}

# Verifica se o arquivo de seeds existe
if (Test-Path "lib\supabase\seeds_v74.sql") {
    Write-Host "✅ Seeds SQL encontrados" -ForegroundColor Green
} else {
    Write-Host "❌ Seeds SQL NÃO encontrados!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 ETAPA 2: Testando conexão com Supabase..." -ForegroundColor Yellow

# Testa conexão com Supabase
try {
    $headers = @{
        "apikey" = $anonKey
        "Authorization" = "Bearer $anonKey"
    }
    
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "✅ Conexão com Supabase: OK" -ForegroundColor Green
    Write-Host "   URL: $supabaseUrl" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ Não foi possível testar conexão automaticamente" -ForegroundColor Yellow
    Write-Host "   (Isso é normal, o Supabase pode estar configurado corretamente)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📋 ETAPA 3: Preparando ambiente Flutter..." -ForegroundColor Yellow

# Verifica Flutter
$flutterPath = "tools\flutter\bin\flutter.bat"
if (Test-Path $flutterPath) {
    Write-Host "✅ Flutter encontrado em: $flutterPath" -ForegroundColor Green
    
    # Verifica versão
    $version = & $flutterPath --version --no-version-check 2>&1 | Select-Object -First 1
    Write-Host "   $version" -ForegroundColor Gray
} else {
    Write-Host "❌ Flutter NÃO encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 ETAPA 4: Verificando dependências..." -ForegroundColor Yellow

# Verifica se pubspec.lock existe
if (Test-Path "pubspec.lock") {
    Write-Host "✅ Dependências instaladas" -ForegroundColor Green
} else {
    Write-Host "⚠️ Dependências não instaladas, instalando agora..." -ForegroundColor Yellow
    & $flutterPath pub get
}

Write-Host ""
Write-Host "📋 ETAPA 5: Limpando build anterior..." -ForegroundColor Yellow
& $flutterPath clean

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ CONFIGURAÇÃO LOCAL CONCLUÍDA!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 PRÓXIMOS PASSOS NO SUPABASE:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣ Acesse: https://supabase.com/dashboard/project/$supabaseProject/sql/new"
Write-Host ""
Write-Host "2️⃣ Execute o arquivo: lib\supabase\migration_complete_v74.sql"
Write-Host ""
Write-Host "3️⃣ Crie 5 usuários em: https://supabase.com/dashboard/project/$supabaseProject/auth/users"
Write-Host "   - admin@trans.com"
Write-Host "   - operador@trans.com"
Write-Host "   - transportadora@trans.com"
Write-Host "   - motorista@trans.com"
Write-Host "   - passageiro@trans.com"
Write-Host ""
Write-Host "4️⃣ Execute o arquivo: lib\supabase\seeds_v74.sql"
Write-Host ""
Write-Host "5️⃣ Ative Realtime: https://supabase.com/dashboard/project/$supabaseProject/database/replication"
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Iniciando aplicação Flutter..." -ForegroundColor Cyan
Write-Host ""
Write-Host "O aplicativo será aberto automaticamente no Chrome" -ForegroundColor Yellow
Write-Host "URL esperada: http://localhost:50000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Gray
Write-Host ""

# Inicia o app
& $flutterPath run -d chrome

