const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function checkAndAddColumns() {
    const client = new Client({ 
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    try {
        console.log('========================================');
        console.log('🔍 Verificando e Adicionando Colunas Faltantes');
        console.log('========================================');
        console.log('');
        
        await client.connect();
        console.log('✅ Conectado ao Supabase!');
        console.log('');
        
        // Colunas que o código espera
        const expectedColumns = [
            { name: 'id', type: 'UUID', nullable: false, default: 'uuid_generate_v4()' },
            { name: 'plate', type: 'TEXT', nullable: false },
            { name: 'model', type: 'TEXT', nullable: true },
            { name: 'year', type: 'INTEGER', nullable: true },
            { name: 'prefix', type: 'VARCHAR(50)', nullable: true },
            { name: 'capacity', type: 'INTEGER', nullable: true },
            { name: 'is_active', type: 'BOOLEAN', nullable: false, default: 'true' },
            { name: 'photo_url', type: 'TEXT', nullable: true },
            { name: 'company_id', type: 'UUID', nullable: true },
            { name: 'carrier_id', type: 'UUID', nullable: true },
            { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: true, default: 'now()' },
            { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: true }
        ];
        
        // Verificar colunas existentes
        const existingColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'vehicles'
            ORDER BY ordinal_position;
        `);
        
        const existingColumnNames = existingColumns.rows.map(col => col.column_name);
        
        console.log('📋 Colunas existentes:', existingColumnNames.join(', '));
        console.log('');
        
        // Adicionar colunas faltantes
        let addedCount = 0;
        
        for (const col of expectedColumns) {
            if (!existingColumnNames.includes(col.name)) {
                console.log(`⚙️  Adicionando coluna: ${col.name} (${col.type})...`);
                
                const nullable = col.nullable ? 'NULL' : 'NOT NULL';
                const defaultClause = col.default ? `DEFAULT ${col.default}` : '';
                
                await client.query(`
                    ALTER TABLE public.vehicles 
                    ADD COLUMN ${col.name} ${col.type} ${nullable} ${defaultClause};
                `);
                
                console.log(`   ✅ Coluna ${col.name} adicionada!`);
                addedCount++;
            }
        }
        
        if (addedCount === 0) {
            console.log('✅ Todas as colunas já existem!');
        } else {
            console.log('');
            console.log(`✅ ${addedCount} coluna(s) adicionada(s)!`);
        }
        
        console.log('');
        
        // Verificar novamente
        const finalColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'vehicles'
            ORDER BY ordinal_position;
        `);
        
        console.log('========================================');
        console.log('📋 Estrutura Final da Tabela vehicles:');
        console.log('========================================');
        finalColumns.rows.forEach(row => {
            const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = row.column_default ? ` DEFAULT ${row.column_default}` : '';
            const check = expectedColumns.find(c => c.name === row.column_name) ? '✅' : '⚠️';
            console.log(`  ${check} ${row.column_name.padEnd(20)} ${row.data_type.padEnd(25)} ${nullable}${defaultVal}`);
        });
        console.log('');
        
        console.log('========================================');
        console.log('🎉 VERIFICAÇÃO CONCLUÍDA!');
        console.log('========================================');
        
    } catch (error) {
        console.error('');
        console.error('========================================');
        console.error('❌ ERRO:');
        console.error('========================================');
        console.error('Mensagem:', error.message);
        console.error('');
        if (error.code) console.error('Código:', error.code);
        if (error.detail) console.error('Detalhes:', error.detail);
        console.error('');
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Conexão encerrada.');
    }
}

checkAndAddColumns().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});

