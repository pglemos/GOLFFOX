"use client"

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { notifyError, notifySuccess } from '@/lib/toast'

/**
 * Opções para o hook de upload de arquivos
 */
export interface UseFileUploadOptions {
    /** Nome do bucket no Supabase Storage */
    bucket: 'vehicle-documents' | 'driver-documents' | 'carrier-documents' | 'company-documents' | 'vehicle-photos' | 'avatars'
    /** Tamanho máximo em MB (padrão: 10) */
    maxSize?: number
    /** Tipos de arquivo permitidos (padrão: PDF e imagens) */
    allowedTypes?: string[]
    /** Pasta dentro do bucket */
    folder?: string
}

/**
 * Resultado de um upload bem sucedido
 */
export interface UploadResult {
    /** URL pública do arquivo */
    url: string
    /** Caminho do arquivo no storage */
    path: string
    /** Tamanho do arquivo em bytes */
    size: number
    /** Nome original do arquivo */
    name: string
    /** Tipo MIME do arquivo */
    type: string
}

/**
 * Estado e funções retornadas pelo hook
 */
export interface UseFileUploadReturn {
    /** Função para fazer upload de um arquivo */
    upload: (file: File, entityId: string, customFolder?: string) => Promise<UploadResult | null>
    /** Função para remover um arquivo */
    remove: (filePath: string) => Promise<boolean>
    /** Função para obter URL assinada (privada) */
    getSignedUrl: (filePath: string, expiresIn?: number) => Promise<string | null>
    /** Indica se está fazendo upload */
    uploading: boolean
    /** Progresso do upload (0-100) */
    progress: number
    /** Mensagem de erro se houver */
    error: string | null
    /** Limpa o estado de erro */
    clearError: () => void
}

// Tipos de arquivo permitidos por padrão
const DEFAULT_ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
]

// Tamanho máximo padrão em MB
const DEFAULT_MAX_SIZE = 10

/**
 * Hook para gerenciar upload de arquivos ao Supabase Storage
 * 
 * @example
 * ```tsx
 * const { upload, uploading, error } = useFileUpload({
 *   bucket: 'vehicle-documents',
 *   folder: 'crlv'
 * })
 * 
 * const handleUpload = async (file: File) => {
 *   const result = await upload(file, vehicleId)
 *   if (result) {
 *     console.log('URL:', result.url)
 *   }
 * }
 * ```
 */
export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
    const {
        bucket,
        maxSize = DEFAULT_MAX_SIZE,
        allowedTypes = DEFAULT_ALLOWED_TYPES,
        folder,
    } = options

    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    /**
     * Faz upload de um arquivo para o Supabase Storage
     */
    const upload = useCallback(async (
        file: File,
        entityId: string,
        customFolder?: string
    ): Promise<UploadResult | null> => {
        // Validar tamanho
        const maxSizeBytes = maxSize * 1024 * 1024
        if (file.size > maxSizeBytes) {
            const errorMsg = `Arquivo muito grande. Tamanho máximo: ${maxSize}MB`
            setError(errorMsg)
            notifyError(new Error(errorMsg), 'Erro de validação')
            return null
        }

        // Validar tipo
        if (!allowedTypes.includes(file.type)) {
            const errorMsg = 'Tipo de arquivo não permitido. Use PDF ou imagens (JPG, PNG, WebP).'
            setError(errorMsg)
            notifyError(new Error(errorMsg), 'Erro de validação')
            return null
        }

        setUploading(true)
        setProgress(0)
        setError(null)

        try {
            // Gerar nome único para o arquivo
            const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
            const timestamp = Date.now()
            const randomStr = Math.random().toString(36).substring(2, 8)
            const fileName = `${entityId}-${timestamp}-${randomStr}.${ext}`

            // Montar caminho completo
            const targetFolder = customFolder || folder
            const filePath = targetFolder ? `${targetFolder}/${fileName}` : fileName

            setProgress(10)

            // Fazer upload
            const { error: uploadError } = await (supabase as any).storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (uploadError) {
                throw uploadError
            }

            setProgress(80)

            // Obter URL pública
            const { data: urlData } = (supabase as any).storage
                .from(bucket)
                .getPublicUrl(filePath)

            setProgress(100)

            const result: UploadResult = {
                url: urlData.publicUrl,
                path: filePath,
                size: file.size,
                name: file.name,
                type: file.type,
            }

            notifySuccess('Arquivo enviado com sucesso!')

            return result
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Erro ao enviar arquivo'
            setError(errorMsg)
            notifyError(err, 'Erro ao enviar arquivo')
            return null
        } finally {
            setUploading(false)
        }
    }, [bucket, folder, maxSize, allowedTypes])

    /**
     * Remove um arquivo do Supabase Storage
     */
    const remove = useCallback(async (filePath: string): Promise<boolean> => {
        try {
            const { error: removeError } = await (supabase as any).storage
                .from(bucket)
                .remove([filePath])

            if (removeError) {
                throw removeError
            }

            notifySuccess('Arquivo removido com sucesso!')
            return true
        } catch (err) {
            notifyError(err, 'Erro ao remover arquivo')
            return false
        }
    }, [bucket])

    /**
     * Obtém uma URL assinada (para arquivos privados)
     */
    const getSignedUrl = useCallback(async (
        filePath: string,
        expiresIn: number = 3600
    ): Promise<string | null> => {
        try {
            const { data, error: signError } = await (supabase as any).storage
                .from(bucket)
                .createSignedUrl(filePath, expiresIn)

            if (signError) {
                throw signError
            }

            return data.signedUrl
        } catch (err) {
            console.error('Erro ao gerar URL assinada:', err)
            return null
        }
    }, [bucket])

    return {
        upload,
        remove,
        getSignedUrl,
        uploading,
        progress,
        error,
        clearError,
    }
}

/**
 * Utilitário para validar se um arquivo é uma imagem
 */
export function isImageFile(file: File | string): boolean {
    if (typeof file === 'string') {
        return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
    }
    return file.type.startsWith('image/')
}

/**
 * Utilitário para validar se um arquivo é PDF
 */
export function isPdfFile(file: File | string): boolean {
    if (typeof file === 'string') {
        return /\.pdf$/i.test(file)
    }
    return file.type === 'application/pdf'
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
