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

// Importação condicional para evitar erros se módulo não existir
let operatorI18n: any = { csv_import: {} }
try {
  operatorI18n = require('@/i18n/operator.json')
} catch (err) {
  operatorI18n = {
    csv_import: {
      title: 'Importar Funcionários via CSV',
      select_file: 'Selecionar Arquivo',
      preview: 'Prévia',
      errors: 'Erros',
      geocoding: 'Geocodificando endereços...',
      importing: 'Importando...',
      success: 'Importação concluída',
      import: 'Importar',
      unresolved_addresses: 'endereços não resolvidos'
    }
  }
}

// Verificar se módulos necessários existem
let parseCSV: any = null
let geocodeBatch: any = null
let importEmployees: any = null

try {
  const csvModule = require('@/lib/importers/employee-csv')
  parseCSV = csvModule.parseCSV
  geocodeBatch = csvModule.geocodeBatch
  importEmployees = csvModule.importEmployees
} catch (err) {
  console.warn('Módulo de importação CSV não encontrado:', err)
}

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  empresaId: string
}

interface EmployeeRow {
  nome: string
  email: string
  telefone?: string
  cpf?: string
  endereco?: string
  centro_de_custo?: string
}

interface ParseResult {
  valid: EmployeeRow[]
  errors: Array<{ line: number; errors: string[] }>
}

interface ImportResult {
  success: number
  errors: Array<{ employee: string; error: string }>
  unresolvedAddresses: string[]
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

    if (!parseCSV) {
      toast.error('Funcionalidade de importação CSV não disponível. Verifique se o módulo está instalado.')
      return
    }

    setFile(selectedFile)
    setParseErrors([])
    setPreview([])
    setImportResult(null)

    try {
      const result = await parseCSV(selectedFile) as ParseResult

      if (!result || !result.valid) {
        toast.error("Erro ao processar arquivo CSV")
        return
      }

      if (result.valid.length === 0) {
        toast.error("Nenhum funcionário válido encontrado no arquivo")
        return
      }

      setPreview(result.valid.slice(0, 10)) // Preview das primeiras 10 linhas
      setParseErrors(result.errors || [])

      if (result.errors && result.errors.length > 0) {
        toast.warning(`${result.valid.length} válidos, ${result.errors.length} erros encontrados`)
      } else {
        toast.success(`${result.valid.length} funcionários encontrados no arquivo`)
      }
    } catch (error: any) {
      console.error("Erro ao ler arquivo:", error)
      toast.error(`Erro ao ler arquivo: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleImport = async () => {
    if (!file) return

    if (!parseCSV || !geocodeBatch || !importEmployees) {
      toast.error('Funcionalidade de importação CSV não disponível. Verifique se o módulo está instalado.')
      return
    }

    if (!empresaId) {
      toast.error('Empresa não selecionada')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      // 1. Parse CSV
      setImportProgress({ current: 0, total: 100, stage: 'parsing' })
      const parseResult = await parseCSV(file) as ParseResult

      if (!parseResult || parseResult.valid.length === 0) {
        toast.error("Nenhum funcionário válido para importar")
        setImporting(false)
        return
      }

      // 2. Geocoding em lote
      setImportProgress({ current: 0, total: parseResult.valid.length, stage: 'geocoding' })
      const addresses = parseResult.valid
        .map(emp => emp.endereco)
        .filter((addr): addr is string => Boolean(addr))
      
      let geocodedAddresses = new Map<string, { lat: number; lng: number } | null>()
      if (addresses.length > 0) {
        geocodedAddresses = await geocodeBatch(addresses, (current: number, total: number) => {
          setImportProgress({ current, total, stage: 'geocoding' })
        })
      }

      // 3. Importar funcionários
      setImportProgress({ current: 0, total: parseResult.valid.length, stage: 'importing' })
      const result = await importEmployees(
        parseResult.valid,
        empresaId,
        geocodedAddresses,
        (current: number, total: number) => {
          setImportProgress({ current, total, stage: 'importing' })
        }
      ) as ImportResult

      setImportResult(result)

      if (result.unresolvedAddresses && result.unresolvedAddresses.length > 0) {
        toast.warning(`Importação concluída: ${result.success} sucessos, ${result.errors?.length || 0} erros, ${result.unresolvedAddresses.length} endereços não resolvidos`)
      } else {
        toast.success(`Importação concluída: ${result.success} sucessos${result.errors && result.errors.length > 0 ? `, ${result.errors.length} erros` : ''}`)
      }

      onSave()
    } catch (error: any) {
      console.error("Erro na importação:", error)
      toast.error(`Erro na importação: ${error.message || 'Erro desconhecido'}`)
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
          <DialogTitle>{operatorI18n.csv_import?.title || 'Importar Funcionários via CSV'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!parseCSV && (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-700">
                  Módulo de importação CSV não disponível. Verifique se o módulo está instalado.
                </span>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                disabled={importing || !parseCSV}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing || !parseCSV}
              >
                <Upload className="h-4 w-4 mr-2" />
                {operatorI18n.csv_import?.select_file || 'Selecionar Arquivo'}
              </Button>
              {file && (
                <span className="text-sm text-gray-600 truncate">{file.name}</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Formato esperado: nome, email, telefone, cpf, endereço, centro_de_custo (separados por vírgula)
            </p>
          </div>

          {parseErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  {operatorI18n.csv_import?.errors || 'Erros'} ({parseErrors.length}):
                </span>
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
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">
                  {operatorI18n.csv_import?.preview || 'Prévia'} ({preview.length} primeiras linhas)
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="text-left p-1">Nome</th>
                      <th className="text-left p-1">Email</th>
                      <th className="text-left p-1">CPF</th>
                      <th className="text-left p-1">Endereço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="p-1">{row.nome}</td>
                        <td className="p-1">{row.email}</td>
                        <td className="p-1">{row.cpf || '-'}</td>
                        <td className="p-1 text-gray-500 truncate max-w-[200px]" title={row.endereco}>
                          {row.endereco ? `${row.endereco.substring(0, 30)}...` : '-'}
                        </td>
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
                  {importProgress.stage === 'geocoding' && (operatorI18n.csv_import?.geocoding || 'Geocodificando endereços...')}
                  {importProgress.stage === 'importing' && (operatorI18n.csv_import?.importing || 'Importando...')}
                </span>
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

          {importResult && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    {operatorI18n.csv_import?.success || 'Importação concluída'}
                  </span>
                </div>
                <div className="text-xs text-green-600 space-y-1">
                  <p>✓ {importResult.success} funcionários importados</p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <p className="text-red-600">✗ {importResult.errors.length} erros</p>
                  )}
                  {importResult.unresolvedAddresses && importResult.unresolvedAddresses.length > 0 && (
                    <p className="text-yellow-600">
                      ⚠ {importResult.unresolvedAddresses.length} {operatorI18n.csv_import?.unresolved_addresses || 'endereços não resolvidos'}
                    </p>
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
            disabled={!file || preview.length === 0 || importing || !parseCSV}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {importing ? (operatorI18n.csv_import?.importing || 'Importando...') : (operatorI18n.csv_import?.import || 'Importar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
