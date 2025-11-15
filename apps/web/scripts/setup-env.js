#!/usr/bin/env node

/**
 * Script para configurar variáveis de ambiente
 * Uso: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');

const envExamplePath = path.join(__dirname, '..', '.env.example');
const envLocalPath = path.join(__dirname, '..', '.env.local');

console.log('🚀 Configurando variáveis de ambiente...\n');

// Verificar se .env.local já existe
if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  Arquivo .env.local já existe!');
  console.log('   Se desejar sobrescrever, delete-o primeiro.\n');
  process.exit(0);
}

// Criar .env.local com valores padrão
const envContent = `# ========================================
# GOLF FOX - Variáveis de Ambiente
# ========================================

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
`;

// Criar .env.local
fs.writeFileSync(envLocalPath, envContent);

console.log('✅ Arquivo .env.local criado com sucesso!');
console.log('   A partir de .env.example\n');
console.log('📝 Verifique se as variáveis estão corretas:');
console.log('   - NEXT_PUBLIC_SUPABASE_URL');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('   - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY\n');
console.log('💡 Execute: npm run dev para iniciar o servidor\n');

