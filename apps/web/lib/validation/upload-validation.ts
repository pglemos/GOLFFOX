/**
 * Validação de Uploads
 * 
 * Módulo para validar arquivos enviados para o sistema
 * Garante que apenas tipos de arquivo permitidos sejam aceitos
 */

import { z } from 'zod'

// ============================================
// Tipos de Arquivo Permitidos
// ============================================

export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
] as const

export const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
] as const

export const ALLOWED_VEHICLE_DOC_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
] as const

// ============================================
// Limites de Tamanho
// ============================================

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024 // 25MB
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB

// ============================================
// Schemas de Validação
// ============================================

/**
 * Schema base para validação de arquivo
 */
export const fileBaseSchema = z.object({
    name: z.string().min(1, 'Nome do arquivo é obrigatório'),
    type: z.string().min(1, 'Tipo do arquivo é obrigatório'),
    size: z.number().positive('Tamanho do arquivo inválido'),
})

/**
 * Schema para validação de imagem
 */
export const imageUploadSchema = fileBaseSchema.extend({
    type: z.enum(ALLOWED_IMAGE_TYPES, {
        errorMap: () => ({ message: 'Tipo de imagem não permitido. Use: JPEG, PNG, GIF, WebP ou SVG' })
    }),
    size: z.number().max(MAX_IMAGE_SIZE, `Imagem muito grande. Máximo: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`),
})

/**
 * Schema para validação de avatar
 */
export const avatarUploadSchema = fileBaseSchema.extend({
    type: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const, {
        errorMap: () => ({ message: 'Tipo de imagem não permitido para avatar. Use: JPEG, PNG ou WebP' })
    }),
    size: z.number().max(MAX_AVATAR_SIZE, `Avatar muito grande. Máximo: ${MAX_AVATAR_SIZE / 1024 / 1024}MB`),
})

/**
 * Schema para validação de documento
 */
export const documentUploadSchema = fileBaseSchema.extend({
    type: z.enum(ALLOWED_DOCUMENT_TYPES, {
        errorMap: () => ({ message: 'Tipo de documento não permitido. Use: PDF, Word, Excel, CSV ou TXT' })
    }),
    size: z.number().max(MAX_DOCUMENT_SIZE, `Documento muito grande. Máximo: ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB`),
})

/**
 * Schema para validação de documento de veículo (CNH, CRLV, etc.)
 */
export const vehicleDocumentSchema = fileBaseSchema.extend({
    type: z.enum(ALLOWED_VEHICLE_DOC_TYPES, {
        errorMap: () => ({ message: 'Tipo de arquivo não permitido para documentos de veículo. Use: PDF, JPEG ou PNG' })
    }),
    size: z.number().max(MAX_DOCUMENT_SIZE, `Documento muito grande. Máximo: ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB`),
})

// ============================================
// Funções de Validação
// ============================================

/**
 * Valida um arquivo de imagem
 */
export function validateImageUpload(file: { name: string; type: string; size: number }) {
    return imageUploadSchema.safeParse(file)
}

/**
 * Valida um arquivo de avatar
 */
export function validateAvatarUpload(file: { name: string; type: string; size: number }) {
    return avatarUploadSchema.safeParse(file)
}

/**
 * Valida um arquivo de documento
 */
export function validateDocumentUpload(file: { name: string; type: string; size: number }) {
    return documentUploadSchema.safeParse(file)
}

/**
 * Valida um arquivo de documento de veículo
 */
export function validateVehicleDocumentUpload(file: { name: string; type: string; size: number }) {
    return vehicleDocumentSchema.safeParse(file)
}

/**
 * Verifica se a extensão do arquivo corresponde ao tipo MIME declarado
 * Proteção contra manipulação de Content-Type
 */
export function validateFileExtension(filename: string, mimeType: string): boolean {
    const extension = filename.toLowerCase().split('.').pop()

    const mimeToExtension: Record<string, string[]> = {
        'image/jpeg': ['jpg', 'jpeg'],
        'image/png': ['png'],
        'image/gif': ['gif'],
        'image/webp': ['webp'],
        'image/svg+xml': ['svg'],
        'application/pdf': ['pdf'],
        'application/msword': ['doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
        'application/vnd.ms-excel': ['xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
        'text/csv': ['csv'],
        'text/plain': ['txt'],
    }

    const allowedExtensions = mimeToExtension[mimeType]

    if (!allowedExtensions) {
        return false
    }

    return extension ? allowedExtensions.includes(extension) : false
}

/**
 * Sanitiza o nome do arquivo para evitar path traversal e caracteres perigosos
 */
export function sanitizeFilename(filename: string): string {
    // Remove caracteres perigosos
    let sanitized = filename
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Remove caracteres especiais
        .replace(/\.{2,}/g, '.') // Remove múltiplos pontos
        .replace(/^[._-]+|[._-]+$/g, '') // Remove pontos/underscores no início e fim

    // Limita o tamanho
    if (sanitized.length > 255) {
        const ext = sanitized.split('.').pop() || ''
        const nameWithoutExt = sanitized.slice(0, 255 - ext.length - 1)
        sanitized = `${nameWithoutExt}.${ext}`
    }

    // Garante que não está vazio
    if (!sanitized || sanitized === '') {
        sanitized = `file_${Date.now()}`
    }

    return sanitized
}

/**
 * Gera nome único para o arquivo mantendo a extensão
 */
export function generateUniqueFilename(originalFilename: string): string {
    const sanitized = sanitizeFilename(originalFilename)
    const ext = sanitized.split('.').pop() || ''
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)

    return `${timestamp}_${random}.${ext}`
}

// ============================================
// Tipos Exportados
// ============================================

export type ImageUpload = z.infer<typeof imageUploadSchema>
export type AvatarUpload = z.infer<typeof avatarUploadSchema>
export type DocumentUpload = z.infer<typeof documentUploadSchema>
export type VehicleDocumentUpload = z.infer<typeof vehicleDocumentSchema>
