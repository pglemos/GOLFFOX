/**
 * Script para criar favicon.ico e icon.png usando canvas
 */

const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

function createFavicon() {
  const publicDir = path.join(__dirname, '../public')

  // Criar favicon 32x32
  const faviconCanvas = createCanvas(32, 32)
  const faviconCtx = faviconCanvas.getContext('2d')
  
  // Gradiente laranja
  const gradient = faviconCtx.createLinearGradient(0, 0, 32, 32)
  gradient.addColorStop(0, '#FF7F2A')
  gradient.addColorStop(1, '#FF5A00')
  
  // Fundo com bordas arredondadas
  faviconCtx.fillStyle = gradient
  faviconCtx.beginPath()
  faviconCtx.roundRect(0, 0, 32, 32, 4)
  faviconCtx.fill()
  
  // Seta branca simples
  faviconCtx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  faviconCtx.beginPath()
  faviconCtx.moveTo(7, 22)
  faviconCtx.lineTo(25, 9)
  faviconCtx.lineTo(25, 12)
  faviconCtx.lineTo(10, 24)
  faviconCtx.closePath()
  faviconCtx.fill()
  
  // Círculo branco
  faviconCtx.fillStyle = '#FFFFFF'
  faviconCtx.beginPath()
  faviconCtx.arc(12, 10, 1.5, 0, Math.PI * 2)
  faviconCtx.fill()
  
  // Salvar como PNG (funciona como favicon em navegadores modernos)
  const faviconBuffer = faviconCanvas.toBuffer('image/png')
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconBuffer)
  console.log('✅ favicon.ico criado (32x32 PNG)')

  // Criar icon.png 512x512
  const iconCanvas = createCanvas(512, 512)
  const iconCtx = iconCanvas.getContext('2d')
  
  // Gradiente laranja
  const iconGradient = iconCtx.createLinearGradient(0, 0, 512, 512)
  iconGradient.addColorStop(0, '#FF7F2A')
  iconGradient.addColorStop(1, '#FF5A00')
  
  // Fundo com bordas arredondadas
  iconCtx.fillStyle = iconGradient
  iconCtx.beginPath()
  iconCtx.roundRect(0, 0, 512, 512, 64)
  iconCtx.fill()
  
  // Seta branca (escalada)
  iconCtx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  iconCtx.beginPath()
  iconCtx.moveTo(112, 360)
  iconCtx.lineTo(400, 144)
  iconCtx.lineTo(400, 192)
  iconCtx.lineTo(160, 384)
  iconCtx.closePath()
  iconCtx.fill()
  
  // Círculo branco (escalado)
  iconCtx.fillStyle = '#FFFFFF'
  iconCtx.beginPath()
  iconCtx.arc(192, 160, 24, 0, Math.PI * 2)
  iconCtx.fill()
  
  // Salvar icon.png
  const iconBuffer = iconCanvas.toBuffer('image/png')
  fs.writeFileSync(path.join(publicDir, 'icon.png'), iconBuffer)
  console.log('✅ icon.png criado (512x512)')
  
  console.log('\n✅ Favicons criados com sucesso!')
}

try {
  createFavicon()
} catch (error) {
  console.error('❌ Erro ao criar favicons:', error.message)
  console.log('\n💡 Alternativa: Use https://realfavicongenerator.net/ para gerar os favicons')
  process.exit(1)
}

