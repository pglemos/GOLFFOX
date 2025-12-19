/**
 * Company Entity
 * 
 * Entidade de domínio para Company
 * Contém lógica de negócio e validações
 */

export interface CompanyProps {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export class Company {
  private constructor(private props: CompanyProps) {}

  static create(props: Omit<CompanyProps, 'id' | 'created_at' | 'updated_at'>): Company {
    // Validações de negócio
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Nome da empresa é obrigatório')
    }

    if (props.name.length > 255) {
      throw new Error('Nome da empresa muito longo (máximo 255 caracteres)')
    }

    if (props.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.email)) {
      throw new Error('Email inválido')
    }

    return new Company({
      ...props,
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
    })
  }

  static fromDatabase(props: CompanyProps): Company {
    return new Company(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get email(): string | null {
    return this.props.email || null
  }

  get phone(): string | null {
    return this.props.phone || null
  }

  get isActive(): boolean {
    return this.props.is_active
  }

  get createdAt(): Date {
    return this.props.created_at
  }

  get updatedAt(): Date {
    return this.props.updated_at
  }

  // Métodos de negócio
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Nome da empresa é obrigatório')
    }

    if (name.length > 255) {
      throw new Error('Nome da empresa muito longo (máximo 255 caracteres)')
    }

    this.props.name = name
    this.props.updated_at = new Date()
  }

  updateEmail(email: string | null): void {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Email inválido')
    }

    this.props.email = email
    this.props.updated_at = new Date()
  }

  activate(): void {
    this.props.is_active = true
    this.props.updated_at = new Date()
  }

  deactivate(): void {
    this.props.is_active = false
    this.props.updated_at = new Date()
  }

  // Serializar para banco de dados
  toDatabase(): CompanyProps {
    return { ...this.props }
  }

  // Serializar para API
  toJSON(): Omit<CompanyProps, 'created_at' | 'updated_at'> & {
    created_at: string
    updated_at: string
  } {
    return {
      ...this.props,
      created_at: this.props.created_at.toISOString(),
      updated_at: this.props.updated_at.toISOString(),
    }
  }
}
