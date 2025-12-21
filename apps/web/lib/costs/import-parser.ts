/**
 * Parser de CSV/Excel para importação de custos
 */

export interface ParsedCostRow {
  date: string
  category: string
  subcategory?: string
  amount: number
  qty?: number
  unit?: string
  route_name?: string
  vehicle_plate?: string
  driver_email?: string
  notes?: string
}

export interface ParseResult {
  valid: ParsedCostRow[]
  errors: Array<{ line: number; row: any; errors: string[] }>
}

/**
 * Parse CSV string
 */
export async function parseCSV(
  csvText: string,
  columnMapping?: Record<string, string>
): Promise<ParsedCostRow[]> {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    return []
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())

  // Default mapping se não fornecido
  const mapping: Record<string, string> = columnMapping || {
    'data': 'date',
    'date': 'date',
    'categoria': 'category',
    'category': 'category',
    'subcategoria': 'subcategory',
    'subcategory': 'subcategory',
    'valor': 'amount',
    'amount': 'amount',
    'quantidade': 'qty',
    'qty': 'qty',
    'unidade': 'unit',
    'unit': 'unit',
    'rota': 'route_name',
    'route': 'route_name',
    'veiculo': 'vehicle_plate',
    'vehicle': 'vehicle_plate',
    'motorista': 'driver_email',
    'driver': 'driver_email',
    'observacoes': 'notes',
    'notes': 'notes'
  }

  // Mapear índices das colunas
  const columnIndices: Record<string, number> = {}
  header.forEach((col, index) => {
    const mappedCol = mapping[col] || col
    columnIndices[mappedCol] = index
  })

  // Parse rows
  const results: ParsedCostRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const values = parseCSVLine(line)
    if (values.length === 0) continue

    try {
      const row: ParsedCostRow = {
        date: values[columnIndices.date] || new Date().toISOString().split('T')[0],
        category: values[columnIndices.category] || '',
        subcategory: values[columnIndices.subcategory],
        amount: parseFloat(values[columnIndices.amount] || '0'),
        qty: values[columnIndices.qty] ? parseFloat(values[columnIndices.qty]) : undefined,
        unit: values[columnIndices.unit],
        route_name: values[columnIndices.route_name],
        vehicle_plate: values[columnIndices.vehicle_plate],
        driver_email: values[columnIndices.driver_email],
        notes: values[columnIndices.notes]
      }

      // Validações básicas
      if (!row.category || isNaN(row.amount) || row.amount <= 0) {
        continue // Pular linha inválida
      }

      results.push(row)
    } catch (err) {
      // Ignorar erros de parse e continuar
      const { warn } = await import('../logger')
      warn(`Erro ao parsear linha`, { lineNumber: i + 1, error: err }, 'CostsImportParser')
    }
  }

  return results
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

/**
 * Validate parsed row
 */
export function validateCostRow(row: ParsedCostRow): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!row.date || !isValidDate(row.date)) {
    errors.push('Data inválida')
  }

  if (!row.category || row.category.trim() === '') {
    errors.push('Categoria é obrigatória')
  }

  if (!row.amount || isNaN(row.amount) || row.amount <= 0) {
    errors.push('Valor deve ser um número positivo')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Check if date string is valid
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

