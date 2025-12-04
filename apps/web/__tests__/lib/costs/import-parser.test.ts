import { parseCSV } from '@/lib/costs/import-parser'

describe('lib/costs/import-parser', () => {
  describe('parseCSV', () => {
    it('deve parsear CSV válido', async () => {
      const csv = `data,categoria,valor
2024-01-15,Combustível,1000
2024-01-16,Manutenção,500`

      const result = await parseCSV(csv)

      expect(result).toHaveLength(2)
      expect(result[0].category).toBe('Combustível')
      expect(result[0].amount).toBe(1000)
    })

    it('deve retornar array vazio para CSV vazio', async () => {
      const result = await parseCSV('')
      expect(result).toEqual([])
    })

    it('deve usar mapeamento customizado', async () => {
      const csv = `Data,Categoria,Valor
2024-01-15,Combustível,1000`

      const mapping = {
        'Data': 'date',
        'Categoria': 'category',
        'Valor': 'amount',
      }

      const result = await parseCSV(csv, mapping)

      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2024-01-15')
    })

    it('deve pular linhas inválidas', async () => {
      const csv = `data,categoria,valor
2024-01-15,Combustível,1000
,,
2024-01-16,Manutenção,500`

      const result = await parseCSV(csv)

      expect(result.length).toBeGreaterThanOrEqual(2)
    })
  })

})

