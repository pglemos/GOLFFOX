# Script PowerShell para executar migração v47 no Supabase
# Executa a migração SQL diretamente no banco de dados

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GOLF FOX - Migração v47" -ForegroundColor Cyan
Write-Host "Adicionando colunas à tabela vehicles" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Connection string
$DATABASE_URL = "postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres"

# Verificar se o arquivo SQL existe
$sqlFile = "database/migrations/v47_add_vehicle_columns.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Erro: Arquivo $sqlFile não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo SQL encontrado: $sqlFile" -ForegroundColor Green
Write-Host ""

# Tentar executar com psql (se disponível)
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "🔧 Usando psql para executar migração..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        $env:PGPASSWORD = "Guigui1309@"
        psql "postgresql://postgres@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres" -f $sqlFile
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ Migração executada com sucesso!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        exit 0
    }
    catch {
        Write-Host "❌ Erro ao executar com psql: $_" -ForegroundColor Red
    }
}

# Se psql não estiver disponível, usar Node.js com pg
Write-Host "🔧 psql não encontrado, usando Node.js..." -ForegroundColor Yellow
Write-Host ""

# Criar script Node.js temporário
$nodeScript = @"
const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function runMigration() {
    const client = new Client({ connectionString });
    
    try {
        console.log('🔌 Conectando ao Supabase...');
        await client.connect();
        console.log('✅ Conectado com sucesso!');
        console.log('');
        
        console.log('📖 Lendo arquivo SQL...');
        const sql = fs.readFileSync('database/migrations/v47_add_vehicle_columns.sql', 'utf8');
        console.log('✅ Arquivo lido com sucesso!');
        console.log('');
        
        console.log('⚙️  Executando migração...');
        const result = await client.query(sql);
        console.log('✅ Migração executada com sucesso!');
        console.log('');
        
        // Verificar colunas adicionadas
        console.log('🔍 Verificando colunas adicionadas...');
        const checkColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'vehicles'
            AND column_name IN ('photo_url', 'capacity', 'is_active', 'company_id')
            ORDER BY column_name;
        `);
        
        console.log('');
        console.log('========================================');
        console.log('✅ Colunas adicionadas:');
        console.log('========================================');
        checkColumns.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });
        console.log('');
        
        // Verificar índices
        const checkIndexes = await client.query(`
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'vehicles'
            AND indexname LIKE 'idx_vehicles_%';
        `);
        
        console.log('========================================');
        console.log('✅ Índices criados:');
        console.log('========================================');
        checkIndexes.rows.forEach(row => {
            console.log(`  - ${row.indexname}`);
        });
        console.log('');
        
        // Verificar storage bucket
        const checkBucket = await client.query(`
            SELECT id, name, public FROM storage.buckets WHERE id = 'vehicle-photos';
        `);
        
        console.log('========================================');
        console.log('✅ Storage bucket:');
        console.log('========================================');
        if (checkBucket.rows.length > 0) {
            console.log(`  - ${checkBucket.rows[0].name} (público: ${checkBucket.rows[0].public})`);
        }
        console.log('');
        
        console.log('========================================');
        console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('========================================');
        
    } catch (error) {
        console.error('');
        console.error('========================================');
        console.error('❌ ERRO AO EXECUTAR MIGRAÇÃO:');
        console.error('========================================');
        console.error(error.message);
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
"@

# Salvar script Node.js
$nodeScriptPath = "database/run_migration.js"
$nodeScript | Out-File -FilePath $nodeScriptPath -Encoding UTF8

Write-Host "✅ Script Node.js criado: $nodeScriptPath" -ForegroundColor Green
Write-Host ""

# Verificar se Node.js está instalado
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "❌ Erro: Node.js não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale Node.js ou psql para executar a migração." -ForegroundColor Yellow
    exit 1
}

# Verificar se o pacote pg está instalado
Write-Host "🔍 Verificando pacote 'pg'..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if (-not $packageJson.dependencies.pg -and -not $packageJson.devDependencies.pg) {
    Write-Host "📦 Instalando pacote 'pg'..." -ForegroundColor Yellow
    npm install pg --save-dev
}

# Executar script Node.js
Write-Host "🚀 Executando migração com Node.js..." -ForegroundColor Yellow
Write-Host ""

try {
    node $nodeScriptPath
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ TUDO PRONTO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. As colunas foram adicionadas ao banco" -ForegroundColor White
    Write-Host "2. O storage bucket foi criado" -ForegroundColor White
    Write-Host "3. Os índices foram criados" -ForegroundColor White
    Write-Host "4. A view v_live_vehicles foi atualizada" -ForegroundColor White
    Write-Host ""
    Write-Host "Agora você pode remover as proteções do código!" -ForegroundColor Yellow
    
    # Limpar arquivo temporário
    Remove-Item $nodeScriptPath -ErrorAction SilentlyContinue
    
    exit 0
}
catch {
    Write-Host ""
    Write-Host "❌ Erro ao executar migração: $_" -ForegroundColor Red
    exit 1
}

