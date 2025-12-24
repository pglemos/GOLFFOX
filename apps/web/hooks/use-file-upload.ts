"use client"

import { useState, useCallback } from 'react'

import { formatUserErrorMessage, getErrorActionSuggestion } from '@/lib/error-messages'
import { logError } from '@/lib/logger'
import { safeAsync } from '@/lib/safe-async'
import { supabase } from '@/lib/supabase'
import { notifyError, notifySuccess } from '@/lib/toast'

/**
 * Opções para o hook de upload de arquivos
 */
export interface UseFileUploadOptions {
    /** Nome do bucket no Supabase Storage */
    bucket: 'documentos-veiculo' | 'documentos-motorista' | 'documentos-transportadora' | 'documentos-empresa' | 'fotos-veiculo' | 'avatares' | 'custos'
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
 *   bucket: 'documentos-veiculo',
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

        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', bucket)
        if (folder) formData.append('folder', folder)
        if (customFolder) formData.append('folder', customFolder)
        if (entityId) formData.append('entityId', entityId)

        // Usar safeAsync para upload com retry e timeout
        const result = await safeAsync(
            async () => {
                setProgress(10)

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                setProgress(50)

                if (!response.ok) {
                    let errorData: any = {}
                    try {
                        errorData = await response.json()
                    } catch {
                        // Se não conseguir fazer parse, usar mensagem padrão
                    }

                    const error = new Error(errorData.error || errorData.details || 'Erro ao enviar arquivo')
                    error.name = `HTTP${response.status}`
                    throw error
                }

                const result = await response.json()

                if (!result.success) {
                    throw new Error(result.error || 'Erro desconhecido no upload')
                }

                setProgress(100)
                return result
            },
            {
                timeout: 60000, // 60 segundos para uploads
                maxRetries: 2, // 2 tentativas adicionais
                initialDelay: 2000, // 2 segundos entre tentativas
                context: {
                    component: 'useFileUpload',
                    action: 'upload',
                    bucket,
                    fileName: file.name,
                    fileSize: file.size,
                },
            }
        )

        setUploading(false)

        if (!result.success) {
            const errorMsg = formatUserErrorMessage(result.error)
            const suggestion = getErrorActionSuggestion(result.error)

            setError(suggestion ? `${errorMsg}\n\n${suggestion}` : errorMsg)

            logError('Erro ao fazer upload de arquivo', {
                error: result.error?.message,
                stack: result.error?.stack,
                attempts: result.attempts,
                bucket,
                fileName: file.name,
            }, 'useFileUpload')

            notifyError(result.error, errorMsg)
            return null
        }

        notifySuccess('Arquivo enviado com sucesso!')

        return {
            url: result.data.url,
            path: result.data.path,
            size: result.data.size,
            name: result.data.name,
            type: result.data.type,
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
            logError('Erro ao gerar URL assinada', { error: err }, 'UseFileUpload')
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
