#!/usr/bin/env node

/**
 * Script para gerar tipos do Supabase
 * 
 * Uso:
 *   node scripts/generate-supabase-types.js
 * 
 * Ou com projeto específico:
 *   PROJECT_ID=xxx node scripts/generate-supabase-types.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const PROJECT_ID = process.env.PROJECT_ID

if (!SUPABASE_URL && !PROJECT_ID) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou PROJECT_ID deve ser definido')
  console.log('\nOpções:')
  console.log('  1. Defina NEXT_PUBLIC_SUPABASE_URL no ambiente')
  console.log('  2. Defina PROJECT_ID no ambiente')
  console.log('  3. Passe PROJECT_ID como argumento: PROJECT_ID=xxx node scripts/generate-supabase-types.js')
  process.exit(1)
}

// Extrair project ID da URL se necessário
let projectId = PROJECT_ID
if (!projectId && SUPABASE_URL) {
  const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)
  if (match) {
    projectId = match[1]
  }
}

if (!projectId) {
  console.error('❌ Erro: Não foi possível extrair PROJECT_ID da URL do Supabase')
  process.exit(1)
}

console.log(`🔄 Gerando tipos do Supabase para projeto: ${projectId}`)

const outputPath = path.join(__dirname, '..', 'types', 'supabase.ts')

try {
  // Gerar tipos usando Supabase CLI
  const command = `npx supabase gen types typescript --project-id ${projectId}`
  console.log(`📝 Executando: ${command}`)
  
  const types = execSync(command, { 
    encoding: 'utf-8',
    stdio: 'pipe'
  })
  
  // Salvar tipos
  fs.writeFileSync(outputPath, types, 'utf-8')
  
  console.log(`✅ Tipos gerados com sucesso em: ${outputPath}`)
  console.log(`📊 Tamanho do arquivo: ${(types.length / 1024).toFixed(2)} KB`)
  
} catch (error) {
  console.error('❌ Erro ao gerar tipos:', error.message)
  
  if (error.message.includes('command not found') || error.message.includes('npx')) {
    console.log('\n💡 Dica: Instale o Supabase CLI:')
    console.log('   npm install -g supabase')
    console.log('\nOu use npx (já incluído):')
    console.log('   npx supabase gen types typescript --project-id <project-id>')
  }
  
  process.exit(1)
}

