/**
 * Script: Seed de Branding por Empresa
 * Configura branding automático para empresas existentes
 * 
 * Uso: node scripts/seed-company-branding.js [--defaults]
 */

const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

// Cores padrão (via ENV ou hardcoded)
const BRAND_PRIMARY_DEFAULT = process.env.BRAND_PRIMARY_DEFAULT || '#F97316'
const BRAND_SECONDARY_DEFAULT = process.env.BRAND_SECONDARY_DEFAULT || '#0A2540'

// Cores alternativas por empresa
const BRAND_COLORS = [
  { primary: '#F97316', secondary: '#0A2540', name: 'Laranja' },
  { primary: '#3B82F6', secondary: '#1E40AF', name: 'Azul' },
  { primary: '#10B981', secondary: '#047857', name: 'Verde' },
  { primary: '#8B5CF6', secondary: '#6D28D9', name: 'Roxo' },
  { primary: '#EF4444', secondary: '#991B1B', name: 'Vermelho' },
]

async function seedCompanyBranding() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('🎨 Iniciando seed de branding...\n')
    await client.connect()
    console.log('✅ Conectado!\n')

    // Buscar empresas (role='operator' ou 'company')
    console.log('📋 Buscando empresas...')
    const { rows: companies } = await client.query(`
      SELECT id, name 
      FROM public.companies 
      WHERE role = 'operator' OR role = 'company'
      ORDER BY created_at DESC
    `)

    if (companies.length === 0) {
      console.log('⚠️  Nenhuma empresa encontrada')
      process.exit(0)
    }

    console.log(`   ✅ ${companies.length} empresas encontradas\n`)

    let created = 0
    let updated = 0
    let skipped = 0

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i]
      const colors = BRAND_COLORS[i % BRAND_COLORS.length]
      
      // Verificar se já existe branding
      const { rows: existing } = await client.query(
        `SELECT company_id FROM public.gf_company_branding WHERE company_id = $1`,
        [company.id]
      )

      if (existing.length > 0) {
        // Atualizar branding existente
        try {
          await client.query(
            `UPDATE public.gf_company_branding 
             SET name = $1, 
                 primary_hex = $2, 
                 accent_hex = $3,
                 updated_at = NOW()
             WHERE company_id = $4`,
            [
              company.name,
              colors.primary,
              colors.secondary,
              company.id
            ]
          )
          console.log(`   ✅ ${company.name}: branding atualizado`)
          updated++
        } catch (error) {
          console.warn(`   ⚠️  Erro ao atualizar ${company.name}: ${error.message}`)
          skipped++
        }
      } else {
        // Criar novo branding
        try {
          await client.query(
            `INSERT INTO public.gf_company_branding (
              company_id, name, primary_hex, accent_hex, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [
              company.id,
              company.name,
              colors.primary,
              colors.secondary
            ]
          )
          console.log(`   ✅ ${company.name}: branding criado (${colors.name})`)
          created++
        } catch (error) {
          console.warn(`   ⚠️  Erro ao criar branding para ${company.name}: ${error.message}`)
          skipped++
        }
      }
    }

    console.log(`\n📊 Resumo:`)
    console.log(`   Criados: ${created}`)
    console.log(`   Atualizados: ${updated}`)
    console.log(`   Ignorados: ${skipped}`)
    console.log(`   Total: ${companies.length}`)

    // Verificar resultado
    const { rows: brandingCount } = await client.query(
      `SELECT COUNT(*) as count FROM public.gf_company_branding`
    )
    console.log(`\n✅ Total de empresas com branding: ${brandingCount[0].count}`)

  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Conexão fechada.')
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedCompanyBranding().catch(console.error)
}

module.exports = { seedCompanyBranding }

