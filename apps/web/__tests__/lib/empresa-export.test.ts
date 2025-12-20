/**
 * Testes para operador Export
 */

import { exportOperatorData, prepareEmployeesExport, prepareAlertsExport, prepareRoutesExport } from '@/lib/operador-export'
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils'

jest.mock('@/lib/export-utils', () => ({
  exportToCSV: jest.fn(),
  exportToExcel: jest.fn(),
  exportToPDF: jest.fn(),
}))

describe('operador Export', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('exportOperatorData', () => {
    const mockData = {
      headers: ['Nome', 'Email'],
      rows: [['João', 'joao@test.com']],
      title: 'Test Export',
    }

    it('deve exportar como CSV', () => {
      exportOperatorData(mockData, 'csv', 'test.csv')

      expect(exportToCSV).toHaveBeenCalledWith(mockData, 'test.csv')
      expect(exportToExcel).not.toHaveBeenCalled()
      expect(exportToPDF).not.toHaveBeenCalled()
    })

    it('deve exportar como Excel', () => {
      exportOperatorData(mockData, 'excel', 'test.xlsx')

      expect(exportToExcel).toHaveBeenCalledWith(mockData, 'test.xlsx')
      expect(exportToCSV).not.toHaveBeenCalled()
      expect(exportToPDF).not.toHaveBeenCalled()
    })

    it('deve exportar como PDF', () => {
      exportOperatorData(mockData, 'pdf', 'test.pdf')

      expect(exportToPDF).toHaveBeenCalledWith(mockData, 'test.pdf')
      expect(exportToCSV).not.toHaveBeenCalled()
      expect(exportToExcel).not.toHaveBeenCalled()
    })

    it('deve usar nome de arquivo padrão quando não fornecido', () => {
      const today = new Date().toISOString().split('T')[0]

      exportOperatorData(mockData, 'csv')

      expect(exportToCSV).toHaveBeenCalledWith(mockData, expect.stringContaining(today))
    })
  })

  describe('prepareEmployeesExport', () => {
    it('deve preparar dados de funcionários corretamente', () => {
      const employees = [
        {
          name: 'João Silva',
          email: 'joao@test.com',
          phone: '31999999999',
          cpf: '12345678900',
          address: 'Rua Teste, 123',
          is_active: true,
        },
        {
          name: 'Maria Santos',
          email: 'maria@test.com',
          phone: '31988888888',
          cpf: '98765432100',
          address: 'Rua Outra, 456',
          is_active: false,
        },
      ]

      const result = prepareEmployeesExport(employees)

      expect(result.title).toBe('Funcionários')
      expect(result.description).toBe('Lista de funcionários da empresa')
      expect(result.headers).toEqual(['Nome', 'Email', 'Telefone', 'CPF', 'Endereço', 'Status'])
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]).toEqual(['João Silva', 'joao@test.com', '31999999999', '12345678900', 'Rua Teste, 123', 'Ativo'])
      expect(result.rows[1]).toEqual(['Maria Santos', 'maria@test.com', '31988888888', '98765432100', 'Rua Outra, 456', 'Inativo'])
    })

    it('deve lidar com campos ausentes', () => {
      const employees = [
        {
          name: 'João',
          is_active: true,
        },
      ]

      const result = prepareEmployeesExport(employees)

      expect(result.rows[0]).toEqual(['João', '', '', '', '', 'Ativo'])
    })

    it('deve retornar estrutura vazia para array vazio', () => {
      const result = prepareEmployeesExport([])

      expect(result.headers).toEqual(['Nome', 'Email', 'Telefone', 'CPF', 'Endereço', 'Status'])
      expect(result.rows).toHaveLength(0)
    })
  })

  describe('prepareAlertsExport', () => {
    it('deve preparar dados de alertas corretamente', () => {
      const alerts = [
        {
          alert_type: 'incident',
          severity: 'high',
          message: 'Test alert',
          created_at: '2024-01-01T10:00:00Z',
          is_resolved: false,
        },
        {
          alert_type: 'assistance',
          severity: 'medium',
          message: 'Another alert',
          created_at: '2024-01-02T10:00:00Z',
          is_resolved: true,
        },
      ]

      const result = prepareAlertsExport(alerts)

      expect(result.title).toBe('Alertas')
      expect(result.description).toBe('Lista de alertas do sistema')
      expect(result.headers).toEqual(['Tipo', 'Severidade', 'Mensagem', 'Data', 'Status'])
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0][0]).toBe('incident')
      expect(result.rows[0][1]).toBe('high')
      expect(result.rows[0][2]).toBe('Test alert')
      expect(result.rows[0][4]).toBe('Não Resolvido')
      expect(result.rows[1][4]).toBe('Resolvido')
    })

    it('deve lidar com campos ausentes', () => {
      const alerts = [
        {
          alert_type: 'incident',
        },
      ]

      const result = prepareAlertsExport(alerts)

      expect(result.rows[0]).toEqual(['incident', '', '', '', 'Não Resolvido'])
    })
  })

  describe('prepareRoutesExport', () => {
    it('deve preparar dados de rotas corretamente', () => {
      const routes = [
        {
          name: 'Rota A',
          carrier_name: 'Transportadora X',
          total_trips: 100,
          completed_trips: 95,
          avg_delay_minutes: 5.5,
        },
        {
          name: 'Rota B',
          carrier_name: 'Transportadora Y',
          total_trips: 50,
          completed_trips: 48,
          avg_delay_minutes: 2.3,
        },
      ]

      const result = prepareRoutesExport(routes)

      expect(result.title).toBe('Rotas')
      expect(result.description).toBe('Lista de rotas da empresa')
      expect(result.headers).toEqual(['Nome', 'Transportadora', 'Total de Viagens', 'Concluídas', 'Atraso Médio'])
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]).toEqual(['Rota A', 'Transportadora X', 100, 95, '5.5 min'])
      expect(result.rows[1]).toEqual(['Rota B', 'Transportadora Y', 50, 48, '2.3 min'])
    })

    it('deve lidar com valores ausentes', () => {
      const routes = [
        {
          name: 'Rota C',
        },
      ]

      const result = prepareRoutesExport(routes)

      expect(result.rows[0]).toEqual(['Rota C', '', 0, 0, '0 min'])
    })

    it('deve formatar atraso médio corretamente', () => {
      const routes = [
        {
          name: 'Rota D',
          avg_delay_minutes: 10.123,
        },
      ]

      const result = prepareRoutesExport(routes)

      expect(result.rows[0][4]).toBe('10.1 min')
    })
  })
})

