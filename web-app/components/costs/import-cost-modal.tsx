"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react"
import toast from "react-hot-toast"
import { parseCSV, validateCostRow } from "@/lib/costs/import-parser"

interface ImportCostModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  companyId: string
}

interface PreviewRow {
  date: string
  category: string
  subcategory?: string
  amount: number
  qty?: number
  unit?: string
  route_name?: string
  vehicle_plate?: string
  driver_email?: string
  notes?: string
  errors?: string[]
}

export function ImportCostModal({ isOpen, onClose, onSave, companyId }: ImportCostModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [errors, setErrors] = useState<Array<{ line: number; errors: string[] }>>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Apenas arquivos CSV são suportados')
      return
    }

    setFile(selectedFile)
    setPreview([])
    setErrors([])

    try {
      const text = await selectedFile.text()
      const parsed = await parseCSV(text)

      // Validar cada linha
      const validated: PreviewRow[] = []
      const validationErrors: Array<{ line: number; errors: string[] }> = []

      parsed.forEach((row, index) => {
        const validation = validateCostRow(row)
        if (validation.valid) {
          validated.push(row as PreviewRow)
        } else {
          validationErrors.push({
            line: index + 2, // +2 porque linha 1 é header
            errors: validation.errors
          })
        }
      })

      setPreview(validated.slice(0, 10)) // Preview das primeiras 10 linhas
      setErrors(validationErrors)

      if (validated.length === 0) {
        toast.error('Nenhuma linha válida encontrada no arquivo')
      } else {
        toast.success(`${validated.length} linhas válidas encontradas${validationErrors.length > 0 ? `, ${validationErrors.length} com erros` : ''}`)
      }
    } catch (error: any) {
      console.error('Erro ao processar arquivo:', error)
      toast.error(`Erro ao processar arquivo: ${error.message}`)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setImportProgress({ current: 0, total: preview.length })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('company_id', companyId)

      const res = await fetch('/api/costs/import', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao importar custos')
      }

      const result = await res.json()

      toast.success(
        `Importação concluída! ${result.imported} custos importados${result.errors > 0 ? `, ${result.errors} erros` : ''}`
      )

      onSave()
      onClose()
      reset()
    } catch (error: any) {
      console.error('Erro ao importar custos:', error)
      toast.error(error.message || 'Erro ao importar custos')
    } finally {
      setImporting(false)
      setImportProgress({ current: 0, total: 0 })
    }
  }

  const reset = () => {
    setFile(null)
    setPreview([])
    setErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    if (!importing) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-orange-500" />
            Importar Custos via CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={importing}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
              {file && (
                <span className="text-sm text-gray-600 truncate flex-1">{file.name}</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Formato esperado: data, categoria, subcategoria (opcional), valor, quantidade (opcional), 
              unidade (opcional), rota (opcional), veículo (opcional), motorista (opcional), observações (opcional)
            </p>
          </div>

          {/* Erros */}
          {errors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  Erros de Validação ({errors.length}):
                </span>
              </div>
              <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                {errors.slice(0, 10).map((err, i) => (
                  <li key={i}>
                    Linha {err.line}: {err.errors.join(', ')}
                  </li>
                ))}
                {errors.length > 10 && (
                  <li className="text-gray-500">... e mais {errors.length - 10} erros</li>
                )}
              </ul>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">
                  Preview ({preview.length} primeiras linhas válidas)
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="text-left p-1">Data</th>
                      <th className="text-left p-1">Categoria</th>
                      <th className="text-left p-1">Valor</th>
                      <th className="text-left p-1">Rota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="p-1">{row.date}</td>
                        <td className="p-1">{row.category}{row.subcategory ? ` - ${row.subcategory}` : ''}</td>
                        <td className="p-1">R$ {row.amount.toFixed(2)}</td>
                        <td className="p-1 text-gray-500">{row.route_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importando...</span>
                <span>{importProgress.current} / {importProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={importing}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || preview.length === 0 || importing}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {importing ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

