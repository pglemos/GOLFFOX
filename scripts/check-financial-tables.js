/**
 * Script para executar migration do sistema financeiro no Supabase
 * Usa Management API para executar SQL diretamente
 * 
 * Requer: ACCESS_TOKEN do Supabase (não service role)
 * Este script conecta via supabase-js e deleta/recria as tabelas financeiras
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vmoxzesvjcfmrebagcwo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
});

// Tentar deletar todos os dados e depois verificar se a tabela precisa de alteração
async function runMigration() {
    console.log('🚀 Script de Verificação e Correção do Sistema Financeiro\n');
    console.log('=========================================================\n');

    // 1. Verificar estrutura atual da tabela gf_cost_categories
    console.log('📌 Verificando estrutura atual de gf_cost_categories...');

    const { data: categoriesData, error: catError } = await supabase
        .from('gf_cost_categories')
        .select('*')
        .limit(5);

    if (catError) {
        if (catError.code === '42P01') {
            console.log('   Tabela NÃO existe. A migration precisa ser executada.');
        } else if (catError.code === '42703') {
            console.log(`   Tabela existe mas com estrutura DIFERENTE: ${catError.message}`);
            console.log('   A tabela precisa ser recriada com a nova estrutura.');
        } else {
            console.log(`   Erro: ${catError.message} (${catError.code})`);
        }
    } else {
        console.log(`   ✅ Tabela existe - ${categoriesData.length} registros encontrados`);
        if (categoriesData.length > 0) {
            console.log('   Colunas:', Object.keys(categoriesData[0]).join(', '));
        }
    }

    // 2. Verificar outras tabelas
    const tables = [
        'gf_manual_costs_v2',
        'gf_manual_revenues',
        'gf_budgets',
        'gf_financial_forecasts',
        'gf_financial_alerts'
    ];

    console.log('\n📊 Status das outras tabelas:');
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.log(`   ❌ ${table}: ${error.code === '42P01' ? 'não existe' : error.message}`);
        } else {
            console.log(`   ✅ ${table}: existe`);
        }
    }

    // 3. Verificar se conseguimos inserir categoria com a nova estrutura
    console.log('\n📌 Testando inserção com nova estrutura...');

    const testData = {
        name: 'Teste_Migration_' + Date.now(),
        profile_type: 'admin',
        icon: 'test',
        color: '#FF0000',
        keywords: ['teste'],
        is_operational: false,
        is_active: true,
        display_order: 999
    };

    const { data: insertData, error: insertError } = await supabase
        .from('gf_cost_categories')
        .insert(testData)
        .select();

    if (insertError) {
        console.log(`   ❌ Inserção falhou: ${insertError.message}`);

        if (insertError.message.includes('profile_type')) {
            console.log('\n⚠️  A coluna "profile_type" não existe na tabela atual.');
            console.log('   A tabela gf_cost_categories precisa ser recriada.\n');
            console.log('=========================================================');
            console.log('AÇÃO NECESSÁRIA:');
            console.log('=========================================================');
            console.log(`
1. Acesse: https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/sql/new

2. Execute este SQL primeiro para limpar:

   DROP TABLE IF EXISTS gf_financial_alerts CASCADE;
   DROP TABLE IF EXISTS gf_financial_forecasts CASCADE;
   DROP TABLE IF EXISTS gf_budgets CASCADE;
   DROP TABLE IF EXISTS gf_manual_revenues CASCADE;
   DROP TABLE IF EXISTS gf_manual_costs_v2 CASCADE;
   DROP TABLE IF EXISTS gf_cost_categories CASCADE;

3. Depois cole e execute o conteúdo do arquivo:
   F:\\GOLFFOX\\supabase\\migrations\\20241211_financial_system.sql
`);
        }
    } else {
        console.log(`   ✅ Inserção bem-sucedida! ID: ${insertData[0]?.id}`);

        // Limpar registro de teste
        await supabase.from('gf_cost_categories').delete().eq('name', testData.name);
        console.log('   (Registro de teste removido)');

        console.log('\n✅ A estrutura está CORRETA! Verificando categorias existentes...');

        // Listar categorias
        const { data: allCats } = await supabase
            .from('gf_cost_categories')
            .select('name, profile_type')
            .order('display_order');

        if (allCats && allCats.length > 0) {
            console.log('\n📊 Categorias cadastradas:');
            allCats.forEach(cat => console.log(`   - ${cat.name} (${cat.profile_type})`));
        } else {
            console.log('\n⚠️  Nenhuma categoria cadastrada. Inserindo categorias iniciais...');
            await insertInitialCategories();
        }
    }

    console.log('\n=========================================================');
    console.log('Script finalizado.');
}

async function insertInitialCategories() {
    const categories = [
        { name: 'Folha de Pagamento', profile_type: 'admin', icon: 'users', color: '#2563EB', keywords: ['salário', 'funcionários'], is_operational: false, display_order: 1 },
        { name: 'Benefícios', profile_type: 'admin', icon: 'gift', color: '#7C3AED', keywords: ['vale', 'alimentação'], is_operational: false, display_order: 2 },
        { name: 'Tecnologia', profile_type: 'admin', icon: 'monitor', color: '#0891B2', keywords: ['ti', 'software'], is_operational: false, display_order: 3 },
        { name: 'Faturamento Golf Fox', profile_type: 'empresa', icon: 'file-text', color: '#F97316', keywords: ['fatura', 'contrato'], is_operational: false, display_order: 1 },
        { name: 'Gestão Interna', profile_type: 'empresa', icon: 'briefcase', color: '#2563EB', keywords: ['rh', 'administração'], is_operational: false, display_order: 2 },
        { name: 'Combustível', profile_type: 'transportadora', icon: 'fuel', color: '#F97316', keywords: ['diesel', 'gasolina'], is_operational: true, display_order: 1 },
        { name: 'Manutenção Preventiva', profile_type: 'transportadora', icon: 'wrench', color: '#2563EB', keywords: ['revisão', 'óleo'], is_operational: true, display_order: 2 },
        { name: 'Manutenção Corretiva', profile_type: 'transportadora', icon: 'tool', color: '#DC2626', keywords: ['reparo', 'conserto'], is_operational: true, display_order: 3 },
        { name: 'Pneus', profile_type: 'transportadora', icon: 'circle', color: '#1E293B', keywords: ['pneu', 'calibragem'], is_operational: true, display_order: 4 },
        { name: 'Pedágios', profile_type: 'transportadora', icon: 'credit-card', color: '#64748B', keywords: ['pedágio', 'sem parar'], is_operational: true, display_order: 5 },
        { name: 'Outros', profile_type: 'all', icon: 'more-horizontal', color: '#94A3B8', keywords: ['outro', 'diversos'], is_operational: false, display_order: 99 }
    ];

    const { error } = await supabase.from('gf_cost_categories').insert(categories);

    if (error) {
        console.log(`   ❌ Erro ao inserir categorias: ${error.message}`);
    } else {
        console.log(`   ✅ ${categories.length} categorias inseridas!`);
    }
}

runMigration().catch(console.error);
