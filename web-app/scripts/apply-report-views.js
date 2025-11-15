const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function runSql(client, file) {
  const sql = fs.readFileSync(file, 'utf-8')
  console.log('Applying', path.basename(file))
  await client.query(sql)
}

async function main() {
  const root = path.resolve(__dirname, '..', '..')
  const dburl = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'
  const client = new Client({ connectionString: dburl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    const files = [
      path.join(root, 'database', 'migrations', 'v44_map_views.sql'),
      path.join(root, 'database', 'migrations', 'v44_costs_views.sql'),
      path.join(root, 'database', 'migrations', 'v43_admin_views.sql'),
      path.join(root, 'database', 'migrations', 'gf_views.sql'),
    ]
    for (const f of files) {
      if (fs.existsSync(f)) await runSql(client, f)
    }
    console.log('Views applied successfully')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })

