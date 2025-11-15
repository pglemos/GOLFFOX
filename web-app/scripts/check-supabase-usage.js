const { Client } = require('pg')

async function main() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  const sizesQuery = `
  SELECT
    nspname AS schema,
    relname AS table,
    pg_total_relation_size(c.oid) AS total_bytes,
    pg_relation_size(c.oid) AS table_bytes,
    (SELECT COALESCE(SUM(pg_total_relation_size(i.indexrelid)),0) FROM pg_index i WHERE i.indrelid = c.oid) AS index_bytes,
    (SELECT COALESCE(SUM(pg_total_relation_size(t.oid)),0) FROM pg_class t WHERE t.relkind = 't' AND t.reltoastrelid = c.oid) AS toast_bytes,
    (SELECT COALESCE(COUNT(*),0) FROM pg_stat_user_tables s WHERE s.relname = c.relname) AS row_estimate
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE nspname = 'public' AND c.relkind = 'r'
  ORDER BY total_bytes DESC
  LIMIT 20;
  `
  const res = await client.query(sizesQuery)
  console.log(JSON.stringify(res.rows, null, 2))
  await client.end()
}

main().catch((e) => { console.error(e); process.exit(1) })

