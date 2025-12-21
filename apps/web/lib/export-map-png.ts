/**
 * Utilitários para exportar mapa como PNG
 */

/**
 * Exporta o mapa como PNG usando html2canvas
 */
export async function exportMapPNG(containerId: string = 'map-container'): Promise<void> {
  try {
    // Importar html2canvas dinamicamente
    const html2canvas = (await import('html2canvas')).default
    
    const container = document.getElementById(containerId)
    if (!container) {
      throw new Error(`Container com ID "${containerId}" não encontrado`)
    }

    // Mostrar loading
    const loadingToast = document.createElement('div')
    loadingToast.className = 'fixed top-4 right-4 bg-info text-white px-4 py-2 rounded-lg shadow-lg z-50'
    loadingToast.textContent = 'Exportando mapa...'
    document.body.appendChild(loadingToast)

    try {
      // Capturar screenshot do container
      const canvas = await html2canvas(container, {
        useCORS: true,
        backgroundColor: '#ffffff',
        scale: 2, // Resolução 2x para melhor qualidade
        logging: false,
        width: container.scrollWidth,
        height: container.scrollHeight,
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight,
      })

      // Criar link para download
      const link = document.createElement('a')
      const filename = `mapa-golffox-${new Date().toISOString().split('T')[0]}.png`
      link.download = filename
      link.href = canvas.toDataURL('image/png', 1.0)
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Remover loading
      document.body.removeChild(loadingToast)

      // Mostrar sucesso
      const successToast = document.createElement('div')
      successToast.className = 'fixed top-4 right-4 bg-success text-white px-4 py-2 rounded-lg shadow-lg z-50'
      successToast.textContent = 'Mapa exportado com sucesso!'
      document.body.appendChild(successToast)
      setTimeout(() => {
        document.body.removeChild(successToast)
      }, 3000)
    } catch (error: any) {
      // Remover loading
      document.body.removeChild(loadingToast)
      
      // Mostrar erro
      const errorToast = document.createElement('div')
      errorToast.className = 'fixed top-4 right-4 bg-error text-white px-4 py-2 rounded-lg shadow-lg z-50'
      errorToast.textContent = `Erro ao exportar: ${error.message}`
      document.body.appendChild(errorToast)
      setTimeout(() => {
        document.body.removeChild(errorToast)
      }, 5000)
      
      throw error
    }
  } catch (error: any) {
    const { error: logError } = await import('./logger')
    logError('Erro ao exportar mapa como PNG', { error }, 'ExportMapPNG')
    throw error
  }
}

/**
 * Exporta mapa com legendas e informações adicionais
 */
export async function exportMapPNGWithLegends(
  mapContainerId: string,
  legendContainerId?: string
): Promise<void> {
  try {
    const html2canvas = (await import('html2canvas')).default

    const mapContainer = document.getElementById(mapContainerId)
    if (!mapContainer) {
      throw new Error(`Container do mapa "${mapContainerId}" não encontrado`)
    }

    // Capturar mapa
    const mapCanvas = await html2canvas(mapContainer, {
      useCORS: true,
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    })

    // Se houver legendas, capturar também
    let legendCanvas: HTMLCanvasElement | null = null
    if (legendContainerId) {
      const legendContainer = document.getElementById(legendContainerId)
      if (legendContainer) {
        legendCanvas = await html2canvas(legendContainer, {
          useCORS: true,
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        })
      }
    }

    // Combinar canvas (mapa + legendas)
    const finalCanvas = document.createElement('canvas')
    const ctx = finalCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('Erro ao criar contexto do canvas')
    }

    // Calcular dimensões finais
    const mapWidth = mapCanvas.width
    const mapHeight = mapCanvas.height
    const legendWidth = legendCanvas ? legendCanvas.width : 0
    const legendHeight = legendCanvas ? legendCanvas.height : 0

    finalCanvas.width = mapWidth + (legendCanvas ? legendWidth : 0)
    finalCanvas.height = Math.max(mapHeight, legendHeight)

    // Desenhar fundo branco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

    // Desenhar mapa
    ctx.drawImage(mapCanvas, 0, 0)

    // Desenhar legendas (se houver)
    if (legendCanvas) {
      ctx.drawImage(legendCanvas, mapWidth, 0)
    }

    // Criar link para download
    const link = document.createElement('a')
    const filename = `mapa-golffox-${new Date().toISOString().split('T')[0]}.png`
    link.download = filename
    link.href = finalCanvas.toDataURL('image/png', 1.0)
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error: any) {
    const { error: logError } = await import('./logger')
    logError('Erro ao exportar mapa com legendas', { error }, 'ExportMapPNG')
    throw error
  }
}

