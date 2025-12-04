# Instruções para criar favicon.ico e icon.png

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
