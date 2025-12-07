/**
 * Script para testar carregamento direto do DLL do SWC
 */

const path = require('path');
const fs = require('fs');

const swcNodeFile = path.join(__dirname, '../node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node');

console.log('🔍 Testando carregamento do DLL do SWC...\n');
console.log('Arquivo:', swcNodeFile);
console.log('Existe:', fs.existsSync(swcNodeFile));

if (!fs.existsSync(swcNodeFile)) {
  console.error('❌ Arquivo não encontrado!');
  process.exit(1);
}

const stats = fs.statSync(swcNodeFile);
console.log('Tamanho:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
console.log('');

// Tentar carregar o módulo nativo
console.log('Tentando carregar o módulo nativo...');
try {
  // Tentar usar require para carregar
  const swc = require(swcNodeFile);
  console.log('✅ DLL carregado com sucesso!');
  console.log('Módulo:', typeof swc);
  if (swc) {
    console.log('Propriedades:', Object.keys(swc).slice(0, 10).join(', '));
  }
} catch (error) {
  console.error('❌ Erro ao carregar DLL:');
  console.error('   Tipo:', error.constructor.name);
  console.error('   Mensagem:', error.message);
  console.error('   Código:', error.code);
  
  if (error.message.includes('DLL')) {
    console.error('\n💡 Possíveis causas:');
    console.error('   1. Visual C++ Redistributable não instalado corretamente');
    console.error('   2. Versão incorreta do Visual C++ Redistributable');
    console.error('   3. DLLs faltando no PATH do sistema');
    console.error('   4. Antivírus bloqueando o arquivo');
    console.error('   5. Permissões insuficientes');
  }
  
  // Tentar usar ffi-napi ou similar se disponível
  console.log('\n🔍 Verificando dependências do DLL...');
  console.log('   Use Dependency Walker ou similar para verificar dependências faltando');
  
  process.exit(1);
}

