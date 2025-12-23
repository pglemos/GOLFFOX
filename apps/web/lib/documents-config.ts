/**
 * Configuração centralizada para gerenciamento de documentos
 * 
 * Define buckets, endpoints, tabelas e tipos de documentos para cada entidade
 */

import {
    TransportadoraDocumentType,
    MotoristaDocumentType,
    VeiculoDocumentType,
    TRANSPORTADORA_DOCUMENT_LABELS,
    MOTORISTA_DOCUMENT_LABELS,
    VEICULO_DOCUMENT_LABELS,
    REQUIRED_TRANSPORTADORA_DOCUMENTS,
    REQUIRED_MOTORISTA_DOCUMENTS,
    REQUIRED_VEICULO_DOCUMENTS,
    CARRIER_DOCS_WITH_EXPIRY,
    DRIVER_DOCS_WITH_EXPIRY,
    VEHICLE_DOCS_WITH_EXPIRY,
} from "@/types/documents"
import { Building2, User, FileText, Briefcase } from "lucide-react"

export type EntityType = "transportadora" | "motorista" | "veiculo" | "company"

// Tipos de documentos da empresa (definidos localmente no componente)
type CompanyDocumentType =
    | 'cnpj_card'
    | 'social_contract'
    | 'operating_license'
    | 'state_registration'
    | 'municipal_registration'
    | 'insurance_certificate'
    | 'environmental_license'
    | 'power_attorney'
    | 'other'

const COMPANY_DOCUMENT_LABELS: Record<CompanyDocumentType, string> = {
    cnpj_card: 'Cartão CNPJ',
    social_contract: 'Contrato Social',
    operating_license: 'Alvará de Funcionamento',
    state_registration: 'Inscrição Estadual',
    municipal_registration: 'Inscrição Municipal',
    insurance_certificate: 'Certificado de Seguro',
    environmental_license: 'Licença Ambiental',
    power_attorney: 'Procuração',
    other: 'Outro Documento',
}

const COMPANY_DOCS_WITH_EXPIRY: CompanyDocumentType[] = [
    'operating_license',
    'insurance_certificate',
    'environmental_license',
]

const REQUIRED_COMPANY_DOCUMENTS: CompanyDocumentType[] = [
    'cnpj_card',
    'social_contract',
]

export interface DocumentConfig {
    bucket: string
    endpoint: string
    table: string
    foreignKey: string
    paramName: string
    documentTypes: string[]
    documentLabels: Record<string, string>
    requiredDocuments: string[]
    docsWithExpiry: string[]
    placeholderIcon: React.ComponentType<{ className?: string }>
    placeholderMessage: string
    entityName: string
    entityNameSingular: string
}

export const DOCUMENTS_CONFIG: Record<EntityType, DocumentConfig> = {
    transportadora: {
        bucket: "documentos-transportadora",
        endpoint: "/api/admin/carriers",
        table: "gf_transportadora_documents",
        foreignKey: "transportadora_id",
        paramName: "carrierId",
        documentTypes: Object.keys(TRANSPORTADORA_DOCUMENT_LABELS) as TransportadoraDocumentType[],
        documentLabels: TRANSPORTADORA_DOCUMENT_LABELS as Record<string, string>,
        requiredDocuments: REQUIRED_TRANSPORTADORA_DOCUMENTS as string[],
        docsWithExpiry: CARRIER_DOCS_WITH_EXPIRY as string[],
        placeholderIcon: Building2,
        placeholderMessage: "Salve a transportadora primeiro para adicionar documentos",
        entityName: "Transportadora",
        entityNameSingular: "transportadora",
    },
    motorista: {
        bucket: "documentos-motorista",
        endpoint: "/api/admin/motoristas",
        table: "gf_motorista_documents",
        foreignKey: "motorista_id",
        paramName: "driverId",
        documentTypes: Object.keys(MOTORISTA_DOCUMENT_LABELS) as MotoristaDocumentType[],
        documentLabels: MOTORISTA_DOCUMENT_LABELS as Record<string, string>,
        requiredDocuments: REQUIRED_MOTORISTA_DOCUMENTS as string[],
        docsWithExpiry: DRIVER_DOCS_WITH_EXPIRY as string[],
        placeholderIcon: User,
        placeholderMessage: "Salve o motorista primeiro para adicionar documentos",
        entityName: "Motorista",
        entityNameSingular: "motorista",
    },
    veiculo: {
        bucket: "documentos-veiculo",
        endpoint: "/api/admin/veiculos",
        table: "gf_veiculo_documents",
        foreignKey: "veiculo_id",
        paramName: "vehicleId",
        documentTypes: Object.keys(VEICULO_DOCUMENT_LABELS) as VeiculoDocumentType[],
        documentLabels: VEICULO_DOCUMENT_LABELS as Record<string, string>,
        requiredDocuments: REQUIRED_VEICULO_DOCUMENTS as string[],
        docsWithExpiry: VEHICLE_DOCS_WITH_EXPIRY as string[],
        placeholderIcon: FileText,
        placeholderMessage: "Salve o veículo primeiro para adicionar documentos",
        entityName: "Veículo",
        entityNameSingular: "veículo",
    },
    company: {
        bucket: "documentos-empresa",
        endpoint: "/api/admin/empresas",
        table: "gf_company_documents",
        foreignKey: "company_id",
        paramName: "companyId",
        documentTypes: Object.keys(COMPANY_DOCUMENT_LABELS) as CompanyDocumentType[],
        documentLabels: COMPANY_DOCUMENT_LABELS as Record<string, string>,
        requiredDocuments: REQUIRED_COMPANY_DOCUMENTS as string[],
        docsWithExpiry: COMPANY_DOCS_WITH_EXPIRY as string[],
        placeholderIcon: Briefcase,
        placeholderMessage: "Salve a empresa primeiro para adicionar documentos",
        entityName: "Empresa",
        entityNameSingular: "empresa",
    },
}

/**
 * Obtém configuração de documentos para uma entidade
 */
export function getDocumentsConfig(entityType: EntityType): DocumentConfig {
    return DOCUMENTS_CONFIG[entityType]
}

/**
 * Filtra tipos de documentos excluindo tipos especiais (ex: legal_rep_cnh)
 */
export function getFilteredDocumentTypes(entityType: EntityType): string[] {
    const config = getDocumentsConfig(entityType)

    // Para transportadora, excluir legal_rep_cnh (gerenciado separadamente)
    if (entityType === "transportadora") {
        return config.documentTypes.filter(t => t !== 'legal_rep_cnh')
    }

    return config.documentTypes
}

