"use client"

import { useCallback, useState, useEffect } from "react"
import { Upload, X, FileText, Image as ImageIcon, Loader2, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isImageFile, isPdfFile, formatFileSize } from "@/hooks/use-file-upload"

/**
 * Props do componente FileUpload
 */
export interface FileUploadProps {
    /** Função chamada quando um arquivo é selecionado para upload */
    onUpload: (file: File) => Promise<string | null>
    /** Função chamada quando o arquivo é removido */
    onRemove?: () => void
    /** Modo manual (não faz upload automático) */
    manual?: boolean
    /** Função chamada quando um arquivo é selecionado (modo manual) */
    onFileSelect?: (file: File) => void
    /** URL atual do arquivo (para modo de edição) */
    currentUrl?: string | null
    /** Nome do arquivo atual */
    currentFileName?: string | null
    /** Tipos de arquivo aceitos (formato MIME) */
    accept?: Record<string, string[]>
    /** Tamanho máximo em MB */
    maxSize?: number
    /** Label exibida no dropzone */
    label?: string
    /** Desabilita o componente */
    disabled?: boolean
    /** Exibe preview do arquivo */
    showPreview?: boolean
    /** Exibe botão de download */
    showDownload?: boolean
    /** Classe CSS adicional */
    className?: string
}

/**
 * Componente de upload de arquivos com drag & drop
 */
export function FileUpload({
    onUpload,
    onRemove,
    manual = false,
    onFileSelect,
    currentUrl,
    currentFileName,
    accept = {
        'application/pdf': ['.pdf'],
        'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    },
    maxSize = 10,
    label = "Arraste ou clique para enviar",
    disabled = false,
    showPreview = true,
    showDownload = true,
    className,
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string | null>(null)
    const [isDragActive, setIsDragActive] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Sincronizar com URL externa
    useEffect(() => {
        setPreview(currentUrl || null)
        setFileName(currentFileName || null)
    }, [currentUrl, currentFileName])

    const validateFile = useCallback((file: File): boolean => {
        // Validar tamanho
        if (file.size > maxSize * 1024 * 1024) {
            setError(`Arquivo muito grande. Máximo: ${maxSize}MB`)
            return false
        }

        // Validar tipo
        const allowedTypes = Object.keys(accept).flatMap(type => {
            if (type.includes('*')) {
                return type.split('/')[0]
            }
            return type
        })

        const fileType = file.type.split('/')[0]
        const isAllowed = allowedTypes.some(allowed =>
            file.type === allowed ||
            fileType === allowed.split('/')[0] ||
            allowed.includes('*')
        )

        if (!isAllowed) {
            setError('Tipo de arquivo não permitido')
            return false
        }

        setError(null)
        return true
    }, [accept, maxSize])

    const handleFile = useCallback(async (file: File) => {
        if (!validateFile(file)) return

        setError(null)

        // Preview local
        if (showPreview) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    setPreview(e.target?.result as string)
                }
                reader.readAsDataURL(file)
            } else {
                setPreview(null) // Para PDFs e outros, o renderPreview lida com fileName
            }
        }

        setFileName(file.name)

        if (manual) {
            if (onFileSelect) onFileSelect(file)
            return
        }

        if (!onUpload) return

        setUploading(true)

        try {
            const url = await onUpload(file)
            if (url) {
                setPreview(url)
            } else {
                // Upload falhou, limpar preview
                if (!currentUrl) {
                    setPreview(null)
                    setFileName(null)
                }
            }
        } catch (err) {
            console.error('Erro no upload:', err)
            setError('Erro ao enviar arquivo')
            if (!currentUrl) {
                setPreview(null)
                setFileName(null)
            }
        } finally {
            setUploading(false)
        }
    }, [onUpload, validateFile, showPreview, currentUrl, manual, onFileSelect])

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(false)

        if (disabled || uploading) return

        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFile(files[0])
        }
    }, [disabled, uploading, handleFile])

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled && !uploading) {
            setIsDragActive(true)
        }
    }, [disabled, uploading])

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(false)
    }, [])

    const handleClick = useCallback(() => {
        if (disabled || uploading) return

        const input = document.createElement('input')
        input.type = 'file'
        input.accept = Object.entries(accept)
            .flatMap(([type, exts]) => [type, ...exts])
            .join(',')

        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                handleFile(file)
            }
        }

        input.click()
    }, [disabled, uploading, accept, handleFile])

    const handleRemove = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setPreview(null)
        setFileName(null)
        setError(null)
        onRemove?.()
    }, [onRemove])

    const handleDownload = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (preview) {
            window.open(preview, '_blank')
        }
    }, [preview])

    const renderPreview = () => {
        if (!preview && !fileName) return null

        if (preview && isImageFile(preview)) {
            return (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="max-h-32 max-w-full mx-auto rounded-lg object-contain"
                    />
                </div>
            )
        }

        if ((preview && isPdfFile(preview)) || isPdfFile(fileName || '')) {
            return (
                <div className="flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12 text-red-500" />
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {fileName || 'documento.pdf'}
                    </span>
                </div>
            )
        }

        return (
            <div className="flex flex-col items-center gap-2">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {fileName || 'arquivo'}
                </span>
            </div>
        )
    }

    return (
        <div className={cn("space-y-2", className)}>
            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
                    isDragActive && "border-primary bg-primary/5 scale-[1.02]",
                    disabled && "opacity-50 cursor-not-allowed",
                    error && "border-destructive bg-destructive/5",
                    !preview && !isDragActive && !error && "hover:border-primary hover:bg-primary/5",
                    preview && "border-solid border-muted"
                )}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Enviando...</span>
                    </div>
                ) : (preview || fileName) && showPreview ? (
                    <div className="relative py-2">
                        {renderPreview()}

                        {/* Botões de ação */}
                        <div className="absolute -top-2 -right-2 flex gap-1">
                            {showDownload && preview && (
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-7 w-7 rounded-full shadow-md"
                                    onClick={handleDownload}
                                    title="Visualizar"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                </Button>
                            )}
                            {onRemove && (
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-7 w-7 rounded-full shadow-md"
                                    onClick={handleRemove}
                                    title="Remover"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                        <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center",
                            isDragActive ? "bg-primary/20" : "bg-muted"
                        )}>
                            <Upload className={cn(
                                "h-6 w-6",
                                isDragActive ? "text-primary" : "text-muted-foreground"
                            )} />
                        </div>
                        <div className="space-y-1">
                            <span className={cn(
                                "text-sm font-medium",
                                isDragActive ? "text-primary" : "text-muted-foreground"
                            )}>
                                {label}
                            </span>
                            <p className="text-xs text-muted-foreground">
                                PDF ou imagens • Máx: {maxSize}MB
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Mensagem de erro */}
            {error && (
                <p className="text-xs text-destructive">{error}</p>
            )}
        </div>
    )
}

export default FileUpload
