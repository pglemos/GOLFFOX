/**
 * Script para aplicar patch de compatibilidade no @swc/helpers
 * 
 * Adiciona exportação applyDecoratedDescriptor para compatibilidade com fontkit
 * que espera a versão 0.3.17, mas o Next.js usa 0.5.15
 */

const fs = require('fs');
const path = require('path');

const swcHelpersPath = path.join(
  __dirname,
  '../node_modules/next/node_modules/@swc/helpers/esm/index.js'
);

if (fs.existsSync(swcHelpersPath)) {
  let content = fs.readFileSync(swcHelpersPath, 'utf8');
  
  // Verificar se o patch já foi aplicado
  if (!content.includes('applyDecoratedDescriptor')) {
    // Adicionar exportação de compatibilidade após _apply_decorated_descriptor
    content = content.replace(
      /export \{ _ as _apply_decorated_descriptor \} from "\.\/_apply_decorated_descriptor\.js";/,
      `export { _ as _apply_decorated_descriptor } from "./_apply_decorated_descriptor.js";
// Compatibilidade com fontkit: exportar applyDecoratedDescriptor (versão 0.3.17)
export { _ as applyDecoratedDescriptor } from "./_apply_decorated_descriptor.js";`
    );
    
    fs.writeFileSync(swcHelpersPath, content, 'utf8');
    console.log('✅ Patch aplicado com sucesso em @swc/helpers');
  } else {
    console.log('ℹ️  Patch já aplicado em @swc/helpers');
  }
} else {
  console.warn('⚠️  Arquivo @swc/helpers não encontrado. O patch será aplicado após npm install.');
}
