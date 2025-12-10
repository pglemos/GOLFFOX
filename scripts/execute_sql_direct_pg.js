const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Senha decodificada da URL fornecida no JSON do MCP
// postgresql://postgres:Guigui1309%40@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres
const connectionString = 'postgresql://postgres:Guigui1309%40@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function main() {
    console.log('🔌 Connecting to Postgres to execute SQL fix...');

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database!');

        const sqlPath = path.join(__dirname, '../alter_carriers.sql');
        if (!fs.existsSync(sqlPath)) {
            console.error(`❌ SQL file not found at: ${sqlPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('🚀 Running SQL from alter_carriers.sql...');

        await client.query(sql);
        console.log('✅ SQL executed successfully! Banking columns added.');

    } catch (err) {
        console.error('❌ Error executing SQL:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
