/**
 * Utility functions for formatting input fields in real-time
 */

/**
 * Formats a CPF string to XXX.XXX.XXX-XX pattern
 */
export function formatCPF(value: string): string {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '')

    // Limit to 11 digits
    const limited = numbers.slice(0, 11)

    // Apply formatting
    if (limited.length <= 3) {
        return limited
    } else if (limited.length <= 6) {
        return `${limited.slice(0, 3)}.${limited.slice(3)}`
    } else if (limited.length <= 9) {
        return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
    } else {
        return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
    }
}

/**
 * Formats a phone string to (XX) XXXXX-XXXX pattern
 */
export function formatPhone(value: string): string {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '')

    // Limit to 11 digits
    const limited = numbers.slice(0, 11)

    // Apply formatting
    if (limited.length <= 2) {
        return limited
    } else if (limited.length <= 7) {
        return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
    } else {
        return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
    }
}

/**
 * Formats a CEP string to XXXXX-XXX pattern
 */
export function formatCEP(value: string): string {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '')

    // Limit to 8 digits
    const limited = numbers.slice(0, 8)

    // Apply formatting
    if (limited.length <= 5) {
        return limited
    } else {
        return `${limited.slice(0, 5)}-${limited.slice(5)}`
    }
}

/**
 * Removes all formatting from a string, keeping only digits
 */
export function unformatNumber(value: string): string {
    return value.replace(/\D/g, '')
}

/**
 * Validates if a CPF is in the correct format (XXX.XXX.XXX-XX)
 */
export function isValidCPFFormat(cpf: string): boolean {
    const pattern = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
    return pattern.test(cpf)
}

/**
 * Validates if a phone is in the correct format ((XX) XXXXX-XXXX)
 */
export function isValidPhoneFormat(phone: string): boolean {
    const pattern = /^\(\d{2}\) \d{5}-\d{4}$/
    return pattern.test(phone)
}

/**
 * Validates if a CEP is in the correct format (XXXXX-XXX)
 */
export function isValidCEPFormat(cep: string): boolean {
    const pattern = /^\d{5}-\d{3}$/
    return pattern.test(cep)
}
