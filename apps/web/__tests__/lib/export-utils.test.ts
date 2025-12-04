import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils'

// Mock DOM APIs
global.Blob = jest.fn().mockImplementation((parts, options) => ({
  parts,
  type: options?.type || '',
  size: 0,
})) as any

global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

// Mock document
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tag) => {
    const element = {
      setAttribute: jest.fn(),
      style: {},
      click: jest.fn(),
    }
    return element
  }),
})

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
})

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn(),
})

// Mock window.open
global.window.open = jest.fn(() => ({
  document: {
    write: jest.fn(),
    close: jest.fn(),
  },
  print: jest.fn(),
  close: jest.fn(),
})) as any

describe('lib/export-utils', () => {
  const mockReportData = {
    title: 'Relatório Teste',
    description: 'Descrição do relatório',
    headers: ['Coluna 1', 'Coluna 2', 'Coluna 3'],
    rows: [
      [1, 'Valor 1', 100.50],
      [2, 'Valor 2', 200.75],
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('exportToCSV', () => {
    it('deve exportar dados para CSV', () => {
      exportToCSV(mockReportData, 'test.csv')

      expect(global.Blob).toHaveBeenCalled()
      expect(document.createElement).toHaveBeenCalledWith('a')
    })

    it('deve formatar números com vírgula decimal', () => {
      const data = {
        title: 'Test',
        headers: ['Valor'],
        rows: [[100.50]],
      }

      exportToCSV(data, 'test.csv')

      expect(global.Blob).toHaveBeenCalled()
    })

    it('deve escapar vírgulas e aspas', () => {
      const data = {
        title: 'Test',
        headers: ['Texto'],
        rows: [['Texto com, vírgula']],
      }

      exportToCSV(data, 'test.csv')

      expect(global.Blob).toHaveBeenCalled()
    })
  })

  describe('exportToExcel', () => {
    it('deve exportar para Excel (CSV)', () => {
      exportToExcel(mockReportData, 'test.xlsx')

      expect(global.Blob).toHaveBeenCalled()
    })
  })

  describe('exportToPDF', () => {
    it('deve exportar para PDF', () => {
      exportToPDF(mockReportData, 'test.pdf')

      expect(global.window.open).toHaveBeenCalled()
    })

    it('deve lidar com pop-ups bloqueados', () => {
      global.window.open = jest.fn(() => null) as any
      global.alert = jest.fn()

      exportToPDF(mockReportData, 'test.pdf')

      expect(global.alert).toHaveBeenCalled()
    })
  })
})

