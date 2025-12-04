/**
 * Testes para Export Map PNG
 */

import { exportMapPNG, exportMapPNGWithLegends } from '@/lib/export-map-png'

// Mock html2canvas
const mockHtml2Canvas = jest.fn()
jest.mock('html2canvas', () => ({
  __esModule: true,
  default: mockHtml2Canvas,
}))

describe('Export Map PNG', () => {
  const originalDocument = global.document
  const originalWindow = global.window

  beforeEach(() => {
    jest.clearAllMocks()
    mockHtml2Canvas.mockResolvedValue({
      width: 800,
      height: 600,
      toDataURL: jest.fn(() => 'data:image/png;base64,test'),
    })

    // Mock DOM
    global.document = {
      getElementById: jest.fn(),
      createElement: jest.fn((tag: string) => {
        if (tag === 'a') {
          return {
            download: '',
            href: '',
            click: jest.fn(),
          } as any
        }
        if (tag === 'div') {
          return {
            className: '',
            textContent: '',
          } as any
        }
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: jest.fn(() => ({
              fillStyle: '',
              fillRect: jest.fn(),
              drawImage: jest.fn(),
            })),
            toDataURL: jest.fn(() => 'data:image/png;base64,test'),
          } as any
        }
        return {} as any
      }),
      body: {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
      },
    } as any

    global.window = {
      location: { href: 'http://localhost' },
    } as any
  })

  afterEach(() => {
    global.document = originalDocument
    global.window = originalWindow
  })

  describe('exportMapPNG', () => {
    it('deve exportar mapa como PNG com sucesso', async () => {
      const mockContainer = {
        id: 'map-container',
        scrollWidth: 800,
        scrollHeight: 600,
      }

      ;(global.document.getElementById as jest.Mock).mockReturnValue(mockContainer)

      await exportMapPNG('map-container')

      expect(global.document.getElementById).toHaveBeenCalledWith('map-container')
      expect(mockHtml2Canvas).toHaveBeenCalledWith(mockContainer, expect.objectContaining({
        useCORS: true,
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      }))
    })

    it('deve usar ID padrão quando não fornecido', async () => {
      const mockContainer = {
        id: 'map-container',
        scrollWidth: 800,
        scrollHeight: 600,
      }

      ;(global.document.getElementById as jest.Mock).mockReturnValue(mockContainer)

      await exportMapPNG()

      expect(global.document.getElementById).toHaveBeenCalledWith('map-container')
    })

    it('deve lançar erro se container não encontrado', async () => {
      ;(global.document.getElementById as jest.Mock).mockReturnValue(null)

      await expect(exportMapPNG('non-existent')).rejects.toThrow('Container com ID "non-existent" não encontrado')
    })

    it('deve criar link de download e disparar clique', async () => {
      const mockContainer = {
        id: 'map-container',
        scrollWidth: 800,
        scrollHeight: 600,
      }
      const mockLink = {
        download: '',
        href: '',
        click: jest.fn(),
      }

      ;(global.document.getElementById as jest.Mock).mockReturnValue(mockContainer)
      ;(global.document.createElement as jest.Mock).mockReturnValueOnce({
        className: '',
        textContent: '',
      } as any)
      ;(global.document.createElement as jest.Mock).mockReturnValueOnce(mockLink)
      ;(global.document.createElement as jest.Mock).mockReturnValueOnce({
        className: '',
        textContent: '',
      } as any)

      await exportMapPNG('map-container')

      expect(global.document.body.appendChild).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(global.document.body.removeChild).toHaveBeenCalled()
    })

    it('deve lidar com erros durante exportação', async () => {
      const mockContainer = {
        id: 'map-container',
        scrollWidth: 800,
        scrollHeight: 600,
      }

      ;(global.document.getElementById as jest.Mock).mockReturnValue(mockContainer)
      mockHtml2Canvas.mockRejectedValue(new Error('Canvas error'))

      const mockErrorToast = {
        className: '',
        textContent: '',
      }

      ;(global.document.createElement as jest.Mock).mockReturnValue(mockErrorToast)

      await expect(exportMapPNG('map-container')).rejects.toThrow('Canvas error')

      expect(global.document.body.appendChild).toHaveBeenCalled()
    })
  })

  describe('exportMapPNGWithLegends', () => {
    it('deve exportar mapa com legendas', async () => {
      const mockMapContainer = {
        id: 'map-container',
        scrollWidth: 800,
        scrollHeight: 600,
      }
      const mockLegendContainer = {
        id: 'legend-container',
        scrollWidth: 200,
        scrollHeight: 400,
      }

      ;(global.document.getElementById as jest.Mock)
        .mockReturnValueOnce(mockMapContainer)
        .mockReturnValueOnce(mockLegendContainer)

      mockHtml2Canvas
        .mockResolvedValueOnce({
          width: 800,
          height: 600,
          toDataURL: jest.fn(),
        })
        .mockResolvedValueOnce({
          width: 200,
          height: 400,
          toDataURL: jest.fn(),
        })

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          fillStyle: '',
          fillRect: jest.fn(),
          drawImage: jest.fn(),
        })),
        toDataURL: jest.fn(() => 'data:image/png;base64,test'),
      }

      ;(global.document.createElement as jest.Mock).mockReturnValue(mockCanvas)

      await exportMapPNGWithLegends('map-container', 'legend-container')

      expect(mockHtml2Canvas).toHaveBeenCalledTimes(2)
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d')
    })

    it('deve exportar mapa sem legendas quando legendContainerId não fornecido', async () => {
      const mockMapContainer = {
        id: 'map-container',
        scrollWidth: 800,
        scrollHeight: 600,
      }

      ;(global.document.getElementById as jest.Mock).mockReturnValue(mockMapContainer)

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          fillStyle: '',
          fillRect: jest.fn(),
          drawImage: jest.fn(),
        })),
        toDataURL: jest.fn(() => 'data:image/png;base64,test'),
      }

      ;(global.document.createElement as jest.Mock).mockReturnValue(mockCanvas)

      await exportMapPNGWithLegends('map-container')

      expect(mockHtml2Canvas).toHaveBeenCalledTimes(1)
    })

    it('deve lançar erro se container do mapa não encontrado', async () => {
      ;(global.document.getElementById as jest.Mock).mockReturnValue(null)

      await expect(exportMapPNGWithLegends('non-existent')).rejects.toThrow('Container do mapa "non-existent" não encontrado')
    })

    it('deve combinar mapa e legendas corretamente', async () => {
      const mockMapContainer = {
        id: 'map-container',
        scrollWidth: 800,
        scrollHeight: 600,
      }
      const mockLegendContainer = {
        id: 'legend-container',
        scrollWidth: 200,
        scrollHeight: 400,
      }

      ;(global.document.getElementById as jest.Mock)
        .mockReturnValueOnce(mockMapContainer)
        .mockReturnValueOnce(mockLegendContainer)

      const mapCanvas = {
        width: 800,
        height: 600,
        toDataURL: jest.fn(),
      }
      const legendCanvas = {
        width: 200,
        height: 400,
        toDataURL: jest.fn(),
      }

      mockHtml2Canvas
        .mockResolvedValueOnce(mapCanvas)
        .mockResolvedValueOnce(legendCanvas)

      const mockCtx = {
        fillStyle: '',
        fillRect: jest.fn(),
        drawImage: jest.fn(),
      }

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => mockCtx),
        toDataURL: jest.fn(() => 'data:image/png;base64,test'),
      }

      ;(global.document.createElement as jest.Mock).mockReturnValue(mockCanvas)

      await exportMapPNGWithLegends('map-container', 'legend-container')

      expect(mockCtx.drawImage).toHaveBeenCalledWith(mapCanvas, 0, 0)
      expect(mockCtx.drawImage).toHaveBeenCalledWith(legendCanvas, 800, 0)
      expect(mockCanvas.width).toBe(1000) // 800 + 200
      expect(mockCanvas.height).toBe(600) // max(600, 400)
    })
  })
})

