"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DocumentUploadProps {
  driverId?: string
  vehicleId?: string
  folder: 'driver-documents' | 'vehicle-documents' | 'medical-exams'
  documentType?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface DocumentData {
  document_type?: string
  file_url: string
  file_name: string
  file_size_bytes?: number
  issue_date?: string
  expiry_date?: string
  notes?: string
  document_number?: string
  value_brl?: number
  insurance_company?: string
  policy_number?: string
}

export function DocumentUpload({ 
  driverId, 
  vehicleId, 
  folder, 
  documentType,
  onSuccess,
  onError 
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    if (!selectedFile) {
      setFile(null)
      return
    }

    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Tipo de arquivo não permitido. Use PDF, JPG ou PNG')
      setFile(null)
      return
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError('Arquivo muito grande. Tamanho máximo: 10MB')
      setFile(null)
      return
    }

    setError(null)
    setFile(selectedFile)
    setSuccess(false)
  }

  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      if (driverId) {
        formData.append('driverId', driverId)
      }
      if (vehicleId) {
        formData.append('vehicleId', vehicleId)
      }

      const uploadRes = await fetch('/api/carrier/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json()
        throw new Error(errorData.error || 'Erro ao fazer upload')
      }

      const uploadData = await uploadRes.json()

      // Se for documento de motorista, salvar no banco
      if (driverId && folder === 'driver-documents' && documentType) {
        const docData: DocumentData = {
          document_type: documentType,
          file_url: uploadData.file_url,
          file_name: uploadData.file_name,
          file_size_bytes: uploadData.file_size_bytes
        }

        const docRes = await fetch(`/api/carrier/drivers/${driverId}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docData)
        })

        if (!docRes.ok) {
          const errorData = await docRes.json()
          throw new Error(errorData.error || 'Erro ao salvar documento')
        }
      }

      // Se for exame médico
      if (driverId && folder === 'medical-exams' && documentType) {
        const examRes = await fetch(`/api/carrier/drivers/${driverId}/exams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam_type: documentType,
            file_url: uploadData.file_url,
            file_name: uploadData.file_name,
            exam_date: new Date().toISOString().split('T')[0],
            expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 ano
          })
        })

        if (!examRes.ok) {
          const errorData = await examRes.json()
          throw new Error(errorData.error || 'Erro ao salvar exame')
        }
      }

      // Se for documento de veículo, salvar no banco
      if (vehicleId && folder === 'vehicle-documents' && documentType) {
        const docData: DocumentData = {
          document_type: documentType,
          file_url: uploadData.file_url,
          file_name: uploadData.file_name
        }

        const docRes = await fetch(`/api/carrier/vehicles/${vehicleId}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docData)
        })

        if (!docRes.ok) {
          const errorData = await docRes.json()
          throw new Error(errorData.error || 'Erro ao salvar documento')
        }
      }

      setSuccess(true)
      setFile(null)
      onSuccess?.()
      
      // Resetar sucesso após 3 segundos
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao fazer upload do arquivo'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file-upload">Upload de Arquivo</Label>
        <Input
          id="file-upload"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="mt-2"
          disabled={uploading}
        />
        <p className="text-xs text-[var(--ink-muted)] mt-1">
          Formatos aceitos: PDF, JPG, PNG. Tamanho máximo: 10MB
        </p>
      </div>

      {file && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]">
          <FileText className="h-4 w-4 text-[var(--brand)] flex-shrink-0" />
          <span className="text-sm flex-1 truncate">{file.name}</span>
          <span className="text-xs text-[var(--ink-muted)]">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setFile(null)}
            disabled={uploading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Arquivo enviado com sucesso!
          </AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={handleUpload} 
        disabled={!file || uploading}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        {uploading ? 'Enviando...' : 'Enviar Arquivo'}
      </Button>
    </div>
  )
}

