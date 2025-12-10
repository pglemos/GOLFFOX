/**
 * Script para executar migrations consolidadas no Supabase
 * Execute com: node scripts/run-supabase-migrations.js
 */

const { Client } = require('pg');

// Credenciais do Supabase - conexão direta
const DATABASE_URL = 'postgresql://postgres:Guigui1309%40@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

// Migrations consolidadas
const migrations = [
    // 1. Campos bancários e representante legal na tabela carriers
    `
  -- Campos Bancários
  ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_name TEXT;
  ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_code TEXT;
  ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_agency TEXT;
  ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_account TEXT;
  ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_account_type TEXT DEFAULT 'corrente';
  ALTER TABLE carriers ADD COLUMN IF NOT EXISTS pix_key TEXT;
  ALTER TABLE carriers ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'cnpj';

  -- Campos do Representante Legal
  ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_name TEXT;
  ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_cpf TEXT;
  ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_rg TEXT;
  ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_email TEXT;
  ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_phone TEXT;
  `,

    // 2. Colunas de endereço na tabela users
    `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS address_zip_code VARCHAR(10);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS cnh VARCHAR(20);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS cnh_category VARCHAR(5);
  `,

    // 3. Colunas faltantes na tabela vehicles
    `
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS chassis VARCHAR(50);
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS renavam VARCHAR(20);
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50);
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50);
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS carrier_id UUID;
  `,

    // 4. Criar tabela driver_positions se não existir
    `
  CREATE TABLE IF NOT EXISTS public.driver_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID,
    driver_id UUID,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_driver_positions_trip_id ON public.driver_positions(trip_id);
  CREATE INDEX IF NOT EXISTS idx_driver_positions_timestamp ON public.driver_positions(timestamp DESC);
  `,

    // 5. Criar tabela route_stops se não existir
    `
  CREATE TABLE IF NOT EXISTS public.route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID,
    seq INTEGER NOT NULL,
    name TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    radius_m INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON public.route_stops(route_id);
  `,

    // 6. Criar tabela trip_events se não existir
    `
  CREATE TABLE IF NOT EXISTS public.trip_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID,
    event_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_trip_events_trip_id ON public.trip_events(trip_id);
  `,

    // 7. Criar tabela trip_passengers se não existir
    `
  CREATE TABLE IF NOT EXISTS public.trip_passengers (
    trip_id UUID NOT NULL,
    passenger_id UUID NOT NULL,
    status TEXT DEFAULT 'scheduled',
    boarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (trip_id, passenger_id)
  );
  `,

    // 8. Criar tabela checklists se não existir
    `
  CREATE TABLE IF NOT EXISTS public.checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID,
    type TEXT NOT NULL,
    completed_by UUID,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_checklists_trip_id ON public.checklists(trip_id);
  `,
];

async function runMigrations() {
    console.log('🚀 Iniciando execução de migrations...\n');

    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('📡 Conectando ao banco de dados...');
        await client.connect();
        console.log('✅ Conectado com sucesso!\n');

        for (let i = 0; i < migrations.length; i++) {
            const migration = migrations[i];
            console.log(`📝 Executando migration ${i + 1}/${migrations.length}...`);

            try {
                await client.query(migration);
                console.log(`   ✅ Migration ${i + 1} executada com sucesso!`);
            } catch (err) {
                console.log(`   ⚠️ Migration ${i + 1}: ${err.message}`);
                // Continua para a próxima migration mesmo se uma falhar
            }
        }

        console.log('\n🎉 Todas as migrations foram processadas!');

        // Verificar tabelas criadas
        console.log('\n📊 Verificando tabelas...');
        const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
        console.log(`\n📌 Tabelas encontradas (${tablesResult.rows.length}):`);
        tablesResult.rows.forEach(row => console.log(`   - ${row.tablename}`));

        // Verificar colunas da tabela carriers
        console.log('\n📊 Verificando colunas da tabela carriers...');
        const carriersResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'carriers' 
      ORDER BY ordinal_position
    `);
        console.log(`\n📌 Colunas em carriers (${carriersResult.rows.length}):`);
        carriersResult.rows.forEach(row => console.log(`   - ${row.column_name}: ${row.data_type}`));

    } catch (err) {
        console.error('❌ Erro:', err.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n📡 Conexão fechada.');
    }
}

runMigrations();
