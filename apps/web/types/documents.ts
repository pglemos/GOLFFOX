/**
 * Types para documentos e anexos do sistema GolfFox
 * Usado em veículos, motoristas e transportadoras
 */

// ====================================================
// DOCUMENT TYPES
// ====================================================

export type VehicleDocumentType =
    | 'crlv'                    // CRLV do Ano
    | 'antt_license'            // Licença ANTT
    | 'inmetro_certificate'     // Certificado Inmetro
    | 'cadastur_certificate'    // Certificado Cadastur
    | 'art'                     // ART - Anotação de Responsabilidade Técnica
    | 'maintenance_report'      // Relatório Técnico de Manutenção
    | 'insurance'               // Seguro RCTR-C
    | 'inspection_certificate'  // Certificado de Inspeção Veicular
    | 'licensing'               // Licenciamento Anual
    | 'tachograph_certificate'  // Certificado de Aferição do Tacógrafo
    | 'vehicle_photo_front'     // Foto Frontal do Veículo
    | 'vehicle_photo_side'      // Foto Lateral do Veículo
    | 'vehicle_photo_rear'      // Foto Traseira do Veículo

export type DriverDocumentType =
    | 'cnh'                     // CNH
    | 'residencia'              // Comprovante de Endereço
    | 'toxico'                  // Exame Toxicológico
    | 'certificado_transporte'  // Certificado Curso Transporte
    | 'atestado_medico'         // Atestado Médico de Aptidão
    | 'antecedentes'            // Certidão de Antecedentes Criminais
    | 'rg'                      // RG
    | 'foto_3x4'                // Foto 3x4
    | 'selfie'                  // Selfie
    | 'outros'                  // Outros

export type CarrierDocumentType =
    | 'service_contract'        // Contrato de Prestação de Serviços
    | 'cnpj_card'               // Cartão CNPJ
    | 'social_contract'         // Contrato Social da Empresa
    | 'art_certificate'         // Certificado ART (Registro de Fretamento)
    | 'insurance_certificate'   // Certificado de Seguros
    | 'operating_license'       // Alvará de Funcionamento
    | 'cnd'                     // CND - Certidão Negativa de Débitos
    | 'fgts_certificate'        // Certificado de Regularidade FGTS (CRF)
    | 'cndt'                    // CNDT - Certidão Negativa Débitos Trabalhistas
    | 'antt_registration'       // Registro ANTT
    | 'environmental_license'   // Licença Ambiental
    | 'legal_rep_cnh'           // CNH do Representante Legal

export type DocumentStatus = 'valid' | 'expired' | 'pending' | 'rejected'

export type AlertLevel = 'ok' | 'warning' | 'critical' | 'expired'

// ====================================================
// LABELS EM PORTUGUÊS
// ====================================================

export const VEHICLE_DOCUMENT_LABELS: Record<VehicleDocumentType, string> = {
    crlv: 'CRLV do Ano',
    antt_license: 'Licença ANTT',
    inmetro_certificate: 'Certificado Inmetro',
    cadastur_certificate: 'Certificado Cadastur',
    art: 'ART - Anotação de Responsabilidade Técnica',
    maintenance_report: 'Relatório Técnico de Manutenção',
    insurance: 'Seguro RCTR-C',
    inspection_certificate: 'Certificado de Inspeção Veicular',
    licensing: 'Licenciamento Anual',
    tachograph_certificate: 'Certificado Aferição Tacógrafo',
    vehicle_photo_front: 'Foto Frontal do Veículo',
    vehicle_photo_side: 'Foto Lateral do Veículo',
    vehicle_photo_rear: 'Foto Traseira do Veículo',
}

export const DRIVER_DOCUMENT_LABELS: Record<DriverDocumentType, string> = {
    cnh: 'CNH',
    residencia: 'Comprovante de Endereço',
    toxico: 'Exame Toxicológico',
    certificado_transporte: 'Certificado Curso Transporte',
    atestado_medico: 'Atestado Médico de Aptidão',
    antecedentes: 'Certidão de Antecedentes Criminais',
    rg: 'RG',
    foto_3x4: 'Foto 3x4',
    selfie: 'Selfie',
    outros: 'Outros',
}

export const CARRIER_DOCUMENT_LABELS: Record<CarrierDocumentType, string> = {
    service_contract: 'Contrato de Prestação de Serviços',
    cnpj_card: 'Cartão CNPJ',
    social_contract: 'Contrato Social da Empresa',
    art_certificate: 'Certificado ART (Registro de Fretamento)',
    insurance_certificate: 'Certificado de Seguros',
    operating_license: 'Alvará de Funcionamento',
    cnd: 'CND - Certidão Negativa de Débitos',
    fgts_certificate: 'Certificado de Regularidade FGTS (CRF)',
    cndt: 'CNDT - Certidão Negativa Débitos Trabalhistas',
    antt_registration: 'Registro ANTT',
    environmental_license: 'Licença Ambiental',
    legal_rep_cnh: 'CNH do Representante Legal',
}

export const STATUS_LABELS: Record<DocumentStatus, string> = {
    valid: 'Válido',
    expired: 'Vencido',
    pending: 'Pendente',
    rejected: 'Rejeitado',
}

export const ALERT_LEVEL_LABELS: Record<AlertLevel, string> = {
    ok: 'OK',
    warning: 'Atenção',
    critical: 'Crítico',
    expired: 'Vencido',
}

