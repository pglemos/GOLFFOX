export interface BrazilianAddress {
  street?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  cep?: string
  complement?: string
}

export interface AddressValidationResult {
  isValid: boolean
  issues: string[]
  normalized?: BrazilianAddress
}

const CEP_REGEX = /^\d{5}-?\d{3}$/

export async function validateBrazilianAddress(addr: BrazilianAddress): Promise<AddressValidationResult> {
  const issues: string[] = []

  if (!addr.street) issues.push('Logradouro ausente')
  if (!addr.number) issues.push('Número ausente')
  if (!addr.neighborhood) issues.push('Bairro ausente')
  if (!addr.city) issues.push('Cidade ausente')
  if (!addr.state) issues.push('UF ausente')

  if (addr.cep) {
    if (!CEP_REGEX.test(addr.cep)) {
      issues.push('CEP em formato inválido')
    } else {
      try {
        const cepOnly = addr.cep.replace(/\D/g, '')
        const resp = await fetch(`https://viacep.com.br/ws/${cepOnly}/json/`)
        const data = await resp.json()
        if (data?.erro) {
          issues.push('CEP não encontrado na base oficial')
        } else {
          // Normalização básica
          addr = {
            ...addr,
            street: addr.street || data.logradouro || addr.street,
            neighborhood: addr.neighborhood || data.bairro || addr.neighborhood,
            city: addr.city || data.localidade || addr.city,
            state: addr.state || data.uf || addr.state,
            cep: `${data.cep}`,
          }
        }
      } catch (e) {
        issues.push('Falha ao consultar base de CEP')
      }
    }
  } else {
    issues.push('CEP ausente')
  }

  return {
    isValid: issues.length === 0,
    issues,
    normalized: addr,
  }
}

