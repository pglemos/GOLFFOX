/**
 * Script para verificar e corrigir problemas de responsividade mobile
 * em todas as páginas do sistema
 */

const fs = require('fs');
const path = require('path');

const patterns = [
  // Headers sem responsividade
  {
    search: /<div className="flex items-center justify-between">\s*<div>\s*<h1 className="text-3xl font-bold mb-2">/g,
    replace: `<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 break-words">`
  },
  // Space-y-6 sem variante mobile
  {
    search: /className="space-y-6"/g,
    replace: 'className="space-y-4 sm:space-y-6 w-full overflow-x-hidden"'
  },
  // Grid gap-4 sem variante mobile
  {
    search: /className="grid gap-4"/g,
    replace: 'className="grid gap-3 sm:gap-4 w-full"'
  },
  // Cards sem overflow-hidden
  {
    search: /<Card className="p-4 hover:shadow-lg transition-shadow">/g,
    replace: '<Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow overflow-hidden">'
  },
  // Textos sem break-words
  {
    search: /<p className="text-\[var\(--muted\)\]">/g,
    replace: '<p className="text-sm sm:text-base text-[var(--muted)] break-words">'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    patterns.forEach(pattern => {
      if (pattern.search.test(content)) {
        content = content.replace(pattern.search, pattern.replace);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

function findPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      findPageFiles(filePath, fileList);
    } else if (file === 'page.tsx') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Executar
const appDir = path.join(__dirname, '../app');
const pageFiles = findPageFiles(appDir);

console.log(`\n🔍 Encontradas ${pageFiles.length} páginas para verificar...\n`);

let fixedCount = 0;
pageFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Correção concluída! ${fixedCount} arquivos modificados.\n`);