// ====================================================
// INTERFACES
// ====================================================

export interface BaseDocument {
    id: string
    document_type: string
    document_number?: string | null
    expiry_date?: string | null
    issue_date?: string | null
    file_url?: string | null
    file_name?: string | null
    file_size?: number | null
    file_type?: string | null
    status: DocumentStatus
    notes?: string | null
    uploaded_by?: string | null
    created_at: string
    updated_at: string
}

export interface VehicleDocument extends BaseDocument {
    vehicle_id: string
    document_type: VehicleDocumentType
}

export interface DriverDocument extends BaseDocument {
    driver_id: string
    document_type: DriverDocumentType
    is_valid?: boolean
    expires_at?: string | null // Campo legado
}

export interface CarrierDocument extends BaseDocument {
    carrier_id: string
    document_type: CarrierDocumentType
}

// ====================================================
// DRIVER COMPENSATION
// ====================================================

export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly'
export type ContractType = 'clt' | 'pj' | 'autonomo' | 'temporario'

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
    weekly: 'Semanal',
    biweekly: 'Quinzenal',
    monthly: 'Mensal',
}

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
    clt: 'CLT',
    pj: 'PJ (Pessoa Jurídica)',
    autonomo: 'Autônomo',
    temporario: 'Temporário',
}

export interface DriverCompensation {
    id: string
    driver_id: string
    // Salary
    base_salary?: number | null
    currency: string
    payment_frequency: PaymentFrequency
    contract_type: ContractType
    // Benefits
    has_meal_allowance: boolean
    meal_allowance_value?: number | null
    has_transport_allowance: boolean
    transport_allowance_value?: number | null
    has_health_insurance: boolean
    health_insurance_value?: number | null
    has_dental_insurance: boolean
    dental_insurance_value?: number | null
    has_life_insurance: boolean
    life_insurance_value?: number | null
    has_fuel_card: boolean
    fuel_card_limit?: number | null
    other_benefits?: string | null
    // Dates
    start_date?: string | null
    end_date?: string | null
    notes?: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface DriverCompensationFormData {
    base_salary?: number
    payment_frequency: PaymentFrequency
    contract_type: ContractType
    has_meal_allowance: boolean
    meal_allowance_value?: number
    has_transport_allowance: boolean
    transport_allowance_value?: number
    has_health_insurance: boolean
    health_insurance_value?: number
    has_dental_insurance: boolean
    dental_insurance_value?: number
    has_life_insurance: boolean
    life_insurance_value?: number
    has_fuel_card: boolean
    fuel_card_limit?: number
    other_benefits?: string
    start_date?: string
    end_date?: string
    notes?: string
}

// ====================================================
// CARRIER BANKING & LEGAL REP
// ====================================================

export type BankAccountType = 'corrente' | 'poupanca'
export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'

export const BANK_ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
    corrente: 'Conta Corrente',
    poupanca: 'Conta Poupança',
}

export const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    email: 'E-mail',
    telefone: 'Telefone',
    aleatoria: 'Chave Aleatória',
}

export interface CarrierBankingData {
    bank_name?: string | null
    bank_code?: string | null
    bank_agency?: string | null
    bank_account?: string | null
    bank_account_type?: BankAccountType | null
    pix_key?: string | null
    pix_key_type?: PixKeyType | null
}

export interface CarrierLegalRepData {
    legal_rep_name?: string | null
    legal_rep_cpf?: string | null
    legal_rep_rg?: string | null
    legal_rep_email?: string | null
    legal_rep_phone?: string | null
}

// ====================================================
// EXPIRING DOCUMENTS VIEW
// ====================================================

export interface ExpiringDocument {
    entity_type: 'vehicle' | 'driver' | 'carrier'
    entity_id: string
    entity_name: string
    document_type: string
    expiry_date: string
    file_url?: string | null
    status: DocumentStatus
    alert_level: AlertLevel
    company_id?: string | null
    transportadora_id?: string | null
}

// ====================================================
// CONSTANTS FOR REQUIRED DOCUMENTS
// ====================================================

export const REQUIRED_VEHICLE_DOCUMENTS: VehicleDocumentType[] = [
    'crlv',
    'antt_license',
]

export const REQUIRED_DRIVER_DOCUMENTS: DriverDocumentType[] = [
    'cnh',
    'residencia',
    'toxico',
]

export const REQUIRED_CARRIER_DOCUMENTS: CarrierDocumentType[] = [
    'cnpj_card',
    'social_contract',
]

// ====================================================
// DOCUMENTS WITH EXPIRY DATE
// ====================================================

export const VEHICLE_DOCS_WITH_EXPIRY: VehicleDocumentType[] = [
    'crlv',
    'antt_license',
    'inmetro_certificate',
    'cadastur_certificate',
    'art',
    'insurance',
    'inspection_certificate',
    'licensing',
    'tachograph_certificate',
]

export const DRIVER_DOCS_WITH_EXPIRY: DriverDocumentType[] = [
    'cnh',
    'toxico',
    'certificado_transporte',
    'atestado_medico',
    'antecedentes',
]

export const CARRIER_DOCS_WITH_EXPIRY: CarrierDocumentType[] = [
    'service_contract',
    'art_certificate',
    'insurance_certificate',
    'operating_license',
    'cnd',
    'fgts_certificate',
    'cndt',
    'antt_registration',
    'environmental_license',
    'legal_rep_cnh',
]
