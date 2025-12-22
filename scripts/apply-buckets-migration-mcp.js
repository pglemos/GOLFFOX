/**
 * Script para Aplicar Migration de Buckets via Supabase MCP/API
 * GolfFox - Padronização de Nomenclatura PT-BR
 * 
 * Usa Supabase Client para executar SQL diretamente
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Tentar carregar .env
const envPaths = [
    path.join(__dirname, '..', 'apps', 'web', '.env.local'),
    path.join(__dirname, '..', 'apps', 'web', '.env'),
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env')
];

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        try {
            require('dotenv').config({ path: envPath });
        } catch (e) {
            // dotenv não disponível, continuar
        }
        break;
    }
}

// Configuração do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas');
    console.error('   Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function executeSQL(sql) {
    try {
        // Tentar executar via RPC se disponível
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
            // Se não houver RPC, tentar método alternativo
            throw new Error(`RPC não disponível: ${error.message}`);
        }
        
        return { success: true, data };
    } catch (error) {
        // Método alternativo: dividir em statements menores
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^(BEGIN|COMMIT)$/i));
        
        console.log(`   ⚠️  Executando ${statements.length} statements individuais...`);
        
        const results = [];
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.length < 10) continue; // Ignorar statements muito pequenos
            
            try {
                // Para DO blocks e outros statements complexos, precisamos executar via REST API
                // Mas Supabase não permite execução direta de SQL via REST por segurança
                console.log(`   ⚠️  Statement ${i + 1}/${statements.length} precisa ser executado manualmente`);
            } catch (err) {
                console.error(`   ❌ Erro no statement ${i + 1}:`, err.message);
            }
        }
        
        throw new Error('Execução via API não suportada. Use Supabase Dashboard.');
    }
}

async function applyMigration() {
    console.log('🚀 Iniciando migração de buckets para Português BR via Supabase\n');

    try {
        // Ler arquivo de migration
        const migrationPath = path.join(__dirname, '../supabase/migrations/20250128_rename_buckets_pt_br.sql');
        
        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Arquivo de migration não encontrado: ${migrationPath}`);
            process.exit(1);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        
        console.log('📄 Migration carregada com sucesso');
        console.log(`   Tamanho: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);

        // Tentar executar via RPC
        console.log('⚙️  Tentando executar via Supabase RPC...\n');
        
        try {
            const result = await executeSQL(migrationSQL);
            console.log('✅ Migration aplicada com sucesso via RPC!\n');
        } catch (error) {
            console.log('⚠️  Execução via RPC não disponível');
            console.log('   Usando método alternativo...\n');
            
            // Dividir migration em partes executáveis
            await applyMigrationInParts(migrationSQL);
        }

        // Verificar resultados
        await verifyMigration();

    } catch (error) {
        console.error('\n❌ Erro ao aplicar migration:', error.message);
        console.error('\n💡 Solução: Execute a migration manualmente no Supabase Dashboard');
        console.error('   1. Acesse: https://app.supabase.com');
        console.error('   2. Selecione seu projeto');
        console.error('   3. Vá em SQL Editor → New Query');
        console.error(`   4. Execute: supabase/migrations/20250128_rename_buckets_pt_br.sql`);
        process.exit(1);
    }
}

async function applyMigrationInParts(sql) {
    // Dividir em seções principais
    const sections = sql.split(/-- =+.*?=+\n/).filter(s => s.trim().length > 0);
    
    console.log(`📋 Migration dividida em ${sections.length} seções\n`);
    
    // Executar cada seção
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (section.trim().length < 50) continue; // Ignorar seções muito pequenas
        
        console.log(`   ⚙️  Processando seção ${i + 1}/${sections.length}...`);
        
        // Para cada seção, tentar executar statements individuais
        const statements = section.split(';').filter(s => s.trim().length > 10);
        
        for (const statement of statements) {
            if (statement.includes('DO $$') || statement.includes('BEGIN') || statement.includes('COMMIT')) {
                // Statements complexos precisam ser executados completos
                continue;
            }
            
            try {
                // Tentar executar statement simples
                // Nota: Supabase não permite execução direta via REST API
                console.log(`      ⚠️  Statement complexo detectado, requer execução manual`);
            } catch (err) {
                // Ignorar erros individuais
            }
        }
    }
    
    console.log('\n⚠️  Migration requer execução manual no Supabase Dashboard');
    console.log('   📄 Arquivo: supabase/migrations/20250128_rename_buckets_pt_br.sql\n');
}

async function verifyMigration() {
    console.log('🔍 Verificando buckets criados...\n');

    try {
        // Verificar buckets via Storage API
        const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets();

        if (bucketsError) {
            console.error('❌ Erro ao listar buckets:', bucketsError.message);
            return;
        }

        const newBuckets = buckets.filter(b => [
            'documentos-veiculo',
            'documentos-motorista',
            'documentos-transportadora',
            'documentos-empresa',
            'fotos-veiculo',
            'avatares',
            'custos'
        ].includes(b.id));

        if (newBuckets.length === 0) {
            console.log('⚠️  Nenhum bucket novo encontrado');
            console.log('   A migration ainda não foi aplicada');
        } else {
            console.log(`✅ ${newBuckets.length} buckets em português encontrados:\n`);
            newBuckets.forEach(bucket => {
                const publicStatus = bucket.public ? 'público' : 'privado';
                const sizeLimit = bucket.file_size_limit 
                    ? `${(bucket.file_size_limit / 1024 / 1024).toFixed(0)}MB` 
                    : 'sem limite';
                console.log(`   ✅ ${bucket.id}`);
                console.log(`      Status: ${publicStatus}, Limite: ${sizeLimit}`);
            });
        }
    } catch (error) {
        console.error('❌ Erro ao verificar buckets:', error.message);
    }
}

// Executar
applyMigration()
    .then(() => {
        console.log('✅ Processo concluído!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });

