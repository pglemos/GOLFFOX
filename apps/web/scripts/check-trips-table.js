const { Client } = require('pg');
const client = new Client({connectionString: 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'});

client.connect()
  .then(() => client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'trips' AND table_schema = 'public' ORDER BY ordinal_position"))
  .then(r => {
    console.log('Colunas de trips:', r.rows.map(row => row.column_name).join(', '));
    return client.end();
  });

