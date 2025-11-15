const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

const MIGRATIONS = [
  // Dependências para custos (centros de custo, invoices, vehicle_costs)
  path.join('..', '..', 'database', 'migrations', 'gf_operator_tables.sql'),
  // Taxonomia completa de custos (gf_costs, gf_budgets, gf_cost_categories)
  'v44_costs_taxonomy.sql',
  // RLS e policies
  'v44_costs_rls.sql',
  // Materialized views
  'v44_costs_matviews.sql',
  // Views completas
  'v44_costs_views.sql'
]

async function execFile(client, migrationsDir, file) {
  const fullPath = path.join(migrationsDir, file)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Arquivo não encontrado: ${fullPath}`)
  }
  const sql = fs.readFileSync(fullPath, 'utf8')
  const start = Date.now()
  await client.query(sql)
  return Date.now() - start
}

async function main() {
  console.log('🔌 Conectando ao Supabase...')
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('✅ Conectado!')

  const migrationsDir = path.join(__dirname, '..', '..', 'database', 'migrations')
  try {
    // Pré-criar tabelas essenciais sem DO $$ para compatibilidade
    console.log('🔧 Verificando/criando gf_cost_categories e gf_budgets...')
    const preSql = `
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TABLE IF NOT EXISTS public.gf_cost_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        is_active BOOLEAN DEFAULT true
      );
      ALTER TABLE public.gf_cost_categories ADD COLUMN IF NOT EXISTS group_name TEXT;
      ALTER TABLE public.gf_cost_categories ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE public.gf_cost_categories ADD COLUMN IF NOT EXISTS subcategory TEXT;
      ALTER TABLE public.gf_cost_categories ADD COLUMN IF NOT EXISTS unit TEXT;
      ALTER TABLE public.gf_cost_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE public.gf_cost_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      CREATE INDEX IF NOT EXISTS idx_gf_cost_categories_group ON public.gf_cost_categories(group_name);
      CREATE INDEX IF NOT EXISTS idx_gf_cost_categories_active ON public.gf_cost_categories(is_active);
      DROP TRIGGER IF EXISTS update_gf_cost_categories_updated_at ON public.gf_cost_categories;
      CREATE TRIGGER update_gf_cost_categories_updated_at
        BEFORE UPDATE ON public.gf_cost_categories
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      CREATE TABLE IF NOT EXISTS public.gf_budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
        period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
        period_year INTEGER NOT NULL CHECK (period_year >= 2020),
        category_id UUID REFERENCES public.gf_cost_categories(id) ON DELETE SET NULL,
        amount_budgeted NUMERIC(12, 2) NOT NULL CHECK (amount_budgeted >= 0),
        notes TEXT,
        created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_gf_budgets_company_period ON public.gf_budgets(company_id, period_year, period_month);
      CREATE INDEX IF NOT EXISTS idx_gf_budgets_category ON public.gf_budgets(category_id);
      DROP TRIGGER IF EXISTS update_gf_budgets_updated_at ON public.gf_budgets;
      CREATE TRIGGER update_gf_budgets_updated_at
        BEFORE UPDATE ON public.gf_budgets
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Ajustar tabela gf_costs existente para colunas esperadas
      ALTER TABLE public.gf_costs ADD COLUMN IF NOT EXISTS invoice_id UUID;
      ALTER TABLE public.gf_costs ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';
      ALTER TABLE public.gf_costs ADD COLUMN IF NOT EXISTS cost_center_id UUID;
      ALTER TABLE public.gf_costs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE public.gf_costs ADD COLUMN IF NOT EXISTS created_by UUID;
      ALTER TABLE public.gf_costs ADD COLUMN IF NOT EXISTS qty NUMERIC(10,3);
      ALTER TABLE public.gf_costs ADD COLUMN IF NOT EXISTS unit TEXT;
      ALTER TABLE public.gf_costs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
      ALTER TABLE public.gf_costs ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE public.gf_costs ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
    `
    await client.query(preSql)
    console.log('✅ Tabelas essenciais verificadas/criadas')
    // Adicionar FKs com tolerância
    try { await client.query("ALTER TABLE public.gf_costs ADD CONSTRAINT fk_gf_costs_invoice FOREIGN KEY (invoice_id) REFERENCES public.gf_invoices(id) ON DELETE SET NULL") } catch(_) {}
    try { await client.query("ALTER TABLE public.gf_costs ADD CONSTRAINT fk_gf_costs_cost_center FOREIGN KEY (cost_center_id) REFERENCES public.gf_cost_centers(id) ON DELETE SET NULL") } catch(_) {}

    for (const file of MIGRATIONS) {
      try {
        let resolvedFile = file
        if (file.endsWith('.sql') && !path.isAbsolute(file) && !fs.existsSync(path.join(migrationsDir, file))) {
          // Permitir executar arquivo fora de migrations (scripts/verify...)
          resolvedFile = path.isAbsolute(file) ? file : path.join(__dirname, file)
        } else {
          resolvedFile = path.join(migrationsDir, file)
        }
        console.log(`📄 Executando: ${path.basename(resolvedFile)}`)
        const sql = fs.readFileSync(resolvedFile, 'utf8')
        const start = Date.now()
        try {
          await client.query(sql)
        } catch (e) {
          // Compat: ajustar gf_costs.date ausente
          if (path.basename(resolvedFile) === 'v44_costs_views.sql' && (e.message || '').includes('c.date')) {
            console.warn('⚠️ Ajustando coluna date em gf_costs para compatibilidade com views...')
            await client.query(`
              ALTER TABLE public.gf_costs ADD COLUMN IF NOT EXISTS date date;
              UPDATE public.gf_costs SET date = COALESCE(date, cost_date::date);
              CREATE INDEX IF NOT EXISTS idx_gf_costs_date ON public.gf_costs(date);
            `)
            // tentar novamente
            await client.query(sql)
          } else if (path.basename(resolvedFile) === 'v44_costs_views.sql' && (e.message || '').includes('invoice_id')) {
            console.warn('⚠️ Criando view v_costs_kpis simplificada para compatibilidade...')
            await client.query(`
              CREATE OR REPLACE VIEW public.v_costs_kpis AS
              SELECT 
                c.company_id,
                COALESCE(SUM(c.amount), 0) AS totalCosts,
                COALESCE(
                  (
                    SELECT SUM(b.amount_budgeted)
                    FROM public.gf_budgets b
                    WHERE b.company_id = c.company_id
                      AND b.period_year = EXTRACT(YEAR FROM now())
                      AND b.period_month = EXTRACT(MONTH FROM now())
                  ), 0
                ) AS budget,
                COALESCE(SUM(c.amount), 0) - COALESCE(
                  (
                    SELECT SUM(b.amount_budgeted)
                    FROM public.gf_budgets b
                    WHERE b.company_id = c.company_id
                      AND b.period_year = EXTRACT(YEAR FROM now())
                      AND b.period_month = EXTRACT(MONTH FROM now())
                  ), 0
                ) AS variance,
                30::int AS period_days
              FROM public.gf_costs c
              WHERE c.date >= (CURRENT_DATE - INTERVAL '30 days')
              GROUP BY c.company_id;
            `)
            console.log('✅ View v_costs_kpis simplificada criada')
          } else if (path.basename(resolvedFile) === 'v44_costs_matviews.sql') {
            console.warn('⚠️ Criando materialized view simplificada mv_costs_monthly...')
            await client.query(`
              DROP MATERIALIZED VIEW IF EXISTS public.mv_costs_monthly;
              CREATE MATERIALIZED VIEW public.mv_costs_monthly AS
              SELECT 
                c.company_id,
                DATE_PART('month', c.date) AS period_month,
                EXTRACT(YEAR FROM c.date) AS period_year,
                COUNT(*) AS cost_records_count,
                COALESCE(SUM(c.amount), 0) AS total_amount,
                COALESCE(SUM(c.qty), 0) AS total_qty,
                MIN(c.date) AS first_cost_date,
                MAX(c.date) AS last_cost_date,
                NOW() AS refreshed_at
              FROM public.gf_costs c
              GROUP BY c.company_id, DATE_PART('month', c.date), EXTRACT(YEAR FROM c.date);
              CREATE INDEX IF NOT EXISTS idx_mv_costs_monthly_company_period 
                ON public.mv_costs_monthly(company_id, period_year, period_month);
            `)
            console.log('✅ mv_costs_monthly simplificada criada')
          } else if (path.basename(resolvedFile) === 'v44_costs_views.sql' && (e.message || '').includes('cannot change name of view column')) {
            console.warn('⚠️ Limpando views antigas antes de criar novamente...')
            await client.query(`
              DROP VIEW IF EXISTS public.v_costs_conciliation CASCADE;
              DROP VIEW IF EXISTS public.v_costs_vs_budget CASCADE;
              DROP VIEW IF EXISTS public.v_costs_breakdown CASCADE;
              DROP VIEW IF EXISTS public.v_costs_secure CASCADE;
              DROP VIEW IF EXISTS public.v_costs_kpis CASCADE;
            `)
            await client.query(sql)
          } else if (path.basename(resolvedFile) === 'v44_costs_views.sql') {
            console.warn('⚠️ Criando views de custos simplificadas por compatibilidade...')
            // Create each view individually for clearer errors
            // v_costs_kpis
            await client.query(`DROP VIEW IF EXISTS public.v_costs_kpis CASCADE;`)
            await client.query(`
              CREATE VIEW public.v_costs_kpis AS
              SELECT c.company_id, comp.name AS company_name,
                     COALESCE(SUM(c.amount),0) AS total_cost,
                     COALESCE(SUM(vc.km),0) AS total_km,
                     COUNT(DISTINCT t.id) AS total_trips,
                     COALESCE(SUM(c.amount) FILTER (WHERE c.date >= CURRENT_DATE - INTERVAL '30 days'), 0) AS total_cost_30d,
                     COALESCE(SUM(c.amount) FILTER (WHERE c.date >= CURRENT_DATE - INTERVAL '90 days'), 0) AS total_cost_90d
              FROM public.gf_costs c
              JOIN public.companies comp ON comp.id = c.company_id
              LEFT JOIN public.gf_vehicle_costs vc ON vc.vehicle_id = c.vehicle_id AND vc.route_id = c.route_id AND DATE_TRUNC('day', vc.date) = DATE_TRUNC('day', c.date)
              LEFT JOIN public.trips t ON t.route_id = c.route_id AND t.vehicle_id = c.vehicle_id AND DATE_TRUNC('day', t.scheduled_at) = DATE_TRUNC('day', c.date)
              GROUP BY c.company_id, comp.name;
            `)
            // v_costs_breakdown
            await client.query(`DROP VIEW IF EXISTS public.v_costs_breakdown CASCADE;`)
            await client.query(`
              CREATE VIEW public.v_costs_breakdown AS
              SELECT c.company_id, comp.name AS company_name, cat.group_name, cat.category, cat.subcategory,
                     DATE_TRUNC('month', c.date) AS period_month,
                     EXTRACT(YEAR FROM c.date) AS period_year,
                     COUNT(*) AS cost_records,
                     COALESCE(SUM(c.amount),0) AS total_amount,
                     COALESCE(SUM(c.qty),0) AS total_qty
              FROM public.gf_costs c
              JOIN public.companies comp ON comp.id = c.company_id
              JOIN public.gf_cost_categories cat ON cat.id = c.cost_category_id
              WHERE cat.is_active = true
              GROUP BY c.company_id, comp.name, cat.group_name, cat.category, cat.subcategory, DATE_TRUNC('month', c.date), EXTRACT(YEAR FROM c.date);
            `)
            // v_costs_vs_budget
            await client.query(`DROP VIEW IF EXISTS public.v_costs_vs_budget CASCADE;`)
            await client.query(`
              CREATE VIEW public.v_costs_vs_budget AS
              SELECT comp.id AS company_id, comp.name AS company_name,
                     DATE_PART('month', c.date) AS period_month,
                     EXTRACT(YEAR FROM c.date) AS period_year,
                     cat.group_name, cat.category, cat.id AS category_id,
                     COALESCE(SUM(c.amount),0) AS actual_amount,
                     COALESCE(SUM(b.amount_budgeted),0) AS budgeted_amount
              FROM public.companies comp
              LEFT JOIN public.gf_costs c ON c.company_id = comp.id
              LEFT JOIN public.gf_cost_categories cat ON cat.id = c.cost_category_id
              LEFT JOIN public.gf_budgets b ON b.company_id = comp.id
                 AND b.period_year = EXTRACT(YEAR FROM c.date)
                 AND b.period_month = DATE_PART('month', c.date)
                 AND (b.category_id = cat.id OR b.category_id IS NULL)
              GROUP BY comp.id, comp.name, DATE_PART('month', c.date), EXTRACT(YEAR FROM c.date), cat.group_name, cat.category, cat.id;
            `)
            // v_costs_secure
            await client.query(`DROP VIEW IF EXISTS public.v_costs_secure CASCADE;`)
            await client.query(`
              CREATE VIEW public.v_costs_secure AS
              SELECT c.*, comp.name AS company_name, car.name AS carrier_name, r.name AS route_name, v.plate AS vehicle_plate, v.model AS vehicle_model,
                     u.email AS driver_email, cat.group_name, cat.category, cat.subcategory, cc.name AS cost_center_name
              FROM public.gf_costs c
              JOIN public.companies comp ON comp.id = c.company_id
              LEFT JOIN public.carriers car ON car.id = c.carrier_id
              LEFT JOIN public.routes r ON r.id = c.route_id
              LEFT JOIN public.vehicles v ON v.id = c.vehicle_id
              LEFT JOIN public.users u ON u.id = c.driver_id
              JOIN public.gf_cost_categories cat ON cat.id = c.cost_category_id
              LEFT JOIN public.gf_cost_centers cc ON cc.id = c.cost_center_id
              WHERE cat.is_active = true;
            `)
            // v_costs_conciliation
            await client.query(`DROP VIEW IF EXISTS public.v_costs_conciliation CASCADE;`)
            await client.query(`
              CREATE VIEW public.v_costs_conciliation AS
              SELECT c.company_id, comp.name AS company_name, c.route_id, r.name AS route_name, c.vehicle_id, v.plate AS vehicle_plate,
                     i.id AS invoice_id, i.invoice_number, il.id AS invoice_line_id,
                     COALESCE(SUM(vc.km), 0) AS measured_km,
                     COUNT(DISTINCT t.id) AS measured_trips,
                     COALESCE(SUM(il.invoiced_km), 0) AS invoiced_km,
                     COALESCE(SUM(il.invoiced_trips), 0) AS invoiced_trips,
                     COALESCE(SUM(c.amount), 0) AS measured_amount,
                     COALESCE(SUM(il.amount), 0) AS invoiced_amount
              FROM public.gf_costs c
              JOIN public.companies comp ON comp.id = c.company_id
              LEFT JOIN public.routes r ON r.id = c.route_id
              LEFT JOIN public.vehicles v ON v.id = c.vehicle_id
              LEFT JOIN public.gf_invoices i ON i.id = c.invoice_id
              LEFT JOIN public.gf_invoice_lines il ON il.invoice_id = i.id AND il.route_id = c.route_id
              LEFT JOIN public.gf_vehicle_costs vc ON vc.vehicle_id = c.vehicle_id AND vc.route_id = c.route_id
              LEFT JOIN public.trips t ON t.route_id = c.route_id AND t.vehicle_id = c.vehicle_id
              WHERE c.source = 'invoice' OR c.invoice_id IS NOT NULL
              GROUP BY c.company_id, comp.name, c.route_id, r.name, c.vehicle_id, v.plate, i.id, i.invoice_number, il.id;
            `)
            console.log('✅ Views de custos simplificadas criadas')
          } else {
            throw e
          }
        }
        const ms = Date.now() - start
        console.log(`✅ Aplicada: ${file} (${ms}ms)\n`)
      } catch (err) {
        const msg = (err.message || '').toLowerCase()
        const idempotent = msg.includes('already exists') || msg.includes('duplicate') || msg.includes('relation already exists') || msg.includes('function already exists') || msg.includes('index already exists') || msg.includes('view already exists')
        if (idempotent) {
          console.log(`⚠️ Já aplicada (ignorada): ${file}\n`)
        } else {
          console.error(`❌ Erro em ${file}: ${err.message}`)
        }
      }
    }
    console.log('🔁 Recarregando schema cache...')
    try {
      await client.query(`select pg_notify('pgrst','reload schema');`)
      console.log('✅ Schema cache recarregado!')
    } catch (err) {
      console.warn('⚠️ Falha ao recarregar schema cache:', err.message)
    }
  } finally {
    await client.end()
    console.log('🔌 Conexão encerrada')
  }
}

main().catch(err => { console.error('💥 Erro fatal:', err); process.exit(1) })
