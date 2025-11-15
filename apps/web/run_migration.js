const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function runMigration() {
    const client = new Client({ 
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    try {
        console.log('========================================');
        console.log('🚀 GOLF FOX - Migração v47');
        console.log('========================================');
        console.log('');
        
        console.log('🔌 Conectando ao Supabase...');
        await client.connect();
        console.log('✅ Conectado com sucesso!');
        console.log('');
        
        console.log('📖 Lendo arquivo SQL...');
        const sqlPath = path.join(__dirname, '..', 'database', 'migrations', 'v47_add_vehicle_columns.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('✅ Arquivo lido com sucesso!');
        console.log('');
        
        console.log('⚙️  Executando migração...');
        console.log('   - Adicionando colunas à tabela vehicles');
        console.log('   - Criando índices');
        console.log('   - Configurando storage bucket');
        console.log('   - Atualizando view v_live_vehicles');
        console.log('');
        
        await client.query(sql);
        
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
        if (checkColumns.rows.length > 0) {
            checkColumns.rows.forEach(row => {
                const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                const defaultVal = row.column_default ? ` DEFAULT ${row.column_default}` : '';
                console.log(`  ✓ ${row.column_name.padEnd(15)} ${row.data_type.padEnd(10)} ${nullable}${defaultVal}`);
            });
        } else {
            console.log('  ⚠️  Nenhuma coluna nova encontrada (podem já existir)');
        }
        console.log('');
        
        // Verificar índices
        console.log('🔍 Verificando índices...');
        const checkIndexes = await client.query(`
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'vehicles'
            AND indexname LIKE 'idx_vehicles_%'
            ORDER BY indexname;
        `);
        
        console.log('========================================');
        console.log('✅ Índices criados:');
        console.log('========================================');
        if (checkIndexes.rows.length > 0) {
            checkIndexes.rows.forEach(row => {
                console.log(`  ✓ ${row.indexname}`);
            });
        } else {
            console.log('  ⚠️  Nenhum índice encontrado');
        }
        console.log('');
        
        // Verificar storage bucket
        console.log('🔍 Verificando storage bucket...');
        const checkBucket = await client.query(`
            SELECT id, name, public FROM storage.buckets WHERE id = 'vehicle-photos';
        `);
        
        console.log('========================================');
        console.log('✅ Storage bucket:');
        console.log('========================================');
        if (checkBucket.rows.length > 0) {
            const bucket = checkBucket.rows[0];
            console.log(`  ✓ ${bucket.name} (público: ${bucket.public ? 'SIM' : 'NÃO'})`);
        } else {
            console.log('  ⚠️  Bucket não encontrado');
        }
        console.log('');
        
        console.log('========================================');
        console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('========================================');
        console.log('');
        console.log('📋 Resumo:');
        console.log(`  • ${checkColumns.rows.length} colunas adicionadas`);
        console.log(`  • ${checkIndexes.rows.length} índices criados`);
        console.log(`  • ${checkBucket.rows.length} bucket de storage configurado`);
        console.log('');
        
    } catch (error) {
        console.error('');
        console.error('========================================');
        console.error('❌ ERRO AO EXECUTAR MIGRAÇÃO:');
        console.error('========================================');
        console.error('Mensagem:', error.message);
        console.error('');
        
        if (error.code) {
            console.error('Código do erro:', error.code);
        }
        
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
        console.error('');
        
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Conexão encerrada.');
    }
}

runMigration().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
