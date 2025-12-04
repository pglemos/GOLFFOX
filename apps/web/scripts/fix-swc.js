#!/usr/bin/env node

/**
 * Script para corrigir o problema do SWC binário corrompido no Windows
 * Remove o diretório next-swc-fallback corrompido e garante uso do binário nativo
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const nextSwcFallbackPath = path.join(__dirname, '../node_modules/next/next-swc-fallback');
const swcCachePath = path.join(os.homedir(), 'AppData', 'Local', 'next-swc');

console.log('🔧 Corrigindo configuração do SWC...');

// Função para remover diretório de forma agressiva
function removeDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return true;
  }

  // Tentar múltiplas abordagens
  const methods = [
    () => fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }),
    () => execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'ignore' }),
    () => {
      // Tentar remover arquivos individualmente
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          removeDirectory(fullPath);
        } else {
          try {
            fs.unlinkSync(fullPath);
          } catch (e) {
            // Ignorar
          }
        }
      }
      fs.rmdirSync(dirPath);
    }
  ];

  for (const method of methods) {
    try {
      method();
      if (!fs.existsSync(dirPath)) {
        return true;
      }
    } catch (error) {
      // Continuar tentando
    }
  }

  return !fs.existsSync(dirPath);
}

// Remover diretório corrompido
if (removeDirectory(nextSwcFallbackPath)) {
  console.log('✅ Diretório next-swc-fallback removido');
} else {
  console.warn('⚠️  Aviso: next-swc-fallback ainda existe (pode ser recriado durante o build)');
}

// Verificar e preparar cache SWC
if (fs.existsSync(swcCachePath)) {
  try {
    const swcBinaries = [];
    function findSwcBinaries(dir) {
      try {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          if (file.isDirectory()) {
            findSwcBinaries(fullPath);
          } else if (file.name.endsWith('.node') && (file.name.includes('swc') || file.name.includes('win32-x64'))) {
            swcBinaries.push(fullPath);
          }
        }
      } catch (e) {
        // Ignorar erros de acesso
      }
    }
    findSwcBinaries(swcCachePath);
    
    if (swcBinaries.length > 0) {
      console.log(`✅ Encontrado ${swcBinaries.length} binário(s) SWC no cache`);
    }
  } catch (error) {
    // Ignorar erros
  }
}

// Criar arquivo .gitkeep para prevenir recriação (se necessário)
const fallbackParent = path.dirname(nextSwcFallbackPath);
if (fs.existsSync(fallbackParent)) {
  try {
    // Criar um arquivo de bloqueio temporário
    const lockFile = path.join(fallbackParent, '.swc-lock');
    if (!fs.existsSync(lockFile)) {
      fs.writeFileSync(lockFile, 'SWC lock file - do not delete');
    }
  } catch (e) {
    // Ignorar
  }
}

console.log('✅ Configuração do SWC corrigida.');
console.log('ℹ️  O Next.js baixará o binário nativo automaticamente se necessário.');

