/**
 * Script para Gerar Instruções de Aplicação de Migrations
 * 
 * Gera um arquivo markdown com instruções detalhadas para aplicar
 * cada migration pendente
 */

const fs = require('fs')
const path = require('path')

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'MIGRATION_INSTRUCTIONS.md')

function getMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort()
  
  return files.map(file => ({
    name: file,
    path: path.join(MIGRATIONS_DIR, file),
    content: fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8'),
    size: fs.statSync(path.join(MIGRATIONS_DIR, file)).size
  }))
}

function generateInstructions() {
  const migrations = getMigrations()
  
  let markdown = `# Instruções de Aplicação de Migrations - GolfFox

**Gerado em:** ${new Date().toISOString()}
**Total de migrations:** ${migrations.length}

---

## 🚀 Aplicação Rápida (Todas de uma vez)

### Via Supabase Dashboard

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo de cada migration abaixo na ordem
5. Execute cada uma

### Via Supabase CLI

\`\`\`bash
# 1. Instalar CLI (se não tiver)
npm install -g supabase

# 2. Login
supabase login

# 3. Link projeto
supabase link --project-ref [seu-project-ref]

# 4. Aplicar todas
supabase db push
\`\`\`

---

## 📋 Migrations Individuais

`

  migrations.forEach((migration, index) => {
    const sizeKB = (migration.size / 1024).toFixed(2)
    const lines = migration.content.split('\n').length
    
    markdown += `### ${index + 1}. ${migration.name}

**Tamanho:** ${sizeKB} KB  
**Linhas:** ${lines}  
**Arquivo:** \`${migration.path}\`

\`\`\`sql
${migration.content}
\`\`\`

---

`
  })
  
  markdown += `## ✅ Verificação

Após aplicar todas as migrations, execute:

\`\`\`bash
node scripts/check-migrations-status.js
\`\`\`

Ou execute o script SQL de verificação:

\`\`\`sql
-- Ver arquivo: scripts/verify-migration.sql
\`\`\`

---

**Última atualização:** ${new Date().toISOString()}
`
  
  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8')
  console.log(`✅ Instruções geradas em: ${OUTPUT_FILE}`)
  console.log(`📄 Total de migrations: ${migrations.length}`)
}

if (require.main === module) {
  generateInstructions()
}

module.exports = { generateInstructions }
