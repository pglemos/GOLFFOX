/**
 * Script para gerar favicon.ico e icon.png a partir do logo SVG
 * 
 * Requer: sharp (npm install sharp)
 * Executar: node scripts/generate-favicon.js
 */

const fs = require('fs')
const path = require('path')

async function generateFavicon() {
  try {
    // Verificar se sharp está instalado
    let sharp
    try {
      sharp = require('sharp')
    } catch (e) {
      console.error('❌ Erro: sharp não está instalado.')
      console.log('📦 Instale com: npm install sharp')
      console.log('💡 Alternativa: Use uma ferramenta online como https://realfavicongenerator.net/')
      process.exit(1)
    }

    const svgPath = path.join(__dirname, '../../../assets/icons/golf_fox_logo.svg')
    const publicDir = path.join(__dirname, '../public')
    
    // Verificar se o SVG existe
    if (!fs.existsSync(svgPath)) {
      console.error(`❌ SVG não encontrado em: ${svgPath}`)
      process.exit(1)
    }

    // Criar diretório public se não existir
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    const svgBuffer = fs.readFileSync(svgPath)

    // Gerar favicon.ico (16x16, 32x32, 48x48)
    console.log('🔄 Gerando favicon.ico...')
    const favicon16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer()
    const favicon32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer()
    const favicon48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer()
    
    // Para ICO, vamos criar um PNG simples por enquanto
    // (ICO completo requer biblioteca adicional)
    await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'))
    console.log('✅ favicon.ico criado (32x32 PNG como ICO)')

    // Gerar icon.png (512x512) para Next.js
    console.log('🔄 Gerando icon.png...')
    await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon.png'))
    console.log('✅ icon.png criado (512x512)')

    console.log('\n✅ Favicons gerados com sucesso!')
    console.log('📁 Arquivos criados em:', publicDir)
  } catch (error) {
    console.error('❌ Erro ao gerar favicons:', error.message)
    process.exit(1)
  }
}

generateFavicon()

