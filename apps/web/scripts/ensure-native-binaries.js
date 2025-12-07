/**
 * Script para garantir que binários nativos sejam instalados
 * 
 * Este script verifica e instala binários nativos necessários para:
 * - Next.js SWC (@next/swc-win32-x64-msvc para Windows, @next/swc-wasm-nodejs como fallback)
 * - LightningCSS (lightningcss-linux-x64-gnu, lightningcss-linux-x64-musl)
 * - Tailwind Oxide (@tailwindcss/oxide-linux-x64-gnu, @tailwindcss/oxide-linux-x64-musl)
 * 
 * Esses binários são necessários para o build funcionar corretamente
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isLinux = process.platform === 'linux';
const isWindows = process.platform === 'win32';

const binariesToCheck = [];

// Adicionar SWC para Windows (crítico para performance)
if (isWindows) {
  binariesToCheck.push(
    '@next/swc-win32-x64-msvc',
    'lightningcss-win32-x64-msvc',
    '@tailwindcss/oxide-win32-x64-msvc'
  );
} else if (isLinux) {
  binariesToCheck.push(
    'lightningcss-linux-x64-gnu',
    'lightningcss-linux-x64-musl',
    '@tailwindcss/oxide-linux-x64-gnu',
    '@tailwindcss/oxide-linux-x64-musl'
  );
}

console.log('🔍 Verificando binários nativos necessários...');

let needsInstall = false;
const missingBinaries = [];
const corruptedBinaries = [];

for (const binary of binariesToCheck) {
  const [scope, name] = binary.includes('/') 
    ? binary.split('/')
    : [null, binary];
  
  const binaryPath = scope
    ? path.join(__dirname, '../node_modules', scope, name)
    : path.join(__dirname, '../node_modules', name);
  
  // Verificação especial para SWC no Windows
  if (isWindows && binary === '@next/swc-win32-x64-msvc') {
    const swcNodeFile = path.join(binaryPath, 'next-swc.win32-x64-msvc.node');
    const swcPackageJson = path.join(binaryPath, 'package.json');
    
    if (!fs.existsSync(binaryPath)) {
      missingBinaries.push(binary);
      needsInstall = true;
      console.log(`⚠️  SWC binário não encontrado: ${binary}`);
    } else if (!fs.existsSync(swcNodeFile)) {
      corruptedBinaries.push(binary);
      needsInstall = true;
      console.log(`⚠️  SWC arquivo .node não encontrado: ${swcNodeFile}`);
    } else {
      // Verificar tamanho do arquivo (deve ser > 0)
      const stats = fs.statSync(swcNodeFile);
      if (stats.size === 0) {
        corruptedBinaries.push(binary);
        needsInstall = true;
        console.log(`⚠️  SWC arquivo .node está vazio: ${swcNodeFile}`);
      } else {
        console.log(`✅ SWC binário encontrado e íntegro: ${binary} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      }
    }
  } else {
    // Verificação padrão para outros binários
    if (!fs.existsSync(binaryPath)) {
      missingBinaries.push(binary);
      needsInstall = true;
      console.log(`⚠️  Binário não encontrado: ${binary}`);
    } else {
      console.log(`✅ Binário encontrado: ${binary}`);
    }
  }
}

const binariesToReinstall = [...missingBinaries, ...corruptedBinaries];

if (needsInstall && binariesToReinstall.length > 0) {
  console.log(`\n📦 Instalando/Reinstalando ${binariesToReinstall.length} binário(s) nativo(s)...`);
  
  // Para binários corrompidos, remover primeiro
  if (corruptedBinaries.length > 0) {
    console.log('🧹 Removendo binários corrompidos...');
    for (const binary of corruptedBinaries) {
      const [scope, name] = binary.includes('/') 
        ? binary.split('/')
        : [null, binary];
      
      const binaryPath = scope
        ? path.join(__dirname, '../node_modules', scope, name)
        : path.join(__dirname, '../node_modules', name);
      
      if (fs.existsSync(binaryPath)) {
        try {
          fs.rmSync(binaryPath, { recursive: true, force: true });
          console.log(`   Removido: ${binary}`);
        } catch (err) {
          console.warn(`   Aviso: Não foi possível remover ${binary}: ${err.message}`);
        }
      }
    }
  }
  
  try {
    // Instalar binários faltando ou corrompidos
    // Usar --force para garantir reinstalação mesmo se já existir
    const installCommand = `npm install ${binariesToReinstall.join(' ')} --save-optional --force`;
    console.log(`\n🔧 Executando: ${installCommand}`);
    
    execSync(installCommand, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: { 
        ...process.env, 
        npm_config_optional: 'true',
        // Forçar instalação de dependências opcionais
        npm_config_include: 'optional'
      }
    });
    
    // Verificar novamente após instalação (especialmente para SWC)
    if (isWindows && binariesToReinstall.includes('@next/swc-win32-x64-msvc')) {
      const swcPath = path.join(__dirname, '../node_modules/@next/swc-win32-x64-msvc');
      const swcNodeFile = path.join(swcPath, 'next-swc.win32-x64-msvc.node');
      
      if (fs.existsSync(swcNodeFile)) {
        const stats = fs.statSync(swcNodeFile);
        if (stats.size > 0) {
          console.log(`✅ SWC binário reinstalado com sucesso! (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        } else {
          console.warn('⚠️  SWC binário instalado mas arquivo está vazio. Pode ser necessário reinstalar dependências.');
        }
      } else {
        console.warn('⚠️  SWC binário não encontrado após instalação. Next.js usará WASM como fallback.');
      }
    }
    
    console.log('✅ Binários nativos instalados/reinstalados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao instalar binários nativos:', error.message);
    console.warn('⚠️  O build pode falhar se os binários não estiverem disponíveis.');
    console.warn('⚠️  Next.js tentará usar WASM como fallback, mas será mais lento.');
    
    // Não falhar completamente - WASM é um fallback válido
    if (isWindows && binariesToReinstall.includes('@next/swc-win32-x64-msvc')) {
      console.warn('⚠️  Continuando com WASM fallback para SWC...');
    } else {
      process.exit(1);
    }
  }
} else {
  console.log('✅ Todos os binários nativos necessários estão instalados e íntegros.');
}

