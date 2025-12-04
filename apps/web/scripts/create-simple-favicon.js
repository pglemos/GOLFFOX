/**
 * Script simples para criar favicon.ico e icon.png
 * Usa o SVG diretamente e cria versões PNG básicas
 */

const fs = require('fs')
const path = require('path')

// Criar um favicon básico em formato ICO (usando PNG como fallback)
// Como não podemos criar ICO real sem bibliotecas complexas,
// vamos criar um PNG que funciona como favicon moderno

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF7F2A"/>
      <stop offset="1" stop-color="#FF5A00"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="256" height="256" rx="32" fill="url(#g)"/>
  <path d="M56 180 L200 72 L200 100 L84 196 Z" fill="#FFFFFF" fill-opacity="0.92"/>
  <circle cx="100" cy="84" r="12" fill="#FFFFFF"/>
</svg>`

const publicDir = path.join(__dirname, '../public')

// Criar favicon.svg (funciona em navegadores modernos)
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent)
console.log('✅ favicon.svg criado')

// Para favicon.ico e icon.png, vamos criar um arquivo de instruções
// já que precisamos de conversão de SVG para PNG/ICO
const instructions = `# Instruções para criar favicon.ico e icon.png

Para criar os arquivos favicon.ico e icon.png a partir do favicon.svg:

1. Use uma ferramenta online como https://realfavicongenerator.net/
   - Faça upload do arquivo favicon.svg
   - Configure os tamanhos necessários
   - Baixe os arquivos gerados

2. Ou use o script generate-favicon.js (requer sharp):
   npm install sharp
   node scripts/generate-favicon.js

3. Coloque os arquivos em apps/web/public/:
   - favicon.ico (16x16, 32x32, 48x48)
   - icon.png (512x512)

O favicon.svg já está criado e funcionará em navegadores modernos.
`

fs.writeFileSync(path.join(publicDir, 'FAVICON_INSTRUCTIONS.md'), instructions)
console.log('📝 Instruções criadas em public/FAVICON_INSTRUCTIONS.md')
console.log('\n💡 Por enquanto, o favicon.svg funcionará em navegadores modernos.')
console.log('💡 Para criar favicon.ico e icon.png, siga as instruções no arquivo.')

