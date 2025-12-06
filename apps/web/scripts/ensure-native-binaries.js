/**
 * Script para garantir que binários nativos sejam instalados
 * 
 * Este script verifica e instala binários nativos necessários para:
 * - LightningCSS (lightningcss-linux-x64-gnu, lightningcss-linux-x64-musl)
 * - Tailwind Oxide (@tailwindcss/oxide-linux-x64-gnu, @tailwindcss/oxide-linux-x64-musl)
 * 
 * Esses binários são necessários para o build funcionar no Vercel (Linux)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isLinux = process.platform === 'linux';
const isWindows = process.platform === 'win32';

const binariesToCheck = [];

if (isLinux) {
  binariesToCheck.push(
    'lightningcss-linux-x64-gnu',
    'lightningcss-linux-x64-musl',
    '@tailwindcss/oxide-linux-x64-gnu',
    '@tailwindcss/oxide-linux-x64-musl'
  );
} else if (isWindows) {
  binariesToCheck.push(
    'lightningcss-win32-x64-msvc',
    '@tailwindcss/oxide-win32-x64-msvc'
  );
}

console.log('🔍 Verificando binários nativos necessários...');

let needsInstall = false;
const missingBinaries = [];

for (const binary of binariesToCheck) {
  const [scope, name] = binary.includes('/') 
    ? binary.split('/')
    : [null, binary];
  
  const binaryPath = scope
    ? path.join(__dirname, '../node_modules', scope, name)
    : path.join(__dirname, '../node_modules', name);
  
  if (!fs.existsSync(binaryPath)) {
    missingBinaries.push(binary);
    needsInstall = true;
    console.log(`⚠️  Binário não encontrado: ${binary}`);
  } else {
    console.log(`✅ Binário encontrado: ${binary}`);
  }
}

if (needsInstall && missingBinaries.length > 0) {
  console.log(`\n📦 Instalando ${missingBinaries.length} binário(s) nativo(s) faltando...`);
  
  try {
    // Instalar binários faltando
    const installCommand = `npm install ${missingBinaries.join(' ')} --save --no-save`;
    execSync(installCommand, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env, npm_config_optional: 'true' }
    });
    
    console.log('✅ Binários nativos instalados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao instalar binários nativos:', error.message);
    console.warn('⚠️  O build pode falhar se os binários não estiverem disponíveis.');
    process.exit(1);
  }
} else {
  console.log('✅ Todos os binários nativos necessários estão instalados.');
}

