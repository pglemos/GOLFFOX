import Papa from 'papaparse'
import { z } from 'zod'
import { geocodeAddress } from '@/lib/google-maps'
import { supabase } from '@/lib/supabase'

// Schema Zod para validação
const EmployeeSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').transform((val) => val.replace(/\D/g, '')),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  endereco: z.string().min(5, 'Endereço deve ter ao menos 5 caracteres'),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  cep: z.string().optional(),
  centro_custo: z.string().optional(),
  turno: z.enum(['manha', 'tarde', 'noite']).optional()
})

export type EmployeeRow = z.infer<typeof EmployeeSchema>

export interface ParseResult {
  valid: EmployeeRow[]
  errors: Array<{ line: number; errors: string[] }>
}

export interface ImportResult {
  success: number
  errors: Array<{ employee: string; error: string }>
  unresolvedAddresses: string[]
}

/**
 * Parse CSV file usando PapaParse
 */
export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalizar nomes de colunas
        const normalized = header.trim().toLowerCase()
        const mapping: Record<string, string> = {
          'nome': 'nome',
          'name': 'nome',
          'cpf': 'cpf',
          'email': 'email',
          'telefone': 'telefone',
          'phone': 'telefone',
          'endereco': 'endereco',
          'address': 'endereco',
          'bairro': 'bairro',
          'cidade': 'cidade',
          'cep': 'cep',
          'centro_custo': 'centro_custo',
          'cost_center': 'centro_custo',
          'turno': 'turno'
        }
        return mapping[normalized] || normalized
      },
      complete: (results) => {
        const valid: EmployeeRow[] = []
        const errors: Array<{ line: number; errors: string[] }> = []

        results.data.forEach((row: any, index: number) => {
          // Normalizar CPF removendo caracteres não numéricos
          if (row.cpf) {
            row.cpf = (row.cpf || '').replace(/\D/g, '')
          }

          const parsed = EmployeeSchema.safeParse(row)

          if (parsed.success) {
            valid.push(parsed.data)
          } else {
            errors.push({
              line: index + 2, // +2 porque header é linha 1 e índice começa em 0
              errors: parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            })
          }
        })

        resolve({ valid, errors })
      },
      error: (error: Error) => {
        resolve({
          valid: [],
          errors: [{ line: 0, errors: [error.message] }]
        })
      }
    })
  })
}

/**
 * Geocoding em lote com rate limiting e retry exponencial
 */
export async function geocodeBatch(
  addresses: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, { lat: number; lng: number } | null>> {
  const results = new Map<string, { lat: number; lng: number } | null>()
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]
    let attempts = 0
    let coords = null

    // Retry exponencial: até 3 tentativas
    while (attempts < 3 && !coords) {
      try {
        coords = await geocodeAddress(address)
        if (!coords) {
          await delay(Math.pow(2, attempts) * 1000) // Exponential backoff: 1s, 2s, 4s
          attempts++
        }
      } catch (error) {
        console.warn(`Erro ao geocodificar endereço "${address}":`, error)
        await delay(Math.pow(2, attempts) * 1000)
        attempts++
      }
    }

    results.set(address, coords)
    onProgress?.(i + 1, addresses.length)

    // Rate limiting: ~8-10 req/s = ~120ms entre requisições
    if (i < addresses.length - 1) {
      await delay(120)
    }
  }

  return results
}

/**
 * Upsert transacional de funcionários
 */
export async function importEmployees(
  employees: EmployeeRow[],
  companyId: string,
  geocodedAddresses: Map<string, { lat: number; lng: number } | null>,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult> {
  let success = 0
  const errors: Array<{ employee: string; error: string }> = []
  const unresolvedAddresses: string[] = []

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]
    
    try {
      // 1. Criar usuário via API
      const userRes = await fetch('/api/operator/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emp.email,
          name: emp.nome,
          phone: emp.telefone,
          role: 'passenger'
        })
      })

      if (!userRes.ok) {
        const errorData = await userRes.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.error || 'Erro ao criar usuário')
      }

      const { userId } = await userRes.json()

      // 2. Obter coordenadas
      const coords = geocodedAddresses.get(emp.endereco)
      if (!coords) {
        unresolvedAddresses.push(emp.endereco)
      }

      // 3. Upsert em gf_employee_company (unique: company_id, cpf)
      const { error } = await supabase
        .from('gf_employee_company')
        .upsert({
          employee_id: userId,
          company_id: companyId,
          name: emp.nome,
          cpf: emp.cpf,
          email: emp.email,
          phone: emp.telefone || null,
          address: emp.endereco,
          latitude: coords?.lat || null,
          longitude: coords?.lng || null,
          is_active: true
        }, {
          onConflict: 'company_id,cpf'
        })

      if (error) throw error

      success++
    } catch (error: any) {
      errors.push({
        employee: emp.nome,
        error: error.message || 'Erro desconhecido'
      })
    }

    onProgress?.(i + 1, employees.length)
  }

  return { success, errors, unresolvedAddresses }
}
