/**
 * UUID Value Object
 * 
 * Value object para UUID com validação
 */

export class UUID {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('UUID inválido')
    }
  }

  static create(uuid: string): UUID {
    return new UUID(uuid)
  }

  static generate(): UUID {
    return new UUID(crypto.randomUUID())
  }

  static fromString(uuid: string): UUID | null {
    try {
      return new UUID(uuid)
    } catch {
      return null
    }
  }

  private isValid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  getValue(): string {
    return this.value
  }

  toString(): string {
    return this.value
  }

  equals(other: UUID): boolean {
    return this.value === other.value
  }
}
