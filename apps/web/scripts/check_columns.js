require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars. Ensure .env.local exists and has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking columns in "carriers" table...');

    // Strategy 1: Select * (works if rows exist)
    const { data, error } = await supabase.from('carriers').select('*').limit(1);

    if (error) {
        console.error('Error selecting from carriers:', error);
    } else if (data && data.length > 0) {
        console.log('Row found. Columns present in result:');
        const keys = Object.keys(data[0]);
        // console.log(keys.join(', '));

        const bankFields = [
            'bank_name', 'bank_code', 'bank_agency', 'bank_account',
            'bank_account_type', 'pix_key', 'pix_key_type',
            'legal_rep_name', 'legal_rep_cpf', 'legal_rep_rg', 'legal_rep_email', 'legal_rep_phone'
        ];

        const missing = bankFields.filter(f => !keys.includes(f));

        if (missing.length > 0) {
            console.error('❌ MISSING COLUMNS:', missing);
            console.log('The error is likely due to missing columns in the database schema.');
        } else {
            console.log('✅ All checked columns are present in the returned row.');
        }
    } else {
        console.log('Table is empty or RLS prevented select. Trying update check...');
    }

    // Strategy 2: Update dummy (works even if empty, should error if column missing)
    // We use a fake ID so we don't actually update anything, but Postgres parses the query columns first.
    const { error: updateError } = await supabase
        .from('carriers')
        .update({
            bank_name: 'test',
            bank_account_type: 'corrente'
        })
        .eq('id', '00000000-0000-0000-0000-000000000000');

    if (updateError) {
        console.error('Update Check Error:', updateError.message);
        if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
            console.error('❌ CONFIRMED: Column does not exist.');
        } else {
            console.log('Update Error Detail:', updateError);
        }
    } else {
        console.log('✅ Update check passed (columns exist, or error was swallowed).');
    }
}

checkColumns();
