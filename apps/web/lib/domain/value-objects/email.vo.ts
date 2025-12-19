/**
 * Email Value Object
 * 
 * Value object para email com validação
 */

export class Email {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Email inválido')
    }
  }

  static create(email: string): Email {
    return new Email(email.toLowerCase().trim())
  }

  static fromString(email: string): Email | null {
    try {
      return new Email(email)
    } catch {
      return null
    }
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  getValue(): string {
    return this.value
  }

  toString(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  // Mascarar email para logs
  toMaskedString(): string {
    const [local, domain] = this.value.split('@')
    if (!local || !domain) return '***@***'
    
    const maskedLocal = local.length > 2 
      ? `${local.substring(0, 2)}***`
      : '***'
    
    return `${maskedLocal}@${domain}`
  }
}
