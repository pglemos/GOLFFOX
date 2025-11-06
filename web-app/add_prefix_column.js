const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function addPrefixColumn() {
    const client = new Client({ 
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    try {
        console.log('========================================');
        console.log('🚀 Adicionando coluna prefix');
        console.log('========================================');
        console.log('');
        
        console.log('🔌 Conectando ao Supabase...');
        await client.connect();
        console.log('✅ Conectado!');
        console.log('');
        
        // Verificar se a coluna já existe
        console.log('🔍 Verificando se coluna prefix já existe...');
        const checkColumn = await client.query(`
            SELECT column_name 
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'vehicles'
            AND column_name = 'prefix';
        `);
        
        if (checkColumn.rows.length > 0) {
            console.log('✅ Coluna prefix já existe!');
        } else {
            console.log('⚙️  Adicionando coluna prefix...');
            await client.query(`
                ALTER TABLE public.vehicles 
                ADD COLUMN prefix VARCHAR(50) NULL;
            `);
            console.log('✅ Coluna prefix adicionada!');
        }
        
        console.log('');
        
        // Verificar todas as colunas da tabela vehicles
        console.log('🔍 Verificando TODAS as colunas da tabela vehicles...');
        const allColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'vehicles'
            ORDER BY ordinal_position;
        `);
        
        console.log('');
        console.log('========================================');
        console.log('📋 Colunas da tabela vehicles:');
        console.log('========================================');
        allColumns.rows.forEach(row => {
            const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = row.column_default ? ` DEFAULT ${row.column_default}` : '';
            console.log(`  • ${row.column_name.padEnd(20)} ${row.data_type.padEnd(15)} ${nullable}${defaultVal}`);
        });
        console.log('');
        
        console.log('========================================');
        console.log('🎉 CONCLUÍDO!');
        console.log('========================================');
        
    } catch (error) {
        console.error('');
        console.error('========================================');
        console.error('❌ ERRO:');
        console.error('========================================');
        console.error('Mensagem:', error.message);
        console.error('');
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Conexão encerrada.');
    }
}

addPrefixColumn().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});

