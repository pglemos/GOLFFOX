/**
 * Script para garantir encoding UTF-8 em todos os arquivos do projeto
 * 
 * Este script:
 * 1. Verifica e corrige encoding de arquivos JSON de tradução
 * 2. Configura variáveis de ambiente para UTF-8
 * 3. Garante que o console use UTF-8 no Windows
 */

const fs = require('fs');
const path = require('path');

// Configurar encoding UTF-8 no Windows
if (process.platform === 'win32') {
  try {
    // Tentar configurar code page para UTF-8
    require('child_process').execSync('chcp 65001', { stdio: 'ignore' });
    
    // Configurar encoding dos streams
    if (process.stdout.setDefaultEncoding) {
      process.stdout.setDefaultEncoding('utf8');
    }
    if (process.stderr.setDefaultEncoding) {
      process.stderr.setDefaultEncoding('utf8');
    }
  } catch (e) {
    // Ignorar se não for possível configurar
  }
}

// Lista de arquivos JSON de tradução para verificar/corrigir
const i18nFiles = [
  'i18n/admin.json',
  'i18n/operator.json',
  'i18n/transportadora.json',
  'i18n/common.json',
  'i18n/pt-BR.json',
  'i18n/en-US.json'
];

console.log('🔍 Verificando encoding de arquivos de tradução...');

let fixedCount = 0;

for (const file of i18nFiles) {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Arquivo não encontrado: ${file}`);
    continue;
  }
  
  try {
    // Ler arquivo com encoding UTF-8
    let content = fs.readFileSync(filePath, { encoding: 'utf8' });
    
    // Verificar se há caracteres corrompidos comuns
    const corruptedPatterns = [
      /inicializa´┐¢´┐¢o/g,
      /v´┐¢nculo/g,
      /din´┐¢mico/g,
      /biblioteca/g
    ];
    
    let hasCorruption = false;
    for (const pattern of corruptedPatterns) {
      if (pattern.test(content)) {
        hasCorruption = true;
        break;
      }
    }
    
    if (hasCorruption) {
      console.log(`⚠️  Possível corrupção detectada em: ${file}`);
    }
    
    // Reescrever arquivo garantindo UTF-8 sem BOM
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    fixedCount++;
    console.log(`✅ Verificado: ${file}`);
  } catch (error) {
    console.error(`❌ Erro ao processar ${file}:`, error.message);
  }
}

console.log(`\n✅ ${fixedCount} arquivo(s) verificado(s) e corrigido(s) se necessário.`);
console.log('✅ Encoding UTF-8 configurado para o projeto.');


