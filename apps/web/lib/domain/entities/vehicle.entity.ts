/**
 * veiculo Entity
 * 
 * Entidade de domínio para veiculo
 */

export interface VehicleProps {
  id: string
  plate: string
  model: string
  brand?: string | null
  prefix?: string | null
  year?: number | null
  capacity?: number | null
  company_id?: string | null
  transportadora_id?: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export class veiculo {
  private constructor(private props: VehicleProps) {}

  static create(props: Omit<VehicleProps, 'id' | 'created_at' | 'updated_at'>): veiculo {
    // Validações de negócio
    if (!props.plate || props.plate.trim().length === 0) {
      throw new Error('Placa do veículo é obrigatória')
    }

    if (!props.model || props.model.trim().length === 0) {
      throw new Error('Modelo do veículo é obrigatório')
    }

    // Validar formato de placa (Brasil: ABC1234 ou ABC1D23)
    const plateRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i
    if (!plateRegex.test(props.plate.replace(/[^A-Z0-9]/gi, ''))) {
      // Aceitar mesmo se formato não perfeito (pode ser placa antiga)
      // Apenas logar warning
    }

    if (props.year && (props.year < 1900 || props.year > new Date().getFullYear() + 1)) {
      throw new Error('Ano do veículo inválido')
    }

    if (props.capacity && props.capacity < 1) {
      throw new Error('Capacidade do veículo deve ser maior que zero')
    }

    return new veiculo({
      ...props,
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
    })
  }

  static fromDatabase(props: VehicleProps): veiculo {
    return new veiculo(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get plate(): string {
    return this.props.plate
  }

  get model(): string {
    return this.props.model
  }

  get brand(): string | null {
    return this.props.brand || null
  }

  get year(): number | null {
    return this.props.year || null
  }

  get capacity(): number | null {
    return this.props.capacity || null
  }

  get companyId(): string | null {
    return this.props.company_id || null
  }

  get transportadoraId(): string | null {
    return this.props.transportadora_id || null
  }

  get isActive(): boolean {
    return this.props.is_active
  }

  // Métodos de negócio
  updatePlate(plate: string): void {
    if (!plate || plate.trim().length === 0) {
      throw new Error('Placa do veículo é obrigatória')
    }

    this.props.plate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '')
    this.props.updated_at = new Date()
  }

  assignToCompany(companyId: string): void {
    this.props.company_id = companyId
    this.props.updated_at = new Date()
  }

  assignToTransportadora(transportadoraId: string): void {
    this.props.transportadora_id = transportadoraId
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
  toDatabase(): VehicleProps {
    return { ...this.props }
  }

  // Serializar para API
  toJSON(): Omit<VehicleProps, 'created_at' | 'updated_at'> & {
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
