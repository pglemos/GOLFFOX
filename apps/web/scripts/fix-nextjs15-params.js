const fs = require('fs');
const path = require('path');

/**
 * Script para corrigir rotas dinâmicas do Next.js 15
 * No Next.js 15, params agora é uma Promise
 */

function findRouteFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts' || file === 'route.js') {
      // Verificar se é uma rota dinâmica (contém [])
      if (filePath.includes('[') && filePath.includes(']')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

function fixRouteFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Padrão: { params }: { params: { paramName: string } }
    const pattern1 = /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{\s*(\w+):\s*string\s*\}\s*\}/g;
    const replacement1 = (match, paramName) => {
      modified = true;
      return `{ params }: { params: Promise<{ ${paramName}: string }> }`;
    };
    
    // Padrão: { params }: { params: { paramName: string; paramName2: string } }
    const pattern2 = /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{\s*([^}]+)\s*\}\s*\}/g;
    const replacement2 = (match, paramsContent) => {
      // Verificar se já é Promise
      if (paramsContent.includes('Promise')) {
        return match;
      }
      
      modified = true;
      return `{ params }: { params: Promise<{ ${paramsContent} }> }`;
    };
    
    // Aplicar correções
    content = content.replace(pattern2, replacement2);
    content = content.replace(pattern1, replacement1);
    
    // Adicionar await params se necessário
    // Procurar por funções que usam params mas não fazem await
    const functionPattern = /export\s+async\s+function\s+(\w+)\s*\([^)]*\{\s*params\s*\}:\s*\{\s*params:\s*Promise<[^>]+>\s*\}[^)]*\)\s*\{/g;
    const functionMatches = [...content.matchAll(functionPattern)];
    
    functionMatches.forEach(match => {
      const functionName = match[1];
      const functionStart = match.index;
      
      // Procurar pelo primeiro uso de params dentro da função
      const functionBody = content.substring(functionStart);
      const firstBrace = functionBody.indexOf('{');
      const functionContent = functionBody.substring(firstBrace + 1);
      
      // Verificar se já tem await params
      if (!functionContent.includes('await params')) {
        // Procurar pelo primeiro uso de params
        const paramsUsagePattern = /params\?\.(\w+)/g;
        const firstUsage = paramsUsagePattern.exec(functionContent);
        
        if (firstUsage) {
          const paramName = firstUsage[1];
          const usageIndex = firstUsage.index;
          
          // Inserir await params antes do primeiro uso
          const beforeUsage = functionContent.substring(0, usageIndex);
          const afterUsage = functionContent.substring(usageIndex);
          
          // Verificar se já tem const { paramName } = await params
          if (!beforeUsage.includes(`const { ${paramName} } = await params`)) {
            const insertPoint = functionStart + firstBrace + 1 + usageIndex;
            const indent = beforeUsage.match(/\n(\s*)$/)?.[1] || '    ';
            const awaitStatement = `\n${indent}const { ${paramName} } = await params\n`;
            
            // Encontrar a linha anterior ao uso
            const lines = content.substring(0, insertPoint).split('\n');
            const currentLine = lines[lines.length - 1];
            const currentIndent = currentLine.match(/^(\s*)/)?.[1] || '';
            
            // Inserir após a abertura da função ou após try se houver
            const tryIndex = beforeUsage.lastIndexOf('try {');
            if (tryIndex !== -1) {
              const tryEnd = functionStart + firstBrace + 1 + tryIndex + 5;
              content = content.substring(0, tryEnd) + awaitStatement + content.substring(tryEnd);
            } else {
              const functionOpen = functionStart + firstBrace + 1;
              content = content.substring(0, functionOpen) + awaitStatement + content.substring(functionOpen);
            }
            
            modified = true;
          }
        }
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`Erro ao processar ${filePath}:`, err.message);
    return false;
  }
}

function main() {
  console.log('🔧 Corrigindo rotas dinâmicas para Next.js 15...\n');
  
  const apiDir = path.join(__dirname, '../app/api');
  const routeFiles = findRouteFiles(apiDir);
  
  console.log(`Encontradas ${routeFiles.length} rotas dinâmicas\n`);
  
  let fixed = 0;
  routeFiles.forEach(file => {
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    if (fixRouteFile(file)) {
      console.log(`✅ Corrigido: ${relativePath}`);
      fixed++;
    } else {
      console.log(`⏭️  Já correto: ${relativePath}`);
    }
  });
  
  console.log(`\n✅ ${fixed} arquivo(s) corrigido(s) de ${routeFiles.length} total`);
}

main();

