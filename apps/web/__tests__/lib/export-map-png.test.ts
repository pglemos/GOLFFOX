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

  let mockGetElementById: jest.Mock
  let mockCreateElement: jest.Mock
  let mockAppendChild: jest.Mock
  let mockRemoveChild: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockHtml2Canvas.mockResolvedValue({
      width: 800,
      height: 600,
      toDataURL: jest.fn(() => 'data:image/png;base64,test'),
    })

    // Create mock functions
    mockGetElementById = jest.fn()
    mockCreateElement = jest.fn((tag: string) => {
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
    })
    mockAppendChild = jest.fn()
    mockRemoveChild = jest.fn()

    // Mock DOM
    Object.defineProperty(global, 'document', {
      value: {
        getElementById: mockGetElementById,
        createElement: mockCreateElement,
        body: {
          appendChild: mockAppendChild,
          removeChild: mockRemoveChild,
        },
      },
      writable: true,
      configurable: true,
    })

    Object.defineProperty(global, 'window', {
      value: {
        location: { href: 'http://localhost' },
      },
      writable: true,
      configurable: true,
    })
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

      mockGetElementById.mockReturnValue(mockContainer)

      await exportMapPNG('map-container')

      expect(mockGetElementById).toHaveBeenCalledWith('map-container')
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

      mockGetElementById.mockReturnValue(mockContainer)

      await exportMapPNG()

      expect(mockGetElementById).toHaveBeenCalledWith('map-container')
    })

    it('deve lançar erro se container não encontrado', async () => {
      mockGetElementById.mockReturnValue(null)

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

      mockGetElementById.mockReturnValue(mockContainer)
      mockCreateElement.mockReturnValueOnce({
        className: '',
        textContent: '',
      } as any)
      mockCreateElement.mockReturnValueOnce(mockLink)
      mockCreateElement.mockReturnValueOnce({
        className: '',
        textContent: '',
      } as any)

      await exportMapPNG('map-container')

      expect(mockAppendChild).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockRemoveChild).toHaveBeenCalled()
    })

    it('deve lidar com erros durante exportação', async () => {
      const mockContainer = {
        id: 'map-container',
        scrollWidth: 800,
        scrollHeight: 600,
      }

      mockGetElementById.mockReturnValue(mockContainer)
      mockHtml2Canvas.mockRejectedValue(new Error('Canvas error'))

      const mockErrorToast = {
        className: '',
        textContent: '',
      }

      mockCreateElement.mockReturnValue(mockErrorToast)

      await expect(exportMapPNG('map-container')).rejects.toThrow('Canvas error')

      expect(mockAppendChild).toHaveBeenCalled()
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

      mockGetElementById
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

      mockCreateElement.mockReturnValue(mockCanvas)

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

      mockGetElementById.mockReturnValue(mockMapContainer)

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

      mockCreateElement.mockReturnValue(mockCanvas)

      await exportMapPNGWithLegends('map-container')

      expect(mockHtml2Canvas).toHaveBeenCalledTimes(1)
    })

    it('deve lançar erro se container do mapa não encontrado', async () => {
      mockGetElementById.mockReturnValue(null)

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

      mockGetElementById
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

      mockCreateElement.mockReturnValue(mockCanvas)

      await exportMapPNGWithLegends('map-container', 'legend-container')

      expect(mockCtx.drawImage).toHaveBeenCalledWith(mapCanvas, 0, 0)
      expect(mockCtx.drawImage).toHaveBeenCalledWith(legendCanvas, 800, 0)
      expect(mockCanvas.width).toBe(1000) // 800 + 200
      expect(mockCanvas.height).toBe(600) // max(600, 400)
    })
  })
})

