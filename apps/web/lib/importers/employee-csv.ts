import Papa from 'papaparse'
import { z } from 'zod'
import { geocodeAddress } from '@/lib/google-maps'
import { supabase } from '@/lib/supabase'

// Função para validar CPF
function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '')
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false // Todos os dígitos iguais

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleanCPF.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleanCPF.charAt(10))) return false

  return true
}

// Schema Zod para validação
const EmployeeSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').max(200, 'Nome muito longo'),
  cpf: z.string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 11, 'CPF deve ter 11 dígitos')
    .refine((val) => validateCPF(val), 'CPF inválido'),
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .max(255, 'Email muito longo'),
  telefone: z.string()
    .transform((val) => val ? val.replace(/\D/g, '') : '')
    .refine((val) => !val || val.length >= 10, 'Telefone deve ter ao menos 10 dígitos')
    .optional(),
  endereco: z.string()
    .min(5, 'Endereço deve ter ao menos 5 caracteres')
    .max(500, 'Endereço muito longo'),
  bairro: z.string().max(200, 'Bairro muito longo').optional(),
  cidade: z.string().max(200, 'Cidade muito longa').optional(),
  cep: z.string()
    .transform((val) => val ? val.replace(/\D/g, '') : '')
    .refine((val) => !val || val.length === 8, 'CEP deve ter 8 dígitos')
    .optional(),
  centro_custo: z.string().max(100, 'Centro de custo muito longo').optional(),
  turno: z.enum(['manha', 'tarde', 'noite', 'Manhã', 'Tarde', 'Noite', 'MANHA', 'TARDE', 'NOITE'] as const, {
    error: 'Turno deve ser: manhã, tarde ou noite'
  })
    .transform((val) => val.toLowerCase())
    .optional()
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
              errors: parsed.error.issues.map((e: { path: (string | number)[]; message: string }) => `${e.path.join('.')}: ${e.message}`)
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
 * Geocoding em lote com rate limiting, retry exponencial e cache
 */
