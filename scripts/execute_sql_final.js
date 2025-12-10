const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const config = {
    user: 'postgres',
    password: 'Guigui1309@',
    host: 'db.vmoxzesvjcfmrebagcwo.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function main() {
    console.log(`🔌 Connecting to Postgres at ${config.host}...`);

    const client = new Client(config);

    try {
        await client.connect();
        console.log('✅ Connected successfully!');

        const sqlPath = path.join(__dirname, '../alter_carriers.sql');
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`SQL file not found at ${sqlPath}`);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('🚀 Executing SQL...');

        await client.query(sql);
        console.log('✅ SQL executed successfully! Database is patched.');

    } catch (err) {
        console.error('❌ Error:', err);
        if (err.code === 'ENOTFOUND') {
            console.error('💡 Hint: Verify if the project is active in Supabase and if the Host is correct.');
        }
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
