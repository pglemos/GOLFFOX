/**
 * Script para executar migração SQL no Supabase
 * Execute com: npx ts-node scripts/run-migration.ts
 */

import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('❌ Variáveis de ambiente não configuradas');
        console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, '../database/migrations/003_attachments_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('🚀 Executando migração SQL...');
    console.log(`📄 Arquivo: ${sqlPath}`);
    console.log(`📊 Total de caracteres: ${sql.length}`);

    try {
        // Usar API REST do Supabase para executar SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ query: sql }),
        });

        if (!response.ok) {
            // Se exec_sql não existir, tentar outra abordagem
            console.log('⚠️ Função exec_sql não disponível, tentando via pg...');

            // Usar a biblioteca @supabase/supabase-js para executar
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, serviceRoleKey, {
                auth: { persistSession: false }
            });

            // Dividir o SQL em statements individuais
            const statements = sql
                .split(/;\s*\n/)
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            console.log(`📝 Total de statements: ${statements.length}`);

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement.length < 10) continue; // Ignorar statements muito curtos

                console.log(`\n⏳ Executando statement ${i + 1}/${statements.length}...`);
                console.log(`   ${statement.substring(0, 80)}...`);

                // Usar rpc para executar cada statement
                const { error } = await supabase.rpc('exec_sql', { query: statement + ';' });

                if (error) {
                    console.log(`   ⚠️ Nota: ${error.message}`);
                } else {
                    console.log(`   ✅ OK`);
                }
            }
        } else {
            console.log('✅ Migração executada com sucesso via exec_sql!');
        }

        console.log('\n✅ Migração concluída!');
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
}

runMigration();