export async function geocodeBatch(
  addresses: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, { lat: number; lng: number } | null>> {
  const results = new Map<string, { lat: number; lng: number } | null>()
  const cache = new Map<string, { lat: number; lng: number } | null>()
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Remover duplicatas mantendo ordem
  const uniqueAddresses = Array.from(new Set(addresses))

  for (let i = 0; i < uniqueAddresses.length; i++) {
    const address = uniqueAddresses[i]

    // Verificar cache primeiro
    if (cache.has(address)) {
      results.set(address, cache.get(address)!)
      onProgress?.(i + 1, uniqueAddresses.length)
      continue
    }

    let attempts = 0
    let coords: { lat: number; lng: number } | null = null
    const maxAttempts = 3

    // Retry exponencial: até 3 tentativas
    while (attempts < maxAttempts && !coords) {
      try {
        coords = await geocodeAddress(address)

        if (!coords && attempts < maxAttempts - 1) {
          // Aguardar antes de tentar novamente (exponential backoff)
          await delay(Math.pow(2, attempts) * 1000) // 1s, 2s, 4s
          attempts++
        } else {
          break
        }
      } catch (error: any) {
        console.warn(`Erro ao geocodificar endereço "${address}" (tentativa ${attempts + 1}/${maxAttempts}):`, error.message || error)

        if (attempts < maxAttempts - 1) {
          await delay(Math.pow(2, attempts) * 1000)
          attempts++
        } else {
          // Última tentativa falhou
          coords = null
          break
        }
      }
    }

    // Armazenar no cache e resultados
    cache.set(address, coords)
    results.set(address, coords)
    onProgress?.(i + 1, uniqueAddresses.length)

    // Rate limiting: ~8-10 req/s = ~120ms entre requisições
    // Google Maps permite até 50 req/s, mas usamos 8-10 para ser conservador
    if (i < uniqueAddresses.length - 1) {
      await delay(120)
    }
  }

  // Preencher resultados para endereços duplicados
  addresses.forEach(addr => {
    if (!results.has(addr)) {
      const cached = cache.get(addr)
      if (cached !== undefined) {
        results.set(addr, cached)
      }
    }
  })

  return results
}

/**
 * Upsert transacional de funcionários com validação e tratamento de duplicatas
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
  const processedEmails = new Set<string>()
  const processedCPFs = new Set<string>()

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]

    try {
      // Validação de duplicatas no mesmo lote
      if (processedEmails.has(emp.email)) {
        throw new Error(`Email duplicado no arquivo: ${emp.email}`)
      }
      if (processedCPFs.has(emp.cpf)) {
        throw new Error(`CPF duplicado no arquivo: ${emp.cpf}`)
      }

      // 1. Verificar se funcionário já existe (por CPF ou email)
      const { data: existingEmployee } = await supabase
        .from('gf_employee_company')
        .select('id, employee_id, email, cpf')
        .eq('company_id', companyId)
        .or(`cpf.eq.${emp.cpf},email.eq.${emp.email}`)
        .maybeSingle()

      let userId: string

      if (existingEmployee?.employee_id) {
        // Funcionário já existe, usar employee_id existente
        userId = existingEmployee.employee_id

        // Atualizar dados do usuário se necessário
        try {
          await supabase
            .from('users')
            .update({
              name: emp.nome,
              phone: emp.telefone || null,
            })
            .eq('id', userId)
        } catch (updateError) {
          // Ignorar erro de atualização, continuar com importação
          console.warn('Erro ao atualizar dados do usuário:', updateError)
        }
      } else {
        // Criar novo usuário via API
        const userRes = await fetch('/api/operador/create-employee', {
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
          throw new Error(errorData.error || `Erro ao criar usuário: ${userRes.status}`)
        }

        const userData = await userRes.json()
        userId = userData.userId

        if (!userId) {
          throw new Error('ID do usuário não retornado pela API')
        }
      }

      // 2. Obter coordenadas
      const coords = geocodedAddresses.get(emp.endereco)
      if (!coords) {
        unresolvedAddresses.push(emp.endereco)
      }

      // 3. Preparar dados completos do endereço
      let fullAddress = emp.endereco
      if (emp.bairro) fullAddress += `, ${emp.bairro}`
      if (emp.cidade) fullAddress += `, ${emp.cidade}`
      if (emp.cep) fullAddress += ` - CEP: ${emp.cep}`

      // 4. Upsert em gf_employee_company
      const employeeData: any = {
        employee_id: userId,
        company_id: companyId,
        name: emp.nome,
        cpf: emp.cpf,
        email: emp.email,
        phone: emp.telefone || null,
        address: fullAddress,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        is_active: true
      }

      // Adicionar campos opcionais se existirem na tabela
      if (emp.centro_custo) {
        employeeData.cost_center_id = emp.centro_custo
      }

      const { error: upsertError } = await supabase
        .from('gf_employee_company')
        .upsert(employeeData, {
          onConflict: 'company_id,cpf',
          ignoreDuplicates: false
        })

      if (upsertError) {
        // Se erro de constraint única, tentar update
        if (upsertError.code === '23505' || upsertError.message?.includes('duplicate')) {
          const { error: updateError } = await supabase
            .from('gf_employee_company')
            .update(employeeData)
            .eq('company_id', companyId)
            .eq('cpf', emp.cpf)

          if (updateError) {
            throw updateError
          }
        } else {
          throw upsertError
        }
      }

      // Marcar como processado
      processedEmails.add(emp.email)
      processedCPFs.add(emp.cpf)
      success++
    } catch (error: any) {
      errors.push({
        employee: emp.nome,
        error: error.message || 'Erro desconhecido'
      })
      console.error(`Erro ao importar funcionário ${emp.nome}:`, error)
    }

    onProgress?.(i + 1, employees.length)
  }

  return { success, errors, unresolvedAddresses }
}
