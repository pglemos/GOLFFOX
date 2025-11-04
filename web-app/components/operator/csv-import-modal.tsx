"use client"

// @ts-ignore
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
// @ts-ignore
import { Button } from "@/components/ui/button"
// @ts-ignore
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"
import { useState, useRef } from "react"
import { parseCSV, geocodeBatch, importEmployees, type EmployeeRow, type ParseResult, type ImportResult } from "@/lib/importers/employee-csv"
import operatorI18n from "@/i18n/operator.json"

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  empresaId: string
}

export function CSVImportModal({ isOpen, onClose, onSave, empresaId }: CSVImportModalProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<EmployeeRow[]>([])
  const [parseErrors, setParseErrors] = useState<Array<{ line: number; errors: string[] }>>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, stage: 'parsing' as 'parsing' | 'geocoding' | 'importing' })
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setParseErrors([])
    setPreview([])
    setImportResult(null)

    try {
      const result: ParseResult = await parseCSV(selectedFile)

      if (result.valid.length === 0) {
        toast.error("Nenhum funcionário válido encontrado no arquivo")
        return
      }

      setPreview(result.valid.slice(0, 10)) // Preview das primeiras 10 linhas
      setParseErrors(result.errors)

      if (result.errors.length > 0) {
        toast.warning(`${result.valid.length} válidos, ${result.errors.length} erros encontrados`)
      } else {
        toast.success(`${result.valid.length} funcionários encontrados no arquivo`)
      }
    } catch (error: any) {
      toast.error(`Erro ao ler arquivo: ${error.message}`)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      // 1. Parse CSV
      setImportProgress({ current: 0, total: 100, stage: 'parsing' })
      const parseResult: ParseResult = await parseCSV(file)

      if (parseResult.valid.length === 0) {
        toast.error("Nenhum funcionário válido para importar")
        setImporting(false)
        return
      }

      // 2. Geocoding em lote
      setImportProgress({ current: 0, total: parseResult.valid.length, stage: 'geocoding' })
      const addresses = parseResult.valid.map(emp => emp.endereco).filter(Boolean) as string[]
      const geocodedAddresses = await geocodeBatch(addresses, (current, total) => {
        setImportProgress({ current, total, stage: 'geocoding' })
      })

      // 3. Importar funcionários
      setImportProgress({ current: 0, total: parseResult.valid.length, stage: 'importing' })
      const result: ImportResult = await importEmployees(
        parseResult.valid,
        empresaId,
        geocodedAddresses,
        (current, total) => {
          setImportProgress({ current, total, stage: 'importing' })
        }
      )

      setImportResult(result)

      if (result.unresolvedAddresses.length > 0) {
        toast.warning(`Importação concluída: ${result.success} sucessos, ${result.errors.length} erros, ${result.unresolvedAddresses.length} endereços não resolvidos`)
      } else {
        toast.success(`Importação concluída: ${result.success} sucessos${result.errors.length > 0 ? `, ${result.errors.length} erros` : ''}`)
      }

      onSave()
    } catch (error: any) {
      console.error("Erro na importação:", error)
      toast.error(`Erro na importação: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview([])
    setParseErrors([])
    setImportProgress({ current: 0, total: 0, stage: 'parsing' })
    setImportResult(null)
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
          <DialogTitle>{operatorI18n.csv_import.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                disabled={importing}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <Upload className="h-4 w-4 mr-2" />
                {operatorI18n.csv_import.select_file}
              </Button>
              {file && (
                <span className="text-sm text-[var(--ink-muted)]">{file.name}</span>
              )}
            </div>
            <p className="text-xs text-[var(--ink-muted)]">
              Formato esperado: nome, email, telefone, cpf, endereço, centro_de_custo (separados por vírgula)
            </p>
          </div>

          {parseErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">{operatorI18n.csv_import.errors} ({parseErrors.length}):</span>
              </div>
              <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                {parseErrors.slice(0, 10).map((err, i) => (
                  <li key={i}>Linha {err.line}: {err.errors.join(', ')}</li>
                ))}
                {parseErrors.length > 10 && (
                  <li className="text-gray-500">... e mais {parseErrors.length - 10} erros</li>
                )}
              </ul>
            </div>
          )}

          {preview.length > 0 && (
            <div className="border border-[var(--border)] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">{operatorI18n.csv_import.preview} ({preview.length} primeiras linhas)</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[var(--bg-soft)]">
                    <tr>
                      <th className="text-left p-1">Nome</th>
                      <th className="text-left p-1">Email</th>
                      <th className="text-left p-1">CPF</th>
                      <th className="text-left p-1">Endereço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-[var(--border)]">
                        <td className="p-1">{row.nome}</td>
                        <td className="p-1">{row.email}</td>
                        <td className="p-1">{row.cpf || '-'}</td>
                        <td className="p-1 text-gray-500">{row.endereco ? `${row.endereco.substring(0, 30)}...` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {importProgress.stage === 'parsing' && 'Analisando CSV...'}
                  {importProgress.stage === 'geocoding' && operatorI18n.csv_import.geocoding}
                  {importProgress.stage === 'importing' && operatorI18n.csv_import.importing}
                </span>
                <span>{importProgress.current} / {importProgress.total}</span>
              </div>
              <div className="w-full bg-[var(--bg-soft)] rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {importResult && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">{operatorI18n.csv_import.success}</span>
                </div>
                <div className="text-xs text-green-600 space-y-1">
                  <p>✓ {importResult.success} funcionários importados</p>
                  {importResult.errors.length > 0 && (
                    <p className="text-red-600">✗ {importResult.errors.length} erros</p>
                  )}
                  {importResult.unresolvedAddresses.length > 0 && (
                    <p className="text-yellow-600">⚠ {importResult.unresolvedAddresses.length} {operatorI18n.csv_import.unresolved_addresses}</p>
                  )}
                </div>
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
            {importing ? operatorI18n.csv_import.importing : operatorI18n.csv_import.import}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

