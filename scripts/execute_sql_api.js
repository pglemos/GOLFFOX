const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/web/.env.local') });

const SUPABASE_TOKEN = 'sbp_485ebe3a5aadc22282e71207a5c561d54eb374bf';
const SQL_FILE = path.join(__dirname, '../alter_carriers.sql');

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
        console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
        process.exit(1);
    }

    // Extract Project Ref (https://ReferenceID.supabase.co)
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

    if (!projectRef) {
        console.error('❌ Could not extract Project Ref from URL:', supabaseUrl);
        process.exit(1);
    }

    console.log(`🔍 Project Ref: ${projectRef}`);

    let sqlContent;
    try {
        sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    } catch (err) {
        console.error(`❌ Could not read SQL file ${SQL_FILE}:`, err.message);
        process.exit(1);
    }

    console.log('🚀 Executing SQL via Supabase Management API...');

    const options = {
        hostname: 'api.supabase.com',
        path: `/v1/projects/${projectRef}/run-sql`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify({ query: sqlContent }))
        }
    };

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('✅ SQL Triggered Successfully!');
                console.log('Response:', data);
            } else {
                console.error(`❌ API Error (Status: ${res.statusCode}):`);
                console.error(data);
                process.exit(1);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Request Error: ${e.message}`);
        process.exit(1);
    });

    req.write(JSON.stringify({ query: sqlContent }));
    req.end();
}

main();
