"use client"

import { useState, useRef } from "react"

import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { parseCSV, validateCostRow } from "@/lib/costs/import-parser"
import { notifySuccess, notifyError } from "@/lib/toast"
import { logError } from "@/lib/logger"

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
      notifyError('', undefined, { i18n: { ns: 'common', key: 'validation.csvOnly' } })
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
        notifyError('')
      } else {
        notifySuccess('', {
          i18n: {
            ns: 'common',
            key: 'success.validRowsFound',
            params: {
              valid: validated.length,
              errorsCount: validationErrors.length > 0 ? `, ${validationErrors.length} com erros` : ''
            }
          }
        })
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      logError('Erro ao processar arquivo', { error }, 'ImportCostModal')
      notifyError('', undefined, { i18n: { ns: 'common', key: 'errors.processFile', params: { message: err?.message || 'Erro desconhecido' } } })
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

      notifySuccess('', {
        i18n: {
          ns: 'common',
          key: 'success.importCosts',
          params: {
            imported: result.imported,
            errorsSuffix: result.errors > 0 ? `, ${result.errors} erros` : ''
          }
        }
      })

      onSave()
      onClose()
      reset()
    } catch (error: unknown) {
      const err = error as { message?: string }
      logError('Erro ao importar custos', { error }, 'ImportCostModal')
      notifyError('', undefined, {
        i18n: {
          ns: 'common',
          key: 'errors.importCosts',
          params: { message: error?.message || 'Erro desconhecido' }
        }
      })
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
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <Upload className="h-5 w-5 text-brand flex-shrink-0" />
            Importar Custos via CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
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
                <span className="text-sm text-ink-muted truncate flex-1">{file.name}</span>
              )}
            </div>
            <p className="text-xs text-ink-muted">
              Formato esperado: data, categoria, subcategoria (opcional), valor, quantidade (opcional), 
              unidade (opcional), rota (opcional), veículo (opcional), motorista (opcional), observações (opcional)
            </p>
          </div>

          {/* Erros */}
          {errors.length > 0 && (
            <div className="p-3 rounded-lg bg-error-light border border-error-light">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-error" />
                <span className="text-sm font-medium text-error">
                  Erros de Validação ({errors.length}):
                </span>
              </div>
              <ul className="text-xs text-error space-y-1 max-h-32 overflow-y-auto">
                {errors.slice(0, 10).map((err, i) => (
                  <li key={i}>
                    Linha {err.line}: {err.errors.join(', ')}
                  </li>
                ))}
                {errors.length > 10 && (
                  <li className="text-ink-muted">... e mais {errors.length - 10} erros</li>
                )}
              </ul>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="border border-border-light rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">
                  Preview ({preview.length} primeiras linhas válidas)
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-bg-soft">
                    <tr>
                      <th className="text-left p-1">Data</th>
                      <th className="text-left p-1">Categoria</th>
                      <th className="text-left p-1">Valor</th>
                      <th className="text-left p-1">Rota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-border-light">
                        <td className="p-1">{row.date}</td>
                        <td className="p-1">{row.category}{row.subcategory ? ` - ${row.subcategory}` : ''}</td>
                        <td className="p-1">R$ {row.amount.toFixed(2)}</td>
                        <td className="p-1 text-ink-muted">{row.route_name || '-'}</td>
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
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-brand h-2 rounded-full transition-all"
                  style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose} 
            disabled={importing}
            className="w-full sm:w-auto order-2 sm:order-1 text-base font-medium"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || preview.length === 0 || importing}
            className="bg-brand hover:bg-brand-hover w-full sm:w-auto order-1 sm:order-2 text-base font-medium"
          >
            {importing ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

