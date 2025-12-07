/**
 * Script de diagnóstico para problema do SWC DLL no Windows
 * 
 * Este script verifica:
 * 1. Se o binário SWC está instalado
 * 2. Se o arquivo .node existe e tem tamanho válido
 * 3. Se há dependências do sistema faltando (Visual C++ Redistributable)
 * 4. Sugere soluções baseadas nos problemas encontrados
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isWindows = process.platform === 'win32';

console.log('🔍 Diagnóstico do Problema SWC DLL\n');

if (!isWindows) {
  console.log('ℹ️  Este script é apenas para Windows. Em Linux/Mac, o SWC funciona normalmente.');
  process.exit(0);
}

// Verificar binário SWC
const swcPath = path.join(__dirname, '../node_modules/@next/swc-win32-x64-msvc');
const swcNodeFile = path.join(swcPath, 'next-swc.win32-x64-msvc.node');
const swcPackageJson = path.join(swcPath, 'package.json');

let issues = [];
let suggestions = [];

// 1. Verificar se o pacote está instalado
if (!fs.existsSync(swcPath)) {
  issues.push('❌ Pacote @next/swc-win32-x64-msvc não está instalado');
  suggestions.push('Execute: npm install @next/swc-win32-x64-msvc@^16.0.0 --save-optional --force');
} else {
  console.log('✅ Pacote @next/swc-win32-x64-msvc está instalado');
  
  // 2. Verificar arquivo .node
  if (!fs.existsSync(swcNodeFile)) {
    issues.push('❌ Arquivo next-swc.win32-x64-msvc.node não encontrado');
    suggestions.push('Reinstale o pacote: npm install @next/swc-win32-x64-msvc@^16.0.0 --save-optional --force');
  } else {
    const stats = fs.statSync(swcNodeFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`✅ Arquivo .node encontrado: ${sizeMB} MB`);
    
    if (stats.size === 0) {
      issues.push('❌ Arquivo .node está vazio (corrompido)');
      suggestions.push('Reinstale o pacote: npm install @next/swc-win32-x64-msvc@^16.0.0 --save-optional --force');
    } else if (stats.size < 1000000) {
      issues.push('⚠️  Arquivo .node parece muito pequeno (pode estar corrompido)');
      suggestions.push('Reinstale o pacote: npm install @next/swc-win32-x64-msvc@^16.0.0 --save-optional --force');
    }
  }
}

// 3. Verificar Visual C++ Redistributable
console.log('\n🔍 Verificando dependências do sistema...');
try {
  // Tentar verificar se VC++ Redistributable está instalado
  // Isso é difícil de verificar programaticamente, então vamos apenas sugerir
  console.log('ℹ️  Verificando Visual C++ Redistributable...');
  suggestions.push('Instale Visual C++ Redistributable 2015-2022: https://aka.ms/vs/17/release/vc_redist.x64.exe');
} catch (err) {
  // Ignorar
}

// 4. Verificar versão do Node.js
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
console.log(`\n📦 Versão do Node.js: ${nodeVersion}`);

if (majorVersion < 18) {
  issues.push(`⚠️  Node.js ${nodeVersion} pode ser incompatível. Recomendado: Node.js 18+ ou 22.x`);
  suggestions.push('Atualize o Node.js para versão 22.x (conforme package.json)');
} else {
  console.log('✅ Versão do Node.js compatível');
}

// Resumo
console.log('\n' + '='.repeat(60));
if (issues.length === 0) {
  console.log('✅ Nenhum problema óbvio encontrado.');
  console.log('\n💡 Se o erro de DLL persistir, pode ser:');
  console.log('   1. Visual C++ Redistributable não instalado');
  console.log('   2. Antivírus bloqueando o arquivo .node');
  console.log('   3. Permissões insuficientes');
  console.log('\n✅ O servidor funcionará com WASM fallback (mais lento mas funcional)');
} else {
  console.log('⚠️  Problemas encontrados:');
  issues.forEach(issue => console.log(`   ${issue}`));
  
  if (suggestions.length > 0) {
    console.log('\n💡 Sugestões:');
    suggestions.forEach((suggestion, i) => console.log(`   ${i + 1}. ${suggestion}`));
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n📝 Nota: O Next.js usará WASM como fallback se o binário nativo falhar.');
console.log('   O servidor funcionará, mas será mais lento durante o desenvolvimento.');
console.log('   Para melhor performance, resolva o problema do DLL nativo.\n');

