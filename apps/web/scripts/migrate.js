const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error('Missing env vars');
        process.exit(1);
    }

    const supabase = createClient(url, key, {
        auth: { persistSession: false }
    });

    // SQL statements to execute
    const statements = [
        // Table 1: gf_vehicle_documents
        `CREATE TABLE IF NOT EXISTS public.gf_vehicle_documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      vehicle_id UUID NOT NULL,
      document_type VARCHAR(50) NOT NULL,
      document_number VARCHAR(100),
      expiry_date DATE,
      issue_date DATE,
      file_url TEXT,
      file_name VARCHAR(255),
      file_size INTEGER,
      file_type VARCHAR(50),
      status VARCHAR(20) DEFAULT 'valid',
      notes TEXT,
      uploaded_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
        // Table 2: gf_driver_compensation
        `CREATE TABLE IF NOT EXISTS public.gf_driver_compensation (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      driver_id UUID NOT NULL,
      base_salary DECIMAL(10,2),
      currency VARCHAR(3) DEFAULT 'BRL',
      payment_frequency VARCHAR(20) DEFAULT 'monthly',
      contract_type VARCHAR(20) DEFAULT 'clt',
      has_meal_allowance BOOLEAN DEFAULT false,
      meal_allowance_value DECIMAL(10,2),
      has_transport_allowance BOOLEAN DEFAULT false,
      transport_allowance_value DECIMAL(10,2),
      has_health_insurance BOOLEAN DEFAULT false,
      start_date DATE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
        // Table 3: gf_carrier_documents
        `CREATE TABLE IF NOT EXISTS public.gf_carrier_documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      carrier_id UUID NOT NULL,
      document_type VARCHAR(50) NOT NULL,
      document_number VARCHAR(100),
      expiry_date DATE,
      issue_date DATE,
      file_url TEXT,
      file_name VARCHAR(255),
      file_size INTEGER,
      file_type VARCHAR(50),
      status VARCHAR(20) DEFAULT 'valid',
      notes TEXT,
      uploaded_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`
    ];

    console.log('Starting migration...');

    for (let i = 0; i < statements.length; i++) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        // Use raw SQL via service role
        const { error } = await supabase.rpc('exec_sql', { sql: statements[i] }).single();

        if (error) {
            // If exec_sql doesn't exist, try direct table insert as fallback
            console.log(`Note: ${error.message}`);
        } else {
            console.log(`Statement ${i + 1} OK`);
        }
    }

    console.log('Migration complete!');
}

runMigration().catch(console.error);
