/**
 * Lógica de negócio para validação de custos
 * Extrai validações de custos dos componentes para facilitar testes e reutilização
 */

/**
 * Validar valor de custo
 */
export function validateCostAmount(amount: string | number): {
  isValid: boolean
  error?: string
  numericValue?: number
} {
  if (typeof amount === 'string') {
    // Remover caracteres não numéricos exceto vírgula e ponto
    const cleaned = amount.replace(/[^\d,\.]/g, '')
    
    if (!cleaned) {
      return {
        isValid: false,
        error: 'Valor é obrigatório',
      }
    }

    // Converter vírgula para ponto
    const normalized = cleaned.replace(',', '.')
    const numericValue = parseFloat(normalized)

    if (isNaN(numericValue) || numericValue <= 0) {
      return {
        isValid: false,
        error: 'Valor deve ser maior que zero',
      }
    }

    return {
      isValid: true,
      numericValue,
    }
  }

  // Se já é número
  if (typeof amount === 'number') {
    if (isNaN(amount) || amount <= 0) {
      return {
        isValid: false,
        error: 'Valor deve ser maior que zero',
      }
    }

    return {
      isValid: true,
      numericValue: amount,
    }
  }

  return {
    isValid: false,
    error: 'Valor inválido',
  }
}

/**
 * Validar data de custo
 */
export function validateCostDate(date: Date | string | null | undefined): {
  isValid: boolean
  error?: string
  isoDate?: string
} {
  if (!date) {
    return {
      isValid: false,
      error: 'Data é obrigatória',
    }
  }

  let dateObj: Date

  if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }

  if (isNaN(dateObj.getTime())) {
    return {
      isValid: false,
      error: 'Data inválida',
    }
  }

  // Verificar se a data não é muito no futuro (ex: mais de 1 ano)
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 1)

  if (dateObj > maxDate) {
    return {
      isValid: false,
      error: 'Data não pode ser mais de 1 ano no futuro',
    }
  }

  // Verificar se a data não é muito no passado (ex: mais de 10 anos)
  const minDate = new Date()
  minDate.setFullYear(minDate.getFullYear() - 10)

  if (dateObj < minDate) {
    return {
      isValid: false,
      error: 'Data não pode ser mais de 10 anos no passado',
    }
  }

  // Converter para ISO string (YYYY-MM-DD)
  const isoDate = dateObj.toISOString().split('T')[0]

  return {
    isValid: true,
    isoDate,
  }
}

/**
 * Validar categoria de custo
 */
export function validateCostCategory(
  categoryId: string | null | undefined,
  required: boolean = false
): {
  isValid: boolean
  error?: string
} {
  if (required && (!categoryId || categoryId.trim() === '')) {
    return {
      isValid: false,
      error: 'Categoria é obrigatória',
    }
  }

  return {
    isValid: true,
  }
}

/**
 * Validar descrição de custo
 */
export function validateCostDescription(description: string): {
  isValid: boolean
  error?: string
} {
  if (!description || description.trim().length === 0) {
    return {
      isValid: false,
      error: 'Descrição é obrigatória',
    }
  }

  if (description.trim().length < 3) {
    return {
      isValid: false,
      error: 'Descrição deve ter pelo menos 3 caracteres',
    }
  }

  if (description.length > 500) {
    return {
      isValid: false,
      error: 'Descrição deve ter no máximo 500 caracteres',
    }
  }

  return {
    isValid: true,
  }
}

/**
 * Validar intervalo de recorrência
 */
export function validateRecurringInterval(
  isRecurring: boolean,
  interval: string | undefined | null
): {
  isValid: boolean
  error?: string
} {
  if (!isRecurring) {
    return {
      isValid: true,
    }
  }

  const validIntervals = ['daily', 'weekly', 'monthly', 'yearly']

  if (!interval || !validIntervals.includes(interval)) {
    return {
      isValid: false,
      error: 'Intervalo de recorrência inválido',
    }
  }

  return {
    isValid: true,
  }
}

